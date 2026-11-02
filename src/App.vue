<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Check, ChevronLeft, Download, Eye, LayoutGrid, LoaderCircle, Maximize, Monitor, PanelRight, Pencil, Redo2, RotateCcw, Save, Send, Settings2, Undo2, Upload, X } from '@lucide/vue'
import DashboardCanvas from './components/layout/DashboardCanvas.vue'
import SettingsPanel from './components/editor/SettingsPanel.vue'
import TemplatePanel from './components/editor/TemplatePanel.vue'
import { getLayoutTemplate } from './data/layoutTemplates'
import WidgetIcon from './components/editor/WidgetIcon.vue'
import { widgetDefinitions } from './data/widgets'
import { useDashboardEditor } from './composables/useDashboardEditor'
import type { WidgetId } from './types/editor'
const { displayOnly, mode, draft, initialized, saving, working, selected, dirty, saveError, toast, view, canUndo, canRedo, pendingLayout, rejected, usesRemoteApi, patch, undo, redo, saveDraft, publish, enterEdit, exitEdit, toggle, resize, chooseTemplate, setSlot, leaveTemplate, reset, exportBackup, importBackup, notify } = useDashboardEditor()
const zoom = ref(0), modulesOpen = ref(false), settingsOpen = ref(false), templatesOpen = ref(true), focusedSlot = ref<number | null>(null)
const currentTemplate = computed(() => draft.value.composition ? getLayoutTemplate(draft.value.composition.templateId) : undefined)
watch(() => draft.value.composition,comp => { if (comp) templatesOpen.value = true })
function applyTemplate(id: string) { chooseTemplate(id); templatesOpen.value = true; settingsOpen.value = false }
function freeLayout() { if (draft.value.composition) leaveTemplate(); templatesOpen.value = false }
function pickSlot(index: number) { templatesOpen.value = true; modulesOpen.value = true; settingsOpen.value = false; focusedSlot.value = index }
const importInput = ref<HTMLInputElement | null>(null), resetDialog = ref<HTMLDialogElement | null>(null)
const visibleCount = computed(() => draft.value.layout.filter(item => item.visible).length)
const saveStatus = computed(() => saveError.value ? '保存失败' : saving.value ? '正在保存…' : dirty.value ? '等待保存' : '草稿已保存')
function select(id: WidgetId | 'global') { selected.value = id; settingsOpen.value = true; modulesOpen.value = false }
function fileChange(event: Event) { const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = ''; if (file) void importBackup(file) }
function restore(all: boolean) { reset(all); resetDialog.value?.close() }
async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() } catch { notify('当前窗口暂不支持全屏，请使用浏览器全屏功能',true) } }
function shortcuts(event: KeyboardEvent) {
  const element = event.target as HTMLElement
  const typing = element.matches('input,textarea,select,[contenteditable="true"]')
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && mode.value !== 'display') { event.preventDefault(); element.blur(); void saveDraft(true); return }
  if (typing || resetDialog.value?.open) return
  if (mode.value === 'edit' && (event.ctrlKey || event.metaKey)) {
    if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo() }
    if (event.key.toLowerCase() === 'y') { event.preventDefault(); redo() }
  }
  if (event.key === 'Escape') { modulesOpen.value = false; settingsOpen.value = false; if (mode.value === 'preview') mode.value = 'edit' }
  if (event.key.toLowerCase() === 'e' && mode.value === 'display' && !displayOnly) void enterEdit()
}
onMounted(() => window.addEventListener('keydown',shortcuts))
onBeforeUnmount(() => window.removeEventListener('keydown',shortcuts))
</script>

