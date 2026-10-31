import { test, expect } from "vitest";
import { buildSampleProfile, SAMPLE_NAME } from "@/lib/sample";

test("a sample shield is a normal profile flagged as a sample, with a PIN nobody knows", () => {
  const p = buildSampleProfile();
  expect(p.sample).toBe(true);
  expect(p.name).toBe(SAMPLE_NAME);
  expect(p.id).toMatch(/^[0-9a-z]{12}$/);
  expect(p.pinHash).toMatch(/^[0-9a-f]{16,}$/);
  expect(p.salt).toMatch(/^[0-9a-f]{16}$/);
  expect(p.vault).toEqual([]);
  expect(buildSampleProfile().id).not.toBe(p.id);
});
