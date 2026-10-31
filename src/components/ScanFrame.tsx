"use client";

import { useEffect, useState } from "react";

const DEFAULT_STAGES = ["Storing privately", "Detecting faces", "Hashing 256 bits", "Comparing with your vault", "Mirrored pass"];

/**
 * The scan: a square frame around an image with a sweeping line, a faint grid, corner brackets and a
 * reticle, plus a ticker of what the pipeline is doing. `blur` hides the subject (the victim should never
 * have to look at the morph); leave it off for her own photo.
 */
export function ScanFrame({ src, blur = false, stages = DEFAULT_STAGES, label, className = "" }: { src?: string; blur?: boolean; stages?: string[]; label?: string; className?: string }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % stages.length), 1600);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="scan relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-raised">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" style={blur ? { filter: "blur(18px) saturate(0.6)", transform: "scale(1.08)" } : undefined} />
        ) : (
          <div className="h-full w-full bg-raised" />
        )}
        <div className="scan-grid absolute inset-0" aria-hidden="true" />
        <div className="scan-line absolute inset-x-0 h-16" aria-hidden="true" />
        <div className="scan-reticle absolute left-1/2 top-[42%] h-[38%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-[18%] border border-accent/70" aria-hidden="true" />
        {(["left-3 top-3 border-l border-t", "right-3 top-3 border-r border-t", "left-3 bottom-3 border-l border-b", "right-3 bottom-3 border-r border-b"] as const).map((c) => (
          <span key={c} className={`absolute h-5 w-5 border-accent ${c}`} aria-hidden="true" />
        ))}
        {blur && <span className="absolute bottom-3 left-3 chip border-accent/40 bg-bg/80 text-[11px]">blurred for you</span>}
      </div>
      <p className="flex items-center gap-2 font-mono text-xs text-muted" aria-live="polite">
        <span className="breathe h-1.5 w-1.5 rounded-full bg-accent" />
        {label ?? stages[stage]}
      </p>
    </div>
  );
}
