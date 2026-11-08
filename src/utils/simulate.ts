import {
  incomeTax,
  incomeTaxBasicDeduction,
  residentTaxBasicDeduction,
  salaryIncomeDeduction,
  standardMonthlyFee,
} from "./tax";

const MONTHS_PER_YEAR = 12;
// Rates are the employer + employee total; the employee pays half.
// The health rate depends on prefecture; this is the Kyokai Kenpo national average for FY2026.
const HEALTH_INSURANCE_RATE = 0.099;
const CHILD_SUPPORT_RATE = 0.0023;
const PENSION_RATE = 0.183;
const EMPLOYEE_SHARE = 0.5;
const PENSION_FEE_FLOOR_YEN = 88000;
const PENSION_FEE_CAP_YEN = 650000;
const EMPLOYEE_UNEMPLOYMENT_RATE = 0.005;
const EMPLOYER_UNEMPLOYMENT_RATE = 0.0085;
const DEPENDENT_DEDUCTION_YEN = 0;
const RECONSTRUCTION_TAX_RATE = 0.021;
const LOCAL_TAX_RATE = 0.1;
const TAXABLE_INCOME_UNIT_YEN = 1000;

export type BudgetItem = { label: string; amountOkuYen: number };

// FY2026 general account expenditure after the supplementary budget (MOF, October 2026).
export const BUDGET_ITEMS: readonly BudgetItem[] = [
  { label: "社会保障", amountOkuYen: 390559 },
  { label: "地方交付税交付金等", amountOkuYen: 208778 },
  { label: "公共事業", amountOkuYen: 61078 },
  { label: "文教及び科学振興", amountOkuYen: 60406 },
  { label: "防衛", amountOkuYen: 89843 },
  { label: "その他", amountOkuYen: 130806 },
  { label: "国債費", amountOkuYen: 312758 },
];

const BUDGET_TOTAL_OKU_YEN = BUDGET_ITEMS.reduce((sum, { amountOkuYen }) => sum + amountOkuYen, 0);

export type SocialInsurance = {
  standardMonthlyFeeYen: number;
  healthInsuranceMonthlyYen: number;
  healthInsuranceYearlyYen: number;
  childSupportMonthlyYen: number;
  childSupportYearlyYen: number;
  pensionMonthlyYen: number;
  pensionYearlyYen: number;
  unemploymentMonthlyYen: number;
  unemploymentYearlyYen: number;
};

export type Taxes = {
  salaryDeductionYen: number;
  basicDeductionYen: number;
  taxableIncomeYen: number;
  incomeTaxYen: number;
  reconstructionTaxYen: number;
  localTaxYen: number;
};

export type TaxSimulation = SocialInsurance &
  Taxes & {
    dependentDeductionYen: number;
    netIncomeYearlyYen: number;
    netIncomeMonthlyYen: number;
    insuranceSumYen: number;
    companyInsuranceYen: number;
    insuranceTotalWithCompanyYen: number;
    taxSumYen: number;
    budgetsYen: number[];
  };

const employeeShare = (feeYen: number, rate: number): number => Math.round(feeYen * rate * EMPLOYEE_SHARE);

export const socialInsurance = (incomeGrossYen: number): SocialInsurance => {
  const standardMonthlyFeeYen = standardMonthlyFee(incomeGrossYen / MONTHS_PER_YEAR);
  const pensionFeeYen = Math.min(Math.max(standardMonthlyFeeYen, PENSION_FEE_FLOOR_YEN), PENSION_FEE_CAP_YEN);
  const healthInsuranceMonthlyYen = employeeShare(standardMonthlyFeeYen, HEALTH_INSURANCE_RATE);
  const childSupportMonthlyYen = employeeShare(standardMonthlyFeeYen, CHILD_SUPPORT_RATE);
  const pensionMonthlyYen = employeeShare(pensionFeeYen, PENSION_RATE);
  const unemploymentMonthlyYen = Math.round((incomeGrossYen / MONTHS_PER_YEAR) * EMPLOYEE_UNEMPLOYMENT_RATE);
  return {
    standardMonthlyFeeYen,
    healthInsuranceMonthlyYen,
    healthInsuranceYearlyYen: healthInsuranceMonthlyYen * MONTHS_PER_YEAR,
    childSupportMonthlyYen,
    childSupportYearlyYen: childSupportMonthlyYen * MONTHS_PER_YEAR,
    pensionMonthlyYen,
    pensionYearlyYen: pensionMonthlyYen * MONTHS_PER_YEAR,
    unemploymentMonthlyYen,
    unemploymentYearlyYen: unemploymentMonthlyYen * MONTHS_PER_YEAR,
  };
};

