<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { LockKeyhole, Pencil, Settings2, X } from '@lucide/vue'
import { getLayoutTemplate,layoutTemplates } from '../../data/layoutTemplates'
import { widgetDefinitions,definition } from '../../data/widgets'
import type { DashboardDocument,WidgetId } from '../../types/editor'
import WidgetIcon from './WidgetIcon.vue'
const props = defineProps<{ document: DashboardDocument; selected: WidgetId | 'global'; focusSlot?: number | null }>()
const emit = defineEmits<{ template: [id: string]; assign: [index: number,id: WidgetId | null]; select: [id: WidgetId | 'global']; free: []; close: [] }>()
const initialCount = props.document.layout.filter(item => item.visible).length
const element = ref<HTMLElement | null>(null),count = ref(initialCount >= 2 && initialCount <= 6 ? initialCount : 6)
const current = computed(() => props.document.composition ? getLayoutTemplate(props.document.composition.templateId) : undefined)
const candidates = computed(() => layoutTemplates.filter(template => template.count === count.value))
watch(() => current.value?.count,value => { if (value) count.value = value },{ immediate: true })
watch(() => props.focusSlot,async value => { if (value == null) return; await nextTick(); element.value?.querySelector<HTMLSelectElement>(`[data-slot-select="${value}"]`)?.focus() })
function chooseCount(value: number) { count.value = value; emit('template',layoutTemplates.find(template => template.count === value)!.id) }
function occupied(id: WidgetId,index: number) { const at = props.document.composition?.slots.indexOf(id) ?? -1; return at >= 0 && at !== index ? `（位置 ${at+1}，选择后交换）` : '' }
</script>
<template>
  <aside ref="element" class="module-library template-panel" aria-label="版式模板与组件">
    <div class="panel-title"><div><LockKeyhole :size="16" /><strong>模板排版</strong></div><button class="icon-button panel-close" aria-label="关闭模板面板" @click="emit('close')"><X :size="18" /></button></div>
    <div class="template-scroll">
      <section class="template-section"><h2>选择组件数量</h2><div class="template-counts" role="tablist" aria-label="模板组件数量"><button v-for="n in [2,3,4,5,6]" :key="n" role="tab" :aria-selected="count === n" :class="{ active: count === n }" @click="chooseCount(n)">{{ n }}<span class="sr-only"> 个组件</span></button></div></section>
      <section class="template-section"><div class="template-section-title"><h2>选择版式</h2><span>每种数量 3 套</span></div><div class="template-gallery"><button v-for="template in candidates" :key="template.id" class="template-card" :class="{ active: current?.id === template.id }" :aria-label="`应用${template.name}模板`" :aria-pressed="current?.id === template.id" :title="template.description" @click="emit('template',template.id)"><span class="template-mini" aria-hidden="true"><span class="mini-title">标题</span><span v-for="(slot,index) in template.slots" :key="index" class="mini-slot" :style="{ left: `${slot.x/25.6}%`,top: `${slot.y/14.4}%`,width: `${slot.w/25.6}%`,height: `${slot.h/14.4}%` }">{{ index+1 }}</span></span><strong>{{ template.name }}</strong></button></div><p class="template-description">{{ current ? current.description : '先选择版式，再为固定位置添加组件。' }}</p></section>
      <section v-if="current && document.composition" class="template-section"><div class="template-section-title"><h2>为每个位置选择组件</h2><span>{{ document.composition.slots.filter(Boolean).length }}/{{ current.count }}</span></div><div v-for="(slot,index) in current.slots" :key="index" class="template-slot-card" :class="{ active: document.composition.slots[index] && selected === document.composition.slots[index] }"><div class="slot-card-label"><span class="slot-number">{{ index+1 }}</span><span>{{ slot.name }}</span><button v-if="document.composition.slots[index]" class="slot-edit-button" :aria-label="`编辑位置 ${index+1} 的内容`" @click="emit('select',document.composition.slots[index]!)"><Pencil :size="12" />编辑</button></div><div class="slot-select-row"><WidgetIcon v-if="document.composition.slots[index]" :id="document.composition.slots[index]!" /><select :data-slot-select="index" :aria-label="`位置 ${index+1} 组件`" :value="document.composition.slots[index] ?? ''" @change="emit('assign',index,($event.target as HTMLSelectElement).value as WidgetId || null)"><option value="">留空，稍后添加组件</option><option v-for="widget in widgetDefinitions" :key="widget.id" :value="widget.id">{{ definition(widget.id).name }}{{ occupied(widget.id,index) }}</option></select></div></div><p class="template-help"><LockKeyhole :size="13" />位置和大小由模板固定。更换组件不改变版式，选择已占用的组件会交换位置。</p></section>
      <button class="global-settings template-global" @click="emit('select','global')"><Settings2 :size="17" /><span>全局设置<small>标题、主题与校标</small></span></button>
      <p class="template-preserve">切换模板保留内容，仅更新展示组件和版位。</p>
    </div>
    <button class="presentation-link template-free" @click="emit('free')"><Pencil :size="14" />转为自由布局</button>
  </aside>
</template>
