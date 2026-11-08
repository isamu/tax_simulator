import { describe, expect, test } from "vitest";
import { nationalInsurance, perCapitaReduction } from "../src/utils/nationalInsurance";

describe("nationalInsurance", () => {
  test("salary income 2,760,000 yen (salary 4,000,000 yen)", () => {
    // assessment base 2,760,000 - 430,000 = 2,330,000
    expect(nationalInsurance(2_760_000, 430_000, false)).toEqual({
      // 2,330,000 x 7.51% = 174,983 + 47,600
      healthYen: 222_583,
      // 2,330,000 x 2.80% = 65,240 + 17,600
      elderlySupportYen: 82_840,
      careYen: 0,
      // 2,330,000 x 0.27% = 6,291 + 1,873
      childSupportYen: 8_164,
      // 17,920 x 12
      pensionYen: 215_040,
    });
  });

  test("care portion for ages 40-64", () =>
    // 2,330,000 x 2.43% = 56,619 + 17,800
    expect(nationalInsurance(2_760_000, 430_000, true).careYen).toBe(74_419));

  test("each portion stops at its cap", () => {
    const r = nationalInsurance(30_000_000, 0, true);
    expect([r.healthYen, r.elderlySupportYen, r.careYen, r.childSupportYen]).toEqual([
      670_000, 260_000, 170_000, 30_000,
    ]);
  });

  test("no income pays the 70% reduced per-capita amounts", () => {
    const r = nationalInsurance(0, 430_000, false);
    // 47,600 x 30% = 14,280; 17,600 x 30% = 5,280; 1,873 x 30% = 561.9 -> 561
    expect([r.healthYen, r.elderlySupportYen, r.childSupportYen]).toEqual([14_280, 5_280, 561]);
  });
});

describe("perCapitaReduction", () => {
  test.each([
    [0, 0.7],
    [430_000, 0.7],
    [430_001, 0.5],
    [740_000, 0.5],
    [740_001, 0.2],
    [1_000_000, 0.2],
    [1_000_001, 0],
  ])("income %d -> %d", (income, ratio) => expect(perCapitaReduction(income)).toBe(ratio));
});
