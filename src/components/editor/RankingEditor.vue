<script setup lang="ts">
import { Plus, Trash2, ChevronUp, ChevronDown } from '@lucide/vue'
import type { RankingItem } from '../../types/dashboard'
const props = defineProps<{ items: RankingItem[]; label: string; colors?: boolean }>()
const createId = () => crypto.randomUUID()
const emit = defineEmits<{ update: [items: RankingItem[]] }>()
function patch(index: number,value: Partial<RankingItem>) { emit('update',props.items.map((item,i) => i === index ? { ...item,...value } : item)) }
function move(index: number,delta: number) { const items = [...props.items]; [items[index],items[index+delta]] = [items[index+delta]!,items[index]!]; emit('update',items) }
</script>
<template>
  <div class="ranking-editor">
    <div v-for="(item,index) in items" :key="item.id" class="item-card">
      <div class="item-caption"><span>{{ label }} {{ index+1 }}</span><div class="row-actions"><button class="icon-button" :aria-label="`上移${label} ${index+1}`" :disabled="index === 0" @click="move(index,-1)"><ChevronUp :size="14" /></button><button class="icon-button" :aria-label="`下移${label} ${index+1}`" :disabled="index === items.length-1" @click="move(index,1)"><ChevronDown :size="14" /></button><button class="icon-button danger" :aria-label="`删除${label} ${index+1}`" @click="emit('update',items.filter((_,i) => i !== index))"><Trash2 :size="14" /></button></div></div>
      <label class="field-label">{{ label }}名称 {{ index+1 }}<input :value="item.name" maxlength="100" @input="patch(index,{ name: ($event.target as HTMLInputElement).value })" /></label>
      <div class="field-row"><label class="field-label">数值 {{ index+1 }}<input type="number" min="0" max="1000000000000" :value="item.value" @input="patch(index,{ value: Math.max(0,Math.min(1e12,Number(($event.target as HTMLInputElement).value)||0)) })" /></label><label v-if="colors" class="field-label color-field">颜色 {{ index+1 }}<input type="color" :value="item.color ?? '#4d9649'" @input="patch(index,{ color: ($event.target as HTMLInputElement).value })" /></label></div>
    </div>
    <button class="editor-button dashed-button" :disabled="items.length >= 30" @click="emit('update',[...items,{ id: createId(),name: `新${label}`,value: 0,...(colors ? { color: '#4d9649' } : {}) }])"><Plus :size="16" />添加{{ label }}</button>
  </div>
</template>
