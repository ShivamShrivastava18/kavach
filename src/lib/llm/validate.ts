import { VERIFY_LINE } from "../templates";
import type { ParsedDraft } from "./types";

export type DraftFacts = { caseId: string; exhibitSha256: string; victimName: string };

function withVerifyLine(text: string): string {
  const t = text.trim();
  return t.endsWith(VERIFY_LINE) ? t : `${t}\n\n${VERIFY_LINE}`;
}

/**
 * A complaint the model rewrote must still carry the case id, the SHA-256 prefix and the victim's
 * restored name. Anything else means the model drifted and the template is safer.
 */
export function validateDraft(d: ParsedDraft, facts: DraftFacts): ParsedDraft | null {
  const shaPrefix = facts.exhibitSha256.slice(0, 16);
  for (const text of [d.platform, d.portal]) {
    if (!text.includes(facts.caseId)) return null;
    if (!text.includes(shaPrefix)) return null;
    if (!text.includes(facts.victimName)) return null;
    if (/\[victim[_ ]?name\]/i.test(text) || /\[post[_ ]?url\]/i.test(text)) return null;
  }
  return { ...d, platform: withVerifyLine(d.platform), portal: withVerifyLine(d.portal) };
}
