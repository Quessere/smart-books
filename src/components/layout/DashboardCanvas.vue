<script setup lang="ts">
import DashboardStage from './DashboardStage.vue'
import DashboardHeader from './DashboardHeader.vue'
import WidgetFrame from '../editor/WidgetFrame.vue'
import BookRanking from '../modules/BookRanking.vue'
import ReaderRanking from '../modules/ReaderRanking.vue'
import StatisticsOverview from '../modules/StatisticsOverview.vue'
import CampusShowcase from '../modules/CampusShowcase.vue'
import ActivityDisplay from '../modules/ActivityDisplay.vue'
import SearchRanking from '../modules/SearchRanking.vue'
import NewBooksBulletin from '../modules/NewBooksBulletin.vue'
import NoticeBoard from '../modules/NoticeBoard.vue'
import { computed } from 'vue'
import { Plus } from '@lucide/vue'
import { getLayoutTemplate } from '../../data/layoutTemplates'
import type { DashboardDocument, Rect, WidgetId, WidgetLayout } from '../../types/editor'
const props = defineProps<{ document: DashboardDocument; editing?: boolean; selected?: string; layout?: WidgetLayout[] | null; rejected?: boolean; zoom?: number }>()
const emit = defineEmits<{ select: [id: WidgetId]; toggle: [id: WidgetId]; rect: [id: WidgetId, rect: Rect, done: boolean, cancel?: boolean]; pickSlot: [index: number] }>()
const template = computed(() => props.document.composition ? getLayoutTemplate(props.document.composition.templateId) : undefined)
</script>
<template>
  <DashboardStage :zoom="zoom" :style="{ '--dashboard-background': document.appearance.background, '--heading-color': document.appearance.headingColor }">
    <DashboardHeader :content="document.content.header" />
    <template v-if="editing && template"><template v-for="(slot,index) in template.slots" :key="index"><button v-if="!document.composition?.slots[index]" class="empty-template-slot" :style="{ left: `${slot.x}px`,top: `${slot.y}px`,width: `${slot.w}px`,height: `${slot.h}px` }" :aria-label="`为位置 ${index+1} 添加组件`" @click="emit('pickSlot',index)"><Plus :size="42" /><strong>位置 {{ index+1 }}</strong><span>{{ slot.name }} · 添加组件</span></button></template></template>
    <template v-for="item in layout ?? document.layout" :key="item.id">
      <WidgetFrame v-if="item.visible" :item="item" :editing="Boolean(editing)" :locked="Boolean(document.composition)" :selected="selected === item.id" :rejected="rejected" @select="emit('select',$event)" @toggle="emit('toggle',$event)" @rect="(id,rect,done,cancel) => emit('rect',id,rect,done,cancel)">
        <BookRanking v-if="item.id === 'books'" v-bind="document.content.books" />
        <ReaderRanking v-else-if="item.id === 'readers'" v-bind="document.content.readers" />
        <StatisticsOverview v-else-if="item.id === 'statistics'" v-bind="document.content.statistics" />
        <CampusShowcase v-else-if="item.id === 'hero'" :image="document.content.hero" :slides="document.content.heroSlides" :interval="document.content.heroInterval" :paused="editing" />
        <ActivityDisplay v-else-if="item.id === 'activity'" v-bind="document.content.activity" :paused="editing" />
        <SearchRanking v-else-if="item.id === 'searches'" v-bind="document.content.searches" />
        <NewBooksBulletin v-else-if="item.id === 'newBooks'" v-bind="document.content.newBooks" :paused="editing" />
        <NoticeBoard v-else-if="item.id === 'notices'" v-bind="document.content.notices" :paused="editing" />
      </WidgetFrame>
    </template>
  </DashboardStage>
</template>
