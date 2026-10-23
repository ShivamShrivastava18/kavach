import Anthropic from "@anthropic-ai/sdk";
import { required } from "../env";
import type { ProviderResult } from "./types";

export const CLAUDE_MODEL = "claude-haiku-5-5";

export async function claudeProvider(prompt: string, images: Buffer[]): Promise<ProviderResult> {
  const client = new Anthropic({ apiKey: required("ANTHROPIC_API_KEY") });
  const content: Anthropic.MessageCreateParams["messages"][number]["content"] = [
    ...images.map((b) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: "image/png" as const, data: b.toString("base64") },
    })),
    { type: "text" as const, text: prompt },
  ];
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });
  const raw = res.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  if (!raw) throw new Error("empty response from claude");
  return { raw, model: CLAUDE_MODEL };
}
