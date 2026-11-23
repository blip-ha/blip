import { describe, expect, it } from "vitest";
import { regionsForCell, validRegion } from "../src/regions";
import type { RegionDefinition } from "../src/regions";

const geometry = { columns: 4, rows: 7, max_regions: 10 };

const region = (
  region_id: number,
  zones: { x: number; y: number }[]
): RegionDefinition => ({ region_id, zones });

describe("FP1 region definitions", () => {
  it("accepts a valid region", () => {
    expect(validRegion(region(1, [
      { x: 1, y: 1 },
      { x: 4, y: 7 },
    ]), geometry)).toBe(true);
  });

  it.each([0, 11, 1.5])("rejects invalid region id %s", (id) => {
    expect(validRegion(region(id, [{ x: 1, y: 1 }]), geometry)).toBe(false);
  });

  it.each([
    { x: 0, y: 1 },
    { x: 5, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 8 },
    { x: 1.5, y: 1 },
  ])("rejects invalid cell %o", (cell) => {
    expect(validRegion(region(1, [cell]), geometry)).toBe(false);
  });

  it("rejects duplicate cells within one region", () => {
    expect(validRegion(region(1, [
      { x: 2, y: 3 },
      { x: 2, y: 3 },
    ]), geometry)).toBe(false);
  });

  it("allows overlapping regions", () => {
    const regions = [
      region(1, [{ x: 2, y: 3 }]),
      region(2, [{ x: 2, y: 3 }, { x: 3, y: 3 }]),
    ];

    expect(regions.every((r) => validRegion(r, geometry))).toBe(true);
    expect(regionsForCell(2, 3, regions)).toEqual([1, 2]);
    expect(regionsForCell(3, 3, regions)).toEqual([2]);
    expect(regionsForCell(4, 7, regions)).toEqual([]);
  });
});
