<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import NumberField from "../components/NumberField.vue";
import FormSection from "../components/FormSection.vue";
import RadioGroup from "../components/RadioGroup.vue";
import FamilyFields from "../components/FamilyFields.vue";
import InfoTip from "../components/InfoTip.vue";
import LedgerTable from "../components/LedgerTable.vue";
import { FURUSATO_HELP } from "./furusatoHelp";
import { FURUSATO_TAX_BRACKETS, coefficientFor, computeFurusatoLimit, optionalAmount } from "../utils/furusato";
import { savedInputs } from "../utils/storage";
import {
  type AmountField,
  type BlueChoice,
  type FurusatoForm,
  decodeFurusatoForm,
  defaultFurusatoForm,
  encodeFurusatoForm,
} from "./furusatoForm";
import { formatYen } from "../utils/format";

const saved = savedInputs("tax-simulator:furusato", () => localStorage);
const form = ref<FurusatoForm>(decodeFurusatoForm(saved.read()));

watch(form, (current) => saved.write(encodeFurusatoForm(current)), { deep: true });

const resetInputs = (): void => {
  saved.clear();
  form.value = defaultFurusatoForm();
};

const BLUE_OPTIONS: { value: BlueChoice; label: string }[] = [
  { value: "650000", label: "65万円" },
  { value: "550000", label: "55万円" },
  { value: "100000", label: "10万円" },
  { value: "0", label: "なし（白色）" },
  { value: "custom", label: "金額を入力" },
];

const amountOrZero = (value: AmountField): number => value || 0;

const blueDeductionYen = computed(() =>
  form.value.blueChoice === "custom" ? amountOrZero(form.value.blueCustom) : Number(form.value.blueChoice),
);

const result = computed(() =>
  computeFurusatoLimit({
    salesYen: amountOrZero(form.value.sales),
    expensesYen: amountOrZero(form.value.expenses),
    blueDeductionYen: blueDeductionYen.value,
    otherIncomeYen: amountOrZero(form.value.otherIncome),
    deductions: {
      socialInsuranceYen: amountOrZero(form.value.social),
      smallBusinessMutualYen: amountOrZero(form.value.smallBusinessMutual),
      lifeInsuranceYen: amountOrZero(form.value.lifeInsurance),
      earthquakeInsuranceYen: amountOrZero(form.value.earthquakeInsurance),
      medicalYen: amountOrZero(form.value.medical),
      spouse: form.value.hasSpouse
        ? { salaryYen: amountOrZero(form.value.spouseSalary), isElderly: form.value.spouseIsElderly }
        : null,
      dependents: {
        general: amountOrZero(form.value.dependents.general),
        specific: amountOrZero(form.value.dependents.specific),
        elderly: amountOrZero(form.value.dependents.elderly),
        cohabitingParents: amountOrZero(form.value.dependents.cohabitingParents),
      },
      selfDisability: form.value.selfDisability,
      familyDisabilities: {
        regular: amountOrZero(form.value.familyDisabilities.regular),
        special: amountOrZero(form.value.familyDisabilities.special),
        cohabitingSpecial: amountOrZero(form.value.familyDisabilities.cohabitingSpecial),
      },
      singleStatus: form.value.singleStatus,
    },
    housingLoanCreditYen: amountOrZero(form.value.housingLoanCredit),
    taxableOverrideYen: optionalAmount(form.value.taxableOverride),
    shotokuwariOverrideYen: optionalAmount(form.value.shotokuwariOverride),
  }),
);

const basicTipId = useId();

const pct = (value: number, digits: number): string => `${(value * 100).toFixed(digits)}%`;

const deductionRows = computed(() => [
  ...result.value.deductionLines.map(({ label, incomeTaxYen, residentTaxYen }) => ({
    label,
    valueYen: incomeTaxYen,
    note: residentTaxYen !== incomeTaxYen ? `住民税 ${formatYen(residentTaxYen)}` : undefined,
  })),
  {
    label: "基礎控除",
    valueYen: result.value.incomeTaxBasicYen,
    note: `住民税 ${formatYen(result.value.residentBasicYen)}`,
  },
]);

const deductionTotalYen = computed(() => deductionRows.value.reduce((sum, row) => sum + row.valueYen, 0));