const sharedInsuranceYen = (insurance: SocialInsurance): number =>
  insurance.healthInsuranceYearlyYen + insurance.childSupportYearlyYen + insurance.pensionYearlyYen;

const yearlyInsuranceYen = (insurance: SocialInsurance): number =>
  sharedInsuranceYen(insurance) + insurance.unemploymentYearlyYen;

const employerInsuranceYen = (incomeGrossYen: number, insurance: SocialInsurance): number =>
  sharedInsuranceYen(insurance) +
  Math.round((incomeGrossYen / MONTHS_PER_YEAR) * EMPLOYER_UNEMPLOYMENT_RATE) * MONTHS_PER_YEAR;

const taxableIncome = (salaryIncomeYen: number, insuranceYen: number, basicDeductionYen: number): number => {
  const incomeYen = Math.max(salaryIncomeYen - insuranceYen - basicDeductionYen - DEPENDENT_DEDUCTION_YEN, 0);
  return Math.floor(incomeYen / TAXABLE_INCOME_UNIT_YEN) * TAXABLE_INCOME_UNIT_YEN;
};

export const taxes = (incomeGrossYen: number, insurance: SocialInsurance): Taxes => {
  const salaryDeductionYen = salaryIncomeDeduction(incomeGrossYen);
  const salaryIncomeYen = incomeGrossYen - salaryDeductionYen;
  const insuranceYen = yearlyInsuranceYen(insurance);
  const basicDeductionYen = incomeTaxBasicDeduction(salaryIncomeYen);
  const taxableIncomeYen = taxableIncome(salaryIncomeYen, insuranceYen, basicDeductionYen);
  const incomeTaxYen = Math.round(incomeTax(taxableIncomeYen));
  const localTaxableIncomeYen = taxableIncome(
    salaryIncomeYen,
    insuranceYen,
    residentTaxBasicDeduction(salaryIncomeYen),
  );
  return {
    salaryDeductionYen,
    basicDeductionYen,
    taxableIncomeYen,
    incomeTaxYen,
    reconstructionTaxYen: Math.round(incomeTaxYen * RECONSTRUCTION_TAX_RATE),
    localTaxYen: Math.round(localTaxableIncomeYen * LOCAL_TAX_RATE),
  };
};

export const budgetBreakdown = (incomeTaxYen: number): number[] =>
  BUDGET_ITEMS.map(({ amountOkuYen }) => Math.round((amountOkuYen / BUDGET_TOTAL_OKU_YEN) * incomeTaxYen));

export const simulateTax = (incomeGrossYen: number): TaxSimulation => {
  const insurance = socialInsurance(incomeGrossYen);
  const tax = taxes(incomeGrossYen, insurance);
  const insuranceSumYen = yearlyInsuranceYen(insurance);
  const companyInsuranceYen = employerInsuranceYen(incomeGrossYen, insurance);
  const taxSumYen = tax.incomeTaxYen + tax.reconstructionTaxYen + tax.localTaxYen;
  const netIncomeYearlyYen = incomeGrossYen - insuranceSumYen - taxSumYen;
  return {
    ...insurance,
    ...tax,
    dependentDeductionYen: DEPENDENT_DEDUCTION_YEN,
    netIncomeYearlyYen,
    netIncomeMonthlyYen: Math.round(netIncomeYearlyYen / MONTHS_PER_YEAR),
    insuranceSumYen,
    companyInsuranceYen,
    insuranceTotalWithCompanyYen: insuranceSumYen + companyInsuranceYen,
    taxSumYen,
    budgetsYen: budgetBreakdown(tax.incomeTaxYen),
  };
};
