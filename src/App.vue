<template>
  <div id="app">
    <h1>税金シミュレーター</h1>
    <Tax />
  </div>
</template>

<script>
import Tax from './components/Tax.vue'

export default {
  name: 'app',
  components: {
    Tax
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
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
