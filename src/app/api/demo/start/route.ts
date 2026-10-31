import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { registerPhoto, runCheck } from "@/lib/check";
import { isDemoMode } from "@/lib/env";
import { demoCase, DEMO_PROFILE_ID } from "@/lib/demo/seed";
import { buildSampleProfile, SAMPLE_FILES } from "@/lib/sample";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { saveProfile } from "@/lib/store";

export const maxDuration = 60;

function withSession(res: NextResponse, profileId: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, signSession(profileId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

async function fetchSample(req: Request, pathname: string): Promise<Buffer> {
  const r = await fetch(new URL(pathname, req.url));
  if (!r.ok) throw new Error(`sample ${pathname} ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/**
 * "See it in 60 seconds": a throwaway shield with the two sample portraits registered and the sample
 * morph checked, in one call. The session cookie is set so the case page opens straight away.
 */
export async function POST(req: Request) {
  if (isDemoMode()) {
    const c = demoCase();
    return withSession(NextResponse.json({ caseId: c.id, demo: true }), DEMO_PROFILE_ID);
  }
  try {
    const profile = buildSampleProfile();
    await saveProfile(profile);
    for (const p of SAMPLE_FILES.portraits) await registerPhoto(profile, await fetchSample(req, p));
    const morph = await fetchSample(req, SAMPLE_FILES.morph);
    const record = await runCheck(profile, morph, { platform: "Instagram", postUrl: "https://instagram.com/p/sample-post", moderate: false });
    return withSession(NextResponse.json({ caseId: record.id, profileId: profile.id, verdict: record.match.verdict, score: record.match.score }), profile.id);
  } catch (e) {
    console.error("[kavach] guided demo failed:", (e as Error).message);
    return fail(502, "Could not start the demo. Try again in a moment.");
  }
}
