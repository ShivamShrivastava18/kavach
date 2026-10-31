"use client";

import Link from "next/link";
import { useState } from "react";
import { GuidedStart } from "./GuidedStart";
import { ScanFrame } from "./ScanFrame";
import { ShieldMark } from "./ShieldMark";
import { TRUST } from "./trust";

/** The home hero: copy on the left; on the right the shield mark, replaced by the scan while the guided demo runs. */
export function Hero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  const [scanning, setScanning] = useState<string | null>(null);
  return (
    <section className="grid grid-cols-1 gap-10 md:grid-cols-[3fr_2fr] md:gap-16">
      <div>
        <p className="rise label" style={{ ["--i" as string]: 0 }}>
          {eyebrow}
        </p>
        <h1 className="rise mt-4 max-w-[14ch] text-4xl font-semibold tracking-tighter leading-[1.02] md:text-6xl" style={{ ["--i" as string]: 1 }}>
          {title}
        </h1>
        <p className="rise mt-6 max-w-[58ch] text-base leading-relaxed text-muted md:text-lg" style={{ ["--i" as string]: 2 }}>
          {body}
        </p>
        <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ ["--i" as string]: 3 }}>
          <GuidedStart onScanning={setScanning} />
          <Link href="/vault" className="btn-ghost">
            Raise your shield
          </Link>
        </div>
        <p className="rise mt-3 text-xs text-muted" style={{ ["--i" as string]: 3 }}>
          Sample data only. No upload, nothing of yours is stored.{" "}
          <Link href="/check" className="underline decoration-line underline-offset-4 hover:text-fg">
            Already have the image?
          </Link>
        </p>
        <ul className="rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted" style={{ ["--i" as string]: 4 }}>
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        {scanning && <ScanFrame src="/demo/sample-morph.png" blur label={scanning} className="rise mt-6 max-w-[240px] md:hidden" />}
      </div>
      <div className="rise relative hidden min-h-[320px] md:block" style={{ ["--i" as string]: 2 }}>
        {scanning ? (
          <ScanFrame src="/demo/sample-morph.png" blur label={scanning} className="rise absolute right-0 top-2 w-[300px]" />
        ) : (
          <>
            <div className="absolute -right-6 top-6 h-64 w-64 rounded-full border border-line" />
            <div className="absolute right-10 top-24 h-40 w-40 rounded-full border border-accent/30" />
            <ShieldMark className="absolute right-24 top-32 h-24 w-24 text-accent" />
          </>
        )}
      </div>
    </section>
  );
}
