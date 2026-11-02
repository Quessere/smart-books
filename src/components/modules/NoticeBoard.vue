<script setup lang="ts">
import { computed,ref } from 'vue'
import type { MediaItem, NoticeItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
import MediaAsset from '../common/MediaAsset.vue'
import { useElementSize } from '../../composables/useElementSize'
import { useRotatingIndex } from '../../composables/useRotatingIndex'
const props = withDefaults(defineProps<{ title: string; background: MediaItem; items: NoticeItem[]; interval?: number; fontSize?: number; paused?: boolean }>(),{ interval: 12,fontSize: 40,paused: false })
const element = ref<HTMLElement | null>(null)
const { width,height } = useElementSize(element,688,672)
const font = computed(() => Math.min(props.fontSize,Math.max(22,width.value*.058)))
const top = computed(() => Math.min(145,Math.max(95,height.value*.216)))
const pages = computed(() => {
  const columns = Math.max(8,Math.floor((width.value-82)/(font.value*1.11)))
  const lines = Math.max(2,Math.floor((height.value-top.value-28)/(font.value*1.22)))
  const capacity = columns*lines
  const result: NoticeItem[][] = []; let current: NoticeItem[] = [],used = 0
  for (const item of props.items.filter(item => item.content.trim())) {
    const chars = Array.from(item.content)
    for (let offset=0;offset<chars.length;offset+=capacity) {
      const content = chars.slice(offset,offset+capacity).join(''), cost = Math.ceil(Array.from(content).length/columns)*columns+columns*.15
      if (current.length && used+cost>capacity) { result.push(current); current=[]; used=0 }
      current.push({ id: `${item.id}-${offset}`,content }); used+=cost
    }
  }
  if (current.length) result.push(current)
  return result
})
const { index } = useRotatingIndex(() => pages.value.length,() => props.interval,() => props.paused)
</script>

<template>
  <section ref="element" class="module notice-board" data-module="notices" :aria-label="title">
    <MediaAsset :src="background.src" :fit="background.fit ?? 'cover'" alt="" class="notice-background" />
    <ModuleHeading class="heading" :title="title" short />
    <ul v-if="pages.length" class="notices" :style="{ fontSize: `${font}px`, top: `${top}px` }"><li v-for="item in pages[index]" :key="item.id">{{ item.content }}</li></ul>
    <p v-else class="empty-state">暂无通知</p>
    <span v-if="pages.length > 1" class="page-count">{{ index+1 }} / {{ pages.length }}</span>
  </section>
</template>

<style scoped>
.notice-background { position: absolute; left: -3.34%; top: 0; width: 106.68%; height: 102.53%; border-radius: 45px; object-fit: cover; opacity: .61; }
.heading { position: absolute; top: 36px; left: 27px; right: 24px; }
.notices { position: absolute; left: 0; right: 21px; margin: 0; padding: 0 0 0 60px; color: #000; font-family: var(--font-chinese); font-weight: 600; line-height: 1.22; letter-spacing: .11em; text-decoration: underline; text-underline-offset: 4px; }
.notices li { padding-left: 0; margin-bottom: 6px; overflow-wrap: anywhere; }
.notices li::marker { font-size: .85em; }
.page-count { position: absolute; bottom: 8px; right: 20px; font-size: 16px; color: #456250; background: #ffffffb0; padding: 2px 8px; border-radius: 10px; }
</style>
