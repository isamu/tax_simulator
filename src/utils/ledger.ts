import type { TaxSimulation } from "./simulate";

export type LedgerLine = { label: string; valueYen: number; note?: string };

export type LedgerSection = { title: string; rows: LedgerLine[]; total?: LedgerLine };

const insuranceSection = (r: TaxSimulation): LedgerSection => ({
  title: "社会保険料（年額）",
  rows: [
    { label: "健康保険", valueYen: r.healthInsuranceYearlyYen },
    { label: "子ども・子育て支援金", valueYen: r.childSupportYearlyYen },
    { label: "介護保険", valueYen: r.careInsuranceYearlyYen, note: "40〜64歳" },
    { label: "厚生年金", valueYen: r.pensionYearlyYen },
    { label: "雇用保険", valueYen: r.unemploymentYearlyYen },
  ],
  total: { label: "合計", valueYen: r.insuranceSumYen },
});

const taxSection = (r: TaxSimulation): LedgerSection => ({
  title: "税金（年額）",
  rows: [
    { label: "所得税", valueYen: r.incomeTaxYen },
    { label: "復興特別所得税", valueYen: r.reconstructionTaxYen },
    { label: "住民税", valueYen: r.localTaxYen, note: "所得割" },
  ],
  total: { label: "合計", valueYen: r.taxSumYen },
});

const deductionSection = (r: TaxSimulation): LedgerSection => ({
  title: "所得税の控除",
  rows: [
    { label: "給与所得控除", valueYen: r.salaryDeductionYen },
    { label: "基礎控除", valueYen: r.basicDeductionYen },
    { label: "配偶者（特別）控除", valueYen: r.spouseDeduction.incomeTaxYen },
    { label: "扶養控除", valueYen: r.dependentDeduction.incomeTaxYen },
    { label: "障害者控除", valueYen: r.disabilityDeduction.incomeTaxYen },
    { label: "寡婦・ひとり親控除", valueYen: r.singleStatusDeduction.incomeTaxYen },
  ],
  total: { label: "課税所得", valueYen: r.taxableIncomeYen },
});

const takeHomeSection = (r: TaxSimulation): LedgerSection => ({
  title: "手取り",
  rows: [
    { label: "標準報酬月額", valueYen: r.standardMonthlyFeeYen },
    { label: "手取り（月額）", valueYen: r.netIncomeMonthlyYen, note: "12等分" },
  ],
  total: { label: "手取り（年額）", valueYen: r.netIncomeYearlyYen },
});

const employerSection = (r: TaxSimulation): LedgerSection => ({
  title: "会社負担（年額）",
  rows: [
    { label: "健康保険", valueYen: r.employer.healthInsuranceYen, note: "本人と同額" },
    { label: "子ども・子育て支援金", valueYen: r.employer.childSupportYen, note: "本人と同額" },
    { label: "介護保険", valueYen: r.employer.careInsuranceYen, note: "本人と同額" },
    { label: "厚生年金", valueYen: r.employer.pensionYen, note: "本人と同額" },
    { label: "雇用保険", valueYen: r.employer.unemploymentYen, note: "0.85%" },
    { label: "子ども・子育て拠出金", valueYen: r.employer.childContributionYen, note: "会社のみ" },
    { label: "労災保険", valueYen: r.employer.workersCompYen, note: "会社のみ" },
  ],
  total: { label: "合計", valueYen: r.employer.totalYen },
});

export const ledgerSections = (r: TaxSimulation): LedgerSection[] => [
  insuranceSection(r),
  taxSection(r),
  deductionSection(r),
  takeHomeSection(r),
  employerSection(r),
];
