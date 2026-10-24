import { test, expect } from "vitest";
import sharp from "sharp";
import { blurTransformation, blurThumbTransformation } from "@/lib/cloudinary";
import { computePrints } from "@/lib/prints";
import { hamming } from "@/lib/fingerprint";
import { isExplicit } from "@/lib/moderation";
import { validateDraft } from "@/lib/llm/validate";
import { readImageField } from "@/lib/api";

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
  expect(hamming(a.full.phash, b.full.phash)).toBeLessThanOrEqual(12); // 12 of 256 bits: one JPEG round trip on a 256-bit hash
  // Flat synthetic colours leave the upper DCT band noise-dominated, so the face hash moves more here than on a photo.
  expect(hamming(a.face!.phash, b.face!.phash)).toBeLessThanOrEqual(24);
  expect(hamming(a.full.dhash, b.full.dhash)).toBeLessThanOrEqual(12); // 12 of 256 bits: one JPEG round trip on a 256-bit hash
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
test("validateDraft keeps a narrative that is plain text with no leftover placeholders", () => {
  const ok = { description: "Your photo was cropped and reposted.", narrative: "On 23 October I found a cropped copy of my photo on Instagram.", severity: "high" as const };
  expect(validateDraft(ok)).toEqual(ok);
  expect(validateDraft({ ...ok, narrative: "" })).toBeNull();
  expect(validateDraft({ ...ok, narrative: "I, [Victim Name], found it" })).toBeNull();
  expect(validateDraft({ ...ok, description: "see [POST_URL]" })).toBeNull();
  expect(validateDraft({ ...ok, narrative: "x".repeat(2001) })).toBeNull();
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
