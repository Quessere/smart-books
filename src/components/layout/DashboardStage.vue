<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasScale } from '../../composables/useCanvasScale'
const container = ref<HTMLElement | null>(null)
const { canvasStyle, frameStyle } = useCanvasScale(container)
const props = defineProps<{ zoom?: number }>()
const effectiveCanvas = computed(() => props.zoom ? { width: '2560px', height: '1440px', transform: `scale(${props.zoom})` } : canvasStyle.value)
const effectiveFrame = computed(() => props.zoom ? { width: `${2560*props.zoom}px`, height: `${1440*props.zoom}px` } : frameStyle.value)
</script>

<template>
  <main ref="container" class="dashboard-viewport" :class="{ 'dashboard-viewport--manual': zoom }" aria-label="图书馆大数据综合展示平台">
    <div class="dashboard-frame" :style="effectiveFrame">
      <div class="dashboard-canvas" :style="effectiveCanvas"><slot /></div>
    </div>
  </main>
</template>

<style scoped>
.dashboard-viewport { width: 100%; height: 100%; display: grid; place-items: center; overflow: hidden; background: var(--dashboard-background); }
.dashboard-frame { position: relative; flex: none; }
.dashboard-canvas { position: absolute; top: 0; left: 0; transform-origin: top left; background: var(--dashboard-background); overflow: hidden; }
.dashboard-viewport--manual { display: block; overflow: auto; }
.dashboard-viewport--manual .dashboard-frame { margin: 28px; }
</style>
