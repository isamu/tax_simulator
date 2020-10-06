//https://css-tricks.com/building-a-donut-chart-with-vue-and-svg/

<template>
<svg height="160" width="160" viewBox="0 0 160 160" class="donut-chart">
  <g v-for="(value, index) in sortedValues" :key="value">
    <circle :cx="cx" :cy="cy" :r="radius" :stroke="colors[index]" :stroke-width="strokeWidth" :stroke-dasharray="adjustedCircumference" :stroke-dashoffset="calculateStrokeDashOffset(value, circumference)" fill="transparent" :transform="returnCircleTransformValue(index)" />
    <text v-if="segmentBigEnough(value)" text-anchor="middle" dy="3px" :x="chartData[index].textX" :y="chartData[index].textY">{{ percentageString(value, index) }}</text>
  </g>
</svg>
</template>

<script>

export default {
  
  name: 'donutTemplate',
  props: ["initialValues"],
  data() {
    return {
      angleOffset: -90,
      chartData: [],
      colors: ["#6495ED", "goldenrod", "#cd5c5c", "thistle", "lightgray", "#aaDDaa", "#FF8C00", "#444444"],
      cx: 80,
      cy: 80,           
      radius: 60,
      sortedValues: [],
      strokeWidth: 30,
    }
  },
  computed: {
    // adjust the circumference to add small white gaps
    adjustedCircumference() {
      return this.circumference - 2
    },
    circumference() {
      return 2 * Math.PI * this.radius
    },
    dataTotal() {
      return this.sortedValues.reduce((acc, val) => acc + val)
    },
  },
  watch: {
    'initialValues' () {
      this.updateData();
    }
  },
  methods: {
    calculateChartData() {
      this.sortedValues.forEach((dataVal) => {
        const { x, y } = this.calculateTextCoords(dataVal, this.angleOffset)
        // start at -90deg so that the largest segment is perpendicular to top
        const data = {
          degrees: this.angleOffset,
          textX: x,
          textY: y
        }
        this.chartData.push(data)
        this.angleOffset = this.dataPercentage(dataVal) * 360 + this.angleOffset        
      })
    },
    sortInitialValues() {
      return this.sortedValues = this.initialValues.concat();  
    },
    calculateStrokeDashOffset(dataVal, circumference) {
      const strokeDiff = this.dataPercentage(dataVal) * circumference      
      return circumference - strokeDiff
    },
    calculateTextCoords(dataVal, angleOffset) {
      // t must be radians
      // x(t) = r cos(t) + j
      // y(t) = r sin(t) + j
      
      const angle = (this.dataPercentage(dataVal) * 360) / 2 + angleOffset      
      const radians = this.degreesToRadians(angle)
      
      const textCoords = {
        x: this.radius * Math.cos(radians) + this.cx,
        y: this.radius * Math.sin(radians) + this.cy
      }
      return textCoords
    },
    degreesToRadians(angle) {
      return angle * (Math.PI / 180)
    },
    dataPercentage(dataVal) {
      return dataVal / this.dataTotal
    },
    percentageString(dataVal, index) {
      return `(${index + 1}) ${Math.round(this.dataPercentage(dataVal) * 100)}%`
    },
    returnCircleTransformValue(index) {
      return `rotate(${this.chartData[index].degrees}, ${this.cx}, ${this.cy})`
    },
    segmentBigEnough(dataVal) {
      return Math.round(this.dataPercentage(dataVal) * 100) > 5
    },
    updateData() {
      this.angleOffset = -90;
      this.sortedValues = [];
      this.chartData = [];
      this.sortInitialValues()
      this.calculateChartData()
    },
  },
  mounted() {
    this.updateData();
  },
}
</script>

<style>
  svg {
      height: 400px;
      width: 400px;
  }
  text {
      fill: #333;
      font-family: "Roboto", sans-serif;
      font-size: .75rem;
  }
</style>
