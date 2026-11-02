import { mockDashboard } from './mockDashboard.ts'
import { defaultLayout } from './widgets.ts'
import type { DashboardDocument } from '../types/editor'

export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
export function createDefaultDocument(): DashboardDocument {
  const content = clone(mockDashboard)
  content.books.limit = 5
  content.readers.limit = 3
  content.searches.limit = 24
  content.heroInterval = 8
  content.activity.interval = 8
  content.notices.interval = 12
  content.notices.fontSize = 40
  content.newBooks.mode = 'image'
  content.newBooks.items = [
    { id: 'new-1', title: '中国特色建筑.2025', author: '中国城市科学研究会', publisher: '中国建筑工业出版社', callNumber: 'TU18/36', date: '2026-09-23' },
    { id: 'new-2', title: '软件项目管理理论体验式教程', author: '张大斌 等', publisher: '清华大学出版社', callNumber: 'TP311.52/173', date: '2026-09-23' },
    { id: 'new-3', title: '移动通信关键技术与应用', author: '张铁军 等', publisher: '清华大学出版社', callNumber: 'TN929.5/246', date: '2026-09-23' },
    { id: 'new-4', title: 'Python算法从入门到项目实践', author: '刘文杰 等', publisher: '清华大学出版社', callNumber: 'TP312.8/212', date: '2026-09-23' },
    { id: 'new-5', title: '大模型时代：行业大模型构建及关键技术解析', author: '王琼 等', publisher: '机械工业出版社', callNumber: 'TP18/1157', date: '2026-09-23' },
  ]
  return { schemaVersion: 1, name: '图书馆综合展示', updatedAt: new Date().toISOString(), content, layout: clone(defaultLayout), appearance: { background: '#cbe2fd', headingColor: '#0f6103' }, autoCompact: true }
}
