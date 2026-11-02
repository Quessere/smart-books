<script setup lang="ts">
import { computed,ref } from 'vue'
import type { MediaItem } from '../../types/dashboard'
import MediaAsset from './MediaAsset.vue'
import { useRotatingIndex } from '../../composables/useRotatingIndex'
import { useElementSize } from '../../composables/useElementSize'
const props = withDefaults(defineProps<{ image: MediaItem; slides?: MediaItem[]; interval?: number; paused?: boolean; original?: 'campus' | 'activity' }>(),{ interval: 8, paused: false })
const items = computed(() => props.slides?.length ? props.slides : [props.image])
const { index,go } = useRotatingIndex(() => items.value.length,() => props.interval,() => props.paused)
const current = computed(() => items.value[index.value] ?? props.image)
const element = ref<HTMLElement | null>(null)
const { width,height } = useElementSize(element,527,382)
const posterFrame = computed(() => {
  if (current.value.fit || props.original !== 'activity' || current.value.src !== '/assets/figma/reading-activity.png') return undefined
  const w = Math.min(width.value,height.value*432/312),h = w*312/432
  return { left: `${(width.value-w)/2}px`,top: `${(height.value-h)/2}px`,width: `${w}px`,height: `${h}px`,right: 'auto',bottom: 'auto' }
})
const crop = computed(() => {
  if (current.value.fit) return undefined
  if (props.original === 'campus' && current.value.src === '/assets/figma/campus-spring.png') return { position: 'absolute' as const, left: '-1.47%', top: '-13.095%', width: '102.006%', height: '126.031%', transform: 'rotate(.26deg)' }
  if (props.original === 'activity' && current.value.src === '/assets/figma/reading-activity.png') {
    // The supplied screenshot has a transparent 112 px header. Fit its real
    // 432 × 312 poster into any fixed slot without stretching or clipping copy.
    const w = Math.min(width.value,height.value*432/312)
    return { position: 'absolute' as const,left: '0',top: `${-w*112/432}px`,width: `${w}px`,height: `${w*424/432}px` }
  }
  return undefined
})
</script>
<template>
  <div ref="element" class="media-slideshow" @keydown.left.prevent="go(index-1)" @keydown.right.prevent="go(index+1)">
    <div class="media-content" :style="posterFrame"><MediaAsset :key="current.src" :src="current.src" :alt="current.alt" :kind="current.kind" :fit="current.fit" :paused="paused" :style="crop" /></div>
    <div v-if="items.length > 1" class="slideshow-dots" aria-label="轮播素材"><button v-for="(item,i) in items" :key="item.id" :aria-label="`显示第 ${i+1} 张素材`" :aria-pressed="index === i" :class="{ active: index === i }" @click="go(i)" /></div>
  </div>
</template>
<style scoped>
.media-slideshow { position: relative; width: 100%; height: 100%; overflow: hidden; }
.media-content { position: absolute; inset: 0; overflow: hidden; }
.slideshow-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px 12px; border-radius: 24px; background: #0004; }
.slideshow-dots button { width: 12px; height: 12px; padding: 0; border: 0; border-radius: 50%; background: #ffffff80; cursor: pointer; }
.slideshow-dots button.active { background: white; }
.slideshow-dots button:focus-visible { outline: 3px solid #19794c; outline-offset: 3px; }
</style>
