<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import NumberField from "./NumberField.vue";
import InfoTip from "./InfoTip.vue";
import { FIELD_HELP } from "./fieldHelp";
import FormSection from "./FormSection.vue";
import RadioGroup from "./RadioGroup.vue";
import StackedBar from "./StackedBar.vue";
import LedgerTable from "./LedgerTable.vue";
import BudgetTable from "./BudgetTable.vue";
import { BUDGET_ITEMS, type Household, simulateTax } from "../utils/simulate";
import { type Dependents, type FamilyDisabilities, type SelfDisability, type SingleStatus } from "../utils/deductions";
import { decodeShareState, encodeShareState, initialHash } from "../utils/shareState";
import { savedInputs } from "../utils/storage";
import {
  DEFAULT_HOUSING_LOAN,
  type HomeKind,
  type HomePerformance,
  type MoveInPeriod,
  housingLoanCapYen,
} from "../utils/housingLoan";
import { ledgerSections } from "../utils/ledger";
import { formatPercent, formatYen } from "../utils/format";

const DEFAULT_INCOME_GROSS_YEN = 4000000;
const INCOME_STEP_YEN = 1000000;

// v-model on a number input yields "" while the field is empty.
type NumberInput = number | "";

const saved = savedInputs("tax-simulator:inputs", () => localStorage);
const initial = decodeShareState(initialHash(location.hash, saved.read()), DEFAULT_INCOME_GROSS_YEN);

const incomeInput = ref<NumberInput>(initial.incomeGrossYen);
const paysCareInsurance = ref(initial.household.paysCareInsurance);
const isNationalInsurance = ref(initial.household.nationalInsurance);
const hasSpouse = ref(initial.household.spouse !== null);
const spouseSalaryInput = ref<NumberInput>(initial.household.spouse?.salaryYen ?? 0);
const spouseIsElderly = ref(initial.household.spouse?.isElderly ?? false);

const DEPENDENT_FIELDS: { key: keyof Dependents; label: string }[] = [
  { key: "general", label: "一般" },
  { key: "specific", label: "特定（19〜22歳）" },
  { key: "elderly", label: "老人（70歳以上）" },
  { key: "cohabitingParents", label: "同居老親等" },
];
const dependentInputs = ref<Record<keyof Dependents, NumberInput>>({ ...initial.household.dependents });

const FAMILY_DISABILITY_FIELDS: { key: keyof FamilyDisabilities; label: string }[] = [
  { key: "regular", label: "障害者" },
  { key: "special", label: "特別障害者" },
  { key: "cohabitingSpecial", label: "同居特別障害者" },
];
const selfDisability = ref<SelfDisability>(initial.household.selfDisability);
const familyDisabilityInputs = ref<Record<keyof FamilyDisabilities, NumberInput>>({
  ...initial.household.familyDisabilities,
});
const singleStatus = ref<SingleStatus>(initial.household.singleStatus);

const initialLoan = initial.household.housingLoan ?? DEFAULT_HOUSING_LOAN;
const hasHousingLoan = ref(initial.household.housingLoan !== null);
const loanBalanceInput = ref<NumberInput>(initialLoan.balanceYen);
const homeKind = ref<HomeKind>(initialLoan.kind);
const homePerformance = ref<HomePerformance>(initialLoan.performance);
const moveIn = ref<MoveInPeriod>(initialLoan.moveIn);
const childRearing = ref(initialLoan.childRearing);

const HOME_KIND_OPTIONS: { value: HomeKind; label: string }[] = [
  { value: "new", label: "新築" },
  { value: "used", label: "中古" },
];
const HOME_PERFORMANCE_OPTIONS: { value: HomePerformance; label: string }[] = [
  { value: "certified", label: "長期優良・低炭素" },
  { value: "zeh", label: "ZEH水準" },
  { value: "energySaving", label: "省エネ基準" },
  { value: "other", label: "その他" },
];
const MOVE_IN_OPTIONS: { value: MoveInPeriod; label: string }[] = [
  { value: "r4to5", label: "令和4〜5年" },
  { value: "r6to7", label: "令和6〜7年" },
  { value: "r8", label: "令和8年" },
];

