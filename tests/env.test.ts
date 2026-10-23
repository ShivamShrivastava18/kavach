import { test, expect } from "vitest";
import { isDemoMode, llmProvider } from "@/lib/env";

test("demo mode when CLOUDINARY_URL missing", () => {
  delete process.env.CLOUDINARY_URL;
  delete process.env.DEMO_MODE;
  expect(isDemoMode()).toBe(true);
});

test("not demo when url present and DEMO_MODE unset", () => {
  process.env.CLOUDINARY_URL = "cloudinary://k:s@c";
  delete process.env.DEMO_MODE;
  expect(isDemoMode()).toBe(false);
});

test("DEMO_MODE=1 forces demo", () => {
  process.env.CLOUDINARY_URL = "cloudinary://k:s@c";
  process.env.DEMO_MODE = "1";
  expect(isDemoMode()).toBe(true);
});

test("provider defaults to gemma", () => {
  delete process.env.LLM_PROVIDER;
  expect(llmProvider()).toBe("gemma");
});
