import { isEditableTarget } from './dom'

export const getInspectorShortcutAction = (
  event: Pick<KeyboardEvent, 'altKey' | 'code' | 'shiftKey' | 'target'>,
): 'cancel' | 'toggle' | undefined => {
  if (isEditableTarget(event.target))
    return undefined
  if (event.code === 'Escape')
    return 'cancel'
  if (event.altKey && event.shiftKey && event.code === 'KeyI')
    return 'toggle'
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
