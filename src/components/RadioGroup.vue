<script setup lang="ts" generic="T extends string">
import { useId } from "vue";
import InfoTip from "./InfoTip.vue";

defineProps<{ label: string; name: string; options: { value: T; label: string }[]; tip?: string }>();

const model = defineModel<T>({ required: true });
const tipId = useId();
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :aria-describedby="tip ? tipId : undefined"
    class="relative py-1.5 text-sm"
  >
    <span>{{ label }}<InfoTip v-if="tip" :id="tipId" :text="tip" /></span>
    <span class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
      <label v-for="option in options" :key="option.value" class="flex items-center gap-1.5">
        <input v-model="model" type="radio" :name="name" :value="option.value" class="size-4 accent-[var(--accent)]" />
        {{ option.label }}
      </label>
    </span>
  </div>
</template>
