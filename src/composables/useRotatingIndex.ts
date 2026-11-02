import { onBeforeUnmount, ref, watch } from 'vue'
export function useRotatingIndex(count: () => number, seconds: () => number, paused: () => boolean) {
  const index = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined
  function go(value: number) { index.value = count() ? (value + count()) % count() : 0 }
  watch([count,seconds,paused], () => { clearInterval(timer); if (index.value >= count()) index.value = 0; if (count()>1 && !paused()) timer = setInterval(() => go(index.value+1),Math.max(3,seconds())*1000) },{ immediate: true })
  onBeforeUnmount(() => clearInterval(timer))
  return { index, go }
}
