import { v2 as cld, type UploadApiResponse } from "cloudinary";

cld.config({ secure: true });

export type UploadResult = {
  publicId: string;
  width: number;
  height: number;
  phash?: string;
  faces: number[][];
  quality?: number;
  moderation?: unknown;
  moderationRejected: boolean;
};

type ModerationEntry = { kind?: string; status?: string; response?: unknown };

export async function uploadPrivate(
  buf: Buffer,
  folder: string,
  opts: { moderation?: string; publicId?: string } = {},
): Promise<UploadResult> {
  const res = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder,
        public_id: opts.publicId,
        type: "private",
        resource_type: "image",
        phash: true,
        faces: true,
        quality_analysis: true,
        colors: true,
        moderation: opts.moderation,
        overwrite: true,
        invalidate: true,
      },
      (err, result) => (err || !result ? reject(err ?? new Error("empty upload result")) : resolve(result)),
    );
    stream.end(buf);
  });
  const moderation = (res as unknown as { moderation?: ModerationEntry[] }).moderation;
  const rejected = Array.isArray(moderation) && moderation.some((m) => m.status === "rejected");
  if (rejected) {
    // A rejected asset cannot be delivered, not even blurred. We keep the labels as evidence
    // and approve delivery so the victim can see the stamped, blurred exhibit.
    await cld.api.update(res.public_id, { type: "private", moderation_status: "approved" });
  }
  const qa = (res as unknown as { quality_analysis?: { focus?: number } }).quality_analysis;
  return {
    publicId: res.public_id,
    width: res.width,
    height: res.height,
    phash: (res as unknown as { phash?: string }).phash,
    faces: (res as unknown as { faces?: number[][] }).faces ?? [],
    quality: qa?.focus,
    moderation,
    moderationRejected: rejected,
  };
}

export function encodeOverlayText(text: string): string {
  return encodeURIComponent(text).replace(/%2F/gi, "%252F").replace(/,/g, "%252C").replace(/%2C/gi, "%252C");
}

export function blurTransformation(stamp: { caseId: string; sha256: string; at: string }): string {
  const text = encodeOverlayText(`KAVACH EVIDENCE  case ${stamp.caseId}  sha256 ${stamp.sha256.slice(0, 16)}  ${stamp.at}`);
  return `e_pixelate_faces:30,e_blur:600/l_text:Arial_28_bold:${text},co_white,g_south,y_24`;
}

export function faceTransformation(): string {
  return "c_crop,g_face,w_512,h_512";
}

export function thumbTransformation(): string {
  return "c_fill,g_face,w_400,h_400";
}

export function signedDerivedUrl(publicId: string, transformation: string): string {
  return cld.url(publicId, {
    type: "private",
    resource_type: "image",
    sign_url: true,
    secure: true,
    raw_transformation: transformation,
  });
}

export async function derivedBuffer(publicId: string, transformation: string): Promise<Buffer> {
  const url = signedDerivedUrl(publicId, transformation);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`cloudinary derived fetch ${r.status} for ${publicId} (${transformation})`);
  return Buffer.from(await r.arrayBuffer());
}

export function privateDownloadUrl(publicId: string, format: string, expiresInSec: number, resourceType = "image"): string {
  return cld.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "private",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSec,
  });
}

export async function putJson(publicId: string, data: unknown): Promise<void> {
  const buf = Buffer.from(JSON.stringify(data));
  await new Promise<void>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      { public_id: publicId, resource_type: "raw", type: "private", overwrite: true, invalidate: true },
      (err) => (err ? reject(err) : resolve()),
    );
    stream.end(buf);
  });
}

export async function getJson<T>(publicId: string): Promise<T | null> {
  const url = privateDownloadUrl(publicId, "", 60, "raw");
  const r = await fetch(url, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`cloudinary json fetch ${r.status} for ${publicId}`);
  return (await r.json()) as T;
}

export async function deleteAsset(publicId: string, resourceType: "image" | "raw" = "image"): Promise<void> {
  await cld.uploader.destroy(publicId, { type: "private", resource_type: resourceType, invalidate: true });
}
