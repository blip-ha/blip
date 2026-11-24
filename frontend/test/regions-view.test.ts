// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render } from "lit";
import { renderRegionGrid } from "../src/regions-view";

const spec = { columns: 4, rows: 7, max_regions: 10 };
const regions = [
  { region_id: 1, zones: [{ x: 1, y: 1 }, { x: 2, y: 1 }] },
  { region_id: 2, zones: [{ x: 2, y: 1 }] },
];

function draw(occupied: number[], live: boolean) {
  const host = document.createElement("div");
  render(renderRegionGrid({ spec, regions, occupied: new Set(occupied), live }), host);
  const cell = (x: number, y: number) => host.querySelector(`[data-region-cell="X${x}Y${y}"]`)!;
  return { host, cell };
}

describe("renderRegionGrid", () => {
  it("draws one cell per grid position, columns set from the profile", () => {
    const { host } = draw([], false);
    expect(host.querySelectorAll("[data-region-cell]")).toHaveLength(28);
    expect((host.querySelector(".region-grid") as HTMLElement).getAttribute("style")).toContain("--cols: 4");
  });

  it("labels cells with their configured regions", () => {
    const { cell } = draw([], false);
    expect(cell(2, 1).getAttribute("data-regions")).toBe("1,2");
    expect(cell(2, 1).classList.contains("in-region")).toBe(true);
    expect(cell(3, 1).classList.contains("in-region")).toBe(false);
  });

  it("lights only cells of occupied regions, and only while live", () => {
    const live = draw([2], true);
    expect(live.cell(2, 1).classList.contains("occupied")).toBe(true);
    expect(live.cell(1, 1).classList.contains("occupied")).toBe(false);
    const idle = draw([2], false);
    expect(idle.cell(2, 1).classList.contains("occupied")).toBe(false);
    expect(idle.cell(2, 1).getAttribute("data-occupied")).toBe("false");
  });
});
