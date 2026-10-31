"use client";

import { useEffect, useState } from "react";
import { arcPath, bandFor, GAUGE, tickAt } from "@/lib/gauge";

const METHOD_LABEL: Record<string, string> = {
  "cloudinary-phash": "Cloudinary pHash, whole image",
  "face-phash": "Face pHash, 256-bit",
  "face-dhash": "Face dHash, 256-bit",
  "full-phash": "Full-image pHash",
  "full-dhash": "Full-image dHash",
};

const BAND_LABEL = { none: "no match", likely: "likely", derived: "made from your photo" } as const;

/**
 * The verdict as a dial: a 270-degree arc filled to the score, with the two band lines at 70 and 80,
 * and one bar per fingerprint underneath. The fill animates up from zero on mount.
 */
export function ScoreGauge({ score, parts, mirrored }: { score: number; parts: Record<string, number>; mirrored: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(score * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const band = bandFor(score);
  const colour = band === "derived" ? "var(--accent)" : band === "likely" ? "var(--fg)" : "var(--danger)";
  const cx = 60;
  const cy = 60;
  const r = 48;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line p-5 md:flex-row md:items-center md:gap-8">
      <div className="relative mx-auto h-[120px] w-[120px] shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <path d={arcPath(1, cx, cy, r)} fill="none" stroke="var(--line)" strokeWidth="8" strokeLinecap="round" />
          {GAUGE.bands.slice(1).map((b) => {
            const [x0, y0, x1, y1] = tickAt(b.from, cx, cy, r - 9, r + 9);
            return <line key={b.key} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--muted)" strokeWidth="1.5" />;
          })}
          {shown > 0 && <path d={arcPath(shown, cx, cy, r)} fill="none" stroke={colour} strokeWidth="8" strokeLinecap="round" />}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl tracking-tighter" style={{ color: colour }}>
            {Math.round(shown * 100)}
          </span>
          <span className="label mt-0.5 text-[10px]">similarity</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium" style={{ color: colour }}>
            {BAND_LABEL[band]}
          </span>
          <span className="text-muted">
            {" "}
            · 80 and above is made from your photo, 70 to 79 likely, below 70 no match
            {mirrored ? " · matched against the mirrored image" : ""}
          </span>
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {Object.entries(parts).map(([k, v], i) => (
            <li key={k} className="rise grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs" style={{ ["--i" as string]: i + 2 }}>
              <span className="text-muted">{METHOD_LABEL[k] ?? k}</span>
              <span className="font-mono text-fg">{Math.round(v * 100)}</span>
              <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${Math.round(shown > 0 ? v * 100 : 0)}%`, background: colour, opacity: 0.85 }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
