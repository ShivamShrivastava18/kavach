import { similarity, type Fingerprint } from "./fingerprint";

export type PhotoPrints = {
  cldPhash?: string;
  full: Fingerprint;
  fullMirror: Fingerprint;
  face?: Fingerprint;
  faceMirror?: Fingerprint;
};

export { THRESHOLDS, verdictFor, type Verdict } from "./thresholds";
import { verdictFor, type Verdict } from "./thresholds";

export type MatchScore = { score: number; parts: Record<string, number>; mirrored: boolean };

export type MatchResult = {
  verdict: Verdict;
  score: number;
  bestIndex: number;
  parts: Record<string, number>;
  mirrored: boolean;
  methods: string[];
};


type Side = { cldPhash?: string; full: Fingerprint; face?: Fingerprint };

function scoreSides(s: Side, c: Side): { score: number; parts: Record<string, number> } {
  const parts: Record<string, number> = {};
  if (s.face && c.face) {
    const cld = s.cldPhash && c.cldPhash ? similarity(s.cldPhash, c.cldPhash) : similarity(s.full.phash, c.full.phash);
    parts["cloudinary-phash"] = cld;
    parts["face-phash"] = similarity(s.face.phash, c.face.phash);
    parts["face-dhash"] = similarity(s.face.dhash, c.face.dhash);
    // The face carries the evidence. The full-frame hash can only corroborate it: a morph puts the face
    // into a new frame on purpose, so a different frame must not count against the match.
    const face = 0.6 * parts["face-phash"] + 0.4 * parts["face-dhash"];
    return { score: Math.max(face, 0.5 * face + 0.5 * cld), parts };
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