<template>
  <div v-if="!initialized" class="app-loading" role="status"><LoaderCircle class="spin" :size="28" />正在载入大屏…</div>
  <template v-else>
    <div v-if="mode === 'display'" class="display-shell">
      <DashboardCanvas :document="view" />
      <div v-if="!displayOnly" class="display-actions"><button class="editor-button" @click="fullscreen"><Maximize :size="16" />全屏</button><button class="editor-button primary" @click="enterEdit"><Pencil :size="16" />编辑大屏</button></div>
    </div>
    <div v-else class="editor-shell" :class="{ 'is-preview': mode === 'preview' }">
      <header class="editor-header">
        <div class="editor-brand"><span class="brand-icon"><Monitor :size="23" /></span><div><strong>图书馆大屏编辑器</strong><span>{{ draft.name }}</span></div></div>
        <span class="save-status" :class="{ 'has-error': saveError }" role="status"><LoaderCircle v-if="saving" class="spin" :size="14" /><Check v-else-if="!dirty && !saveError" :size="14" />{{ saveStatus }}</span>
        <div class="header-actions"><button aria-label="返回展示" class="editor-button quiet exit-button" :disabled="working" @click="exitEdit"><ArrowLeft :size="16" /><span>返回展示</span></button><button v-if="mode === 'edit'" class="editor-button" @click="mode = 'preview'; modulesOpen = false; settingsOpen = false"><Eye :size="16" /><span>预览</span></button><button v-else class="editor-button" @click="mode = 'edit'"><Pencil :size="16" />继续编辑</button><button aria-label="保存草稿" class="editor-button save-button" :disabled="saving || working" @click="saveDraft(true)"><Save :size="16" /><span>保存草稿</span></button><button aria-label="发布到展示页" class="editor-button primary" :disabled="working || saving" @click="publish"><LoaderCircle v-if="working" class="spin" :size="16" /><Send v-else :size="16" /><span>发布到展示页</span></button></div>
      </header>
      <nav v-if="mode === 'edit'" class="editor-toolbar" aria-label="编辑工具">
        <div class="toolbar-group"><button class="editor-button drawer-toggle" @click="modulesOpen = !modulesOpen; settingsOpen = false"><LayoutGrid :size="16" />模块</button><button class="icon-button" aria-label="撤销" title="撤销 Ctrl+Z" :disabled="!canUndo" @click="undo"><Undo2 :size="18" /></button><button class="icon-button" aria-label="重做" title="重做 Ctrl+Shift+Z" :disabled="!canRedo" @click="redo"><Redo2 :size="18" /></button><span class="toolbar-divider" /><button aria-label="模板排版" class="editor-button quiet" :class="{ 'toolbar-active': templatesOpen }" @click="templatesOpen = true; modulesOpen = true; settingsOpen = false"><LayoutGrid :size="16" /><span>模板排版</span></button><button aria-label="恢复默认" class="editor-button quiet" @click="resetDialog?.showModal()"><RotateCcw :size="16" /><span>恢复默认</span></button></div>
        <div class="toolbar-group toolbar-right"><button aria-label="导入" class="editor-button quiet" :disabled="working" @click="importInput?.click()" title="导入备份"><Upload :size="16" /><span>导入</span></button><button aria-label="导出" class="editor-button quiet" :disabled="working" @click="exportBackup" title="导出备份"><Download :size="16" /><span>导出</span></button><span class="toolbar-divider" /><label class="zoom-control"><span>画布</span><select v-model.number="zoom" aria-label="画布缩放"><option :value="0">适应窗口</option><option :value="0.5">50%</option><option :value="0.75">75%</option><option :value="1">100%</option></select></label><button class="editor-button drawer-toggle" @click="settingsOpen = !settingsOpen; modulesOpen = false"><PanelRight :size="16" />设置</button></div>
      </nav>
      <div v-else class="preview-banner"><Eye :size="16" /><span>预览草稿 · 轮播和翻页已开启</span><a href="/?display=1" target="_blank" rel="noopener">打开已发布的展示页</a></div>
      <div class="editor-workspace">
        <button v-if="mode === 'edit' && (modulesOpen || settingsOpen)" class="drawer-backdrop" aria-label="关闭侧栏" @click="modulesOpen = false; settingsOpen = false" />
        <TemplatePanel v-if="mode === 'edit' && templatesOpen" :class="{ 'drawer-open': modulesOpen }" :document="draft" :selected="selected" :focus-slot="focusedSlot" @template="applyTemplate" @assign="setSlot" @select="select" @free="freeLayout" @close="modulesOpen = false" />
        <aside v-else-if="mode === 'edit'" class="module-library" :class="{ 'drawer-open': modulesOpen }" aria-label="模块列表">
          <div class="panel-title"><strong>页面模块 <small>{{ visibleCount }} / 8</small></strong><button class="icon-button panel-close" aria-label="关闭模块面板" @click="modulesOpen = false"><ChevronLeft :size="18" /></button></div>
          <div class="library-scroll"><button class="global-settings" :class="{ active: selected === 'global' }" @click="select('global')"><Settings2 :size="19" /><span>全局设置<small>标题、主题、校标与天气</small></span></button>
            <section v-for="category in ['数据展示','内容展示']" :key="category" class="library-group"><h2>{{ category }}</h2><div v-for="widget in widgetDefinitions.filter(item => item.category === category)" :key="widget.id" class="library-item" :class="{ active: selected === widget.id, muted: !draft.layout.find(item => item.id === widget.id)?.visible }"><button class="library-select" @click="select(widget.id)"><WidgetIcon :id="widget.id" /><span>{{ widget.name }}<small>{{ widget.description }}</small></span></button><input type="checkbox" :aria-label="`显示${widget.name}`" :checked="draft.layout.find(item => item.id === widget.id)?.visible" @change="toggle(widget.id)" /></div></section>
            <p class="library-help">勾选控制模块显示，点击模块编辑内容。<br />拖动标题条移动，右下角调整大小。</p>
          </div>
          <a class="presentation-link" href="/?display=1" target="_blank" rel="noopener"><Monitor :size="17" />打开已发布的展示页</a>
        </aside>
        <div class="canvas-workspace"><DashboardCanvas :document="draft" :editing="mode === 'edit'" :selected="selected" :layout="pendingLayout" :rejected="rejected" :zoom="mode === 'edit' ? zoom : 0" @select="select" @toggle="toggle" @rect="resize" @pick-slot="pickSlot" /><div v-if="!visibleCount && !draft.composition" class="empty-canvas"><LayoutGrid :size="30" /><strong>还没有展示的模块</strong><p>在左侧勾选模块，开始布置大屏。</p></div></div>
        <SettingsPanel v-if="mode === 'edit'" :class="{ 'drawer-open': settingsOpen }" :document="draft" :selected="selected" :remote="usesRemoteApi" @patch="patch" @toggle="toggle" @rect="resize" @close="settingsOpen = false" />
      </div>
      <footer class="editor-footer"><span><span class="status-dot" />{{ usesRemoteApi ? '接口模式' : '本地保存 · 仅当前浏览器' }}</span><span class="footer-help">{{ mode === 'preview' ? '发布后，展示页才会更新' : (currentTemplate ? `固定版位 · ${currentTemplate.count} 个组件 · Ctrl+S 保存` : '自由布局 · 拖动 / 缩放 · Ctrl+S 保存') }}</span><span>草稿与展示内容独立</span></footer>
    </div>
    <input ref="importInput" type="file" accept="application/json,.json" hidden aria-label="导入大屏备份" @change="fileChange" />
    <dialog ref="resetDialog" class="reset-dialog" aria-labelledby="reset-title"><div class="dialog-heading"><h2 id="reset-title">恢复默认设置</h2><button class="icon-button" aria-label="关闭恢复设置" @click="resetDialog?.close()"><X :size="18" /></button></div><p>选择恢复范围。操作只影响草稿，可以撤销；展示页会在再次发布后更新。</p><button class="reset-option" @click="restore(false)"><LayoutGrid :size="21" /><span><strong>只恢复布局</strong><small>恢复初始自由布局和显示状态，保留内容。</small></span></button><button class="reset-option" @click="restore(true)"><RotateCcw :size="21" /><span><strong>恢复全部内容与布局</strong><small>恢复初始演示数据、素材、主题和布局。</small></span></button><button class="editor-button dialog-cancel" @click="resetDialog?.close()">取消</button></dialog>
    <div v-if="toast" class="editor-toast" :class="{ error: toast.error }" :role="toast.error ? 'alert' : 'status'"><Check v-if="!toast.error" :size="18" /><span>{{ toast.text }}</span><button class="icon-button" aria-label="关闭提示" @click="toast = null"><X :size="15" /></button></div>
  </template>
</template>
