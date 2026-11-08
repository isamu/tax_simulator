<script setup lang="ts">
import { computed, ref } from "vue";
import NumberField from "../components/NumberField.vue";
import FormSection from "../components/FormSection.vue";
import LedgerTable from "../components/LedgerTable.vue";
import { FURUSATO_TAX_BRACKETS, coefficientFor, computeFurusatoLimit, optionalAmount } from "../utils/furusato";
import { formatYen } from "../utils/format";

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

const pct = (value: number, digits: number): string => `${(value * 100).toFixed(digits)}%`;

const resultRows = computed(() => [
  { label: "合計所得", valueYen: result.value.totalIncomeYen },
  { label: "基礎控除（所得税）", valueYen: result.value.incomeTaxBasicYen },
  { label: "基礎控除（住民税）", valueYen: result.value.residentBasicYen },
  { label: "所得税の課税所得", valueYen: result.value.taxableYen },
  { label: "住民税の課税所得", valueYen: result.value.residentTaxableYen },
  { label: "調整控除", valueYen: result.value.adjustYen },
]);

const BLUE_OPTIONS = [
  { value: 650000, label: "65万円" },
  { value: 550000, label: "55万円" },
  { value: 100000, label: "10万円" },
  { value: 0, label: "なし（白色）" },
];
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <header class="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-rule-strong pb-3">
      <h1 class="text-2xl font-bold tracking-wide">ふるさと納税 上限計算</h1>
      <p class="text-sm text-ink-muted">個人事業主・令和8年分（2026年）</p>
    </header>

    <main class="mt-8 grid gap-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="space-y-6" @submit.prevent>
        <FormSection title="事業">
          <NumberField v-model="sales" label="売上" unit="円" name="sales" />
          <NumberField v-model="expenses" label="必要経費" unit="円" name="expenses" />
          <label class="flex items-baseline justify-between gap-3 py-1.5 text-sm">
            <span>青色申告特別控除</span>
            <select
              v-model.number="blue"
              name="blue"
              class="w-[9.25rem] border border-rule bg-paper-raised px-2 py-1 focus:border-accent focus:outline-none"
            >
              <option v-for="option in BLUE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </FormSection>

        <FormSection title="所得と控除">
          <NumberField
            v-model="otherIncome"
            label="その他の所得"
            hint="給与・雑所得など"
            unit="円"
            name="other_income"
          />
          <NumberField v-model="social" label="社会保険料控除" unit="円" name="social" />
          <NumberField
            v-model="otherDeduction"
            label="その他の所得控除"
            hint="iDeCo・共済・生命保険など"
            unit="円"
            name="other_deduction"
          />
          <NumberField
            v-model="personalGap"
            label="人的控除の差"
            hint="配偶者・扶養控除の所得税と住民税の差。配偶者・一般扶養は1人5万円"
            unit="円"
            name="personal_gap"
          />
        </FormSection>

        <FormSection title="直接入力（任意）">
          <NumberField
            v-model="taxableOverride"
            label="所得税の課税所得"
            unit="円"
            name="taxable_override"
            placeholder="空欄なら自動"
          />
          <NumberField
            v-model="shotokuwariOverride"
            label="住民税の所得割"
            unit="円"
            name="shotokuwari_override"
            placeholder="空欄なら自動"
          />
        </FormSection>
      </form>

      <section class="space-y-10" aria-live="polite">
        <div class="border-t border-rule-strong pt-3">
          <p class="text-xs font-bold tracking-[0.2em] text-ink-muted">控除上限額の目安</p>
          <p class="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">
            {{ formatYen(result.limitYen) }}<span class="ml-1 text-lg font-normal">円</span>
          </p>
          <p class="mt-2 text-sm text-ink-muted tabular-nums">
            所得税率 {{ pct(result.rate, 0) }} ／ 所得割 {{ formatYen(result.shotokuwariYen) }}円 × 速算係数
            {{ pct(result.coefficient, 3) }} + 2,000円
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <LedgerTable
            title="計算の内訳"
            :rows="resultRows"
            :total="{ label: '住民税の所得割', valueYen: result.shotokuwariYen }"
          />

          <table class="w-full self-start border-collapse text-sm">
            <caption
              class="border-b border-rule-strong pb-1 text-left text-xs font-bold tracking-[0.2em] text-ink-muted"
            >
              速算係数表
            </caption>
            <thead>
              <tr class="border-b border-rule text-xs text-ink-muted">
                <th scope="col" class="py-1.5 text-left font-normal">判定所得</th>
                <th scope="col" class="py-1.5 text-right font-normal">所得税率</th>
                <th scope="col" class="py-1.5 text-right font-normal">速算係数</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="bracket in FURUSATO_TAX_BRACKETS"
                :key="bracket.label"
                :class="[
                  'border-b border-rule tabular-nums',
                  bracket.rate === result.rate ? 'bg-paper-raised font-bold shadow-[inset_3px_0_0_var(--accent)]' : '',
                ]"
                :aria-current="bracket.rate === result.rate ? 'true' : undefined"
              >
                <td class="py-1.5 pl-2">{{ bracket.label }}</td>
                <td class="py-1.5 text-right">{{ pct(bracket.rate, 0) }}</td>
                <td class="py-1.5 text-right">{{ pct(coefficientFor(bracket.rate), 3) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-2 border-l-2 border-rule-strong pl-3 text-xs leading-relaxed text-ink-muted">
          <p>速算係数 = 20% ÷ (90% − 所得税率 × 1.021)。上限 ≒ 所得割 × 速算係数 + 2,000円。</p>
          <p>
            基礎控除は令和8年分（所得税 104万〜62万円、住民税 43万円）。税率は「住民税の課税所得 −
            人的控除差調整額」で判定。生命保険料控除などの所得税・住民税の差、住宅ローン控除などの税額控除は考慮しない簡易計算です（所得割を直接入力すれば反映できます）。
          </p>
        </div>
      </section>
    </main>

    <footer class="mt-16 border-t border-rule pt-4 text-xs text-ink-muted">
      <a href="/" class="text-accent underline underline-offset-2">税金シミュレーター（会社員向け）</a>
    </footer>
  </div>
</template>
