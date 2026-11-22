import { html, nothing, svg } from "lit";

// Geometry shared by the mark (100x100 box) and the wordmark's i-dot radar.
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const large = (((a1 - a0) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

const CX = 38;
const CY = 64;
const BOWL = `M${CX - 34} 6L${CX - 34} ${CY} ${arc(CX, CY, 34, 180, 450)}`;
const BANDS = [
  [12, 1],
  [17, 0.75],
  [22, 0.55],
  [27, 0.4],
] as const;

/** The "Band b" mark: a b whose bowl holds radar bands. */
export const mark = (size: number, label = "blip") => html`<svg
  width=${Math.round((size * 80) / 106)}
  height=${size}
  viewBox="-2 0 80 106"
  role=${label ? "img" : "presentation"}
  aria-label=${label || nothing}
  aria-hidden=${label ? nothing : "true"}
>
  <g fill="none" stroke-linecap="round">
    <path d=${BOWL} stroke="#c2410c" stroke-width="8" />
    ${BANDS.map(
      ([r, op]) => svg`<path d=${arc(CX, CY, r, 270, 360)} stroke="#c084fc" stroke-opacity=${op} stroke-width="3.2" />`,
    )}
  </g>
  <circle cx=${CX} cy=${CY} r="6.5" fill="#f3e8ff" />
</svg>`;

const WAVES = [
  [8, 1],
  [12.5, 0.7],
  [17, 0.45],
] as const;

const radarDot = svg`<svg viewBox="0 0 28 28" class="radar" aria-hidden="true">
  <g fill="none" stroke-linecap="round">
    ${WAVES.map(([r, op]) => svg`<path d=${arc(6, 22, r, -85, -5)} stroke="#c084fc" stroke-opacity=${op} stroke-width="2.4" />`)}
  </g>
  <circle cx="6" cy="22" r="4.6" fill="#a78bfa" />
</svg>`;

/** "blip" with a purple b and a radar pulse as the i's dot. Size it with font-size. */
export const wordmark = () => html`<span class="wordmark" role="img" aria-label="blip"
  ><span class="b">b</span><span>l</span><span class="i">ı<span class="dot">${radarDot}</span></span
  ><span>p</span></span
>`;

export const brandStyles = `
  .wordmark { display: inline-flex; align-items: baseline; font-family: Inter, system-ui, sans-serif; font-weight: 700; line-height: 1; letter-spacing: -0.035em; color: #f4f0ff; }
  .wordmark .b { color: #c2410c; }
  .wordmark .i { position: relative; display: inline-block; margin-right: 0.03em; }
  .wordmark .dot { position: absolute; left: 50%; margin-left: -0.075em; top: -0.075em; }
  .wordmark .radar { height: 0.35em; width: auto; display: block; overflow: visible; }
`;
