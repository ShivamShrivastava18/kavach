import { NextResponse } from "next/server";
import { currentProfile, fail } from "@/lib/api";
import { runCheck } from "@/lib/check";
import { derivedBuffer } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { SIMULATIONS } from "@/lib/simulate";

export const maxDuration = 60;

/**
 * "What a harasser would do": derive the usual edits of a registered photo and run each through the
 * normal check, so the owner can see every one of them caught. No moderation call: these are her own photo.
 */
export async function POST(req: Request) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  if (isDemoMode()) return fail(403, "Simulation needs live keys.");
  const body = (await req.json().catch(() => ({}))) as { publicId?: string };
  const photo = profile.vault.find((p) => p.publicId === body.publicId);
  if (!photo) return fail(404, "No such photo in your vault.");

  const results: { kind: string; label: string; caseId?: string; verdict?: string; score?: number; error?: string }[] = [];
  for (const sim of SIMULATIONS) {
    try {
      const buf = await derivedBuffer(photo.publicId, `${sim.transformation}/f_jpg`);
      const record = await runCheck(profile, buf, { platform: "Other", moderate: false, simulated: sim.kind });
      results.push({ kind: sim.kind, label: sim.label, caseId: record.id, verdict: record.match.verdict, score: record.match.score });
    } catch (e) {
      console.error(`[kavach] simulation ${sim.kind} failed:`, (e as Error).message);
      results.push({ kind: sim.kind, label: sim.label, error: "Could not derive this edit." });
    }
  }
  return NextResponse.json({ results });
}
