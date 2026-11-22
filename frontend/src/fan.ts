import { svg, type TemplateResult } from "lit";
import type { BandSpec } from "./profile";

const CX = 200;
const CY = 222;
const RADIUS = 192; // px for the full band range

export const mToFt = (m: number) => m * 3.28084;

/** Decode a bitmask_nearest_first mask: bit i = band i (nearest first). */
export const decodeMask = (mask: number, count: number) =>
  Array.from({ length: count }, (_, i) => ((mask >>> i) & 1) === 1);

/** Encode bands back into the mask (unsigned). */
export const encodeMask = (bands: boolean[]) =>
  bands.reduce((m, on, i) => (on ? m | (1 << i) : m), 0) >>> 0;

/** Mask with every band on. */
export const fullMask = (count: number) => (count >= 32 ? 0xffffffff : 2 ** count - 1);

export interface FanOpts {
  band: BandSpec;
  angleDeg: number; // rated field of view
  enabled: boolean[];
  presence: boolean;
  active?: number; // band index to glow
  lost?: boolean; // burnt orange: Blip thinks the sensor lost you
  editing?: boolean;
  selected?: number; // band picked for editing
}

export function renderFan({ band, angleDeg, enabled, presence, active, lost, editing, selected }: FanOpts): TemplateResult {
  const half = angleDeg / 2;
  const step = RADIUS / band.count; // px per band
  const pt = (r: number, a: number) => {
    const rad = (a * Math.PI) / 180;
    return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)] as const;
  };
  const sector = (r1: number, r2: number) => {
    const [ax, ay] = pt(r2, -half);
    const [bx, by] = pt(r2, half);
    const [cx, cy] = pt(r1, half);
    const [dx, dy] = pt(r1, -half);
    return `M${ax} ${ay}A${r2} ${r2} 0 0 1 ${bx} ${by}L${cx} ${cy}A${r1} ${r1} 0 0 0 ${dx} ${dy}Z`;
  };

  const rings = enabled.map((on, i) => {
    const d = sector(i * step + 0.7, (i + 1) * step - 0.7);
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

  // Distance labels at each whole meter (every 2 m past 8 m), shown in rounded feet.
  const totalM = band.count * band.size_m;
  const every = totalM > 8 ? 2 : 1;
  const labels = Array.from({ length: Math.floor(totalM / every) }, (_, k) => Math.round(mToFt((k + 1) * every))).map((ft) => {
    const r = (ft / 3.28084 / band.size_m) * step;
    const [x, y] = pt(r, half + 4);
    return svg`<text x=${x} y=${y + 4} class="lbl">${ft} ft</text>`;
  });

  return svg`<svg viewBox="0 0 400 244" role="img" aria-label=${`Sensor detection fan, ${band.count} bands`} class=${editing ? "editing" : ""}>
    ${rings}${labels}
    <circle cx=${CX} cy=${CY} r="9" class="halo" />
    <circle cx=${CX} cy=${CY} r="5" class="dot" />
    <text x=${CX} y="240" text-anchor="middle" class="lbl">sensor</text>
  </svg>`;
}
