<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, Users, ChartColumn, Image, CalendarDays, Search, LibraryBig, Bell, Settings2 } from '@lucide/vue'
import type { WidgetId } from '../../types/editor'
const props = defineProps<{ id: WidgetId | 'global'; size?: number }>()
const icon = computed(() => ({ books: BookOpen,readers: Users,statistics: ChartColumn,hero: Image,activity: CalendarDays,searches: Search,newBooks: LibraryBig,notices: Bell,global: Settings2 })[props.id])
</script>
<template><component :is="icon" :size="size ?? 18" :stroke-width="1.8" /></template>
