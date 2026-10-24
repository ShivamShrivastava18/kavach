import { NextResponse } from "next/server";
import { currentProfile, fail } from "@/lib/api";
import { privateDownloadUrl } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { getCase } from "@/lib/store";

const ORIGINAL_TTL_SEC = 10 * 60;

/**
 * Victim-only, time-limited link to the unblurred original, for attaching to a police complaint.
 * Cloudinary's private_download_url expires in 10 minutes and is never shown in the UI until confirmed.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  const { id } = await ctx.params;
  const c = await getCase(profile.id, id);
  if (!c) return fail(404, "No such case.");
  if (isDemoMode()) return fail(403, "The demo case has no downloadable original.");
  const url = privateDownloadUrl(c.exhibitPublicId, "jpg", ORIGINAL_TTL_SEC);
  return NextResponse.json({ url, expiresInSec: ORIGINAL_TTL_SEC });
}
