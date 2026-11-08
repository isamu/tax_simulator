import { describe, expect, test } from "vitest";
import { DEFAULT_HOUSEHOLD, type Household, simulateTax } from "../src/utils/simulate";

// Expected values are worked out by hand from the published tables, step by step.
describe("simulateTax worked examples", () => {
  test("4,000,000 yen", () => {
    const r = simulateTax(4_000_000);
    // 4,000,000 / 12 = 333,333 -> grade 340,000
    expect(r.standardMonthlyFeeYen).toBe(340_000);
    // 340,000 x 9.9% / 2 = 16,830
    expect(r.healthInsuranceMonthlyYen).toBe(16_830);
    // 340,000 x 0.23% / 2 = 391
    expect(r.childSupportMonthlyYen).toBe(391);
    // 340,000 x 18.3% / 2 = 31,110
    expect(r.pensionMonthlyYen).toBe(31_110);
    // 333,333 x 0.5% = 1,667
    expect(r.unemploymentMonthlyYen).toBe(1_667);
    expect(r.insuranceSumYen).toBe((16_830 + 391 + 31_110 + 1_667) * 12);
    // 4,000,000 x 20% + 440,000
    expect(r.salaryDeductionYen).toBe(1_240_000);
    // salary income 2,760,000 <= 4,890,000
    expect(r.basicDeductionYen).toBe(1_040_000);
    // 2,760,000 - 599,976 - 1,040,000 = 1,120,024, floored to 1,000 yen
    expect(r.taxableIncomeYen).toBe(1_120_000);
    expect(r.incomeTaxYen).toBe(56_000);
    expect(r.reconstructionTaxYen).toBe(1_176);
    // (2,760,000 - 599,976 - 430,000) floored = 1,730,000 x 10%
    expect(r.localTaxYen).toBe(173_000);
    expect(r.netIncomeYearlyYen).toBe(4_000_000 - 599_976 - 56_000 - 1_176 - 173_000);
    // employer: same health, child support and pension as the employee
    expect(r.employer).toEqual({
      healthInsuranceYen: 201_960,
      childSupportYen: 4_692,
      careInsuranceYen: 0,
      pensionYen: 373_320,
      // 333,333 x 0.85% = 2,833 per month
      unemploymentYen: 33_996,
      // 340,000 x 0.36% = 1,224 per month
      childContributionYen: 14_688,
      // 333,333 x 0.3% = 1,000 per month
      workersCompYen: 12_000,
      totalYen: 640_656,
    });
    expect(r.companyInsuranceYen).toBe(640_656);
    expect(r.totalLaborCostYen).toBe(4_640_656);
  });

  test("1,000,000 yen uses the minimum salary deduction", () => {
    const r = simulateTax(1_000_000);
    // 30% + 80,000 would be 380,000; the minimum is 740,000
    expect(r.salaryDeductionYen).toBe(740_000);
    // 83,333 -> grade 88,000
    expect(r.healthInsuranceMonthlyYen).toBe(4_356);
    expect(r.childSupportMonthlyYen).toBe(101);
    expect(r.pensionMonthlyYen).toBe(8_052);
    expect(r.taxSumYen).toBe(0);
    expect(r.netIncomeYearlyYen).toBe(1_000_000 - r.insuranceSumYen);
  });

  test("pension uses its own floor of 88,000 yen", () => {
    const r = simulateTax(600_000);
    expect(r.standardMonthlyFeeYen).toBe(58_000);
    expect(r.healthInsuranceMonthlyYen).toBe(2_871);
    expect(r.pensionMonthlyYen).toBe(8_052);
  });

  test("pension is capped at 650,000 yen", () => {
    const r = simulateTax(20_000_000);
    expect(r.standardMonthlyFeeYen).toBe(1_390_000);
    // 650,000 x 18.3% / 2 = 59,475
    expect(r.pensionMonthlyYen).toBe(59_475);
    expect(r.salaryDeductionYen).toBe(1_950_000);
    // salary income 18,050,000 -> 620,000
    expect(r.basicDeductionYen).toBe(620_000);
  });

  test("basic deduction drops once salary income passes 4,890,000 yen", () => {
    // 6,650,000 - (665,000 + 1,100,000) = 4,885,000
    expect(simulateTax(6_650_000).basicDeductionYen).toBe(1_040_000);
    // 6,700,000 - (670,000 + 1,100,000) = 4,930,000
    expect(simulateTax(6_700_000).basicDeductionYen).toBe(670_000);
  });

  test("4,000,000 yen aged 40-64 adds care insurance", () => {
    const r = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, paysCareInsurance: true });
    // 340,000 x 1.62% / 2 = 2,754
    expect(r.careInsuranceMonthlyYen).toBe(2_754);
    expect(r.insuranceSumYen).toBe(599_976 + 2_754 * 12);
    // 2,760,000 - 633,024 - 1,040,000 = 1,086,976, floored
    expect(r.taxableIncomeYen).toBe(1_086_000);
    expect(r.incomeTaxYen).toBe(54_300);
    // (2,760,000 - 633,024 - 430,000) floored = 1,696,000 x 10%
    expect(r.localTaxYen).toBe(169_600);
    expect(r.employer.careInsuranceYen).toBe(2_754 * 12);
    expect(r.companyInsuranceYen).toBe(640_656 + 2_754 * 12);
  });

  test("care insurance is zero when not aged 40-64", () => {
    expect(simulateTax(4_000_000, DEFAULT_HOUSEHOLD).careInsuranceMonthlyYen).toBe(0);
  });

  test("4,000,000 yen with a spouse earning nothing", () => {
    const r = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, spouse: { salaryYen: 0, isElderly: false } });
    expect(r.spouseDeduction).toEqual({ incomeTaxYen: 380_000, residentTaxYen: 330_000 });
    // 2,760,000 - 599,976 - 1,040,000 - 380,000 = 740,024, floored
    expect(r.taxableIncomeYen).toBe(740_000);
    expect(r.incomeTaxYen).toBe(37_000);
    // (2,760,000 - 599,976 - 430,000 - 330,000) floored = 1,400,000 x 10%
    expect(r.localTaxYen).toBe(140_000);
  });

  test("4,000,000 yen with one general and one specific dependent", () => {
    const dependents = { general: 1, specific: 1, elderly: 0, cohabitingParents: 0 };
    const r = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, dependents });
    expect(r.dependentDeduction).toEqual({ incomeTaxYen: 1_010_000, residentTaxYen: 780_000 });
    // 2,760,000 - 599,976 - 1,040,000 - 1,010,000 = 110,024, floored
    expect(r.taxableIncomeYen).toBe(110_000);
    expect(r.incomeTaxYen).toBe(5_500);
    // (2,760,000 - 599,976 - 430,000 - 780,000) floored = 950,000 x 10%
    expect(r.localTaxYen).toBe(95_000);
  });

  test("4,000,000 yen as a single parent", () => {
    const r = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, singleStatus: "singleParent" });
    // 2,760,000 - 599,976 - 1,040,000 - 350,000 = 770,024, floored
    expect(r.incomeTaxYen).toBe(38_500);
    // (2,760,000 - 599,976 - 430,000 - 300,000) floored = 1,430,000 x 10%
    expect(r.localTaxYen).toBe(143_000);
  });

  test("single parent deduction stops above 5,000,000 yen of salary income", () => {
    // 7,000,000 - 1,800,000 = 5,200,000
    const r = simulateTax(7_000_000, { ...DEFAULT_HOUSEHOLD, singleStatus: "singleParent" });
    expect(r.singleStatusDeduction).toEqual({ incomeTaxYen: 0, residentTaxYen: 0 });
  });

  test("disability deductions add to the personal deductions", () => {
    const household: Household = {
      ...DEFAULT_HOUSEHOLD,
      selfDisability: "regular",
      familyDisabilities: { regular: 0, special: 0, cohabitingSpecial: 1 },
    };
    const r = simulateTax(4_000_000, household);
    // 270,000 + 750,000 = 1,020,000: 2,760,000 - 599,976 - 1,040,000 - 1,020,000 = 100,024
    expect(r.taxableIncomeYen).toBe(100_000);
    // 260,000 + 530,000 = 790,000: 2,760,000 - 599,976 - 430,000 - 790,000 = 940,024
    expect(r.localTaxYen).toBe(94_000);
  });

  test("4,000,000 yen on National Health Insurance and the National Pension", () => {
    const r = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, nationalInsurance: true });
    // basic 222,583 + elderly support 82,840
    expect(r.healthInsuranceYearlyYen).toBe(305_423);
    expect(r.childSupportYearlyYen).toBe(8_164);
    expect(r.pensionYearlyYen).toBe(215_040);
    expect(r.unemploymentYearlyYen).toBe(20_004);
    expect(r.insuranceSumYen).toBe(548_631);
    // 2,760,000 - 548,631 - 1,040,000 = 1,171,369, floored
    expect(r.incomeTaxYen).toBe(58_550);
    // (2,760,000 - 548,631 - 430,000) floored = 1,781,000 x 10%
    expect(r.localTaxYen).toBe(178_100);
    // the employer pays only employment (33,996) and workers' compensation (12,000) insurance
    expect(r.companyInsuranceYen).toBe(45_996);
    expect(r.employer.pensionYen).toBe(0);
    expect(r.employer.childContributionYen).toBe(0);
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
      const r = simulateTax(income, {
        ...DEFAULT_HOUSEHOLD,
        paysCareInsurance: random() < 0.5,
        nationalInsurance: random() < 0.5,
      });
      expect(r.insuranceSumYen).toBe(
        r.healthInsuranceYearlyYen +
          r.childSupportYearlyYen +
          r.careInsuranceYearlyYen +
          r.pensionYearlyYen +
          r.unemploymentYearlyYen,
      );
      expect(r.taxSumYen).toBe(r.incomeTaxYen + r.reconstructionTaxYen + r.localTaxYen);
      expect(r.insuranceTotalWithCompanyYen).toBe(r.insuranceSumYen + r.companyInsuranceYen);
      expect(r.totalLaborCostYen).toBe(income + r.companyInsuranceYen);
      expect(r.employer.pensionYen).toBe(r.isNationalInsurance ? 0 : r.pensionYearlyYen);
      expect(r.netIncomeYearlyYen).toBe(income - r.insuranceSumYen - r.taxSumYen);
      expect(r.taxableIncomeYen).toBeGreaterThanOrEqual(0);
      expect(r.salaryDeductionYen).toBeLessThanOrEqual(income);
    });
  });

  test(`take-home pay grows with income above the insurance floor (seed ${seed})`, () => {
    const sorted = incomes.filter((income) => income >= 2_000_000).sort((a, b) => a - b);
    sorted.slice(1).forEach((income, index) => {
      const previous = sorted[index];
      // The basic deduction steps down at fixed incomes, so only compare raises larger than that step.
      if (income - previous < 500_000) return;
      expect(simulateTax(income).netIncomeYearlyYen).toBeGreaterThan(simulateTax(previous).netIncomeYearlyYen);
    });
  });
});
