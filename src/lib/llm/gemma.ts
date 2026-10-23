import { GoogleGenAI } from "@google/genai";
import { required } from "../env";
import type { ProviderResult } from "./types";

export const GEMMA_MODELS = ["gemma-4-26b-a4b-it", "gemma-4-31b-it"] as const;

function client() {
  return new GoogleGenAI({ apiKey: required("GEMINI_API_KEY") });
}

async function call(model: string, prompt: string, images: Buffer[]): Promise<string> {
  const ai = client();
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    ...images.map((b) => ({ inlineData: { mimeType: "image/png", data: b.toString("base64") } })),
    { text: prompt },
  ];
  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: { temperature: 0.3, maxOutputTokens: 4096 },
  });
  const text = res.text;
  if (!text) throw new Error(`empty response from ${model}`);
  return text;
}

function looksImageRelated(e: unknown): boolean {
  const m = String((e as Error)?.message ?? e).toLowerCase();
  return /image|inline|mime|multimodal|modality|unsupported/.test(m);
}

/** Tries each Gemma model with images; on an image-related failure retries that model text-only. */
export async function gemmaProvider(prompt: string, images: Buffer[], textOnlyPrompt?: string): Promise<ProviderResult> {
  let lastErr: unknown;
  for (const model of GEMMA_MODELS) {
    try {
      return { raw: await call(model, prompt, images), model };
    } catch (e) {
      lastErr = e;
      if (images.length && looksImageRelated(e)) {
        try {
          return { raw: await call(model, textOnlyPrompt ?? prompt, []), model, textOnly: true };
        } catch (e2) {
          lastErr = e2;
        }
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
