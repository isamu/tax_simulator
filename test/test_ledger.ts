import { expect, test } from "vitest";
import { ledgerSections } from "../src/utils/ledger";
import { DEFAULT_HOUSEHOLD, simulateTax } from "../src/utils/simulate";
import { DEFAULT_HOUSING_LOAN } from "../src/utils/housingLoan";

const result = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, paysCareInsurance: true });
const sections = ledgerSections(result);
const section = (title: string) => sections.find((s) => s.title === title);

test("sections appear in reading order", () =>
  expect(sections.map((s) => s.title)).toEqual([
    "社会保険料（年額）",
    "税金（年額）",
    "所得税の控除",
    "手取り",
    "会社負担（年額）",
  ]));

test("employer rows add up to the employer total", () => {
  const employer = section("会社負担（年額）");
  expect(employer?.rows.reduce((total, row) => total + row.valueYen, 0)).toBe(result.companyInsuranceYen);
});

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

test("National Health Insurance drops employment insurance from both sides", () => {
  const national = ledgerSections(simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, nationalInsurance: true }));
  const labels = national.flatMap((s) => s.rows.map((row) => row.label));
  expect(labels).not.toContain("雇用保険");
  expect(national.find((s) => s.title === "会社負担（年額）")?.rows.map((row) => row.label)).toEqual(["労災保険"]);
});

test("employees keep employment insurance on both sides", () => {
  const employeeRows = (title: string) => section(title)?.rows.map((row) => row.label);
  expect(employeeRows("社会保険料（年額）")).toContain("雇用保険");
  expect(employeeRows("会社負担（年額）")).toContain("雇用保険");
});

test("the housing loan section appears only with a loan, and its rows add up to the credit", () => {
  expect(sections.map((s) => s.title)).not.toContain("住宅ローン控除");
  const housingLoan = { ...DEFAULT_HOUSING_LOAN, balanceYen: 30_000_000 };
  const withLoan = simulateTax(4_000_000, { ...DEFAULT_HOUSEHOLD, housingLoan });
  const loanSection = ledgerSections(withLoan).find((s) => s.title === "住宅ローン控除");
  expect(loanSection?.rows.reduce((total, row) => total + row.valueYen, 0)).toBe(withLoan.housingLoanCreditYen);
  expect(loanSection?.total?.valueYen).toBe(140_000);
});
