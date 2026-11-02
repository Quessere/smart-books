import type { WidgetId, WidgetLayout } from '../types/editor'

export const widgetDefinitions: { id: WidgetId; name: string; description: string; minW: number; minH: number; category: string }[] = [
  { id: 'books', name: '图书借阅排行', description: '热门借阅图书与借阅量', minW: 420, minH: 300, category: '数据展示' },
  { id: 'readers', name: '读者借阅排行', description: '读者借阅柱状图', minW: 360, minH: 260, category: '数据展示' },
  { id: 'statistics', name: '借阅与到馆统计', description: '关键指标与对比信息', minW: 420, minH: 320, category: '数据展示' },
  { id: 'hero', name: '校园主图', description: '图片或视频轮播', minW: 360, minH: 240, category: '内容展示' },
  { id: 'activity', name: '活动展示', description: '活动海报与宣传视频', minW: 320, minH: 300, category: '内容展示' },
  { id: 'searches', name: '检索词云', description: '词频大小与多彩热词', minW: 360, minH: 320, category: '数据展示' },
  { id: 'newBooks', name: '新书通报', description: '书目列表或通报图片', minW: 420, minH: 320, category: '内容展示' },
  { id: 'notices', name: '通知公告', description: '通知正文与自动翻页', minW: 420, minH: 340, category: '内容展示' },
]

export const defaultLayout: WidgetLayout[] = [
  { id: 'books', x: 28, y: 158, w: 642, h: 496, visible: true },
  { id: 'readers', x: 28, y: 654, w: 642, h: 300, visible: true },
  { id: 'statistics', x: 28, y: 954, w: 642, h: 454, visible: true },
  { id: 'hero', x: 712, y: 285, w: 1090, h: 588, visible: true },
  { id: 'activity', x: 712, y: 912, w: 527, h: 496, visible: true },
  { id: 'searches', x: 1279, y: 909, w: 523, h: 499, visible: true },
  { id: 'newBooks', x: 1855, y: 171, w: 688, h: 516, visible: true },
  { id: 'notices', x: 1843, y: 729, w: 688, h: 672, visible: true },
]

export function definition(id: WidgetId) { return widgetDefinitions.find(item => item.id === id)! }
