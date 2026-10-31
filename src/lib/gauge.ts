import { THRESHOLDS, type Verdict } from "./thresholds";

/** A 270-degree dial, open at the bottom, starting at 225 degrees (lower left) and sweeping clockwise. */
export const GAUGE = {
  start: 135,
  sweep: 270,
  bands: [
    { from: 0, to: THRESHOLDS.likely, key: "none" as Verdict },
    { from: THRESHOLDS.likely, to: THRESHOLDS.derived, key: "likely" as Verdict },
    { from: THRESHOLDS.derived, to: 1, key: "derived" as Verdict },
  ],
} as const;

export function bandFor(score: number): Verdict {
  if (score >= THRESHOLDS.derived) return "derived";
  if (score >= THRESHOLDS.likely) return "likely";
  return "none";
}

function point(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** SVG path for the arc from the dial's start to `score` (0..1). Empty for a zero score. */
export function arcPath(score: number, cx: number, cy: number, r: number, from = 0): string {
  const s = Math.max(0, Math.min(1, score));
  const f = Math.max(0, Math.min(s, from));
  if (s - f <= 0) return "";
  const a0 = GAUGE.start + GAUGE.sweep * f;
  const a1 = GAUGE.start + GAUGE.sweep * s;
  const [x0, y0] = point(cx, cy, r, a0);
  const [x1, y1] = point(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** Where a tick sits on the dial for a given score, for band markers. */
export function tickAt(score: number, cx: number, cy: number, rInner: number, rOuter: number): [number, number, number, number] {
  const a = GAUGE.start + GAUGE.sweep * score;
  const [x0, y0] = point(cx, cy, rInner, a);
  const [x1, y1] = point(cx, cy, rOuter, a);
  return [x0, y0, x1, y1];
}
