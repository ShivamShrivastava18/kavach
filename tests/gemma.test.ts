import { test, expect } from "vitest";
import { gemmaProvider, gemmaConfig, GEMMA_MODEL } from "@/lib/llm/gemma";

const img = [Buffer.from("png")];

test("image and text-only lanes race; a failing image lane does not block the text lane", async () => {
  const calls: { images: number; prompt: string }[] = [];
  const result = await gemmaProvider("with-images", img, "text-only", {
    call: async (_model, prompt, images) => {
      calls.push({ images: images.length, prompt });
      if (images.length) throw new Error('{"error":{"code":500,"message":"Internal error encountered."}}');
      return "ok";
    },
  });
  expect(result).toEqual({ raw: "ok", model: GEMMA_MODEL, textOnly: true });
  expect(calls.filter((c) => c.images === 0)).toHaveLength(1);
  expect(calls.filter((c) => c.images === 1).length).toBeLessThanOrEqual(2); // one retry after the fast 500
});

test("the image lane wins when it answers", async () => {
  const result = await gemmaProvider("with-images", img, "text-only", {
    call: async (_model, _prompt, images) => {
      if (images.length) return "seen";
      await new Promise((r) => setTimeout(r, 20));
      return "blind";
    },
  });
  expect(result).toEqual({ raw: "seen", model: GEMMA_MODEL });
});

test("a fast failure is retried once, a slow failure is not", async () => {
  let t = 0;
  const attempts: string[] = [];
  await expect(
    gemmaProvider("p", [], undefined, {
      call: async (_m, prompt) => {
        attempts.push(prompt);
        t += attempts.length === 1 ? 1_000 : 30_000; // first fails fast (500), retry fails slow (deadline)
        throw new Error(attempts.length === 1 ? "500" : "504");
      },
      now: () => t,
    }),
  ).rejects.toThrow("504");
  expect(attempts).toEqual(["p", "p"]);
});

test("every call gets the budget that is left", async () => {
  const timeouts: number[] = [];
  let t = 0;
  await gemmaProvider("p", [], undefined, {
    call: async (_m, _p, _i, timeoutMs) => {
      timeouts.push(timeoutMs);
      t += 2_000;
      if (timeouts.length === 1) throw new Error("500");
      return "ok";
    },
    now: () => t,
  });
  expect(timeouts[0]).toBe(48_000);
  expect(timeouts[1]).toBe(46_000);
});

test("the SDK config turns thinking down to minimal and passes the timeout", () => {
  const c = gemmaConfig(12_345);
  expect(c.thinkingConfig).toEqual({ thinkingLevel: "MINIMAL" }); // ThinkingLevel.MINIMAL, sent as "minimal" on the wire
  expect(c.httpOptions).toEqual({ timeout: 12_345 });
});
