import { test, expect } from "vitest";
import { scorePair, bestMatch, THRESHOLDS, type PhotoPrints } from "@/lib/match";

const Z = "0000000000000000";
const FLIP20 = "fffff00000000000"; // 20 bits differ from Z
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
  expect(THRESHOLDS).toEqual({ derived: 0.8, likely: 0.6 });
});

test("identical prints score 1 and derived", () => {
  const r = bestMatch(prints(Z), [prints(Z)]);
  expect(r.score).toBe(1);
  expect(r.verdict).toBe("derived");
  expect(r.bestIndex).toBe(0);
  expect(r.methods).toEqual(["cloudinary-phash", "face-phash", "face-dhash"]);
});

test("20 bits differing is likely", () => {
  const r = bestMatch(prints(FLIP20), [prints(Z)]);
  expect(r.score).toBeCloseTo(1 - 20 / 64, 2);
  expect(r.verdict).toBe("likely");
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
  const r = bestMatch(prints(Z), [prints(FLIP40), prints(Z), prints(FLIP20)]);
  expect(r.bestIndex).toBe(1);
});
