import type { DashboardDocument } from '../types/editor'
import { validateDocument } from '../lib/validation'
import { loadLocalDocument, saveLocalDocument } from './localRepository'

/** Optional frontend HTTP adapter. Leave the base URL empty until the backend agrees on the contract. */
const apiBase = String(import.meta.env.VITE_DASHBOARD_API_BASE_URL ?? '').replace(/\/$/,'')
export const usesRemoteApi = Boolean(apiBase)
async function request(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`${apiBase}${path}`, { method, credentials: 'include', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`服务暂时不可用（${response.status}），请稍后重试`)
  return response.status === 204 ? undefined : response.json()
}
export async function loadDocument(kind: 'draft' | 'published') {
  if (!usesRemoteApi) return loadLocalDocument(kind)
  const value = await request(`/dashboard/config/${kind}`)
  return value ? validateDocument(value.document ?? value) : undefined
}
export async function saveDocument(kind: 'draft' | 'published', doc: DashboardDocument) {
  if (!usesRemoteApi) return saveLocalDocument(kind,doc)
  await request(kind === 'draft' ? '/dashboard/config/draft' : '/dashboard/config/publish',kind === 'draft' ? 'PUT' : 'POST',{ document: validateDocument(doc) })
}
