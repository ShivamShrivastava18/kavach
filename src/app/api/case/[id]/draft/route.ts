import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { currentProfile, fail } from "@/lib/api";
import { derivedBuffer } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { draftComplaint } from "@/lib/llm";
import { getCase, saveCase } from "@/lib/store";
import { fillTemplates, type CaseFacts } from "@/lib/templates";
import { stampFor } from "@/lib/caseview";
import { encodeOverlayText } from "@/lib/cloudinary";

export const maxDuration = 60;

function demoFile(name: string): Buffer {
  return readFileSync(path.join(process.cwd(), "public", "demo", name));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  const { id } = await ctx.params;
  const c = await getCase(profile.id, id);
  if (!c) return fail(404, "No such case.");
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (c.drafts && !force) return NextResponse.json({ drafts: c.drafts });

  const facts: CaseFacts = {
    caseId: c.id,
    victimName: profile.name,
    platform: c.platform,
    postUrl: c.postUrl,
    firstSeen: c.createdAt.slice(0, 10),
    exhibitSha256: c.exhibitSha256,
    verdict: c.match.verdict,
    score: c.match.score,
    methods: c.match.methods,
    matchedPhotoDate: c.matchedPhoto?.uploadedAt.slice(0, 10),
    explicit: c.explicit,
  };
  const templates = fillTemplates(facts);

  let exhibitBlurPng: Buffer;
  let matchedBlurPng: Buffer | undefined;
  if (isDemoMode()) {
    exhibitBlurPng = demoFile("exhibit-blurred.png");
    matchedBlurPng = demoFile("priya-1-blurred.png");
  } else {
    const stamp = encodeOverlayText(stampFor(c));
    exhibitBlurPng = await derivedBuffer(
      c.exhibitPublicId,
      `c_limit,w_768,h_768/e_pixelate_faces:30,e_blur:600/l_text:Arial_20_bold:${stamp},co_white,b_rgb:000000bb,g_south,y_0,w_768,c_fit/f_png`,
    );
    if (c.matchedPhoto && c.match.verdict !== "none") {
      matchedBlurPng = await derivedBuffer(c.matchedPhoto.publicId, "c_fill,g_face,w_400,h_400/e_pixelate_faces:20,e_blur:400/f_png").catch(() => undefined);
    }
  }

  const drafts = await draftComplaint({ facts, templates, exhibitBlurPng, matchedBlurPng });
  c.drafts = drafts;
  await saveCase(c);
  return NextResponse.json({ drafts });
}
