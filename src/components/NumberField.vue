<script setup lang="ts">
defineProps<{ label: string; unit: string; name: string; min?: number }>();

// v-model on a number input yields "" while the field is empty.
const model = defineModel<number | "">({ required: true });
</script>

<template>
  <label class="flex items-baseline justify-between gap-3 py-1.5 text-sm">
    <span>{{ label }}</span>
    <span class="flex items-baseline gap-1">
      <input
        v-model="model"
        :name="name"
        :min="min"
        type="number"
        class="w-32 border border-rule bg-paper-raised px-2 py-1 text-right tabular-nums focus:border-accent focus:outline-none"
      />
      <span class="w-4 text-xs text-ink-muted">{{ unit }}</span>
    </span>
  </label>
</template>
