<script setup lang="ts">
import { computed,ref } from 'vue'
import type { MediaItem,NewBookItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
import MediaAsset from '../common/MediaAsset.vue'
import { useElementSize } from '../../composables/useElementSize'
import { useRotatingIndex } from '../../composables/useRotatingIndex'
const props = defineProps<{ title: string; image: MediaItem; mode?: 'image' | 'list'; items?: NewBookItem[]; paused?: boolean }>()
const element = ref<HTMLElement | null>(null)
const { width,height } = useElementSize(element,688,516)
const perPage = computed(() => Math.max(1,Math.floor((height.value-110)/78)))
const pageCount = computed(() => Math.ceil((props.items?.length ?? 0)/perPage.value))
const { index } = useRotatingIndex(() => pageCount.value,() => 10,() => Boolean(props.paused))
const page = computed(() => props.items?.slice(index.value*perPage.value,(index.value+1)*perPage.value) ?? [])
const original = computed(() => !props.image.fit && props.image.src === '/assets/figma/new-books.png')
const frame = computed(() => {
  if (!original.value) return undefined
  const availableW = width.value-27,availableH = height.value-123,w = Math.min(availableW,availableH*450/202)
  return { left: `${(availableW-w)/2}px`,top: `${(availableH-w*202/450)/2}px`,width: `${w}px`,height: `${w*202/450}px`,right: 'auto',bottom: 'auto' }
})
const crop = computed(() => original.value ? { position: 'absolute' as const,left: '0',top: '-53.9604%',width: '100%',height: '153.9604%' } : undefined)
</script>

<template>
  <section ref="element" class="module new-books" data-module="new-books" :aria-label="title">
    <ModuleHeading class="heading" :title="title" short />
    <figure v-if="mode !== 'list'" class="new-books-image"><div class="book-media-frame" :style="frame"><MediaAsset :src="image.src" :alt="image.alt" :kind="image.kind" :fit="image.fit ?? 'contain'" :style="crop" /></div></figure>
    <ol v-else-if="page.length" class="book-list" :start="index*perPage+1"><li v-for="book in page" :key="book.id"><p class="book-title">{{ book.title }} <span>{{ book.callNumber }}</span></p><p class="book-detail">{{ book.author }}　{{ book.publisher }}　{{ book.date }}</p></li></ol>
    <p v-else class="empty-state">暂无新书信息</p>
    <span v-if="mode === 'list' && pageCount > 1" class="page-count">{{ index+1 }} / {{ pageCount }}</span>
  </section>
</template>

<style scoped>
.heading { position: absolute; left: 16px; top: 1px; right: 24px; }
.new-books-image { position: absolute; left: 15px; right: 12px; top: 95px; bottom: 28px; overflow: hidden; }
.book-media-frame { position: absolute; inset: 0; overflow: hidden; }
.book-list { position: absolute; left: 20px; right: 22px; top: 86px; bottom: 25px; margin: 0; padding: 0 0 0 30px; overflow: hidden; }
.book-list li { min-height: 78px; padding: 12px 2px; border-bottom: 1px dashed #d8e1dc; color: #34517a; font-size: clamp(16px,2.6cqw,19px); }
.book-title { color: #25619d; font-weight: 700; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.book-title span { color: #6b746d; font-weight: 400; }
.book-detail { margin-top: 9px; color: #68756c; font-size: clamp(14px,2.2cqw,16px); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.page-count { position: absolute; bottom: 5px; right: 20px; font-size: 16px; color: #73867b; }
</style>
