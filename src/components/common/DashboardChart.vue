<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, use, type EChartsCoreOption, type EChartsType } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])
const props = defineProps<{ option: EChartsCoreOption; label: string }>()
const element = ref<HTMLDivElement | null>(null)
let chart: EChartsType | undefined
let observer: ResizeObserver | undefined
let resizeFrame = 0
onMounted(() => {
  if (!element.value) return
  chart = init(element.value, undefined, { renderer: 'canvas' })
  chart.setOption(props.option)
  observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => {
      if (!chart || !element.value) return
      if (chart.getWidth() !== element.value.clientWidth || chart.getHeight() !== element.value.clientHeight) chart.resize()
    })
  })
  observer.observe(element.value)
})
watch(() => props.option, option => chart?.setOption(option, { notMerge: true }), { deep: true })
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(resizeFrame)
  chart?.dispose()
})
</script>

<template><div ref="element" class="chart" role="img" :aria-label="label" /></template>
