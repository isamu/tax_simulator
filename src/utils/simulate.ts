import { incomeTax, salaryIncomeDeduction, standardMonthlyFee } from "./tax";

const MONTHS_PER_YEAR = 12;
// Rates are the employer + employee total; the employee pays half.
// The health rate depends on age and prefecture; this is a representative value.
const HEALTH_INSURANCE_RATE = 0.099;
const PENSION_RATE = 0.183;
const EMPLOYEE_SHARE = 0.5;
const PENSION_FEE_FLOOR_YEN = 88000;
const PENSION_FEE_CAP_YEN = 620000;
const UNEMPLOYMENT_INSURANCE_RATE = 0.003;
const DEPENDENT_DEDUCTION_YEN = 0;
const BASIC_DEDUCTION_YEN = 380000;
const LOCAL_BASIC_DEDUCTION_YEN = 350000;
const RECONSTRUCTION_TAX_RATE = 0.021;
const LOCAL_TAX_RATE = 0.1;

export type BudgetItem = { label: string; share: number };

export const BUDGET_ITEMS: readonly BudgetItem[] = [
  { label: "社会保障", share: 0.337 },
  { label: "地方交付税交付金等", share: 0.159 },
  { label: "公共事業", share: 0.061 },
  { label: "文教及び科学技術", share: 0.055 },
  { label: "防衛", share: 0.053 },
  { label: "その他", share: 0.096 },
  { label: "国債費", share: 0.238 },
];

export type SocialInsurance = {
  standardMonthlyFeeYen: number;
  healthInsuranceMonthlyYen: number;
  healthInsuranceYearlyYen: number;
  pensionMonthlyYen: number;
  pensionYearlyYen: number;
  unemploymentMonthlyYen: number;
  unemploymentYearlyYen: number;
};

export type Taxes = {
  salaryDeductionYen: number;
  taxableIncomeYen: number;
  incomeTaxYen: number;
  reconstructionTaxYen: number;
  localTaxYen: number;
};

export type TaxSimulation = SocialInsurance &
  Taxes & {
    dependentDeductionYen: number;
    basicDeductionYen: number;
    netIncomeYearlyYen: number;
    netIncomeMonthlyYen: number;
    insuranceSumYen: number;
    companyInsuranceYen: number;
    insuranceTotalWithCompanyYen: number;
    taxSumYen: number;
    budgetsYen: number[];
  };

export const socialInsurance = (incomeGrossYen: number): SocialInsurance => {
  const standardMonthlyFeeYen = standardMonthlyFee(incomeGrossYen / MONTHS_PER_YEAR);
  const pensionFeeYen = Math.min(Math.max(standardMonthlyFeeYen, PENSION_FEE_FLOOR_YEN), PENSION_FEE_CAP_YEN);
  const healthInsuranceMonthlyYen = Math.round(standardMonthlyFeeYen * HEALTH_INSURANCE_RATE * EMPLOYEE_SHARE);
  const pensionMonthlyYen = Math.round(pensionFeeYen * PENSION_RATE * EMPLOYEE_SHARE);
  const unemploymentMonthlyYen = Math.round((incomeGrossYen / MONTHS_PER_YEAR) * UNEMPLOYMENT_INSURANCE_RATE);
  return {
    standardMonthlyFeeYen,
    healthInsuranceMonthlyYen,
    healthInsuranceYearlyYen: healthInsuranceMonthlyYen * MONTHS_PER_YEAR,
    pensionMonthlyYen,
    pensionYearlyYen: pensionMonthlyYen * MONTHS_PER_YEAR,
    unemploymentMonthlyYen,
    unemploymentYearlyYen: unemploymentMonthlyYen * MONTHS_PER_YEAR,
  };
};

const yearlyInsuranceYen = (insurance: SocialInsurance): number =>
  insurance.healthInsuranceYearlyYen + insurance.pensionYearlyYen + insurance.unemploymentYearlyYen;

const taxableIncome = (salaryIncomeYen: number, insuranceYen: number, basicDeductionYen: number): number =>
  Math.max(salaryIncomeYen - insuranceYen - basicDeductionYen - DEPENDENT_DEDUCTION_YEN, 0);

export const taxes = (incomeGrossYen: number, insurance: SocialInsurance): Taxes => {
  const salaryDeductionYen = salaryIncomeDeduction(incomeGrossYen);
  const salaryIncomeYen = incomeGrossYen - salaryDeductionYen;
  const insuranceYen = yearlyInsuranceYen(insurance);
  const taxableIncomeYen = taxableIncome(salaryIncomeYen, insuranceYen, BASIC_DEDUCTION_YEN);
  const incomeTaxYen = Math.round(incomeTax(taxableIncomeYen));
  const localTaxableIncomeYen = taxableIncome(salaryIncomeYen, insuranceYen, LOCAL_BASIC_DEDUCTION_YEN);
  return {
    salaryDeductionYen,
    taxableIncomeYen,
    incomeTaxYen,
    reconstructionTaxYen: Math.round(incomeTaxYen * RECONSTRUCTION_TAX_RATE),
    localTaxYen: Math.round(localTaxableIncomeYen * LOCAL_TAX_RATE),
  };
};

export const budgetBreakdown = (incomeTaxYen: number): number[] =>
  BUDGET_ITEMS.map(({ share }) => Math.round(share * incomeTaxYen));

export const simulateTax = (incomeGrossYen: number): TaxSimulation => {
  const insurance = socialInsurance(incomeGrossYen);
  const tax = taxes(incomeGrossYen, insurance);
  const insuranceSumYen = yearlyInsuranceYen(insurance);
  const taxSumYen = tax.incomeTaxYen + tax.reconstructionTaxYen + tax.localTaxYen;
  const netIncomeYearlyYen = incomeGrossYen - insuranceSumYen - taxSumYen;
  return {
    ...insurance,
    ...tax,
    dependentDeductionYen: DEPENDENT_DEDUCTION_YEN,
    basicDeductionYen: BASIC_DEDUCTION_YEN,
    netIncomeYearlyYen,
    netIncomeMonthlyYen: Math.round(netIncomeYearlyYen / MONTHS_PER_YEAR),
    insuranceSumYen,
    companyInsuranceYen: insuranceSumYen,
    insuranceTotalWithCompanyYen: insuranceSumYen + insuranceSumYen,
    taxSumYen,
    budgetsYen: budgetBreakdown(tax.incomeTaxYen),
  };
};
