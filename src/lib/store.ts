import { randomBytes } from "node:crypto";
import { isDemoMode } from "./env";
import { getJson, putJson } from "./cloudinary";
import type { CaseRecord, Profile } from "./types";
import { DEMO_PROFILE_ID, demoCase, demoProfile } from "./demo/seed";

const demoCases = new Map<string, CaseRecord>();

export function newId(): string {
  // 12 chars of base36 from 9 random bytes.
  return BigInt("0x" + randomBytes(9).toString("hex")).toString(36).padStart(12, "0").slice(0, 12);
}

export function profileKey(profileId: string): string {
  return `kavach/${profileId}/profile.json`;
}

export function caseKey(profileId: string, caseId: string): string {
  return `kavach/${profileId}/cases/${caseId}.json`;
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (isDemoMode()) return id === DEMO_PROFILE_ID ? demoProfile() : null;
  return getJson<Profile>(profileKey(id));
}

export async function saveProfile(p: Profile): Promise<void> {
  if (isDemoMode()) return;
  await putJson(profileKey(p.id), p);
}

export async function getCase(profileId: string, caseId: string): Promise<CaseRecord | null> {
  if (isDemoMode()) {
    if (profileId !== DEMO_PROFILE_ID) return null;
    return demoCases.get(caseId) ?? (caseId === demoCase().id ? demoCase() : null);
  }
  const c = await getJson<CaseRecord>(caseKey(profileId, caseId));
  return c && c.profileId === profileId ? c : null;
}

export async function saveCase(c: CaseRecord): Promise<void> {
  if (isDemoMode()) {
    demoCases.set(c.id, c);
    return;
  }
  await putJson(caseKey(c.profileId, c.id), c);
}
