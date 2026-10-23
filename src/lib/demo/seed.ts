import seed from "./seed.json";
import type { CaseRecord, Drafts, Profile } from "../types";

export const DEMO_PROFILE_ID = "priya-demo";

type Seed = { profile: Profile; case: CaseRecord; drafts: Drafts };
const data = seed as unknown as Seed;

export function demoProfile(): Profile {
  return structuredClone(data.profile);
}

export function demoCase(): CaseRecord {
  return structuredClone(data.case);
}

export function demoDrafts(): Drafts {
  return structuredClone(data.drafts);
}

/** Public files served in demo mode in place of Cloudinary derivatives. */
export const DEMO_FILES: Record<string, string> = {
  "demo/priya-1:thumb": "/demo/priya-1.png",
  "demo/priya-2:thumb": "/demo/priya-2.png",
  "demo/priya-1:face": "/demo/priya-1.png",
  "demo/exhibit:blur": "/demo/exhibit-blurred.png",
  "demo/priya-1:blurthumb": "/demo/priya-1-blurred.png",
};
