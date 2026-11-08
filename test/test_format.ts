import { expect, test } from "vitest";
import { formatPercent, formatYen } from "../src/utils/format";

test.each([
  [0, "0"],
  [3169848, "3,169,848"],
  [-131880, "-131,880"],
  [1234.5, "1,235"],
  [NaN, "—"],
])("formatYen(%d) -> %s", (value, text) => expect(formatYen(value)).toBe(text));

test.each([
  [0.7925, "79%"],
  [0, "0%"],
  [1, "100%"],
  [NaN, "—"],
])("formatPercent(%d) -> %s", (value, text) => expect(formatPercent(value)).toBe(text));
