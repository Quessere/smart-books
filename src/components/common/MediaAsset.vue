<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { ImageOff } from '@lucide/vue'
import { getLocalAsset } from '../../services/localRepository'
import { publicAssetUrl } from '../../lib/publicAsset'
const props = withDefaults(defineProps<{ src: string; alt?: string; kind?: 'image' | 'video'; fit?: 'cover' | 'contain'; paused?: boolean }>(),{ alt: '', kind: 'image', fit: 'cover', paused: false })
const url = ref(''), failed = ref(false), video = ref<HTMLVideoElement | null>(null)
let objectUrl = '', generation = 0
watch(() => props.src, async src => {
  const current = ++generation
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''; failed.value = false; url.value = ''
  if (!src.startsWith('local-media:')) { url.value = publicAssetUrl(src, import.meta.env.BASE_URL); return }
  try { const asset = await getLocalAsset(src); if (current !== generation) return; if (!asset) throw new Error(); url.value = objectUrl = URL.createObjectURL(asset.blob) } catch { if (current === generation) failed.value = true }
},{ immediate: true })
watch(() => props.paused, paused => { if (paused) video.value?.pause(); else video.value?.play().catch(() => {}) })
onBeforeUnmount(() => { generation++; if (objectUrl) URL.revokeObjectURL(objectUrl) })
</script>
<template>
  <div v-if="failed" class="media-error" role="img" :aria-label="alt || '素材暂时无法显示'"><ImageOff :size="30" /><span>素材暂时无法显示</span></div>
  <video v-else-if="url && kind === 'video'" ref="video" :src="url" :aria-label="alt" :autoplay="!paused" muted loop playsinline :style="{ objectFit: fit }" @error="failed = true" />
  <img v-else-if="url" :src="url" :alt="alt" :style="{ objectFit: fit }" @error="failed = true" />
  <div v-else class="media-error" aria-label="正在加载素材"><span>正在加载素材</span></div>
</template>
<style scoped>
img,video { display: block; width: 100%; height: 100%; }
.media-error { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; color: #71817a; background: #f0f5f2; font-size: 16px; }
</style>
