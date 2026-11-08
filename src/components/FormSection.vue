<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <fieldset class="border-t border-rule-strong pt-2">
    <legend class="pr-2 text-xs font-bold tracking-[0.2em] text-ink-muted">{{ title }}</legend>
    <slot />
  </fieldset>
</template>
