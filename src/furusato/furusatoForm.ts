import type { Dependents, FamilyDisabilities, SelfDisability, SingleStatus } from "../utils/deductions";

// v-model on a number input yields "" while the field is empty.
export type AmountField = number | "";
export type BlueChoice = "650000" | "550000" | "100000" | "0" | "custom";

export type FurusatoForm = {
  sales: AmountField;
  expenses: AmountField;
  blueChoice: BlueChoice;
  blueCustom: AmountField;
  otherIncome: AmountField;
  social: AmountField;
  smallBusinessMutual: AmountField;
  lifeInsurance: AmountField;
  earthquakeInsurance: AmountField;
  medical: AmountField;
  hasSpouse: boolean;
  spouseSalary: AmountField;
  spouseIsElderly: boolean;
  dependents: Record<keyof Dependents, AmountField>;
  selfDisability: SelfDisability;
  familyDisabilities: Record<keyof FamilyDisabilities, AmountField>;
  singleStatus: SingleStatus;
  housingLoanCredit: AmountField;
  taxableOverride: AmountField;
  shotokuwariOverride: AmountField;
};

export const defaultFurusatoForm = (): FurusatoForm => ({
  sales: 12000000,
  expenses: 5000000,
  blueChoice: "650000",
  blueCustom: 0,
  otherIncome: 0,
  social: 900000,
  smallBusinessMutual: 0,
  lifeInsurance: 0,
  earthquakeInsurance: 0,
  medical: 0,
  hasSpouse: false,
  spouseSalary: 0,
  spouseIsElderly: false,
  dependents: { general: 0, specific: 0, elderly: 0, cohabitingParents: 0 },
  selfDisability: "none",
  familyDisabilities: { regular: 0, special: 0, cohabitingSpecial: 0 },
  singleStatus: "none",
  housingLoanCredit: 0,
  taxableOverride: "",
  shotokuwariOverride: "",
});

type Fields = Record<string, unknown>;

const isFields = (value: unknown): value is Fields =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAmount = (value: unknown): value is AmountField =>
  value === "" || (typeof value === "number" && Number.isFinite(value));

const isBlueChoice = (value: unknown): value is BlueChoice =>
  value === "650000" || value === "550000" || value === "100000" || value === "0" || value === "custom";

const isSelfDisability = (value: unknown): value is SelfDisability =>
  value === "none" || value === "regular" || value === "special";

const isSingleStatus = (value: unknown): value is SingleStatus =>
  value === "none" || value === "widow" || value === "singleParent";

const pick = <T>(value: unknown, isValid: (candidate: unknown) => candidate is T, fallback: T): T =>
  isValid(value) ? value : fallback;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const amounts = <K extends string>(value: unknown, fallback: Record<K, AmountField>): Record<K, AmountField> => {
  const fields = isFields(value) ? value : {};
  const keys = Object.keys(fallback).filter((key): key is K => key in fallback);
  return keys.reduce((result, key) => ({ ...result, [key]: pick(fields[key], isAmount, fallback[key]) }), fallback);
};

type AmountKey = { [K in keyof FurusatoForm]: FurusatoForm[K] extends AmountField ? K : never }[keyof FurusatoForm];

const AMOUNT_KEYS: AmountKey[] = [
  "sales",
  "expenses",
  "blueCustom",
  "otherIncome",
  "social",
  "smallBusinessMutual",
  "lifeInsurance",
  "earthquakeInsurance",
  "medical",
  "spouseSalary",
  "housingLoanCredit",
  "taxableOverride",
  "shotokuwariOverride",
];

const topLevelAmounts = (parsed: Fields, defaults: FurusatoForm): Pick<FurusatoForm, AmountKey> =>
  AMOUNT_KEYS.reduce<Pick<FurusatoForm, AmountKey>>(
    (result, key) => ({ ...result, [key]: pick(parsed[key], isAmount, defaults[key]) }),
    defaults,
  );

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Each field falls back to its default on its own, so one bad value never discards the rest.
export const decodeFurusatoForm = (text: string | null): FurusatoForm => {
  const defaults = defaultFurusatoForm();
  const parsed = text === null ? null : parseJson(text);
  if (!isFields(parsed)) return defaults;
  return {
    ...defaults,
    ...topLevelAmounts(parsed, defaults),
    blueChoice: pick(parsed.blueChoice, isBlueChoice, defaults.blueChoice),
    hasSpouse: pick(parsed.hasSpouse, isBoolean, defaults.hasSpouse),
    spouseIsElderly: pick(parsed.spouseIsElderly, isBoolean, defaults.spouseIsElderly),
    dependents: amounts(parsed.dependents, defaults.dependents),
    selfDisability: pick(parsed.selfDisability, isSelfDisability, defaults.selfDisability),
    familyDisabilities: amounts(parsed.familyDisabilities, defaults.familyDisabilities),
    singleStatus: pick(parsed.singleStatus, isSingleStatus, defaults.singleStatus),
  };
};

export const encodeFurusatoForm = (form: FurusatoForm): string => JSON.stringify(form);
