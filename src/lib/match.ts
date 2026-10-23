import { similarity, type Fingerprint } from "./fingerprint";

export type PhotoPrints = {
  cldPhash?: string;
  full: Fingerprint;
  fullMirror: Fingerprint;
  face?: Fingerprint;
  faceMirror?: Fingerprint;
};

export type Verdict = "derived" | "likely" | "none";

export type MatchScore = { score: number; parts: Record<string, number>; mirrored: boolean };

export type MatchResult = {
  verdict: Verdict;
  score: number;
  bestIndex: number;
  parts: Record<string, number>;
  mirrored: boolean;
  methods: string[];
};

export const THRESHOLDS = { derived: 0.8, likely: 0.6 } as const;

type Side = { cldPhash?: string; full: Fingerprint; face?: Fingerprint };

function scoreSides(s: Side, c: Side): { score: number; parts: Record<string, number> } {
  const parts: Record<string, number> = {};
  if (s.face && c.face) {
    const cld = s.cldPhash && c.cldPhash ? similarity(s.cldPhash, c.cldPhash) : similarity(s.full.phash, c.full.phash);
    parts["cloudinary-phash"] = cld;
    parts["face-phash"] = similarity(s.face.phash, c.face.phash);
    parts["face-dhash"] = similarity(s.face.dhash, c.face.dhash);
    return { score: 0.4 * cld + 0.35 * parts["face-phash"] + 0.25 * parts["face-dhash"], parts };
  }
  parts["full-phash"] = similarity(s.full.phash, c.full.phash);
  parts["full-dhash"] = similarity(s.full.dhash, c.full.dhash);
  return { score: 0.6 * parts["full-phash"] + 0.4 * parts["full-dhash"], parts };
}

export function scorePair(suspect: PhotoPrints, candidate: PhotoPrints): MatchScore {
  const normal = scoreSides(
    { cldPhash: suspect.cldPhash, full: suspect.full, face: suspect.face },
    { cldPhash: candidate.cldPhash, full: candidate.full, face: candidate.face },
  );
  // Mirror prints have no Cloudinary pHash, so the mirrored pass compares local hashes only.
  const mirrored = scoreSides(
    { full: suspect.fullMirror, face: suspect.faceMirror },
    { full: candidate.full, face: candidate.face },
  );
  if (mirrored.score > normal.score) return { ...mirrored, mirrored: true };
  return { ...normal, mirrored: false };
}

export function verdictFor(score: number): Verdict {
  if (score >= THRESHOLDS.derived) return "derived";
  if (score >= THRESHOLDS.likely) return "likely";
  return "none";
}

export function bestMatch(suspect: PhotoPrints, vault: PhotoPrints[]): MatchResult {
  let best: MatchScore | null = null;
  let bestIndex = -1;
  vault.forEach((candidate, i) => {
    const s = scorePair(suspect, candidate);
    if (!best || s.score > best.score) {
      best = s;
      bestIndex = i;
    }
  });
  if (!best) return { verdict: "none", score: 0, bestIndex: -1, parts: {}, mirrored: false, methods: [] };
  const b: MatchScore = best;
  return { verdict: verdictFor(b.score), score: b.score, bestIndex, parts: b.parts, mirrored: b.mirrored, methods: Object.keys(b.parts) };
}
