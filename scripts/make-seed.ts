// Generates the demo seed: two synthetic vector portraits, a morphed "exhibit" derived from the
// first, a blurred stamped version, fingerprints, a precomputed match and canned drafts.
// Run: npx tsx scripts/make-seed.ts
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { fingerprint, mirror, faceCrop, type Box } from "../src/lib/fingerprint";
import { bestMatch, type PhotoPrints } from "../src/lib/match";
import { fillTemplates } from "../src/lib/templates";
import type { CaseRecord, Drafts, Profile, VaultPhoto } from "../src/lib/types";

const SIZE = 1024;
const FACE: Box = { x: 312, y: 190, width: 400, height: 500 };

function portrait(scheme: { bg: string; skin: string; hair: string; top: string; lips: string }, variant: 1 | 2): Buffer {
  const hair =
    variant === 1
      ? `<path d="M300 420 C280 180, 744 180, 724 420 L724 300 C724 150, 300 150, 300 300 Z" fill="${scheme.hair}"/>
         <rect x="300" y="380" width="60" height="330" rx="30" fill="${scheme.hair}"/>
         <rect x="664" y="380" width="60" height="330" rx="30" fill="${scheme.hair}"/>`
      : `<path d="M330 420 C330 200, 694 200, 694 420 L694 300 C694 170, 330 170, 330 300 Z" fill="${scheme.hair}"/>
         <rect x="330" y="380" width="50" height="400" rx="25" fill="${scheme.hair}"/>
         <rect x="644" y="380" width="50" height="400" rx="25" fill="${scheme.hair}"/>
         <circle cx="452" cy="440" r="48" fill="none" stroke="#111" stroke-width="10"/><circle cx="572" cy="440" r="48" fill="none" stroke="#111" stroke-width="10"/><line x1="500" y1="440" x2="524" y2="440" stroke="#111" stroke-width="10"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="${scheme.bg}"/>
    <circle cx="512" cy="512" r="430" fill="${scheme.bg}" stroke="#ffffff22" stroke-width="20"/>
    <path d="M212 1024 C212 760, 812 760, 812 1024 Z" fill="${scheme.top}"/>
    <rect x="452" y="620" width="120" height="160" fill="${scheme.skin}"/>
    <ellipse cx="512" cy="440" rx="${variant === 1 ? 200 : 160}" ry="${variant === 1 ? 250 : 270}" fill="${scheme.skin}"/>
    ${hair}
    <ellipse cx="${variant === 1 ? 432 : 452}" cy="${variant === 1 ? 430 : 440}" rx="28" ry="18" fill="#fff"/><ellipse cx="${variant === 1 ? 592 : 572}" cy="${variant === 1 ? 430 : 440}" rx="28" ry="18" fill="#fff"/>
    <circle cx="${variant === 1 ? 436 : 456}" cy="${variant === 1 ? 432 : 442}" r="12" fill="#2b1b12"/><circle cx="${variant === 1 ? 596 : 576}" cy="${variant === 1 ? 432 : 442}" r="12" fill="#2b1b12"/>
    <path d="M400 395 q32 -22 64 0" stroke="#2b1b12" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M560 395 q32 -22 64 0" stroke="#2b1b12" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M512 440 q-14 40 8 60" stroke="#00000022" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M462 560 q50 40 100 0" stroke="${scheme.lips}" stroke-width="14" fill="none" stroke-linecap="round"/>
    <circle cx="332" cy="470" r="14" fill="#d4a017"/><circle cx="692" cy="470" r="14" fill="#d4a017"/>
  </svg>`;
  return Buffer.from(svg);
}

