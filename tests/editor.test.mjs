import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { createDefaultDocument, clone } from '../src/data/defaultDocument.ts'
import { arrangeLayout, clampRect, compactAfterHide, layoutProblems, proposeLayout, titleObstacle, overlaps } from '../src/lib/layout.ts'
import { safeSource, validateDocument } from '../src/lib/validation.ts'
import { addLocalAsset, getLocalAsset, loadLocalDocument, makeBackup, readBackup, saveLocalDocument } from '../src/services/localRepository.ts'
import { layoutTemplates } from '../src/data/layoutTemplates.ts'
import { assignTemplateSlot,compositionForTemplate,layoutFromTemplate } from '../src/lib/templateLayout.ts'
import { publicAssetUrl } from '../src/lib/publicAsset.ts'

// FileReader is a browser API; retain real Blob bytes in the Node storage test.
globalThis.FileReader = class {
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`; this.onload?.() },() => this.onerror?.()) }
}
test('bundled assets work at the root and under a GitHub Pages project path', () => {
  const asset = '/assets/figma/campus-spring.png'
  assert.equal(publicAssetUrl(asset, '/'), asset)
  assert.equal(publicAssetUrl(asset, '/smart-books/'), '/smart-books/assets/figma/campus-spring.png')
  assert.equal(publicAssetUrl(asset, '/smart-books'), '/smart-books/assets/figma/campus-spring.png')
  assert.equal(publicAssetUrl('https://example.org/image.png', '/smart-books/'), 'https://example.org/image.png')
  assert.equal(publicAssetUrl('local-media:sample', '/smart-books/'), 'local-media:sample')
})
test('default document and every auto-arrangement of the eight modules are valid', () => {
  assert.deepEqual(layoutProblems(createDefaultDocument().layout),[])
  assert.equal(validateDocument(createDefaultDocument()).content.searches.limit,24)
  for (let mask=0;mask<256;mask++) {
    const layout = createDefaultDocument().layout.map((item,i) => ({ ...item,visible: Boolean(mask & (1<<i)) }))
    assert.deepEqual(layoutProblems(arrangeLayout(layout)),[],`visibility mask ${mask}`)
  }
})
test('resize clamps minimum dimensions and bounds, rejects title overlap without mutating', () => {
  const doc = createDefaultDocument(), before = clone(doc.layout)
  const clamped = clampRect('searches',{x:-100,y:9999,w:1,h:1})
  assert.equal(clamped.w,360); assert.equal(clamped.h,320); assert.equal(clamped.x,28); assert.equal(clamped.y+clamped.h,1408)
  assert.equal(proposeLayout(doc.layout,'searches',titleObstacle),null)
  assert.deepEqual(doc.layout,before)
})
test('collision transaction relocates neighbors, failure preserves source layout', () => {
  const layout = createDefaultDocument().layout.map(item => ({ ...item,visible: ['searches','hero'].includes(item.id) }))
  const result = proposeLayout(layout,'searches',{x:720,y:400,w:600,h:500})
  assert.ok(result); assert.deepEqual(layoutProblems(result),[])
  assert.ok(!overlaps(result.find(x=>x.id==='hero'),result.find(x=>x.id==='searches')))
  const original = createDefaultDocument().layout, copy = clone(original)
  assert.equal(proposeLayout(original,'hero',{x:28,y:272,w:2515,h:1136}),null)
  assert.deepEqual(original,copy)
})
test('hiding a module compacts its column and showing it can produce a valid layout', () => {
  const doc = createDefaultDocument(), hidden = doc.layout.find(x=>x.id==='books')
  hidden.visible = false
  const result = compactAfterHide(doc.layout,hidden)
  assert.equal(result.find(x=>x.id==='readers').y,158)
  assert.deepEqual(layoutProblems(result),[])
  result.find(x=>x.id==='books').visible = true
  const restored = proposeLayout(result,'books',hidden) ?? arrangeLayout(result)
  assert.deepEqual(layoutProblems(restored),[])
})
test('invalid imports reject unsafe URLs, numbers, layout and prototype properties', () => {
  for (const url of ['javascript:alert(1)','data:text/html,a','/assets/../secret','https://user:pw@example.org/a']) assert.equal(safeSource(url),false)
  assert.equal(safeSource('https://example.org/image.png'),true)
  for (const mutate of [d=>d.content.searches.items[0].value=-1,d=>d.layout[0].w=NaN,d=>d.layout[1].y=d.layout[0].y+1,d=>d.appearance.background='red']) {
    const doc = createDefaultDocument(); mutate(doc); assert.throws(()=>validateDocument(doc))
  }
  const dangerous = JSON.parse(JSON.stringify(createDefaultDocument()).replace('"schemaVersion":1','"schemaVersion":1,"__proto__":{}'))
  assert.throws(()=>validateDocument(dangerous))
})
test('draft persistence is separate from publication and rejects invalid overwrites', async () => {
  const doc = createDefaultDocument()
  await saveLocalDocument('published',doc)
  const draft = clone(doc); draft.content.searches.items[0].name='本地草稿词'
  await saveLocalDocument('draft',draft)
  assert.equal((await loadLocalDocument('draft')).content.searches.items[0].name,'本地草稿词')
  assert.equal((await loadLocalDocument('published')).content.searches.items[0].name,'人工智能')
  draft.layout[0].w=1
  await assert.rejects(saveLocalDocument('draft',draft))
  assert.equal((await loadLocalDocument('draft')).content.searches.items[0].name,'本地草稿词')
})
test('portable backup includes assets and imports fresh IDs without replacing published bytes', async () => {
  const doc = createDefaultDocument()
  const source = new File([Uint8Array.from([137,80,78,71,1,2,3])],'sample.png',{type:'image/png'})
  doc.content.hero.src = await addLocalAsset(source)
  const backup = await makeBackup(doc)
  assert.equal(backup.assets.length,1)
  const restored = await readBackup(new File([JSON.stringify(backup)],'backup.json'))
  assert.notEqual(restored.content.hero.src,doc.content.hero.src)
  const original = await getLocalAsset(doc.content.hero.src), imported = await getLocalAsset(restored.content.hero.src)
  assert.deepEqual(await imported.blob.arrayBuffer(),await original.blob.arrayBuffer())
  backup.assets=[]
  await assert.rejects(readBackup(new File([JSON.stringify(backup)],'missing.json')),/缺少/)
  await assert.rejects(readBackup(new File(['{}'],'invalid.json')),/不受支持|不是受支持/)
  await assert.rejects(addLocalAsset(new File(['x'],'script.svg',{type:'image/svg+xml'})))
})

test('15 fixed templates have three variants per count and valid geometry for every widget', () => {
  assert.equal(new Set(layoutTemplates.map(t=>t.id)).size,15)
  for (const n of [2,3,4,5,6]) assert.equal(layoutTemplates.filter(t=>t.count===n).length,3)
  for (const template of layoutTemplates) {
    const doc = createDefaultDocument(),before = clone(doc.layout)
    doc.composition=compositionForTemplate(template.id,doc.layout)
    doc.layout=layoutFromTemplate(doc.layout,doc.composition)
    assert.equal(doc.layout.filter(item=>item.visible).length,template.count)
    assert.deepEqual(layoutProblems(doc.layout),[],template.id)
    validateDocument(doc)
    assert.deepEqual(before,createDefaultDocument().layout)
    for (const slot of template.slots) for (const item of doc.layout) {
      const single = before.map(widget=>({...widget,...(widget.id===item.id ? {x:slot.x,y:slot.y,w:slot.w,h:slot.h} : {}),visible:widget.id===item.id}))
      assert.deepEqual(layoutProblems(single),[],`${template.id} ${item.id}`)
    }
  }
})
test('every visibility subset can enter any fixed template, keeping selected components when capacity grows', () => {
  for (let mask=0;mask<256;mask++) for (const template of layoutTemplates) {
    const original=createDefaultDocument().layout.map((item,i)=>({...item,visible:Boolean(mask&(1<<i))}))
    const comp=compositionForTemplate(template.id,original), result=layoutFromTemplate(original,comp)
    assert.deepEqual(layoutProblems(result),[])
    assert.equal(new Set(comp.slots).size,template.count)
    if (original.filter(x=>x.visible).length<=template.count) for (const item of original.filter(x=>x.visible)) assert.ok(comp.slots.includes(item.id))
  }
})
test('replacing or swapping components never changes template slot positions, and empty slots survive variant changes', () => {
  const doc=createDefaultDocument(),comp=compositionForTemplate('three-left',doc.layout)
  const swapped=assignTemplateSlot(comp,0,comp.slots[1])
  assert.equal(swapped.slots[1],comp.slots[0]); assert.equal(swapped.slots[0],comp.slots[1])
  const layout=layoutFromTemplate(doc.layout,swapped)
  const template=layoutTemplates.find(t=>t.id==='three-left')
  for (const [index,id] of swapped.slots.entries()) {
    const item=layout.find(item=>item.id===id),slot=template.slots[index]
    assert.deepEqual([item.x,item.y,item.w,item.h],[slot.x,slot.y,slot.w,slot.h])
  }
  const empty=assignTemplateSlot(swapped,1,null),changed=compositionForTemplate('three-right',layout,empty)
  assert.equal(changed.slots.filter(x=>x===null).length,1)
  assert.deepEqual(changed.slots.filter(Boolean).sort(),empty.slots.filter(Boolean).sort())
  assert.throws(()=>assignTemplateSlot(comp,7,'hero'))
})
test('template validation rejects unknown, duplicated and mismatched slots and preserves template backups', async () => {
  const doc=createDefaultDocument();doc.composition=compositionForTemplate('six-dashboard',doc.layout);doc.layout=layoutFromTemplate(doc.layout,doc.composition)
  for (const mutate of [d=>d.composition.templateId='unknown',d=>d.composition.slots.pop(),d=>d.composition.slots[1]=d.composition.slots[0],d=>d.layout.find(x=>x.visible).x+=8]) {
    const broken=clone(doc);mutate(broken);assert.throws(()=>validateDocument(broken))
  }
  const backup=await makeBackup(doc),restored=await readBackup(new File([JSON.stringify(backup)],'template-backup.json'))
  assert.deepEqual(restored.composition,doc.composition)
  assert.deepEqual(restored.layout,doc.layout)
})
