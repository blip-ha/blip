// Catalog tool. Plain Node (type stripping), no build step.
//
//   node scripts/catalog.ts                    regenerate SENSORS.md and the issue forms
//   node scripts/catalog.ts --check            CI: fail on any schema, eligibility or safety problem
//   node scripts/catalog.ts --check-generated  also fail if the generated files are out of date
//
// Contributors only add a profile; generated files are rebuilt after merge by
// .github/workflows/sync-generated.yml, so pull requests don't need them up to date.
//
// Rules (keep the Blip app safe from a bad or hostile profile):
//   - catalog/sensors.json and every profile match their schemas
//   - every profile is for a model in the catalog that is eligible ("propose it first")
//   - profile and catalog agree on manufacturer, mode and integration
//   - the profile's mode is one Blip can draw
//   - a profile can't match another model's devices (no hijacking the FP300)

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { MODES } from "../src/modes.ts";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;

const ROOT = new URL("../../", import.meta.url);
const path = (p: string) => new URL(p, ROOT);
const readJson = (p: string) => JSON.parse(readFileSync(path(p), "utf8"));

export interface DeviceId { manufacturer?: string; model?: string; model_id?: string }
export interface CatalogModel {
  id: string; name: string; manufacturer: string; mode: string; integrations: string[];
  eligible: boolean; reason?: string; devices?: DeviceId[]; notes?: string;
}
export interface Catalog {
  models: CatalogModel[];
  integration_work: { id: string; name: string; notes?: string }[];
  not_eligible_rule: string;
}
export interface ProfileLike {
  id: string; name: string; manufacturer: string; integration: string; mode: string;
  match: { devices: DeviceId[] };
}

const INTEGRATION_NAMES: Record<string, string> = { zigbee2mqtt: "Zigbee2MQTT", zha: "ZHA", matter: "Thread/Matter" };
const MODE_NAMES: Record<string, string> = { band: "Band", cone: "Cone", map: "Map", regions: "Regions" };

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
/** Same rule as the app: a device matches if every field of the match entry equals it. */
export const deviceMatches = (device: DeviceId, m: DeviceId) =>
  (Object.keys(m) as (keyof DeviceId)[]).every((k) => same(device[k], m[k]));

/** Every eligibility and safety problem, as readable messages. Empty = all good. */
export function problems(catalog: Catalog, profiles: Record<string, ProfileLike>): string[] {
  const out: string[] = [];
  const byId = new Map(catalog.models.map((m) => [m.id, m]));
  if (byId.size !== catalog.models.length) out.push("catalog/sensors.json: model ids must be unique.");

  for (const [file, p] of Object.entries(profiles)) {
    const where = `profiles/${file}`;
    if (p.id + ".json" !== file) out.push(`${where}: "id" must be "${file.replace(/\.json$/, "")}".`);
    const model = byId.get(p.id);
    if (!model) {
      out.push(`${where}: "${p.id}" isn't in the catalog. Propose the sensor with the "New sensor proposal" issue form first.`);
      continue;
    }
    if (!model.eligible) {
      out.push(`${where}: ${model.name} isn't eligible for Blip (${model.reason}).`);
      continue;
    }
    if (!same(p.manufacturer, model.manufacturer))
      out.push(`${where}: manufacturer "${p.manufacturer}" doesn't match the catalog ("${model.manufacturer}").`);
    if (p.mode !== model.mode) out.push(`${where}: mode "${p.mode}" doesn't match the catalog ("${model.mode}").`);
    if (!model.integrations.includes(p.integration))
      out.push(`${where}: integration "${p.integration}" isn't approved for ${model.name} (${model.integrations.join(", ")}).`);
    if (!MODES[p.mode as keyof typeof MODES])
      out.push(`${where}: Blip can't draw "${p.mode}" mode yet. A new mode is app code, which only the maintainer adds.`);

    // Must match its own model when the catalog knows how that model appears in HA...
    if (model.devices?.length && !model.devices.some((d) => p.match.devices.some((m) => deviceMatches(d, m))))
      out.push(`${where}: its "match" rules don't match ${model.name} as the catalog lists it.`);
    // ...and must never match another model's devices.
    for (const other of catalog.models) {
      if (other.id === p.id) continue;
      const theirs = [...(other.devices ?? []), ...(profiles[other.id + ".json"]?.match.devices ?? [])];
      if (theirs.some((d) => p.match.devices.some((m) => deviceMatches(d, m))))
        out.push(`${where}: its "match" rules would also claim ${other.name} devices.`);
    }
  }
  return out;
}

