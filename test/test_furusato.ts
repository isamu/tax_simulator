import { describe, expect, test } from "vitest";
import {
  type FurusatoInput,
  coefficientFor,
  computeFurusatoLimit,
  furusatoLimitYen,
  optionalAmount,
} from "../src/utils/furusato";
import type { FurusatoDeductionInput } from "../src/utils/furusatoDeductions";
import { NO_DEPENDENTS, NO_FAMILY_DISABILITIES } from "../src/utils/deductions";

const NO_DEDUCTIONS: FurusatoDeductionInput = {
  socialInsuranceYen: 0,
  smallBusinessMutualYen: 0,
  lifeInsuranceYen: 0,
  earthquakeInsuranceYen: 0,
  medicalYen: 0,
  spouse: null,
  dependents: NO_DEPENDENTS,
  selfDisability: "none",
  familyDisabilities: NO_FAMILY_DISABILITIES,
  singleStatus: "none",
};

// Social insurance 900,000 and iDeCo 300,000: the same amount for income and resident tax.
const BASE_INPUT: FurusatoInput = {
  salesYen: 12_000_000,
  expensesYen: 5_000_000,
  blueDeductionYen: 650_000,
  otherIncomeYen: 0,
  deductions: { ...NO_DEDUCTIONS, socialInsuranceYen: 900_000, smallBusinessMutualYen: 300_000 },
  housingLoanCreditYen: 0,
  taxableOverrideYen: null,
  shotokuwariOverrideYen: null,
};

describe("computeFurusatoLimit worked example", () => {
  test("default inputs", () => {
    const r = computeFurusatoLimit(BASE_INPUT);
    // 12,000,000 - 5,000,000 - 650,000
    expect(r.totalIncomeYen).toBe(6_350_000);
    // Reiwa 8: 4,890,000 < 6,350,000 <= 6,550,000
    expect(r.incomeTaxBasicYen).toBe(670_000);
    expect(r.residentBasicYen).toBe(430_000);
    // 6,350,000 - 1,200,000 - 670,000
    expect(r.taxableYen).toBe(4_480_000);
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
    expect(r.incomeTaxBasicYen).toBe(1_040_000);
    // total 1,350,000 -> basic 1,040,000 / 430,000; resident taxable 1,350,000 - 1,200,000 - 430,000 < 0 -> 0
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

  test("the bracket is judged on income tax taxable income, not resident taxable income", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, salesYen: 9_390_000 });
    // total 3,740,000; income tax taxable 3,740,000 - 1,200,000 - 1,040,000 = 1,500,000 -> 5%
    expect(r.taxableYen).toBe(1_500_000);
    // resident taxable 2,110,000 minus the 50,000 gap would have judged 10%
    expect(r.residentTaxableYen).toBe(2_110_000);
    expect(r.rate).toBe(0.05);
    // (2,110,000 x 10% - 2,500) floored to 100 = 208,500; 208,500 x 20% / (90% - 5% x 1.021) + 2,000
    expect(r.limitYen).toBe(51_119);
  });

  test("the bracket boundary sits at 1,950,000 yen of income tax taxable income", () => {
    // total = taxable + 1,200,000 + 1,040,000; sales = total + 5,650,000
    expect(computeFurusatoLimit({ ...BASE_INPUT, salesYen: 1_949_000 + 2_240_000 + 5_650_000 }).rate).toBe(0.05);
    expect(computeFurusatoLimit({ ...BASE_INPUT, salesYen: 1_950_000 + 2_240_000 + 5_650_000 }).rate).toBe(0.1);
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

describe("furusatoLimitYen", () => {
  test.each([
    // 100,000 x 20% / (90% - 0%) + 2,000
    [0, 100_000, 24_222],
    [1_949_000, 100_000, Math.floor((100_000 * 0.2) / (0.9 - 0.05 * 1.021) + 2_000)],
    [1_950_000, 100_000, Math.floor((100_000 * 0.2) / (0.9 - 0.1 * 1.021) + 2_000)],
    [40_000_000, 100_000, Math.floor((100_000 * 0.2) / (0.9 - 0.45 * 1.021) + 2_000)],
    [1_000_000, 0, 0],
    [1_000_000, -100, 0],
  ])("taxable %d, income levy %d -> %d", (taxableYen, shotokuwariYen, limitYen) =>
    expect(furusatoLimitYen(taxableYen, shotokuwariYen)).toBe(limitYen),
  );

  test("matches computeFurusatoLimit when given the same rate and income levy", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, taxableOverrideYen: 4_480_000 });
    expect(furusatoLimitYen(4_480_000, r.shotokuwariYen)).toBe(r.limitYen);
  });
});

