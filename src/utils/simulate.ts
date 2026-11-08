import { incomeTax, salaryIncomeDeduction, standardMonthlyFee } from "./tax";

const MONTHS_PER_YEAR = 12;
// Rate depends on age and prefecture; this is a representative value.
const HEALTH_INSURANCE_RATE = 0.099;
const PENSION_RATE = 0.0915;
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
  const healthInsuranceMonthlyYen = standardMonthlyFeeYen * HEALTH_INSURANCE_RATE;
  const pensionMonthlyYen = Math.round(Math.min(standardMonthlyFeeYen, PENSION_FEE_CAP_YEN) * PENSION_RATE);
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

// The subtraction order is kept as-is: reordering changes floating-point rounding.
const incomeAfterInsurance = (incomeGrossYen: number, basicDeductionYen: number, insurance: SocialInsurance): number =>
  incomeGrossYen -
  basicDeductionYen -
  DEPENDENT_DEDUCTION_YEN -
  insurance.unemploymentMonthlyYen * MONTHS_PER_YEAR -
  insurance.pensionMonthlyYen * MONTHS_PER_YEAR -
  insurance.healthInsuranceMonthlyYen * MONTHS_PER_YEAR;

// The salary deduction is applied to the standard monthly fee, not to the yearly income, as the original site does.
export const taxes = (incomeGrossYen: number, insurance: SocialInsurance): Taxes => {
  const salaryDeductionYen = salaryIncomeDeduction(insurance.standardMonthlyFeeYen);
  const taxableIncomeYen = Math.max(
    incomeAfterInsurance(incomeGrossYen, BASIC_DEDUCTION_YEN, insurance) - salaryDeductionYen,
    0,
  );
  const incomeTaxYen = Math.round(incomeTax(taxableIncomeYen));
  const localIncomeYen = Math.max(
    Math.round(incomeAfterInsurance(incomeGrossYen, LOCAL_BASIC_DEDUCTION_YEN, insurance)) - salaryDeductionYen,
    0,
  );
  return {
    salaryDeductionYen,
    taxableIncomeYen,
    incomeTaxYen,
    reconstructionTaxYen: Math.round(incomeTaxYen * RECONSTRUCTION_TAX_RATE),
    localTaxYen: Math.round(localIncomeYen * LOCAL_TAX_RATE),
  };
};

export const budgetBreakdown = (incomeTaxYen: number): number[] =>
  BUDGET_ITEMS.map(({ share }) => Math.round(share * incomeTaxYen));

export const simulateTax = (incomeGrossYen: number): TaxSimulation => {
  const insurance = socialInsurance(incomeGrossYen);
  const tax = taxes(incomeGrossYen, insurance);
  const netIncomeYearlyYen = Math.round(
    incomeGrossYen -
      insurance.unemploymentMonthlyYen * MONTHS_PER_YEAR -
      insurance.pensionMonthlyYen * MONTHS_PER_YEAR -
      insurance.healthInsuranceMonthlyYen * MONTHS_PER_YEAR -
      tax.incomeTaxYen -
      tax.reconstructionTaxYen -
      tax.localTaxYen,
  );
  const insuranceSumYen =
    insurance.healthInsuranceYearlyYen + insurance.pensionYearlyYen + insurance.unemploymentYearlyYen;
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
    taxSumYen: tax.incomeTaxYen + tax.reconstructionTaxYen + tax.localTaxYen,
    budgetsYen: budgetBreakdown(tax.incomeTaxYen),
  };
};
