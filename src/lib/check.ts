import { createHash } from "node:crypto";
import { uploadPrivate } from "./cloudinary";
import { isExplicit, isModerationQuotaError, MODERATION_PARAM } from "./moderation";
import { bestMatch } from "./match";
import { computePrints } from "./prints";
import { newId, saveCase, saveProfile } from "./store";
import type { CaseRecord, Profile, VaultPhoto } from "./types";

/** Uploads a photo privately, fingerprints it, and appends it to the profile's vault (saved). */
export async function registerPhoto(profile: Profile, buf: Buffer): Promise<VaultPhoto> {
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const up = await uploadPrivate(buf, `kavach/${profile.id}/vault`);
  const prints = await computePrints(buf, up.faces, up.phash);
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
  return photo;
}

export type CheckOptions = {
  platform: string;
  postUrl?: string;
  /** Ask Cloudinary for explicit-content moderation (costs one add-on operation). */
  moderate: boolean;
  /** Set when Kavach derived the exhibit itself to show what an edit scores. */
  simulated?: string;
};

/**
 * The check: store the suspect privately, fingerprint it, score it against every registered photo,
 * and write the case. When the moderation add-on's quota is spent, the exhibit is stored unmoderated
 * and the case says so.
 */
export async function runCheck(profile: Profile, buf: Buffer, opts: CheckOptions): Promise<CaseRecord> {
  const caseId = newId();
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const moderation = opts.moderate ? MODERATION_PARAM : undefined;
  let moderated = Boolean(moderation);
  let up;
  try {
    up = await uploadPrivate(buf, `kavach/${profile.id}/exhibits`, { moderation, publicId: caseId });
  } catch (e) {
    if (!moderation || !isModerationQuotaError(e)) throw e;
    console.warn("[kavach] moderation quota exhausted, storing exhibit without moderation");
    moderated = false;
    up = await uploadPrivate(buf, `kavach/${profile.id}/exhibits`, { publicId: caseId });
  }
  const prints = await computePrints(buf, up.faces, up.phash);
  const match = bestMatch(prints, profile.vault.map((v) => v.prints));
  const matched = match.bestIndex >= 0 ? profile.vault[match.bestIndex] : undefined;
  const record: CaseRecord = {
    id: caseId,
    profileId: profile.id,
    createdAt: new Date().toISOString(),
    platform: opts.platform,
    postUrl: opts.postUrl,
    exhibitPublicId: up.publicId,
    exhibitSha256: sha256,
    exhibitFaces: up.faces,
    explicit: isExplicit(up.moderation),
    moderation: up.moderation,
    moderated,
    match,
    matchedPhoto: matched ? { publicId: matched.publicId, uploadedAt: matched.uploadedAt } : undefined,
    simulated: opts.simulated,
  };
  await saveCase(record);
  if (!opts.simulated) {
    profile.lastCaseId = record.id;
    await saveProfile(profile);
  }
  return record;
}
