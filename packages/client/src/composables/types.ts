import type { GrabSelection } from '@inspect-devtools/core/browser'

export interface MarqueeRect {
  left: number
  top: number
  width: number
  height: number
}

export type MarqueeMode = 'replace' | 'add' | 'subtract'

export interface SelectionEntry {
  element: Element
  selection: GrabSelection
}

export interface UseInspectorOptions {
  onInspectStart?: () => void
}

export interface SourceLabelState {
  label: string
  componentName?: string
  hint: string
  canOpen: boolean
  hierarchy?: GrabSelection['hierarchy']
  activeHierarchyIndex: number | null
}
