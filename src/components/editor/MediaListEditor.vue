<script setup lang="ts">
import { ref } from 'vue'
import { Plus, ChevronUp, ChevronDown, Trash2, LoaderCircle } from '@lucide/vue'
import type { MediaItem } from '../../types/dashboard'
import { addLocalAsset } from '../../services/localRepository'
import MediaEditor from './MediaEditor.vue'
const props = defineProps<{ items: MediaItem[] }>()
const emit = defineEmits<{ update: [items: MediaItem[]] }>()
const input = ref<HTMLInputElement | null>(null),error = ref(''),busy = ref(false)
function update(index: number,value: MediaItem) { emit('update',props.items.map((item,i) => i === index ? value : item)) }
function move(index: number,delta: number) { const items = [...props.items]; [items[index],items[index+delta]] = [items[index+delta]!,items[index]!]; emit('update',items) }
async function add(event: Event) {
  const element = event.target as HTMLInputElement,files = [...(element.files ?? [])]; element.value = ''
  if (props.items.length + files.length > 12) { error.value = '最多添加 12 份轮播素材'; return }
  busy.value = true; error.value = ''
  try { const additions: MediaItem[] = []; for (const file of files) additions.push({ id: crypto.randomUUID(),src: await addLocalAsset(file),alt: file.name,kind: file.type.startsWith('video/') ? 'video' : 'image',fit: 'contain' }); emit('update',[...props.items,...additions]) } catch (e) { error.value = (e as Error).message } finally { busy.value = false }
}
</script>
<template>
  <div class="media-list">
    <details v-for="(item,index) in items" :key="item.id" class="item-card" :open="items.length === 1">
      <summary>素材 {{ index+1 }} <span>{{ item.kind === 'video' ? '视频' : '图片' }}</span></summary>
      <MediaEditor :value="item" label="素材" allow-video @update="update(index,$event)" />
      <div class="row-actions"><button class="icon-button" :aria-label="`上移素材 ${index+1}`" :disabled="index === 0" @click="move(index,-1)"><ChevronUp :size="15" /></button><button class="icon-button" :aria-label="`下移素材 ${index+1}`" :disabled="index === items.length-1" @click="move(index,1)"><ChevronDown :size="15" /></button><button class="icon-button danger" :aria-label="`删除素材 ${index+1}`" :disabled="items.length <= 1" @click="emit('update',items.filter((_,i) => i !== index))"><Trash2 :size="15" /></button></div>
    </details>
    <input ref="input" hidden type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" aria-label="添加轮播素材" @change="add" />
    <button class="editor-button dashed-button" :disabled="busy || items.length >= 12" @click="input?.click()"><LoaderCircle v-if="busy" class="spin" :size="16" /><Plus v-else :size="16" />添加图片或视频</button>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped>
summary { display: flex; gap: 10px; }
summary span { margin-left: auto; color: #839188; font-size: 11px; }
.row-actions { margin-top: 10px; justify-content: flex-end; }
</style>
