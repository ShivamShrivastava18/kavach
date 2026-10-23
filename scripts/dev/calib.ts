import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fingerprint, mirror, faceCrop, type Box } from "../../src/lib/fingerprint";
import { scorePair, type PhotoPrints } from "../../src/lib/match";
const FACE: Box = { x: 312, y: 190, width: 400, height: 500 };
async function prints(buf: Buffer, face: Box): Promise<PhotoPrints> {
  const m = await mirror(buf); const W = (await sharp(buf).metadata()).width!;
  return { full: await fingerprint(buf), fullMirror: await fingerprint(m), face: await fingerprint(await faceCrop(buf, face)), faceMirror: await fingerprint(await faceCrop(m, { ...face, x: W - face.x - face.width })) };
}
function scaled(face: Box, crop: number, size: number): Box { const off = (size - crop) / 2; const s = 1024 / crop; return { x: (face.x - off) * s, y: (face.y - off) * s, width: face.width * s, height: face.height * s }; }
async function main() {
  const p1 = readFileSync("public/demo/priya-1.png");
  const p2 = readFileSync("public/demo/priya-2.png");
  const base = await prints(p1, FACE);
  const variants: Record<string, () => Promise<[Buffer, Box]>> = {
    same: async () => [p1, FACE],
    other: async () => [p2, FACE],
    crop90: async () => { const c = 922, o = 51; return [await sharp(p1).extract({ left: o, top: o, width: c, height: c }).resize(1024).png().toBuffer(), scaled(FACE, c, 1024)]; },
    crop80: async () => { const c = 819, o = 102; return [await sharp(p1).extract({ left: o, top: o, width: c, height: c }).resize(1024).png().toBuffer(), scaled(FACE, c, 1024)]; },
    mirror: async () => [await sharp(p1).flop().png().toBuffer(), { ...FACE, x: 1024 - FACE.x - FACE.width }],
    tint: async () => [await sharp(p1).tint({ r: 255, g: 190, b: 210 }).png().toBuffer(), FACE],
    rot3: async () => [await sharp(p1).rotate(3, { background: "#111" }).resize(1024, 1024, { fit: "cover" }).png().toBuffer(), FACE],
    caption: async () => [await sharp(p1).composite([{ input: Buffer.from(`<svg width="1024" height="1024"><rect y="880" width="1024" height="144" fill="#000a"/><text x="512" y="970" font-size="80" fill="#f5a" text-anchor="middle">sent to u</text></svg>`), top: 0, left: 0 }]).png().toBuffer(), FACE],
    jpeg30: async () => [await sharp(p1).jpeg({ quality: 30 }).toBuffer(), FACE],
    small256: async () => [await sharp(p1).resize(256).png().toBuffer(), { x: 78, y: 47.5, width: 100, height: 125 }],
    crop90_mirror_tint_caption: async () => { const c = 922, o = 51; const b = await sharp(p1).extract({ left: o, top: o, width: c, height: c }).resize(1024).flop().tint({ r: 255, g: 190, b: 210 }).composite([{ input: Buffer.from(`<svg width="1024" height="1024"><rect y="880" width="1024" height="144" fill="#000a"/><text x="512" y="970" font-size="80" fill="#f5a" text-anchor="middle">sent to u</text></svg>`), top: 0, left: 0 }]).png().toBuffer(); const f = scaled(FACE, c, 1024); return [b, { ...f, x: 1024 - f.x - f.width }]; },
  };
  for (const [name, fn] of Object.entries(variants)) {
    const [buf, face] = await fn();
    const s = scorePair(await prints(buf, face), base);
    console.log(name.padEnd(28), s.score.toFixed(3), JSON.stringify(Object.fromEntries(Object.entries(s.parts).map(([k, v]) => [k, +v.toFixed(2)]))), s.mirrored ? "M" : "");
  }
}
main();
