type Label = { name?: string; parent_name?: string; confidence?: number };
type ModerationEntry = { kind?: string; status?: string; response?: { moderation_labels?: Label[] } };

export const EXPLICIT_MIN_CONFIDENCE = 60;

/** Cloudinary moderation parameter: Rekognition, explicit-nudity category only, 60% confidence. */
export const MODERATION_PARAM = "aws_rek:explicit_nudity:0.6";

/** True only when Rekognition reports explicit nudity (not "Non-Explicit", not suggestive, not violence). */
export function isExplicit(moderation: unknown): boolean {
  if (!Array.isArray(moderation)) return false;
  return (moderation as ModerationEntry[]).some((m) =>
    (m.response?.moderation_labels ?? []).some((l) => {
      const name = l.name ?? "";
      const parent = l.parent_name ?? "";
      if (/^non-explicit/i.test(name) || /^non-explicit/i.test(parent)) return false;
      const explicit = /^explicit nudity$/i.test(name) || /^explicit nudity$/i.test(parent);
      return explicit && (l.confidence ?? 0) >= EXPLICIT_MIN_CONFIDENCE;
    }),
  );
}
