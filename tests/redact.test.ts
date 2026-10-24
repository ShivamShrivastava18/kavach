import { test, expect } from "vitest";
import { redact, restore } from "@/lib/redact";

const facts = { name: "Priya Sharma", url: "https://instagram.com/p/xyz" };

test("redact replaces name and url", () => {
  const out = redact("Priya Sharma saw https://instagram.com/p/xyz today", facts);
  expect(out).toBe("[VICTIM_NAME] saw [POST_URL] today");
});

test("restore inverts redact", () => {
  const t = "Dear officer, Priya Sharma reports https://instagram.com/p/xyz. Priya Sharma again.";
  expect(restore(redact(t, facts), facts)).toBe(t);
});

test("redact without url leaves text intact", () => {
  expect(redact("hello Priya Sharma", { name: "Priya Sharma" })).toBe("hello [VICTIM_NAME]");
});

test("restore without a URL replaces the token with plain words", () => {
  expect(restore("see [POST_URL] by [VICTIM_NAME]", { name: "Priya Sharma" })).toBe("see the post by Priya Sharma");
});
