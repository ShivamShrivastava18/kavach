import { test, expect } from "vitest";
import { parseDraft } from "@/lib/llm/parse";

const obj = {
  description: "A cropped copy.",
  narrative: "On 23 October I found a cropped copy of my photo on Instagram.",
  severity: "high",
};

test("clean json", () => {
  expect(parseDraft(JSON.stringify(obj))).toEqual({
    description: "A cropped copy.",
    narrative: "On 23 October I found a cropped copy of my photo on Instagram.",
    severity: "high",
  });
});

test("json inside fences", () => {
  const raw = "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
  expect(parseDraft(raw)?.severity).toBe("high");
});

test("prose then json", () => {
  const raw = "Here is the analysis you asked for:\n\n" + JSON.stringify(obj) + "\n\nLet me know.";
  expect(parseDraft(raw)?.narrative).toBe(obj.narrative);
});

test("garbage is null", () => {
  expect(parseDraft("no json here")).toBeNull();
});

test("missing key is null", () => {
  expect(parseDraft(JSON.stringify({ description: "x" }))).toBeNull();
});

test("unknown severity becomes medium", () => {
  expect(parseDraft(JSON.stringify({ ...obj, severity: "catastrophic" }))?.severity).toBe("medium");
});
