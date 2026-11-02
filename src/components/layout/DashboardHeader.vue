<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { HeaderContent } from '../../types/dashboard'
import MediaAsset from '../common/MediaAsset.vue'
defineProps<{ content: HeaderContent }>()
const snapshot = new URLSearchParams(window.location.search).get('snapshot') === 'figma'
const now = ref(snapshot ? new Date('2026-10-10T16:20:00+08:00') : new Date())
const clock = computed(() => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now.value).replace(':', '：'))
const calendar = computed(() => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(now.value))
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { if (!snapshot) timer = setInterval(() => { now.value = new Date() }, 1000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <header class="dashboard-header" data-module="header">
    <MediaAsset class="university-logo" :src="content.logo.src" :alt="content.logo.alt" :fit="content.logo.fit ?? 'contain'" />
    <div class="platform-title">
      <img :src="'/assets/figma/title-banner.svg'" alt="" class="platform-title__background" />
      <h1>{{ content.title }}<span>{{ content.subtitle }}</span></h1>
    </div>
    <div class="weather-clock" aria-label="天气与北京时间">
      <img src="/assets/figma/weather-sun.svg" alt="" class="weather-clock__icon" />
      <div class="weather-clock__weather"><p>{{ content.weather.temperature }}℃</p><p>{{ content.weather.description }}　{{ content.weather.airQuality }}</p></div>
      <div class="weather-clock__date"><time :datetime="now.toISOString()">{{ clock }}</time><p>{{ calendar }}</p></div>
    </div>
  </header>
</template>

<style scoped>
.dashboard-header { position: absolute; inset: 0 0 auto; height: 285px; }
.university-logo { position: absolute; top: 10px; left: 0; width: 480px; height: 148px; object-fit: cover; }
.platform-title { position: absolute; left: 699.52px; top: 17.61px; width: 1124.99px; height: 217.392px; }
.platform-title__background { position: absolute; inset: 0; }
h1 { position: absolute; top: 32.39px; left: 98.48px; width: 922px; color: var(--title-color); font-family: var(--font-chinese); font-size: 96px; font-weight: 600; line-height: 1.2; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
h1 span { overflow: hidden; text-overflow: ellipsis; }
h1 span { display: block; font-size: 64px; font-weight: 600; line-height: 1.2; }
.weather-clock { position: absolute; left: 2074px; top: 40px; width: 486px; height: 89px; border-radius: 44.5px; background: white; font-size: 20px; font-weight: 500; font-style: italic; line-height: 25px; }
.weather-clock__icon { position: absolute; left: 29px; top: 12px; }
.weather-clock__weather { position: absolute; top: 19px; left: 105px; }
.weather-clock__date { position: absolute; top: 21px; left: 243px; white-space: nowrap; }
.weather-clock__weather p + p, .weather-clock__date p { color: var(--muted-green); }
</style>
