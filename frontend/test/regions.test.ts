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

describe("FP1 Zigbee2MQTT configured regions parser", () => {
  it("parses the real FP1 region configuration", async () => {
    const { parseConfiguredRegions } = await import("../src/regions");

    expect(
      parseConfiguredRegions("1: y1=x1-4 (4 zones)", geometry)
    ).toEqual([
      {
        region_id: 1,
        zones: [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 4, y: 1 },
        ],
      },
    ]);
  });

  it.each([
    "1: y1=x1-4 (4 zones); 2: y2=x2-3 (2 zones)",
    "1: y1=x1-4 (4 zones)\n2: y2=x2-3 (2 zones)",
  ])("parses multiple configured regions: %s", async (raw) => {
    const { parseConfiguredRegions } = await import("../src/regions");
    const parsed = parseConfiguredRegions(raw, geometry);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].region_id).toBe(1);
    expect(parsed[0].zones).toHaveLength(4);
    expect(parsed[1]).toEqual({
      region_id: 2,
      zones: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
    });
  });

  it("rejects duplicate region IDs", async () => {
    const { parseConfiguredRegions } = await import("../src/regions");

    expect(parseConfiguredRegions(
      "1: y1=x1 (1 zone); 1: y2=x2 (1 zone)",
      geometry
    )).toEqual([]);
  });

  it("parses real Zigbee2MQTT multiple regions separated by pipe", async () => {
    const { parseConfiguredRegions, regionsForCell } = await import("../src/regions");

    const raw = "1: y1=x1-4 (4 zones) | 2: y7=x1-4 (4 zones)";
    const parsed = parseConfiguredRegions(raw, geometry);

    expect(parsed).toHaveLength(2);
    expect(regionsForCell(1, 1, parsed)).toEqual([1]);
    expect(regionsForCell(4, 1, parsed)).toEqual([1]);
    expect(regionsForCell(1, 7, parsed)).toEqual([2]);
    expect(regionsForCell(4, 7, parsed)).toEqual([2]);
    expect(regionsForCell(2, 4, parsed)).toEqual([]);
  });

  it("rejects invalid coordinates", async () => {
    const { parseConfiguredRegions } = await import("../src/regions");

    expect(
      parseConfiguredRegions("1: y1=x1-5 (5 zones)", geometry)
    ).toEqual([]);
  });
});
