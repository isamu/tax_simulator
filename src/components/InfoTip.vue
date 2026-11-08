<script setup lang="ts">
// The tooltip spans the nearest positioned ancestor (the field row) so it stays inside a narrow screen; min-w keeps short headings readable.
defineProps<{ id: string; text: string }>();
</script>

<template>
  <span class="group/tip">
    <button
      type="button"
      :aria-describedby="id"
      aria-label="この項目の説明"
      class="ml-1 inline-flex size-4 translate-y-[-1px] items-center justify-center rounded-full border border-ink-muted align-middle text-[10px] leading-none text-ink-muted hover:border-ink hover:text-ink focus:border-accent focus:text-accent focus:outline-none"
    >
      ?
    </button>
    <span
      :id="id"
      role="tooltip"
      class="invisible absolute top-full right-0 left-0 z-20 min-w-64 mt-1 border border-rule-strong bg-paper-raised p-2 text-xs leading-relaxed font-normal text-ink group-hover/tip:visible group-focus-within/tip:visible"
    >
      {{ text }}
    </span>
  </span>
</template>
