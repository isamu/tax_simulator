import { expect, test } from "vitest";
import { stepAmount } from "../src/utils/step";

const CASES: [number | "", number, number][] = [
  [4_000_000, 1_000_000, 5_000_000],
  [4_000_000, -1_000_000, 3_000_000],
  [500_000, -1_000_000, 0],
  [0, -1_000_000, 0],
  ["", 1_000_000, 1_000_000],
  ["", -1_000_000, 0],
  [NaN, 1_000_000, 1_000_000],
  [4_321_000, 1_000_000, 5_321_000],
];

test.each(CASES)("stepAmount(%s, %d) -> %d", (current, delta, expected) =>
  expect(stepAmount(current, delta)).toBe(expected),
);
