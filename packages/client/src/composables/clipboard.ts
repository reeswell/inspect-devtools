import type { ComponentAIContextSnapshot, GrabSelection } from '@inspect-devtools/core'
import { formatAIContextMarkdown } from '@inspect-devtools/core/browser'

export const formatSourceLabel = (selection: GrabSelection): string => {
  const componentPrefix = selection.componentName ? `<${selection.componentName}> ` : ''

  if (!selection.filePath)
    return componentPrefix ? `<${selection.componentName}>` : selection.tagName

  const normalized = selection.filePath.replace(/\\/g, '/')
  const srcIndex = normalized.lastIndexOf('/src/')
  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/')
  const displayPath = srcIndex >= 0
    ? normalized.slice(srcIndex + 1)
    : nodeModulesIndex >= 0
      ? normalized.slice(nodeModulesIndex + 1)
      : normalized.split('/').slice(-3).join('/')

  return `${componentPrefix}${displayPath}${selection.line ? `:${selection.line}` : ''}${selection.column ? `:${selection.column}` : ''}`
}

export const copyText = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy'))
      throw new Error('Copy command was not accepted')
  }
  finally {
    textarea.remove()
  }
}

export const copyAIContext = async (snapshot: ComponentAIContextSnapshot): Promise<void> => {
  const markdown = formatAIContextMarkdown(snapshot)
  await copyText(markdown)
}

