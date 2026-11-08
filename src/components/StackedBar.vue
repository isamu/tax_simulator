<script setup lang="ts">
import { computed } from "vue";
import { type StackItem, stackSegments } from "../utils/stack";
import { formatPercent, formatYen } from "../utils/format";

const props = defineProps<{ items: readonly StackItem[]; colors: Record<string, string> }>();

const segments = computed(() => stackSegments(props.items));
</script>

<template>
  <div>
    <div
      class="flex h-6 gap-[2px]"
      role="img"
      :aria-label="segments.map((s) => `${s.label} ${formatPercent(s.share)}`).join('、')"
    >
      <div
        v-for="segment in segments"
        :key="segment.key"
        :class="[colors[segment.key], 'h-full last:rounded-r-[4px]']"
        :style="{ width: `${segment.share * 100}%` }"
        :title="`${segment.label} ${formatYen(segment.valueYen)}円（${formatPercent(segment.share)}）`"
      />
    </div>
    <ul class="mt-3 grid gap-1 text-sm sm:grid-cols-3">
      <li v-for="item in items" :key="item.key" class="flex items-baseline gap-2">
        <span :class="[colors[item.key], 'inline-block size-2.5 shrink-0 translate-y-[1px]']" />
        <span>{{ item.label }}</span>
        <span class="ml-auto tabular-nums sm:ml-0">{{ formatYen(item.valueYen) }}</span>
        <span class="text-xs text-ink-muted tabular-nums">
          {{ formatPercent(segments.find((s) => s.key === item.key)?.share ?? 0) }}
        </span>
      </li>
    </ul>
  </div>
</template>