const modelLine = (m: CatalogModel) =>
  `| ${m.name} | ${MODE_NAMES[m.mode]} | ${m.integrations.map((i) => INTEGRATION_NAMES[i]).join(", ")} | ${m.notes ?? ""} |`;

/** What a contributor has to do for a help-wanted model (the CONTRIBUTING rule). */
export function whatItTakes(m: CatalogModel): string {
  const reasons: string[] = [];
  if (!MODES[m.mode as keyof typeof MODES]) reasons.push(`new ${MODE_NAMES[m.mode]} mode`);
  if (!m.integrations.includes("zigbee2mqtt")) reasons.push(m.integrations.map((i) => INTEGRATION_NAMES[i]).join("/"));
  return reasons.length ? `Issue first: ${reasons.join(", ")}` : "Profile file";
}

const wantedLine = (m: CatalogModel) =>
  `| ${m.name} | ${MODE_NAMES[m.mode]} | ${m.integrations.map((i) => INTEGRATION_NAMES[i]).join(", ")} | **${whatItTakes(m)}** | ${m.notes ?? ""} |`;

export function sensorsMd(catalog: Catalog, profileIds: Set<string>): string {
  const supported = catalog.models.filter((m) => m.eligible && profileIds.has(m.id));
  const wanted = catalog.models.filter((m) => m.eligible && !profileIds.has(m.id));
  const no = catalog.models.filter((m) => !m.eligible);
  const head = "| Sensor | Mode | Integration | Notes |\n|---|---|---|---|";
  return `<!-- Generated from catalog/sensors.json and profiles/. Don't edit by hand: run \`npm run catalog\` in frontend/. -->

# Sensors

**Modes:** **Band** shows distance bands. **Cone** lights the whole cone on motion. **Map** shows live positions of several people. **Regions** shows a zone grid. This version of Blip draws: ${Object.keys(MODES).map((m) => `**${MODE_NAMES[m]}**`).join(", ")}.

## Supported

${head}
${supported.map(modelLine).join("\n")}

## Help wanted

Approved for Blip but not built yet. Own one of these? See [CONTRIBUTING.md](CONTRIBUTING.md), then open an **I'm building this** issue so nobody doubles up. Want one? Open a **Sensor request** issue.

**What it takes:** **Profile file** means one JSON file and no code. **Issue first** means it needs a mode Blip can't draw yet, or ZHA/Matter support: open an issue with your approach and wait for approval before writing code.

| Sensor | Mode | Integration | What it takes | Notes |
|---|---|---|---|---|
${wanted.map(wantedLine).join("\n")}

### Integration work

| Work | Notes |
|---|---|
${catalog.integration_work.map((w) => `| ${w.name} | ${w.notes ?? ""} |`).join("\n")}

## Not eligible

| Sensor | Why |
|---|---|
${no.map((m) => `| ${m.name} | ${m.reason} |`).join("\n")}
| Anything else | ${catalog.not_eligible_rule} |

Something else that detects people? Open a **New sensor proposal** issue.
`;
}

const yamlStr = (s: string) => JSON.stringify(s);

export function requestForm(catalog: Catalog, profileIds: Set<string>): string {
  const options = [
    ...catalog.models
      .filter((m) => m.eligible && !profileIds.has(m.id))
      .map((m) => `${m.name} (${MODE_NAMES[m.mode]}, ${m.integrations.map((i) => INTEGRATION_NAMES[i]).join("/")})`),
    ...catalog.integration_work.map((w) => w.name),
  ];
  return `# Generated from catalog/sensors.json. Don't edit by hand: run \`npm run catalog\` in frontend/.
name: Sensor request
description: Ask for an approved sensor that Blip doesn't support yet.
title: "Sensor request: "
labels: ["sensor request", "help wanted"]
body:
  - type: markdown
    attributes:
      value: |
        Only sensors already approved for Blip are listed. Not in the list? Use **New sensor proposal** instead.
  - type: dropdown
    id: sensor
    attributes:
      label: Sensor
      options:
${options.map((o) => `        - ${yamlStr(o)}`).join("\n")}
    validations:
      required: true
  - type: dropdown
    id: own
    attributes:
      label: Do you own this sensor?
      description: Sensors are built by people who own them and can test on their own Home Assistant.
      options:
        - "Yes, and I can help test"
        - "Yes, and I'd like to build it"
        - "No, I'm interested"
    validations:
      required: true
  - type: textarea
    id: details
    attributes:
      label: Anything else?
      description: Your Home Assistant version, how the sensor is connected, what you'd use Blip for.
`;
}

