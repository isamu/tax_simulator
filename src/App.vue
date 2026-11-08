<script setup lang="ts">
import TaxSimulator from "./components/TaxSimulator.vue";
</script>

<template>
  <h1>税金シミュレーター</h1>
  <TaxSimulator />
</template>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
table {
  margin: auto;
}
th {
  text-align: left;
}
td {
  text-align: right;
}
</style>
