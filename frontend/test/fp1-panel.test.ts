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
      "Grid preview only — cell occupancy is not available."
    );
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

});
