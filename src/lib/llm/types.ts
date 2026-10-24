import type { CaseFacts } from "../templates";

export type DraftInput = {
  facts: CaseFacts;
  templates: { platform: string; portal: string };
  exhibitBlurPng: Buffer;
  matchedBlurPng?: Buffer;
};

export type Severity = "low" | "medium" | "high";

/** What the model writes: the plain-language parts. The legal complaints are templated around them. */
export type ParsedDraft = { description: string; narrative: string; severity: Severity };

export type DraftOutput = { description: string; platform: string; portal: string; severity: Severity; provider: string; fallback: boolean; textOnly?: boolean };

export type ProviderResult = { raw: string; model: string; textOnly?: boolean };

export type Provider = (prompt: string, images: Buffer[]) => Promise<ProviderResult>;
