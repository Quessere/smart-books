import { getLayoutTemplate, type TemplateSlot } from '../data/layoutTemplates.ts'
import { widgetDefinitions } from '../data/widgets.ts'
import type { TemplateComposition,WidgetId,WidgetLayout } from '../types/editor'

/** Canonical geometry is owned by the template, never by the selected widget. */
export function layoutFromTemplate(layout: WidgetLayout[], composition: TemplateComposition): WidgetLayout[] {
  const template = getLayoutTemplate(composition.templateId)
  if (!template || composition.slots.length !== template.count) throw new Error('模板或版位数量不正确')
  return layout.map(item => {
    const index = composition.slots.indexOf(item.id)
    if (index < 0) return { ...item,visible: false }
    const { x,y,w,h } = template.slots[index]!
    return { ...item,x,y,w,h,visible: true }
  })
}

function placementCost(id: WidgetId | null,slot: TemplateSlot) {
  if (!id) return 180
  const preference = slot.preferred.indexOf(id)
  const ideal = { hero: 1.75,activity: 1.2,books: 1.4,readers: 1.6,statistics: 1.8,searches: 1.1,newBooks: 1.6,notices: 1.1 }[id]
  const ratio = slot.w / Math.max(200,slot.h-90)
  return (preference < 0 ? 100 : preference*24) + Math.abs(Math.log(ratio/ideal))*22
}

/** Keep content choices, and suggest placements using module type and slot proportions. */
export function compositionForTemplate(templateId: string,layout: WidgetLayout[],previous?: TemplateComposition): TemplateComposition {
  const template = getLayoutTemplate(templateId)
  if (!template) throw new Error('找不到所选模板')
  const count = template.count
  const previousIds = previous?.slots.filter((id): id is WidgetId => id !== null) ?? []
  let pool: (WidgetId | null)[]
  const required = new Set<WidgetId>()
  if (previous && previous.slots.length === count) pool = [...previous.slots]
  else {
    pool = previous ? [...previousIds] : layout.filter(item => item.visible).map(item => item.id)
    if (pool.length < count) {
      pool.forEach(id => { if (id) required.add(id) })
      pool.push(...widgetDefinitions.map(item => item.id).filter(id => !pool.includes(id)))
    }
  }
  // Dynamic programming searches at most 2^8 states; it does not generate random positions.
  let states = new Map<number,{cost: number;slots: (WidgetId | null)[]}>([[0,{cost: 0,slots: []}]])
  for (const slot of template.slots) {
    const next = new Map<number,{cost: number;slots: (WidgetId | null)[]}>()
    for (const [mask,state] of states) pool.forEach((id,index) => {
      if (mask & (1<<index)) return
      const nextMask = mask | (1<<index),cost = state.cost+placementCost(id,slot)
      if (!next.has(nextMask) || cost < next.get(nextMask)!.cost) next.set(nextMask,{cost,slots: [...state.slots,id]})
    })
    states = next
  }
  const best = [...states.values()].sort((a,b) => {
    const score = (state: typeof a) => state.cost+[...required].filter(id => !state.slots.includes(id)).length*10000
    return score(a)-score(b)
  })[0]
  return { templateId,slots: best?.slots ?? Array<null>(count).fill(null) }
}

/** Choosing an occupied component swaps its previous location; duplicates are impossible. */
export function assignTemplateSlot(composition: TemplateComposition,index: number,id: WidgetId | null): TemplateComposition {
  if (!Number.isInteger(index) || index < 0 || index >= composition.slots.length) throw new Error('版位不存在')
  const slots = [...composition.slots],old = slots[index] ?? null
  if (id) { const occupied = slots.indexOf(id); if (occupied >= 0 && occupied !== index) slots[occupied] = old }
  slots[index] = id
  return { ...composition,slots }
}
