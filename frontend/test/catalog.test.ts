import { describe, expect, it } from "vitest";
import { problems, requestForm, sensorsMd, type Catalog, type ProfileLike } from "../scripts/catalog.ts";
import catalogJson from "../../catalog/sensors.json";
import fp300 from "../../profiles/aqara_fp300.json";
import sensorsFile from "../../SENSORS.md?raw";
import formFile from "../../.github/ISSUE_TEMPLATE/sensor_request.yml?raw";

const catalog = catalogJson as Catalog;
const ok = { "aqara_fp300.json": fp300 as ProfileLike };

/** A contributor's profile for an approved help-wanted model, as it should look. */
const fp1e = (over: Partial<ProfileLike> = {}): ProfileLike => ({
  id: "aqara_fp1e",
  name: "Aqara FP1E",
  manufacturer: "Aqara",
  integration: "zigbee2mqtt",
  mode: "band",
  match: { devices: [{ manufacturer: "Aqara", model: "Presence sensor FP1E" }] },
  ...over,
});
const withProfile = (p: ProfileLike, file = p.id + ".json") => ({ ...ok, [file]: p });

describe("catalog eligibility and safety", () => {
  it("the repo as committed is clean", () => expect(problems(catalog, ok)).toEqual([]));

  it("accepts a contributor profile for an approved model", () => {
    expect(problems(catalog, withProfile(fp1e()))).toEqual([]);
  });

  it("rejects a model that isn't in the catalog", () => {
    const p = fp1e({ id: "acme_x1", manufacturer: "Acme" });
    expect(problems(catalog, withProfile(p)).join()).toMatch(/isn't in the catalog. Propose/);
  });

  it("rejects a not-eligible model (FP2)", () => {
    const p = fp1e({ id: "aqara_fp2", mode: "map", integration: "matter" });
    expect(problems(catalog, withProfile(p)).join()).toMatch(/isn't eligible/);
  });

  it("rejects a profile whose id doesn't match its file", () => {
    expect(problems(catalog, withProfile(fp1e(), "something_else.json")).join()).toMatch(/"id" must be "something_else"/);
  });

  it("rejects a mode, integration or manufacturer that disagrees with the catalog", () => {
    expect(problems(catalog, withProfile(fp1e({ integration: "zha" }))).join()).toMatch(/integration "zha" isn't approved/);
    expect(problems(catalog, withProfile(fp1e({ manufacturer: "Acme" }))).join()).toMatch(/manufacturer "Acme"/);
    const cone = fp1e({ id: "aqara_p1", mode: "band" });
    expect(problems(catalog, withProfile(cone)).join()).toMatch(/mode "band" doesn't match the catalog \("cone"\)/);
  });

  it("rejects a mode Blip can't draw yet (needs maintainer code)", () => {
    const p = fp1e({ id: "aqara_p1", mode: "cone", match: { devices: [{ model: "Motion sensor P1" }] } });
    expect(problems(catalog, withProfile(p)).join()).toMatch(/can't draw "cone" mode yet/);
  });

  it("rejects a profile that would hijack FP300 devices", () => {
    const byModel = fp1e({ match: { devices: [{ manufacturer: "Aqara", model: "Presence sensor FP300" }] } });
    const byId = fp1e({ match: { devices: [{ model_id: "ps-s04d" }] } });
    expect(problems(catalog, withProfile(byModel)).join()).toMatch(/would also claim Aqara FP300/);
    expect(problems(catalog, withProfile(byId)).join()).toMatch(/would also claim Aqara FP300/);
  });

  it("rejects an FP300 profile edited so it no longer matches the FP300", () => {
    const broken = { ...fp300, match: { devices: [{ model: "Something else" }] } } as ProfileLike;
    expect(problems(catalog, { "aqara_fp300.json": broken }).join()).toMatch(/don't match Aqara FP300/);
  });
});

const allProfiles = import.meta.glob<{ id: string }>(["../../profiles/*.json", "!../../profiles/schema.json"], {
  eager: true,
  import: "default",
});

describe("generated files are in sync with the catalog", () => {
  const ids = new Set(Object.values(allProfiles).map((p) => p.id));
  it("SENSORS.md", () => expect(sensorsFile).toBe(sensorsMd(catalog, ids)));
  it("sensor request form", () => expect(formFile).toBe(requestForm(catalog, ids)));
  it("a new profile moves its model from Help wanted to Supported", () => {
    const md = sensorsMd(catalog, new Set(["aqara_fp300", "aqara_fp1e"]));
    const supported = md.split("## Help wanted")[0];
    expect(supported).toContain("| Aqara FP1E |");
    expect(requestForm(catalog, new Set(["aqara_fp300", "aqara_fp1e"]))).not.toContain("FP1E");
  });
});
