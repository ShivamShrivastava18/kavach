export type LlmProvider = "gemma" | "claude" | "demo";

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "1") return true;
  return !process.env.CLOUDINARY_URL;
}

export function llmProvider(): LlmProvider {
  const v = process.env.LLM_PROVIDER;
  if (v === "claude" || v === "demo" || v === "gemma") return v;
  return "gemma";
}

export function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? (isDemoMode() ? "kavach-demo-secret" : required("SESSION_SECRET"));
}
