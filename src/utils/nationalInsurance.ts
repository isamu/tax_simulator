// Tokyo special wards common standard (20 of 23 wards), FY2026, for a single insured person.
type Portion = { incomeRate: number; perCapitaYen: number; capYen: number };

const BASIC: Portion = { incomeRate: 0.0751, perCapitaYen: 47600, capYen: 670000 };
const ELDERLY_SUPPORT: Portion = { incomeRate: 0.028, perCapitaYen: 17600, capYen: 260000 };
const CARE: Portion = { incomeRate: 0.0243, perCapitaYen: 17800, capYen: 170000 };
const CHILD_SUPPORT: Portion = { incomeRate: 0.0027, perCapitaYen: 1873, capYen: 30000 };

const NATIONAL_PENSION_MONTHLY_YEN = 17920;
const MONTHS_PER_YEAR = 12;

// Per-capita reductions are judged on total income before the basic deduction (one insured person).
const REDUCTION_BASE_YEN = 430000;
const REDUCTIONS: readonly { upToYen: number; ratio: number }[] = [
  { upToYen: REDUCTION_BASE_YEN, ratio: 0.7 },
  { upToYen: REDUCTION_BASE_YEN + 310000, ratio: 0.5 },
  { upToYen: REDUCTION_BASE_YEN + 570000, ratio: 0.2 },
];

export const perCapitaReduction = (totalIncomeYen: number): number =>
  REDUCTIONS.find(({ upToYen }) => totalIncomeYen <= upToYen)?.ratio ?? 0;

const portionYen = (portion: Portion, assessmentBaseYen: number, reduction: number): number => {
  const incomePartYen = Math.floor(assessmentBaseYen * portion.incomeRate);
  const perCapitaYen = Math.floor(portion.perCapitaYen * (1 - reduction));
  return Math.min(incomePartYen + perCapitaYen, portion.capYen);
};

export type NationalInsurance = {
  healthYen: number;
  elderlySupportYen: number;
  careYen: number;
  childSupportYen: number;
  pensionYen: number;
};

// assessmentBaseYen: total income minus the resident tax basic deduction (旧ただし書き所得).
export const nationalInsurance = (
  totalIncomeYen: number,
  residentBasicDeductionYen: number,
  paysCareInsurance: boolean,
): NationalInsurance => {
  const assessmentBaseYen = Math.max(totalIncomeYen - residentBasicDeductionYen, 0);
  const reduction = perCapitaReduction(totalIncomeYen);
  return {
    healthYen: portionYen(BASIC, assessmentBaseYen, reduction),
    elderlySupportYen: portionYen(ELDERLY_SUPPORT, assessmentBaseYen, reduction),
    careYen: paysCareInsurance ? portionYen(CARE, assessmentBaseYen, reduction) : 0,
    childSupportYen: portionYen(CHILD_SUPPORT, assessmentBaseYen, reduction),
    pensionYen: NATIONAL_PENSION_MONTHLY_YEN * MONTHS_PER_YEAR,
  };
};
