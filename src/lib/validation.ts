import { clone } from '../data/defaultDocument.ts'
import { widgetDefinitions } from '../data/widgets.ts'
import { layoutProblems } from './layout.ts'
import { getLayoutTemplate } from '../data/layoutTemplates.ts'
import { layoutFromTemplate } from './templateLayout.ts'
import type { DashboardDocument } from '../types/editor'

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
function text(v: unknown, label: string, max = 120) { check(typeof v === 'string' && v.length <= max, `${label}格式不正确或过长`) }
function finite(v: unknown, label: string, min = 0, max = 1e12) { check(typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max, `${label}超出允许范围`) }
function rows(v: unknown, label: string, max: number): asserts v is Record<string, unknown>[] { check(Array.isArray(v) && v.length <= max && v.every(isObject), `${label}格式不正确或条目过多`) }
export function safeSource(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 2048) return false
  if (/^\/assets\/[\w./-]+$/.test(v) && !v.includes('..')) return true
  if (/^local-media:[\w-]{1,100}$/.test(v)) return true
  try { const url = new URL(v); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password } catch { return false }
}
export const validColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)
function media(v: unknown) {
  check(isObject(v), '素材格式不正确'); text(v.id,'素材标识'); text(v.alt,'素材说明',300)
  check(safeSource(v.src), '素材地址无效，仅支持本地素材或 HTTP/HTTPS 地址')
  check(v.kind === undefined || ['image','video'].includes(String(v.kind)), '素材类型无效')
  check(v.fit === undefined || ['cover','contain'].includes(String(v.fit)), '图片适配方式无效')
}
function noDangerousKeys(v: unknown) {
  if (!v || typeof v !== 'object') return
  for (const [key,value] of Object.entries(v)) { check(!['__proto__','prototype','constructor'].includes(key), '备份包含不支持的属性'); noDangerousKeys(value) }
}

export function validateDocument(input: unknown): DashboardDocument {
  noDangerousKeys(input)
  check(isObject(input) && input.schemaVersion === 1, '配置版本不受支持')
  text(input.name,'大屏名称',80)
  check(typeof input.updatedAt === 'string' && Number.isFinite(Date.parse(input.updatedAt)), '保存时间格式不正确')
  check(typeof input.autoCompact === 'boolean', '自动补位设置无效')
  check(isObject(input.appearance) && validColor(input.appearance.background) && validColor(input.appearance.headingColor), '主题颜色格式不正确')
  rows(input.layout,'模块布局',8)
  const ids = input.layout.map(item => item.id)
  check(ids.length === widgetDefinitions.length && new Set(ids).size === ids.length && ids.every(id => widgetDefinitions.some(d => d.id === id)), '模块列表缺失、重复或包含未知模块')
  check(input.layout.every(item => typeof item.visible === 'boolean' && ['x','y','w','h'].every(key => typeof item[key] === 'number')), '模块布局字段无效')
  const problems = layoutProblems(input.layout as unknown as DashboardDocument['layout'])
  check(!problems.length, problems[0] ?? '布局无效')
  if (input.composition !== undefined) {
    const comp = input.composition
    check(isObject(comp) && typeof comp.templateId === 'string','模板设置无效')
    const template = getLayoutTemplate(comp.templateId)
    check(template && Array.isArray(comp.slots) && comp.slots.length === template.count,'模板或版位数量不正确')
    check(comp.slots.every(id => id === null || widgetDefinitions.some(widget => widget.id === id)),'版位包含未知组件')
    const assigned = comp.slots.filter(id => id !== null)
    check(new Set(assigned).size === assigned.length,'同一组件不能占用多个版位')
    const layout = input.layout
    const expected = layoutFromTemplate(layout as unknown as DashboardDocument['layout'],comp as unknown as NonNullable<DashboardDocument['composition']>)
    check(expected.every((item,index) => ['visible','x','y','w','h'].every(key => item[key as keyof typeof item] === layout[index]![key])),'模板版位与组件布局不一致')
  }
  const c = input.content
  check(isObject(c) && isObject(c.header), '页面内容格式不正确')
  text(c.header.title,'平台标题',30); text(c.header.subtitle,'平台副标题',40); media(c.header.logo)
  check(isObject(c.header.weather), '天气设置无效')
  finite(c.header.weather.temperature,'温度',-60,65); text(c.header.weather.description,'天气',12); text(c.header.weather.airQuality,'空气质量',12)
  for (const id of ['books','readers','searches']) {
    const value = c[id]; check(isObject(value), '排行设置无效'); text(value.title,'模块标题',40); rows(value.items,'排行数据',30)
    if (value.limit !== undefined) finite(value.limit,'展示条数',1,30)
    for (const item of value.items) { text(item.id,'条目标识'); text(item.name,'排行名称',100); finite(item.value,'排行数值'); if (item.color !== undefined) check(validColor(item.color),'排行颜色无效') }
    if (id !== 'searches') text(value.unit,'统计量名称',20)
  }
  check(isObject(c.statistics),'统计设置无效'); text(c.statistics.title,'统计标题',40); rows(c.statistics.items,'统计卡片',4)
  for (const item of c.statistics.items) { text(item.id,'指标标识'); text(item.label,'指标名称',30); finite(item.value,'指标数值'); text(item.unit,'指标单位',8); text(item.note,'指标说明',80) }
  media(c.hero)
  for (const slides of [c.heroSlides, isObject(c.activity) ? c.activity.slides : undefined]) { if (slides !== undefined) { rows(slides,'轮播素材',12); slides.forEach(media) } }
  check(isObject(c.activity) && isObject(c.newBooks) && isObject(c.notices),'展示模块内容缺失')
  text(c.activity.title,'活动标题',40); media(c.activity.image)
  text(c.newBooks.title,'新书标题',40); media(c.newBooks.image)
  check(c.newBooks.mode === undefined || ['image','list'].includes(String(c.newBooks.mode)), '新书展示模式无效')
  if (c.newBooks.items !== undefined) { rows(c.newBooks.items,'新书列表',30); for (const item of c.newBooks.items) { text(item.id,'书目标识'); for (const field of ['title','author','publisher','callNumber','date']) text(item[field],'书目信息',200) } }
  text(c.notices.title,'通知标题',40); media(c.notices.background); rows(c.notices.items,'通知列表',50)
  for (const item of c.notices.items) { text(item.id,'通知标识'); text(item.content,'通知正文',5000) }
  for (const value of [c.heroInterval,c.activity.interval,c.notices.interval]) if (value !== undefined) finite(value,'翻页间隔',3,120)
  if (c.notices.fontSize !== undefined) finite(c.notices.fontSize,'通知字号',22,56)
  return clone(input) as unknown as DashboardDocument
}
