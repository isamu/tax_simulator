<script setup lang="ts">
import { useId } from "vue";
import NumberField from "./NumberField.vue";
import RadioGroup from "./RadioGroup.vue";
import InfoTip from "./InfoTip.vue";
import { FIELD_HELP } from "./fieldHelp";
import type { Dependents, FamilyDisabilities, SelfDisability, SingleStatus } from "../utils/deductions";

// v-model on a number input yields "" while the field is empty.
type NumberInput = number | "";

const hasSpouse = defineModel<boolean>("hasSpouse", { required: true });
const spouseSalary = defineModel<NumberInput>("spouseSalary", { required: true });
const spouseIsElderly = defineModel<boolean>("spouseIsElderly", { required: true });
const dependents = defineModel<Record<keyof Dependents, NumberInput>>("dependents", { required: true });
const selfDisability = defineModel<SelfDisability>("selfDisability", { required: true });
const familyDisabilities = defineModel<Record<keyof FamilyDisabilities, NumberInput>>("familyDisabilities", {
  required: true,
});
const singleStatus = defineModel<SingleStatus>("singleStatus", { required: true });

const SINGLE_STATUS_OPTIONS: { value: SingleStatus; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "widow", label: "寡婦" },
  { value: "singleParent", label: "ひとり親" },
];
const SELF_DISABILITY_OPTIONS: { value: SelfDisability; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "regular", label: "障害者" },
  { value: "special", label: "特別障害者" },
];
const FAMILY_DISABILITY_FIELDS: { key: keyof FamilyDisabilities; label: string }[] = [
  { key: "regular", label: "障害者" },
  { key: "special", label: "特別障害者" },
  { key: "cohabitingSpecial", label: "同居特別障害者" },
];
const DEPENDENT_FIELDS: { key: keyof Dependents; label: string }[] = [
  { key: "general", label: "一般" },
  { key: "specific", label: "特定（19〜22歳）" },
  { key: "elderly", label: "老人（70歳以上）" },
  { key: "cohabitingParents", label: "同居老親等" },
];

const tipIds = { hasSpouse: useId(), spouseIsElderly: useId(), familyDisabilities: useId(), dependents: useId() };
const checkboxClass = "size-4 accent-[var(--accent)]";
</script>

<template>
  <RadioGroup
    v-model="singleStatus"
    label="寡婦・ひとり親"
    name="single_status"
    :options="SINGLE_STATUS_OPTIONS"
    :tip="FIELD_HELP.singleStatus"
  />
  <RadioGroup
    v-model="selfDisability"
    label="本人の障害"
    name="self_disability"
    :options="SELF_DISABILITY_OPTIONS"
    :tip="FIELD_HELP.selfDisability"
  />
  <p class="relative pt-2 text-xs text-ink-muted">
    配偶者・扶養親族の障害<InfoTip :id="tipIds.familyDisabilities" :text="FIELD_HELP.familyDisabilities" />
  </p>
  <NumberField
    v-for="field in FAMILY_DISABILITY_FIELDS"
    :key="field.key"
    v-model="familyDisabilities[field.key]"
    :label="field.label"
    unit="人"
    :name="`disability_${field.key}`"
    :min="0"
  />
  <label class="relative flex items-center gap-2 py-1.5 text-sm">
    <input
      v-model="hasSpouse"
      type="checkbox"
      name="has_spouse"
      :class="checkboxClass"
      :aria-describedby="tipIds.hasSpouse"
    />
    <span>配偶者あり<InfoTip :id="tipIds.hasSpouse" :text="FIELD_HELP.hasSpouse" /></span>
  </label>
  <template v-if="hasSpouse">
    <NumberField
      v-model="spouseSalary"
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
        name="spouse_elderly"
        :class="checkboxClass"
        :aria-describedby="tipIds.spouseIsElderly"
      />
      <span>配偶者が70歳以上<InfoTip :id="tipIds.spouseIsElderly" :text="FIELD_HELP.spouseIsElderly" /></span>
    </label>
  </template>
  <p class="relative pt-2 text-xs text-ink-muted">
    扶養親族（16歳以上）<InfoTip :id="tipIds.dependents" :text="FIELD_HELP.dependents" />
  </p>
  <NumberField
    v-for="field in DEPENDENT_FIELDS"
    :key="field.key"
    v-model="dependents[field.key]"
    :label="field.label"
    unit="人"
    :name="`dependent_${field.key}`"
    :min="0"
    :tip="FIELD_HELP[field.key]"
  />
</template>
