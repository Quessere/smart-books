import type { DashboardContent } from './dashboard'

export type WidgetId = 'books' | 'readers' | 'statistics' | 'hero' | 'activity' | 'searches' | 'newBooks' | 'notices'
export interface Rect { x: number; y: number; w: number; h: number }
export interface WidgetLayout extends Rect { id: WidgetId; visible: boolean }
export interface TemplateComposition { templateId: string; slots: (WidgetId | null)[] }
export interface DashboardDocument {
  schemaVersion: 1
  name: string
  updatedAt: string
  content: DashboardContent
  layout: WidgetLayout[]
  appearance: { background: string; headingColor: string }
  autoCompact: boolean
  composition?: TemplateComposition
}
export interface AssetRecord { id: string; blob: Blob; name: string }
export interface Backup { format: 'library-dashboard'; version: 1; document: DashboardDocument; assets: { id: string; name: string; data: string }[] }
export type EditorMode = 'display' | 'edit' | 'preview'
