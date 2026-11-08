import { describe, expect, test } from "vitest";
import { NO_DEDUCTION, spouseDeduction, spouseTotalIncome } from "../src/utils/deductions";

const spouse = (salaryYen: number, isElderly = false) => ({ salaryYen, isElderly });

describe("spouseTotalIncome", () => {
  test.each([
    [0, 0],
    [740_000, 0],
    [1_360_000, 620_000],
    [1_740_000, 1_000_000],
    [2_070_000, 1_330_000],
  ])("salary %d -> %d", (salaryYen, incomeYen) => expect(spouseTotalIncome(spouse(salaryYen))).toBe(incomeYen));
});

describe("spouseDeduction: spouse deduction (spouse income <= 620,000)", () => {
  test.each([
    // own total income, elderly, income tax, resident tax
    [5_000_000, false, 380_000, 330_000],
    [5_000_000, true, 480_000, 380_000],
    [9_000_000, false, 380_000, 330_000],
    [9_200_000, false, 260_000, 220_000],
    [9_200_000, true, 320_000, 260_000],
    [9_800_000, false, 130_000, 110_000],
    [9_800_000, true, 160_000, 130_000],
    [10_000_000, false, 130_000, 110_000],
  ])("own %d elderly=%s -> %d / %d", (ownYen, isElderly, incomeTaxYen, residentTaxYen) =>
    expect(spouseDeduction(ownYen, spouse(1_360_000, isElderly))).toEqual({ incomeTaxYen, residentTaxYen }),
  );

  test("none above 10,000,000 yen of own income", () =>
    expect(spouseDeduction(10_000_001, spouse(0))).toEqual(NO_DEDUCTION));

  test("none without a spouse", () => expect(spouseDeduction(5_000_000, null)).toEqual(NO_DEDUCTION));
});

describe("spouseDeduction: special deduction (620,000 < spouse income <= 1,330,000)", () => {
  test.each([
    // spouse salary (spouse income = salary - 740,000 below 2.2M), own income, income tax, resident tax
    [1_360_001, 5_000_000, 380_000, 330_000],
    [1_690_000, 5_000_000, 380_000, 330_000],
    [1_690_001, 5_000_000, 360_000, 330_000],
    [1_740_000, 5_000_000, 360_000, 330_000],
    [1_740_001, 5_000_000, 310_000, 310_000],
    [1_790_001, 5_000_000, 260_000, 260_000],
    [1_990_000, 5_000_000, 110_000, 110_000],
    [1_990_001, 5_000_000, 60_000, 60_000],
    [2_040_001, 5_000_000, 30_000, 30_000],
    [2_070_000, 5_000_000, 30_000, 30_000],
    [1_740_001, 9_200_000, 210_000, 210_000],
    [1_740_000, 9_200_000, 240_000, 220_000],
    [1_740_001, 9_800_000, 110_000, 110_000],
    [1_790_001, 9_800_000, 90_000, 90_000],
    [1_840_001, 9_800_000, 70_000, 70_000],
  ])("spouse salary %d own %d -> %d / %d", (salaryYen, ownYen, incomeTaxYen, residentTaxYen) =>
    expect(spouseDeduction(ownYen, spouse(salaryYen))).toEqual({ incomeTaxYen, residentTaxYen }),
  );

  test("none above 1,330,000 yen of spouse income", () =>
    expect(spouseDeduction(5_000_000, spouse(2_070_001))).toEqual(NO_DEDUCTION));

  test("the elderly flag does not change the special deduction", () =>
    expect(spouseDeduction(5_000_000, spouse(1_800_000, true))).toEqual(spouseDeduction(5_000_000, spouse(1_800_000))));
});
