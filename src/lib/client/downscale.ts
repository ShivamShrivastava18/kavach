"use client";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Re-encodes an image as JPEG at most `maxEdge` px on its longer side (EXIF orientation applied by the
 * browser). Throws a plain-language error if the browser cannot decode it or it is still over 4 MB.
 */
export async function downscale(file: File, maxEdge = 2048): Promise<Blob> {
  if (typeof createImageBitmap !== "function") {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("That image is over 4 MB. Resize it and try again.");
    return file;
  }
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Your browser cannot read that image. Use JPG, PNG or WebP.");
  }
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot process that image.");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  let quality = 0.9;
  for (let i = 0; i < 4; i++) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) break;
    if (blob.size <= MAX_UPLOAD_BYTES) return blob;
    quality -= 0.15;
  }
  throw new Error("That image is still over 4 MB after resizing. Try a smaller one.");
}
