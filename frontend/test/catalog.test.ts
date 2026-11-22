import { describe, expect, it } from "vitest";
import { statuses, claimedOption } from "../scripts/claims.ts";
import { badgeUrl, claimItems, claimForm, claimsUrl, claimUrl, HELP_END, modelItem, HELP_START, problems, readmeHelpWanted, requestForm, sensorsMd, updateReadme, whatItTakes, type Catalog, type ProfileLike } from "../scripts/catalog.ts";
import catalogJson from "../../catalog/sensors.json";
import fp300 from "../../profiles/aqara_fp300.json";

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

describe("generated files", () => {
  // Contributors don't commit generated files (they're rebuilt after merge), so these tests check
  // the generators, not the committed copies; sync-generated.yml keeps the copies on main current.
  it("SENSORS.md and the issue forms generate for the current profiles", () => {
    const ids = new Set(Object.values(allProfiles).map((p) => p.id));
    expect(sensorsMd(catalog, ids)).toContain("## Supported");
    expect(requestForm(catalog, ids)).toContain("name: Sensor request");
    expect(claimForm(catalog, ids)).toContain("name: I'm building this");
  });
  it("what it takes follows the rule: Z2M + a built mode = profile file, otherwise issue first", () => {
    const byId = Object.fromEntries(catalog.models.map((m) => [m.id, whatItTakes(m)]));
    expect(byId.aqara_fp1e).toBe("Profile file");
    expect(byId.aqara_fp1).toBe("Issue first: new Regions mode");
    expect(byId.aqara_p2).toBe("Issue first: new Cone mode, Thread/Matter");
  });
  it("a new profile moves its model from Help wanted to Supported", () => {
    const md = sensorsMd(catalog, new Set(["aqara_fp300", "aqara_fp1e"]));
    const supported = md.split("## Help wanted")[0];
    expect(supported).toContain("| Aqara FP1E |");
    expect(requestForm(catalog, new Set(["aqara_fp300", "aqara_fp1e"]))).not.toContain("FP1E");
  });
});

describe("README Help wanted line", () => {
  it("names the approved, unbuilt models and integration work on one line, and keeps the rest of the README", () => {
    const block = readmeHelpWanted(catalog, new Set(["aqara_fp300"]));
    expect(block).toContain(">FP1E, FP310, FP1, P1, High Precision, P2, FP400, plus ZHA and Thread/Matter support.<");
    expect(block).not.toContain("|");
    expect(block).not.toContain("shields.io");
    expect(block).not.toContain("FP300");
    expect(block).not.toContain("FP2 ");
    const readme = `top\n${HELP_START}\nold\n${HELP_END}\nbottom`;
    expect(updateReadme(readme, block)).toBe(`top\n${block}\nbottom`);
  });
  it("drops a sensor from the line once its profile lands", () => {
    expect(readmeHelpWanted(catalog, new Set(["aqara_fp300", "aqara_fp1e"]))).not.toContain("FP1E");
  });
  it("fails loudly if the markers are missing", () => {
    expect(() => updateReadme("no markers", "x")).toThrow(/markers/);
  });
});

describe("One-tap claim links", () => {
  const byId = (id: string) => catalog.models.find((m) => m.id === id)!;
  it("pre-fills the claim form with the sensor exactly as the dropdown lists it", () => {
    const m = byId("aqara_fp1e");
    const q = new URL(claimUrl(modelItem(m))).searchParams;
    expect(q.get("template")).toBe("sensor_claim.yml");
    expect(q.get("title")).toBe("Building: Aqara FP1E");
    expect(claimForm(catalog, new Set(["aqara_fp300"]))).toContain(JSON.stringify(q.get("sensor")));
    expect(q.get("integration")).toBe("Zigbee2MQTT");
    expect(q.get("approach")).toBe("Add a profile file.");
  });
  it("leaves integration and approach for issue-first sensors to the claimer", () => {
    const q = new URL(claimUrl(modelItem(byId("aqara_p2")))).searchParams;
    expect(q.get("integration")).toBeNull();
    expect(q.get("approach")).toBeNull();
  });
  it("finds open claims by the form's answer", () => {
    expect(decodeURIComponent(claimsUrl(modelItem(byId("aqara_fp1e"))))).toContain('label:"in progress" "Aqara FP1E (Profile file)" in:body');
  });
  it("every help-wanted row has a sign-up link", () => {
    const md = sensorsMd(catalog, new Set(["aqara_fp300"]));
    expect(md.match(/\[🙋 I'll build this\]\(/g)?.length).toBe(9);
  });
});

describe("Claim status", () => {
  const items = claimItems(catalog, new Set(["aqara_fp300"]));
  const fp1e = items.find((i) => i.id === "aqara_fp1e")!;
  const body = (option: string) => `### Sensor or work\n\n${option}\n\n### How is your sensor connected?\n\nZigbee2MQTT\n`;
  it("covers help-wanted sensors and integration work, with unique ids", () => {
    expect(items.map((i) => i.id)).toEqual(expect.arrayContaining(["aqara_fp1e", "zha", "matter"]));
    expect(items.some((i) => i.id === "aqara_fp300")).toBe(false);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
  it("integration work can be claimed: in the form, pre-filled with its integration", () => {
    const zha = items.find((i) => i.id === "zha")!;
    expect(claimForm(catalog, new Set(["aqara_fp300"]))).toContain(JSON.stringify("ZHA support (Issue first)"));
    expect(new URL(claimUrl(zha)).searchParams.get("integration")).toBe("ZHA");
    expect(new URL(claimUrl(items.find((i) => i.id === "matter")!)).searchParams.get("integration")).toBe("Thread/Matter");
  });
  it("open until someone claims it, then the first claimer", () => {
    expect(statuses(items, []).aqara_fp1e).toMatchObject({ message: "open", color: "2ea043" });
    const s = statuses(items, [
      { number: 9, user: { login: "bob" }, body: body(fp1e.option) },
      { number: 4, user: { login: "alice" }, body: body(fp1e.option) },
      { number: 5, user: { login: "carol" }, body: body("ZHA support (Issue first)") },
    ]);
    expect(s.aqara_fp1e).toMatchObject({ message: "@alice +1", color: "c2410c" });
    expect(s.zha.message).toBe("@carol");
    expect(s.aqara_fp310.message).toBe("open");
  });
  it("ignores pull requests, unknown options and odd logins", () => {
    const s = statuses(items, [
      { number: 1, user: { login: "x" }, body: body(fp1e.option), pull_request: {} },
      { number: 2, user: { login: "y" }, body: body("Aqara FP1E (anything)") },
      { number: 3, user: { login: "evil](http://x)" }, body: body("Aqara FP310 (Profile file)") },
    ]);
    expect(s.aqara_fp1e.message).toBe("open");
    expect(s.aqara_fp310.message).toBe("someone");
  });
  it("reads the dropdown answer from older claims too", () => {
    expect(claimedOption("### Sensor\n\nAqara FP1E (Profile file)\n")).toBe("Aqara FP1E (Profile file)");
    expect(claimedOption("no form here")).toBeNull();
  });
  it("every SENSORS.md row has a live badge and a sign-up link, and no wrapping extras", () => {
    const block = sensorsMd(catalog, new Set(["aqara_fp300"]));
    expect(block.match(/img\.shields\.io\/endpoint/g)?.length).toBe(items.length);
    expect(block.match(/\[🙋 I'll build this\]\(/g)?.length).toBe(items.length);
    expect(block).not.toContain("Who's on it");
    expect(decodeURIComponent(badgeUrl(fp1e))).toContain("blip-ha/blip/claims/status/aqara_fp1e.json");
  });
});
