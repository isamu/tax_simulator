import { describe, expect, test } from "vitest";
import { circumference, donutSegments } from "../src/utils/donut";

describe("donutSegments", () => {
  test("segments start at -90deg and cover the full circle", () => {
    const segments = donutSegments([1, 2, 1]);
    expect(segments.map((s) => s.rotateDeg)).toEqual([-90, 0, 180]);
    expect(segments.map((s) => s.label)).toEqual(["(1) 25%", "(2) 50%", "(3) 25%"]);
  });

  test("dash offset leaves the remaining arc", () => {
    const [half] = donutSegments([1, 1]);
    expect(half.strokeDashOffset).toBeCloseTo(circumference() / 2, 10);
  });

  test("labels only segments above 5%", () => {
    expect(donutSegments([95, 5]).map((s) => s.showLabel)).toEqual([true, false]);
    expect(donutSegments([94, 6]).map((s) => s.showLabel)).toEqual([true, true]);
  });

  test("all-zero values produce NaN geometry without throwing", () => {
    const segments = donutSegments([0, 0, 0]);
    expect(segments).toHaveLength(3);
    segments.forEach((s) => expect(s.showLabel).toBe(false));
  });
});
