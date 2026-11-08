import { describe, expect, test } from "vitest";
import { type FurusatoInput, coefficientFor, computeFurusatoLimit, optionalAmount } from "../src/utils/furusato";

const BASE_INPUT: FurusatoInput = {
  salesYen: 12_000_000,
  expensesYen: 5_000_000,
  blueDeductionYen: 650_000,
  otherIncomeYen: 0,
  socialInsuranceYen: 900_000,
  otherDeductionYen: 300_000,
  personalGapYen: 0,
  taxableOverrideYen: null,
  shotokuwariOverrideYen: null,
};

describe("computeFurusatoLimit worked example", () => {
  test("default inputs", () => {
    const r = computeFurusatoLimit(BASE_INPUT);
    // 12,000,000 - 5,000,000 - 650,000
    expect(r.totalIncomeYen).toBe(6_350_000);
    // 4,890,000 < 6,350,000 <= 6,550,000
    expect(r.incomeTaxBasicYen).toBe(630_000);
    expect(r.residentBasicYen).toBe(430_000);
    // 6,350,000 - 1,200,000 - 630,000
    expect(r.taxableYen).toBe(4_520_000);
    // 6,350,000 - 1,200,000 - 430,000
    expect(r.residentTaxableYen).toBe(4_720_000);
    // above 2,000,000: max((50,000 - 2,720,000) x 5%, 2,500)
    expect(r.adjustYen).toBe(2_500);
    // 472,000 - 2,500 = 469,500
    expect(r.shotokuwariYen).toBe(469_500);
    // judged on 4,720,000 - 50,000 = 4,670,000 -> 20%
    expect(r.rate).toBe(0.2);
    // 20% / (90% - 20% x 1.021)
    expect(r.coefficient).toBeCloseTo(0.2 / 0.6958, 12);
    expect(r.limitYen).toBe(Math.floor(469_500 * (0.2 / 0.6958) + 2_000));
  });
});

describe("computeFurusatoLimit branches", () => {
  test("adjustment below 2,000,000 yen uses the smaller of gap and taxable income", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, salesYen: 3_000_000, expensesYen: 1_000_000 });
    // total 1,350,000 -> basic 880,000 / 430,000; resident taxable 1,350,000 - 1,200,000 - 430,000 < 0 -> 0
    expect(r.residentTaxableYen).toBe(0);
    expect(r.adjustYen).toBe(0);
    expect(r.limitYen).toBe(0);
  });

  test("small resident taxable income takes 5% of the gap", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, salesYen: 4_000_000, expensesYen: 1_000_000 });
    // total 2,350,000; resident taxable 2,350,000 - 1,200,000 - 430,000 = 720,000; min(50,000, 720,000) x 5%
    expect(r.residentTaxableYen).toBe(720_000);
    expect(r.adjustYen).toBe(2_500);
    expect(r.rate).toBe(0.05);
  });

  test("the bracket is judged after subtracting the personal deduction gap", () => {
    // total 3,610,000; resident taxable 3,610,000 - 1,200,000 - 430,000 = 1,980,000; judged on 1,930,000
    const r = computeFurusatoLimit({ ...BASE_INPUT, salesYen: 9_260_000 });
    expect(r.residentTaxableYen).toBe(1_980_000);
    expect(r.rate).toBe(0.05);
  });

  test("no adjustment above 25,000,000 yen", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, salesYen: 40_000_000 });
    expect(r.totalIncomeYen).toBe(34_350_000);
    expect(r.incomeTaxBasicYen).toBe(0);
    expect(r.residentBasicYen).toBe(0);
    expect(r.adjustYen).toBe(0);
  });

  test("overrides replace the calculated values", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, taxableOverrideYen: 10_000_000, shotokuwariOverrideYen: 300_000 });
    expect(r.taxableYen).toBe(10_000_000);
    expect(r.shotokuwariYen).toBe(300_000);
    expect(r.rate).toBe(0.33);
    expect(r.limitYen).toBe(Math.floor(300_000 * coefficientFor(0.33) + 2_000));
  });

  test("expenses above sales do not make income negative", () => {
    expect(computeFurusatoLimit({ ...BASE_INPUT, expensesYen: 20_000_000 }).totalIncomeYen).toBe(0);
  });
});

describe("optionalAmount", () => {
  test.each([
    ["", null],
    [null, null],
    [undefined, null],
    [0, 0],
    [123, 123],
    ["456", 456],
  ])("%j -> %j", (value, expected) => expect(optionalAmount(value)).toBe(expected));
});
