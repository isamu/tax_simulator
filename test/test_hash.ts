import { expect, test } from "vitest";
import { incomeFromHash } from "../src/utils/hash";

test.each([
  ["#4000000", 4000000],
  ["#100001", 100001],
  ["4000000", 4000000],
  ["#1e7", 10000000],
])("%s -> %d", (hash, income) => expect(incomeFromHash(hash)).toBe(income));

test.each(["", "#", "#100000", "#abc", "#-5000000", "##4000000"])("%s is ignored", (hash) =>
  expect(incomeFromHash(hash)).toBeUndefined(),
);
