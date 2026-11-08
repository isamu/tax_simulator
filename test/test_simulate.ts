import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { simulateTax, type TaxSimulation } from "../src/utils/simulate";

type GoldenRow = Record<string, number | number[]> & { income_gross: number };

const isGoldenRow = (value: unknown): value is GoldenRow =>
  typeof value === "object" && value !== null && "income_gross" in value && typeof value.income_gross === "number";

const loadGolden = (): GoldenRow[] => {
  const parsed: unknown = JSON.parse(readFileSync(new URL("./fixtures/simulation_2018.json", import.meta.url), "utf8"));
  if (!Array.isArray(parsed) || !parsed.every(isGoldenRow)) {
    throw new Error("simulation_2018.json is malformed");
  }
  return parsed;
};

// Fixture values were produced by the Vue 2 implementation's change(); keys keep its field names.
const GOLDEN_FIELDS: [string, (r: TaxSimulation) => number | number[]][] = [
  ["standard_monthly_fee", (r) => r.standardMonthlyFeeYen],
  ["insurance", (r) => r.healthInsuranceMonthlyYen],
  ["insurance_year", (r) => r.healthInsuranceYearlyYen],
  ["pension", (r) => r.pensionMonthlyYen],
  ["pension_year", (r) => r.pensionYearlyYen],
  ["unemployee", (r) => r.unemploymentMonthlyYen],
  ["unemployee_year", (r) => r.unemploymentYearlyYen],
  ["income_deduction", (r) => r.salaryDeductionYen],
  ["income", (r) => r.taxableIncomeYen],
  ["income_tax", (r) => r.incomeTaxYen],
  ["special_income_tax", (r) => r.reconstructionTaxYen],
  ["local_tax", (r) => r.localTaxYen],
  ["net_income", (r) => r.netIncomeYearlyYen],
  ["net_income_per_month", (r) => r.netIncomeMonthlyYen],
  ["insurance_sum", (r) => r.insuranceSumYen],
  ["tax_sum", (r) => r.taxSumYen],
  ["insurance_pay_sum", (r) => r.insuranceTotalWithCompanyYen],
  ["budgets", (r) => r.budgetsYen],
];

describe("simulateTax golden values", () => {
  loadGolden().forEach((row) => {
    test(`income ${row.income_gross}`, () => {
      const result = simulateTax(row.income_gross);
      GOLDEN_FIELDS.forEach(([key, pick]) => expect(pick(result), key).toEqual(row[key]));
    });
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
      expect(r.taxableIncomeYen).toBeGreaterThanOrEqual(0);
      expect(r.localTaxYen).toBeGreaterThanOrEqual(0);
      expect(Math.abs(r.netIncomeYearlyYen - (income - r.insuranceSumYen - r.taxSumYen))).toBeLessThanOrEqual(1);
    });
  });
});
