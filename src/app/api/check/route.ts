import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { currentProfile, fail, readImageField } from "@/lib/api";
import { uploadPrivate } from "@/lib/cloudinary";
import { isExplicit, isModerationQuotaError, MODERATION_PARAM } from "@/lib/moderation";
import { isDemoMode } from "@/lib/env";
import { bestMatch } from "@/lib/match";
import { computePrints } from "@/lib/prints";
import { newId, saveCase } from "@/lib/store";
import { demoCase } from "@/lib/demo/seed";
import type { CaseRecord } from "@/lib/types";


const PLATFORMS = new Set(["Instagram", "X", "WhatsApp", "Telegram", "Facebook", "Snapchat", "Other"]);

export async function POST(req: Request) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  if (isDemoMode()) {
    const c = demoCase();
    return NextResponse.json({ caseId: c.id, verdict: c.match.verdict, score: c.match.score, demo: true });
  }
  const form = await req.formData();
  const img = await readImageField(form);
  if ("error" in img) return fail(400, img.error);
  const platform = String(form.get("platform") ?? "Other");
  if (!PLATFORMS.has(platform)) return fail(400, "Pick the platform it appeared on.");
  const postUrlRaw = String(form.get("postUrl") ?? "").trim();
  const postUrl = postUrlRaw && /^https?:\/\//i.test(postUrlRaw) ? postUrlRaw.slice(0, 500) : undefined;

  const caseId = newId();
  const sha256 = createHash("sha256").update(img.buf).digest("hex");
  const moderation = process.env.CLOUDINARY_MODERATION === "1" ? MODERATION_PARAM : undefined;
  let up;
  let moderated = Boolean(moderation);
  try {
    try {
      up = await uploadPrivate(img.buf, `kavach/${profile.id}/exhibits`, { moderation, publicId: caseId });
    } catch (e) {
      if (!moderation || !isModerationQuotaError(e)) throw e;
      // The free Rekognition quota is spent: store the exhibit anyway, unmoderated, and say so on the case.
      console.warn("[kavach] moderation quota exhausted, storing exhibit without moderation");
      moderated = false;
      up = await uploadPrivate(img.buf, `kavach/${profile.id}/exhibits`, { publicId: caseId });
    }
  } catch (e) {
    console.error("[kavach] exhibit upload failed:", (e as Error).message);
    return fail(502, "Storage is not responding. Try again in a moment.");
  }
  const prints = await computePrints(img.buf, up.faces, up.phash);
  const match = bestMatch(prints, profile.vault.map((v) => v.prints));
  const matched = match.bestIndex >= 0 ? profile.vault[match.bestIndex] : undefined;

  const record: CaseRecord = {
    id: caseId,
    profileId: profile.id,
    createdAt: new Date().toISOString(),
    platform,
    postUrl,
    exhibitPublicId: up.publicId,
    exhibitSha256: sha256,
    exhibitFaces: up.faces,
    explicit: isExplicit(up.moderation),
    moderation: up.moderation,
    moderated,
    match,
    matchedPhoto: matched ? { publicId: matched.publicId, uploadedAt: matched.uploadedAt } : undefined,
  };
  await saveCase(record);
  return NextResponse.json({ caseId, verdict: match.verdict, score: match.score });
}
