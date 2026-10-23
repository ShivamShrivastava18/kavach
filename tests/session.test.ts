import { test, expect, beforeAll } from "vitest";
import { signSession, verifySession, hashPin, SESSION_COOKIE } from "@/lib/session";

beforeAll(() => {
  process.env.SESSION_SECRET = "unit-test-signing-key";
});

test("sign then verify returns the id", () => {
  const t = signSession("abc123");
  expect(verifySession(t)).toBe("abc123");
  expect(SESSION_COOKIE).toBe("kavach_session");
});

test("tampered token returns null", () => {
  const t = signSession("abc123");
  expect(verifySession("abc124" + t.slice(6))).toBeNull();
  expect(verifySession("garbage")).toBeNull();
});

test("hashPin is deterministic and salted", () => {
  expect(hashPin("1234", "s1")).toBe(hashPin("1234", "s1"));
  expect(hashPin("1234", "s1")).not.toBe(hashPin("1234", "s2"));
  expect(hashPin("1234", "s1")).not.toBe(hashPin("1235", "s1"));
});
