"use client";

/** Downscales an image file to at most `maxEdge` px on its longer side. Falls back to the original file. */
export async function downscale(file: File, maxEdge = 2048): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= 3.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), type, 0.92));
  } catch {
    return file;
  }
}
