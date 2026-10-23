import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { sessionSecret } from "./env";

export const SESSION_COOKIE = "kavach_session";

function sig(id: string): string {
  return createHmac("sha256", sessionSecret()).update(id).digest("base64url");
}

export function signSession(profileId: string): string {
  return `${profileId}.${sig(profileId)}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sig(id);
  if (given.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected)) ? id : null;
}

export function hashPin(pin: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}
