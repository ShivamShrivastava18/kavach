// Offline: face-hash separation for different hash sizes, using recorded Cloudinary boxes.
import "dotenv/config";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { dHash, faceCrop, mirror, pHash, similarity } from "../../src/lib/fingerprint";
import { firstFaceBox, upright } from "../../src/lib/prints";

type Row = { file: string; name: string; faces: number[][]; phash?: string };
async function crops(r: Row) {
  const buf = await upright(readFileSync(r.file));
  const box = firstFaceBox(r.faces)!;
  const W = (await sharp(buf).metadata()).width ?? 0;
  return { n: await faceCrop(buf, box), m: await faceCrop(await mirror(buf), { ...box, x: W - box.x - box.width }) };
}
async function main() {
  const rows: Row[] = process.argv.slice(2).flatMap((f) => JSON.parse(readFileSync(f, "utf8")) as Row[]);
  const orig = rows.find((r) => r.name === "original")!;
  const ref = await crops(orig);
  for (const [band, dsize] of [[8, 8], [12, 12], [16, 16]] as const) {
    const rp = await pHash(ref.n, band);
    const rd = await dHash(ref.n, dsize);
    const pos: number[] = [], neg: number[] = [];
    const lines: string[] = [];
    for (const r of rows) {
      if (r.name === "original") continue;
      const c = await crops(r);
      let best = -1;
      for (const side of [c.n, c.m]) {
        const sp = similarity(await pHash(side, band), rp);
        const sd = similarity(await dHash(side, dsize), rd);
        best = Math.max(best, 0.6 * sp + 0.4 * sd);
      }
      (/^p\d/.test(r.name) ? neg : pos).push(best);
      lines.push(`  ${r.name.padEnd(16)} ${best.toFixed(3)}`);
    }
    console.log(`band ${band}x${band} (${band * band} bits): weakest positive ${Math.min(...pos).toFixed(3)}  strongest negative ${Math.max(...neg).toFixed(3)}  gap ${(Math.min(...pos) - Math.max(...neg)).toFixed(3)}`);
    console.log(lines.join("\n"));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
