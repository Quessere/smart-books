/** Resolve bundled assets against the deployment base without changing saved media paths. */
export function publicAssetUrl(src: string, base: string): string {
  if (!src.startsWith('/assets/')) return src
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${src.slice(1)}`
}
