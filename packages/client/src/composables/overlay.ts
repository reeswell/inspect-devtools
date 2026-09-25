import type { GrabSelection } from '@inspect-devtools/core/browser'
import type { MarqueeRect, SourceLabelState } from './types'
import { formatSourceLabel } from './clipboard'

export const toFrameStyle = (element: Element) => {
  const rect = element.getBoundingClientRect()
  return {
    display: 'block',
    transform: `translate(${rect.left}px, ${rect.top}px)`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  } as const
}

export const toMarqueeStyle = (rect: MarqueeRect | null) => {
  if (!rect)
    return { display: 'none' } as const
  return {
    display: 'block',
    transform: `translate(${rect.left}px, ${rect.top}px)`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  } as const
}

export const computeLabelStyle = (
  element: Element | null,
  hasBreadcrumb: boolean,
) => {
  if (!element)
    return { display: 'none' }

  const rect = element.getBoundingClientRect()
  const labelHeight = hasBreadcrumb ? 64 : 36
  const top = rect.top >= labelHeight + 8
    ? rect.top - labelHeight - 4
    : Math.min(rect.bottom + 4, window.innerHeight - labelHeight - 8)
  const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - 368))
  return {
    display: 'grid',
    transform: `translate(${left}px, ${top}px)`,
  }
}

export const computeSourceLabel = (
  currentSelection: GrabSelection | null,
  options: {
    isInspecting: boolean
    openOnClick: boolean
    activeHierarchyIndex: number | null
  },
): SourceLabelState | null => {
  if (!currentSelection)
    return null

  const isMac = typeof navigator !== 'undefined'
    && (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || '') || /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || ''))
  const modKey = isMac ? 'Cmd' : 'Ctrl'

  let hint = 'Source unresolved'
  if (currentSelection.filePath) {
    if (options.isInspecting) {
      hint = options.openOnClick
        ? 'Click to open in editor'
        : `Click to select · ${modKey}+Click to open`
    }
    else {
      hint = currentSelection.hierarchy && currentSelection.hierarchy.length > 1
        ? 'Click badge or Enter to open in editor · ↑/↓ navigate'
        : 'Click badge to open in editor'
    }
  }

  return {
    label: formatSourceLabel(currentSelection),
    componentName: currentSelection.componentName,
    hint,
    canOpen: Boolean(currentSelection.filePath),
    hierarchy: currentSelection.hierarchy,
    activeHierarchyIndex: options.activeHierarchyIndex,
  }
}

