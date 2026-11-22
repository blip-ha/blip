// Profile checker: does a sensor profile find your sensor in your Home Assistant?
// Plain Node (type stripping); uses the same discovery code as the Blip panel.
//
//   Offline (recommended, no token):
//     1. Home Assistant → Developer Tools → Template: paste scripts/ha-export.jinja,
//        set `match`, copy the result into my-sensor.json
//     2. npm run profile:check -- --states my-sensor.json ../profiles/<id>.json
//
//   Live (needs a long-lived access token; read-only, never saved):
//     BLIP_HA_TOKEN=... npm run profile:check -- --ha http://homeassistant.local:8123 ../profiles/<id>.json
//     Delete the token afterwards: Profile → Security → Long-lived access tokens.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { discover, deviceMatches, entityMatches } from "../src/discovery.ts";
import { MODES } from "../src/modes.ts";
import type { HassEntity } from "../src/hass.ts";
import type { EntityMatch, Profile, Role } from "../src/profile.ts";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;

export interface Device {
  id: string;
  name: string | null;
  name_by_user: string | null;
  manufacturer?: string | null;
  model?: string | null;
  model_id?: string | null;
}
export interface HassSnapshot {
  states: Record<string, HassEntity>;
  entities: Record<string, { entity_id: string; device_id?: string | null }>;
  devices: Record<string, Device>;
}

/** Turn the Template export (scripts/ha-export.jinja) into the shape discovery reads. */
export function fromExport(data: unknown): HassSnapshot {
  const rows = (data as { blip_export?: number; entities?: unknown[] })?.entities;
  if (!Array.isArray(rows)) throw new Error("This isn't a Blip export: run scripts/ha-export.jinja in Developer Tools → Template.");
  const snap: HassSnapshot = { states: {}, entities: {}, devices: {} };
  const now = new Date().toISOString();
  for (const r of rows as {
    entity_id: string;
    state: string;
    attributes?: Record<string, unknown>;
    device_id?: string | null;
    device?: Partial<Device>;
  }[]) {
    snap.states[r.entity_id] = { entity_id: r.entity_id, state: String(r.state), attributes: r.attributes ?? {}, last_changed: now, last_updated: now };
    snap.entities[r.entity_id] = { entity_id: r.entity_id, device_id: r.device_id ?? null };
    if (r.device_id && !snap.devices[r.device_id])
      snap.devices[r.device_id] = {
        id: r.device_id,
        name: r.device?.name ?? null,
        name_by_user: r.device?.name_by_user ?? null,
        manufacturer: r.device?.manufacturer ?? null,
        model: r.device?.model ?? null,
        model_id: r.device?.model_id ?? null,
      };
  }
  return snap;
}

