<script setup lang="ts">
import { toJpNumber } from "../utils/tax";

export type BreakdownRow = { group?: string; label: string; valueYen: number; showSymbol?: boolean };

defineProps<{ rows: readonly BreakdownRow[] }>();
</script>

<template>
  <table class="clear">
    <tr v-for="row in rows" :key="row.label">
      <th>{{ row.group }}</th>
      <th>{{ row.label }}</th>
      <td :class="{ 'table-symbol': row.showSymbol }">{{ row.showSymbol ? "-" : "" }}</td>
      <td>{{ toJpNumber(row.valueYen) }}</td>
    </tr>
  </table>
</template>
