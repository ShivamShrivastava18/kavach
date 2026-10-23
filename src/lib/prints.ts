import sharp from "sharp";
import { faceCrop, fingerprint, mirror, type Box } from "./fingerprint";
import type { PhotoPrints } from "./match";

/** Cloudinary face coordinates are [x, y, width, height]. */
export function firstFaceBox(faces: number[][]): Box | undefined {
  const f = faces[0];
  if (!f || f.length < 4) return undefined;
  return { x: f[0], y: f[1], width: f[2], height: f[3] };
}

export async function computePrints(
  buf: Buffer,
  faces: number[][],
  cldPhash?: string,
  faceCropFromCloudinary?: Buffer,
): Promise<PhotoPrints> {
  const mirrored = await mirror(buf);
  const out: PhotoPrints = {
    cldPhash,
    full: await fingerprint(buf),
    fullMirror: await fingerprint(mirrored),
  };
  const box = firstFaceBox(faces);
  if (faceCropFromCloudinary) {
    out.face = await fingerprint(faceCropFromCloudinary);
    out.faceMirror = await fingerprint(await mirror(faceCropFromCloudinary));
  } else if (box) {
    const W = (await sharp(buf).metadata()).width ?? 0;
    out.face = await fingerprint(await faceCrop(buf, box));
    out.faceMirror = await fingerprint(await faceCrop(mirrored, { ...box, x: W - box.x - box.width }));
  }
  return out;
}
