export interface TransformResult {
  code: string
  map?: unknown
}

const SVELTE_RE = /\.svelte$/
const HTML_TAG_RE = /<([a-z][a-z0-9-]*)([\s>])/gi

export const transformSvelteInspectorSource = (code: string, id: string): TransformResult | undefined => {
  const [filename] = id.split('?', 2)
  if (!SVELTE_RE.test(filename) || filename.includes('/node_modules/'))
    return undefined

  const componentName = filename.split('/').pop()?.replace(/\.svelte$/, '')
  if (!componentName)
    return undefined

  let transformed = false
  const newCode = code.replace(HTML_TAG_RE, (match, tag, after) => {
    if (match.includes('data-inspect-devtools-source'))
      return match

    transformed = true
    return `<${tag} data-inspect-devtools-component="${componentName}" data-inspect-devtools-source="${filename}"${after}`
  })

  if (!transformed)
    return undefined

  return { code: newCode }
}