const resultRows = computed(() => [
  { label: "合計所得", valueYen: result.value.totalIncomeYen },
  { label: "所得税の課税所得", valueYen: result.value.taxableYen },
  { label: "住民税の課税所得", valueYen: result.value.residentTaxableYen },
  { label: "人的控除の差", valueYen: result.value.personalGapYen, note: "自動" },
  { label: "調整控除", valueYen: result.value.adjustYen },
]);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <header class="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-rule-strong pb-3">
      <h1 class="text-2xl font-bold tracking-wide">ふるさと納税 上限計算</h1>
      <p class="text-sm text-ink-muted">個人事業主・令和8年分（2026年）</p>
    </header>

    <main class="mt-8 grid gap-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="space-y-6" @submit.prevent>
        <FormSection title="収入・所得">
          <NumberField
            v-model="form.sales"
            label="売上（収入金額）"
            unit="円"
            name="sales"
            :tip="FURUSATO_HELP.sales"
          />
          <NumberField
            v-model="form.expenses"
            label="必要経費"
            unit="円"
            name="expenses"
            :tip="FURUSATO_HELP.expenses"
          />
          <RadioGroup
            v-model="form.blueChoice"
            label="青色申告特別控除"
            name="blue"
            :options="BLUE_OPTIONS"
            :tip="FURUSATO_HELP.blue"
          />
          <NumberField
            v-if="form.blueChoice === 'custom'"
            v-model="form.blueCustom"
            label="青色申告特別控除額"
            unit="円"
            name="blue_custom"
            :min="0"
            :tip="FURUSATO_HELP.blueCustom"
          />
          <NumberField
            v-model="form.otherIncome"
            label="その他の所得"
            hint="給与所得・雑所得など"
            unit="円"
            name="other_income"
            :tip="FURUSATO_HELP.otherIncome"
          />
        </FormSection>

        <FormSection title="所得から差し引かれる金額" :tip="FURUSATO_HELP.deductions">
          <NumberField
            v-model="form.social"
            label="社会保険料控除"
            unit="円"
            name="social"
            :min="0"
            :tip="FURUSATO_HELP.socialInsurance"
          />
          <NumberField
            v-model="form.smallBusinessMutual"
            label="小規模企業共済等掛金控除"
            hint="iDeCo・小規模企業共済"
            unit="円"
            name="small_business_mutual"
            :min="0"
            :tip="FURUSATO_HELP.smallBusinessMutual"
          />
          <NumberField
            v-model="form.lifeInsurance"
            label="生命保険料控除"
            unit="円"
            name="life_insurance"
            :min="0"
            :tip="FURUSATO_HELP.lifeInsurance"
          />
          <NumberField
            v-model="form.earthquakeInsurance"
            label="地震保険料控除"
            unit="円"
            name="earthquake_insurance"
            :min="0"
            :tip="FURUSATO_HELP.earthquakeInsurance"
          />
          <FamilyFields
            v-model:has-spouse="form.hasSpouse"
            v-model:spouse-salary="form.spouseSalary"
            v-model:spouse-is-elderly="form.spouseIsElderly"
            v-model:dependents="form.dependents"
            v-model:self-disability="form.selfDisability"
            v-model:family-disabilities="form.familyDisabilities"
            v-model:single-status="form.singleStatus"
          />
          <NumberField
            v-model="form.medical"
            label="医療費控除"
            unit="円"
            name="medical"
            :min="0"
            :tip="FURUSATO_HELP.medical"
          />
          <p class="relative py-1 text-xs text-ink-muted">
            基礎控除 {{ formatYen(result.incomeTaxBasicYen) }}円（住民税
            {{ formatYen(result.residentBasicYen) }}円）は自動で計算します。<InfoTip
              :id="basicTipId"
              :text="FURUSATO_HELP.basicDeduction"
            />
          </p>
        </FormSection>

        <FormSection title="税額控除">
          <NumberField
            v-model="form.housingLoanCredit"
            label="住宅ローン控除"
            hint="所得税から引いた額"
            unit="円"
            name="housing_loan_credit"
            :min="0"
            :tip="FURUSATO_HELP.housingLoan"
          />
        </FormSection>

        <FormSection title="直接入力（任意）">
          <NumberField
            v-model="form.taxableOverride"
            label="所得税の課税所得"
            unit="円"
            name="taxable_override"
            placeholder="空欄なら自動"
            :tip="FURUSATO_HELP.taxableOverride"
          />
          <NumberField
            v-model="form.shotokuwariOverride"
            label="住民税の所得割"
            unit="円"
            name="shotokuwari_override"
            placeholder="空欄なら自動"
            :tip="FURUSATO_HELP.shotokuwariOverride"
          />
        </FormSection>

        <button
          type="button"
          class="border border-rule px-3 py-1 text-xs text-ink-muted hover:border-ink hover:text-ink focus:border-accent focus:outline-none"
          @click="resetInputs"
        >
          入力をリセット
        </button>
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
          <p v-if="result.selfBurdenAtLimitYen > 2000" class="mt-2 border-l-2 border-accent pl-2 text-sm">
            住宅ローン控除で所得税が少ないため、上限まで寄付すると自己負担は約{{
              formatYen(result.selfBurdenAtLimitYen)
            }}円になります（所得税から引ききれない分。住民税の住宅ローン控除で一部戻ることがあります）。
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <LedgerTable
            title="所得から差し引かれる金額"
            :rows="deductionRows"
            :total="{ label: '合計（所得税）', valueYen: deductionTotalYen }"
          />

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
          <p>基礎控除は令和8年分（所得税 104万〜62万円、住民税 43万円）。税率は所得税の課税所得で判定。</p>
          <p>
            住民税の生命保険料控除は所得税の額の7割で概算しています。勤労学生控除・特定親族特別控除・雑損控除には対応していません（課税所得や所得割を直接入力すれば反映できます）。
          </p>
          <p>
            住民税の所得割は標準の10%で計算しています。名古屋市（9.7%）・神奈川県（10.025%）・豊岡市（10.1%）など一部の自治体は税率が異なり、上限額は税率にほぼ比例して変わります（名古屋市で約3%少なめ）。
          </p>
        </div>
      </section>
    </main>

    <footer class="mt-16 border-t border-rule pt-4 text-xs text-ink-muted">
      <a href="/" class="text-accent underline underline-offset-2">税金シミュレーター（会社員向け）</a>
    </footer>
  </div>
</template>
