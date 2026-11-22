import { describe, expect, it } from "vitest";
import { iconsModule } from "../scripts/bundle-icons.ts";
import { MARK } from "../src/sidebar-icon.ts";

describe("Sidebar icon set", () => {
  it("registers blip:mark as a two-tone 24×24 icon", async () => {
    const w = {} as { customIcons?: Record<string, { getIcon: (n: string) => Promise<unknown>; getIconList: () => Promise<unknown> }> };
    new Function("window", iconsModule())(w);
    expect(await w.customIcons!.blip.getIcon("mark")).toEqual(MARK);
    expect(await w.customIcons!.blip.getIconList()).toEqual([{ name: "mark" }]);
  });
  it("keeps other integrations' icon sets", () => {
    const w = { customIcons: { other: { getIcon: async () => ({ path: "M0 0" }) } } } as Record<string, any>;
    new Function("window", iconsModule())(w);
    expect(Object.keys(w.customIcons)).toEqual(["other", "blip"]);
  });
  it("stays inside the 24×24 box", () => {
    const nums = `${MARK.path} ${MARK.secondaryPath}`.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...nums)).toBeLessThanOrEqual(24);
  });
});
