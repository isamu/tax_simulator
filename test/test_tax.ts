import { describe, expect, test } from "vitest";
import { incomeTax, salaryIncomeDeduction, standardMonthlyFee, toJpNumber } from "../src/utils/tax";

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
    [649999, 649999],
    [650000, 260000],
    [1800000, 720000],
    [3600000, 1260000],
    [6600000, 1860000],
    [9999999, 2199999.9],
    [10000000, 2200000],
    [-5, -5],
  ])("%d -> %d", (income, deduction) => expect(salaryIncomeDeduction(income)).toBeCloseTo(deduction, 6));
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
  ])("%s -> %s", (value, text) => expect(toJpNumber(value)).toBe(text));

  test("counts the minus sign as a digit, as the original did", () =>
    expect(toJpNumber(-12345678)).toBe("-1234億5678"));

  test("keeps the fractional digits as written", () => expect(toJpNumber(19602.5)).toBe("1万9602.5"));
});
