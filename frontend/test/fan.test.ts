// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render } from "lit";
import { decodeMask, encodeMask, fullMask, renderFan } from "../src/fan";
import * as legacy from "./legacy-fan";
import fp300 from "../../profiles/aqara_fp300.json";

const FULL = 16777215;

describe("bitmask_nearest_first mask", () => {
  it("all 24 on = 16777215", () => {
    expect(fullMask(24)).toBe(FULL);
    expect(encodeMask(Array(24).fill(true))).toBe(FULL);
    expect(decodeMask(FULL, 24).every(Boolean)).toBe(true);
  });
  it("bit i = band i, nearest first", () => {
    expect(decodeMask(1, 24)).toEqual([true, ...Array(23).fill(false)]);
    expect(decodeMask(1 << 23, 24).filter(Boolean)).toHaveLength(1);
  });
  it("round-trips", () => {
    for (const m of [0, 1, 0b1010, 0xff00ff, FULL, 8388608]) expect(encodeMask(decodeMask(m, 24))).toBe(m);
  });
  it("other band counts", () => {
    expect(fullMask(10)).toBe(1023);
    expect(decodeMask(1023, 10).every(Boolean)).toBe(true);
    expect(fullMask(32)).toBe(0xffffffff);
    expect(encodeMask(Array(32).fill(true))).toBe(0xffffffff);
  });
});

describe("profile-driven fan draws the FP300 exactly like Phase 1", () => {
  const draw = (t: unknown) => {
    const el = document.createElement("div");
    render(t as Parameters<typeof render>[0], el);
    return el.innerHTML.replace(/<!--[^>]*-->/g, "");
  };
  const cases = [
    { enabled: decodeMask(FULL, 24), presence: false },
    { enabled: decodeMask(FULL & ~(0b111 << 18), 24), presence: false, active: 5 },
    { enabled: decodeMask(FULL & ~(1 << 4), 24), presence: true, active: 4, lost: true },
    { enabled: decodeMask(8388607, 24), presence: false, editing: true, selected: 23 },
  ];
  it.each(cases)("case %#", (c) => {
    const now = draw(renderFan({ band: fp300.band as never, angleDeg: fp300.field_of_view.angle_deg, ...c }));
    const before = draw(legacy.renderFan(c));
    expect(now).toBe(before);
  });
});
