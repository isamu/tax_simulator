import { describe, expect, test } from "vitest";
import {
  incomeTax,
  incomeTaxBasicDeduction,
  residentTaxBasicDeduction,
  salaryIncomeDeduction,
  standardMonthlyFee,
  toJpNumber,
} from "../src/utils/tax";

describe("standardMonthlyFee", () => {
  test.each([
    [0, 58000],
    [62999, 58000],
    [63000, 68000],
    [72999, 68000],
    [333333, 340000],
    [1354999, 1330000],
    [1355000, 1390000],
    [10_000_000, 1390000],
    [-1, 58000],
  ])("%d -> %d", (monthly, fee) => expect(standardMonthlyFee(monthly)).toBe(fee));

  test("is non-decreasing", () => {
    const fees = Array.from({ length: 1500 }, (_, i) => standardMonthlyFee(i * 1000));
    fees.slice(1).forEach((fee, i) => expect(fee).toBeGreaterThanOrEqual(fees[i]));
  });
});

describe("incomeTax", () => {
  test.each([
    [0, 0],
    [1950000, 97500],
    [1950001, 97500.1],
    [3300000, 232500],
    [6950000, 962500],
    [9000000, 1434000],
    [18000000, 4404000],
    [40000000, 13204000],
    [50000000, 17704000],
  ])("%d -> %d", (income, tax) => expect(incomeTax(income)).toBeCloseTo(tax, 6));

  test("is continuous at bracket boundaries", () => {
    [1950000, 3300000, 6950000, 9000000, 18000000, 40000000].forEach((bound) =>
      expect(incomeTax(bound + 1) - incomeTax(bound)).toBeLessThan(1),
    );
  });

  test("NaN stays NaN", () => expect(incomeTax(NaN)).toBeNaN());
});

describe("salaryIncomeDeduction", () => {
  test.each([
    [0, 0],
    [500000, 500000],
    [740000, 740000],
    [1000000, 740000],
    [2200000, 740000],
    [2200001, 740000.3],
    [3600000, 1160000],
    [6600000, 1760000],
    [8500000, 1950000],
    [20000000, 1950000],
    [-5, 0],
  ])("%d -> %d", (income, deduction) => expect(salaryIncomeDeduction(income)).toBeCloseTo(deduction, 6));
});

describe("incomeTaxBasicDeduction", () => {
  test.each([
    [0, 1040000],
    [4890000, 1040000],
    [4890001, 670000],
    [6550000, 670000],
    [6550001, 620000],
    [23500000, 620000],
    [24000000, 480000],
    [24500000, 320000],
    [25000000, 160000],
    [25000001, 0],
  ])("%d -> %d", (income, deduction) => expect(incomeTaxBasicDeduction(income)).toBe(deduction));
});

describe("residentTaxBasicDeduction", () => {
  test.each([
    [0, 430000],
    [24000000, 430000],
    [24000001, 290000],
    [24500001, 150000],
    [25000001, 0],
  ])("%d -> %d", (income, deduction) => expect(residentTaxBasicDeduction(income)).toBe(deduction));
});

describe("toJpNumber", () => {
  test.each([
    [0, "0"],
    [9999, "9999"],
    [10000, "1万0000"],
    [4000000, "400万0000"],
    [123456789, "1億2345万6789"],
    [-132588, "-13万2588"],
    ["", ""],
    ["4000000", "400万0000"],
    [-12345678, "-1234万5678"],
    [-1234, "-1234"],
    [12345678.5, "1234万5678.5"],
    [123456789012, "1234億5678万9012"],
  ])("%s -> %s", (value, text) => expect(toJpNumber(value)).toBe(text));

  test("leaves non-numeric text unchanged", () => expect(toJpNumber("abc")).toBe("abc"));

  test("never prints undefined past the largest unit", () =>
    expect(toJpNumber("1".repeat(80))).not.toContain("undefined"));

  test("keeps the fractional digits as written", () => expect(toJpNumber(19602.5)).toBe("1万9602.5"));
});
