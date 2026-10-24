import { test, expect } from "vitest";
import { scorePair, bestMatch, THRESHOLDS, type PhotoPrints } from "@/lib/match";

const Z = "0000000000000000";
const FLIP16 = "ffff000000000000"; // 16 bits differ from Z
const F = "ffffffffffffffff"; // every bit differs from Z
const FLIP40 = "ffffffffff000000"; // 40 bits differ from Z
const A = "a5a5a5a5a5a5a5a5";

const fp = (h: string) => ({ phash: h, dhash: h });
const prints = (h: string, opts: { face?: boolean; mirrorHash?: string; cld?: string } = {}): PhotoPrints => ({
  cldPhash: opts.cld ?? h,
  full: fp(h),
  fullMirror: fp(opts.mirrorHash ?? A),
  face: opts.face === false ? undefined : fp(h),
  faceMirror: opts.face === false ? undefined : fp(opts.mirrorHash ?? A),
});

test("thresholds are as specified", () => {
  expect(THRESHOLDS).toEqual({ derived: 0.8, likely: 0.7 });
});

test("identical prints score 1 and derived", () => {
  const r = bestMatch(prints(Z), [prints(Z)]);
  expect(r.score).toBe(1);
  expect(r.verdict).toBe("derived");
  expect(r.bestIndex).toBe(0);
  expect(r.methods).toEqual(["cloudinary-phash", "face-phash", "face-dhash"]);
});

test("16 bits differing on every hash is likely", () => {
  const r = bestMatch(prints(FLIP16), [prints(Z)]);
  expect(r.score).toBeCloseTo(1 - 16 / 64, 2);
  expect(r.verdict).toBe("likely");
});

test("a different full frame never lowers a strong face match", () => {
  // Face pasted onto another photo: face hashes identical, Cloudinary full-image hash unrelated.
  const r = scorePair(prints(Z, { cld: F }), prints(Z));
  expect(r.score).toBe(1);
  expect(r.parts["cloudinary-phash"]).toBe(0);
});

test("a matching full frame raises a middling face match", () => {
  const sameFrame = scorePair(prints(FLIP16, { cld: Z }), prints(Z, { cld: Z }));
  const otherFrame = scorePair(prints(FLIP16, { cld: F }), prints(Z, { cld: Z }));
  expect(sameFrame.score).toBeGreaterThan(otherFrame.score);
  expect(otherFrame.score).toBeCloseTo(0.75, 2);
});

test("40 bits differing is none", () => {
  const r = bestMatch(prints(FLIP40), [prints(Z)]);
  expect(r.verdict).toBe("none");
});

test("mirrored suspect matches via mirror prints", () => {
  const suspect = prints(FLIP40, { mirrorHash: Z, cld: FLIP40 });
  const r = bestMatch(suspect, [prints(Z)]);
  expect(r.mirrored).toBe(true);
  expect(r.verdict).toBe("derived");
});

test("no face on suspect uses full-image formula", () => {
  const r = scorePair(prints(Z, { face: false }), prints(Z));
  expect(r.score).toBe(1);
  const b = bestMatch(prints(Z, { face: false }), [prints(Z)]);
  expect(b.methods).toEqual(["full-phash", "full-dhash"]);
});

test("empty vault returns none", () => {
  const r = bestMatch(prints(Z), []);
  expect(r.verdict).toBe("none");
  expect(r.bestIndex).toBe(-1);
});

test("picks the best candidate", () => {
  const r = bestMatch(prints(Z), [prints(FLIP40), prints(Z), prints(FLIP16)]);
  expect(r.bestIndex).toBe(1);
});
