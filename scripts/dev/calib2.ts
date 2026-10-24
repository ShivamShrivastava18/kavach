// Offline calibration: scores every bench image against the original using recorded Cloudinary boxes.
//   npx tsx scripts/dev/calib2.ts <boxes.json> [more-boxes.json...]
import "dotenv/config";
import { readFileSync } from "node:fs";
import { computePrints } from "../../src/lib/prints";
import { scorePair, verdictFor } from "../../src/lib/match";

type Row = { file: string; name: string; faces: number[][]; phash?: string };
async function main() {
  const rows: Row[] = process.argv.slice(2).flatMap((f) => JSON.parse(readFileSync(f, "utf8")) as Row[]);
  const orig = rows.find((r) => r.name === "original")!;
  const ref = await computePrints(readFileSync(orig.file), orig.faces, orig.phash);
  const out: { name: string; score: number; neg: boolean; parts: Record<string, number>; mirrored: boolean }[] = [];
  for (const r of rows) {
    const p = await computePrints(readFileSync(r.file), r.faces, r.phash);
    const s = scorePair(p, ref);
    out.push({ name: r.name, score: s.score, neg: /^p\d/.test(r.name), parts: s.parts, mirrored: s.mirrored });
  }
  for (const o of out) {
    const parts = Object.entries(o.parts).map(([k, v]) => `${k.replace("cloudinary-", "cld-")}=${v.toFixed(2)}`).join(" ");
    console.log(`${o.neg ? "NEG " : "POS "}${o.name.padEnd(16)} ${o.score.toFixed(3)} ${verdictFor(o.score).padEnd(8)} ${parts}${o.mirrored ? " [mirror]" : ""}`);
  }
  const pos = out.filter((o) => !o.neg && o.name !== "original").map((o) => o.score);
  const neg = out.filter((o) => o.neg).map((o) => o.score);
  console.log(`\nweakest positive ${Math.min(...pos).toFixed(3)}   strongest negative ${Math.max(...neg).toFixed(3)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
