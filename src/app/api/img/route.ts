import { NextResponse } from "next/server";
import { derivedBuffer, encodeOverlayText, faceTransformation, thumbTransformation } from "@/lib/cloudinary";
import { isDemoMode } from "@/lib/env";
import { verifyImg, type ImgKind } from "@/lib/imgtoken";
import { DEMO_FILES } from "@/lib/demo/seed";


function transformationFor(kind: ImgKind, stamp?: string): string {
  switch (kind) {
    case "thumb":
      return thumbTransformation();
    case "face":
      return faceTransformation();
    case "blurthumb":
      return "c_fill,g_face,w_400,h_400/e_pixelate_faces:20,e_blur:400";
    case "blur": {
      const text = stamp ?? "KAVACH EVIDENCE";
      return `c_limit,w_1200,h_1200/e_pixelate_faces:30,e_blur:600/l_text:Arial_28_bold:${encodeOverlayText(text)},co_white,b_rgb:000000bb,g_south,y_0,w_1200,c_fit`;
    }
  }
}

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const claims = verifyImg(t);
  if (!claims) return NextResponse.json({ error: "This image link has expired. Reload the page." }, { status: 410 });

  if (isDemoMode()) {
    const file = DEMO_FILES[`${claims.publicId}:${claims.kind}`];
    if (!file) return NextResponse.json({ error: "No demo image." }, { status: 404 });
    return NextResponse.redirect(new URL(file, req.url));
  }

  try {
    const buf = await derivedBuffer(claims.publicId, transformationFor(claims.kind, claims.stamp));
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=60" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
