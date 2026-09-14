import type { GrabSelection } from '@inspect-devtools/core/browser'

export const formatSelectionLocation = (selection: GrabSelection): string | undefined => {
  if (!selection.filePath)
    return undefined

  return `${selection.filePath}${selection.line ? `:${selection.line}` : ''}${selection.column ? `:${selection.column}` : ''}`
}
