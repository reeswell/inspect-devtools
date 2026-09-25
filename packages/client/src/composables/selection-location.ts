import type { CopyFormat, CopyLineColumn } from '@inspect-devtools/core'
import type { GrabSelection } from '@inspect-devtools/core/browser'

const escapeLinkText = (value: string): string => value
  .replaceAll('[', '\\[')
  .replaceAll(']', '\\]')

const escapeLinkDestination = (value: string): string => value
  .replaceAll('[', '\\[')
  .replaceAll(']', '\\]')
  .replaceAll('(', '\\(')
  .replaceAll(')', '\\)')

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
): string | undefined => {
  if (!selection.filePath)
    return undefined

  const filePath = selection.filePath.replace(/\\/g, '/')
  const suffix = formatLocationSuffix(selection, copyLineColumn)

  if (format === 'link') {
    const fileName = filePath.split('/').filter(Boolean).at(-1) || filePath
    return `[${escapeLinkText(`${fileName}${suffix}`)}](${escapeLinkDestination(`${filePath}${suffix}`)})`
  }

  const root = projectRoot?.replace(/\\/g, '/').replace(/\/+$/, '')
  const relativePath = root && (filePath === root || filePath.startsWith(`${root}/`))
    ? filePath.slice(root.length).replace(/^\/+/, '')
    : filePath
  return `@${relativePath}${suffix}`
}

// 只取 pathname + search + hash：框架无关（history/hash 路由均覆盖），origin 在本地开发中是恒定噪音。
// 路由以 "/" 结尾时补一个尾随空格：粘贴进 AI 输入框后光标停在 "/" 上会触发斜杠命令补全
export const formatRouteLocation = (location: Pick<Location, 'pathname' | 'search' | 'hash'>): string => {
  const route = `${location.pathname}${location.search}${location.hash}`
  return `Route: ${route}${route.endsWith('/') ? ' ' : ''}`
}
