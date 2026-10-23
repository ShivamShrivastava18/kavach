import { signImg } from "./imgtoken";
import type { CaseRecord, VaultPhoto } from "./types";

const TOKEN_TTL = 10 * 60;

export function stampFor(c: CaseRecord): string {
  return `KAVACH EVIDENCE  case ${c.id}  sha256 ${c.exhibitSha256.slice(0, 16)}  ${c.createdAt}`;
}

export function caseView(c: CaseRecord) {
  return {
    id: c.id,
    createdAt: c.createdAt,
    platform: c.platform,
    postUrl: c.postUrl,
    exhibitSha256: c.exhibitSha256,
    exhibitFaces: c.exhibitFaces.length,
    explicit: c.explicit,
    match: c.match,
    matchedPhoto: c.matchedPhoto,
    drafts: c.drafts,
    exhibitBlur: `/api/img?t=${signImg(c.exhibitPublicId, "blur", stampFor(c), TOKEN_TTL)}`,
    matchedThumb: c.matchedPhoto ? `/api/img?t=${signImg(c.matchedPhoto.publicId, "thumb", undefined, TOKEN_TTL)}` : undefined,
  };
}

export type CaseView = ReturnType<typeof caseView>;

export function photoView(p: VaultPhoto) {
  return {
    publicId: p.publicId,
    uploadedAt: p.uploadedAt,
    sha256: p.sha256,
    faces: p.faces.length,
    quality: p.quality,
    cldPhash: p.cldPhash,
    thumb: `/api/img?t=${signImg(p.publicId, "thumb", undefined, TOKEN_TTL)}`,
  };
}
