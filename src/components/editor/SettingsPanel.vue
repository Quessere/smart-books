<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { X, Plus, Trash2, ChevronUp, ChevronDown, SlidersHorizontal, FileText, Info } from '@lucide/vue'
import type { DashboardDocument,Rect,WidgetId } from '../../types/editor'
import type { NewBookItem,NoticeItem } from '../../types/dashboard'
import { definition } from '../../data/widgets'
import MediaEditor from './MediaEditor.vue'
import MediaListEditor from './MediaListEditor.vue'
import RankingEditor from './RankingEditor.vue'
import WidgetIcon from './WidgetIcon.vue'
const props = defineProps<{ document: DashboardDocument; selected: WidgetId | 'global'; remote: boolean }>()
const createId = () => crypto.randomUUID()
const emit = defineEmits<{ patch: [path: string,value: unknown]; toggle: [id: WidgetId]; rect: [id: WidgetId,rect: Rect]; close: [] }>()
const tab = ref<'content'|'layout'>('content')
watch(() => props.selected,() => { tab.value = 'content' })
const content = computed(() => props.document.content)
const item = computed(() => props.document.layout.find(item => item.id === props.selected))
const ranking = computed(() => props.selected === 'books' ? content.value.books : props.selected === 'readers' ? content.value.readers : props.selected === 'searches' ? content.value.searches : undefined)
const title = computed(() => { const id = props.selected; return id === 'global' || id === 'hero' ? '' : content.value[id].title })
const rankLabel = computed(() => props.selected === 'books' ? '图书' : props.selected === 'readers' ? '读者' : '检索词')
const patch = (path: string,value: unknown) => emit('patch',path,value)
const valueOf = (event: Event) => (event.target as HTMLInputElement).value
const numberOf = (event: Event,min: number,max: number) => Math.max(min,Math.min(max,Number(valueOf(event))||min))
async function dimension(key: keyof Rect,event: Event) {
  if (!item.value) return
  const id = item.value.id, input = event.target as HTMLInputElement
  emit('rect',id,{ ...item.value,[key]: numberOf(event,0,2560) })
  await nextTick()
  input.value = String(Math.round(props.document.layout.find(entry => entry.id === id)![key]))
}
function notice(index: number,value: Partial<NoticeItem>) { patch('content.notices.items',content.value.notices.items.map((item,i) => index === i ? { ...item,...value } : item)) }
function moveNotice(index: number,delta: number) { const items = [...content.value.notices.items]; [items[index],items[index+delta]] = [items[index+delta]!,items[index]!]; patch('content.notices.items',items) }
function book(index: number,key: keyof NewBookItem,value: string) { patch('content.newBooks.items',(content.value.newBooks.items ?? []).map((item,i) => index === i ? { ...item,[key]: value } : item)) }
function addBook() { patch('content.newBooks.items',[...(content.value.newBooks.items ?? []),{ id: createId(),title: '新书名称',author: '',publisher: '',callNumber: '',date: '' }]) }
</script>
<template>
  <aside class="settings-panel" aria-label="模块设置">
    <div class="panel-title"><div><WidgetIcon :id="selected" /><strong>{{ selected === 'global' ? '全局设置' : definition(selected).name }}</strong></div><button class="icon-button panel-close" aria-label="关闭设置面板" @click="emit('close')"><X :size="18" /></button></div>
    <div v-if="selected !== 'global'" class="settings-tabs" role="tablist" aria-label="设置类别"><button role="tab" :aria-selected="tab === 'content'" :class="{ active: tab === 'content' }" @click="tab = 'content'"><FileText :size="15" />内容</button><button role="tab" :aria-selected="tab === 'layout'" :class="{ active: tab === 'layout' }" @click="tab = 'layout'"><SlidersHorizontal :size="15" />布局</button></div>
    <div class="settings-scroll">
      <template v-if="selected === 'global'">
        <section class="setting-section"><h3>大屏信息</h3><label class="field-label">大屏名称<input :value="document.name" maxlength="80" @input="patch('name',valueOf($event))" /></label><label class="field-label">平台标题<input :value="content.header.title" maxlength="30" @input="patch('content.header.title',valueOf($event))" /></label><label class="field-label">平台副标题<input :value="content.header.subtitle" maxlength="40" @input="patch('content.header.subtitle',valueOf($event))" /></label></section>
        <section class="setting-section"><h3>主题颜色</h3><div class="field-row"><label class="field-label color-field">画布背景<input type="color" :value="document.appearance.background" @input="patch('appearance.background',valueOf($event))" /></label><label class="field-label color-field">模块标题<input type="color" :value="document.appearance.headingColor" @input="patch('appearance.headingColor',valueOf($event))" /></label></div></section>
        <section class="setting-section"><h3>校标素材</h3><MediaEditor :value="content.header.logo" label="校标" @update="patch('content.header.logo',$event)" /></section>
        <section class="setting-section"><h3>天气演示</h3><p class="field-hint">北京时间自动更新，天气信息目前为演示内容。</p><label class="field-label">温度（℃）<input type="number" min="-60" max="65" :value="content.header.weather.temperature" @input="patch('content.header.weather.temperature',numberOf($event,-60,65))" /></label><div class="field-row"><label class="field-label">天气<input :value="content.header.weather.description" maxlength="12" @input="patch('content.header.weather.description',valueOf($event))" /></label><label class="field-label">空气质量<input :value="content.header.weather.airQuality" maxlength="12" @input="patch('content.header.weather.airQuality',valueOf($event))" /></label></div></section>
        <section v-if="!document.composition" class="setting-section"><h3>布局行为</h3><label class="field-switch"><span>隐藏后自动补位</span><input type="checkbox" :checked="document.autoCompact" @input="patch('autoCompact',($event.target as HTMLInputElement).checked)" /></label><p class="field-hint">隐藏模块后，下方模块会向上填补空位。</p></section>
      </template>
      <template v-else-if="tab === 'layout' && item">
        <section class="setting-section"><h3>显示状态</h3><label class="field-switch"><span>展示此模块</span><input type="checkbox" :checked="item.visible" @change="emit('toggle',item.id)" /></label></section>
        <div v-if="document.composition" class="panel-tip"><Info :size="16" /><p>当前使用固定版位。位置和尺寸由模板管理，请在左侧切换模板或更换组件。</p></div>
        <section v-else class="setting-section"><h3>位置与尺寸</h3><div class="field-row"><label class="field-label">水平位置 X<input type="number" :value="Math.round(item.x)" min="28" max="2543" step="8" @blur="dimension('x',$event)" /></label><label class="field-label">垂直位置 Y<input type="number" :value="Math.round(item.y)" min="158" max="1408" step="8" @blur="dimension('y',$event)" /></label></div><div class="field-row"><label class="field-label">模块宽度<input type="number" :value="Math.round(item.w)" :min="definition(item.id).minW" max="2515" step="8" @blur="dimension('w',$event)" /></label><label class="field-label">模块高度<input type="number" :value="Math.round(item.h)" :min="definition(item.id).minH" max="1250" step="8" @blur="dimension('h',$event)" /></label></div><p class="field-hint">尺寸以设计画布像素计。最小 {{ definition(item.id).minW }} × {{ definition(item.id).minH }}，调整时按 8 px 对齐。</p></section>
        <div v-if="!document.composition" class="panel-tip"><Info :size="16" /><p>拖动绿色标题条移动，拖动右下角缩放。选中模块后，方向键移动，Alt＋方向键调整大小。</p></div>
      </template>
      <template v-else>
        <section v-if="selected !== 'hero'" class="setting-section"><h3>模块标题</h3><label class="field-label">显示标题<input :value="title" maxlength="40" @input="patch(`content.${selected}.title`,valueOf($event))" /></label></section>
        <template v-if="ranking">
          <section class="setting-section"><h3>展示设置</h3><label class="field-label">最多展示条数<input type="number" min="1" max="30" :value="ranking.limit ?? 5" @input="patch(`content.${selected}.limit`,Math.round(numberOf($event,1,30)))" /></label><p class="field-hint">{{ selected === 'searches' ? '热度越高字号越大，悬停可查看热度。零热度和空词条不展示。' : '空间不足时自动减少条数，保证文字清晰。' }}</p><label v-if="'unit' in ranking" class="field-label">统计量名称<input :value="ranking.unit" maxlength="20" @input="patch(`content.${selected}.unit`,valueOf($event))" /></label></section>
          <section class="setting-section"><h3>{{ remote ? '数据预览' : '演示数据' }}</h3><p class="field-hint">{{ remote ? '接口数据的统计数值由后端提供。' : '此处修改演示内容，正式统计数据接入后由接口提供。' }}</p><RankingEditor v-if="!remote" :items="ranking.items" :label="rankLabel" :colors="selected !== 'books'" @update="patch(`content.${selected}.items`,$event)" /></section>
        </template>
        <section v-else-if="selected === 'statistics'" class="setting-section"><h3>统计卡片</h3><p class="field-hint">当前为演示数据，正式数据由接口提供。</p><div v-for="(stat,index) in content.statistics.items" :key="stat.id" class="item-card"><strong class="item-caption">指标 {{ index+1 }}</strong><label class="field-label">指标名称 {{ index+1 }}<input :value="stat.label" maxlength="30" @input="patch(`content.statistics.items.${index}.label`,valueOf($event))" /></label><div class="field-row"><label class="field-label">指标数值 {{ index+1 }}<input type="number" min="0" max="1000000000000" :disabled="remote" :value="stat.value" @input="patch(`content.statistics.items.${index}.value`,numberOf($event,0,1e12))" /></label><label class="field-label unit-field">单位 {{ index+1 }}<input :value="stat.unit" maxlength="8" @input="patch(`content.statistics.items.${index}.unit`,valueOf($event))" /></label></div><label class="field-label">对比或说明 {{ index+1 }}<input :value="stat.note" maxlength="80" @input="patch(`content.statistics.items.${index}.note`,valueOf($event))" /></label></div></section>
        <template v-else-if="selected === 'hero' || selected === 'activity'">
          <section class="setting-section"><h3>轮播设置</h3><label class="field-label">切换间隔（秒）<input type="number" min="3" max="120" :value="selected === 'hero' ? content.heroInterval : content.activity.interval" @input="patch(selected === 'hero' ? 'content.heroInterval' : 'content.activity.interval',numberOf($event,3,120))" /></label><p class="field-hint">编辑时暂停轮播，预览或展示时自动播放。</p></section>
          <section class="setting-section"><h3>展示素材</h3><MediaListEditor :items="selected === 'hero' ? (content.heroSlides?.length ? content.heroSlides : [content.hero]) : (content.activity.slides?.length ? content.activity.slides : [content.activity.image])" @update="patch(selected === 'hero' ? 'content.heroSlides' : 'content.activity.slides',$event)" /></section>
        </template>
        <template v-else-if="selected === 'newBooks'">
          <section class="setting-section"><h3>展示方式</h3><label class="field-label">新书内容来源<select :value="content.newBooks.mode ?? 'image'" @input="patch('content.newBooks.mode',valueOf($event))"><option value="image">通报图片</option><option value="list">可编辑书目列表</option></select></label><p class="field-hint">列表内容较多时，会自动分页展示。</p></section>
          <section v-if="content.newBooks.mode !== 'list'" class="setting-section"><h3>通报图片</h3><MediaEditor :value="content.newBooks.image" label="通报图片" @update="patch('content.newBooks.image',$event)" /></section>
          <section v-else class="setting-section"><h3>书目内容</h3><details v-for="(entry,index) in content.newBooks.items" :key="entry.id" class="item-card"><summary>{{ index+1 }}. {{ entry.title || '新书' }}</summary><label class="field-label">书名 {{ index+1 }}<input :value="entry.title" maxlength="200" @input="book(index,'title',valueOf($event))" /></label><label class="field-label">作者 {{ index+1 }}<input :value="entry.author" maxlength="200" @input="book(index,'author',valueOf($event))" /></label><label class="field-label">出版社 {{ index+1 }}<input :value="entry.publisher" maxlength="200" @input="book(index,'publisher',valueOf($event))" /></label><div class="field-row"><label class="field-label">索书号 {{ index+1 }}<input :value="entry.callNumber" maxlength="200" @input="book(index,'callNumber',valueOf($event))" /></label><label class="field-label">日期 {{ index+1 }}<input type="date" :value="entry.date" @change="book(index,'date',valueOf($event))" /></label></div><button class="editor-button danger" @click="patch('content.newBooks.items',content.newBooks.items?.filter((_,i) => i !== index))"><Trash2 :size="14" />删除此书目</button></details><button class="editor-button dashed-button" :disabled="(content.newBooks.items?.length ?? 0) >= 30" @click="addBook"><Plus :size="16" />添加新书</button></section>
        </template>
        <template v-else-if="selected === 'notices'">
          <section class="setting-section"><h3>文字与翻页</h3><div class="field-row"><label class="field-label">正文字号<input type="number" min="22" max="56" :value="content.notices.fontSize" @input="patch('content.notices.fontSize',numberOf($event,22,56))" /></label><label class="field-label">翻页间隔（秒）<input type="number" min="3" max="120" :value="content.notices.interval" @input="patch('content.notices.interval',numberOf($event,3,120))" /></label></div><p class="field-hint">长通知会根据模块尺寸自动分段翻页。</p></section>
          <section class="setting-section"><h3>通知内容</h3><div v-for="(entry,index) in content.notices.items" :key="entry.id" class="item-card"><div class="item-caption"><span>通知 {{ index+1 }}</span><div class="row-actions"><button class="icon-button" :aria-label="`上移通知 ${index+1}`" :disabled="index === 0" @click="moveNotice(index,-1)"><ChevronUp :size="14" /></button><button class="icon-button" :aria-label="`下移通知 ${index+1}`" :disabled="index === content.notices.items.length-1" @click="moveNotice(index,1)"><ChevronDown :size="14" /></button><button class="icon-button danger" :aria-label="`删除通知 ${index+1}`" @click="patch('content.notices.items',content.notices.items.filter((_,i) => i !== index))"><Trash2 :size="14" /></button></div></div><label class="field-label">通知正文 {{ index+1 }}<textarea :value="entry.content" rows="4" maxlength="5000" @input="notice(index,{ content: valueOf($event) })" /></label></div><button class="editor-button dashed-button" :disabled="content.notices.items.length >= 50" @click="patch('content.notices.items',[...content.notices.items,{ id: createId(),content: '' }])"><Plus :size="16" />添加通知</button></section>
          <section class="setting-section"><h3>背景图片</h3><MediaEditor :value="content.notices.background" label="背景" @update="patch('content.notices.background',$event)" /></section>
        </template>
      </template>
    </div>
  </aside>
</template>
