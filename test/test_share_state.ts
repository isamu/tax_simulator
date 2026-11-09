import { describe, expect, test } from "vitest";
import { type ShareState, decodeShareState, encodeShareState, initialHash } from "../src/utils/shareState";
import { DEFAULT_HOUSEHOLD, type Household } from "../src/utils/simulate";
import type { SelfDisability, SingleStatus } from "../src/utils/deductions";
import {
  DEFAULT_HOUSING_LOAN,
  type HomeKind,
  type HomePerformance,
  type HousingLoan,
  type MoveInPeriod,
} from "../src/utils/housingLoan";

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
const KINDS: HomeKind[] = ["new", "used"];
const PERFORMANCES: HomePerformance[] = ["certified", "zeh", "energySaving", "other"];
const MOVE_INS: MoveInPeriod[] = ["r4to5", "r6to7", "r8"];

const pickFrom = <T>(random: () => number, values: T[]): T => values[Math.floor(random() * values.length)];

const randomLoan = (random: () => number): HousingLoan | null =>
  random() < 0.5
    ? null
    : {
        balanceYen: Math.floor(random() * 60_000_000),
        kind: pickFrom(random, KINDS),
        performance: pickFrom(random, PERFORMANCES),
        moveIn: pickFrom(random, MOVE_INS),
        childRearing: random() < 0.5,
      };

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
    housingLoan: randomLoan(random),
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

describe("housing loan in the share state", () => {
  const withLoan = (housingLoan: Household["housingLoan"]): ShareState => ({
    incomeGrossYen: 4_000_000,
    household: { ...DEFAULT_HOUSEHOLD, housingLoan },
  });

  test("defaults write only the balance", () =>
    expect(encodeShareState(withLoan({ ...DEFAULT_HOUSING_LOAN, balanceYen: 30_000_000 }))).toBe(
      "income=4000000&loan=30000000",
    ));

  test("every non-default choice is written and read back", () => {
    const state = withLoan({
      balanceYen: 0,
      kind: "used",
      performance: "zeh",
      moveIn: "r4to5",
      childRearing: true,
    });
    const hash = encodeShareState(state);
    expect(hash).toBe("income=4000000&loan=0&loan_kind=used&loan_perf=zeh&loan_year=r4to5&loan_kids=1");
    expect(decodeShareState(`#${hash}`, DEFAULT_INCOME)).toEqual(state);
  });

  test.each([
    ["#income=4000000&loan_kind=used", null],
    ["#income=4000000&loan=abc", null],
    ["#income=4000000&loan=-1", null],
    [
      "#income=4000000&loan=100&loan_kind=x&loan_perf=y&loan_year=r99&loan_kids=yes",
      { ...DEFAULT_HOUSING_LOAN, balanceYen: 100 },
    ],
  ])("%s -> %o", (hash, housingLoan) =>
    expect(decodeShareState(hash, DEFAULT_INCOME).household.housingLoan).toEqual(housingLoan),
  );
});

describe("initialHash", () => {
  test.each([
    ["#income=5000000", "income=3000000", "#income=5000000"],
    ["#4000000", "income=3000000", "#4000000"],
    ["", "income=3000000", "income=3000000"],
    ["#", "income=3000000", "income=3000000"],
    ["", null, ""],
    ["#", null, ""],
  ])("location %j, saved %j -> %j", (locationHash, savedHash, expected) =>
    expect(initialHash(locationHash, savedHash)).toBe(expected),
  );
});
