import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { clone, createDefaultDocument } from '../data/defaultDocument'
import { loadDocument, saveDocument, usesRemoteApi } from '../services/dashboardGateway'
import { makeBackup, readBackup } from '../services/localRepository'
import { arrangeLayout, compactAfterHide, proposeLayout } from '../lib/layout'
import { validateDocument } from '../lib/validation'
import { assignTemplateSlot, compositionForTemplate, layoutFromTemplate } from '../lib/templateLayout'
import { getLayoutTemplate } from '../data/layoutTemplates'
import type { DashboardDocument, EditorMode, Rect, WidgetId, WidgetLayout } from '../types/editor'

export function useDashboardEditor() {
  const params = new URLSearchParams(location.search)
  const displayOnly = params.get('display') === '1'
  const mode = ref<EditorMode>(!displayOnly && params.get('edit') === '1' ? 'edit' : 'display')
  const published = ref(createDefaultDocument()), draft = ref(clone(published.value))
  const initialized = ref(false), saving = ref(false), working = ref(false), selected = ref<WidgetId | 'global'>('books')
  const savedSignature = ref(''), saveError = ref(''), toast = ref<{ text: string; error: boolean } | null>(null)
  const past = ref<DashboardDocument[]>([]), future = ref<DashboardDocument[]>([])
  const pendingLayout = ref<WidgetLayout[] | null>(null), rejected = ref(false)
  const view = computed(() => mode.value === 'display' ? published.value : draft.value)
  const dirty = computed(() => JSON.stringify(draft.value) !== savedSignature.value)
  const canUndo = computed(() => past.value.length > 0), canRedo = computed(() => future.value.length > 0)
  let saveTimer: ReturnType<typeof setTimeout> | undefined, toastTimer: ReturnType<typeof setTimeout> | undefined
  let saveChain = Promise.resolve(), group = '', groupTime = 0
  let alive = true
  function notify(text: string, error = false) { toast.value = { text, error }; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.value = null },error ? 7000 : 3500) }
  function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { void saveDraft() },700) }
  function change(mutator: (doc: DashboardDocument) => void, key = '') {
    const next = clone(draft.value)
    mutator(next)
    if (JSON.stringify(next) === JSON.stringify(draft.value)) return
    const now = Date.now()
    if (!key || group !== key || now - groupTime > 650) { past.value.push(clone(draft.value)); if (past.value.length > 30) past.value.shift() }
    group = key; groupTime = now; future.value = []
    next.updatedAt = new Date().toISOString(); draft.value = next; queueSave()
  }
  function patch(path: string, value: unknown) {
    const keys = path.split('.')
    if (keys.some(key => ['__proto__','constructor','prototype'].includes(key))) return
    change(doc => { let target = doc as unknown as Record<string, unknown>; for (const key of keys.slice(0,-1)) target = target[key] as Record<string, unknown>; target[keys.at(-1)!] = value },path)
  }
  function undo() { const previous = past.value.pop(); if (!previous) return; future.value.push(clone(draft.value)); draft.value = previous; group = ''; queueSave(); pendingLayout.value = null }
  function redo() { const next = future.value.pop(); if (!next) return; past.value.push(clone(draft.value)); draft.value = next; group = ''; queueSave(); pendingLayout.value = null }
  async function saveDraft(announce = false): Promise<boolean> {
    clearTimeout(saveTimer)
    let snapshot: DashboardDocument
    try { snapshot = validateDocument(draft.value) } catch (error) { saveError.value = (error as Error).message; if (announce) notify(saveError.value,true); return false }
    const signature = JSON.stringify(snapshot)
    saving.value = true
    const currentSave = saveChain.catch(() => {}).then(() => saveDocument('draft',snapshot))
    saveChain = currentSave
    try { await currentSave; if (!alive) return true; savedSignature.value = signature; saveError.value = ''; if (announce) notify('草稿已保存'); return true }
    catch (error) { saveError.value = (error as Error).message; notify(saveError.value,true); return false }
    finally { if (currentSave === saveChain) saving.value = false }
  }
  async function publish() {
    if (working.value) return
    if (!draft.value.layout.some(item => item.visible)) { notify('请至少展示一个模块后再发布',true); return }
    working.value = true
    try {
      if (!await saveDraft()) { notify(saveError.value || '请先完成有效的草稿设置',true); return }
      const snapshot = validateDocument(draft.value)
      await saveDocument('published',snapshot)
      published.value = clone(snapshot)
      try { localStorage.setItem('library-dashboard-published',`${Date.now()}-${crypto.randomUUID()}`) } catch { /* IndexedDB remains authoritative when localStorage is restricted. */ }
      notify(usesRemoteApi ? '已发布到展示页' : '已发布到此浏览器的展示页')
    } catch (error) { notify((error as Error).message,true) } finally { working.value = false }
  }
  async function enterEdit() { if (!displayOnly) mode.value = 'edit' }
  async function exitEdit() { if (!await saveDraft()) return; mode.value = 'display'; pendingLayout.value = null }
  function toggle(id: WidgetId) {
    if (draft.value.composition) {
      const occupied = draft.value.composition.slots.indexOf(id)
      if (occupied >= 0) setSlot(occupied,null)
      else { const empty = draft.value.composition.slots.indexOf(null); if (empty >= 0) setSlot(empty,id); else notify('版位已满，请在左侧更换组件或选择更多版位的模板',true) }
      return
    }
    change(doc => {
      const item = doc.layout.find(item => item.id === id)!
      item.visible = !item.visible
      if (!item.visible && doc.autoCompact) doc.layout = compactAfterHide(doc.layout,item)
      else if (item.visible) doc.layout = proposeLayout(doc.layout,id,item) ?? arrangeLayout(doc.layout)
    })
  }
  function resize(id: WidgetId, rect: Rect, done = true, cancel = false) {
    if (draft.value.composition) { if (done && !cancel) notify('当前使用固定版位，请通过左侧模板调整排版'); return }
    if (cancel) { pendingLayout.value = null; rejected.value = false; return }
    const layout = proposeLayout(draft.value.layout,id,rect)
    rejected.value = !layout
    if (!done) { pendingLayout.value = layout; return }
    pendingLayout.value = null
    if (!layout) { notify('当前空间放不下这个尺寸，请先移动、隐藏其他模块，或使用自动排列',true); rejected.value = false; return }
    change(doc => { doc.layout = layout })
    rejected.value = false
  }
  function chooseTemplate(templateId: string) {
    if (!getLayoutTemplate(templateId)) return
    change(doc => { doc.composition = compositionForTemplate(templateId,doc.layout,doc.composition); doc.layout = layoutFromTemplate(doc.layout,doc.composition) })
    if (!draft.value.composition?.slots.includes(selected.value as WidgetId)) selected.value = draft.value.composition?.slots.find((id): id is WidgetId => id !== null) ?? 'global'
    pendingLayout.value = null
    notify(`已应用「${getLayoutTemplate(templateId)!.name}」，可在左侧更换每个版位的组件`)
  }
  function setSlot(index: number,id: WidgetId | null) {
    if (!draft.value.composition) return
    change(doc => { doc.composition = assignTemplateSlot(doc.composition!,index,id); doc.layout = layoutFromTemplate(doc.layout,doc.composition) })
    if (id) selected.value = id
    else if (!draft.value.composition?.slots.includes(selected.value as WidgetId)) selected.value = 'global'
  }
  function leaveTemplate() { change(doc => { delete doc.composition }); pendingLayout.value = null; notify('已切换为自由布局，保留当前组件与位置') }
  function reset(all: boolean) { change(doc => { const defaults = createDefaultDocument(); delete doc.composition; if (all) Object.assign(doc,defaults); else doc.layout = defaults.layout }); notify(all ? '已恢复默认内容和布局，可撤销' : '已恢复默认自由布局，可撤销') }
  async function exportBackup() {
    working.value = true
    try {
      const backup = await makeBackup(mode.value === 'display' ? published.value : draft.value)
      const blob = new Blob([JSON.stringify(backup,null,2)],{ type: 'application/json' }), url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${view.value.name.replace(/[<>:"/\\|?*]/g,'-') || '图书馆大屏'}-备份.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url),5000)
      notify('备份已导出，包含当前配置和上传素材')
    } catch (error) { notify((error as Error).message,true) } finally { working.value = false }
  }
  async function importBackup(file: File) {
    working.value = true
    try { const document = await readBackup(file); change(doc => { delete doc.composition; Object.assign(doc,document) }); mode.value = 'edit'; selected.value = 'global'; notify('备份已导入为草稿，预览后可发布') } catch (error) { notify((error as Error).message,true) } finally { working.value = false }
  }
  async function externalPublish(event: StorageEvent) { if (event.key !== 'library-dashboard-published') return; try { const doc = await loadDocument('published'); if (doc) { published.value = doc; if (mode.value !== 'display') notify('展示页已在另一个窗口更新，当前草稿保留') } } catch (error) { notify((error as Error).message,true) } }
  function beforeUnload(event: BeforeUnloadEvent) { if (dirty.value && mode.value !== 'display') { event.preventDefault(); event.returnValue = '' } }
  onMounted(async () => {
    window.addEventListener('storage',externalPublish); window.addEventListener('beforeunload',beforeUnload)
    try { const [live,saved] = await Promise.all([loadDocument('published'),loadDocument('draft')]); if (live) published.value = live; draft.value = clone(saved ?? live ?? published.value); savedSignature.value = JSON.stringify(draft.value) }
    catch (error) { saveError.value = (error as Error).message; notify(saveError.value,true) }
    finally { initialized.value = true }
  })
  onBeforeUnmount(() => { alive = false; clearTimeout(saveTimer); clearTimeout(toastTimer); window.removeEventListener('storage',externalPublish); window.removeEventListener('beforeunload',beforeUnload) })
  return { displayOnly, mode, published, draft, initialized, saving, working, selected, dirty, saveError, toast, view, canUndo, canRedo, pendingLayout, rejected, usesRemoteApi, change, patch, undo, redo, saveDraft, publish, enterEdit, exitEdit, toggle, resize, chooseTemplate, setSlot, leaveTemplate, reset, exportBackup, importBackup, notify }
}
