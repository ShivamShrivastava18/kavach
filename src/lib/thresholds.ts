/** Verdict bands. Pure module: safe for the client bundle (the hashing code is not). */
export type Verdict = "derived" | "likely" | "none";

// Calibrated on real portraits (scripts/morph-bench.ts, 24 Oct 2026): with 256-bit hashes a different person's
// face scores 0.55 to 0.61 (random is 0.50), the same face after crop, screenshot, body swap or tilt scores 0.83 or more.
export const THRESHOLDS = { derived: 0.8, likely: 0.7 } as const;

export function verdictFor(score: number): Verdict {
  if (score >= THRESHOLDS.derived) return "derived";
  if (score >= THRESHOLDS.likely) return "likely";
  return "none";
}
