// Real-image benchmark: how does Kavach score the edits a harasser actually makes?
//
//   npx tsx scripts/morph-bench.ts <portrait.jpg> [<other-person.jpg>]
//       Local: full-frame hashes only (no Cloudinary face boxes). Writes the variants to scripts/bench-out/.
//   LIVE=1 npx tsx scripts/morph-bench.ts <portrait.jpg> [<other-person.jpg>] [http://localhost:3000]
//       Live: opens a shield, registers the portrait, runs every variant through /api/check, prints verdicts.
//
// Variants model real abuse: reposts (recompress, downscale, screenshot), evasion (mirror, crop, tilt, filter),
// and morphs (face pasted on another body, caption added). The other person is the negative control.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { computePrints } from "../src/lib/prints";
import { scorePair, verdictFor } from "../src/lib/match";

type Variant = { name: string; what: string; make: (src: Buffer, w: number, h: number, other?: Buffer) => Promise<Buffer> };

const VARIANTS: Variant[] = [
  { name: "original", what: "the exact file", make: async (s) => s },
  { name: "recompress-q20", what: "WhatsApp-style recompression", make: async (s) => sharp(s).jpeg({ quality: 20 }).toBuffer() },
  { name: "downscale-400", what: "thumbnail repost", make: async (s) => sharp(s).resize({ width: 400 }).jpeg({ quality: 70 }).toBuffer() },
  { name: "mirror", what: "flipped to dodge reverse search", make: async (s) => sharp(s).flop().jpeg().toBuffer() },
  {
    name: "crop-face-70",
    what: "cropped to the face",
    make: async (s, w, h) => sharp(s).extract({ left: Math.round(w * 0.15), top: Math.round(h * 0.05), width: Math.round(w * 0.7), height: Math.round(h * 0.6) }).jpeg().toBuffer(),
  },
  { name: "tilt-3", what: "3 degree rotation", make: async (s) => sharp(s).rotate(3, { background: "#fff" }).jpeg().toBuffer() },
  { name: "filter-warm", what: "Instagram-style colour filter", make: async (s) => sharp(s).modulate({ saturation: 1.5, brightness: 1.1, hue: 20 }).jpeg().toBuffer() },
  { name: "sepia", what: "greyscale and tint", make: async (s) => sharp(s).greyscale().tint("#c9a06a").jpeg().toBuffer() },
  {
    name: "caption",
    what: "abusive caption band added",
    make: async (s, w, h) => {
      const band = Buffer.from(`<svg width="${w}" height="${Math.round(h * 0.12)}"><rect width="100%" height="100%" fill="#111"/><text x="50%" y="62%" font-size="${Math.round(h * 0.06)}" fill="#fff" text-anchor="middle" font-family="Arial">dm for more ;)</text></svg>`);
      return sharp(s).composite([{ input: band, gravity: "south" }]).jpeg().toBuffer();
    },
  },
  {
    name: "screenshot",
    what: "screenshot of a chat with the photo inside",
    make: async (s, w, h) => {
      const inner = await sharp(s).resize({ width: Math.round(w * 0.7) }).toBuffer();
      return sharp({ create: { width: w, height: h, channels: 3, background: "#f2f2f2" } }).composite([{ input: inner, gravity: "center" }]).jpeg().toBuffer();
    },
  },
  {
    name: "body-swap",
    what: "face pasted onto a different photo",
    make: async (s, w, h, other) => {
      if (!other) throw new Error("body-swap needs a second image");
      // Head and shoulders of the victim, pasted large onto someone else's photo (the whole face is kept, as a real morph does).
      const face = await sharp(s).extract({ left: Math.round(w * 0.15), top: Math.round(h * 0.12), width: Math.round(w * 0.7), height: Math.round(h * 0.6) }).toBuffer();
      const om = await sharp(other).metadata();
      const target = await sharp(face).resize({ height: Math.round((om.height ?? 800) * 0.75) }).toBuffer();
      const tm = await sharp(target).metadata();
      return sharp(other).composite([{ input: target, top: Math.round((om.height ?? 800) * 0.05), left: Math.round(((om.width ?? 800) - (tm.width ?? 0)) / 2) }]).jpeg().toBuffer();
    },
  },
  { name: "all-at-once", what: "mirror + crop + recompress + filter", make: async (s, w, h) => sharp(s).flop().extract({ left: Math.round(w * 0.1), top: Math.round(h * 0.05), width: Math.round(w * 0.8), height: Math.round(h * 0.7) }).modulate({ saturation: 1.3 }).jpeg({ quality: 30 }).toBuffer() },
];

