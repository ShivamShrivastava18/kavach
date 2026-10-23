import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./env";

export type ImgKind = "thumb" | "blur" | "face" | "blurthumb";
export type ImgClaims = { publicId: string; kind: ImgKind; stamp?: string };

function mac(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function signImg(publicId: string, kind: ImgKind, stamp: string | undefined, expSec: number): string {
  const exp = Math.floor(Date.now() / 1000) + expSec;
  const payload = Buffer.from(JSON.stringify({ publicId, kind, stamp, exp })).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function verifyImg(token: string): ImgClaims | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = mac(payload);
  if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;
  try {
    const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as ImgClaims & { exp: number };
    if (typeof c.exp !== "number" || c.exp < Math.floor(Date.now() / 1000)) return null;
    return { publicId: c.publicId, kind: c.kind, stamp: c.stamp };
  } catch {
    return null;
  }
}
