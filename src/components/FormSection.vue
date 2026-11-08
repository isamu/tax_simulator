<script setup lang="ts">
import { useId } from "vue";
import InfoTip from "./InfoTip.vue";

defineProps<{ title: string; tip?: string }>();

const tipId = useId();
</script>

<template>
  <fieldset class="border-t border-rule-strong pt-2" :aria-describedby="tip ? tipId : undefined">
    <legend class="relative pr-2 text-xs font-bold tracking-[0.2em] text-ink-muted">
      {{ title }}<InfoTip v-if="tip" :id="tipId" :text="tip" />
    </legend>
    <slot />
  </fieldset>
</template>
