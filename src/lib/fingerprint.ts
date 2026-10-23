import sharp from "sharp";

export type Fingerprint = { phash: string; dhash: string };
export type Box = { x: number; y: number; width: number; height: number };

function bitsToHex(bits: number[]): string {
  let out = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    out += nibble.toString(16);
  }
  return out;
}

async function grey(buf: Buffer, w: number, h: number): Promise<Uint8Array> {
  const { data } = await sharp(buf)
    .flatten({ background: "#fff" })
    .greyscale()
    .resize(w, h, { fit: "fill", kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export async function dHash(buf: Buffer): Promise<string> {
  const px = await grey(buf, 9, 8);
  const bits: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits.push(px[y * 9 + x] < px[y * 9 + x + 1] ? 1 : 0);
    }
  }
  return bitsToHex(bits);
}

const N = 32;
const COS: number[][] = Array.from({ length: N }, (_, u) =>
  Array.from({ length: N }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N))),
);

export async function pHash(buf: Buffer): Promise<string> {
  const px = await grey(buf, N, N);
  // Row DCT then column DCT, only the 8x8 low-frequency block is needed.
  const rows: number[][] = [];
  for (let y = 0; y < N; y++) {
    const row: number[] = [];
    for (let u = 0; u < 8; u++) {
      let s = 0;
      for (let x = 0; x < N; x++) s += px[y * N + x] * COS[u][x];
      row.push(s);
    }
    rows.push(row);
  }
  const block: number[] = [];
  for (let v = 0; v < 8; v++) {
    for (let u = 0; u < 8; u++) {
      let s = 0;
      for (let y = 0; y < N; y++) s += rows[y][u] * COS[v][y];
      block.push(s);
    }
  }
  const ac = block.slice(1);
  const sorted = [...ac].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const bits = block.map((c, i) => (i === 0 ? 0 : c > median ? 1 : 0));
  return bitsToHex(bits);
}

export async function fingerprint(buf: Buffer): Promise<Fingerprint> {
  const [phash, dhash] = await Promise.all([pHash(buf), dHash(buf)]);
  return { phash, dhash };
}

export function hamming(a: string, b: string): number {
  if (a.length !== b.length) throw new Error("hash length mismatch");
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

export function similarity(a: string, b: string): number {
  return 1 - hamming(a, b) / (a.length * 4);
}

export async function mirror(buf: Buffer): Promise<Buffer> {
  return sharp(buf).flop().png().toBuffer();
}

export async function faceCrop(buf: Buffer, box: Box): Promise<Buffer> {
  const meta = await sharp(buf).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  const padX = box.width * 0.2;
  const padY = box.height * 0.2;
  const left = Math.max(0, Math.floor(box.x - padX));
  const top = Math.max(0, Math.floor(box.y - padY));
  const right = Math.min(W, Math.ceil(box.x + box.width + padX));
  const bottom = Math.min(H, Math.ceil(box.y + box.height + padY));
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  return sharp(buf).extract({ left, top, width, height }).png().toBuffer();
}
