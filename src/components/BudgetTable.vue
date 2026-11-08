<script setup lang="ts">
import { computed } from "vue";
import { shareOfLargest } from "../utils/stack";
import { formatYen } from "../utils/format";

const props = defineProps<{ labels: readonly string[]; valuesYen: readonly number[] }>();

const barShares = computed(() => shareOfLargest(props.valuesYen));
</script>

<template>
  <table class="w-full border-collapse text-sm">
    <tbody>
      <tr v-for="(label, index) in labels" :key="label" class="border-b border-rule">
        <th scope="row" class="w-40 py-1.5 pr-3 text-left font-normal whitespace-nowrap">{{ label }}</th>
        <td class="py-1.5" aria-hidden="true">
          <div class="h-3 rounded-r-[4px] bg-series-1" :style="{ width: `${barShares[index] * 100}%` }" />
        </td>
        <td class="w-24 py-1.5 pl-3 text-right tabular-nums">{{ formatYen(valuesYen[index]) }}</td>
      </tr>
    </tbody>
  </table>
</template>
