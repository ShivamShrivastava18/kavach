import { test, expect, beforeAll } from "vitest";
import sharp from "sharp";
import { fingerprint, hamming, similarity, mirror, faceCrop } from "@/lib/fingerprint";

let base: Buffer;
let resized: Buffer;
let tinted: Buffer;
let cropped: Buffer;
let mirrored: Buffer;
let noise: Buffer;

function svgScene(inverted = false, shapes = true) {
  const g = inverted
    ? `<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/>`
    : `<stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/>`;
  const s = shapes
    ? `<circle cx="96" cy="110" r="60" fill="#222"/><rect x="150" y="160" width="80" height="60" fill="#fff"/>`
    : `<rect x="20" y="20" width="40" height="200" fill="#777"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${g}</linearGradient></defs><rect width="256" height="256" fill="url(#g)"/>${s}</svg>`,
  );
}

beforeAll(async () => {
  base = await sharp(svgScene()).png().toBuffer();
  resized = await sharp(base).resize(128).png().toBuffer();
  tinted = await sharp(base).tint({ r: 255, g: 200, b: 200 }).png().toBuffer();
  cropped = await sharp(base).extract({ left: 25, top: 25, width: 206, height: 206 }).png().toBuffer();
  mirrored = await sharp(base).flop().png().toBuffer();
  noise = await sharp(svgScene(true, false)).png().toBuffer();
});

test("identical images have zero distance", async () => {
  const a = await fingerprint(base);
  const b = await fingerprint(base);
  expect(hamming(a.phash, b.phash)).toBe(0);
  expect(hamming(a.dhash, b.dhash)).toBe(0);
  expect(a.phash).toMatch(/^[0-9a-f]{64}$/);
});

test("resize and tint stay close", async () => {
  const a = await fingerprint(base);
  expect(similarity(a.phash, (await fingerprint(resized)).phash)).toBeGreaterThanOrEqual(0.9);
  expect(similarity(a.phash, (await fingerprint(tinted)).phash)).toBeGreaterThanOrEqual(0.8);
});

test("crop stays within band", async () => {
  const a = await fingerprint(base);
  expect(similarity(a.phash, (await fingerprint(cropped)).phash)).toBeGreaterThanOrEqual(0.6);
});

test("different image is far", async () => {
  const a = await fingerprint(base);
  expect(similarity(a.phash, (await fingerprint(noise)).phash)).toBeLessThanOrEqual(0.6);
});

test("mirror then mirror matches", async () => {
  const a = await fingerprint(base);
  const twice = await fingerprint(await mirror(await mirror(base)));
  expect(twice.phash).toBe(a.phash);
  const once = await fingerprint(mirrored);
  expect((await fingerprint(await mirror(base))).phash).toBe(once.phash);
});

test("hamming counts bits", () => {
  expect(hamming("00", "ff")).toBe(8);
  expect(hamming("0f", "00")).toBe(4);
});

test("faceCrop keeps the padded frame at image edges instead of clamping", async () => {
  // Box touches the left and bottom edges: the crop must still be 1.4x the box in both axes.
  const crop = await faceCrop(base, { x: 0, y: 156, width: 100, height: 100 });
  const meta = await sharp(crop).metadata();
  expect(meta.width).toBe(140);
  expect(meta.height).toBe(140);
});

test("faceCrop frames a face the same whether or not it sits at the edge", async () => {
  const inner = await faceCrop(base, { x: 60, y: 60, width: 100, height: 100 });
  // Cut the scene so the same face box now starts at x=0, y=0.
  const cut = await sharp(base).extract({ left: 60, top: 60, width: 196, height: 196 }).png().toBuffer();
  const edge = await faceCrop(cut, { x: 0, y: 0, width: 100, height: 100 });
  const a = await fingerprint(inner);
  const b = await fingerprint(edge);
  expect(similarity(a.phash, b.phash)).toBeGreaterThanOrEqual(0.8);
});

test("hashes are 256 bits", async () => {
  const f = await fingerprint(base);
  expect(f.phash).toHaveLength(64);
  expect(f.dhash).toHaveLength(64);
});