/** Read-only snapshot of a live Home Assistant (REST states + registry lists over WebSocket). */
async function fromLive(url: string, token: string): Promise<HassSnapshot> {
  const base = url.replace(/\/+$/, "");
  const res = await fetch(`${base}/api/states`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Home Assistant answered ${res.status} for /api/states. Check the address and token.`);
  const list = (await res.json()) as HassEntity[];
  const ws = new WebSocket(base.replace(/^http/, "ws") + "/api/websocket");
  const ask = (() => {
    let id = 0;
    const pending = new Map<number, (r: { success: boolean; result: unknown }) => void>();
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(String(e.data));
      pending.get(msg.id)?.(msg);
    });
    return (type: string) =>
      new Promise<{ success: boolean; result: unknown }>((resolve) => {
        id += 1;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, type }));
      });
  })();
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("message", function auth(e) {
      const msg = JSON.parse(String(e.data));
      if (msg.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: token }));
      if (msg.type === "auth_ok") { ws.removeEventListener("message", auth); resolve(); }
      if (msg.type === "auth_invalid") reject(new Error("Home Assistant rejected the token."));
    });
    ws.addEventListener("error", () => reject(new Error("Couldn't open Home Assistant's WebSocket API.")));
  });
  const ents = await ask("config/entity_registry/list");
  const devs = await ask("config/device_registry/list");
  ws.close();
  if (!ents.success || !devs.success) throw new Error("Reading the registries needs an admin user's token.");
  const snap: HassSnapshot = { states: {}, entities: {}, devices: {} };
  for (const s of list) snap.states[s.entity_id] = s;
  for (const e of ents.result as { entity_id: string; device_id: string | null }[])
    snap.entities[e.entity_id] = { entity_id: e.entity_id, device_id: e.device_id };
  for (const d of devs.result as Device[]) snap.devices[d.id] = d;
  return snap;
}

const suggest = (d: Device) =>
  JSON.stringify(Object.fromEntries(Object.entries({ manufacturer: d.manufacturer, model: d.model }).filter(([, v]) => v))) +
  (d.model_id ? ` or {"model_id": "${d.model_id}"}` : "");

const show = (m: EntityMatch) => `${m.domain}.*${m.suffix}${m.max !== undefined ? ` (max ${m.max})` : ""}`;

/** Human-readable report; `found` counts sensors matched by device model (what a profile must do). */
export function report(profile: Profile, snap: HassSnapshot): { found: number; text: string } {
  const out: string[] = [];
  const say = (s = "") => out.push(s);
  const sensors = discover(snap, [profile]);
  const required = MODES[profile.mode]?.required ?? [];
  say(`Profile ${profile.id} (${profile.name}, ${profile.mode} mode)`);
  if (!MODES[profile.mode]) say(`  ! Blip can't draw "${profile.mode}" mode yet; this needs maintainer code first.`);
  say();

  if (sensors.length) {
    say(`Found ${sensors.length} sensor${sensors.length > 1 ? "s" : ""}:`);
    for (const s of sensors) {
      say(`  ✓ ${s.name}  (matched by ${s.matchedBy === "model" ? "device model" : "entity names only"})`);
      for (const [role, m] of Object.entries(profile.entities) as [Role, EntityMatch][]) {
        const id = s.entities[role];
        say(`      ${role.padEnd(9)} ${id ?? `— not found (looked for ${show(m)})${required.includes(role) ? "" : ", optional"}`}`);
      }
      if (s.matchedBy === "entities") {
        const d = snap.devices[s.key];
        say(`      ✗ "match.devices" doesn't name this device; Blip only found it by entity names.`);
        if (d) say(`        If it's your sensor, add: ${suggest(d)}`);
      }
    }
  } else say("No sensor found with this profile.");

  // Explain near misses: devices the match rules name, or that look like the sensor, but weren't found.
  const found = new Set(sensors.map((s) => s.key));
  const byDevice = new Map<string, string[]>();
  for (const e of Object.values(snap.entities))
    if (e.device_id && snap.states[e.entity_id]) byDevice.set(e.device_id, [...(byDevice.get(e.device_id) ?? []), e.entity_id]);
  const misses = Object.values(snap.devices).filter((d) => !found.has(d.id));
  const modelMatched = misses.filter((d) => profile.match.devices.some((m) => deviceMatches(d, m)));
  const lookalikes = misses.filter(
    (d) => !modelMatched.includes(d) && (byDevice.get(d.id) ?? []).some((id) => Object.values(profile.entities).some((m) => m && entityMatches(id, snap.states[id], m))),
  );
  for (const d of modelMatched) {
    say();
    say(`✗ ${d.name_by_user || d.name}: its model matches, but a required entity is missing:`);
    for (const role of required) {
      const m = profile.entities[role]!;
      if ((byDevice.get(d.id) ?? []).some((id) => entityMatches(id, snap.states[id], m))) continue;
      const near = (byDevice.get(d.id) ?? []).filter((id) => id.startsWith(m.domain + "."));
      say(`    ${role}: nothing like ${show(m)}. ${m.domain} entities on this device: ${near.join(", ") || "none"}`);
    }
  }
  for (const d of lookalikes) {
    say();
    say(`? ${d.name_by_user || d.name} has entities this profile looks for, but its model isn't in "match.devices".`);
    say(`    If it's your sensor, add: ${suggest(d)}`);
  }
  return { found: sensors.filter((s) => s.matchedBy === "model").length, text: out.join("\n") };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args.splice(i, 2)[1] : undefined;
  };
  const statesFile = opt("--states");
  const haUrl = opt("--ha");
  const profilePath = args[0];
  if (!profilePath || (!statesFile && !haUrl)) {
    console.error("Usage: npm run profile:check -- --states my-sensor.json ../profiles/<id>.json\n   or: BLIP_HA_TOKEN=... npm run profile:check -- --ha http://homeassistant.local:8123 ../profiles/<id>.json");
    process.exit(2);
  }
  const profile = JSON.parse(readFileSync(profilePath, "utf8")) as Profile;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(JSON.parse(readFileSync(new URL("../../profiles/schema.json", import.meta.url), "utf8")));
  if (!validate(profile)) {
    console.error(`${profilePath} doesn't match profiles/schema.json:`);
    for (const e of validate.errors) console.error(`  ${e.instancePath || "(top)"}: ${e.message}`);
    process.exit(1);
  }
  let snap: HassSnapshot;
  if (statesFile) snap = fromExport(JSON.parse(readFileSync(statesFile, "utf8")));
  else {
    const token = process.env.BLIP_HA_TOKEN;
    if (!token) {
      console.error("Set BLIP_HA_TOKEN to a long-lived access token (it's read once and never saved), or use --states.");
      process.exit(2);
    }
    snap = await fromLive(haUrl!, token);
  }
  const { found, text } = report(profile, snap);
  console.log(text);
  process.exit(found ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
