import { expect, test } from "vitest";
import { ledgerSections } from "../src/utils/ledger";
import { DEFAULT_HOUSEHOLD, simulateTax } from "../src/utils/simulate";

const result = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, ageYears: 45 });
const sections = ledgerSections(result);
const section = (title: string) => sections.find((s) => s.title === title);

test("sections appear in reading order", () =>
  expect(sections.map((s) => s.title)).toEqual(["社会保険料（年額）", "税金（年額）", "所得税の控除", "手取り"]));

test("insurance rows add up to the insurance total", () => {
  const insurance = section("社会保険料（年額）");
  const sum = insurance?.rows.reduce((total, row) => total + row.valueYen, 0);
  expect(sum).toBe(insurance?.total?.valueYen);
  expect(insurance?.total?.valueYen).toBe(result.insuranceSumYen);
});

test("tax rows add up to the tax total", () => {
  const tax = section("税金（年額）");
  expect(tax?.rows.reduce((total, row) => total + row.valueYen, 0)).toBe(result.taxSumYen);
});

test("take-home total is the yearly net income", () =>
  expect(section("手取り")?.total?.valueYen).toBe(result.netIncomeYearlyYen));

test("row labels are unique within each section", () =>
  sections.forEach((s) => expect(new Set(s.rows.map((row) => row.label)).size).toBe(s.rows.length)));
