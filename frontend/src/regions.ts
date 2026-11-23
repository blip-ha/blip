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

/**
 * Parse Zigbee2MQTT Aqara FP1 configured_regions.
 * Example: "1: y1=x1-4 (4 zones)"
 */
export function parseConfiguredRegions(
  raw: string,
  geometry: RegionsSpec
): RegionDefinition[] {
  if (!raw.trim()) return [];

  const result: RegionDefinition[] = [];
  const ids = new Set<number>();

  for (const entry of raw.split(/;|\n|\|/)) {
    const match = entry.trim().match(
      /^(\d+):\s*(.+?)\s*\(\d+ zones?\)$/
    );
    if (!match) return [];

    const region_id = Number(match[1]);
    const zones: RegionCell[] = [];

    for (const part of match[2].split(/,\s*/)) {
      const cell = part.trim().match(/^y(\d+)=x(\d+)(?:-(\d+))?$/);
      if (!cell) return [];

      const y = Number(cell[1]);
      const start = Number(cell[2]);
      const end = cell[3] ? Number(cell[3]) : start;

      if (end < start || end - start >= geometry.columns) return [];

      for (let x = start; x <= end; x++) {
        zones.push({ x, y });
      }
    }

    const region = { region_id, zones };
    if (ids.has(region_id) || !validRegion(region, geometry)) return [];

    ids.add(region_id);
    result.push(region);
  }

  return result;
}
