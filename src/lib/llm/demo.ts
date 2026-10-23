import { demoDrafts } from "../demo/seed";
import type { DraftInput, DraftOutput } from "./types";

const DESCRIPTIONS: Record<DraftInput["facts"]["verdict"], string> = {
  derived:
    "The image was made from your registered photo. The face region matches closely; the frame has been cropped, recoloured and captioned to look like a new picture.",
  likely:
    "The image was likely made from your registered photo. The face region is a close match; the rest of the frame has been altered enough that Kavach reports it as likely rather than certain.",
  none:
    "No registered photo matched this image. The complaint drafted below rests on your identity and the absence of consent, not on fingerprint evidence. If you have the original photo, add it to your vault and check again.",
};

export function demoDraft(input: DraftInput): DraftOutput {
  const seeded = demoDrafts();
  const sameCase = input.facts.caseId === "demo-case";
  return {
    description: sameCase ? seeded.description : DESCRIPTIONS[input.facts.verdict],
    platform: input.templates.platform,
    portal: input.templates.portal,
    severity: input.facts.explicit ? "high" : input.facts.verdict === "none" ? "medium" : "high",
    provider: "demo",
    fallback: false,
  };
}
