<script setup lang="ts">
import type { StatisticItem } from '../../types/dashboard'
import ModuleHeading from '../common/ModuleHeading.vue'
defineProps<{ title: string; items: StatisticItem[] }>()
const format = (value: number) => new Intl.NumberFormat('en-US').format(value)
</script>

<template>
  <section class="module statistics" data-module="statistics" :aria-label="title">
    <ModuleHeading class="heading" :title="title" />
    <div class="statistics-grid">
      <article v-for="item in items" :key="item.id" class="statistic-card" :class="{ 'statistic-card--italic': item.italic }">
        <h3>{{ item.label }}</h3>
        <p class="statistic-card__value">{{ format(item.value) }}<span>{{ item.unit }}</span></p>
        <p class="statistic-card__note">{{ item.note }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.heading { position: absolute; top: 14px; left: 34px; right: 24px; }
.statistics-grid { position: absolute; left: 6.4%; right: 7.3%; top: clamp(85px,24cqh,110px); bottom: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: minmax(0,1fr); gap: clamp(12px,5.5cqh,25px) 4cqw; }
.statistic-card { min-width: 0; padding: clamp(8px,2.6cqh,12px) 2.6cqw; background: linear-gradient(to bottom, #f3fff7 83%, #c3eed3); overflow: hidden; }
h3 { margin: 0; color: #3a7242; font-family: var(--font-chinese); font-size: clamp(17px,3.75cqw,24px); line-height: 1.2; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.statistic-card__value { margin-top: clamp(8px,4.6cqh,21px); font-size: clamp(22px,6.23cqw,40px); font-weight: 400; line-height: 1.2; white-space: nowrap; }
.statistic-card__value span { margin-left: 1px; font-size: clamp(15px,3.75cqw,24px); color: var(--muted-green); letter-spacing: 0; }
.statistic-card__note { margin-top: clamp(4px,2.2cqh,10px); color: #ca1a03; font-size: clamp(15px,3.1cqw,20px); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.statistic-card--italic .statistic-card__value, .statistic-card--italic:last-child .statistic-card__note { font-style: italic; }
@container (max-height: 420px) {
  .statistics-grid { top: 85px; row-gap: 12px; }
  .statistic-card { padding-top: 8px; padding-bottom: 8px; }
  h3 { font-size: clamp(16px,4.6cqh,20px); }
  .statistic-card__value { margin-top: 6px; font-size: clamp(22px,8.1cqh,34px); }
  .statistic-card__note { margin-top: 4px; font-size: clamp(12px,3.6cqh,15px); }
}
</style>
