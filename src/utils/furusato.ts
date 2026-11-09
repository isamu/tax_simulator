import { incomeTax, incomeTaxBasicDeduction, residentTaxBasicDeduction } from "./tax";
import {
  type DeductionLine,
  type DeductionTotals,
  type FurusatoDeductionInput,
  deductionTotals,
  furusatoDeductionLines,
} from "./furusatoDeductions";

type TaxBracket = { upToYen: number; rate: number; label: string };

export const FURUSATO_TAX_BRACKETS: readonly TaxBracket[] = [
  { upToYen: 1949000, rate: 0.05, label: "195万円未満" },
  { upToYen: 3299000, rate: 0.1, label: "195万〜330万円未満" },
  { upToYen: 6949000, rate: 0.2, label: "330万〜695万円未満" },
  { upToYen: 8999000, rate: 0.23, label: "695万〜900万円未満" },
  { upToYen: 17999000, rate: 0.33, label: "900万〜1,800万円未満" },
  { upToYen: 39999000, rate: 0.4, label: "1,800万〜4,000万円未満" },
  { upToYen: Infinity, rate: 0.45, label: "4,000万円以上" },
];

const RECONSTRUCTION_MULTIPLIER = 1.021;
const SPECIAL_CAP_RATIO = 0.2;
const RESIDENT_BASE_RATIO = 0.1;
const SELF_BURDEN_YEN = 2000;
const BASIC_GAP_FOR_ADJUST_YEN = 50000;
const ADJUST_THRESHOLD_YEN = 2000000;
const ADJUST_RATE = 0.05;
const ADJUST_MIN_YEN = 2500;
const ADJUST_INCOME_LIMIT_YEN = 25000000;
const TAXABLE_UNIT_YEN = 1000;
const SHOTOKUWARI_UNIT_YEN = 100;

export type FurusatoInput = {
  salesYen: number;
  expensesYen: number;
  blueDeductionYen: number;
  otherIncomeYen: number;
  deductions: FurusatoDeductionInput;
  // The income tax part of the housing loan credit (or any other tax credit).
  housingLoanCreditYen: number;
  // `null` means "calculate it".
  taxableOverrideYen: number | null;
  shotokuwariOverrideYen: number | null;
};

export type FurusatoResult = {
  totalIncomeYen: number;
  deductionLines: DeductionLine[];
  personalGapYen: number;
  incomeTaxBeforeCreditsYen: number;
  incomeTaxBasicYen: number;
  residentBasicYen: number;
  taxableYen: number;
  residentTaxableYen: number;
  adjustYen: number;
  shotokuwariYen: number;
  rate: number;
  coefficient: number;
  limitYen: number;
  // Above 2,000 yen when the housing loan credit leaves too little income tax for the donation to reduce.
  selfBurdenAtLimitYen: number;
};

const lookup = <T extends { upToYen: number }>(table: readonly T[], value: number): T | undefined =>
  table.find((row) => value <= row.upToYen);

const floorTo = (value: number, unit: number): number => Math.max(0, Math.floor(value / unit) * unit);

export const coefficientFor = (rate: number): number =>
  SPECIAL_CAP_RATIO / (1 - RESIDENT_BASE_RATIO - rate * RECONSTRUCTION_MULTIPLIER);

const rateFor = (judgeIncomeYen: number): number =>
  judgeIncomeYen <= 0 ? 0 : (lookup(FURUSATO_TAX_BRACKETS, judgeIncomeYen)?.rate ?? NaN);

const adjustmentDeduction = (residentTaxableYen: number, gapYen: number, totalIncomeYen: number): number => {
  if (totalIncomeYen > ADJUST_INCOME_LIMIT_YEN) return 0;
  if (residentTaxableYen <= ADJUST_THRESHOLD_YEN) return Math.min(gapYen, residentTaxableYen) * ADJUST_RATE;
  return Math.max((gapYen - (residentTaxableYen - ADJUST_THRESHOLD_YEN)) * ADJUST_RATE, ADJUST_MIN_YEN);
};

const limitFrom = (shotokuwariYen: number, coefficient: number): number =>
  shotokuwariYen > 0 ? Math.floor(shotokuwariYen * coefficient + SELF_BURDEN_YEN) : 0;

