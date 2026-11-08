<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import NumberField from "./NumberField.vue";
import InfoTip from "./InfoTip.vue";
import { FIELD_HELP } from "./fieldHelp";
import FormSection from "./FormSection.vue";
import StackedBar from "./StackedBar.vue";
import LedgerTable from "./LedgerTable.vue";
import BudgetTable from "./BudgetTable.vue";
import { BUDGET_ITEMS, DEFAULT_HOUSEHOLD, type Household, simulateTax } from "../utils/simulate";
import {
  type Dependents,
  type FamilyDisabilities,
  NO_DEPENDENTS,
  NO_FAMILY_DISABILITIES,
  type SelfDisability,
  type SingleStatus,
} from "../utils/deductions";
import { incomeFromHash } from "../utils/hash";
import { ledgerSections } from "../utils/ledger";
import { formatPercent, formatYen } from "../utils/format";

const DEFAULT_INCOME_GROSS_YEN = 4000000;
const INCOME_STEP_YEN = 1000000;

// v-model on a number input yields "" while the field is empty.
type NumberInput = number | "";

const incomeInput = ref<NumberInput>(incomeFromHash(location.hash) ?? DEFAULT_INCOME_GROSS_YEN);
const paysCareInsurance = ref(DEFAULT_HOUSEHOLD.paysCareInsurance);
const isNationalInsurance = ref(DEFAULT_HOUSEHOLD.nationalInsurance);
const hasSpouse = ref(false);
const spouseSalaryInput = ref<NumberInput>(0);
const spouseIsElderly = ref(false);

const DEPENDENT_FIELDS: { key: keyof Dependents; label: string }[] = [
  { key: "general", label: "一般" },
  { key: "specific", label: "特定（19〜22歳）" },
  { key: "elderly", label: "老人（70歳以上）" },
  { key: "cohabitingParents", label: "同居老親等" },
];
const dependentInputs = ref<Record<keyof Dependents, NumberInput>>({ ...NO_DEPENDENTS });

const FAMILY_DISABILITY_FIELDS: { key: keyof FamilyDisabilities; label: string }[] = [
  { key: "regular", label: "障害者" },
  { key: "special", label: "特別障害者" },
  { key: "cohabitingSpecial", label: "同居特別障害者" },
];
const selfDisability = ref<SelfDisability>("none");
const familyDisabilityInputs = ref<Record<keyof FamilyDisabilities, NumberInput>>({ ...NO_FAMILY_DISABILITIES });
const singleStatus = ref<SingleStatus>("none");

const household = computed<Household>(() => ({
  paysCareInsurance: paysCareInsurance.value,
  nationalInsurance: isNationalInsurance.value,
  spouse: hasSpouse.value ? { salaryYen: Number(spouseSalaryInput.value), isElderly: spouseIsElderly.value } : null,
  dependents: {
    general: Number(dependentInputs.value.general),
    specific: Number(dependentInputs.value.specific),
    elderly: Number(dependentInputs.value.elderly),
    cohabitingParents: Number(dependentInputs.value.cohabitingParents),
  },
  selfDisability: selfDisability.value,
  familyDisabilities: {
    regular: Number(familyDisabilityInputs.value.regular),
    special: Number(familyDisabilityInputs.value.special),
    cohabitingSpecial: Number(familyDisabilityInputs.value.cohabitingSpecial),
  },
  singleStatus: singleStatus.value,
}));
const result = computed(() => simulateTax(Number(incomeInput.value), household.value));

watch(
  incomeInput,
  (income) => {
    location.hash = String(income);
  },
  { immediate: true },
);

const SHARE_COLORS: Record<string, string> = {
  net: "bg-series-1",
  insurance: "bg-series-2",
  tax: "bg-series-3",
  employer: "bg-series-4",
};

const laborCostItems = computed(() => [
  { key: "net", label: "手取り", valueYen: result.value.netIncomeYearlyYen },
  { key: "insurance", label: "あなたの社会保険料", valueYen: result.value.insuranceSumYen },
  { key: "tax", label: "税金", valueYen: result.value.taxSumYen },
  { key: "employer", label: "会社負担の社会保険料", valueYen: result.value.companyInsuranceYen },
]);

