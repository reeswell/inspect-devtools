import { isEditableTarget } from './dom'

export const getInspectorShortcutAction = (
  event: Partial<Pick<KeyboardEvent, 'altKey' | 'code' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'target'>>,
): 'cancel' | 'toggle' | 'copy-ai-context' | 'copy-visual-crop' | undefined => {
  if (isEditableTarget(event.target ?? null))
    return undefined
  if (event.code === 'Escape')
    return 'cancel'
  if (event.altKey && event.shiftKey && event.code === 'KeyI')
    return 'toggle'

  const isCmdOrCtrl = Boolean(event.metaKey || event.ctrlKey)
  if (isCmdOrCtrl && event.altKey && event.code === 'KeyC')
    return 'copy-ai-context'
  if (isCmdOrCtrl && event.shiftKey && event.code === 'KeyC')
    return 'copy-visual-crop'
}

// Photoshop 惯例：Shift 加选、Alt 减选；同按时加选优先
export const getClickSelectionAction = (
  event: Pick<MouseEvent, 'altKey' | 'shiftKey'>,
): 'add' | 'subtract' | undefined => {
  if (event.shiftKey)
    return 'add'
  if (event.altKey)
    return 'subtract'
}
