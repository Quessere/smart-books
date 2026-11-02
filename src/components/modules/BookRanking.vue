<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '../../composables/useElementSize'
import type { RankingItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
import DashboardChart from '../common/DashboardChart.vue'
const props = defineProps<{ title: string; unit: string; items: RankingItem[]; limit?: number }>()
const element = ref<HTMLElement | null>(null)
const { width,height } = useElementSize(element,642,496)
const visibleItems = computed(() => props.items.slice(0,Math.min(props.limit ?? 5,Math.max(1,Math.floor((height.value-116)/58)))))
const left = computed(() => Math.min(212,width.value*.33))
const description = computed(() => props.items.map(item => `${item.name}${item.value}册`).join('，'))
const option = computed(() => ({
  animation: false,
  textStyle: { fontFamily: 'Inter, Microsoft YaHei, sans-serif' },
  grid: { left: left.value, right: 51, top: 101, bottom: 25 },
  tooltip: { trigger: 'axis', renderMode: 'richText', axisPointer: { type: 'shadow' }, confine: true },
  xAxis: {
    type: 'value', min: 0, max: Math.max(100, Math.ceil(Math.max(...visibleItems.value.map(item => item.value), 0) / 20) * 20), splitNumber: 5,
    axisLabel: { fontSize: 12, color: '#86909c' },
    axisLine: { show: true, lineStyle: { color: '#c9cdd4' } },
    axisTick: { show: true, length: 4, lineStyle: { color: '#c9cdd4' } },
    splitLine: { show: true, lineStyle: { color: '#e5e6eb', type: 'dashed' } },
  },
  yAxis: {
    type: 'category', inverse: true, data: visibleItems.value.map(item => item.name),
    axisTick: { show: false }, axisLine: { show: false },
    axisLabel: { color: '#0f6103', fontSize: Math.max(16,Math.min(20,width.value/32)), margin: left.value-30, align: 'left', width: left.value-40, overflow: 'truncate' },
    splitArea: { show: true, areaStyle: { color: ['#ffffff', 'rgba(78,89,105,0.05)'] } },
  },
  series: [{ type: 'bar', name: props.unit, barMaxWidth: 55, barCategoryGap: '25%', itemStyle: { color: '#4d9649' }, data: visibleItems.value.map(item => item.value), label: { show: true, position: 'right', fontSize: 14, color: '#1d2129' } }],
}))
</script>

<template>
  <section ref="element" class="module book-ranking" data-module="book-ranking" :aria-label="title">
    <ModuleHeading class="heading" :title="title" />
    <span class="chart-unit">{{ unit }}</span>
    <DashboardChart v-if="items.length" :option="option" :label="description" />
    <p v-else class="empty-state">暂无排行数据</p>
  </section>
</template>

<style scoped>
.heading { position: absolute; top: 14px; left: 34px; right: 24px; z-index: 1; }
.chart-unit { position: absolute; right: 62px; top: 71px; color: var(--muted-green); font-size: clamp(18px,4cqw,24px); font-weight: 700; z-index: 1; }
</style>
