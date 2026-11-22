import { describe, expect, it } from "vitest";
import { aimView, pillText } from "../src/aim";

const LOST_MS = 3000;
const band = { count: 24, size_m: 0.25, encoding: "bitmask_nearest_first" as const };

const all = Array(24).fill(true);
const base = { band, lostMs: LOST_MS, aimOn: true, aimStart: 1000, now: 5000, presence: true, enabled: all };

describe("aimView", () => {
  it("waits until a reading arrives after the test started", () => {
    expect(aimView({ ...base, distance: { meters: 1, seenAt: 500 } })).toEqual({ live: false, waitedS: 4 });
    expect(aimView({ ...base }).live).toBe(false);
  });
  it("lights the band you're in: floor(m / 0.25)", () => {
    const v = aimView({ ...base, distance: { meters: 1.3, seenAt: 4900 } });
    expect(v).toMatchObject({ live: true, active: 5, lost: undefined });
  });
  it("caps at band 24", () => {
    expect(aimView({ ...base, distance: { meters: 9, seenAt: 4900 } }).active).toBe(23);
  });
  it("lost: quiet for more than 3 s", () => {
    const at = 5000 - LOST_MS - 1;
    expect(aimView({ ...base, distance: { meters: 1, seenAt: at } }).lost).toBe("quiet");
    expect(aimView({ ...base, distance: { meters: 1, seenAt: 5000 - LOST_MS } }).lost).toBeUndefined();
  });
  it("lost: presence off", () => {
    expect(aimView({ ...base, presence: false, distance: { meters: 1, seenAt: 4900 } }).lost).toBe("out");
  });
  it("lost: standing in an off band", () => {
    const enabled = all.map((_, i) => i !== 4);
    expect(aimView({ ...base, enabled, distance: { meters: 1.1, seenAt: 4900 } })).toMatchObject({ active: 4, lost: "off" });
  });
  it("aim off = nothing live", () => {
    expect(aimView({ ...base, aimOn: false, distance: { meters: 1, seenAt: 4900 } }).live).toBe(false);
  });
});

describe("pillText", () => {
  const p = { band, editing: false, draftOn: 0, pending: false, aimOn: false, known: true, onCount: 24, maxFt: 19.685, view: { live: false, waitedS: 0 } };
  it("idle shows band count and reach", () => expect(pillText(p)).toBe("24/24 bands · 19.7 ft"));
  it("editing", () => expect(pillText({ ...p, editing: true, draftOn: 10 })).toBe("Editing · 10 of 24 bands on"));
  it("pending save", () => expect(pillText({ ...p, pending: true })).toBe("Saved · waiting for sensor to confirm"));
  it("waiting", () => expect(pillText({ ...p, aimOn: true })).toBe("Waiting for sensor…"));
  it("active band in feet", () =>
    expect(pillText({ ...p, aimOn: true, view: { live: true, active: 5, waitedS: 0 } })).toBe("Band 6 · 4.1–4.9 ft"));
  it("lost", () =>
    expect(pillText({ ...p, aimOn: true, view: { live: true, active: 5, lost: "quiet", waitedS: 0 } })).toBe(
      "Lost you · keep moving to confirm",
    ));
});
