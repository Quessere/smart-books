<script setup lang="ts">
import type { MediaItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
import MediaSlideshow from '../common/MediaSlideshow.vue'
defineProps<{ title: string; image: MediaItem; slides?: MediaItem[]; interval?: number; paused?: boolean }>()
</script>

<template>
  <section class="module activity-display" data-module="activity" :aria-label="title">
    <ModuleHeading class="heading" :title="title" short />
    <figure class="activity-image"><MediaSlideshow :image="image" :slides="slides" :interval="interval" :paused="paused" original="activity" /></figure>
  </section>
</template>

<style scoped>
.heading { position: absolute; left: 16px; top: 10px; right: 24px; }
.activity-image { position: absolute; left: 0; right: 0; top: clamp(80px,23cqh,114px); bottom: 0; overflow: hidden; }
</style>
