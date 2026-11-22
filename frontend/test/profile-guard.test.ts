import { describe, expect, it } from "vitest";
import { usable } from "../src/profile";
import fp300 from "../../profiles/aqara_fp300.json";

// The app's last line of defense: a malformed profile is skipped, never crashes the panel.
describe("runtime profile guard", () => {
  it("accepts the FP300", () => expect(usable(fp300)).toBe(true));
  it.each([
    ["null", null],
    ["a string", "aqara"],
    ["unbuilt mode", { ...fp300, mode: "cone" }],
    ["no band spec", { ...fp300, band: undefined }],
    ["absurd band count", { ...fp300, band: { ...fp300.band, count: 1e9 } }],
    ["manufacturer-only match", { ...fp300, match: { devices: [{ manufacturer: "Aqara" }] } }],
    ["missing required role", { ...fp300, entities: { presence: fp300.entities.presence } }],
    ["bad angle", { ...fp300, field_of_view: { angle_deg: 9000, range_m: 6 } }],
    ["getter that throws", Object.defineProperty({ ...fp300 }, "mode", { get: () => { throw new Error("x"); } })],
  ])("rejects %s", (_, p) => expect(usable(p)).toBe(false));
});
