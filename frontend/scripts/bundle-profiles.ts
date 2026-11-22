// Writes custom_components/blip/frontend/profiles.json after `vite build`: the bundled sensor
// profiles' match rules and entity roles, so the integration's diagnostics (Python) can tell
// which devices are Blip sensors. Generated; rebuilt by `npm run build`.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { MODES } from "../src/modes.ts";

const dir = new URL("../../profiles/", import.meta.url);
const out = new URL("../../custom_components/blip/frontend/profiles.json", import.meta.url);
const profiles = readdirSync(dir)
  .filter((f) => f.endsWith(".json") && f !== "schema.json")
  .sort()
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")))
  .filter((p) => MODES[p.mode as keyof typeof MODES])
  .map((p) => ({ id: p.id, name: p.name, integration: p.integration, mode: p.mode, match: p.match, entities: p.entities, required: MODES[p.mode as keyof typeof MODES]!.required }));
writeFileSync(out, JSON.stringify({ profiles }, null, 2) + "\n");
console.log(`wrote custom_components/blip/frontend/profiles.json (${profiles.length} profile${profiles.length === 1 ? "" : "s"})`);
