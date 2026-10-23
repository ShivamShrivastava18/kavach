import type { CaseFacts } from "../templates";

export type DraftInput = {
  facts: CaseFacts;
  templates: { platform: string; portal: string };
  exhibitBlurPng: Buffer;
  matchedBlurPng?: Buffer;
};

export type Severity = "low" | "medium" | "high";

export type ParsedDraft = { description: string; platform: string; portal: string; severity: Severity };

export type DraftOutput = ParsedDraft & { provider: string; fallback: boolean; textOnly?: boolean };

export type ProviderResult = { raw: string; model: string; textOnly?: boolean };

export type Provider = (prompt: string, images: Buffer[]) => Promise<ProviderResult>;
