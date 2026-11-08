import { describe, expect, test } from "vitest";
import { simulateTax } from "../src/utils/simulate";

// Expected values are worked out by hand from the published tables, step by step.
describe("simulateTax worked examples", () => {
  test("4,000,000 yen", () => {
    const r = simulateTax(4_000_000);
    // 4,000,000 / 12 = 333,333 -> grade 340,000
    expect(r.standardMonthlyFeeYen).toBe(340_000);
    // 340,000 x 9.9% / 2 = 16,830
    expect(r.healthInsuranceMonthlyYen).toBe(16_830);
    expect(r.healthInsuranceYearlyYen).toBe(201_960);
    // 340,000 x 18.3% / 2 = 31,110
    expect(r.pensionMonthlyYen).toBe(31_110);
    // 333,333 x 0.3% = 1,000
    expect(r.unemploymentYearlyYen).toBe(12_000);
    expect(r.insuranceSumYen).toBe(587_280);
    // 4,000,000 x 20% + 540,000
    expect(r.salaryDeductionYen).toBe(1_340_000);
    // 2,660,000 - 587,280 - 380,000
    expect(r.taxableIncomeYen).toBe(1_692_720);
    // 1,692,720 x 5%
    expect(r.incomeTaxYen).toBe(84_636);
    expect(r.reconstructionTaxYen).toBe(1_777);
    // (2,660,000 - 587,280 - 350,000) x 10%
    expect(r.localTaxYen).toBe(172_272);
    expect(r.netIncomeYearlyYen).toBe(4_000_000 - 587_280 - 84_636 - 1_777 - 172_272);
  });

  test("1,000,000 yen uses the minimum salary deduction", () => {
    const r = simulateTax(1_000_000);
    // 40% would be 400,000; the minimum is 650,000
    expect(r.salaryDeductionYen).toBe(650_000);
    // 83,333 -> grade 88,000; 88,000 x 9.9% / 2 = 4,356 and x 18.3% / 2 = 8,052
    expect(r.healthInsuranceMonthlyYen).toBe(4_356);
    expect(r.pensionMonthlyYen).toBe(8_052);
    expect(r.taxableIncomeYen).toBe(0);
    expect(r.taxSumYen).toBe(0);
    expect(r.netIncomeYearlyYen).toBe(1_000_000 - r.insuranceSumYen);
  });

  test("pension uses its own floor of 88,000 yen", () => {
    const r = simulateTax(600_000);
    expect(r.standardMonthlyFeeYen).toBe(58_000);
    // 58,000 x 9.9% / 2 = 2,871
    expect(r.healthInsuranceMonthlyYen).toBe(2_871);
    // 88,000 x 18.3% / 2 = 8,052
    expect(r.pensionMonthlyYen).toBe(8_052);
  });

  test("pension is capped at 620,000 yen", () => {
    const r = simulateTax(20_000_000);
    expect(r.standardMonthlyFeeYen).toBe(1_390_000);
    // 620,000 x 18.3% / 2 = 56,730
    expect(r.pensionMonthlyYen).toBe(56_730);
    expect(r.salaryDeductionYen).toBe(2_200_000);
  });

  test("salary below the minimum deduction leaves no salary income", () => {
    const r = simulateTax(500_000);
    expect(r.salaryDeductionYen).toBe(500_000);
    expect(r.taxSumYen).toBe(0);
  });
});

const seededRandom = (seed: number): (() => number) => {
  const state = { value: seed };
  return () => {
    state.value = (state.value * 1103515245 + 12345) % 2147483648;
    return state.value / 2147483648;
  };
};

describe("simulateTax properties", () => {
  const seed = Number(process.env.TEST_SEED ?? Date.now());
  const random = seededRandom(seed);
  const incomes = Array.from({ length: 2000 }, () => Math.floor(random() * 50_000_000));

  test(`totals are consistent (seed ${seed})`, () => {
    incomes.forEach((income) => {
      const r = simulateTax(income);
      expect(r.insuranceSumYen).toBe(r.healthInsuranceYearlyYen + r.pensionYearlyYen + r.unemploymentYearlyYen);
      expect(r.taxSumYen).toBe(r.incomeTaxYen + r.reconstructionTaxYen + r.localTaxYen);
      expect(r.insuranceTotalWithCompanyYen).toBe(r.insuranceSumYen * 2);
      expect(r.netIncomeYearlyYen).toBe(income - r.insuranceSumYen - r.taxSumYen);
      expect(r.taxableIncomeYen).toBeGreaterThanOrEqual(0);
      expect(r.salaryDeductionYen).toBeLessThanOrEqual(income);
    });
  });

  test(`take-home pay grows with income above the insurance floor (seed ${seed})`, () => {
    const sorted = incomes.filter((income) => income >= 2_000_000).sort((a, b) => a - b);
    sorted.slice(1).forEach((income, index) => {
      const previous = sorted[index];
      if (income - previous < 100_000) return;
      expect(simulateTax(income).netIncomeYearlyYen).toBeGreaterThan(simulateTax(previous).netIncomeYearlyYen);
    });
  });
});
