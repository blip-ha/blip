import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import { MODES } from "../src/profile";
import schema from "../../profiles/schema.json";

const all = import.meta.glob<Record<string, unknown>>("../../profiles/*.json", { eager: true, import: "default" });
const profiles: Record<string, Record<string, unknown>> = Object.fromEntries(
  Object.entries(all)
    .map(([path, p]) => [path.split("/").pop()!, p] as const)
    .filter(([f]) => f !== "schema.json"),
);
const files = Object.keys(profiles);
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

describe("sensor profiles", () => {
  it("there is at least one", () => expect(files.length).toBeGreaterThan(0));

  it.each(files)("%s matches schema.json", (f: string) => {
    const p = profiles[f];
    const ok = validate(p);
    expect(validate.errors ?? [], JSON.stringify(validate.errors, null, 2)).toEqual([]);
    expect(ok).toBe(true);
  });

  it.each(files)("%s: id equals the file name, and Blip can draw its mode", (f: string) => {
    const p = profiles[f];
    expect(p.id + ".json").toBe(f);
    expect(MODES[p.mode as keyof typeof MODES], `mode "${p.mode}" isn't built yet`).toBeDefined();
  });

  it("ids are unique", () => {
    const ids = files.map((f) => profiles[f].id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("the schema rejects a broken profile", () => {
    const broken = { id: "Bad Id", name: "", manufacturer: "x", integration: "wifi", mode: "band", match: { devices: [] } };
    expect(validate(broken)).toBe(false);
  });
});
