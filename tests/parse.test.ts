import { test, expect } from "vitest";
import { parseDraft } from "@/lib/llm/parse";

const obj = {
  description: "A cropped copy.",
  platform_complaint: "To: Grievance Officer",
  portal_complaint: "Incident report",
  severity: "high",
};

test("clean json", () => {
  expect(parseDraft(JSON.stringify(obj))).toEqual({
    description: "A cropped copy.",
    platform: "To: Grievance Officer",
    portal: "Incident report",
    severity: "high",
  });
});

test("json inside fences", () => {
  const raw = "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
  expect(parseDraft(raw)?.severity).toBe("high");
});

test("prose then json", () => {
  const raw = "Here is the analysis you asked for:\n\n" + JSON.stringify(obj) + "\n\nLet me know.";
  expect(parseDraft(raw)?.platform).toBe("To: Grievance Officer");
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
