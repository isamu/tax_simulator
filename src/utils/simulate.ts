import {
  incomeTax,
  incomeTaxBasicDeduction,
  residentTaxBasicDeduction,
  salaryIncomeDeduction,
  standardMonthlyFee,
} from "./tax";
import {
  type Dependents,
  type FamilyDisabilities,
  NO_DEPENDENTS,
  NO_FAMILY_DISABILITIES,
  type SelfDisability,
  type SingleStatus,
  disabilityDeduction,
  singleStatusDeduction,
  type PersonalDeduction,
  type Spouse,
  addDeductions,
  dependentDeduction,
  spouseDeduction,
} from "./deductions";

const MONTHS_PER_YEAR = 12;
// Rates are the employer + employee total; the employee pays half.
// The health rate depends on prefecture; this is the Kyokai Kenpo national average for FY2026.
const HEALTH_INSURANCE_RATE = 0.099;
const CHILD_SUPPORT_RATE = 0.0023;
// Only Category 2 insured persons (ages 40-64) pay care insurance through the employer.
const CARE_INSURANCE_RATE = 0.0162;
const PENSION_RATE = 0.183;
const EMPLOYEE_SHARE = 0.5;
const PENSION_FEE_FLOOR_YEN = 88000;
const PENSION_FEE_CAP_YEN = 650000;
const EMPLOYEE_UNEMPLOYMENT_RATE = 0.005;
const EMPLOYER_UNEMPLOYMENT_RATE = 0.0085;
const RECONSTRUCTION_TAX_RATE = 0.021;
const LOCAL_TAX_RATE = 0.1;
const TAXABLE_INCOME_UNIT_YEN = 1000;

export type BudgetItem = { label: string; amountOkuYen: number; description: string };

// FY2026 general account expenditure after the supplementary budget (MOF, October 2026).
export const BUDGET_ITEMS: readonly BudgetItem[] = [
  {
    label: "社会保障",
    amountOkuYen: 390559,
    description: "年金・医療・介護・子育て支援・生活保護などに国が出すお金です。高齢化で年々増えています。",
  },
  {
    label: "地方交付税交付金等",
    amountOkuYen: 208778,
    description:
      "地域による税収の差をならすため、国が集めた税金を都道府県や市区町村に配るお金です。自治体の学校・警察・消防などに使われます。",
  },
  {
    label: "公共事業",
    amountOkuYen: 61078,
    description: "道路・河川・港・住宅・防災など、暮らしや経済の土台を整える工事のお金です。",
  },
  {
    label: "文教及び科学振興",
    amountOkuYen: 60406,
    description: "公立小中学校の先生の給与の一部、国立大学、奨学金、科学技術の研究開発などのお金です。",
  },
  {
    label: "防衛",
    amountOkuYen: 89843,
    description: "自衛隊の人件費・装備・訓練など、国の防衛のためのお金です。",
  },
  {
    label: "その他",
    amountOkuYen: 130806,
    description: "食料の安定供給、エネルギー対策、経済協力（ODA）、中小企業対策、災害などに備える予備費などです。",
  },
  {
    label: "国債費",
    amountOkuYen: 312758,
    description:
      "政府の借金（国債）の返済と利払いに使われます。これからも赤字国債が増えたり、金利が上昇すると増えます。",
  },
];

const BUDGET_TOTAL_OKU_YEN = BUDGET_ITEMS.reduce((sum, { amountOkuYen }) => sum + amountOkuYen, 0);

export type Household = {
  paysCareInsurance: boolean;
  spouse: Spouse | null;
  dependents: Dependents;
  selfDisability: SelfDisability;
  familyDisabilities: FamilyDisabilities;
  singleStatus: SingleStatus;
};

export const DEFAULT_HOUSEHOLD: Household = {
  paysCareInsurance: false,
  spouse: null,
  dependents: NO_DEPENDENTS,
  selfDisability: "none",
  familyDisabilities: NO_FAMILY_DISABILITIES,
  singleStatus: "none",
};

export type SocialInsurance = {
  standardMonthlyFeeYen: number;
  healthInsuranceMonthlyYen: number;
  healthInsuranceYearlyYen: number;
  childSupportMonthlyYen: number;
  childSupportYearlyYen: number;
  careInsuranceMonthlyYen: number;
  careInsuranceYearlyYen: number;
  pensionMonthlyYen: number;
  pensionYearlyYen: number;
  unemploymentMonthlyYen: number;
  unemploymentYearlyYen: number;
};

export type Taxes = {
  salaryDeductionYen: number;
  basicDeductionYen: number;
  spouseDeduction: PersonalDeduction;
  dependentDeduction: PersonalDeduction;
  disabilityDeduction: PersonalDeduction;
  singleStatusDeduction: PersonalDeduction;
  taxableIncomeYen: number;
  incomeTaxYen: number;
  reconstructionTaxYen: number;
  localTaxYen: number;
};

export type TaxSimulation = SocialInsurance &
  Taxes & {
    netIncomeYearlyYen: number;
    netIncomeMonthlyYen: number;
    insuranceSumYen: number;
    companyInsuranceYen: number;
    insuranceTotalWithCompanyYen: number;
    taxSumYen: number;
    budgetsYen: number[];
  };

const employeeShare = (feeYen: number, rate: number): number => Math.round(feeYen * rate * EMPLOYEE_SHARE);

