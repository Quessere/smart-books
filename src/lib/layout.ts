import { definition } from '../data/widgets.ts'
import type { Rect, WidgetId, WidgetLayout } from '../types/editor'

export const bounds = { x: 28, y: 158, right: 2543, bottom: 1408 }
export const titleObstacle: Rect = { x: 692, y: 158, w: 1140, h: 88 }
export const snap = (n: number) => Math.round(n / 8) * 8
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w - .5 && a.x + a.w > b.x + .5 && a.y < b.y + b.h - .5 && a.y + a.h > b.y + .5
export const inBounds = (r: Rect) => r.x >= bounds.x && r.y >= bounds.y && r.x + r.w <= bounds.right + .1 && r.y + r.h <= bounds.bottom + .1

export function clampRect(id: WidgetId, r: Rect): Rect {
  const d = definition(id)
  const w = Math.min(bounds.right - bounds.x, Math.max(d.minW, snap(r.w)))
  const h = Math.min(bounds.bottom - bounds.y, Math.max(d.minH, snap(r.h)))
  return { w, h, x: Math.min(bounds.right - w, Math.max(bounds.x, snap(r.x))), y: Math.min(bounds.bottom - h, Math.max(bounds.y, snap(r.y))) }
}

function fits(r: Rect, occupied: Rect[]) { return inBounds(r) && !occupied.some(other => overlaps(r, other)) }
function nearestSpace(r: Rect, occupied: Rect[]): Rect | null {
  if (fits(r, occupied)) return r
  const xs = [...new Set([bounds.x, bounds.right - r.w, r.x, ...occupied.flatMap(o => [o.x + o.w + 16, o.x - r.w - 16])])]
  const ys = [...new Set([bounds.y, bounds.bottom - r.h, r.y, ...occupied.flatMap(o => [o.y + o.h + 16, o.y - r.h - 16])])]
  const candidates = xs.flatMap(x => ys.map(y => ({ ...r, x, y }))).filter(p => fits(p, occupied))
  candidates.sort((a, b) => (a.x-r.x)**2 + (a.y-r.y)**2 - ((b.x-r.x)**2 + (b.y-r.y)**2))
  return candidates[0] ?? null
}

/** A transaction either produces a complete non-overlapping layout or changes nothing. */
export function proposeLayout(layout: WidgetLayout[], id: WidgetId, proposed: Rect): WidgetLayout[] | null {
  const active = layout.find(item => item.id === id)
  if (!active) return null
  const rect = clampRect(id, proposed)
  if (overlaps(rect, titleObstacle)) return null
  const result = layout.map(item => ({ ...item }))
  Object.assign(result.find(item => item.id === id)!, rect)
  const displaced = result.filter(item => item.id !== id && item.visible && overlaps(item, rect))
  const fixed = result.filter(item => item.visible && item.id !== id && !displaced.includes(item))
  const occupied: Rect[] = [titleObstacle, rect, ...fixed]
  for (const item of displaced.sort((a, b) => b.w*b.h - a.w*a.h)) {
    const position = nearestSpace(item, occupied)
    if (!position) return null
    Object.assign(item, position)
    occupied.push(item)
  }
  return result
}

export function compactAfterHide(layout: WidgetLayout[], hidden: WidgetLayout): WidgetLayout[] {
  const result = layout.map(item => ({ ...item }))
  const movable = result.filter(item => item.visible && item.y >= hidden.y + hidden.h - 1 && item.x < hidden.x + hidden.w && item.x + item.w > hidden.x).sort((a,b) => a.y-b.y)
  for (const item of movable) {
    const occupied: Rect[] = [titleObstacle, ...result.filter(other => other.visible && other.id !== item.id)]
    const ys = [hidden.y, ...occupied.map(o => o.y+o.h+16)].filter(y => y >= hidden.y && y < item.y).sort((a,b) => a-b)
    for (const y of ys) { const candidate = { ...item, y }; if (fits(candidate, occupied)) { item.y = y; break } }
  }
  return result
}

export function arrangeLayout(layout: WidgetLayout[]): WidgetLayout[] {
  const visible = layout.filter(item => item.visible)
  if (!visible.length) return layout.map(item => ({ ...item }))
  const columns = visible.length === 1 ? 1 : visible.length <= 4 ? 2 : 3
  const rows = Math.ceil(visible.length / columns)
  const gap = 24, y = 272
  const w = Math.floor((bounds.right - bounds.x - gap * (columns - 1)) / columns)
  const h = Math.floor((bounds.bottom - y - gap * (rows - 1)) / rows)
  let index = 0
  return layout.map(item => item.visible ? { ...item, x: bounds.x + (index % columns) * (w + gap), y: y + Math.floor(index++ / columns) * (h + gap), w, h } : { ...item })
}

export function layoutProblems(layout: WidgetLayout[]): string[] {
  const problems: string[] = []
  for (const item of layout) {
    const d = definition(item.id)
    if (![item.x,item.y,item.w,item.h].every(Number.isFinite) || item.w < d.minW || item.h < d.minH || !inBounds(item)) problems.push(`${d.name}的尺寸或位置无效`)
    if (item.visible && overlaps(item, titleObstacle)) problems.push(`${d.name}遮挡了顶部预留区域`)
  }
  const visible = layout.filter(item => item.visible)
  visible.forEach((a,i) => visible.slice(i+1).forEach(b => { if (overlaps(a,b)) problems.push(`${definition(a.id).name}与${definition(b.id).name}重叠`) }))
  return problems
}
