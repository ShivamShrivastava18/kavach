import { test, expect } from "vitest";
import { SIMULATIONS } from "@/lib/simulate";

test("six simulated edits, each with a unique kind and a plain-English label", () => {
  expect(SIMULATIONS.map((s) => s.kind)).toEqual(["mirror", "crop", "filter", "caption", "frame", "recompress"]);
  for (const s of SIMULATIONS) expect(s.label.length).toBeGreaterThan(8);
});

test("every transformation component carries at most one effect and no spaces", () => {
  for (const s of SIMULATIONS) {
    expect(s.transformation).not.toMatch(/\s/);
    for (const component of s.transformation.split("/")) {
      const effects = component.split(",").filter((p) => p.startsWith("e_"));
      expect(effects.length, `${s.kind}: ${component}`).toBeLessThanOrEqual(1);
    }
  }
});
