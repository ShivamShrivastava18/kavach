"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  { key: "vault", label: "Registered", detail: "two sample portraits, fingerprinted" },
  { key: "case", label: "Checked", detail: "the sample morph, proven and blurred" },
  { key: "complaint", label: "Complaint", detail: "written by Gemma 4, law templated" },
] as const;

/** Shown on a sample shield: where the judge is in the three-step story and what to try next. */
export function GuideStrip({ step }: { step: "vault" | "case" | "complaint" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const active = STEPS.findIndex((s) => s.key === step);

  async function deleteSample() {
    setBusy(true);
    await fetch("/api/profile?purge=1", { method: "DELETE" }).catch(() => null);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="rise mb-8 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 md:flex-row md:items-center md:justify-between" style={{ ["--i" as string]: 0 }}>
      <div>
        <p className="label text-accent">Sample shield</p>
        <ol className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {STEPS.map((s, i) => (
            <li key={s.key} className={`flex items-center gap-2 ${i <= active ? "text-fg" : "text-muted"}`}>
              <span className={`font-mono text-xs ${i <= active ? "text-accent" : ""}`}>0{i + 1}</span>
              <span className="font-medium">{s.label}</span>
              <span className="hidden text-muted sm:inline">{s.detail}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/vault" className="btn-ghost px-4 py-2">
          Try it on your own photo
        </Link>
        <button onClick={deleteSample} disabled={busy} className="btn-ghost px-4 py-2 text-muted">
          {busy ? "Deleting" : "Delete this sample"}
        </button>
      </div>
    </div>
  );
}