export const socialInsurance = (incomeGrossYen: number, household: Household): SocialInsurance => {
  const standardMonthlyFeeYen = standardMonthlyFee(incomeGrossYen / MONTHS_PER_YEAR);
  const pensionFeeYen = Math.min(Math.max(standardMonthlyFeeYen, PENSION_FEE_FLOOR_YEN), PENSION_FEE_CAP_YEN);
  const healthInsuranceMonthlyYen = employeeShare(standardMonthlyFeeYen, HEALTH_INSURANCE_RATE);
  const childSupportMonthlyYen = employeeShare(standardMonthlyFeeYen, CHILD_SUPPORT_RATE);
  const careInsuranceMonthlyYen = household.paysCareInsurance
    ? employeeShare(standardMonthlyFeeYen, CARE_INSURANCE_RATE)
    : 0;
  const pensionMonthlyYen = employeeShare(pensionFeeYen, PENSION_RATE);
  const unemploymentMonthlyYen = Math.round((incomeGrossYen / MONTHS_PER_YEAR) * EMPLOYEE_UNEMPLOYMENT_RATE);
  return {
    standardMonthlyFeeYen,
    healthInsuranceMonthlyYen,
    healthInsuranceYearlyYen: healthInsuranceMonthlyYen * MONTHS_PER_YEAR,
    childSupportMonthlyYen,
    childSupportYearlyYen: childSupportMonthlyYen * MONTHS_PER_YEAR,
    careInsuranceMonthlyYen,
    careInsuranceYearlyYen: careInsuranceMonthlyYen * MONTHS_PER_YEAR,
    pensionMonthlyYen,
    pensionYearlyYen: pensionMonthlyYen * MONTHS_PER_YEAR,
    unemploymentMonthlyYen,
    unemploymentYearlyYen: unemploymentMonthlyYen * MONTHS_PER_YEAR,
  };
};

const sharedInsuranceYen = (insurance: SocialInsurance): number =>
  insurance.healthInsuranceYearlyYen +
  insurance.childSupportYearlyYen +
  insurance.careInsuranceYearlyYen +
  insurance.pensionYearlyYen;

const yearlyInsuranceYen = (insurance: SocialInsurance): number =>
  sharedInsuranceYen(insurance) + insurance.unemploymentYearlyYen;

const employerInsuranceYen = (incomeGrossYen: number, insurance: SocialInsurance): number =>
  sharedInsuranceYen(insurance) +
  Math.round((incomeGrossYen / MONTHS_PER_YEAR) * EMPLOYER_UNEMPLOYMENT_RATE) * MONTHS_PER_YEAR;

const taxableIncome = (salaryIncomeYen: number, insuranceYen: number, personalDeductionsYen: number): number => {
  const incomeYen = Math.max(salaryIncomeYen - insuranceYen - personalDeductionsYen, 0);
  return Math.floor(incomeYen / TAXABLE_INCOME_UNIT_YEN) * TAXABLE_INCOME_UNIT_YEN;
};

export const taxes = (incomeGrossYen: number, insurance: SocialInsurance, household: Household): Taxes => {
  const salaryDeductionYen = salaryIncomeDeduction(incomeGrossYen);
  const salaryIncomeYen = incomeGrossYen - salaryDeductionYen;
  const insuranceYen = yearlyInsuranceYen(insurance);
  const basicDeductionYen = incomeTaxBasicDeduction(salaryIncomeYen);
  const spouse = spouseDeduction(salaryIncomeYen, household.spouse);
  const dependents = dependentDeduction(household.dependents);
  const disability = disabilityDeduction(household.selfDisability, household.familyDisabilities);
  const singleStatus = singleStatusDeduction(household.singleStatus, salaryIncomeYen);
  const family = [dependents, disability, singleStatus].reduce(addDeductions, spouse);
  const taxableIncomeYen = taxableIncome(salaryIncomeYen, insuranceYen, basicDeductionYen + family.incomeTaxYen);
  const incomeTaxYen = Math.round(incomeTax(taxableIncomeYen));
  const residentDeductionsYen = residentTaxBasicDeduction(salaryIncomeYen) + family.residentTaxYen;
  const localTaxableIncomeYen = taxableIncome(salaryIncomeYen, insuranceYen, residentDeductionsYen);
  return {
    salaryDeductionYen,
    basicDeductionYen,
    spouseDeduction: spouse,
    dependentDeduction: dependents,
    disabilityDeduction: disability,
    singleStatusDeduction: singleStatus,
    taxableIncomeYen,
    incomeTaxYen,
    reconstructionTaxYen: Math.round(incomeTaxYen * RECONSTRUCTION_TAX_RATE),
    localTaxYen: Math.round(localTaxableIncomeYen * LOCAL_TAX_RATE),
  };
};

export const budgetBreakdown = (incomeTaxYen: number): number[] =>
  BUDGET_ITEMS.map(({ amountOkuYen }) => Math.round((amountOkuYen / BUDGET_TOTAL_OKU_YEN) * incomeTaxYen));

export const simulateTax = (incomeGrossYen: number, household: Household = DEFAULT_HOUSEHOLD): TaxSimulation => {
  const insurance = socialInsurance(incomeGrossYen, household);
  const tax = taxes(incomeGrossYen, insurance, household);
  const insuranceSumYen = yearlyInsuranceYen(insurance);
  const companyInsuranceYen = employerInsuranceYen(incomeGrossYen, insurance);
  const taxSumYen = tax.incomeTaxYen + tax.reconstructionTaxYen + tax.localTaxYen;
  const netIncomeYearlyYen = incomeGrossYen - insuranceSumYen - taxSumYen;
  return {
    ...insurance,
    ...tax,
    netIncomeYearlyYen,
    netIncomeMonthlyYen: Math.round(netIncomeYearlyYen / MONTHS_PER_YEAR),
    insuranceSumYen,
    companyInsuranceYen,
    insuranceTotalWithCompanyYen: insuranceSumYen + companyInsuranceYen,
    taxSumYen,
    budgetsYen: budgetBreakdown(tax.incomeTaxYen),
  };
};
