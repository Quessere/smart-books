<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { HeaderContent } from '../../types/dashboard'
import MediaAsset from '../common/MediaAsset.vue'
import { getCurrentWeather } from '../../services/weather'
defineProps<{ content: HeaderContent }>()
const snapshot = new URLSearchParams(window.location.search).get('snapshot') === 'figma'
const now = ref(snapshot ? new Date('2026-10-10T16:20:00+08:00') : new Date())
const clock = computed(() => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now.value).replaceAll(':', '：'))
const calendar = computed(() => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(now.value))
let timer: ReturnType<typeof setInterval> | undefined
let weatherTimer: ReturnType<typeof setInterval> | undefined
let stopped = false
let loadingWeather = false
const weather = ref(snapshot ? '天气暂不可用' : '正在获取天气')
function updateWeather() {
  if (loadingWeather) return
  if (!navigator.geolocation) { weather.value = '当前浏览器不支持定位'; return }
  loadingWeather = true
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const result = await getCurrentWeather(coords.latitude, coords.longitude)
      if (!stopped) weather.value = `${result.description} ${result.temperature}℃`
    } catch {
      if (!stopped) weather.value = '天气获取失败'
    } finally { loadingWeather = false }
  }, error => {
    if (!stopped) weather.value = error.code === 1 ? '请允许位置访问' : '定位失败'
    loadingWeather = false
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 })
}
onMounted(() => {
  if (!snapshot) {
    timer = setInterval(() => { now.value = new Date() }, 1000)
    updateWeather()
    weatherTimer = setInterval(updateWeather, 15 * 60 * 1000)
  }
})
onBeforeUnmount(() => { stopped = true; clearInterval(timer); clearInterval(weatherTimer) })
</script>

<template>
  <header class="dashboard-header" data-module="header">
    <MediaAsset class="university-logo" :src="content.logo.src" :alt="content.logo.alt" :fit="content.logo.fit ?? 'contain'" />
    <div class="clock-ticker" aria-label="时间、日期和天气">
      <div class="clock-ticker__track">
        <div v-for="copy in 4" :key="copy" class="clock-ticker__item" :aria-hidden="copy > 1 ? 'true' : undefined">
          <time :datetime="now.toISOString()">{{ clock }}</time>
          <span class="clock-ticker__separator" aria-hidden="true">/</span>
          <span>{{ calendar }}</span>
          <span class="clock-ticker__separator" aria-hidden="true">/</span>
          <span>{{ weather }}</span>
          <span class="clock-ticker__separator" aria-hidden="true">/</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dashboard-header { position: absolute; inset: 0 0 auto; height: 285px; }
.university-logo { position: absolute; top: 10px; left: 0; width: 480px; height: 148px; object-fit: cover; }
.clock-ticker { position: absolute; left: 540px; right: 36px; top: 20px; height: 120px; overflow: hidden; container-type: inline-size; color: var(--title-color); font-family: var(--font-chinese); font-size: 54px; font-weight: 500; letter-spacing: .06em; white-space: nowrap; }
.clock-ticker__track { display: flex; width: max-content; height: 100%; animation: clock-scroll 36s linear infinite; }
.clock-ticker__item { flex: none; display: flex; align-items: center; min-width: 50cqw; gap: 44px; padding: 0 60px; font-variant-numeric: tabular-nums; }
.clock-ticker__separator { opacity: .4; }
@keyframes clock-scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .clock-ticker__track { animation: none; }
  .clock-ticker__item[aria-hidden='true'] { display: none; }
}
</style>
