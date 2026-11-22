// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/panel";
import type { BlipPanel } from "../src/panel";
import type { HassEntity, HomeAssistant } from "../src/hass";

const P = "den_fp300";
const TRACK = `button.${P}_track_target_distance`;
const RANGE = `number.${P}_detection_range`;
const MIN = 60 * 1000;

const ent = (entity_id: string, state: string, attributes: Record<string, unknown> = {}): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: new Date().toISOString(),
  last_updated: new Date().toISOString(),
});

function states(mask: number) {
  return Object.fromEntries(
    [
      ent(RANGE, `${mask}.0`, { max: 16777215 }),
      ent(`binary_sensor.${P}_presence`, "on"),
      ent(`binary_sensor.${P}_pir_detection`, "off"),
      ent(`sensor.${P}_target_distance`, "1.3"),
      ent(`sensor.${P}_battery`, "90"),
      ent(TRACK, "unknown"),
    ].map((e) => [e.entity_id, e]),
  );
}

let el: BlipPanel;
let callService: ReturnType<typeof vi.fn<HomeAssistant["callService"]>>;
const hass = (mask: number): HomeAssistant => ({ states: states(mask), callService });
const q = <T extends Element>(sel: string, i = 0) => el.shadowRoot!.querySelectorAll<T & HTMLElement>(sel)[i];
const click = async (sel: string, i = 0) => {
  q(sel, i).click();
  await el.updateComplete;
};
const presses = () => callService.mock.calls.filter(([d, s, data]) => d === "button" && s === "press" && data?.entity_id === TRACK).length;
const setMask = async (mask: number) => {
  el.hass = hass(mask);
  await el.updateComplete;
};

/** Turn band 24 off and Save (mask 8388607); the sensor hasn't confirmed it yet. */
async function saveBand24Off() {
  await click("button.editbtn");
  await click("button.chip", 23);
  await click(".edit-actions .primary");
  expect(callService).toHaveBeenLastCalledWith("number", "set_value", { entity_id: RANGE, value: 8388607 });
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] });
  callService = vi.fn<HomeAssistant["callService"]>().mockResolvedValue(undefined);
  el = document.createElement("blip-panel");
  el.hass = hass(16777215);
  document.body.append(el);
  await el.updateComplete;
});

afterEach(() => {
  el.remove();
  vi.useRealTimers();
});

describe("Track after band edits", () => {
  it("re-presses Track once the sensor confirms a Save while aiming, and restarts the 10-min re-arm", async () => {
    await click("button.switch");
    expect(presses()).toBe(1);

    await saveBand24Off();
    vi.advanceTimersByTime(4 * MIN); // sensor asleep; save still pending
    expect(presses()).toBe(1);

    await setMask(8388607); // sensor woke and reported the new mask
    expect(presses()).toBe(2);

    // The old schedule would fire at 10 min after the start (6 min from now); the restarted one
    // fires 10 min after the confirmation.
    vi.advanceTimersByTime(9 * MIN);
    expect(presses()).toBe(2);
    vi.advanceTimersByTime(1 * MIN);
    expect(presses()).toBe(3);
    vi.advanceTimersByTime(10 * MIN);
    expect(presses()).toBe(4);
  });

  it("doesn't press Track before the sensor confirms, or for an unrelated update", async () => {
    await click("button.switch");
    await saveBand24Off();
    await setMask(16777215); // still the old mask
    expect(presses()).toBe(1);
    expect(q(".pill").textContent).toBe("Saved · waiting for sensor to confirm");
  });

  it("doesn't press Track for a confirmed Save when the aim test is off", async () => {
    await saveBand24Off();
    await setMask(8388607);
    expect(presses()).toBe(0);
    expect(q(".pill").textContent).toBe("23/24 bands · 18.9 ft");
  });

  it("re-sends Track on Cancel while aiming", async () => {
    await click("button.switch");
    await click("button.editbtn");
    await click(".edit-actions .ghost", 1); // Cancel
    expect(presses()).toBe(2);
    expect(q(".edit")).toBeUndefined();
  });

  it("doesn't press Track on Cancel when the aim test is off", async () => {
    await click("button.editbtn");
    await click(".edit-actions .ghost", 1);
    expect(presses()).toBe(0);
  });

  it("keeps the normal 10-min re-arm with no edits", async () => {
    await click("button.switch");
    vi.advanceTimersByTime(10 * MIN);
    expect(presses()).toBe(2);
    await click("button.switch"); // aim off stops re-arming
    vi.advanceTimersByTime(30 * MIN);
    expect(presses()).toBe(2);
  });
});
