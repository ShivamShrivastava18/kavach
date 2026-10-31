import { NextResponse } from "next/server";
import { currentProfile, fail, readImageField } from "@/lib/api";
import { runCheck } from "@/lib/check";
import { isDemoMode } from "@/lib/env";
import { demoCase } from "@/lib/demo/seed";

export const maxDuration = 60;

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

  try {
    const record = await runCheck(profile, img.buf, { platform, postUrl, moderate: process.env.CLOUDINARY_MODERATION === "1" });
    return NextResponse.json({ caseId: record.id, verdict: record.match.verdict, score: record.match.score });
  } catch (e) {
    console.error("[kavach] exhibit upload failed:", (e as Error).message);
    return fail(502, "Storage is not responding. Try again in a moment.");
  }
}
