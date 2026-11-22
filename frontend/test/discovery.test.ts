import { describe, expect, it } from "vitest";
import { discover } from "../src/discovery";
import { PROFILES, type Profile } from "../src/profile";
import type { HassEntity } from "../src/hass";

const e = (entity_id: string, state = "on", attributes: Record<string, unknown> = {}): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: "2026-11-22T00:00:00Z",
  last_updated: "2026-11-22T00:00:00Z",
});
const states = (...list: HassEntity[]) => Object.fromEntries(list.map((x) => [x.entity_id, x]));

// Shaped like a real Zigbee2MQTT FP300: some entities use the IEEE address, not the name.
const fp300 = (p: string) => [
  e(`number.${p}_detection_range`, "16777215", { max: 16777215, friendly_name: `${p} Detection range` }),
  e(`binary_sensor.${p}_presence`),
  e(`binary_sensor.${p}_pir_detection`, "off"),
  e(`sensor.${p}_target_distance`, "1.2"),
  e(`sensor.${p}_battery`, "88"),
  e(`button.${p}_track_target_distance`, "unknown"),
  e(`sensor.0x0000_${p}_linkquality`, "120"),
];
const registry = (s: Record<string, HassEntity>, dev: string) =>
  Object.fromEntries(Object.keys(s).map((id) => [id, { entity_id: id, device_id: dev }]));

const FP300_DEVICE = { id: "dev1", name: "Office Presence", name_by_user: null, manufacturer: "Aqara", model: "Presence sensor FP300" };

describe("discover", () => {
  it("ships the FP300 profile", () => {
    expect(PROFILES.map((p) => p.id)).toContain("aqara_fp300");
  });

  it("matches by device model and finds every role", () => {
    const s = states(...fp300("office_presence"));
    const [x, ...rest] = discover({ states: s, entities: registry(s, "dev1"), devices: { dev1: FP300_DEVICE } });
    expect(rest).toHaveLength(0);
    expect(x.matchedBy).toBe("model");
    expect(x.profile.id).toBe("aqara_fp300");
    expect(x.name).toBe("Office Presence");
    expect(x.entities).toEqual({
      range: "number.office_presence_detection_range",
      presence: "binary_sensor.office_presence_presence",
      pir: "binary_sensor.office_presence_pir_detection",
      distance: "sensor.office_presence_target_distance",
      battery: "sensor.office_presence_battery",
      track: "button.office_presence_track_target_distance",
    });
  });

  it("matches by model_id, case-insensitively, and prefers the user's device name", () => {
    const s = states(...fp300("x"));
    const [x] = discover({
      states: s,
      entities: registry(s, "d"),
      devices: { d: { id: "d", name: "x", name_by_user: "Office", model_id: "ps-s04d" } },
    });
    expect([x.matchedBy, x.name]).toEqual(["model", "Office"]);
  });

  it("falls back to entity patterns when the registry has no model", () => {
    const s = states(...fp300("den"));
    const [x] = discover({ states: s, entities: registry(s, "d"), devices: { d: { id: "d", name: "Den", name_by_user: null } } });
    expect([x.matchedBy, x.key, x.name]).toEqual(["entities", "d", "Den"]);
  });

  it("falls back to entity-id prefixes with no registry at all", () => {
    const [x] = discover({ states: states(...fp300("office")) });
    expect([x.matchedBy, x.key, x.name]).toEqual(["entities", "office", "office"]);
    expect(x.entities.track).toBe("button.office_track_target_distance");
  });

  it("doesn't mix up sensors whose prefixes overlap", () => {
    const list = discover({ states: states(...fp300("den"), ...fp300("den_2")) });
    const den = list.find((x) => x.key === "den")!;
    expect(den.entities.presence).toBe("binary_sensor.den_presence");
    expect(den.entities.track).toBe("button.den_track_target_distance");
    expect(list.find((x) => x.key === "den_2")!.entities.presence).toBe("binary_sensor.den_2_presence");
  });

  it("skips a matched device that's missing a required role", () => {
    const s = states(...fp300("x").filter((x) => !x.entity_id.endsWith("_presence")));
    expect(discover({ states: s, entities: registry(s, "dev1"), devices: { dev1: FP300_DEVICE } })).toEqual([]);
  });

  it("ignores range entities that aren't a 24-band mask", () => {
    expect(discover({ states: states(e("number.fp1e_detection_range", "6", { max: 6 })) })).toEqual([]);
  });

  it("adding a sensor is just a new profile: a pretend 10-band sensor works with no code change", () => {
    const pretend: Profile = {
      id: "acme_ten_band",
      name: "Acme Ten Band",
      manufacturer: "Acme",
      integration: "zigbee2mqtt",
      mode: "band",
      match: { devices: [{ manufacturer: "Acme", model: "TB-10" }] },
      entities: {
        range: { domain: "number", suffix: "_zones", max: 1023 },
        presence: { domain: "binary_sensor", suffix: "_occupancy" },
      },
      field_of_view: { angle_deg: 90, range_m: 5 },
      band: { count: 10, size_m: 0.5, encoding: "bitmask_nearest_first" },
      behavior: { sleepy: false },
    };
    const s = states(e("number.hall_zones", "1023", { max: 1023 }), e("binary_sensor.hall_occupancy"), ...fp300("office"));
    const entities = {
      ...registry(states(e("number.hall_zones"), e("binary_sensor.hall_occupancy")), "acme"),
      ...registry(states(...fp300("office")), "aq"),
    };
    const devices = {
      acme: { id: "acme", name: "Hall", name_by_user: null, manufacturer: "Acme", model: "TB-10" },
      aq: { ...FP300_DEVICE, id: "aq", name: "Office" },
    };
    const list = discover({ states: s, entities, devices }, [...PROFILES, pretend]);
    expect(list.map((x) => [x.name, x.profile.id, x.matchedBy])).toEqual([
      ["Hall", "acme_ten_band", "model"],
      ["Office", "aqara_fp300", "model"],
    ]);
  });
});
