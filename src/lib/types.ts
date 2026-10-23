import type { MatchResult, PhotoPrints } from "./match";

export type VaultPhoto = {
  publicId: string;
  uploadedAt: string;
  sha256: string;
  width: number;
  height: number;
  cldPhash?: string;
  faces: number[][];
  quality?: number;
  prints: PhotoPrints;
};

export type Profile = {
  id: string;
  name: string;
  pinHash: string;
  salt: string;
  createdAt: string;
  vault: VaultPhoto[];
};

export type Drafts = {
  description: string;
  platform: string;
  portal: string;
  severity: string;
  provider: string;
  fallback: boolean;
  textOnly?: boolean;
};

export type CaseRecord = {
  id: string;
  profileId: string;
  createdAt: string;
  platform: string;
  postUrl?: string;
  exhibitPublicId: string;
  exhibitSha256: string;
  exhibitFaces: number[][];
  explicit: boolean;
  moderation?: unknown;
  match: MatchResult;
  matchedPhoto?: { publicId: string; uploadedAt: string };
  drafts?: Drafts;
};
