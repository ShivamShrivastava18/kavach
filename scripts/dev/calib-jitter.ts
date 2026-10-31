// Offline: does a jitter search over the suspect's face crop lift true matches without lifting strangers?
//   npx tsx scripts/dev/calib-jitter.ts <bench-boxes.json> <hat-boxes.json>
// Candidates: "original" (bench) and "original" in the hat set (demo). Suspects: everything else in each set.
import "dotenv/config";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { faceCrop, fingerprint, mirror, similarity, type Box, type Fingerprint } from "../../src/lib/fingerprint";
import { firstFaceBox, upright } from "../../src/lib/prints";

type Row = { file: string; name: string; faces: number[][]; phash?: string };

const SCALES = [0.85, 1, 1.15];
const SHIFTS: [number, number][] = [[0, 0], [0.08, 0], [-0.08, 0], [0, 0.08], [0, -0.08]];

function jitter(box: Box, s: number, [dx, dy]: [number, number]): Box {
  const w = box.width * s;
  const h = box.height * s;
  const cx = box.x + box.width / 2 + dx * box.width;
  const cy = box.y + box.height / 2 + dy * box.height;
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
}

async function facePrint(buf: Buffer, box: Box): Promise<Fingerprint> {
  return fingerprint(await faceCrop(buf, box));
}

function faceScore(a: Fingerprint, b: Fingerprint): number {
  return 0.6 * similarity(a.phash, b.phash) + 0.4 * similarity(a.dhash, b.dhash);
}

async function scoreSet(rows: Row[], label: string) {
  const cand = rows.find((r) => r.name === "original")!;
  const cbuf = await upright(readFileSync(cand.file));
  const cprint = await facePrint(cbuf, firstFaceBox(cand.faces)!);
  console.log(`\n== ${label}`);
  for (const r of rows) {
    if (r === cand) continue;
    const buf = await upright(readFileSync(r.file));
    const box = firstFaceBox(r.faces);
    if (!box) {
      console.log(`${r.name.padEnd(16)} no face`);
      continue;
    }
    const W = (await sharp(buf).metadata()).width ?? 0;
    const mbuf = await mirror(buf);
    let single = 0;
    let best = 0;
    for (const s of SCALES) {
      for (const sh of SHIFTS) {
        const jb = jitter(box, s, sh);
        const n = faceScore(await facePrint(buf, jb), cprint);
        const m = faceScore(await facePrint(mbuf, { ...jb, x: W - jb.x - jb.width }), cprint);
        const v = Math.max(n, m);
        if (s === 1 && sh[0] === 0 && sh[1] === 0) single = v;
        best = Math.max(best, v);
      }
    }
    console.log(`${r.name.padEnd(16)} single ${single.toFixed(3)}  jitter-max ${best.toFixed(3)}`);
  }
}

async function main() {
  const [benchFile, hatFile] = process.argv.slice(2);
  await scoreSet(JSON.parse(readFileSync(benchFile, "utf8")), "benchmark (edits of the same face, then strangers p*)");
  if (hatFile) await scoreSet(JSON.parse(readFileSync(hatFile, "utf8")), "demo pair (hat)");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
