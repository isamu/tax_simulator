<script setup lang="ts">
import { computed } from "vue";
import { DONUT_GEOMETRY, adjustedCircumference, donutSegments } from "../utils/donut";

const props = defineProps<{ values: readonly number[] }>();

const segments = computed(() => donutSegments(props.values));
const { cx, cy, radius, strokeWidth } = DONUT_GEOMETRY;
</script>

<template>
  <svg height="160" width="160" viewBox="0 0 160 160" class="donut-chart">
    <g v-for="(segment, index) in segments" :key="index">
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        :stroke="segment.color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="adjustedCircumference()"
        :stroke-dashoffset="segment.strokeDashOffset"
        fill="transparent"
        :transform="`rotate(${segment.rotateDeg}, ${cx}, ${cy})`"
      />
      <text v-if="segment.showLabel" text-anchor="middle" dy="3px" :x="segment.textX" :y="segment.textY">
        {{ segment.label }}
      </text>
    </g>
  </svg>
</template>

<style>
svg {
  height: 400px;
  width: 400px;
}
text {
  fill: #333;
  font-family: "Roboto", sans-serif;
  font-size: 0.75rem;
}
</style>
