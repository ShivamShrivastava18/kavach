import { test, expect } from "vitest";
import { arcPath, bandFor, GAUGE } from "@/lib/gauge";

test("the gauge spans 270 degrees and maps score 0..1 onto it", () => {
  expect(GAUGE.sweep).toBe(270);
  expect(GAUGE.bands).toEqual([{ from: 0, to: 0.7, key: "none" }, { from: 0.7, to: 0.8, key: "likely" }, { from: 0.8, to: 1, key: "derived" }]);
  expect(bandFor(0.69)).toBe("none");
  expect(bandFor(0.7)).toBe("likely");
  expect(bandFor(0.8)).toBe("derived");
});

test("arcPath draws from the start angle to the score's angle, as an SVG arc", () => {
  const p = arcPath(0.5, 50, 50, 40);
  expect(p.startsWith("M ")).toBe(true);
  expect(p).toContain(" A 40 40 0 ");
  expect(arcPath(0, 50, 50, 40)).toBe("");
  // Past half the sweep the large-arc flag flips.
  expect(arcPath(0.9, 50, 50, 40)).toContain(" A 40 40 0 1 1 ");
  expect(arcPath(0.3, 50, 50, 40)).toContain(" A 40 40 0 0 1 ");
});
