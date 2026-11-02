<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { GripHorizontal, EyeOff, Pencil } from '@lucide/vue'
import { definition } from '../../data/widgets'
import type { Rect, WidgetId, WidgetLayout } from '../../types/editor'
const props = defineProps<{ item: WidgetLayout; editing: boolean; selected: boolean; rejected?: boolean; locked?: boolean }>()
const emit = defineEmits<{ select: [id: WidgetId]; toggle: [id: WidgetId]; rect: [id: WidgetId, rect: Rect, done: boolean, cancel?: boolean] }>()
const style = computed(() => ({ left: `${props.item.x}px`, top: `${props.item.y}px`, width: `${props.item.w}px`, height: `${props.item.h}px` }))
let cleanup: (() => void) | undefined
function start(event: PointerEvent, kind: 'move' | 'resize') {
  if (!props.editing || props.locked || event.button !== 0) return
  event.preventDefault(); event.stopPropagation(); emit('select',props.item.id)
  cleanup?.()
  const target = event.currentTarget as HTMLElement, origin = { ...props.item }, x = event.clientX, y = event.clientY
  const scale = target.closest('.dashboard-canvas')!.getBoundingClientRect().width / 2560
  let latest: Rect = origin
  let moved = false
  target.setPointerCapture(event.pointerId)
  const move = (e: PointerEvent) => { if (e.pointerId !== event.pointerId) return; const dx = (e.clientX-x)/scale, dy = (e.clientY-y)/scale; if (Math.abs(dx)+Math.abs(dy)<3 && !moved) return; moved = true; latest = kind === 'move' ? { ...origin, x: origin.x+dx, y: origin.y+dy } : { ...origin, w: origin.w+dx, h: origin.h+dy }; emit('rect',origin.id,latest,false) }
  const end = (e: PointerEvent) => { if (e.pointerId !== event.pointerId) return; if (moved) emit('rect',origin.id,latest,true,e.type==='pointercancel'); cleanup?.() }
  target.addEventListener('pointermove',move); target.addEventListener('pointerup',end); target.addEventListener('pointercancel',end)
  cleanup = () => { target.removeEventListener('pointermove',move); target.removeEventListener('pointerup',end); target.removeEventListener('pointercancel',end); if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId); cleanup = undefined }
}
function keyboard(event: KeyboardEvent) {
  if (!props.editing || props.locked || event.target !== event.currentTarget || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return
  event.preventDefault(); event.stopPropagation(); emit('select',props.item.id)
  const step = event.shiftKey ? 32 : 8, rect = { ...props.item }
  const horizontal = ['ArrowLeft','ArrowRight'].includes(event.key), delta = ['ArrowLeft','ArrowUp'].includes(event.key) ? -step : step
  if (event.altKey) { if (horizontal) rect.w += delta; else rect.h += delta } else { if (horizontal) rect.x += delta; else rect.y += delta }
  emit('rect',props.item.id,rect,true)
}
onBeforeUnmount(() => cleanup?.())
</script>
<template>
  <div class="dashboard-widget" :class="{ 'widget-editing': editing, 'widget-selected': editing && selected, 'widget-rejected': editing && selected && rejected }" :style="style" :data-widget="item.id" :tabindex="editing ? 0 : undefined" :aria-label="editing ? `${definition(item.id).name}，${locked ? '点击编辑内容，位置由模板固定' : '方向键移动，Alt 加方向键缩放'}` : undefined" @click="editing && emit('select',item.id)" @keydown="keyboard">
    <slot />
    <template v-if="editing">
      <div class="widget-controls">
        <button v-if="locked" class="widget-grip widget-content-button" type="button" :aria-label="`编辑${definition(item.id).name}内容`" @click="emit('select',item.id)"><Pencil :size="23" /><span>{{ definition(item.id).name }}</span></button>
        <button v-else class="widget-grip" type="button" :aria-label="`拖动${definition(item.id).name}`" @pointerdown="start($event,'move')"><GripHorizontal :size="26" /><span>{{ definition(item.id).name }}</span></button>
        <button type="button" class="widget-hide" :aria-label="`隐藏${definition(item.id).name}`" @click.stop="emit('toggle',item.id)"><EyeOff :size="24" /></button>
      </div>
      <button v-if="!locked" type="button" class="widget-resize" :aria-label="`缩放${definition(item.id).name}`" @pointerdown="start($event,'resize')"><span /></button>
      <span v-if="selected && !locked" class="widget-dimensions">{{ Math.round(item.w) }} × {{ Math.round(item.h) }}</span>
    </template>
  </div>
</template>
<style scoped>
.dashboard-widget { position: absolute; min-width: 0; min-height: 0; }
.dashboard-widget :deep(.module) { width: 100%; height: 100%; container-type: size; }
.widget-editing { outline: 2px dashed #5c937699; outline-offset: -2px; cursor: pointer; }
.widget-selected { outline: 4px solid #19794c; z-index: 3; box-shadow: 0 0 0 6px #19794c18; }
.widget-rejected { outline-color: #cc493c; }
.widget-editing:focus-visible { outline: 4px solid #19794c; }
.widget-controls { position: absolute; left: 0; right: 0; top: 0; display: flex; height: 40px; background: #1b664eea; color: white; opacity: 0; z-index: 8; }
.widget-selected .widget-controls,.widget-editing:hover .widget-controls,.widget-editing:focus-within .widget-controls { opacity: 1; }
.widget-controls button { border: 0; color: inherit; background: transparent; cursor: pointer; }
.widget-grip { flex: 1; display: flex; align-items: center; gap: 10px; padding: 4px 12px; font-size: 23px; text-align: left; touch-action: none; cursor: grab !important; }
.widget-hide { display: grid; place-items: center; width: 46px; }
.widget-hide:hover { background: #ffffff25; }
.widget-content-button { cursor: pointer !important; }
.widget-resize { position: absolute; right: -8px; bottom: -8px; width: 30px; height: 30px; background: #19794c; border: 3px solid white; border-radius: 5px; z-index: 9; touch-action: none; cursor: nwse-resize; }
.widget-resize span { display: block; border-right: 2px solid white; border-bottom: 2px solid white; width: 10px; height: 10px; transform: translate(3px,2px); }
.widget-dimensions { position: absolute; right: 3px; bottom: -32px; background: #19794c; padding: 3px 9px; color: white; font-size: 20px; white-space: nowrap; z-index: 8; pointer-events: none; }
</style>
