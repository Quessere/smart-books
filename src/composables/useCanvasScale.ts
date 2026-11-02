import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Fit the original 16:9 design without stretching it or cropping any module. */
export function useCanvasScale(container: Ref<HTMLElement | null>, width = 2560, height = 1440) {
  const scale = ref(Math.min(window.innerWidth / width, window.innerHeight / height))
  let observer: ResizeObserver | undefined
  onMounted(() => {
    if (!container.value) return
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      scale.value = Math.max(0, Math.min(entry.contentRect.width / width, entry.contentRect.height / height))
    })
    observer.observe(container.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return {
    canvasStyle: computed(() => ({ width: `${width}px`, height: `${height}px`, transform: `scale(${scale.value})` })),
    frameStyle: computed(() => ({ width: `${width * scale.value}px`, height: `${height * scale.value}px` })),
  }
}
