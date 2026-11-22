import { describe, expect, it } from "vitest";
import { fromExport, report } from "../scripts/profile-check.ts";
import type { Profile } from "../src/profile";
import fp300 from "../../profiles/aqara_fp300.json";
import exportJson from "./fixtures/fp300-export.json";

// The fixture is a real FP300 export from Home Assistant's Template page (names anonymized).
const snap = fromExport(exportJson);
const profile = fp300 as Profile;

describe("profile checker", () => {
  it("reads a Template export", () => {
    expect(Object.keys(snap.states)).toContain("number.office_presence_detection_range");
    expect(Object.values(snap.devices)[0]).toMatchObject({ manufacturer: "Aqara", model: "Presence sensor FP300", model_id: "PS-S04D" });
  });

  it("rejects something that isn't an export", () => {
    expect(() => fromExport({ hello: 1 })).toThrow(/isn't a Blip export/);
  });

  it("finds the FP300 by device model, with every role", () => {
    const r = report(profile, snap);
    expect(r.found).toBe(1);
    expect(r.text).toContain("✓ Office Presence  (matched by device model)");
    expect(r.text).toContain("track     button.office_presence_track_target_distance");
  });

  it("fails a profile whose model is wrong, and says what to add", () => {
    const wrong = { ...profile, match: { devices: [{ manufacturer: "Aqara", model: "Presence sensor FP1E" }] } };
    const r = report(wrong, snap);
    expect(r.found).toBe(0);
    expect(r.text).toContain('add: {"manufacturer":"Aqara","model":"Presence sensor FP300"} or {"model_id": "PS-S04D"}');
  });

  it("explains a missing required entity, listing what the device has", () => {
    const typo = { ...profile, entities: { ...profile.entities, presence: { domain: "binary_sensor", suffix: "_occupancy" } } };
    const r = report(typo, snap);
    expect(r.found).toBe(0);
    expect(r.text).toContain("presence: nothing like binary_sensor.*_occupancy");
    expect(r.text).toContain("binary_sensor.office_presence_pir_detection");
  });

  it("flags a mode Blip can't draw yet", () => {
    expect(report({ ...profile, mode: "cone" }, snap).text).toMatch(/can't draw "cone" mode yet/);
  });
});
