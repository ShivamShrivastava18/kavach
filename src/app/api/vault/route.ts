import { NextResponse } from "next/server";
import { currentProfile, fail, readImageField } from "@/lib/api";
import { registerPhoto } from "@/lib/check";
import { deleteAsset } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { saveProfile } from "@/lib/store";
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

  let photo;
  try {
    photo = await registerPhoto(profile, img.buf);
  } catch (e) {
    console.error("[kavach] vault upload failed:", (e as Error).message);
    return fail(502, "Storage is not responding. Try again in a moment.");
  }
  return NextResponse.json({ photo: photoView(photo), warning: photo.faces.length ? undefined : "No face found. Matching will use the whole image." });
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