const housingLoan = computed(() =>
  hasHousingLoan.value
    ? {
        balanceYen: Number(loanBalanceInput.value),
        kind: homeKind.value,
        performance: homePerformance.value,
        moveIn: moveIn.value,
        childRearing: childRearing.value,
      }
    : null,
);

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
  housingLoan: housingLoan.value,
}));
const result = computed(() => simulateTax(Number(incomeInput.value), household.value));

// replaceState keeps every keystroke out of the browser history.
watch(
  [incomeInput, household],
  ([income, currentHousehold]) => {
    const hash = encodeShareState({ incomeGrossYen: Number(income), household: currentHousehold });
    history.replaceState(null, "", `#${hash}`);
    saved.write(hash);
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
  housingLoan: useId(),
  childRearing: useId(),
};

const resetInputs = (): void => {
  saved.clear();
  location.replace(location.pathname);
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

      <FormSection title="住宅ローン">
        <label class="relative flex items-center gap-2 py-1.5 text-sm">
          <input
            v-model="hasHousingLoan"
            type="checkbox"
            name="loan"
            :class="checkboxClass"
            :aria-describedby="tipIds.housingLoan"
          />
          <span>住宅ローン控除あり<InfoTip :id="tipIds.housingLoan" :text="FIELD_HELP.housingLoan" /></span>
        </label>
        <template v-if="housingLoan">
          <NumberField
            v-model="loanBalanceInput"
            label="年末残高"
            unit="円"
            name="loan_balance"
            :min="0"
            :tip="FIELD_HELP.loanBalance"
          />
          <RadioGroup
            v-model="homeKind"
            label="住宅"
            name="loan_kind"
            :options="HOME_KIND_OPTIONS"
            :tip="FIELD_HELP.homeKind"
          />
          <RadioGroup
            v-model="homePerformance"
            label="省エネ性能"
            name="loan_perf"
            :options="HOME_PERFORMANCE_OPTIONS"
            :tip="FIELD_HELP.homePerformance"
          />
          <RadioGroup
            v-model="moveIn"
            label="入居した年"
            name="loan_year"
            :options="MOVE_IN_OPTIONS"
            :tip="FIELD_HELP.moveIn"
          />
          <label class="relative flex items-center gap-2 py-1.5 text-sm">
            <input
              v-model="childRearing"
              type="checkbox"
              name="loan_kids"
              :class="checkboxClass"
              :aria-describedby="tipIds.childRearing"
            />
            <span>子育て・若者夫婦世帯<InfoTip :id="tipIds.childRearing" :text="FIELD_HELP.childRearing" /></span>
          </label>
          <p class="py-1 text-xs text-ink-muted">
            控除の上限は年 {{ formatYen(housingLoanCapYen(housingLoan)) }}円です。
          </p>
        </template>
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

      <div class="border-t border-rule-strong pt-3">
        <p class="text-xs font-bold tracking-[0.2em] text-ink-muted">ふるさと納税の上限額（目安）</p>
        <p class="mt-1 text-2xl font-bold tabular-nums">
          {{ formatYen(result.furusatoLimitYen) }}<span class="ml-1 text-base font-normal">円</span>
        </p>
        <p class="mt-1 text-sm leading-relaxed">
          <span>この額までの寄付なら、自己負担は2,000円で済みます。</span
          ><span v-if="result.hasHousingLoan"
            >住宅ローン控除で所得税が0円になる場合は、上限が下がることがあります。</span
          ><span
            >個人事業主の方は<a href="/furusato/" class="text-accent underline underline-offset-2"
              >ふるさと納税の上限額の計算</a
            >へ。</span
          >
        </p>
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
