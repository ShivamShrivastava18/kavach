import type { ParsedDraft } from "./types";

const MAX_CHARS = 2000;
const PLACEHOLDER = /\[(victim[_ ]?name|post[_ ]?url)\]/i;

/**
 * The model only writes prose that is inserted into the templates, so the facts, hashes and section
 * numbers cannot be lost. What can go wrong: empty text, runaway length, or a placeholder it did not keep
 * exactly (so the restore step could not fill it).
 */
export function validateDraft(d: ParsedDraft): ParsedDraft | null {
  for (const text of [d.description, d.narrative]) {
    const t = text.trim();
    if (!t || t.length > MAX_CHARS) return null;
    if (PLACEHOLDER.test(t)) return null;
  }
  return { description: d.description.trim(), narrative: d.narrative.trim(), severity: d.severity };
}
