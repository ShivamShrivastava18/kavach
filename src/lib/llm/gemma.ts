import { GoogleGenAI } from "@google/genai";
import { required } from "../env";
import type { ProviderResult } from "./types";

// Measured 24 Oct 2026: gemma-4-26b-a4b-it thinks for 400 to 1500 tokens before answering (25 to 35 s for a short
// JSON answer) and its image path returns an opaque 500 now and then. gemma-4-31b-it timed out on "OK", so it is not used.
export const GEMMA_MODEL = "gemma-4-26b-a4b-it";
const TOTAL_BUDGET_MS = 48_000;
const MIN_ATTEMPT_MS = 8_000;
const FAST_FAILURE_MS = 5_000;

export type GemmaCall = (model: string, prompt: string, images: Buffer[], timeoutMs: number) => Promise<string>;
type Deps = { call?: GemmaCall; now?: () => number };

const sdkCall: GemmaCall = async (model, prompt, images, timeoutMs) => {
  const ai = new GoogleGenAI({ apiKey: required("GEMINI_API_KEY") });
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    ...images.map((b) => ({ inlineData: { mimeType: "image/png", data: b.toString("base64") } })),
    { text: prompt },
  ];
  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    // Thought tokens count against maxOutputTokens, so leave room.
    config: { temperature: 0.3, maxOutputTokens: 8192, httpOptions: { timeout: timeoutMs } },
  });
  const text = res.text;
  if (!text) throw new Error(`empty response from ${model} (${res.candidates?.[0]?.finishReason ?? "no candidate"})`);
  return text;
};

/**
 * Runs the image lane and the text-only lane in parallel and returns the first answer; the image lane is
 * preferred only in that it is started first. A lane retries once after a fast failure (the 500s come back
 * within a second or two), never after a slow one. Every call gets whatever budget is left.
 */
export async function gemmaProvider(prompt: string, images: Buffer[], textOnlyPrompt?: string, deps: Deps = {}): Promise<ProviderResult> {
  const call = deps.call ?? sdkCall;
  const now = deps.now ?? Date.now;
  const started = now();
  const left = () => TOTAL_BUDGET_MS - (now() - started);

  async function lane(p: string, imgs: Buffer[], textOnly: boolean): Promise<ProviderResult> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (left() < MIN_ATTEMPT_MS) break;
      const t0 = now();
      try {
        const raw = await call(GEMMA_MODEL, p, imgs, left());
        return textOnly ? { raw, model: GEMMA_MODEL, textOnly: true } : { raw, model: GEMMA_MODEL };
      } catch (e) {
        lastErr = e;
        if (now() - t0 > FAST_FAILURE_MS) break;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "no budget left"));
  }

  const lanes = images.length ? [lane(prompt, images, false), lane(textOnlyPrompt ?? prompt, [], true)] : [lane(prompt, [], false)];
  try {
    return await Promise.any(lanes);
  } catch (e) {
    const errs = (e as AggregateError).errors ?? [e];
    throw errs[errs.length - 1];
  }
}
