import type { HassEntity } from "./hass";

export interface RegionOccupancy {
  lastEvent: string;
  occupied: Set<number>;
}

export function updateRegionOccupancy(
  previous: RegionOccupancy | undefined,
  event: HassEntity | undefined,
  maxRegions: number
): RegionOccupancy {
  const current = previous ?? {
    lastEvent: "",
    occupied: new Set<number>(),
  };

  if (!event || !event.state || event.state === "unknown" ||
      event.state === "unavailable") return current;

  // On first observation, remember the existing event without
  // treating historical occupancy as a live reading.
  if (!previous) {
    return {
      lastEvent: event.state,
      occupied: new Set<number>(),
    };
  }

  if (current.lastEvent === event.state) return current;

  const type = event.attributes.event_type;
  const region = Number(event.attributes.region);

  if (!Number.isInteger(region) || region < 1 || region > maxRegions) {
    return current;
  }

  const active = type === "region_occupied" ||
                 type === "region_enter";
  const inactive = type === "region_unoccupied" ||
                   type === "region_leave";

  if (!active && !inactive) return current;

  const occupied = new Set(current.occupied);

  if (active) occupied.add(region);
  else occupied.delete(region);

  return {
    lastEvent: event.state,
    occupied,
  };
}