const takeHomeShare = computed(() => result.value.netIncomeYearlyYen / result.value.totalLaborCostYen);

const sections = computed(() => ledgerSections(result.value));

const tipIds = {
  care: useId(),
  nationalInsurance: useId(),
  hasSpouse: useId(),
  spouseIsElderly: useId(),
  selfDisability: useId(),
  familyDisabilities: useId(),
  singleStatus: useId(),
};

const selectClass = "w-[9.25rem] border border-rule bg-paper-raised px-2 py-1 focus:border-accent focus:outline-none";
const checkboxClass = "size-4 accent-[var(--accent)]";
</script>

<template>
  <div class="grid gap-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
    <form class="space-y-6" @submit.prevent>
      <FormSection title="本人">
        <NumberField
          v-model="incomeInput"
          label="年収（額面）"
          unit="円"
          name="income_gross"
          :min="0"
          :tip="FIELD_HELP.incomeGross"
          :step="INCOME_STEP_YEN"
          step-label="100万円"
        />
        <label class="relative flex items-center gap-2 py-1.5 text-sm">
          <input
            v-model="paysCareInsurance"
            type="checkbox"
            name="care"
            :class="checkboxClass"
            :aria-describedby="tipIds.care"
          />
          <span>40〜64歳<InfoTip :id="tipIds.care" :text="FIELD_HELP.care" /></span>
        </label>
        <label class="relative flex items-center gap-2 py-1.5 text-sm">
          <input
            v-model="isNationalInsurance"
            type="checkbox"
            name="kokuho"
            :class="checkboxClass"
            :aria-describedby="tipIds.nationalInsurance"
          />
          <span
            >国民健康保険・国民年金<InfoTip :id="tipIds.nationalInsurance" :text="FIELD_HELP.nationalInsurance"
          /></span>
        </label>
      </FormSection>

      <FormSection title="配偶者">
        <label class="relative flex items-center gap-2 py-1.5 text-sm">
          <input v-model="hasSpouse" type="checkbox" :class="checkboxClass" :aria-describedby="tipIds.hasSpouse" />
          <span>配偶者あり<InfoTip :id="tipIds.hasSpouse" :text="FIELD_HELP.hasSpouse" /></span>
        </label>
        <template v-if="hasSpouse">
          <NumberField
            v-model="spouseSalaryInput"
            label="配偶者の給与収入"
            unit="円"
            name="spouse_salary"
            :min="0"
            :tip="FIELD_HELP.spouseSalary"
          />
          <label class="relative flex items-center gap-2 py-1.5 text-sm">
            <input
              v-model="spouseIsElderly"
              type="checkbox"
              :class="checkboxClass"
              :aria-describedby="tipIds.spouseIsElderly"
            />
            <span>配偶者が70歳以上<InfoTip :id="tipIds.spouseIsElderly" :text="FIELD_HELP.spouseIsElderly" /></span>
          </label>
        </template>
      </FormSection>

      <FormSection title="扶養親族（16歳以上）" :tip="FIELD_HELP.dependents">
        <NumberField
          v-for="field in DEPENDENT_FIELDS"
          :key="field.key"
          v-model="dependentInputs[field.key]"
          :label="field.label"
          unit="人"
          :name="field.key"
          :min="0"
          :tip="FIELD_HELP[field.key]"
        />
      </FormSection>

      <FormSection title="障害・ひとり親">
        <label class="relative flex items-baseline justify-between gap-3 py-1.5 text-sm">
          <span>本人の障害<InfoTip :id="tipIds.selfDisability" :text="FIELD_HELP.selfDisability" /></span>
          <select
            v-model="selfDisability"
            name="selfDisability"
            :class="selectClass"
            :aria-describedby="tipIds.selfDisability"
          >
            <option value="none">なし</option>
            <option value="regular">障害者</option>
            <option value="special">特別障害者</option>
          </select>
        </label>
        <p class="relative pt-2 text-xs text-ink-muted">
          配偶者・扶養親族のうち<InfoTip :id="tipIds.familyDisabilities" :text="FIELD_HELP.familyDisabilities" />
        </p>
        <NumberField
          v-for="field in FAMILY_DISABILITY_FIELDS"
          :key="field.key"
          v-model="familyDisabilityInputs[field.key]"
          :label="field.label"
          unit="人"
          :name="`disability_${field.key}`"
          :min="0"
        />
        <label class="relative flex items-baseline justify-between gap-3 py-1.5 text-sm">
          <span>寡婦・ひとり親<InfoTip :id="tipIds.singleStatus" :text="FIELD_HELP.singleStatus" /></span>
          <select
            v-model="singleStatus"
            name="singleStatus"
            :class="selectClass"
            :aria-describedby="tipIds.singleStatus"
          >
            <option value="none">該当なし</option>
            <option value="widow">寡婦</option>
            <option value="singleParent">ひとり親</option>
          </select>
        </label>
      </FormSection>
    </form>

    <section class="space-y-10" aria-live="polite">
      <div class="border-t border-rule-strong pt-3">
        <p class="text-xs font-bold tracking-[0.2em] text-ink-muted">手取り（年額）</p>
        <p class="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">
          {{ formatYen(result.netIncomeYearlyYen) }}<span class="ml-1 text-lg font-normal">円</span>
        </p>
        <p class="mt-1 text-sm text-ink-muted">
          月あたり {{ formatYen(result.netIncomeMonthlyYen) }}円 ／ 年収 {{ formatYen(Number(incomeInput)) }}円
        </p>
      </div>

      <div class="border-t border-rule-strong pt-3">
        <p class="text-xs font-bold tracking-[0.2em] text-ink-muted">会社が払っている総額（総人件費）</p>
        <p class="mt-1 text-2xl font-bold tabular-nums">
          {{ formatYen(result.totalLaborCostYen) }}<span class="ml-1 text-base font-normal">円</span>
        </p>
        <p class="mt-1 text-sm leading-relaxed">
          <span>年収とは別に、会社は社会保険料を年 {{ formatYen(result.companyInsuranceYen) }}円 払っています。</span
          ><span>総人件費のうち、あなたの手元に残るのは {{ formatPercent(takeHomeShare) }} です。</span>
        </p>
        <div class="mt-4">
          <StackedBar :items="laborCostItems" :colors="SHARE_COLORS" />
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <LedgerTable
          v-for="section in sections"
          :key="section.title"
          :title="section.title"
          :rows="section.rows"
          :total="section.total"
        />
      </div>

      <div class="space-y-1 border-l-2 border-rule-strong pl-3 text-xs leading-relaxed text-ink-muted">
        <p v-if="!result.isNationalInsurance">
          健康保険・子ども・子育て支援金・介護保険・厚生年金は、あなたと同じ額を会社も負担しています。子ども・子育て拠出金は会社だけが払う保険料です。
        </p>
        <p v-else>
          国民健康保険料は東京23区の共通基準（令和8年度、20区）で、加入者を本人1人として計算しています。中野区・江戸川区は料率が異なり、目黒区は介護分の所得割が異なります。実際の保険料は前年の所得で決まります。
        </p>
        <p>
          労災保険は会社だけが払う保険料で、料率は業種で異なります。ここでは「その他の各種事業」の0.3%で計算しています。
        </p>
      </div>

      <div>
        <h2 class="border-b border-rule-strong pb-1 text-xs font-bold tracking-[0.2em] text-ink-muted">
          所得税 {{ formatYen(result.incomeTaxYen) }}円の使いみち
        </h2>
        <BudgetTable :items="BUDGET_ITEMS" :values-yen="result.budgetsYen" />
        <p class="mt-2 text-xs text-ink-muted">令和8年度一般会計（補正後）の歳出の割合で按分した目安です。</p>
      </div>
    </section>
  </div>
</template>
