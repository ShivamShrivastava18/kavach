"use client";

import Link from "next/link";
import { useState } from "react";
import { ScanFrame } from "./ScanFrame";
import { SIMULATIONS } from "@/lib/simulate";

type Result = { kind: string; label: string; caseId?: string; verdict?: string; score?: number; error?: string };

const VERDICT: Record<string, { text: string; cls: string }> = {
  derived: { text: "caught", cls: "border-accent text-accent" },
  likely: { text: "likely", cls: "border-muted text-fg" },
  none: { text: "missed", cls: "border-danger text-danger" },
};

/**
 * "What a harasser would do": derives six edits of a registered photo and checks each one.
 * The owner sees every edit caught, with a case for each.
 */
export function Simulator({ publicId, thumb }: { publicId: string; thumb: string }) {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/vault/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicId }) }).catch(() => null);
    const body = (await r?.json().catch(() => ({}))) as { results?: Result[]; error?: string } | undefined;
    setBusy(false);
    if (!r || !r.ok || !body?.results) {
      setError(body?.error ?? "Simulation failed. Try again.");
      return;
    }
    setResults(body.results);
  }

  const caught = results?.filter((x) => x.verdict === "derived").length ?? 0;

  return (
    <section className="mt-12 rounded-2xl border border-line p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" className="h-12 w-12 rounded-lg object-cover" />
          <div>
            <p className="text-base font-medium">What a harasser would do</p>
            <p className="text-sm text-muted">Kavach makes the usual edits of this photo and checks each one.</p>
          </div>
        </div>
        <button onClick={run} disabled={busy} className="btn-accent px-4 py-2">
          {busy ? (
            <>
              <span className="breathe h-2 w-2 rounded-full bg-accent-ink" />
              Making six edits
            </>
          ) : results ? (
            "Run again"
          ) : (
            "Simulate six edits"
          )}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {busy && <ScanFrame src={thumb} stages={SIMULATIONS.map((s) => s.label)} className="mt-5 max-w-[220px]" />}
      {results && (
        <>
          <p className="mt-5 text-sm">
            <span className="font-mono text-accent">{caught}</span> of {results.length} edits still matched your photo.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((x, i) => {
              const v = x.verdict ? VERDICT[x.verdict] : undefined;
              return (
                <li key={x.kind} className="rise flex flex-col gap-2 rounded-xl border border-line px-4 py-3" style={{ ["--i" as string]: i }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">{x.label}</span>
                    {x.caseId && v ? (
                      <Link href={`/case/${x.caseId}`} className={`chip ${v.cls} hover:border-fg`}>
                        {v.text} {Math.round((x.score ?? 0) * 100)}%
                      </Link>
                    ) : (
                      <span className="chip border-danger text-danger">{x.error ?? "failed"}</span>
                    )}
                  </div>
                  <div className="relative h-1 overflow-hidden rounded-full bg-raised">
                    <div className="absolute inset-y-0 left-[70%] w-px bg-muted/60" />
                    <div className="absolute inset-y-0 left-[80%] w-px bg-muted/60" />
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((x.score ?? 0) * 100)}%`, opacity: x.verdict === "derived" ? 0.9 : 0.5 }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">Each edit is a real case: open one to see the blurred exhibit and the complaint. Edits are derived with Cloudinary transformations; no new photo of you was created elsewhere.</p>
        </>
      )}
    </section>
  );
}
