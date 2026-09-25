import type {
  ComponentAIContextSnapshot,
  ComponentHierarchyItem,
  GrabSelection,
} from './types.ts'

export const formatHierarchyChain = (hierarchy?: ComponentHierarchyItem[]): string | undefined => {
  if (!hierarchy || hierarchy.length === 0)
    return undefined
  return hierarchy.map(item => `\`${item.componentName}\``).join(' > ')
}

export const createAIContextSnapshot = (
  _element: Element,
  selection: GrabSelection,
): ComponentAIContextSnapshot => {
  const route = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}${window.location.hash}`
    : '/'

  return {
    componentName: selection.componentName,
    filePath: selection.filePath,
    line: selection.line,
    column: selection.column,
    route,
    hierarchy: selection.hierarchy,
  }
}

export const formatAIContextMarkdown = (snapshot: ComponentAIContextSnapshot): string => {
  const sourceLoc = snapshot.filePath
    ? `@${snapshot.filePath}${snapshot.line ? `:${snapshot.line}${snapshot.column ? `:${snapshot.column}` : ''}` : ''}`
    : ''

  const lines: string[] = []
  if (sourceLoc)
    lines.push(sourceLoc)
  else if (snapshot.componentName)
    lines.push(`<${snapshot.componentName} />`)
  else
    lines.push('Target Component')

  const hierarchyStr = formatHierarchyChain(snapshot.hierarchy)
  if (hierarchyStr)
    lines.push(`Hierarchy: ${hierarchyStr}`)

  if (snapshot.route)
    lines.push(`Route: ${snapshot.route}`)

  return lines.join('\n')
}
