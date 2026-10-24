import { llmProvider } from "../env";
import { redact, restore } from "../redact";
import { fillTemplates } from "../templates";
import { claudeProvider } from "./claude";
import { demoDraft } from "./demo";
import { gemmaProvider } from "./gemma";
import { parseDraft } from "./parse";
import { validateDraft } from "./validate";
import { buildPrompt } from "./prompt";
import type { DraftInput, DraftOutput } from "./types";

/**
 * The model writes the plain-language parts (what happened, in her words, and how serious it is).
 * The complaints themselves are templated around that narrative, so hashes, dates and section numbers
 * never depend on the model. Names and URLs are redacted before the call and restored after.
 */
export async function draftComplaint(input: DraftInput): Promise<DraftOutput> {
  const provider = llmProvider();
  if (provider === "demo") return demoDraft(input);
  if (provider === "gemma" && !process.env.GEMINI_API_KEY) return demoDraft(input);
  if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) return demoDraft(input);

  const facts = { name: input.facts.victimName, url: input.facts.postUrl };
  const redacted: DraftInput = {
    ...input,
    facts: { ...input.facts, victimName: "[VICTIM_NAME]", postUrl: input.facts.postUrl ? "[POST_URL]" : undefined },
    templates: { platform: redact(input.templates.platform, facts), portal: redact(input.templates.portal, facts) },
  };
  const images = [redacted.exhibitBlurPng];
  const prompt = buildPrompt(redacted, { hasImages: true });
  const textOnlyPrompt = buildPrompt(redacted, { hasImages: false });

  try {
    const result = provider === "claude" ? await claudeProvider(prompt, images) : await gemmaProvider(prompt, images, textOnlyPrompt);
    const parsed = parseDraft(result.raw);
    if (!parsed) throw new Error(`unparseable response from ${result.model}`);
    const valid = validateDraft(parsed);
    if (!valid) throw new Error(`draft from ${result.model} failed validation`);
    const narrative = restore(valid.narrative, facts);
    const complaints = fillTemplates(input.facts, narrative);
    return {
      description: restore(valid.description, facts),
      platform: complaints.platform,
      portal: complaints.portal,
      severity: valid.severity,
      provider: result.model,
      fallback: false,
      textOnly: result.textOnly,
    };
  } catch (e) {
    console.error("[kavach] draft provider failed, using fallback text:", (e as Error).message);
    return { ...demoDraft(input), provider: `fallback (${provider} failed)`, fallback: true };
  }
}
