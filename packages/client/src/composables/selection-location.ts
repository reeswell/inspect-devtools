import type { GrabSelection } from '@inspect-devtools/core/browser'

export const formatSelectionLocation = (selection: GrabSelection, projectRoot?: string): string | undefined => {
  if (!selection.filePath)
    return undefined

  const filePath = selection.filePath.replace(/\\/g, '/')
  const root = projectRoot?.replace(/\\/g, '/').replace(/\/+$/, '')
  const relativePath = root && (filePath === root || filePath.startsWith(`${root}/`))
    ? filePath.slice(root.length).replace(/^\/+/, '')
    : filePath
  return `@${relativePath}`
}
