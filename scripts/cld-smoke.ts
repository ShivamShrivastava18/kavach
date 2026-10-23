// Smoke test for the Cloudinary wrapper. Needs CLOUDINARY_URL. Run: npx tsx scripts/cld-smoke.ts
import "dotenv/config";
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { uploadPrivate, derivedBuffer, blurTransformation, putJson, getJson, deleteAsset } from "../src/lib/cloudinary";

async function main() {
  const png = await sharp({
    create: { width: 300, height: 300, channels: 3, background: { r: 40, g: 80, b: 200 } },
  })
    .composite([{ input: Buffer.from('<svg width="300" height="300"><circle cx="150" cy="150" r="80" fill="#ffd"/></svg>'), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const up = await uploadPrivate(png, "kavach/_smoke/vault");
  console.log("uploaded", up.publicId, "phash", up.phash, "faces", up.faces, "quality", up.quality);

  const blurred = await derivedBuffer(up.publicId, blurTransformation({ caseId: "smoke1", sha256: "abcdef0123456789abcdef", at: new Date().toISOString() }));
  const out = process.env.SMOKE_OUT ?? "/tmp/kavach-smoke-blurred.png";
  writeFileSync(out, blurred);
  console.log("blurred bytes", blurred.length, "->", out);

  const key = "kavach/_smoke/profile.json";
  await putJson(key, { hello: "world", n: 1 });
  const back = await getJson<{ hello: string; n: number }>(key);
  console.log("json round trip", JSON.stringify(back) === JSON.stringify({ hello: "world", n: 1 }) ? "OK" : `MISMATCH ${JSON.stringify(back)}`);

  await deleteAsset(up.publicId);
  await deleteAsset(key, "raw");
  console.log("cleaned up");
}

main().catch((e) => {
  console.error("SMOKE FAILED", e);
  process.exit(1);
});
