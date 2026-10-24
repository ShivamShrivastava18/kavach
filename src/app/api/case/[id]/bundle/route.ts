import { NextResponse } from "next/server";
import JSZip from "jszip";
import { readFileSync } from "node:fs";
import path from "node:path";
import { currentProfile, fail } from "@/lib/api";
import { blurTransformation, derivedBuffer } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { getCase } from "@/lib/store";

export const maxDuration = 30;

/** Evidence bundle: evidence.json, the stamped blurred exhibit, both complaint drafts. Never the original. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  const { id } = await ctx.params;
  const c = await getCase(profile.id, id);
  if (!c) return fail(404, "No such case.");

  let exhibit: Buffer;
  try {
    exhibit = isDemoMode()
      ? readFileSync(path.join(process.cwd(), "public", "demo", "exhibit-blurred.png"))
      : await derivedBuffer(c.exhibitPublicId, blurTransformation({ caseId: c.id, sha256: c.exhibitSha256, at: c.createdAt }));
  } catch (e) {
    console.error("[kavach] bundle exhibit fetch failed:", (e as Error).message);
    return fail(502, "Could not fetch the blurred exhibit.");
  }

  const evidence = {
    kavach_case_id: c.id,
    generated_at: new Date().toISOString(),
    complainant: profile.name,
    platform: c.platform,
    post_url: c.postUrl ?? null,
    first_seen: c.createdAt,
    exhibit: {
      sha256_of_original_as_received: c.exhibitSha256,
      faces_detected: c.exhibitFaces.length,
      explicit_content_flagged: c.explicit,
      moderation: c.moderation ?? null,
      note: "The original is held in private storage and is never included in this bundle. It can be released to law enforcement by the complainant.",
    },
    derivation: {
      verdict: c.match.verdict,
      similarity: c.match.score,
      mirrored: c.match.mirrored,
      methods: c.match.methods,
      parts: c.match.parts,
      matched_registered_photo: c.matchedPhoto ? { registered_at: c.matchedPhoto.uploadedAt } : null,
      how: "Perceptual hashes (Cloudinary pHash on the full image; Kavach pHash and dHash on the face crop) compared by Hamming distance, each comparison also run against the mirrored suspect. Bands: >=0.80 derived, 0.60-0.79 likely, <0.60 none.",
    },
    drafts: c.drafts ? { provider: c.drafts.provider, fallback: c.drafts.fallback, severity: c.drafts.severity } : null,
    software: "Kavach, MIT, https://github.com/ShivamShrivastava18/kavach",
  };

  const zip = new JSZip();
  zip.file("evidence.json", JSON.stringify(evidence, null, 2));
  zip.file(`exhibit-blurred-${c.id}.${isDemoMode() ? "png" : "jpg"}`, exhibit);
  if (c.drafts) {
    zip.file(`complaint-platform-${c.id}.txt`, c.drafts.platform);
    zip.file(`complaint-portal-${c.id}.txt`, c.drafts.portal);
    zip.file(`what-was-done-${c.id}.txt`, c.drafts.description);
  }
  const body = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(new Blob([new Uint8Array(body)]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="kavach-evidence-${c.id}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
