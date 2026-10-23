export type RedactFacts = { name: string; url?: string };

export const NAME_TOKEN = "[VICTIM_NAME]";
export const URL_TOKEN = "[POST_URL]";

export function redact(text: string, facts: RedactFacts): string {
  let out = text;
  if (facts.url) out = out.split(facts.url).join(URL_TOKEN);
  if (facts.name) out = out.split(facts.name).join(NAME_TOKEN);
  return out;
}

export function restore(text: string, facts: RedactFacts): string {
  let out = text.split(NAME_TOKEN).join(facts.name);
  if (facts.url) out = out.split(URL_TOKEN).join(facts.url);
  return out;
}
