import { cookies } from "next/headers";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import { getProfile } from "./store";
import type { Profile } from "./types";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function fail(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function currentProfile(): Promise<Profile | null> {
  const jar = await cookies();
  const id = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  return getProfile(id);
}

export async function readImageField(form: FormData, field = "file"): Promise<{ buf: Buffer; type: string } | { error: string }> {
  const f = form.get(field);
  if (!(f instanceof File)) return { error: "Attach an image file." };
  if (!f.type.startsWith("image/")) return { error: "That is not an image. Kavach accepts JPG, PNG or WebP." };
  if (f.size > MAX_UPLOAD_BYTES) return { error: "That image is over 4 MB. Resize it and try again." };
  if (f.size === 0) return { error: "That file is empty." };
  const buf = Buffer.from(await f.arrayBuffer());
  try {
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) throw new Error("no dimensions");
  } catch {
    return { error: "That file is not an image Kavach can read. Use JPG, PNG or WebP." };
  }
  return { buf, type: f.type };
}
