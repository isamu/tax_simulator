<script setup lang="ts">
import { computed, ref } from "vue";
import { FURUSATO_TAX_BRACKETS, coefficientFor, computeFurusatoLimit, optionalAmount } from "../utils/furusato";

// v-model on a number input yields "" while the field is empty.
type AmountField = number | "";

const sales = ref<AmountField>(12000000);
const expenses = ref<AmountField>(5000000);
const blue = ref(650000);
const otherIncome = ref<AmountField>(0);
const social = ref<AmountField>(900000);
const otherDeduction = ref<AmountField>(300000);
const personalGap = ref<AmountField>(0);
const taxableOverride = ref<AmountField>("");
const shotokuwariOverride = ref<AmountField>("");

const amountOrZero = (value: AmountField): number => value || 0;

const result = computed(() =>
  computeFurusatoLimit({
    salesYen: amountOrZero(sales.value),
    expensesYen: amountOrZero(expenses.value),
    blueDeductionYen: blue.value,
    otherIncomeYen: amountOrZero(otherIncome.value),
    socialInsuranceYen: amountOrZero(social.value),
    otherDeductionYen: amountOrZero(otherDeduction.value),
    personalGapYen: amountOrZero(personalGap.value),
    taxableOverrideYen: optionalAmount(taxableOverride.value),
    shotokuwariOverrideYen: optionalAmount(shotokuwariOverride.value),
  }),
);

const yen = (value: number): string => `${Math.round(value).toLocaleString("ja-JP")}円`;
const pct = (value: number, digits: number): string => `${(value * 100).toFixed(digits)}%`;
</script>

<template>
  <h1>ふるさと納税 上限計算（個人事業主）</h1>

  <h2>入力（円）</h2>
  <label>売上 <input v-model.number="sales" type="number" /></label>
  <label>必要経費 <input v-model.number="expenses" type="number" /></label>
  <label
    >青色申告特別控除
    <select v-model.number="blue">
      <option :value="650000">65万円</option>
      <option :value="550000">55万円</option>
      <option :value="100000">10万円</option>
      <option :value="0">なし（白色）</option>
    </select>
  </label>
  <label>その他の所得 <small>給与・雑所得など</small> <input v-model.number="otherIncome" type="number" /></label>
  <label>社会保険料控除 <input v-model.number="social" type="number" /></label>
  <label
    >その他の所得控除 <small>iDeCo・共済・生命保険など</small> <input v-model.number="otherDeduction" type="number"
  /></label>
  <label
    >配偶者・扶養控除の所得税と住民税の差 <small>配偶者・一般扶養は1人5万円</small>
    <input v-model.number="personalGap" type="number"
  /></label>
  <label
    >所得税の課税所得（直接入力） <input v-model="taxableOverride" type="number" placeholder="空欄なら自動"
  /></label>
  <label
    >住民税の所得割（直接入力） <input v-model="shotokuwariOverride" type="number" placeholder="空欄なら自動"
  /></label>

  <h2>結果</h2>
  <p>
    控除上限額の目安: <span class="limit">{{ yen(result.limitYen) }}</span>
  </p>
  <table>
    <tr>
      <td>合計所得</td>
      <td>{{ yen(result.totalIncomeYen) }}</td>
    </tr>
    <tr>
      <td>基礎控除（所得税 / 住民税）</td>
      <td>{{ yen(result.incomeTaxBasicYen) }} / {{ yen(result.residentBasicYen) }}</td>
    </tr>
    <tr>
      <td>所得税の課税所得</td>
      <td>{{ yen(result.taxableYen) }}</td>
    </tr>
    <tr>
      <td>住民税の課税所得</td>
      <td>{{ yen(result.residentTaxableYen) }}</td>
    </tr>
    <tr>
      <td>調整控除</td>
      <td>{{ yen(result.adjustYen) }}</td>
    </tr>
    <tr>
      <td>住民税の所得割</td>
      <td>{{ yen(result.shotokuwariYen) }}</td>
    </tr>
    <tr>
      <td>所得税率</td>
      <td>{{ pct(result.rate, 0) }}</td>
    </tr>
    <tr>
      <td>速算係数</td>
      <td>{{ pct(result.coefficient, 3) }}</td>
    </tr>
  </table>
  <p>
    {{ result.shotokuwariYen.toLocaleString() }} × {{ pct(result.coefficient, 3) }} + 2,000 =
    {{ yen(result.limitYen) }}
  </p>

  <h2>速算係数表</h2>
  <table>
    <tr>
      <th>判定所得</th>
      <th>所得税率</th>
      <th>速算係数</th>
    </tr>
    <tr v-for="bracket in FURUSATO_TAX_BRACKETS" :key="bracket.label" :class="{ on: bracket.rate === result.rate }">
      <td>{{ bracket.label }}</td>
      <td>{{ pct(bracket.rate, 0) }}</td>
      <td>{{ pct(coefficientFor(bracket.rate), 3) }}</td>
    </tr>
  </table>
  <p class="note">速算係数 = 20% ÷ (90% − 所得税率 × 1.021)。上限 ≒ 所得割 × 速算係数 + 2,000円。</p>
  <p class="note">
    基礎控除は令和7・8年分（所得税 95万〜58万円、住民税 43万円）。税率は「住民税の課税所得 −
    人的控除差調整額」で判定。生命保険料控除などの所得税・住民税の差、住宅ローン控除などの税額控除は考慮しない簡易計算です（所得割を直接入力すれば反映できます）。
  </p>
</template>

<style>
body {
  font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px;
  line-height: 1.6;
  color: #222;
  background: #fff;
}
h1 {
  font-size: 1.4rem;
}
h2 {
  font-size: 1.05rem;
  border-bottom: 2px solid #345;
  padding-bottom: 4px;
  margin-top: 28px;
}
label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
input,
select {
  width: 180px;
  padding: 4px 6px;
  font: inherit;
  text-align: right;
}
select {
  text-align: left;
}
small {
  color: #666;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-variant-numeric: tabular-nums;
}
td,
th {
  padding: 4px 8px;
  border-bottom: 1px solid #ddd;
  text-align: right;
}
td:first-child,
th:first-child {
  text-align: left;
}
tr.on td {
  background: #fff3c4;
  font-weight: bold;
}
.limit {
  font-size: 2rem;
  font-weight: bold;
  color: #234a7a;
}
.note {
  color: #666;
  font-size: 0.85rem;
}
</style>
