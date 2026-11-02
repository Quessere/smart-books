<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '../../composables/useElementSize'
import type { RankingItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
import DashboardChart from '../common/DashboardChart.vue'
const props = defineProps<{ title: string; unit: string; items: RankingItem[]; limit?: number }>()
const element = ref<HTMLElement | null>(null)
const { width,height } = useElementSize(element,642,300)
const visibleItems = computed(() => props.items.slice(0,Math.min(props.limit ?? 6,Math.max(2,Math.floor(width.value/85)))))
const description = computed(() => props.items.map(item => `${item.name}${item.value}册`).join('，'))
const option = computed(() => ({
  animation: false,
  textStyle: { fontFamily: 'Inter, Microsoft YaHei, sans-serif' },
  grid: { left: Math.min(188,width.value*.293), right: Math.min(199,width.value*.31), top: 90, bottom: 24 },
  tooltip: { trigger: 'axis', renderMode: 'richText', confine: true, axisPointer: { type: 'shadow' } },
  xAxis: { type: 'category', data: visibleItems.value.map(item => item.name), axisLabel: { color: '#54555a', fontSize: 14, margin: 6, overflow: 'truncate', width: 75 }, axisLine: { lineStyle: { color: '#54555a', width: 1 } }, axisTick: { show: false } },
  yAxis: { type: 'value', show: false, max: Math.max(20, ...props.items.map(item => item.value)) },
  series: [{ type: 'bar', name: props.unit, barMaxWidth: Math.min(64,height.value*.173), label: { show: true, position: 'top', distance: 4, color: '#333', fontSize: 14 }, data: visibleItems.value.map(item => ({ value: item.value, itemStyle: { color: item.color, borderRadius: [26, 26, 26, 26] } })) }],
}))
</script>

<template>
  <section ref="element" class="module reader-ranking" data-module="reader-ranking" :aria-label="title">
    <ModuleHeading class="heading" :title="title" />
    <span class="chart-unit">{{ unit }}</span>
    <div class="reader-chart"><DashboardChart v-if="items.length" :option="option" :label="description" /><p v-else class="empty-state">暂无排行数据</p></div>
  </section>
</template>

<style scoped>
.heading { position: absolute; top: 13px; left: 34px; right: 24px; z-index: 1; }
.chart-unit { position: absolute; right: 12%; top: 82px; z-index: 1; font-size: clamp(18px,4cqw,24px); font-weight: 700; color: var(--muted-green); }
.reader-chart { position: absolute; inset: 0; }
</style>
