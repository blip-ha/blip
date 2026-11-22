// Fake Home Assistant for local development: two FP300s, one of them "sleepy".
// Query params: ?narrow=1  ?none=1 (no sensors)  ?mask=<n>  ?shots=1 (hide dev buttons)
import "../src/panel";
import type { HassEntity, HomeAssistant } from "../src/hass";

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
if (!q.has("none")) {
  addFp300("living_room_fp300", "dev_living", Number(q.get("mask") ?? 16777215 & ~(0b111 << 18)));
  addFp300("office_fp300", "dev_office", 16777215);
}
const devices = {
  dev_living: { id: "dev_living", name: "Living Room Presence", name_by_user: "Living room", manufacturer: "Aqara", model: "Presence sensor FP300" },
  dev_office: { id: "dev_office", name: "Aqara FP300", name_by_user: "Office" },
};

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
const P = "living_room_fp300";

function stream() {
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    if (!walking) return;
    t += 1;
    const m = 2.6 + 2.1 * Math.sin(t / 3); // 0.5 m .. 4.7 m and back
    set(`sensor.${P}_target_distance`, m.toFixed(2));
  }, 1000);
}

function wake() {
  awake = true;
  for (const c of queued) set(c.id, String(c.value));
  queued = [];
  walking = true;
  set(`binary_sensor.${P}_presence`, "on");
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
    set(`binary_sensor.${P}_presence`, "on");
    stream();
  },
  still: () => (walking = false),
  leave: () => {
    walking = false;
    set(`binary_sensor.${P}_presence`, "off");
  },
  setDistance: () => undefined,
};
document.getElementById("dev")!.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).dataset.a;
  if (a) actions[a]();
});
// For automated screenshots.
Object.assign(window, {
  blipMock: { ...actions, setDistance: (m: number) => set(`sensor.${P}_target_distance`, m.toFixed(2)), set },
});

push();
