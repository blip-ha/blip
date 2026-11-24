// No build-tool features here: the profile checker (plain Node) runs this same code.
import type { HassEntity, HomeAssistant } from "./hass.ts";
import { MODES } from "./modes.ts";
import type { DeviceMatch, EntityMatch, Profile, Role } from "./profile.ts";

/** A sensor Blip found, the profile it matched, and its entity for each role. */
export interface Sensor {
  key: string; // stable id: device id, or entity-id prefix without a registry
  name: string;
  profile: Profile;
  entities: Partial<Record<Role, string>>;
  matchedBy: "model" | "entities";
}

type Hass = Pick<HomeAssistant, "states" | "entities" | "devices">;

const same = (a?: string | null, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export function deviceMatches(device: { manufacturer?: string | null; model?: string | null; model_id?: string | null }, m: DeviceMatch) {
  return (Object.keys(m) as (keyof DeviceMatch)[]).every((k) => same(device[k], m[k]));
}

export function entityMatches(id: string, state: HassEntity | undefined, m: EntityMatch) {
  if (!id.startsWith(m.domain + ".") || !id.endsWith(m.suffix)) return false;
  return m.max === undefined || Number(state?.attributes.max) === m.max;
}

/** Pick each role's entity from a device's entities; undefined if a required role is missing. */
function resolve(profile: Profile, ids: string[], states: Hass["states"], prefix?: string) {
  const out: Partial<Record<Role, string>> = {};
  for (const [role, m] of Object.entries(profile.entities) as [Role, EntityMatch][]) {
    const hits = ids.filter((id) => entityMatches(id, states[id], m));
    // Prefer `<domain>.<prefix><suffix>` when grouping by prefix (den vs den_2).
    out[role] = (prefix && hits.find((id) => id === `${m.domain}.${prefix}${m.suffix}`)) || hits[0];
  }
  const required = MODES[profile.mode]?.required ?? [];
  return required.every((r) => out[r]) ? out : undefined;
}

/**
 * Find supported sensors.
 * 1. Devices whose registry manufacturer/model/model_id match a profile.
 * 2. Otherwise, devices (or entity-id prefixes, without a registry) whose entities match a
 *    profile's required roles, including the range entity's `max`.
 */
export function discover(hass: Hass, allProfiles: Profile[]): Sensor[] {
  // Only profiles whose mode this version can draw; never crash on one that isn't.
  const profiles = allProfiles.filter((p) => !!MODES[p.mode]);
  const { states } = hass;
  const entities = hass.entities ?? {};
  const devices = hass.devices ?? {};

  const byDevice = new Map<string, string[]>();
  for (const e of Object.values(entities)) {
    if (!e.device_id) continue;
    const list = byDevice.get(e.device_id) ?? [];
    list.push(e.entity_id);
    byDevice.set(e.device_id, list);
  }
  // Only entities that currently have a state are usable.
  for (const [id, list] of byDevice) byDevice.set(id, list.filter((e) => states[e]));

  const found: Sensor[] = [];
  const claimed = new Set<string>();
  const deviceName = (id: string) => devices[id]?.name_by_user || devices[id]?.name || "";

  // 1. By device model.
  for (const [devId, dev] of Object.entries(devices)) {
    const profile = profiles.find((p) => p.match.devices.some((m) => deviceMatches(dev, m)));
    if (!profile) continue;
    const roles = resolve(profile, byDevice.get(devId) ?? [], states);
    if (!roles) continue;
    found.push({ key: devId, name: deviceName(devId) || profile.name, profile, entities: roles, matchedBy: "model" });
    claimed.add(devId);
  }

  // 2. By entity pattern, for anything the registry didn't identify.
  for (const profile of profiles) {
    // Presence-only profiles require a verified device-model match.
    // A generic _presence suffix is not enough to identify a sensor model.
    if (!profile.entities.range) continue;
    const anchorRole = MODES[profile.mode]!.required[0];
    const anchor = profile.entities[anchorRole]!;
    const anchors = Object.keys(states)
      .filter((id) => entityMatches(id, states[id], anchor))
      .sort();
    const prefixes = anchors.map((id) => id.slice(anchor.domain.length + 1, -anchor.suffix.length));

    anchors.forEach((anchorId, i) => {
      const devId = entities[anchorId]?.device_id ?? null;
      if (devId && claimed.has(devId)) return;
      const prefix = prefixes[i];
      let ids: string[];
      if (devId) ids = byDevice.get(devId) ?? [];
      else {
        // Never claim entities belonging to a sensor with a longer prefix ("den" vs "den_2").
        const longer = prefixes.filter((p) => p !== prefix && p.startsWith(prefix + "_"));
        ids = Object.keys(states).filter((id) => {
          const obj = id.split(".")[1] ?? "";
          return obj.startsWith(prefix + "_") && !longer.some((p) => obj.startsWith(p + "_"));
        });
      }
      const roles = resolve(profile, ids, states, devId ? undefined : prefix);
      if (!roles) return;
      const key = devId ?? prefix;
      if (found.some((s) => s.key === key)) return;
      const friendly = String(states[anchorId].attributes.friendly_name ?? "").replace(/\s*Detection range$/i, "");
      found.push({
        key,
        name: (devId && deviceName(devId)) || friendly || prefix,
        profile,
        entities: roles,
        matchedBy: "entities",
      });
      if (devId) claimed.add(devId);
    });
  }

  return found.sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key));
}
