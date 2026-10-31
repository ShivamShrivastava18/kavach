"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Opening a sample shield", "Registering two portraits", "Checking the morph"];

/** One click: sample shield, two registered portraits, the sample morph checked, straight to the case. */
export function GuidedStart({ className = "", label = "See it in 60 seconds" }: { className?: string; label?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setStep(0);
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);
    const r = await fetch("/api/demo/start", { method: "POST" }).catch(() => null);
    clearInterval(ticker);
    const body = (await r?.json().catch(() => ({}))) as { caseId?: string; error?: string } | undefined;
    if (!r || !r.ok || !body?.caseId) {
      setStep(-1);
      setError(body?.error ?? "Could not start the demo. Try again.");
      return;
    }
    router.push(`/case/${body.caseId}`);
  }

  return (
    <div className={className}>
      <button type="button" onClick={start} disabled={step >= 0} className="btn-accent">
        {step >= 0 ? (
          <>
            <span className="breathe h-2 w-2 rounded-full bg-accent-ink" />
            {STEPS[step]}
          </>
        ) : (
          label
        )}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
