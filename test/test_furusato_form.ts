import { describe, expect, test } from "vitest";
import {
  type AmountField,
  type BlueChoice,
  type FurusatoForm,
  decodeFurusatoForm,
  defaultFurusatoForm,
  encodeFurusatoForm,
} from "../src/furusato/furusatoForm";
import type { SelfDisability, SingleStatus } from "../src/utils/deductions";

const seededRandom = (seed: number): (() => number) => {
  const state = { value: seed };
  return () => {
    state.value = (state.value * 1103515245 + 12345) % 2147483648;
    return state.value / 2147483648;
  };
};

const BLUE: BlueChoice[] = ["650000", "550000", "100000", "0", "custom"];
const SELF: SelfDisability[] = ["none", "regular", "special"];
const SINGLE: SingleStatus[] = ["none", "widow", "singleParent"];

const randomForm = (random: () => number): FurusatoForm => {
  const amount = (): AmountField => (random() < 0.1 ? "" : Math.floor(random() * 20_000_000));
  const from = <T>(values: T[]): T => values[Math.floor(random() * values.length)];
  return {
    sales: amount(),
    expenses: amount(),
    blueChoice: from(BLUE),
    blueCustom: amount(),
    otherIncome: amount(),
    social: amount(),
    smallBusinessMutual: amount(),
    lifeInsurance: amount(),
    earthquakeInsurance: amount(),
    medical: amount(),
    hasSpouse: random() < 0.5,
    spouseSalary: amount(),
    spouseIsElderly: random() < 0.5,
    dependents: { general: amount(), specific: amount(), elderly: amount(), cohabitingParents: amount() },
    selfDisability: from(SELF),
    familyDisabilities: { regular: amount(), special: amount(), cohabitingSpecial: amount() },
    singleStatus: from(SINGLE),
    housingLoanCredit: amount(),
    taxableOverride: amount(),
    shotokuwariOverride: amount(),
  };
};

describe("furusato form storage", () => {
  const seed = Number(process.env.TEST_SEED ?? Date.now());
  test(`decode(encode(form)) is the same form (seed ${seed})`, () => {
    const random = seededRandom(seed);
    Array.from({ length: 1000 }, () => randomForm(random)).forEach((form) =>
      expect(decodeFurusatoForm(encodeFurusatoForm(form))).toEqual(form),
    );
  });

  test.each([null, "", "not json", "[]", "null", "42", '"text"'])("unreadable %j gives the defaults", (text) =>
    expect(decodeFurusatoForm(text)).toEqual(defaultFurusatoForm()),
  );

  test("each bad field falls back on its own and keeps the good ones", () => {
    const text = JSON.stringify({
      sales: 3_000_000,
      expenses: "a lot",
      blueChoice: "750000",
      hasSpouse: "yes",
      spouseIsElderly: true,
      dependents: { general: 2, specific: null },
      selfDisability: "special",
      singleStatus: "divorced",
      taxableOverride: "",
      unknownField: 1,
    });
    expect(decodeFurusatoForm(text)).toEqual({
      ...defaultFurusatoForm(),
      sales: 3_000_000,
      spouseIsElderly: true,
      dependents: { ...defaultFurusatoForm().dependents, general: 2 },
      selfDisability: "special",
      taxableOverride: "",
    });
  });

  test("infinite or NaN amounts are not restored", () =>
    expect(decodeFurusatoForm('{"sales": 1e999}').sales).toBe(defaultFurusatoForm().sales));

  test("defaults are a fresh object every time", () => {
    const first = defaultFurusatoForm();
    first.dependents.general = 3;
    expect(defaultFurusatoForm().dependents.general).toBe(0);
  });
});
