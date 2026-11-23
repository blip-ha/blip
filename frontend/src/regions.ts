import type { RegionsSpec } from "./profile";

export interface RegionCell {
  x: number;
  y: number;
}

export interface RegionDefinition {
  region_id: number;
  zones: RegionCell[];
}

export function validRegion(
  region: RegionDefinition,
  geometry: RegionsSpec
): boolean {
  if (
    !Number.isInteger(region.region_id) ||
    region.region_id < 1 ||
    region.region_id > geometry.max_regions ||
    !Array.isArray(region.zones)
  ) {
    return false;
  }

  const seen = new Set<string>();

  for (const cell of region.zones) {
    if (
      !cell ||
      !Number.isInteger(cell.x) ||
      !Number.isInteger(cell.y) ||
      cell.x < 1 ||
      cell.x > geometry.columns ||
      cell.y < 1 ||
      cell.y > geometry.rows
    ) {
      return false;
    }

    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }

  return true;
}

export function regionsForCell(
  x: number,
  y: number,
  regions: RegionDefinition[]
): number[] {
  return regions
    .filter((region) =>
      region.zones.some((cell) => cell.x === x && cell.y === y)
    )
    .map((region) => region.region_id)
    .sort((a, b) => a - b);
}
