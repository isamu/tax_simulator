type TaxBracket = { upToYen: number; rate: number; label: string };
type AmountBracket = { upToYen: number; amountYen: number };

export const FURUSATO_TAX_BRACKETS: readonly TaxBracket[] = [
  { upToYen: 1949000, rate: 0.05, label: "195万円未満" },
  { upToYen: 3299000, rate: 0.1, label: "195万〜330万円未満" },
  { upToYen: 6949000, rate: 0.2, label: "330万〜695万円未満" },
  { upToYen: 8999000, rate: 0.23, label: "695万〜900万円未満" },
  { upToYen: 17999000, rate: 0.33, label: "900万〜1,800万円未満" },
  { upToYen: 39999000, rate: 0.4, label: "1,800万〜4,000万円未満" },
  { upToYen: Infinity, rate: 0.45, label: "4,000万円以上" },
];

// Reiwa 7 (2025) basic deductions.
const INCOME_TAX_BASIC: readonly AmountBracket[] = [
  { upToYen: 1320000, amountYen: 950000 },
  { upToYen: 3360000, amountYen: 880000 },
  { upToYen: 4890000, amountYen: 680000 },
  { upToYen: 6550000, amountYen: 630000 },
  { upToYen: 23500000, amountYen: 580000 },
  { upToYen: 24000000, amountYen: 480000 },
  { upToYen: 24500000, amountYen: 320000 },
  { upToYen: 25000000, amountYen: 160000 },
  { upToYen: Infinity, amountYen: 0 },
];

const RESIDENT_BASIC: readonly AmountBracket[] = [
  { upToYen: 24000000, amountYen: 430000 },
  { upToYen: 24500000, amountYen: 290000 },
  { upToYen: 25000000, amountYen: 150000 },
  { upToYen: Infinity, amountYen: 0 },
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
  socialInsuranceYen: number;
  otherDeductionYen: number;
  personalGapYen: number;
  // `null` means "calculate it".
  taxableOverrideYen: number | null;
  shotokuwariOverrideYen: number | null;
};

export type FurusatoResult = {
  totalIncomeYen: number;
  incomeTaxBasicYen: number;
  residentBasicYen: number;
  taxableYen: number;
  residentTaxableYen: number;
  adjustYen: number;
  shotokuwariYen: number;
  rate: number;
  coefficient: number;
  limitYen: number;
};

const lookup = <T extends { upToYen: number }>(table: readonly T[], value: number): T | undefined =>
  table.find((row) => value <= row.upToYen);

const floorTo = (value: number, unit: number): number => Math.max(0, Math.floor(value / unit) * unit);

export const coefficientFor = (rate: number): number =>
  SPECIAL_CAP_RATIO / (1 - RESIDENT_BASE_RATIO - rate * RECONSTRUCTION_MULTIPLIER);

const rateFor = (judgeIncomeYen: number): number =>
  judgeIncomeYen <= 0 ? 0 : (lookup(FURUSATO_TAX_BRACKETS, judgeIncomeYen)?.rate ?? NaN);

const amountFor = (table: readonly AmountBracket[], valueYen: number): number =>
  lookup(table, valueYen)?.amountYen ?? NaN;

const adjustmentDeduction = (residentTaxableYen: number, gapYen: number, totalIncomeYen: number): number => {
  if (totalIncomeYen > ADJUST_INCOME_LIMIT_YEN) return 0;
  if (residentTaxableYen <= ADJUST_THRESHOLD_YEN) return Math.min(gapYen, residentTaxableYen) * ADJUST_RATE;
  return Math.max((gapYen - (residentTaxableYen - ADJUST_THRESHOLD_YEN)) * ADJUST_RATE, ADJUST_MIN_YEN);
};

type IncomeAndDeductions = Pick<FurusatoResult, "totalIncomeYen" | "incomeTaxBasicYen" | "residentBasicYen"> & {
  commonDeductionsYen: number;
};

const incomeAndDeductions = (input: FurusatoInput): IncomeAndDeductions => {
  const profitYen = Math.max(0, input.salesYen - input.expensesYen);
  const totalIncomeYen = Math.max(0, profitYen - input.blueDeductionYen) + input.otherIncomeYen;
  return {
    totalIncomeYen,
    commonDeductionsYen: input.socialInsuranceYen + input.otherDeductionYen,
    incomeTaxBasicYen: amountFor(INCOME_TAX_BASIC, totalIncomeYen),
    residentBasicYen: amountFor(RESIDENT_BASIC, totalIncomeYen),
  };
};

export const computeFurusatoLimit = (input: FurusatoInput): FurusatoResult => {
  const { totalIncomeYen, commonDeductionsYen, incomeTaxBasicYen, residentBasicYen } = incomeAndDeductions(input);
  const taxableYen =
    input.taxableOverrideYen ??
    floorTo(totalIncomeYen - commonDeductionsYen - incomeTaxBasicYen - input.personalGapYen, TAXABLE_UNIT_YEN);
  const residentTaxableYen = floorTo(totalIncomeYen - commonDeductionsYen - residentBasicYen, TAXABLE_UNIT_YEN);
  const gapYen = BASIC_GAP_FOR_ADJUST_YEN + input.personalGapYen;
  const adjustYen = Math.floor(adjustmentDeduction(residentTaxableYen, gapYen, totalIncomeYen));
  const shotokuwariYen =
    input.shotokuwariOverrideYen ?? floorTo(residentTaxableYen * RESIDENT_BASE_RATIO - adjustYen, SHOTOKUWARI_UNIT_YEN);
  const rate = rateFor(input.taxableOverrideYen ?? residentTaxableYen - gapYen);
  const coefficient = coefficientFor(rate);
  const limitYen = shotokuwariYen > 0 ? Math.floor(shotokuwariYen * coefficient + SELF_BURDEN_YEN) : 0;
  return {
    totalIncomeYen,
    incomeTaxBasicYen,
    residentBasicYen,
    taxableYen,
    residentTaxableYen,
    adjustYen,
    shotokuwariYen,
    rate,
    coefficient,
    limitYen,
  };
};

// Mirrors the original form: an empty field or null means "not entered".
export const optionalAmount = (value: number | string | null | undefined): number | null =>
  value === "" || value === null || value === undefined ? null : Number(value);
