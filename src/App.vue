<script setup lang="ts">
import TaxSimulator from "./components/TaxSimulator.vue";
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <header class="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-rule-strong pb-3">
      <h1 class="text-2xl font-bold tracking-wide">税金シミュレーター</h1>
      <p class="text-sm text-ink-muted">会社員・令和8年分（2026年）</p>
    </header>
    <main class="mt-8">
      <TaxSimulator />
    </main>
    <footer class="mt-16 border-t border-rule pt-4 text-xs leading-relaxed text-ink-muted">
      <p>
        健康保険は協会けんぽの全国平均（9.9%）で計算した目安です。住民税は所得割のみで、均等割・調整控除は含みません。
      </p>
      <p class="mt-2">
        <a href="/furusato/" class="text-accent underline underline-offset-2"
          >ふるさと納税の上限計算（個人事業主向け）</a
        >
      </p>
    </footer>
  </div>
</template>