describe("computeFurusatoLimit with the tax return deductions", () => {
  test("family deductions lower both taxable incomes and feed the adjustment gap", () => {
    const deductions: FurusatoDeductionInput = {
      ...BASE_INPUT.deductions,
      spouse: { salaryYen: 0, isElderly: false },
      dependents: { ...NO_DEPENDENTS, specific: 1 },
    };
    const r = computeFurusatoLimit({ ...BASE_INPUT, deductions });
    // spouse 380,000 / 330,000 and specific dependent 630,000 / 450,000
    expect(r.taxableYen).toBe(4_480_000 - 380_000 - 630_000);
    expect(r.residentTaxableYen).toBe(4_720_000 - 330_000 - 450_000);
    // 50,000 + 180,000 = 230,000 gap
    expect(r.personalGapYen).toBe(230_000);
    // above 2,000,000: max((50,000 + 230,000 - (3,940,000 - 2,000,000)) x 5%, 2,500)
    expect(r.adjustYen).toBe(2_500);
  });

  test("life and earthquake insurance count less for resident tax", () => {
    const deductions = { ...BASE_INPUT.deductions, lifeInsuranceYen: 120_000, earthquakeInsuranceYen: 50_000 };
    const r = computeFurusatoLimit({ ...BASE_INPUT, deductions });
    expect(r.taxableYen).toBe(4_480_000 - 170_000);
    // resident: life 70,000 + earthquake 25,000
    expect(r.residentTaxableYen).toBe(4_720_000 - 95_000);
    expect(r.personalGapYen).toBe(0);
  });

  test("without a housing loan the self burden at the limit is 2,000 yen", () =>
    expect(computeFurusatoLimit(BASE_INPUT).selfBurdenAtLimitYen).toBe(2_000));

  test("a housing loan credit that uses up income tax raises the self burden", () => {
    const r = computeFurusatoLimit({ ...BASE_INPUT, housingLoanCreditYen: 10_000_000 });
    // nothing left to absorb (limit - 2,000) x 20%, x 1.021 for the reconstruction surtax
    expect(r.selfBurdenAtLimitYen).toBe(2_000 + Math.ceil((r.limitYen - 2_000) * 0.2 * 1.021));
    expect(r.limitYen).toBe(computeFurusatoLimit(BASE_INPUT).limitYen);
  });

  test("a credit that leaves enough income tax keeps the self burden at 2,000 yen", () => {
    const r = computeFurusatoLimit(BASE_INPUT);
    const roomYen = r.incomeTaxBeforeCreditsYen - Math.ceil((r.limitYen - 2_000) * 0.2);
    expect(computeFurusatoLimit({ ...BASE_INPUT, housingLoanCreditYen: roomYen }).selfBurdenAtLimitYen).toBe(2_000);
    expect(computeFurusatoLimit({ ...BASE_INPUT, housingLoanCreditYen: roomYen + 1_000 }).selfBurdenAtLimitYen).toBe(
      2_000 + Math.ceil(1_000 * 1.021),
    );
  });

  test.each([NaN, -5_000])("an unusable credit (%d) is treated as none", (housingLoanCreditYen) =>
    expect(computeFurusatoLimit({ ...BASE_INPUT, housingLoanCreditYen }).selfBurdenAtLimitYen).toBe(2_000),
  );
});
