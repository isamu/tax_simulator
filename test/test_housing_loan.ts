import { describe, expect, test } from "vitest";
import {
  DEFAULT_HOUSING_LOAN,
  type HomeKind,
  type HomePerformance,
  type HousingLoan,
  type MoveInPeriod,
  housingLoanCapYen,
  housingLoanCreditYen,
  splitHousingLoanCredit,
} from "../src/utils/housingLoan";

type CapCase = [HomeKind, HomePerformance, MoveInPeriod, number, number];

// Copied from the NTA tables (No.1211-1 new homes, No.1211-3 used homes): [general, child-rearing].
const CAP_CASES: CapCase[] = [
  ["new", "certified", "r4to5", 350000, 350000],
  ["new", "certified", "r6to7", 315000, 350000],
  ["new", "certified", "r8", 315000, 350000],
  ["new", "zeh", "r4to5", 315000, 315000],
  ["new", "zeh", "r6to7", 245000, 315000],
  ["new", "zeh", "r8", 245000, 315000],
  ["new", "energySaving", "r4to5", 280000, 280000],
  ["new", "energySaving", "r6to7", 210000, 280000],
  ["new", "energySaving", "r8", 140000, 210000],
  ["new", "other", "r4to5", 210000, 210000],
  ["new", "other", "r6to7", 0, 0],
  ["new", "other", "r8", 0, 0],
  ["used", "certified", "r4to5", 210000, 210000],
  ["used", "certified", "r6to7", 210000, 210000],
  ["used", "certified", "r8", 245000, 315000],
  ["used", "zeh", "r6to7", 210000, 210000],
  ["used", "zeh", "r8", 245000, 315000],
  ["used", "energySaving", "r6to7", 210000, 210000],
  ["used", "energySaving", "r8", 140000, 210000],
  ["used", "other", "r4to5", 140000, 140000],
  ["used", "other", "r8", 140000, 140000],
];

const loan = (overrides: Partial<HousingLoan>): HousingLoan => ({ ...DEFAULT_HOUSING_LOAN, ...overrides });

describe("housingLoanCapYen", () => {
  test.each(CAP_CASES)("%s %s %s -> %d / %d", (kind, performance, moveIn, generalYen, childRearingYen) => {
    expect(housingLoanCapYen(loan({ kind, performance, moveIn }))).toBe(generalYen);
    expect(housingLoanCapYen(loan({ kind, performance, moveIn, childRearing: true }))).toBe(childRearingYen);
  });
});

describe("housingLoanCreditYen", () => {
  const certified = loan({ performance: "certified" });
  test.each([
    // 12,345,678 x 0.7% = 86,419.7, floored to 100 yen
    [12_345_678, 86_400],
    [10_000_000, 70_000],
    [45_000_000, 315_000],
    [50_000_000, 315_000],
    [99, 0],
    [0, 0],
    [-1_000_000, 0],
    [NaN, 0],
  ])("balance %d -> %d", (balanceYen, creditYen) =>
    expect(housingLoanCreditYen({ ...certified, balanceYen }, 5_000_000)).toBe(creditYen),
  );

  test("total income above 20,000,000 yen gets nothing", () => {
    const withBalance = { ...certified, balanceYen: 30_000_000 };
    expect(housingLoanCreditYen(withBalance, 20_000_000)).toBe(210_000);
    expect(housingLoanCreditYen(withBalance, 20_000_001)).toBe(0);
    expect(housingLoanCreditYen(withBalance, NaN)).toBe(0);
  });
});

describe("splitHousingLoanCredit", () => {
  test.each([
    // income tax absorbs it all
    [100_000, 200_000, 4_000_000, 300_000, 100_000, 0],
    // 84,000 left; resident cap 1,120,000 x 5% = 56,000
    [140_000, 56_000, 1_120_000, 173_000, 56_000, 56_000],
    // resident cap stops at 97,500
    [315_000, 150_000, 3_000_000, 250_000, 150_000, 97_500],
    // cannot exceed the resident levy itself
    [140_000, 0, 1_000_000, 20_000, 0, 20_000],
    [0, 56_000, 1_120_000, 173_000, 0, 0],
  ])("credit %d, income tax %d, taxable %d, levy %d -> %d / %d", (credit, tax, taxable, levy, fromTax, fromLevy) =>
    expect(splitHousingLoanCredit(credit, tax, taxable, levy)).toEqual({
      incomeTaxYen: fromTax,
      residentTaxYen: fromLevy,
    }),
  );

  test("never takes more than the credit or either tax", () => {
    const state = { value: 42 };
    const random = () => ((state.value = (state.value * 1103515245 + 12345) % 2147483648), state.value / 2147483648);
    Array.from({ length: 5000 }).forEach(() => {
      const [credit, tax, taxable, levy] = [350_000, 2_000_000, 20_000_000, 2_000_000].map((max) =>
        Math.floor(random() * max),
      );
      const split = splitHousingLoanCredit(credit, tax, taxable, levy);
      expect(split.incomeTaxYen + split.residentTaxYen).toBeLessThanOrEqual(credit);
      expect(split.incomeTaxYen).toBeLessThanOrEqual(tax);
      expect(split.residentTaxYen).toBeLessThanOrEqual(Math.min(levy, 97_500));
      expect(split.residentTaxYen).toBeGreaterThanOrEqual(0);
    });
  });
});
