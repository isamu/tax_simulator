import { describe, expect, test } from "vitest";
import { type ShareState, decodeShareState, encodeShareState } from "../src/utils/shareState";
import { DEFAULT_HOUSEHOLD, type Household } from "../src/utils/simulate";
import type { SelfDisability, SingleStatus } from "../src/utils/deductions";

const DEFAULT_INCOME = 4_000_000;

const seededRandom = (seed: number): (() => number) => {
  const state = { value: seed };
  return () => {
    state.value = (state.value * 1103515245 + 12345) % 2147483648;
    return state.value / 2147483648;
  };
};

const SELF: SelfDisability[] = ["none", "regular", "special"];
const SINGLE: SingleStatus[] = ["none", "widow", "singleParent"];

const randomState = (random: () => number): ShareState => {
  const small = () => Math.floor(random() * 4);
  const household: Household = {
    paysCareInsurance: random() < 0.5,
    nationalInsurance: random() < 0.5,
    spouse: random() < 0.5 ? { salaryYen: Math.floor(random() * 3_000_000), isElderly: random() < 0.5 } : null,
    dependents: { general: small(), specific: small(), elderly: small(), cohabitingParents: small() },
    selfDisability: SELF[Math.floor(random() * SELF.length)],
    familyDisabilities: { regular: small(), special: small(), cohabitingSpecial: small() },
    singleStatus: SINGLE[Math.floor(random() * SINGLE.length)],
  };
  return { incomeGrossYen: Math.floor(random() * 50_000_000), household };
};

describe("share state round trip", () => {
  const seed = Number(process.env.TEST_SEED ?? Date.now());
  test(`decode(encode(state)) is the same state (seed ${seed})`, () => {
    const random = seededRandom(seed);
    Array.from({ length: 2000 }, () => randomState(random)).forEach((state) =>
      expect(decodeShareState(`#${encodeShareState(state)}`, DEFAULT_INCOME)).toEqual(state),
    );
  });
});

describe("encodeShareState", () => {
  test("defaults write only the income", () =>
    expect(encodeShareState({ incomeGrossYen: 4_000_000, household: DEFAULT_HOUSEHOLD })).toBe("income=4000000"));

  test("non-default values are written", () => {
    const household: Household = {
      ...DEFAULT_HOUSEHOLD,
      paysCareInsurance: true,
      nationalInsurance: true,
      spouse: { salaryYen: 1_360_000, isElderly: true },
      dependents: { ...DEFAULT_HOUSEHOLD.dependents, specific: 2 },
      singleStatus: "widow",
    };
    expect(encodeShareState({ incomeGrossYen: 5_000_000, household })).toBe(
      "income=5000000&care=1&kokuho=1&spouse=1360000&spouse70=1&dep_specific=2&single=widow",
    );
  });

  test("a spouse with no salary is still written", () =>
    expect(
      encodeShareState({
        incomeGrossYen: 1,
        household: { ...DEFAULT_HOUSEHOLD, spouse: { salaryYen: 0, isElderly: false } },
      }),
    ).toBe("income=1&spouse=0"));
});

describe("decodeShareState", () => {
  test.each([
    ["#4000000", 4_000_000],
    ["#7654321", 7_654_321],
    ["#income=3000000", 3_000_000],
    ["income=3000000", 3_000_000],
    ["", DEFAULT_INCOME],
    ["#", DEFAULT_INCOME],
    ["#income=", DEFAULT_INCOME],
    ["#income=abc", DEFAULT_INCOME],
    ["#income=-5", DEFAULT_INCOME],
    ["#income=0", 0],
  ])("%s -> income %d", (hash, income) => expect(decodeShareState(hash, DEFAULT_INCOME).incomeGrossYen).toBe(income));

  test("the older income-only format keeps the default household", () =>
    expect(decodeShareState("#4000000", DEFAULT_INCOME).household).toEqual(DEFAULT_HOUSEHOLD));

  test("unknown or malformed values fall back to defaults", () => {
    const { household } = decodeShareState(
      "#income=1&self=bogus&single=married&dep_general=-2&dis_regular=x&care=yes&spouse=abc&extra=1",
      DEFAULT_INCOME,
    );
    expect(household).toEqual(DEFAULT_HOUSEHOLD);
  });

  test("fractional counts are rounded down", () =>
    expect(decodeShareState("#dep_general=2.9", DEFAULT_INCOME).household.dependents.general).toBe(2));
});
