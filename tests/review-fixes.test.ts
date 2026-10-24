import { test, expect } from "vitest";
import sharp from "sharp";
import { blurTransformation, blurThumbTransformation } from "@/lib/cloudinary";
import { computePrints } from "@/lib/prints";
import { hamming } from "@/lib/fingerprint";
import { isExplicit } from "@/lib/moderation";
import { validateDraft } from "@/lib/llm/validate";
import { readImageField } from "@/lib/api";
import { VERIFY_LINE } from "@/lib/templates";

// C2: Cloudinary allows one effect per URL component; two e_ in one component is invalid.
test("blur transformations chain effects in separate components", () => {
  for (const t of [blurTransformation({ caseId: "c1", sha256: "abc", at: "now" }), blurThumbTransformation()]) {
    for (const component of t.split("/")) {
      expect((component.match(/(^|,)e_/g) ?? []).length, component).toBeLessThanOrEqual(1);
    }
  }
});

// C1 and EXIF: face prints come from the local calibrated crop, and orientation tags are normalised.
// A gradient background matters: on a flat-colour image most DCT coefficients are near zero and the
// pHash bits are decided by JPEG noise. Real photographs are not flat.
async function portrait() {
  return sharp(
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1a33"/><stop offset="1" stop-color="#8fb3ff"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><ellipse cx="150" cy="150" rx="70" ry="90" fill="#c68642"/><rect x="100" y="300" width="100" height="100" fill="#b5413a"/></svg>',
    ),
  )
    .png()
    .toBuffer();
}

test("an EXIF-rotated copy fingerprints the same as the upright original", async () => {
  const up = await portrait();
  const upright = await sharp(up).jpeg({ quality: 95 }).toBuffer();
  // Store the pixels rotated 90 degrees with an orientation tag that says "rotate back".
  const tagged = await sharp(up).rotate(270).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
  const a = await computePrints(upright, [[80, 60, 140, 180]]);
  const b = await computePrints(tagged, [[80, 60, 140, 180]]);
  expect(hamming(a.full.phash, b.full.phash)).toBeLessThanOrEqual(2);
  expect(hamming(a.face!.phash, b.face!.phash)).toBeLessThanOrEqual(2);
  expect(hamming(a.full.dhash, b.full.dhash)).toBeLessThanOrEqual(2);
});

// I4: explicit only on explicit-nudity labels, never on a bare rejection.
test("isExplicit ignores rejection status and non-explicit labels", () => {
  const mod = (labels: { name: string; parent_name?: string; confidence: number }[]) => [
    { kind: "aws_rek", status: "rejected", response: { moderation_labels: labels } },
  ];
  expect(isExplicit(mod([{ name: "Non-Explicit Nudity of Intimate parts and Kissing", confidence: 95 }]))).toBe(false);
  expect(isExplicit(mod([{ name: "Violence", confidence: 95 }]))).toBe(false);
  expect(isExplicit(mod([{ name: "Explicit Nudity", confidence: 72 }]))).toBe(true);
  expect(isExplicit(mod([{ name: "Exposed Female Genitalia", parent_name: "Explicit Nudity", confidence: 80 }]))).toBe(true);
  expect(isExplicit(mod([{ name: "Explicit Nudity", confidence: 40 }]))).toBe(false);
  expect(isExplicit(undefined)).toBe(false);
});

// I5: model output must keep the case facts, or the templates are used.
test("validateDraft keeps facts and appends the verify line", () => {
  const facts = { caseId: "k7x2p9", exhibitSha256: "deadbeef".repeat(8), victimName: "Priya Sharma" };
  const ok = { description: "d", platform: `case k7x2p9 sha deadbeefdeadbeef by Priya Sharma`, portal: `k7x2p9 deadbeefdeadbeef Priya Sharma`, severity: "high" as const };
  const v = validateDraft(ok, facts);
  expect(v).not.toBeNull();
  expect(v!.platform.trim().endsWith(VERIFY_LINE)).toBe(true);
  expect(v!.portal.trim().endsWith(VERIFY_LINE)).toBe(true);
  expect(validateDraft({ ...ok, platform: "no facts here" }, facts)).toBeNull();
  expect(validateDraft({ ...ok, portal: "k7x2p9 by [Victim Name]" }, facts)).toBeNull();
});

// I2: a file that claims to be an image but is not is refused before anything is stored.
test("readImageField rejects bytes that are not an image", async () => {
  const fd = new FormData();
  fd.append("file", new File([Buffer.from("definitely not a png")], "x.png", { type: "image/png" }));
  const r = await readImageField(fd);
  expect("error" in r).toBe(true);
});

test("readImageField accepts a real png", async () => {
  const fd = new FormData();
  fd.append("file", new File([await portrait()], "p.png", { type: "image/png" }));
  const r = await readImageField(fd);
  expect("buf" in r).toBe(true);
});
