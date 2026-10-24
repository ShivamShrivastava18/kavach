import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { currentProfile, fail, readImageField } from "@/lib/api";
import { deleteAsset, uploadPrivate } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { computePrints } from "@/lib/prints";
import { saveProfile } from "@/lib/store";
import type { VaultPhoto } from "@/lib/types";
import { photoView } from "@/lib/caseview";


export async function GET() {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  return NextResponse.json({ photos: profile.vault.map(photoView) });
}

export async function POST(req: Request) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  if (isDemoMode()) return fail(403, "Demo vault is read-only.");
  const form = await req.formData();
  const img = await readImageField(form);
  if ("error" in img) return fail(400, img.error);

  const sha256 = createHash("sha256").update(img.buf).digest("hex");
  let up;
  try {
    up = await uploadPrivate(img.buf, `kavach/${profile.id}/vault`);
  } catch (e) {
    console.error("[kavach] vault upload failed:", (e as Error).message);
    return fail(502, "Storage is not responding. Try again in a moment.");
  }
  const prints = await computePrints(img.buf, up.faces, up.phash);
  const photo: VaultPhoto = {
    publicId: up.publicId,
    uploadedAt: new Date().toISOString(),
    sha256,
    width: up.width,
    height: up.height,
    cldPhash: up.phash,
    faces: up.faces,
    quality: up.quality,
    prints,
  };
  profile.vault.push(photo);
  await saveProfile(profile);
  return NextResponse.json({ photo: photoView(photo), warning: up.faces.length ? undefined : "No face found. Matching will use the whole image." });
}

export async function DELETE(req: Request) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  if (isDemoMode()) return fail(403, "Demo vault is read-only.");
  const publicId = new URL(req.url).searchParams.get("publicId") ?? "";
  const idx = profile.vault.findIndex((p) => p.publicId === publicId);
  if (idx < 0) return fail(404, "No such photo.");
  profile.vault.splice(idx, 1);
  await saveProfile(profile);
  await deleteAsset(publicId).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
