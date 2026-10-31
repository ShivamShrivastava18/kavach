/** Encodes text for a Cloudinary `l_text` overlay (slashes and commas must be double-escaped). Pure; safe for the client bundle. */
export function encodeOverlayText(text: string): string {
  return encodeURIComponent(text).replace(/%2F/gi, "%252F").replace(/,/g, "%252C").replace(/%2C/gi, "%252C");
}
