import type { CopyFormat } from '@inspect-devtools/core'
import type { GrabSelection } from '@inspect-devtools/core/browser'

const escapeLinkText = (value: string): string => value
  .replaceAll('[', '\\[')
  .replaceAll(']', '\\]')

const escapeLinkDestination = (value: string): string => value
  .replaceAll('[', '\\[')
  .replaceAll(']', '\\]')
  .replaceAll('(', '\\(')
  .replaceAll(')', '\\)')

export const formatSelectionLocation = (selection: GrabSelection, format: CopyFormat = 'codex', projectRoot?: string): string | undefined => {
  if (!selection.filePath)
    return undefined

  const filePath = selection.filePath.replace(/\\/g, '/')
  const fileName = filePath.split('/').filter(Boolean).at(-1) || filePath

  if (format === 'cursor') {
    const root = projectRoot?.replace(/\\/g, '/').replace(/\/+$/, '')
    const relativePath = root && (filePath === root || filePath.startsWith(`${root}/`))
      ? filePath.slice(root.length).replace(/^\/+/, '')
      : filePath
    return `@${relativePath}`
  }
  return `[${escapeLinkText(fileName)}](${escapeLinkDestination(filePath)})`
}
