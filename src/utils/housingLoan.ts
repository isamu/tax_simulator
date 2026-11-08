export type HomeKind = "new" | "used";
export type HomePerformance = "certified" | "zeh" | "energySaving" | "other";
export type MoveInPeriod = "r4to5" | "r6to7" | "r8";

export type HousingLoan = {
  balanceYen: number;
  kind: HomeKind;
  performance: HomePerformance;
  moveIn: MoveInPeriod;
  // Under 40 with a spouse, married to someone under 40, or with a dependent under 19.
  childRearing: boolean;
};

export const DEFAULT_HOUSING_LOAN: HousingLoan = {
  balanceYen: 0,
  kind: "new",
  performance: "energySaving",
  moveIn: "r8",
  childRearing: false,
};

export type TaxCredit = { incomeTaxYen: number; residentTaxYen: number };

export const NO_TAX_CREDIT: TaxCredit = { incomeTaxYen: 0, residentTaxYen: 0 };

// [general, child-rearing household]; NTA No.1211-1 and No.1211-3 as of April 2026.
type CapPairYen = [number, number];
type CapsByMoveIn = Record<MoveInPeriod, CapPairYen>;

const sameForAll = (capYen: number): CapsByMoveIn => ({
  r4to5: [capYen, capYen],
  r6to7: [capYen, capYen],
  r8: [capYen, capYen],
});

const CAP_YEN: Record<HomeKind, Record<HomePerformance, CapsByMoveIn>> = {
  new: {
    certified: { r4to5: [350000, 350000], r6to7: [315000, 350000], r8: [315000, 350000] },
    zeh: { r4to5: [315000, 315000], r6to7: [245000, 315000], r8: [245000, 315000] },
    energySaving: { r4to5: [280000, 280000], r6to7: [210000, 280000], r8: [140000, 210000] },
    // Homes with building approval by the end of 2023 keep a 140,000 yen cap; that exception is not modelled.
    other: { r4to5: [210000, 210000], r6to7: [0, 0], r8: [0, 0] },
  },
  used: {
    certified: { r4to5: [210000, 210000], r6to7: [210000, 210000], r8: [245000, 315000] },
    zeh: { r4to5: [210000, 210000], r6to7: [210000, 210000], r8: [245000, 315000] },
    energySaving: { r4to5: [210000, 210000], r6to7: [210000, 210000], r8: [140000, 210000] },
    other: sameForAll(140000),
  },
};

// 0.7% as an integer ratio so that round balances do not pick up floating-point error.
const CREDIT_RATE_NUMERATOR = 7;
const CREDIT_RATE_DENOMINATOR = 1000;
const CREDIT_UNIT_YEN = 100;
const TOTAL_INCOME_LIMIT_YEN = 20000000;
const RESIDENT_CAP_PERCENT = 5;
const RESIDENT_CAP_YEN = 97500;
const PERCENT = 100;

export const housingLoanCapYen = (loan: HousingLoan): number =>
  CAP_YEN[loan.kind][loan.performance][loan.moveIn][loan.childRearing ? 1 : 0];

export const housingLoanCreditYen = (loan: HousingLoan, totalIncomeYen: number): number => {
  if (!(totalIncomeYen <= TOTAL_INCOME_LIMIT_YEN) || !(loan.balanceYen > 0)) return 0;
  const units = Math.floor(
    (Math.floor(loan.balanceYen) * CREDIT_RATE_NUMERATOR) / (CREDIT_RATE_DENOMINATOR * CREDIT_UNIT_YEN),
  );
  return Math.min(units * CREDIT_UNIT_YEN, housingLoanCapYen(loan));
};

// What income tax cannot absorb comes off next year's resident tax, up to 5% of taxable income (97,500 yen).
export const splitHousingLoanCredit = (
  creditYen: number,
  incomeTaxYen: number,
  taxableIncomeYen: number,
  residentLevyYen: number,
): TaxCredit => {
  const fromIncomeTaxYen = Math.min(creditYen, incomeTaxYen);
  const residentCapYen = Math.min(Math.floor((taxableIncomeYen * RESIDENT_CAP_PERCENT) / PERCENT), RESIDENT_CAP_YEN);
  return {
    incomeTaxYen: fromIncomeTaxYen,
    residentTaxYen: Math.max(Math.min(creditYen - fromIncomeTaxYen, residentCapYen, residentLevyYen), 0),
  };
};
