<script setup lang="ts">
import { publicAssetUrl } from '../../lib/publicAsset'
const assetBase = import.meta.env.BASE_URL
withDefaults(defineProps<{ title: string; short?: boolean }>(), { short: false })
</script>

<template>
  <div class="module-heading">
    <img :src="publicAssetUrl(short ? '/assets/figma/heading-marker-short.svg' : '/assets/figma/heading-marker.svg', assetBase)" alt="" class="module-heading__marker" />
    <h2>{{ title }}</h2>
  </div>
</template>

<style scoped>
.module-heading { display: flex; align-items: center; gap: 8px; height: 58px; white-space: nowrap; }
.module-heading__marker { flex: none; max-height: 9cqw; }
h2 { overflow: hidden; text-overflow: ellipsis; color: var(--heading-color); font-family: var(--font-chinese); font-size: clamp(28px,8.5cqw,var(--heading-size)); font-weight: 700; line-height: 58px; }
</style>
