import type { AssetRecord, Backup, DashboardDocument } from '../types/editor'
import { validateDocument } from '../lib/validation.ts'

let database: Promise<IDBDatabase> | undefined
function openDatabase() {
  return database ??= new Promise<IDBDatabase>((resolve,reject) => {
    const request = indexedDB.open('library-dashboard-editor',1)
    request.onupgradeneeded = () => { const db = request.result; db.createObjectStore('documents'); db.createObjectStore('assets',{ keyPath: 'id' }) }
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined }; resolve(request.result) }
    request.onerror = () => { database = undefined; reject(new Error('浏览器存储不可用，请检查是否允许此页面保存数据')) }
    request.onblocked = () => reject(new Error('存储更新被其他页面占用，请关闭旧的大屏页面后重试'))
  })
}
async function read<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDatabase()
  return new Promise((resolve,reject) => { const request = db.transaction(store,'readonly').objectStore(store).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('读取本地数据失败')) })
}
async function write(store: string, value: unknown, key?: string) {
  const db = await openDatabase()
  return new Promise<void>((resolve,reject) => {
    const tx = db.transaction(store,'readwrite')
    if (key === undefined) tx.objectStore(store).put(value); else tx.objectStore(store).put(value,key)
    tx.oncomplete = () => resolve()
    tx.onerror = tx.onabort = () => reject(new Error(tx.error?.name === 'QuotaExceededError' ? '浏览器存储空间不足，请减少视频或大图片后重试' : '保存失败，当前修改仍保留在编辑器中，请重试'))
  })
}
export async function loadLocalDocument(kind: 'draft' | 'published') { const value = await read<DashboardDocument>('documents',kind); return value ? validateDocument(value) : undefined }
export async function saveLocalDocument(kind: 'draft' | 'published', doc: DashboardDocument) { await write('documents',validateDocument(doc),kind) }
export async function addLocalAsset(file: File): Promise<string> {
  const allowed = ['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm']
  if (!allowed.includes(file.type)) throw new Error('请选择 PNG、JPG、WebP、GIF 图片或 MP4、WebM 视频')
  if (file.size > (file.type.startsWith('video/') ? 30 : 6) * 1024 * 1024) throw new Error(file.type.startsWith('video/') ? '视频请控制在 30 MB 以内' : '图片请控制在 6 MB 以内')
  const id = crypto.randomUUID()
  await write('assets',{ id, blob: file, name: file.name } satisfies AssetRecord)
  return `local-media:${id}`
}
export function getLocalAsset(id: string) { return read<AssetRecord>('assets',id.replace('local-media:','')) }
function assetIds(doc: DashboardDocument) { return [...new Set(JSON.stringify(doc).match(/local-media:[\w-]+/g) ?? [])] }
function dataUrl(blob: Blob) { return new Promise<string>((resolve,reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error('素材读取失败')); r.readAsDataURL(blob) }) }
export async function makeBackup(doc: DashboardDocument): Promise<Backup> {
  const assets = await Promise.all(assetIds(doc).map(async src => { const asset = await getLocalAsset(src); if (!asset) throw new Error('部分本地素材已丢失，请重新上传后导出'); return { id: asset.id, name: asset.name, data: await dataUrl(asset.blob) } }))
  return { format: 'library-dashboard', version: 1, document: validateDocument(doc), assets }
}
export async function readBackup(file: File): Promise<DashboardDocument> {
  if (file.size > 80 * 1024 * 1024) throw new Error('备份文件不能超过 80 MB')
  let backup: Backup
  try { backup = JSON.parse(await file.text()) } catch { throw new Error('无法读取备份，请选择导出的大屏 JSON 文件') }
  if (backup?.format !== 'library-dashboard' || backup.version !== 1 || !Array.isArray(backup.assets) || backup.assets.length > 40) throw new Error('不是受支持的大屏备份文件')
  const doc = validateDocument(backup.document)
  const references = assetIds(doc)
  const imported = new Map<string,string>()
  const prepared: AssetRecord[] = []
  for (const asset of backup.assets) {
    if (!asset || typeof asset.id !== 'string' || !/^[\w-]{1,100}$/.test(asset.id) || typeof asset.data !== 'string' || asset.data.length > 42*1024*1024 || typeof asset.name !== 'string') throw new Error('备份素材格式无效')
    const match = /^data:(image\/(?:png|jpeg|webp|gif)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)$/.exec(asset.data)
    if (!match || imported.has(`local-media:${asset.id}`)) throw new Error('备份包含不支持或重复的素材')
    const binary = atob(match[2]!), bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    const id = crypto.randomUUID()
    prepared.push({ id, name: asset.name.slice(0,200), blob: new Blob([bytes],{ type: match[1] }) })
    imported.set(`local-media:${asset.id}`,`local-media:${id}`)
  }
  if (references.some(src => !imported.has(src))) throw new Error('备份缺少所引用的素材，请重新导出完整备份')
  for (const asset of prepared) await write('assets',asset)
  // New IDs prevent an import from silently replacing assets in the published screen.
  return validateDocument(JSON.parse(JSON.stringify(doc).replace(/local-media:[\w-]+/g, src => imported.get(src) ?? src)))
}
