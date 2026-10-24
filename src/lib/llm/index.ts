import { llmProvider } from "../env";
import { redact, restore } from "../redact";
import { claudeProvider } from "./claude";
import { demoDraft } from "./demo";
import { gemmaProvider } from "./gemma";
import { parseDraft } from "./parse";
import { validateDraft } from "./validate";
import { buildPrompt } from "./prompt";
import type { DraftInput, DraftOutput } from "./types";

export async function draftComplaint(input: DraftInput): Promise<DraftOutput> {
  const provider = llmProvider();
  if (provider === "demo") return demoDraft(input);
  if (provider === "gemma" && !process.env.GEMINI_API_KEY) return demoDraft(input);
  if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) return demoDraft(input);

  const facts = { name: input.facts.victimName, url: input.facts.postUrl };
  const redacted: DraftInput = {
    ...input,
    facts: { ...input.facts, victimName: "[VICTIM_NAME]", postUrl: input.facts.postUrl ? "[POST_URL]" : undefined },
    templates: {
      platform: redact(input.templates.platform, facts),
      portal: redact(input.templates.portal, facts),
    },
  };
  const images = [redacted.exhibitBlurPng, ...(redacted.matchedBlurPng ? [redacted.matchedBlurPng] : [])];
  const prompt = buildPrompt(redacted, { hasImages: true });
  const textOnlyPrompt = buildPrompt(redacted, { hasImages: false });

  try {
    const result =
      provider === "claude" ? await claudeProvider(prompt, images) : await gemmaProvider(prompt, images, textOnlyPrompt);
    const parsed = parseDraft(result.raw);
    if (!parsed) throw new Error(`unparseable response from ${result.model}`);
    const restored = {
      description: restore(parsed.description, facts),
      platform: restore(parsed.platform, facts),
      portal: restore(parsed.portal, facts),
      severity: parsed.severity,
    };
    const valid = validateDraft(restored, { caseId: input.facts.caseId, exhibitSha256: input.facts.exhibitSha256, victimName: input.facts.victimName });
    if (!valid) throw new Error(`draft from ${result.model} lost case facts`);
    return {
      ...valid,
      provider: result.model,
      fallback: false,
      textOnly: result.textOnly,
    };
  } catch (e) {
    console.error("[kavach] draft provider failed, using fallback text:", (e as Error).message);
    return { ...demoDraft(input), provider: `fallback (${provider} failed)`, fallback: true };
  }
}
