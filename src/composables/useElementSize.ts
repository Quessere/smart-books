import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
export function useElementSize(element: Ref<HTMLElement | null>, initialWidth: number, initialHeight: number) {
  const width = ref(initialWidth), height = ref(initialHeight)
  let observer: ResizeObserver | undefined
  onMounted(() => { if (!element.value) return; observer = new ResizeObserver(([entry]) => { if (entry) { width.value = entry.contentRect.width; height.value = entry.contentRect.height } }); observer.observe(element.value) })
  onBeforeUnmount(() => observer?.disconnect())
  return { width, height }
}
