<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '../../composables/useElementSize'
import type { RankingItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
import DashboardChart from '../common/DashboardChart.vue'
import 'echarts-wordcloud'
const props = defineProps<{ title: string; items: RankingItem[]; limit?: number }>()
const element = ref<HTMLElement | null>(null)
const { width,height } = useElementSize(element,523,499)
const visibleItems = computed(() => [...props.items].filter(item => item.value > 0 && item.name.trim()).sort((a,b) => b.value-a.value).slice(0,props.limit ?? 24))
const total = computed(() => visibleItems.value.length)
const description = computed(() => visibleItems.value.map(item => `${item.name}，热度${item.value}`).join('；'))
const palette = ['#31590b','#16499a','#0b7f92','#7138a4','#892811','#b46013','#118d83','#a32b64']
const option = computed(() => ({
  animation: false,
  textStyle: { fontFamily: 'Inter, Microsoft YaHei, sans-serif' },
  tooltip: { trigger: 'item', confine: true, renderMode: 'richText', formatter: '{b}：{c}' },
  series: [{
    type: 'wordCloud', shape: 'circle', left: 16, top: Math.min(100,height.value*.23), right: 16, bottom: 20,
    width: width.value-32, height: Math.max(100,height.value-Math.min(100,height.value*.23)-20),
    sizeRange: [Math.max(16,Math.min(width.value,height.value)*.04),Math.min(width.value*.145,(height.value-110)*.2,88)],
    rotationRange: [0,0], rotationStep: 90, gridSize: 5, drawOutOfBound: false,
    shrinkToFit: true, layoutAnimation: false,
    textStyle: { fontFamily: 'Microsoft YaHei, sans-serif', fontWeight: 500 },
    emphasis: { focus: 'self', textStyle: { fontWeight: 700 } },
    data: visibleItems.value.map((item,index) => ({ name: item.name, value: item.value, textStyle: { color: item.color ?? palette[index % palette.length] } })),
  }],
}))
</script>

<template>
  <section ref="element" class="module search-ranking" data-module="search-ranking" :aria-label="title">
    <div class="search-chart"><DashboardChart v-if="total > 0" :key="`${Math.round(width)}-${Math.round(height)}`" :option="option" :label="description" /><p v-else class="empty-state">暂无检索数据</p></div>
    <ModuleHeading class="heading" :title="title" short />
  </section>
</template>

<style scoped>
.heading { position: absolute; left: 11px; top: 10px; right: 24px; z-index: 1; }
.search-chart { position: absolute; inset: 0; }
</style>
