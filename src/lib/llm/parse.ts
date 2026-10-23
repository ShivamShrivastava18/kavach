import type { ParsedDraft, Severity } from "./types";

function candidates(raw: string): string[] {
  const out: string[] = [];
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) out.push(fence[1]);
  out.push(raw);
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) out.push(raw.slice(first, last + 1));
  return out;
}

function severity(v: unknown): Severity {
  return v === "low" || v === "medium" || v === "high" ? v : "medium";
}

export function parseDraft(raw: string): ParsedDraft | null {
  for (const c of candidates(raw)) {
    try {
      const o = JSON.parse(c.trim()) as Record<string, unknown>;
      const description = o.description;
      const platform = o.platform_complaint ?? o.platform;
      const portal = o.portal_complaint ?? o.portal;
      if (typeof description !== "string" || typeof platform !== "string" || typeof portal !== "string") continue;
      return { description, platform, portal, severity: severity(o.severity) };
    } catch {
      continue;
    }
  }
  return null;
}
