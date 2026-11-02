<script setup lang="ts">
import type { MediaItem } from '../../types/dashboard'
import MediaSlideshow from '../common/MediaSlideshow.vue'
defineProps<{ image: MediaItem; slides?: MediaItem[]; interval?: number; paused?: boolean }>()
</script>

<template>
  <figure class="module campus-showcase" data-module="campus-showcase" aria-label="校园风采">
    <MediaSlideshow :image="image" :slides="slides" :interval="interval" :paused="paused" original="campus" />
    <figcaption v-if="image.caption" class="sr-only">{{ image.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.campus-showcase { overflow: hidden; }
</style>
