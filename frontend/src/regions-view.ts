import { html, nothing, type TemplateResult } from "lit";
import type { RegionsSpec } from "./profile";
import { regionsForCell, type RegionDefinition } from "./regions";

export interface RegionGridOpts {
  spec: RegionsSpec;
  regions: RegionDefinition[]; // configured on the sensor
  occupied: Set<number>; // region ids the sensor reports as occupied
  live: boolean; // Aim test on: light occupied cells
}

/** Regions mode: the sensor's cell grid, labelled with configured regions, lit while aiming. */
export function renderRegionGrid({ spec, regions, occupied, live }: RegionGridOpts): TemplateResult {
  const cells = Array.from({ length: spec.columns * spec.rows }, (_, i) => {
    const x = (i % spec.columns) + 1;
    const y = Math.floor(i / spec.columns) + 1;
    const ids = regionsForCell(x, y, regions);
    const lit = live && ids.some((id) => occupied.has(id));
    const cls = ["cell", ids.length ? "in-region" : "", lit ? "occupied" : ""].filter(Boolean).join(" ");
    return html`<div
      class=${cls}
      title="X${x}, Y${y}"
      data-region-cell="X${x}Y${y}"
      data-regions=${ids.join(",")}
      data-occupied=${String(lit)}
    >
      <span>X${x} Y${y}</span>
      ${ids.length ? html`<small>Region ${ids.join(", ")}</small>` : nothing}
    </div>`;
  });

  return html`<div
    class="region-grid"
    style="--cols: ${spec.columns}"
    role="group"
    aria-label="Sensor detection grid, ${spec.columns} by ${spec.rows} cells"
  >${cells}</div>`;
}
