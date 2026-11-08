import { DEFAULT_HOUSEHOLD, type Household } from "./simulate";
import type { Dependents, FamilyDisabilities, SelfDisability, SingleStatus, Spouse } from "./deductions";
import { incomeFromHash } from "./hash";

export type ShareState = { incomeGrossYen: number; household: Household };

const DEPENDENT_PARAMS: readonly [keyof Dependents, string][] = [
  ["general", "dep_general"],
  ["specific", "dep_specific"],
  ["elderly", "dep_elderly"],
  ["cohabitingParents", "dep_parents"],
];

const DISABILITY_PARAMS: readonly [keyof FamilyDisabilities, string][] = [
  ["regular", "dis_regular"],
  ["special", "dis_special"],
  ["cohabitingSpecial", "dis_cohab"],
];

const FLAG_ON = "1";

const isSelfDisability = (value: string | null): value is SelfDisability =>
  value === "none" || value === "regular" || value === "special";

const isSingleStatus = (value: string | null): value is SingleStatus =>
  value === "none" || value === "widow" || value === "singleParent";

// Only values that differ from the defaults are written, to keep shared URLs short.
export const encodeShareState = ({ incomeGrossYen, household }: ShareState): string => {
  const params = new URLSearchParams({ income: String(incomeGrossYen) });
  if (household.paysCareInsurance) params.set("care", FLAG_ON);
  if (household.nationalInsurance) params.set("kokuho", FLAG_ON);
  if (household.spouse) params.set("spouse", String(household.spouse.salaryYen));
  if (household.spouse?.isElderly) params.set("spouse70", FLAG_ON);
  DEPENDENT_PARAMS.forEach(([field, key]) => {
    if (household.dependents[field] > 0) params.set(key, String(household.dependents[field]));
  });
  if (household.selfDisability !== "none") params.set("self", household.selfDisability);
  DISABILITY_PARAMS.forEach(([field, key]) => {
    if (household.familyDisabilities[field] > 0) params.set(key, String(household.familyDisabilities[field]));
  });
  if (household.singleStatus !== "none") params.set("single", household.singleStatus);
  return params.toString();
};

const nonNegative = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const count = (value: string | null): number => Math.floor(nonNegative(value) ?? 0);

const spouseFrom = (params: URLSearchParams): Spouse | null => {
  const salaryYen = nonNegative(params.get("spouse"));
  return salaryYen === undefined ? null : { salaryYen, isElderly: params.get("spouse70") === FLAG_ON };
};

const householdFrom = (params: URLSearchParams): Household => {
  const self = params.get("self");
  const single = params.get("single");
  return {
    paysCareInsurance: params.get("care") === FLAG_ON,
    nationalInsurance: params.get("kokuho") === FLAG_ON,
    spouse: spouseFrom(params),
    dependents: {
      general: count(params.get("dep_general")),
      specific: count(params.get("dep_specific")),
      elderly: count(params.get("dep_elderly")),
      cohabitingParents: count(params.get("dep_parents")),
    },
    selfDisability: isSelfDisability(self) ? self : DEFAULT_HOUSEHOLD.selfDisability,
    familyDisabilities: {
      regular: count(params.get("dis_regular")),
      special: count(params.get("dis_special")),
      cohabitingSpecial: count(params.get("dis_cohab")),
    },
    singleStatus: isSingleStatus(single) ? single : DEFAULT_HOUSEHOLD.singleStatus,
  };
};

// Accepts both the parameter format and the older "#4000000" format; anything unreadable falls back to defaults.
export const decodeShareState = (hash: string, defaultIncomeGrossYen: number): ShareState => {
  const legacyIncome = incomeFromHash(hash);
  if (legacyIncome !== undefined) {
    return { incomeGrossYen: legacyIncome, household: DEFAULT_HOUSEHOLD };
  }
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    incomeGrossYen: nonNegative(params.get("income")) ?? defaultIncomeGrossYen,
    household: householdFrom(params),
  };
};
