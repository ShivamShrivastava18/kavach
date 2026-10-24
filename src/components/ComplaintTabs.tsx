"use client";

import { useState } from "react";
import type { Drafts } from "@/lib/types";

const TABS = [
  { key: "platform", label: "Platform" },
  { key: "portal", label: "Cyber Crime Portal" },
] as const;

export function ComplaintTabs({ drafts, caseId }: { drafts: Drafts | null; caseId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("platform");
  const [copied, setCopied] = useState(false);
  const text = drafts?.[tab] ?? "";

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kavach-${caseId}-${tab}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-line p-1 text-sm">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-4 py-1.5 transition-colors ${tab === t.key ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost px-4 py-2" disabled={!drafts} onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="btn-ghost px-4 py-2" disabled={!drafts} onClick={download}>
            Download
          </button>
        </div>
      </div>
      {drafts ? (
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-raised p-5 font-sans text-sm leading-relaxed">{text}</pre>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-raised p-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton h-3.5 rounded" style={{ width: `${[92, 70, 88, 60, 95, 80, 40, 85, 55][i]}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
