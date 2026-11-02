<script setup lang="ts">
import { ref } from 'vue'
import { Upload, LoaderCircle } from '@lucide/vue'
import type { MediaItem } from '../../types/dashboard'
import { addLocalAsset } from '../../services/localRepository'
import { safeSource } from '../../lib/validation'
import MediaAsset from '../common/MediaAsset.vue'
const props = withDefaults(defineProps<{ value: MediaItem; label?: string; allowVideo?: boolean }>(),{ label: '素材',allowVideo: false })
const emit = defineEmits<{ update: [value: MediaItem] }>()
const fileInput = ref<HTMLInputElement | null>(null), loading = ref(false), error = ref('')
function patch(value: Partial<MediaItem>) { emit('update',{ ...props.value,...value }) }
async function upload(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]
  input.value = ''; if (!file) return
  error.value = ''; loading.value = true
  try { if (!props.allowVideo && file.type.startsWith('video/')) throw new Error('此处请选择图片'); const src = await addLocalAsset(file); emit('update',{ id: crypto.randomUUID(),src,alt: file.name,kind: file.type.startsWith('video/') ? 'video' : 'image',fit: 'contain' }) }
  catch (e) { error.value = (e as Error).message } finally { loading.value = false }
}
function setUrl(event: Event) { const src = (event.target as HTMLInputElement).value.trim(); if (!safeSource(src)) { error.value = '请输入有效的 HTTP 或 HTTPS 素材地址'; return }; error.value = ''; patch({ src,kind: 'image',fit: 'contain' }) }
</script>
<template>
  <div class="media-editor">
    <div class="media-preview"><MediaAsset :src="value.src" :alt="value.alt" :kind="value.kind" fit="contain" paused /></div>
    <input ref="fileInput" type="file" hidden :accept="allowVideo ? 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm' : 'image/png,image/jpeg,image/webp,image/gif'" :aria-label="`上传${label}`" @change="upload" />
    <button type="button" class="editor-button media-upload" :disabled="loading" @click="fileInput?.click()"><LoaderCircle v-if="loading" class="spin" :size="16" /><Upload v-else :size="16" />{{ loading ? '正在保存素材' : `更换${label}` }}</button>
    <p class="field-hint">图片 ≤ 6 MB<span v-if="allowVideo">，视频 ≤ 30 MB，默认静音播放</span></p>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <label class="field-label">素材说明<input :value="value.alt" maxlength="200" @input="patch({ alt: ($event.target as HTMLInputElement).value })" /></label>
    <label class="field-label">显示方式<select :value="value.fit ?? 'design'" @change="patch({ fit: ($event.target as HTMLSelectElement).value === 'design' ? undefined : ($event.target as HTMLSelectElement).value as 'cover' | 'contain' })"><option value="design">沿用默认裁切</option><option value="contain">完整显示</option><option value="cover">铺满并裁切</option></select></label>
    <details class="media-url"><summary>使用图片链接</summary><label class="field-label">图片地址<input type="url" placeholder="https://…" :value="value.src.startsWith('http') ? value.src : ''" @change="setUrl" /></label></details>
  </div>
</template>
<style scoped>
.media-preview { height: 138px; border: 1px solid #dce4df; border-radius: 8px; overflow: hidden; background: #dfe9f2; margin-bottom: 10px; }
.media-upload { width: 100%; justify-content: center; }
.media-url { font-size: 12px; color: #66796c; }
.media-url summary { cursor: pointer; margin: 10px 0; }
</style>
