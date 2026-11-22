// Phase 1 FP300-only fan, kept only to prove the profile-driven fan draws identically.
import { svg, type TemplateResult } from "lit";

export const BANDS = 24;
export const BAND_M = 0.25; // each FP300 band is 0.25 m
const HALF_ANGLE = 60; // rated 120° field of view
const CX = 200;
const CY = 222;
const STEP = 8; // px per band

const pt = (r: number, a: number) => {
  const rad = (a * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)] as const;
};

const sector = (r1: number, r2: number) => {
  const [ax, ay] = pt(r2, -HALF_ANGLE);
  const [bx, by] = pt(r2, HALF_ANGLE);
  const [cx, cy] = pt(r1, HALF_ANGLE);
  const [dx, dy] = pt(r1, -HALF_ANGLE);
  return `M${ax} ${ay}A${r2} ${r2} 0 0 1 ${bx} ${by}L${cx} ${cy}A${r1} ${r1} 0 0 0 ${dx} ${dy}Z`;
};

export const mToFt = (m: number) => m * 3.28084;

/** Decode the 24-bit detection_range mask: bit i = band i (nearest first). */
export const decodeMask = (mask: number) =>
  Array.from({ length: BANDS }, (_, i) => ((mask >>> i) & 1) === 1);

export interface FanOpts {
  enabled: boolean[];
  presence: boolean;
  active?: number; // band index to glow
  lost?: boolean; // burnt orange: Blip thinks the sensor lost you
  editing?: boolean;
  selected?: number; // band picked for editing
}

export function renderFan({ enabled, presence, active, lost, editing, selected }: FanOpts): TemplateResult {
  const rings = enabled.map((on, i) => {
    const d = sector(i * STEP + 0.7, (i + 1) * STEP - 0.7);
    if (editing && i === selected)
      return svg`<path d=${d} class="sel-glow" /><path d=${d} class=${on ? "sel" : "sel sel-off"} />`;
    if (i === active && lost)
      return svg`<path d=${d} class="lost-glow" /><path d=${d} class=${on ? "lost" : "lost off-lost"} />`;
    if (!on)
      return svg`<path d=${d} class="off" />`;
    if (i === active)
      return svg`<path d=${d} class="glow3" /><path d=${d} class="glow2" /><path d=${d} class="active" />`;
    return svg`<path d=${d} class=${presence ? "on present" : "on"} />`;
  });

  const labels = [3, 7, 10, 13, 16, 20].map((ft) => {
    const r = (ft / 3.28084 / BAND_M) * STEP;
    const [x, y] = pt(r, HALF_ANGLE + 4);
    return svg`<text x=${x} y=${y + 4} class="lbl">${ft} ft</text>`;
  });

  return svg`<svg viewBox="0 0 400 244" role="img" aria-label="Sensor detection fan, 24 bands" class=${editing ? "editing" : ""}>
    ${rings}${labels}
    <circle cx=${CX} cy=${CY} r="9" class="halo" />
    <circle cx=${CX} cy=${CY} r="5" class="dot" />
    <text x=${CX} y="240" text-anchor="middle" class="lbl">sensor</text>
  </svg>`;
}

/** Encode bands back into the 24-bit mask (unsigned). */
export const encodeMask = (bands: boolean[]) =>
  bands.reduce((m, on, i) => (on ? m | (1 << i) : m), 0) >>> 0;
