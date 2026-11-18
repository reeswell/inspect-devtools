import type { CopyFormat, CopyLineColumn } from '@inspect-devtools/core'
import type { GrabSelection } from '@inspect-devtools/core/browser'

const normalizeCopyMentionPrefix = (prefix: string | undefined): string => {
  if (!prefix)
    return ''
  return prefix.replace(/\\/g, '/').trim().replace(/^@+/, '').replace(/^\/+|\/+$/g, '')
}

const escapeLinkText = (value: string): string => value
  .replaceAll('[', '\\[')
  .replaceAll(']', '\\]')

const escapeLinkDestination = (value: string): string => value
  .replaceAll('[', '\\[')
  .replaceAll(']', '\\]')
  .replaceAll('(', '\\(')
  .replaceAll(')', '\\)')

const isAbsoluteFilePath = (filePath: string): boolean =>
  filePath.startsWith('/') || /^[A-Za-z]:\//.test(filePath)

// Vue inspector paths are relative to the Vite app root. `../` reaches sibling
// packages in a monorepo and has to be resolved before it can match projectRoot.
const resolveAgainstRoot = (filePath: string, root: string): string => {
  const base = root.replace(/\\/g, '/').replace(/\/+$/, '').split('/')
  for (const segment of filePath.split('/')) {
    if (!segment || segment === '.')
      continue
    if (segment === '..') {
      if (base.length > 1)
        base.pop()
      continue
    }
    base.push(segment)
  }
  const resolved = base.join('/')
  return resolved.startsWith('/') || /^[A-Za-z]:/.test(resolved) ? resolved : `/${resolved}`
}

export const resolveMentionFilePath = (
  filePath: string,
  projectRoot?: string,
  sourceRoot?: string,
): string => {
  let normalized = filePath.replace(/\\/g, '/')
  if (sourceRoot && !isAbsoluteFilePath(normalized) && normalized.split('/').includes('..'))
    normalized = resolveAgainstRoot(normalized, sourceRoot)

  const root = projectRoot?.replace(/\\/g, '/').replace(/\/+$/, '')
  if (root && (normalized === root || normalized.startsWith(`${root}/`)))
    return normalized.slice(root.length).replace(/^\/+/, '')
  return normalized
}

const formatLocationSuffix = (selection: GrabSelection, copyLineColumn: CopyLineColumn): string => {
  if (!copyLineColumn || !selection.line)
    return ''

  if (copyLineColumn === 'line')
    return `:${selection.line}`

  return `:${selection.line}${selection.column ? `:${selection.column}` : ''}`
}

export const formatSelectionLocation = (
  selection: GrabSelection,
  format: CopyFormat = 'mention',
  projectRoot?: string,
  copyLineColumn: CopyLineColumn = false,
  copyMentionPrefix = '',
  sourceRoot?: string,
): string | undefined => {
  if (!selection.filePath)
    return undefined

  const filePath = resolveMentionFilePath(selection.filePath, projectRoot, sourceRoot)
  const suffix = formatLocationSuffix(selection, copyLineColumn)

  if (format === 'link') {
    const absolutePath = resolveMentionFilePath(selection.filePath, undefined, sourceRoot)
    const fileName = absolutePath.split('/').filter(Boolean).at(-1) || absolutePath
    return `[${escapeLinkText(`${fileName}${suffix}`)}](${escapeLinkDestination(`${absolutePath}${suffix}`)})`
  }

  const resolvedAbsolute = resolveMentionFilePath(selection.filePath, undefined, sourceRoot)
  const root = projectRoot?.replace(/\\/g, '/').replace(/\/+$/, '')
  const insideProject = Boolean(root && (resolvedAbsolute === root || resolvedAbsolute.startsWith(`${root}/`)))
  const prefix = insideProject ? normalizeCopyMentionPrefix(copyMentionPrefix) : ''
  const mentionPath = prefix ? `${prefix}/${filePath}` : filePath
  return `@${mentionPath}${suffix}`
}

// 只取 pathname + search + hash：框架无关（history/hash 路由均覆盖），origin 在本地开发中是恒定噪音。
// 路由以 "/" 结尾时补一个尾随空格：粘贴进 AI 输入框后光标停在 "/" 上会触发斜杠命令补全
export const formatRouteLocation = (location: Pick<Location, 'pathname' | 'search' | 'hash'>): string => {
  const route = `${location.pathname}${location.search}${location.hash}`
  return `Route: ${route}${route.endsWith('/') ? ' ' : ''}`
}
