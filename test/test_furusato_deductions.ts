import { describe, expect, test } from "vitest";
import { type FurusatoDeductionInput, deductionTotals, furusatoDeductionLines } from "../src/utils/furusatoDeductions";
import { NO_DEPENDENTS, NO_FAMILY_DISABILITIES } from "../src/utils/deductions";

const NONE: FurusatoDeductionInput = {
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

const lineFor = (input: Partial<FurusatoDeductionInput>, label: string, ownIncomeYen = 5_000_000) =>
  furusatoDeductionLines({ ...NONE, ...input }, ownIncomeYen).find((line) => line.label === label);

describe("furusatoDeductionLines", () => {
  test("lines follow the tax return order", () =>
    expect(furusatoDeductionLines(NONE, 5_000_000).map(({ label }) => label)).toEqual([
      "社会保険料控除",
      "小規模企業共済等掛金控除",
      "生命保険料控除",
      "地震保険料控除",
      "寡婦・ひとり親控除",
      "障害者控除",
      "配偶者（特別）控除",
      "扶養控除",
      "医療費控除",
    ]));

  test.each([
    // each category maxed: 40,000 -> 28,000
    [40_000, 28_000],
    [80_000, 56_000],
    [120_000, 70_000],
    [200_000, 70_000],
    [0, 0],
    [-1, 0],
    [NaN, 0],
  ])("life insurance %d -> resident %d", (incomeTaxYen, residentTaxYen) =>
    expect(lineFor({ lifeInsuranceYen: incomeTaxYen }, "生命保険料控除")?.residentTaxYen).toBe(residentTaxYen),
  );

  test.each([
    [50_000, 25_000],
    [30_001, 15_000],
    [80_000, 25_000],
    [0, 0],
  ])("earthquake insurance %d -> resident %d", (incomeTaxYen, residentTaxYen) =>
    expect(lineFor({ earthquakeInsuranceYen: incomeTaxYen }, "地震保険料控除")?.residentTaxYen).toBe(residentTaxYen),
  );

  test("social insurance, small business mutual aid and medical are the same for both taxes", () => {
    const lines = furusatoDeductionLines(
      { ...NONE, socialInsuranceYen: 900_000, smallBusinessMutualYen: 276_000, medicalYen: 50_000 },
      5_000_000,
    );
    lines.forEach((line) => expect(line.incomeTaxYen).toBe(line.residentTaxYen));
  });

  test("the spouse deduction depends on the taxpayer's own income", () => {
    const spouse = { salaryYen: 0, isElderly: false };
    expect(lineFor({ spouse }, "配偶者（特別）控除", 5_000_000)).toMatchObject({ incomeTaxYen: 380_000 });
    expect(lineFor({ spouse }, "配偶者（特別）控除", 9_200_000)).toMatchObject({ incomeTaxYen: 260_000 });
    expect(lineFor({ spouse }, "配偶者（特別）控除", 10_000_001)).toMatchObject({ incomeTaxYen: 0 });
  });

  test("the single parent deduction stops above 5,000,000 yen of own income", () => {
    expect(lineFor({ singleStatus: "singleParent" }, "寡婦・ひとり親控除", 5_000_000)?.incomeTaxYen).toBe(350_000);
    expect(lineFor({ singleStatus: "singleParent" }, "寡婦・ひとり親控除", 5_000_001)?.incomeTaxYen).toBe(0);
  });
});

describe("deductionTotals", () => {
  test("adds both taxes and takes the personal gap only from family deductions", () => {
    const input: FurusatoDeductionInput = {
      ...NONE,
      socialInsuranceYen: 900_000,
      lifeInsuranceYen: 120_000,
      spouse: { salaryYen: 0, isElderly: true },
      dependents: { ...NO_DEPENDENTS, general: 1, cohabitingParents: 1 },
      selfDisability: "special",
      singleStatus: "none",
    };
    const totals = deductionTotals(furusatoDeductionLines(input, 5_000_000));
    // 900,000 + 120,000 + 480,000 + 380,000 + 580,000 + 400,000
    expect(totals.incomeTaxYen).toBe(2_860_000);
    // 900,000 + 70,000 + 380,000 + 330,000 + 450,000 + 300,000
    expect(totals.residentTaxYen).toBe(2_430_000);
    // elderly spouse 100,000 + general 50,000 + cohabiting parent 130,000 + special disability 100,000
    expect(totals.personalGapYen).toBe(380_000);
  });

  test("no deductions add up to zero", () =>
    expect(deductionTotals(furusatoDeductionLines(NONE, 5_000_000))).toEqual({
      incomeTaxYen: 0,
      residentTaxYen: 0,
      personalGapYen: 0,
    }));
});
