import { test, expect } from "vitest";
import { fillTemplates, type CaseFacts } from "@/lib/templates";

const base: CaseFacts = {
  caseId: "k7x2p9",
  victimName: "Priya Sharma",
  platform: "Instagram",
  postUrl: "https://instagram.com/p/xyz",
  firstSeen: "2026-10-23",
  exhibitSha256: "deadbeef".repeat(8),
  verdict: "derived",
  score: 0.91,
  methods: ["cloudinary-phash", "face-phash", "face-dhash"],
  matchedPhotoDate: "2026-10-12",
  explicit: false,
};
const VERIFY = "Verify section numbers with the portal or a lawyer before filing.";

test("derived draft names the matched date and the 2-hour duty", () => {
  const { platform, portal } = fillTemplates(base);
  expect(platform).toContain("2026-10-12");
  expect(platform).toContain("2 hours");
  expect(platform).toContain("Grievance Officer, Instagram");
  expect(platform).toContain("91%");
  expect(portal).toContain("cybercrime.gov.in");
  expect(portal).toContain("1930");
});

test("none draft rests on identity and consent", () => {
  const { platform } = fillTemplates({ ...base, verdict: "none", matchedPhotoDate: undefined });
  expect(platform).toContain("no registered photo matched");
  expect(platform).not.toContain("2026-10-12");
});

test("likely draft says likely derived", () => {
  expect(fillTemplates({ ...base, verdict: "likely" }).platform).toContain("likely derived");
});

test("explicit adds 67A, otherwise 66E and 67", () => {
  const a = fillTemplates({ ...base, explicit: true });
  expect(a.platform).toContain("67A");
  const b = fillTemplates(base);
  expect(b.platform).toContain("66E");
  expect(b.platform).toContain("Section 67 ");
  expect(b.platform).not.toContain("67A");
});

test("both drafts end with the verify line", () => {
  const { platform, portal } = fillTemplates(base);
  expect(platform.trim().endsWith(VERIFY)).toBe(true);
  expect(portal.trim().endsWith(VERIFY)).toBe(true);
});

test("a narrative is inserted into both complaints, before the legal paragraph", () => {
  const narrative = "On 23 October a friend sent me the post. The face is mine; the background and caption are not.";
  const t = fillTemplates(base, narrative);
  expect(t.platform).toContain(narrative);
  expect(t.portal).toContain(narrative);
  expect(t.platform.indexOf(narrative)).toBeLessThan(t.platform.indexOf("Rule 3(2)(b)"));
  expect(t.portal.indexOf(narrative)).toBeLessThan(t.portal.indexOf("Section 66E"));
  expect(t.platform.trim().endsWith(VERIFY)).toBe(true);
});
