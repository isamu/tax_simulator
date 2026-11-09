<script setup lang="ts">
import { computed, ref, useId } from "vue";
import NumberField from "../components/NumberField.vue";
import FormSection from "../components/FormSection.vue";
import RadioGroup from "../components/RadioGroup.vue";
import FamilyFields from "../components/FamilyFields.vue";
import InfoTip from "../components/InfoTip.vue";
import LedgerTable from "../components/LedgerTable.vue";
import { FURUSATO_HELP } from "./furusatoHelp";
import { FURUSATO_TAX_BRACKETS, coefficientFor, computeFurusatoLimit, optionalAmount } from "../utils/furusato";
import { type Dependents, type FamilyDisabilities, type SelfDisability, type SingleStatus } from "../utils/deductions";
import { formatYen } from "../utils/format";

// v-model on a number input yields "" while the field is empty.
type AmountField = number | "";
type BlueChoice = "650000" | "550000" | "100000" | "0" | "custom";

const sales = ref<AmountField>(12000000);
const expenses = ref<AmountField>(5000000);
const blueChoice = ref<BlueChoice>("650000");
const blueCustom = ref<AmountField>(0);
const otherIncome = ref<AmountField>(0);
const social = ref<AmountField>(900000);
const smallBusinessMutual = ref<AmountField>(0);
const lifeInsurance = ref<AmountField>(0);
const earthquakeInsurance = ref<AmountField>(0);
const medical = ref<AmountField>(0);
const hasSpouse = ref(false);
const spouseSalary = ref<AmountField>(0);
const spouseIsElderly = ref(false);
const dependents = ref<Record<keyof Dependents, AmountField>>({
  general: 0,
  specific: 0,
  elderly: 0,
  cohabitingParents: 0,
});
const selfDisability = ref<SelfDisability>("none");
const familyDisabilities = ref<Record<keyof FamilyDisabilities, AmountField>>({
  regular: 0,
  special: 0,
  cohabitingSpecial: 0,
});
const singleStatus = ref<SingleStatus>("none");
const housingLoanCredit = ref<AmountField>(0);
const taxableOverride = ref<AmountField>("");
const shotokuwariOverride = ref<AmountField>("");

const BLUE_OPTIONS: { value: BlueChoice; label: string }[] = [
  { value: "650000", label: "65万円" },
  { value: "550000", label: "55万円" },
  { value: "100000", label: "10万円" },
  { value: "0", label: "なし（白色）" },
  { value: "custom", label: "金額を入力" },
];

const amountOrZero = (value: AmountField): number => value || 0;

const blueDeductionYen = computed(() =>
  blueChoice.value === "custom" ? amountOrZero(blueCustom.value) : Number(blueChoice.value),
);

const result = computed(() =>
  computeFurusatoLimit({
    salesYen: amountOrZero(sales.value),
    expensesYen: amountOrZero(expenses.value),
    blueDeductionYen: blueDeductionYen.value,
    otherIncomeYen: amountOrZero(otherIncome.value),
    deductions: {
      socialInsuranceYen: amountOrZero(social.value),
      smallBusinessMutualYen: amountOrZero(smallBusinessMutual.value),
      lifeInsuranceYen: amountOrZero(lifeInsurance.value),
      earthquakeInsuranceYen: amountOrZero(earthquakeInsurance.value),
      medicalYen: amountOrZero(medical.value),
      spouse: hasSpouse.value
        ? { salaryYen: amountOrZero(spouseSalary.value), isElderly: spouseIsElderly.value }
        : null,
      dependents: {
        general: amountOrZero(dependents.value.general),
        specific: amountOrZero(dependents.value.specific),
        elderly: amountOrZero(dependents.value.elderly),
        cohabitingParents: amountOrZero(dependents.value.cohabitingParents),
      },
      selfDisability: selfDisability.value,
      familyDisabilities: {
        regular: amountOrZero(familyDisabilities.value.regular),
        special: amountOrZero(familyDisabilities.value.special),
        cohabitingSpecial: amountOrZero(familyDisabilities.value.cohabitingSpecial),
      },
      singleStatus: singleStatus.value,
    },
    housingLoanCreditYen: amountOrZero(housingLoanCredit.value),
    taxableOverrideYen: optionalAmount(taxableOverride.value),
    shotokuwariOverrideYen: optionalAmount(shotokuwariOverride.value),
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
          <NumberField v-model="sales" label="売上（収入金額）" unit="円" name="sales" :tip="FURUSATO_HELP.sales" />
          <NumberField v-model="expenses" label="必要経費" unit="円" name="expenses" :tip="FURUSATO_HELP.expenses" />
          <RadioGroup
            v-model="blueChoice"
            label="青色申告特別控除"
            name="blue"
            :options="BLUE_OPTIONS"
            :tip="FURUSATO_HELP.blue"
          />
          <NumberField
            v-if="blueChoice === 'custom'"
            v-model="blueCustom"
            label="青色申告特別控除額"
            unit="円"
            name="blue_custom"
            :min="0"
            :tip="FURUSATO_HELP.blueCustom"
          />
          <NumberField
            v-model="otherIncome"
            label="その他の所得"
            hint="給与所得・雑所得など"
            unit="円"
            name="other_income"
            :tip="FURUSATO_HELP.otherIncome"
          />
        </FormSection>

        <FormSection title="所得から差し引かれる金額" :tip="FURUSATO_HELP.deductions">
          <NumberField
            v-model="social"
            label="社会保険料控除"
            unit="円"
            name="social"
            :min="0"
            :tip="FURUSATO_HELP.socialInsurance"
          />
          <NumberField
            v-model="smallBusinessMutual"
            label="小規模企業共済等掛金控除"
            hint="iDeCo・小規模企業共済"
            unit="円"
            name="small_business_mutual"
            :min="0"
            :tip="FURUSATO_HELP.smallBusinessMutual"
          />
          <NumberField
            v-model="lifeInsurance"
            label="生命保険料控除"
            unit="円"
            name="life_insurance"
            :min="0"
            :tip="FURUSATO_HELP.lifeInsurance"
          />
          <NumberField
            v-model="earthquakeInsurance"
            label="地震保険料控除"
            unit="円"
            name="earthquake_insurance"
            :min="0"
            :tip="FURUSATO_HELP.earthquakeInsurance"
          />
          <FamilyFields
            v-model:has-spouse="hasSpouse"
            v-model:spouse-salary="spouseSalary"
            v-model:spouse-is-elderly="spouseIsElderly"
            v-model:dependents="dependents"
            v-model:self-disability="selfDisability"
            v-model:family-disabilities="familyDisabilities"
            v-model:single-status="singleStatus"
          />
          <NumberField
            v-model="medical"
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
            v-model="housingLoanCredit"
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
            v-model="taxableOverride"
            label="所得税の課税所得"
            unit="円"
            name="taxable_override"
            placeholder="空欄なら自動"
            :tip="FURUSATO_HELP.taxableOverride"
          />
          <NumberField
            v-model="shotokuwariOverride"
            label="住民税の所得割"
            unit="円"
            name="shotokuwari_override"
            placeholder="空欄なら自動"
            :tip="FURUSATO_HELP.shotokuwariOverride"
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