// For salary earners whose income-tax taxable income and resident tax income levy are already known.
export const furusatoLimitYen = (taxableIncomeYen: number, shotokuwariYen: number): number =>
  limitFrom(shotokuwariYen, coefficientFor(rateFor(taxableIncomeYen)));

const totalIncome = (input: FurusatoInput): number => {
  const profitYen = Math.max(0, input.salesYen - input.expensesYen);
  return Math.max(0, profitYen - input.blueDeductionYen) + input.otherIncomeYen;
};

// The income tax part of a donation is (donation - 2,000) x rate; what the remaining income tax cannot absorb is lost.
const selfBurdenAt = (limitYen: number, rate: number, remainingIncomeTaxYen: number): number => {
  const incomeTaxPartYen = Math.max(limitYen - SELF_BURDEN_YEN, 0) * rate;
  const lostYen = Math.max(incomeTaxPartYen - remainingIncomeTaxYen, 0) * RECONSTRUCTION_MULTIPLIER;
  return SELF_BURDEN_YEN + Math.ceil(lostYen);
};

const nonNegative = (yen: number): number => (Number.isFinite(yen) ? Math.max(yen, 0) : 0);

type IncomeAndDeductions = Pick<
  FurusatoResult,
  "totalIncomeYen" | "deductionLines" | "personalGapYen" | "incomeTaxBasicYen" | "residentBasicYen"
> & { deductions: DeductionTotals };

const incomeAndDeductions = (input: FurusatoInput): IncomeAndDeductions => {
  const totalIncomeYen = totalIncome(input);
  const deductionLines = furusatoDeductionLines(input.deductions, totalIncomeYen);
  const deductions = deductionTotals(deductionLines);
  return {
    totalIncomeYen,
    deductionLines,
    deductions,
    personalGapYen: deductions.personalGapYen,
    incomeTaxBasicYen: incomeTaxBasicDeduction(totalIncomeYen),
    residentBasicYen: residentTaxBasicDeduction(totalIncomeYen),
  };
};

type ResidentLevy = Pick<FurusatoResult, "residentTaxableYen" | "adjustYen" | "shotokuwariYen">;

const residentLevy = (base: IncomeAndDeductions, overrideYen: number | null): ResidentLevy => {
  const { totalIncomeYen, deductions, residentBasicYen } = base;
  const residentTaxableYen = floorTo(totalIncomeYen - deductions.residentTaxYen - residentBasicYen, TAXABLE_UNIT_YEN);
  const gapYen = BASIC_GAP_FOR_ADJUST_YEN + deductions.personalGapYen;
  const adjustYen = Math.floor(adjustmentDeduction(residentTaxableYen, gapYen, totalIncomeYen));
  const shotokuwariYen =
    overrideYen ?? floorTo(residentTaxableYen * RESIDENT_BASE_RATIO - adjustYen, SHOTOKUWARI_UNIT_YEN);
  return { residentTaxableYen, adjustYen, shotokuwariYen };
};

export const computeFurusatoLimit = (input: FurusatoInput): FurusatoResult => {
  const { deductions, ...base } = incomeAndDeductions(input);
  const taxableYen =
    input.taxableOverrideYen ??
    floorTo(base.totalIncomeYen - deductions.incomeTaxYen - base.incomeTaxBasicYen, TAXABLE_UNIT_YEN);
  const levy = residentLevy({ deductions, ...base }, input.shotokuwariOverrideYen);
  const rate = rateFor(taxableYen);
  const coefficient = coefficientFor(rate);
  const limitYen = limitFrom(levy.shotokuwariYen, coefficient);
  const incomeTaxBeforeCreditsYen = Math.floor(incomeTax(taxableYen));
  const remainingIncomeTaxYen = Math.max(incomeTaxBeforeCreditsYen - nonNegative(input.housingLoanCreditYen), 0);
  return {
    ...base,
    ...levy,
    incomeTaxBeforeCreditsYen,
    taxableYen,
    rate,
    coefficient,
    limitYen,
    selfBurdenAtLimitYen: selfBurdenAt(limitYen, rate, remainingIncomeTaxYen),
  };
};

// Mirrors the original form: an empty field or null means "not entered".
export const optionalAmount = (value: number | string | null | undefined): number | null =>
  value === "" || value === null || value === undefined ? null : Number(value);
