// Dev: upload each image, record Cloudinary face boxes + pHash, delete the asset. Writes a JSON for offline calibration.
//   npx tsx scripts/dev/facebox.ts <out.json> <img...>
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deleteAsset, uploadPrivate } from "../../src/lib/cloudinary";

async function main() {
  const [out, ...files] = process.argv.slice(2);
  const rows: { file: string; name: string; faces: number[][]; phash?: string; width: number; height: number }[] = [];
  for (const f of files) {
    const up = await uploadPrivate(readFileSync(f), "kavach/_bench");
    rows.push({ file: path.resolve(f), name: path.basename(f, path.extname(f)), faces: up.faces, phash: up.phash, width: up.width, height: up.height });
    console.log(path.basename(f).padEnd(20), `${up.width}x${up.height}`, "faces", JSON.stringify(up.faces));
    await deleteAsset(up.publicId).catch(() => undefined);
  }
  writeFileSync(out, JSON.stringify(rows, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
