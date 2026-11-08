import { describe, expect, test } from "vitest";
import { shareOfLargest, stackSegments } from "../src/utils/stack";

const item = (key: string, valueYen: number) => ({ key, label: key, valueYen });

describe("stackSegments", () => {
  test("shares add up to one", () => {
    const segments = stackSegments([item("a", 1), item("b", 2), item("c", 1)]);
    expect(segments.map((s) => s.share)).toEqual([0.25, 0.5, 0.25]);
  });

  test("keeps keys and labels", () => {
    expect(stackSegments([item("net", 3)])[0]).toMatchObject({ key: "net", label: "net", share: 1 });
  });

  test("drops zero and negative values", () => {
    expect(stackSegments([item("net", -100), item("insurance", 100), item("tax", 0)]).map((s) => s.key)).toEqual([
      "insurance",
    ]);
  });

  test.each([[[]], [[item("a", 0)]], [[item("a", NaN)]]])("%j has no segments", (items) =>
    expect(stackSegments(items)).toEqual([]),
  );
});

describe("shareOfLargest", () => {
  test("scales against the largest value", () => expect(shareOfLargest([50, 100, 25])).toEqual([0.5, 1, 0.25]));
  test("all zero stays zero", () => expect(shareOfLargest([0, 0])).toEqual([0, 0]));
  test("negative values draw nothing", () => expect(shareOfLargest([-5, 10])).toEqual([0, 1]));
  test("empty input", () => expect(shareOfLargest([])).toEqual([]));
});