export function claimForm(catalog: Catalog, profileIds: Set<string>): string {
  const options = catalog.models
    .filter((m) => m.eligible && !profileIds.has(m.id))
    .map((m) => `${m.name} (${whatItTakes(m)})`);
  return `# Generated from catalog/sensors.json. Don't edit by hand: run \`npm run catalog\` in frontend/.
name: I'm building this
description: Claim a help-wanted sensor you own, so nobody else builds it at the same time.
title: "Building: "
labels: ["in progress"]
body:
  - type: markdown
    attributes:
      value: |
        **The rule:** new sensor on Zigbee2MQTT = add a profile file. ZHA/Matter or any change to discovery/core = describe your approach below and wait for the maintainer's approval before writing code.
  - type: dropdown
    id: sensor
    attributes:
      label: Sensor
      options:
${options.map((o) => `        - ${yamlStr(o)}`).join("\n")}
    validations:
      required: true
  - type: dropdown
    id: integration
    attributes:
      label: How is your sensor connected?
      options:
        - Zigbee2MQTT
        - ZHA
        - Thread/Matter
    validations:
      required: true
  - type: textarea
    id: approach
    attributes:
      label: Your approach
      description: For a profile file, a sentence is enough. For a new mode or ZHA/Matter, describe what you'd change and how Blip would draw it.
    validations:
      required: true
  - type: checkboxes
    id: checks
    attributes:
      label: Checks
      options:
        - label: I own this sensor and will test on my own Home Assistant, with a walk-test screen recording.
          required: true
`;
}

// ---------- CLI ----------

function main() {
  const checkGenerated = process.argv.includes("--check-generated");
  const check = checkGenerated || process.argv.includes("--check");
  const catalog = readJson("catalog/sensors.json") as Catalog;
  const files = readdirSync(path("profiles/")).filter((f) => f.endsWith(".json") && f !== "schema.json").sort();
  const profiles: Record<string, ProfileLike> = Object.fromEntries(files.map((f) => [f, readJson(`profiles/${f}`)]));

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const errors: string[] = [];
  const validateCatalog = ajv.compile(readJson("catalog/schema.json"));
  if (!validateCatalog(catalog))
    errors.push(...validateCatalog.errors.map((e: { instancePath: string; message: string }) => `catalog/sensors.json${e.instancePath}: ${e.message}`));
  const validateProfile = ajv.compile(readJson("profiles/schema.json"));
  for (const [f, p] of Object.entries(profiles))
    if (!validateProfile(p))
      errors.push(...validateProfile.errors.map((e: { instancePath: string; message: string }) => `profiles/${f}${e.instancePath}: ${e.message}`));
  if (!errors.length) errors.push(...problems(catalog, profiles));

  const ids = new Set(Object.values(profiles).map((p) => p.id));
  const outputs: [string, string][] = [
    ["SENSORS.md", sensorsMd(catalog, ids)],
    [".github/ISSUE_TEMPLATE/sensor_request.yml", requestForm(catalog, ids)],
    [".github/ISSUE_TEMPLATE/sensor_claim.yml", claimForm(catalog, ids)],
  ];
  for (const [file, content] of outputs) {
    const current = existsSync(path(file)) ? readFileSync(path(file), "utf8") : "";
    if (current === content) continue;
    if (checkGenerated) errors.push(`${file} is out of date. Run \`npm run catalog\` in frontend/ and commit it.`);
    else if (check) console.log(`${file} will be regenerated after merge.`);
    else {
      writeFileSync(path(file), content);
      console.log(`wrote ${file}`);
    }
  }

  if (errors.length) {
    for (const e of errors) console.error(check ? `::error::${e}` : `error: ${e}`);
    process.exit(1);
  }
  console.log(`catalog ok: ${catalog.models.length} models, ${files.length} profile(s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
