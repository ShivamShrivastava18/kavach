import { test, expect, beforeAll } from "vitest";
import { signImg, verifyImg } from "@/lib/imgtoken";

beforeAll(() => {
  process.env.SESSION_SECRET = "unit-test-signing-key";
});

test("round trip", () => {
  const t = signImg("kavach/p1/exhibits/c1", "blur", "stamp text", 60);
  expect(verifyImg(t)).toEqual({ publicId: "kavach/p1/exhibits/c1", kind: "blur", stamp: "stamp text" });
});

test("tamper returns null", () => {
  const t = signImg("kavach/p1/vault/a", "thumb", undefined, 60);
  expect(verifyImg(t.slice(0, -2) + "zz")).toBeNull();
  expect(verifyImg("nonsense")).toBeNull();
});

test("expired returns null", () => {
  const t = signImg("kavach/p1/vault/a", "thumb", undefined, -1);
  expect(verifyImg(t)).toBeNull();
});
