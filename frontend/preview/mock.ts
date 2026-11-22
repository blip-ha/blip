// Fake Home Assistant for local development: two FP300s, one of them "sleepy".
// Query params: ?narrow=1  ?none=1 (no sensors)  ?mask=<n>  ?shots=1 (hide dev buttons)
//   ?profile=<id>  simulate a sensor built from profiles/<id>.json instead of the FP300s, to see
//                  how a new profile draws (fan, bands, aim test) before trying it in Home Assistant.
import "../src/panel";
import type { HassEntity, HomeAssistant } from "../src/hass";
import { PROFILES, type Profile, type Role } from "../src/profile";
import { fullMask } from "../src/fan";

const q = new URLSearchParams(location.search);
const iso = () => new Date().toISOString();
const ent = (entity_id: string, state: string, attributes: Record<string, unknown> = {}): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: iso(),
  last_updated: iso(),
});

const states: Record<string, HassEntity> = {};
const entities: NonNullable<HomeAssistant["entities"]> = {};
function addFp300(p: string, dev: string, mask: number) {
  for (const x of [
    ent(`number.${p}_detection_range`, String(mask), { min: 0, max: 16777215, friendly_name: `${p} Detection range` }),
    ent(`binary_sensor.${p}_presence`, "on"),
    ent(`binary_sensor.${p}_pir_detection`, "off"),
    ent(`sensor.${p}_target_distance`, "0", { unit_of_measurement: "m" }),
    ent(`sensor.${p}_battery`, "87", { unit_of_measurement: "%" }),
    ent(`button.${p}_track_target_distance`, "unknown"),
  ]) {
    states[x.entity_id] = x;
    entities[x.entity_id] = { entity_id: x.entity_id, device_id: dev };
  }
}
const devices: Record<string, { id: string; name: string; name_by_user: string | null; manufacturer?: string; model?: string; model_id?: string }> = {};
/** Entity id per role for the sensor the dev buttons drive. */
let R: Partial<Record<Role, string>> = {};
let rangeM = 6;

const wanted = q.get("profile");
const profile: Profile | undefined = wanted ? PROFILES.find((p) => p.id === wanted) : undefined;
if (wanted && !profile) console.error(`Blip preview: no usable profile "${wanted}" in profiles/ (check npm test for schema errors).`);

if (q.has("none")) {
  /* no sensors */
} else if (profile) {
  // A sensor generated from the profile: entity ids follow its role suffixes.
  const prefix = `test_${profile.id}`;
  const band = profile.band;
  const defaults: Partial<Record<Role, string>> = { presence: "on", pir: "off", distance: "0", battery: "90", track: "unknown", motion: "off" };
  for (const [role, m] of Object.entries(profile.entities) as [Role, { domain: string; suffix: string; max?: number }][]) {
    const id = `${m.domain}.${prefix}${m.suffix}`;
    const isRange = role === "range" && band;
    const x = ent(id, isRange ? String(Number(q.get("mask") ?? fullMask(band!.count))) : (defaults[role] ?? "unknown"), isRange ? { min: 0, max: m.max ?? fullMask(band!.count) } : {});
    states[id] = x;
    entities[id] = { entity_id: id, device_id: "dev_test" };
    R[role] = id;
  }
  const m0 = profile.match.devices[0];
  devices.dev_test = { id: "dev_test", name: `Test ${profile.name}`, name_by_user: null, manufacturer: m0.manufacturer, model: m0.model, model_id: m0.model_id };
  rangeM = band ? band.count * band.size_m : profile.field_of_view.range_m;
} else {
  addFp300("living_room_fp300", "dev_living", Number(q.get("mask") ?? 16777215 & ~(0b111 << 18)));
  addFp300("office_fp300", "dev_office", 16777215);
  devices.dev_living = { id: "dev_living", name: "Living Room Presence", name_by_user: "Living room", manufacturer: "Aqara", model: "Presence sensor FP300" };
  devices.dev_office = { id: "dev_office", name: "Aqara FP300", name_by_user: "Office" };
  const P = "living_room_fp300";
  R = { presence: `binary_sensor.${P}_presence`, distance: `sensor.${P}_target_distance` };
}

const panel = document.querySelector("blip-panel")!;
panel.narrow = q.get("narrow") === "1";
if (q.get("shots") === "1") document.body.classList.add("shots");

function set(id: string, state: string) {
  const old = states[id];
  states[id] = { ...old, state, last_updated: iso(), last_changed: old.state === state ? old.last_changed : iso() };
  push();
}
function push() {
  panel.hass = { states: { ...states }, entities, devices, callService } as HomeAssistant;
}

// ----- simulated sensor -----
let awake = false; // Track was pressed and the sensor woke up
let queued: { id: string; value: number }[] = []; // commands waiting for the sleepy sensor
let walking = false;
let t = 0;
let timer: number | undefined;
function stream() {
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    if (!walking) return;
    t += 1;
    const m = rangeM * (0.45 + 0.35 * Math.sin(t / 3)); // walk across most of the range and back
    if (R.distance) set(R.distance, m.toFixed(2));
  }, 1000);
}

function wake() {
  awake = true;
  for (const c of queued) set(c.id, String(c.value));
  queued = [];
  walking = true;
  if (R.presence) set(R.presence, "on");
  stream();
}

async function callService(domain: string, service: string, data: Record<string, unknown> = {}) {
  const id = String(data.entity_id);
  console.info("callService", domain, service, data);
  if (domain === "button" && service === "press") return; // queued until the sensor wakes
  if (domain === "number" && service === "set_value") {
    const value = Number(data.value);
    if (awake) setTimeout(() => set(id, String(value)), 1500);
    else queued.push({ id, value });
  }
}

const actions: Record<string, () => void> = {
  wake,
  walk: () => {
    walking = true;
    if (R.presence) set(R.presence, "on");
    stream();
  },
  still: () => (walking = false),
  leave: () => {
    walking = false;
    if (R.presence) set(R.presence, "off");
  },
  setDistance: () => undefined,
};
document.getElementById("dev")!.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).dataset.a;
  if (a) actions[a]();
});
// For automated screenshots.
Object.assign(window, {
  blipMock: { ...actions, setDistance: (m: number) => R.distance && set(R.distance, m.toFixed(2)), set },
});

push();
