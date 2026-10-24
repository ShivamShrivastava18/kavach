import { test, expect } from "vitest";
import sharp from "sharp";
import { computePrints } from "@/lib/prints";

async function img() {
  return sharp({ create: { width: 200, height: 200, channels: 3, background: { r: 120, g: 60, b: 30 } } })
    .composite([{ input: Buffer.from('<svg width="200" height="200"><circle cx="100" cy="90" r="50" fill="#eee"/></svg>'), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

test("no faces means no face prints", async () => {
  const p = await computePrints(await img(), [], "abcdef0123456789");
  expect(p.face).toBeUndefined();
  expect(p.faceMirror).toBeUndefined();
  expect(p.cldPhash).toBe("abcdef0123456789");
  expect(p.full.phash).toMatch(/^[0-9a-f]{16}$/);
});

test("a face box yields face prints", async () => {
  const p = await computePrints(await img(), [[50, 40, 100, 100]]);
  expect(p.face?.phash).toMatch(/^[0-9a-f]{16}$/);
  expect(p.faceMirror?.dhash).toMatch(/^[0-9a-f]{16}$/);
});
