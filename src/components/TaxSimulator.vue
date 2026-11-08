<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DonutChart from "./DonutChart.vue";
import BreakdownTable, { type BreakdownRow } from "./BreakdownTable.vue";
import { BUDGET_ITEMS, simulateTax } from "../utils/simulate";
import { toJpNumber } from "../utils/tax";
import { incomeFromHash } from "../utils/hash";

const DEFAULT_INCOME_GROSS_YEN = 4000000;

// v-model on a number input yields "" while the field is empty.
const incomeInput = ref<number | "">(incomeFromHash(location.hash) ?? DEFAULT_INCOME_GROSS_YEN);
const result = computed(() => simulateTax(Number(incomeInput.value)));

watch(
  incomeInput,
  (income) => {
    location.hash = String(income);
  },
  { immediate: true },
);

const graphValues = computed(() => [
  result.value.netIncomeYearlyYen,
  result.value.insuranceSumYen,
  result.value.taxSumYen,
]);

const budgetRows = computed<BreakdownRow[]>(() =>
  BUDGET_ITEMS.map(({ label }, index) => ({
    label: `(${index + 1})${label}`,
    valueYen: result.value.budgetsYen[index],
  })),
);

const detailRows = computed<BreakdownRow[]>(() => {
  const r = result.value;
  return [
    { label: "標準月額報酬", valueYen: r.standardMonthlyFeeYen },
    { group: "社会保険料", label: "健康保険料/月額", valueYen: r.healthInsuranceMonthlyYen, showSymbol: true },
    { label: "健康保険料/年額", valueYen: r.healthInsuranceYearlyYen, showSymbol: true },
    { label: "子ども・子育て支援金/月額", valueYen: r.childSupportMonthlyYen, showSymbol: true },
    { label: "子ども・子育て支援金/年額", valueYen: r.childSupportYearlyYen, showSymbol: true },
    { label: "厚生年金/月額", valueYen: r.pensionMonthlyYen, showSymbol: true },
    { label: "厚生年金/年額", valueYen: r.pensionYearlyYen, showSymbol: true },
    { label: "雇用保険/月額", valueYen: r.unemploymentMonthlyYen, showSymbol: true },
    { label: "雇用保険/年額", valueYen: r.unemploymentYearlyYen, showSymbol: true },
    { group: "税金", label: "所得税", valueYen: r.incomeTaxYen, showSymbol: true },
    { label: "復興特別所得税", valueYen: r.reconstructionTaxYen, showSymbol: true },
    { label: "住民税", valueYen: r.localTaxYen, showSymbol: true },
    { group: "控除", label: "扶養控除", valueYen: r.dependentDeductionYen, showSymbol: true },
    { label: "基礎控除", valueYen: r.basicDeductionYen, showSymbol: true },
    { label: "給与控除", valueYen: r.salaryDeductionYen, showSymbol: true },
    { group: "所得", label: "控除後所得", valueYen: r.taxableIncomeYen, showSymbol: true },
    { label: "手取り額/年", valueYen: r.netIncomeYearlyYen, showSymbol: true },
    { label: "手取り額/月", valueYen: r.netIncomeMonthlyYen, showSymbol: true },
    { group: "会社負担", label: "会社負担社会保険料", valueYen: r.companyInsuranceYen, showSymbol: true },
  ];
});
</script>

<template>
  <div class="hello">
    年収: <input v-model="incomeInput" type="number" placeholder="income_gross" /><br />

    <hr />
    <table class="tax_table">
      <tr>
        <th>年収</th>
        <td>{{ toJpNumber(incomeInput) }}</td>
      </tr>
      <tr>
        <th class="tax">(2)社会保険合計</th>
        <td class="tax">{{ toJpNumber(result.insuranceSumYen) }}</td>
      </tr>
      <tr>
        <th class="tax">(3)税金合計</th>
        <td class="tax">{{ toJpNumber(result.taxSumYen) }}</td>
      </tr>
      <tr>
        <th>(1)手取り額</th>
        <td>{{ toJpNumber(result.netIncomeYearlyYen) }}</td>
      </tr>
    </table>
    <DonutChart :values="graphValues" />
    <hr />
    <h3>
      社会保険費（健康保険と厚生年金）は、あなたの負担額と同額を会社も支払っています。<br />
      あなたと会社、合わせて{{ toJpNumber(result.insuranceTotalWithCompanyYen) }}円、毎年支払っています。<br />
      健康保険{{ toJpNumber(result.healthInsuranceYearlyYen * 2) }}円、厚生年金{{
        toJpNumber(result.pensionYearlyYen * 2)
      }}円です。
    </h3>
    <hr />
    <h3>所得税{{ toJpNumber(result.incomeTaxYen) }}円の使いみち</h3>
    <BreakdownTable :rows="budgetRows" />
    <DonutChart :values="result.budgetsYen" />
    <hr />
    <BreakdownTable :rows="detailRows" />
  </div>
</template>

<style>
table .tax {
  color: #f00;
  font-size: 36px;
}
.tax_table {
  font-size: 36px;
}
.table-symbol {
  font-weight: bold;
  font-size: 20px;
}
input {
  width: 480px;
  height: 60px;
  border-radius: 8px;
  font-size: 36px;
  margin: 20px;
}
</style>
