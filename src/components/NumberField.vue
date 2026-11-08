<script setup lang="ts">
import { useId } from "vue";
import InfoTip from "./InfoTip.vue";

defineProps<{
  label: string;
  unit: string;
  name: string;
  min?: number;
  placeholder?: string;
  hint?: string;
  tip?: string;
}>();

// v-model on a number input yields "" while the field is empty.
const model = defineModel<number | "">({ required: true });
const tipId = useId();
</script>

<template>
  <label class="relative flex items-baseline justify-between gap-3 py-1.5 text-sm">
    <span>
      {{ label }}<InfoTip v-if="tip" :id="tipId" :text="tip" />
      <small v-if="hint" class="block text-xs text-ink-muted">{{ hint }}</small>
    </span>
    <span class="flex items-baseline gap-1">
      <input
        v-model="model"
        :name="name"
        :min="min"
        :placeholder="placeholder"
        :aria-describedby="tip ? tipId : undefined"
        type="number"
        class="w-32 border border-rule bg-paper-raised px-2 py-1 text-right tabular-nums placeholder:text-xs placeholder:text-ink-muted focus:border-accent focus:outline-none"
      />
      <span class="w-4 text-xs text-ink-muted">{{ unit }}</span>
    </span>
  </label>
</template>
