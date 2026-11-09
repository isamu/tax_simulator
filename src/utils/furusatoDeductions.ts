import {
  type Dependents,
  type FamilyDisabilities,
  type PersonalDeduction,
  type SelfDisability,
  type SingleStatus,
  type Spouse,
  NO_DEDUCTION,
  addDeductions,
  dependentDeduction,
  disabilityDeduction,
  singleStatusDeduction,
  spouseDeduction,
} from "./deductions";

// The amounts written on the tax return (income tax); resident tax amounts are derived from them.
export type FurusatoDeductionInput = {
  socialInsuranceYen: number;
  smallBusinessMutualYen: number;
  lifeInsuranceYen: number;
  earthquakeInsuranceYen: number;
  medicalYen: number;
  spouse: Spouse | null;
  dependents: Dependents;
  selfDisability: SelfDisability;
  familyDisabilities: FamilyDisabilities;
  singleStatus: SingleStatus;
};

export type DeductionLine = PersonalDeduction & { label: string; isPersonal: boolean };

export type DeductionTotals = PersonalDeduction & { personalGapYen: number };

// Each life insurance category is capped at 40,000 yen for income tax and 28,000 yen for resident tax.
const LIFE_RESIDENT_RATIO = 0.7;
const LIFE_RESIDENT_CAP_YEN = 70000;
// Resident tax allows half the premium up to 25,000 yen; the income tax amount is the premium up to 50,000 yen.
const EARTHQUAKE_RESIDENT_CAP_YEN = 25000;

const amount = (yen: number): number => (Number.isFinite(yen) ? Math.max(yen, 0) : 0);

const same = (yen: number): PersonalDeduction => ({ incomeTaxYen: amount(yen), residentTaxYen: amount(yen) });

const lifeInsurance = (yen: number): PersonalDeduction => ({
  incomeTaxYen: amount(yen),
  residentTaxYen: Math.min(Math.floor(amount(yen) * LIFE_RESIDENT_RATIO), LIFE_RESIDENT_CAP_YEN),
});

const earthquakeInsurance = (yen: number): PersonalDeduction => ({
  incomeTaxYen: amount(yen),
  residentTaxYen: Math.min(Math.floor(amount(yen) / 2), EARTHQUAKE_RESIDENT_CAP_YEN),
});

const line = (label: string, deduction: PersonalDeduction, isPersonal = false): DeductionLine => ({
  label,
  isPersonal,
  ...deduction,
});

// In the order of the tax return's "amounts deducted from income"; the basic deduction is computed separately.
export const furusatoDeductionLines = (input: FurusatoDeductionInput, ownTotalIncomeYen: number): DeductionLine[] => [
  line("社会保険料控除", same(input.socialInsuranceYen)),
  line("小規模企業共済等掛金控除", same(input.smallBusinessMutualYen)),
  line("生命保険料控除", lifeInsurance(input.lifeInsuranceYen)),
  line("地震保険料控除", earthquakeInsurance(input.earthquakeInsuranceYen)),
  line("寡婦・ひとり親控除", singleStatusDeduction(input.singleStatus, ownTotalIncomeYen), true),
  line("障害者控除", disabilityDeduction(input.selfDisability, input.familyDisabilities), true),
  line("配偶者（特別）控除", spouseDeduction(ownTotalIncomeYen, input.spouse), true),
  line("扶養控除", dependentDeduction(input.dependents), true),
  line("医療費控除", same(input.medicalYen)),
];

export const deductionTotals = (lines: DeductionLine[]): DeductionTotals => ({
  ...lines.reduce<PersonalDeduction>(addDeductions, NO_DEDUCTION),
  personalGapYen: lines
    .filter(({ isPersonal }) => isPersonal)
    .reduce((sum, { incomeTaxYen, residentTaxYen }) => sum + incomeTaxYen - residentTaxYen, 0),
});
