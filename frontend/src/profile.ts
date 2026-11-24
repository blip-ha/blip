// Sensor profiles: one JSON file per model in /profiles, bundled at build time.

import { MODES, type Mode, type Role } from "./modes";

export { MODES, type Mode, type Role };

export interface EntityMatch {
  domain: string;
  suffix: string;
  max?: number;
}

export interface DeviceMatch {
  manufacturer?: string;
  model?: string;
  model_id?: string;
}

export interface BandSpec {
  count: number;
  size_m: number;
  encoding: "bitmask_nearest_first";
}

export interface RegionsSpec {
  columns: number;
  rows: number;
  max_regions: number;
}

export interface Profile {
  id: string;
  name: string;
  manufacturer: string;
  integration: "zigbee2mqtt" | "zha" | "matter";
  mode: Mode;
  match: { devices: DeviceMatch[] };
  entities: Partial<Record<Role, EntityMatch>>;
  field_of_view: { angle_deg: number; range_m: number };
  band?: BandSpec;
  regions?: RegionsSpec;
  behavior: { sleepy: boolean; track_rearm_min?: number; lost_after_s?: number };
}

export const DEFAULT_REARM_MIN = 10;
export const DEFAULT_LOST_S = 3;

const files = import.meta.glob<Profile>(["../../profiles/*.json", "!../../profiles/schema.json"], { eager: true, import: "default" });

/**
 * Defense in depth: CI validates every profile against schema.json, but a profile that is
 * malformed anyway is skipped here, so it can never break Blip for other sensors.
 */
export function usable(p: unknown): p is Profile {
  try {
    const x = p as Profile;
    if (!x || typeof x.id !== "string" || typeof x.name !== "string") return false;
    const mode = MODES[x.mode];
    if (!mode || !x.entities || !x.match?.devices?.length) return false;
    if (!x.match.devices.every((m) => m && (m.model || m.model_id))) return false;
    if (!mode.required.every((r) => x.entities[r]?.domain && x.entities[r]?.suffix)) return false;
    if (!(x.field_of_view?.angle_deg > 0 && x.field_of_view.angle_deg <= 180)) return false;
    if (x.mode === "band") {
      const b = x.band;
      if (!b || !Number.isInteger(b.count) || b.count < 1 || b.count > 32 || !(b.size_m > 0)) return false;
      if (b.encoding !== "bitmask_nearest_first") return false;
    }
    if (x.mode === "regions") {
      const r = x.regions;
      if (!r) return false;
      if (![r.columns, r.rows, r.max_regions].every(
        (n) => Number.isInteger(n) && n >= 1 && n <= 32
      )) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Every bundled profile Blip can use, sorted by name. */
export const PROFILES: Profile[] = Object.values(files)
  .filter((p) => {
    const ok = usable(p);
    if (!ok) console.warn("Blip: skipping an invalid sensor profile", (p as Profile)?.id);
    return ok;
  })
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
