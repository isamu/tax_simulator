<script setup lang="ts">
import { formatYen } from "../utils/format";

export type LedgerRow = { label: string; valueYen: number; note?: string };

defineProps<{ title: string; rows: readonly LedgerRow[]; total?: LedgerRow }>();
</script>

<template>
  <table class="w-full self-start border-collapse text-sm">
    <caption class="border-b border-rule-strong pb-1 text-left text-xs font-bold tracking-[0.2em] text-ink-muted">
      {{
        title
      }}
    </caption>
    <tbody>
      <tr v-for="row in rows" :key="row.label" class="border-b border-rule">
        <th scope="row" class="py-1.5 pr-3 text-left font-normal">
          {{ row.label }}
          <span v-if="row.note" class="ml-1 text-xs text-ink-muted">{{ row.note }}</span>
        </th>
        <td class="py-1.5 text-right tabular-nums">{{ formatYen(row.valueYen) }}</td>
      </tr>
      <tr v-if="total" class="border-b-2 border-rule-strong font-bold">
        <th scope="row" class="py-1.5 pr-3 text-left">{{ total.label }}</th>
        <td class="py-1.5 text-right tabular-nums">{{ formatYen(total.valueYen) }}</td>
      </tr>
    </tbody>
  </table>
</template>