const portraitPath = process.argv[2];
const others = process.argv.slice(3).filter((a) => !/^https?:/.test(a));
const otherPath = others[0];
const base = (process.argv.slice(3).find((a) => /^https?:/.test(a)) ?? "http://localhost:3000").replace(/\/$/, "");
if (!portraitPath) {
  console.error("usage: morph-bench.ts <portrait> [<other-person>] [<base-url>]");
  process.exit(1);
}
const outDir = path.join("scripts", "bench-out");
mkdirSync(outDir, { recursive: true });

async function buildVariants() {
  const src = await sharp(readFileSync(portraitPath)).rotate().jpeg({ quality: 92 }).toBuffer();
  const other = otherPath ? await sharp(readFileSync(otherPath)).rotate().jpeg({ quality: 92 }).toBuffer() : undefined;
  const { width: w = 0, height: h = 0 } = await sharp(src).metadata();
  const out: { name: string; what: string; buf: Buffer }[] = [];
  for (const v of VARIANTS) {
    if (v.name === "body-swap" && !other) continue;
    const buf = await v.make(src, w, h, other);
    writeFileSync(path.join(outDir, `${v.name}.jpg`), buf);
    out.push({ name: v.name, what: v.what, buf });
  }
  for (const [i, o] of others.entries()) {
    out.push({ name: `other-${i + 1}`, what: `a different person (must be none): ${path.basename(o)}`, buf: await sharp(readFileSync(o)).rotate().jpeg({ quality: 92 }).toBuffer() });
  }
  return { src, out };
}

function row(name: string, what: string, score: number, verdict: string, extra = "", parts: Record<string, number> = {}) {
  const p = Object.entries(parts).map(([k, v]) => `${k.replace("cloudinary-", "cld-").replace("full-", "")}=${v.toFixed(2)}`).join(" ");
  console.log(`${name.padEnd(16)} ${score.toFixed(3)}  ${verdict.padEnd(8)} ${p.padEnd(44)} ${what}${extra}`);
}

async function local() {
  const { src, out } = await buildVariants();
  const ref = await computePrints(src, []);
  console.log("LOCAL (full-frame hashes only; live mode adds the face-crop hashes)\n");
  for (const v of out) {
    const p = await computePrints(v.buf, []);
    const s = scorePair(p, ref);
    row(v.name, v.what, s.score, verdictFor(s.score), s.mirrored ? "  [mirror]" : "", s.parts);
  }
}

let cookie = "";
async function call(p: string, init: RequestInit = {}) {
  const r = await fetch(base + p, { ...init, headers: { ...(init.headers ?? {}), cookie }, redirect: "manual" });
  const set = r.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return r;
}

async function live() {
  const { src, out } = await buildVariants();
  const prof = await call("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "create", name: "Bench", pin: "9876" }) });
  const pb = (await prof.json()) as { id?: string; demo?: boolean; error?: string };
  if (!prof.ok || pb.demo) throw new Error(`need a live server: ${pb.error ?? "demo mode"}`);
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(src)], "portrait.jpg", { type: "image/jpeg" }));
  const up = await call("/api/vault", { method: "POST", body: fd });
  const ub = (await up.json()) as { photo?: { faces: number; cldPhash?: string }; error?: string };
  if (!up.ok) throw new Error(`vault upload failed: ${ub.error}`);
  console.log(`LIVE ${base}: registered portrait, faces=${ub.photo?.faces} cldPhash=${ub.photo?.cldPhash ? "yes" : "no"}\n`);
  for (const v of out) {
    const f = new FormData();
    f.append("file", new File([new Uint8Array(v.buf)], `${v.name}.jpg`, { type: "image/jpeg" }));
    f.append("platform", "Instagram");
    const r = await call("/api/check", { method: "POST", body: f });
    const b = (await r.json()) as { caseId?: string; score?: number; verdict?: string; error?: string };
    if (!r.ok) {
      console.log(`${v.name.padEnd(16)} ERROR ${b.error}`);
      continue;
    }
    const cs = (await (await call(`/api/case/${b.caseId}`)).json()) as { case?: { match: { parts: Record<string, number>; mirrored: boolean }; exhibitFaces?: number[][] } };
    row(v.name, v.what, b.score ?? 0, b.verdict ?? "?", cs.case?.match.mirrored ? "  [mirror]" : "", cs.case?.match.parts);
  }
  await call("/api/profile", { method: "DELETE" });
  console.log("\nbench shield deleted");
}

(process.env.LIVE === "1" ? live() : local()).catch((e) => {
  console.error("BENCH FAILED", e);
  process.exit(1);
});