async function prints(buf: Buffer, face?: Box): Promise<PhotoPrints> {
  const m = await mirror(buf);
  const out: PhotoPrints = { full: await fingerprint(buf), fullMirror: await fingerprint(m) };
  if (face) {
    const meta = await sharp(buf).metadata();
    const W = meta.width ?? SIZE;
    const mirroredFace: Box = { ...face, x: W - face.x - face.width };
    out.face = await fingerprint(await faceCrop(buf, face));
    out.faceMirror = await fingerprint(await faceCrop(m, mirroredFace));
  }
  return out;
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

async function main() {
  mkdirSync("public/demo", { recursive: true });

  const p1 = await sharp(portrait({ bg: "#1f2a44", skin: "#c68642", hair: "#1a0f0a", top: "#b5413a", lips: "#8e2f2f" }, 1)).png().toBuffer();
  const p2 = await sharp(portrait({ bg: "#2f3b2a", skin: "#a9693a", hair: "#2b1b12", top: "#3a6ea5", lips: "#7a2b2b" }, 2)).png().toBuffer();
  writeFileSync("public/demo/priya-1.png", p1);
  writeFileSync("public/demo/priya-2.png", p2);

  // The exhibit: crop to 80%, mirror, tint, rotate 8 degrees, overlay a caption.
  const crop = Math.round(SIZE * 0.9);
  const off = Math.round((SIZE - crop) / 2);
  const caption = Buffer.from(
    `<svg width="${crop}" height="${crop}"><rect x="0" y="${crop - 120}" width="${crop}" height="120" fill="#000000aa"/><text x="${crop / 2}" y="${crop - 45}" font-family="Arial" font-size="64" fill="#ff5fa2" text-anchor="middle">sent to u ;)</text></svg>`,
  );
  const exhibit = await sharp(p1)
    .extract({ left: off, top: off, width: crop, height: crop })
    .flop()
    .tint({ r: 255, g: 190, b: 210 })
    .composite([{ input: caption, top: 0, left: 0 }])
    .resize(SIZE, SIZE)
    .png()
    .toBuffer();
  writeFileSync("public/demo/exhibit.png", exhibit);

  // Face box in the exhibit: central region (the crop was central and the rotation small).
  const s = SIZE / crop;
  const exFace: Box = { x: Math.round(SIZE - (FACE.x - off) * s - FACE.width * s), y: Math.round((FACE.y - off) * s), width: Math.round(FACE.width * s), height: Math.round(FACE.height * s) };

  // Blurred, pixelated and stamped exhibit for the demo case page.
  const stampText = `KAVACH EVIDENCE  case demo-case  sha256 ${sha(exhibit).slice(0, 16)}  ${new Date().toISOString()}`;
  const faceRegion = await sharp(exhibit).extract({ left: Math.round(exFace.x), top: Math.round(exFace.y), width: Math.round(exFace.width), height: Math.round(exFace.height) }).resize(10, 12, { kernel: "nearest" }).png().toBuffer();
  const facePixels = await sharp(faceRegion).resize(exFace.width, exFace.height, { kernel: "nearest" }).png().toBuffer();
  const stamp = Buffer.from(
    `<svg width="1024" height="1024"><rect x="0" y="954" width="1024" height="70" fill="#000000bb"/><text x="512" y="998" font-family="Arial" font-weight="bold" font-size="22" fill="#fff" text-anchor="middle">${stampText}</text></svg>`,
  );
  const blurred = await sharp(exhibit)
    .blur(18)
    .composite([
      { input: facePixels, top: Math.round(exFace.y), left: Math.round(exFace.x) },
      { input: stamp, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
  writeFileSync("public/demo/exhibit-blurred.png", blurred);
  const matchedBlur = await sharp(p1).resize(400, 400).blur(12).png().toBuffer();
  writeFileSync("public/demo/priya-1-blurred.png", matchedBlur);

  const vault: VaultPhoto[] = [
    { publicId: "demo/priya-1", uploadedAt: "2026-10-12T09:14:00.000Z", sha256: sha(p1), width: SIZE, height: SIZE, faces: [[FACE.x, FACE.y, FACE.width, FACE.height]], quality: 0.92, prints: await prints(p1, FACE) },
    { publicId: "demo/priya-2", uploadedAt: "2026-10-15T18:02:00.000Z", sha256: sha(p2), width: SIZE, height: SIZE, faces: [[FACE.x, FACE.y, FACE.width, FACE.height]], quality: 0.9, prints: await prints(p2, FACE) },
  ];
  const suspect = await prints(exhibit, exFace);
  const match = bestMatch(suspect, vault.map((v) => v.prints));
  console.log("match", match.verdict, match.score.toFixed(3), match.parts, "mirrored", match.mirrored);

  const profile: Profile = { id: "priya-demo", name: "Priya", pinHash: "demo", salt: "demo", createdAt: "2026-10-12T09:00:00.000Z", vault };
  const caseRecord: CaseRecord = {
    id: "demo-case",
    profileId: profile.id,
    createdAt: "2026-10-23T20:41:00.000Z",
    platform: "Instagram",
    postUrl: "https://instagram.com/p/C7xk2demo",
    exhibitPublicId: "demo/exhibit",
    exhibitSha256: sha(exhibit),
    exhibitFaces: [[exFace.x, exFace.y, exFace.width, exFace.height]],
    explicit: false,
    match,
    matchedPhoto: match.bestIndex >= 0 ? { publicId: vault[match.bestIndex].publicId, uploadedAt: vault[match.bestIndex].uploadedAt } : undefined,
  };
  const t = fillTemplates({
    caseId: caseRecord.id,
    victimName: profile.name,
    platform: caseRecord.platform,
    postUrl: caseRecord.postUrl,
    firstSeen: "2026-10-23",
    exhibitSha256: caseRecord.exhibitSha256,
    verdict: match.verdict,
    score: match.score,
    methods: match.methods,
    matchedPhotoDate: "2026-10-12",
    explicit: false,
  });
  const drafts: Drafts = {
    description:
      "The image is a cropped, mirrored and recoloured copy of your registered photo from 12 Oct 2026, with a caption added across the bottom. The face region matches your photo closely; the rest of the frame has been tinted pink to look like a new picture.",
    platform: t.platform,
    portal: t.portal,
    severity: "high",
    provider: "demo",
    fallback: false,
  };
  writeFileSync("src/lib/demo/seed.json", JSON.stringify({ profile, case: caseRecord, drafts }, null, 2));
  writeFileSync("public/demo/LICENSE.txt", "The portraits and exhibit in this folder are generated vector art made by scripts/make-seed.ts. They depict no real person. CC0 1.0 Universal.\n");
  if (match.verdict !== "derived") {
    console.error("seed exhibit did not score derived; adjust the derivative");
    process.exit(1);
  }
}

main();
