import { salaryIncomeDeduction } from "./tax";

export type PersonalDeduction = { incomeTaxYen: number; residentTaxYen: number };

export const NO_DEDUCTION: PersonalDeduction = { incomeTaxYen: 0, residentTaxYen: 0 };

export type Spouse = { salaryYen: number; isElderly: boolean };

// The taxpayer's own total income decides which column applies; above 10M yen there is none.
const OWN_INCOME_TIER_BOUNDS_YEN = [9000000, 9500000, 10000000];

const ownIncomeTier = (ownTotalIncomeYen: number): number | undefined => {
  const tier = OWN_INCOME_TIER_BOUNDS_YEN.findIndex((boundYen) => ownTotalIncomeYen <= boundYen);
  return tier < 0 ? undefined : tier;
};

// Columns are the own-income tiers above.
const SPOUSE_DEDUCTION = {
  incomeTax: { regular: [380000, 260000, 130000], elderly: [480000, 320000, 160000] },
  residentTax: { regular: [330000, 220000, 110000], elderly: [380000, 260000, 130000] },
};

const SPOUSE_DEDUCTION_INCOME_LIMIT_YEN = 620000;
const SPOUSE_SPECIAL_INCOME_LIMIT_YEN = 1330000;

// Reiwa 8 income tax (NTA No.1195), keyed by the spouse's total income.
const INCOME_TAX_SPOUSE_SPECIAL: readonly { upToYen: number; amountsYen: number[] }[] = [
  { upToYen: 950000, amountsYen: [380000, 260000, 130000] },
  { upToYen: 1000000, amountsYen: [360000, 240000, 120000] },
  { upToYen: 1050000, amountsYen: [310000, 210000, 110000] },
  { upToYen: 1100000, amountsYen: [260000, 180000, 90000] },
  { upToYen: 1150000, amountsYen: [210000, 140000, 70000] },
  { upToYen: 1200000, amountsYen: [160000, 110000, 60000] },
  { upToYen: 1250000, amountsYen: [110000, 80000, 40000] },
  { upToYen: 1300000, amountsYen: [60000, 40000, 20000] },
  { upToYen: 1330000, amountsYen: [30000, 20000, 10000] },
];

// Local Tax Act art. 314-2(1)(x-2) defines the resident tax amount as a formula rather than a table.
const RESIDENT_SPECIAL = {
  flatUpToYen: 1000000,
  flatYen: 330000,
  taperUpToYen: 1300000,
  taperStartYen: 380000,
  excessOverYen: 930001,
  stepYen: 50000,
  stepOffsetYen: 30000,
  floorYen: 30000,
  roundUnitYen: 10000,
  // [numerator, denominator]; kept as integers so exact multiples of 10,000 yen do not round up.
  tierRatios: [
    [1, 1],
    [2, 3],
    [1, 3],
  ],
};

const residentSpecialFullAmount = (spouseIncomeYen: number): number => {
  const r = RESIDENT_SPECIAL;
  if (spouseIncomeYen <= r.flatUpToYen) return r.flatYen;
  if (spouseIncomeYen > r.taperUpToYen) return r.floorYen;
  const excessYen = spouseIncomeYen - r.excessOverYen;
  const roundedExcessYen = Math.floor((excessYen + r.stepOffsetYen) / r.stepYen) * r.stepYen - r.stepOffsetYen;
  return r.taperStartYen - roundedExcessYen;
};

const residentSpecialAmount = (spouseIncomeYen: number, tier: number): number => {
  const [numerator, denominator] = RESIDENT_SPECIAL.tierRatios[tier];
  const units =
    (residentSpecialFullAmount(spouseIncomeYen) * numerator) / (denominator * RESIDENT_SPECIAL.roundUnitYen);
  return Math.ceil(units) * RESIDENT_SPECIAL.roundUnitYen;
};

export const spouseTotalIncome = (spouse: Spouse): number =>
  Math.max(spouse.salaryYen - salaryIncomeDeduction(spouse.salaryYen), 0);

const spouseDeductionFor = (spouse: Spouse, tier: number): PersonalDeduction => {
  const column = spouse.isElderly ? "elderly" : "regular";
  return {
    incomeTaxYen: SPOUSE_DEDUCTION.incomeTax[column][tier],
    residentTaxYen: SPOUSE_DEDUCTION.residentTax[column][tier],
  };
};

const spouseSpecialDeductionFor = (spouseIncomeYen: number, tier: number): PersonalDeduction => {
  const row = INCOME_TAX_SPOUSE_SPECIAL.find(({ upToYen }) => spouseIncomeYen <= upToYen);
  return {
    incomeTaxYen: row?.amountsYen[tier] ?? 0,
    residentTaxYen: residentSpecialAmount(spouseIncomeYen, tier),
  };
};

export const spouseDeduction = (ownTotalIncomeYen: number, spouse: Spouse | null): PersonalDeduction => {
  const tier = ownIncomeTier(ownTotalIncomeYen);
  if (!spouse || tier === undefined) return NO_DEDUCTION;
  const spouseIncomeYen = spouseTotalIncome(spouse);
  if (spouseIncomeYen <= SPOUSE_DEDUCTION_INCOME_LIMIT_YEN) return spouseDeductionFor(spouse, tier);
  if (spouseIncomeYen <= SPOUSE_SPECIAL_INCOME_LIMIT_YEN) return spouseSpecialDeductionFor(spouseIncomeYen, tier);
  return NO_DEDUCTION;
};
