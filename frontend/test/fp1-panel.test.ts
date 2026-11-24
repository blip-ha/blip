// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/panel";
import type { BlipPanel } from "../src/panel";
import type { HassEntity, HomeAssistant } from "../src/hass";

const ID = "binary_sensor.living_room_fp1_presence";

const entity = (state: string): HassEntity => ({
  entity_id: ID,
  state,
  attributes: {},
  last_changed: new Date().toISOString(),
  last_updated: new Date().toISOString(),
});

let el: BlipPanel;

const hass = (state: string): HomeAssistant => ({
  states: { [ID]: entity(state) },
  devices: {
    fp1_device: {
      id: "fp1_device",
      name: "Living Room FP1",
      manufacturer: "Aqara",
      model: "Presence sensor FP1",
      model_id: "RTCZCGQ11LM",
    },
  },
  entities: {
    [ID]: {
      entity_id: ID,
      device_id: "fp1_device",
    },
  },
  callService: vi.fn().mockResolvedValue(undefined),
} as unknown as HomeAssistant);

beforeEach(async () => {
  el = document.createElement("blip-panel");
  el.hass = hass("on");
  document.body.append(el);
  await el.updateComplete;
});

afterEach(() => {
  el.remove();
});

describe("Aqara FP1 Regions view", () => {
  it("toggles Aim test and clears previous occupancy", async () => {
    const panel = el as unknown as {
      regionTestOn: boolean;
      fp1Occupancy: Map<string, {
        lastEvent: string;
        occupied: Set<number>;
      }>;
      requestUpdate(): void;
    };

    const button = () =>
      el.shadowRoot!.querySelector(
        'button[aria-label="Aim test"]'
      ) as HTMLButtonElement;

    expect(button()).not.toBeNull();
    expect(button().getAttribute("aria-checked")).toBe("false");

    panel.fp1Occupancy.set("fp1_device", {
      lastEvent: "old-event",
      occupied: new Set([1, 2]),
    });

    button().click();
    await el.updateComplete;

    expect(panel.regionTestOn).toBe(true);
    expect(button().getAttribute("aria-checked")).toBe("true");
    expect(panel.fp1Occupancy.get("fp1_device")?.occupied.size).toBe(0);
    expect(el.shadowRoot!.textContent).toContain("Coverage test active");

    button().click();
    await el.updateComplete;

    expect(panel.regionTestOn).toBe(false);
    expect(button().getAttribute("aria-checked")).toBe("false");
  });

  it("hides occupied cells when Aim test is switched off", async () => {
    const panel = el as unknown as {
      fp1Occupancy: Map<string, {
        lastEvent: string;
        occupied: Set<number>;
      }>;
      fp1Regions: Map<string, {
        region_id: number;
        zones: { x: number; y: number }[];
      }[]>;
      requestUpdate(): void;
    };

    const button = () =>
      el.shadowRoot!.querySelector(
        'button[aria-label="Aim test"]'
      ) as HTMLButtonElement;

    const occupiedCount = () =>
      el.shadowRoot!.querySelectorAll('[data-occupied="true"]').length;

    panel.fp1Regions.set("fp1_device", [
      { region_id: 1, zones: [{ x: 1, y: 1 }] },
    ]);

    button().click();
    await el.updateComplete;

    panel.fp1Occupancy.set("fp1_device", {
      lastEvent: "new-event",
      occupied: new Set([1]),
    });
    panel.requestUpdate();
    await el.updateComplete;

    expect(occupiedCount()).toBe(1);

    button().click();
    await el.updateComplete;

    expect(button().getAttribute("aria-checked")).toBe("false");
    expect(occupiedCount()).toBe(0);
  });

  it("renders exactly 28 detection cells", () => {
    const cells = el.shadowRoot!.querySelectorAll("[data-region-cell]");
    expect(cells).toHaveLength(28);
    expect(el.shadowRoot!.textContent).toContain("4 × 7 cells");
    expect(el.shadowRoot!.textContent).toContain("Up to 10 regions");
  });

  it("renders cells in the correct X/Y order", () => {
    const cells = Array.from(
      el.shadowRoot!.querySelectorAll("[data-region-cell]")
    );
    expect(cells.map((cell) => cell.getAttribute("data-region-cell"))).toEqual(
      Array.from({ length: 28 }, (_, i) =>
        `X${(i % 4) + 1}Y${Math.floor(i / 4) + 1}`
      )
    );
  });

  it("does not claim cell occupancy from global presence", () => {
    expect(el.shadowRoot!.textContent).toContain(
      "Green cells show live region occupancy while Aim test is active."
    );
    const cells = [...el.shadowRoot!.querySelectorAll("[data-region-cell]")];
    expect(cells).toHaveLength(28);
    expect(cells.every((cell) => cell.getAttribute("data-occupied") === "false")).toBe(true);
    expect(el.shadowRoot!.querySelectorAll("[data-region-cell].occupied"))
      .toHaveLength(0);
  });

  it("renders overlapping configured regions", async () => {
    const panel = el as unknown as {
      fp1Regions: Map<string, {
        region_id: number;
        zones: { x: number; y: number }[];
      }[]>;
      requestUpdate(): void;
    };

    panel.fp1Regions.set("fp1_device", [
      { region_id: 1, zones: [{ x: 2, y: 3 }] },
      { region_id: 2, zones: [{ x: 2, y: 3 }, { x: 3, y: 3 }] },
    ]);

    panel.requestUpdate();
    await el.updateComplete;

    const cell = (x: number, y: number) =>
      el.shadowRoot!.querySelector(`[data-region-cell="X${x}Y${y}"]`);

    expect(cell(2, 3)?.getAttribute("data-regions")).toBe("1,2");
    expect(cell(2, 3)?.textContent).toContain("Region 1, 2");
    expect(cell(3, 3)?.getAttribute("data-regions")).toBe("2");
    expect(cell(4, 7)?.getAttribute("data-regions")).toBe("");
  });

  it("detects FP1 and displays presence", () => {
    expect(el.shadowRoot!.textContent).toContain("Presence detected");
    expect(el.shadowRoot!.textContent).toContain("Aqara FP1");
  });

  it("displays no presence", async () => {
    el.hass = hass("off");
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain("No presence detected");
  });

  it("displays offline state", async () => {
    el.hass = hass("unavailable");
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain("Sensor offline");
  });

  it("updates presence when Home Assistant state changes", async () => {
    el.hass = hass("off");
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain("No presence detected");

    el.hass = hass("on");
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain("Presence detected");
  });

  it("clears live region occupancy after disconnect and waits for a new event", async () => {
    const actionId = "event.living_room_fp1_action";
    const regionsId = "sensor.living_room_fp1_configured_regions";

    const makeHass = (
      presence: string,
      timestamp: string,
      eventType: string
    ): HomeAssistant => {
      const h = hass(presence);
      h.states[actionId] = {
        entity_id: actionId,
        state: timestamp,
        attributes: { event_type: eventType, region: 1 },
        last_changed: timestamp,
        last_updated: timestamp,
      };
      h.states[regionsId] = {
        entity_id: regionsId,
        state: "1: y1=x1-4 (4 zones)",
        attributes: {},
        last_changed: timestamp,
        last_updated: timestamp,
      };
      h.entities![actionId] = { entity_id: actionId, device_id: "fp1_device" };
      h.entities![regionsId] = { entity_id: regionsId, device_id: "fp1_device" };
      return h;
    };

    const occupiedCells = () =>
      el.shadowRoot!.querySelectorAll('[data-occupied="true"]').length;

    el.hass = makeHass("on", "2026-11-23T19:00:00Z", "region_unoccupied");
    await el.updateComplete;
    expect(occupiedCells()).toBe(0);

    (el.shadowRoot!.querySelector('button[aria-label="Aim test"]') as HTMLButtonElement).click();
    await el.updateComplete;

    el.hass = makeHass("on", "2026-11-23T19:01:00Z", "region_occupied");
    await el.updateComplete;
    expect(occupiedCells()).toBe(4);

    el.hass = makeHass("unavailable", "2026-11-23T19:01:00Z", "region_occupied");
    await el.updateComplete;
    expect(occupiedCells()).toBe(0);

    el.hass = makeHass("on", "2026-11-23T19:01:00Z", "region_occupied");
    await el.updateComplete;
    expect(occupiedCells()).toBe(0);

    el.hass = makeHass("on", "2026-11-23T19:02:00Z", "region_occupied");
    await el.updateComplete;
    expect(occupiedCells()).toBe(4);
  });

  it("keeps live region occupancy separate between two FP1 sensors", async () => {
    const makeHass = (livingEvent: string, bedroomEvent: string): HomeAssistant => {
      const states: Record<string, HassEntity> = {};
      const entities: Record<string, { entity_id: string; device_id: string }> = {};

      for (const [room, timestamp] of [
        ["living", livingEvent],
        ["bedroom", bedroomEvent],
      ]) {
        const deviceId = `${room}_device`;
        const presenceId = `binary_sensor.${room}_fp1_presence`;
        const actionId = `event.${room}_fp1_action`;
        const regionsId = `sensor.${room}_fp1_configured_regions`;

        for (const [id, state, attributes] of [
          [presenceId, "on", {}],
          [actionId, timestamp, { event_type: "region_occupied", region: 1 }],
          [regionsId, "1: y1=x1-4 (4 zones)", {}],
        ] as const) {
          states[id] = {
            entity_id: id,
            state,
            attributes,
            last_changed: timestamp,
            last_updated: timestamp,
          };
          entities[id] = { entity_id: id, device_id: deviceId };
        }
      }

      return {
        states,
        entities,
        devices: {
          living_device: {
            id: "living_device", name: "Living FP1",
            name_by_user: null, manufacturer: "Aqara",
            model: "Presence sensor FP1", model_id: "RTCZCGQ11LM",
          },
          bedroom_device: {
            id: "bedroom_device", name: "Bedroom FP1",
            name_by_user: null, manufacturer: "Aqara",
            model: "Presence sensor FP1", model_id: "RTCZCGQ11LM",
          },
        },
        callService: vi.fn().mockResolvedValue(undefined),
      };
    };

    const occupiedCount = () =>
      el.shadowRoot!.querySelectorAll('[data-occupied="true"]').length;

    const select = async (key: string) => {
      const picker = el.shadowRoot!.querySelector("select.picker") as HTMLSelectElement;
      picker.value = key;
      picker.dispatchEvent(new Event("change", { bubbles: true }));
      await el.updateComplete;
    };

    el.hass = makeHass("2026-11-23T19:00:00Z", "2026-11-23T19:00:00Z");
    await el.updateComplete;
    expect(occupiedCount()).toBe(0);

    el.hass = makeHass("2026-11-23T19:01:00Z", "2026-11-23T19:00:00Z");
    await el.updateComplete;

    await select("living_device");
    expect(occupiedCount()).toBe(0);

    const aimButton = () =>
      el.shadowRoot!.querySelector('button[aria-label="Aim test"]') as HTMLButtonElement;

    aimButton().click();
    await el.updateComplete;
    expect(aimButton().getAttribute("aria-checked")).toBe("true");
    expect(occupiedCount()).toBe(0);

    await select("bedroom_device");
    expect(aimButton().getAttribute("aria-checked")).toBe("false");
    expect(occupiedCount()).toBe(0);

    aimButton().click();
    await el.updateComplete;

    el.hass = makeHass("2026-11-23T19:01:00Z", "2026-11-23T19:02:00Z");
    await el.updateComplete;
    expect(occupiedCount()).toBe(4);

    await select("living_device");
    expect(aimButton().getAttribute("aria-checked")).toBe("false");
    expect(occupiedCount()).toBe(0);
  });

  it("discovers and switches between two FP1 sensors", async () => {
    const living = "binary_sensor.living_room_fp1_presence";
    const bedroom = "binary_sensor.bedroom_fp1_presence";

    const makeEntity = (id: string, state: string): HassEntity => ({
      entity_id: id,
      state,
      attributes: {},
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    });

    const multiHass = {
      states: {
        [living]: makeEntity(living, "on"),
        [bedroom]: makeEntity(bedroom, "off"),
      },
      devices: {
        living_device: {
          id: "living_device",
          name: "גלאי נפח סלון",
          manufacturer: "Aqara",
          model: "Presence sensor FP1",
          model_id: "RTCZCGQ11LM",
        },
        bedroom_device: {
          id: "bedroom_device",
          name: "גלאי נפח הורים",
          manufacturer: "Aqara",
          model: "Presence sensor FP1",
          model_id: "RTCZCGQ11LM",
        },
      },
      entities: {
        [living]: { entity_id: living, device_id: "living_device" },
        [bedroom]: { entity_id: bedroom, device_id: "bedroom_device" },
      },
      callService: vi.fn().mockResolvedValue(undefined),
    } as unknown as HomeAssistant;

    el.hass = multiHass;
    await el.updateComplete;

    const picker = el.shadowRoot!.querySelector("select.picker");
    expect(picker).not.toBeNull();

    const options = Array.from(picker!.querySelectorAll("option"));
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.textContent)).toContain("גלאי נפח סלון");
    expect(options.map((o) => o.textContent)).toContain("גלאי נפח הורים");

    (picker as HTMLSelectElement).value = "bedroom_device";
    picker!.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;

    expect(el.shadowRoot!.textContent).toContain("No presence detected");

    const updatedPicker = el.shadowRoot!.querySelector("select.picker")!;
    (updatedPicker as HTMLSelectElement).value = "living_device";
    updatedPicker.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;

    expect(el.shadowRoot!.textContent).toContain("Presence detected");
  });

  it("stops Aim test when switching FP1 sensors", async () => {
    const bedroom = "binary_sensor.bedroom_fp1_presence";

    const h = hass("on");
    h.states[bedroom] = {
      ...entity("off"),
      entity_id: bedroom,
    };
    h.devices!["bedroom_device"] = {
      id: "bedroom_device",
      name: "Bedroom FP1",
      name_by_user: null,
      manufacturer: "Aqara",
      model: "Presence sensor FP1",
      model_id: "RTCZCGQ11LM",
    };
    h.entities![bedroom] = {
      entity_id: bedroom,
      device_id: "bedroom_device",
    };

    el.hass = h;
    await el.updateComplete;

    const button = () =>
      el.shadowRoot!.querySelector(
        'button[aria-label="Aim test"]'
      ) as HTMLButtonElement;

    const picker = () =>
      el.shadowRoot!.querySelector("select.picker") as HTMLSelectElement;

    picker().value = "fp1_device";
    picker().dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;

    button().click();
    await el.updateComplete;

    expect(button().getAttribute("aria-checked")).toBe("true");

    picker().value = "bedroom_device";
    picker().dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;

    expect(button().getAttribute("aria-checked")).toBe("false");
    expect(el.shadowRoot!.textContent).not.toContain("Coverage test active");
  });

});
