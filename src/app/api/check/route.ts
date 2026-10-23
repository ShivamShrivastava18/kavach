import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { currentProfile, fail, readImageField } from "@/lib/api";
import { derivedBuffer, faceTransformation, uploadPrivate } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { bestMatch } from "@/lib/match";
import { computePrints } from "@/lib/prints";
import { newId, saveCase } from "@/lib/store";
import { demoCase } from "@/lib/demo/seed";
import type { CaseRecord } from "@/lib/types";


const PLATFORMS = new Set(["Instagram", "X", "WhatsApp", "Telegram", "Facebook", "Snapchat", "Other"]);

type ModerationEntry = { kind?: string; status?: string; response?: { moderation_labels?: { confidence?: number; name?: string }[] } };

function isExplicit(moderation: unknown, rejected: boolean): boolean {
  if (rejected) return true;
  if (!Array.isArray(moderation)) return false;
  return (moderation as ModerationEntry[]).some((m) =>
    (m.response?.moderation_labels ?? []).some((l) => /nudity|explicit|sexual/i.test(l.name ?? "") && (l.confidence ?? 0) >= 60),
  );
}

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
  const moderation = process.env.CLOUDINARY_MODERATION === "1" ? "aws_rek" : undefined;
  const up = await uploadPrivate(img.buf, `kavach/${profile.id}/exhibits`, { moderation, publicId: caseId });
  let faceCropBuf: Buffer | undefined;
  if (up.faces.length) {
    try {
      faceCropBuf = await derivedBuffer(up.publicId, faceTransformation());
    } catch {
      faceCropBuf = undefined;
    }
  }
  const prints = await computePrints(img.buf, up.faces, up.phash, faceCropBuf);
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
    explicit: isExplicit(up.moderation, up.moderationRejected),
    moderation: up.moderation,
    match,
    matchedPhoto: matched ? { publicId: matched.publicId, uploadedAt: matched.uploadedAt } : undefined,
  };
  await saveCase(record);
  return NextResponse.json({ caseId, verdict: match.verdict, score: match.score });
}
