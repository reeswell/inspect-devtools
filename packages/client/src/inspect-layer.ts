const isOpeningToggle = (event: Event): boolean => {
  const state = (event as Event & { newState?: string }).newState
  return state === 'open'
}

// Dialogs and popovers render in the top layer, above any z-index. Keep the
// overlay in that layer and move it back to the front when another one opens.
export const installInspectLayer = (element: HTMLElement): (() => void) => {
  if (typeof element.showPopover !== 'function')
    return () => {}

  element.setAttribute('popover', 'manual')
  let shown = false

  const hoist = (): void => {
    if (!element.isConnected)
      return
    if (shown)
      element.hidePopover()
    element.showPopover()
    shown = true
  }

  const onToggle = (event: Event): void => {
    if (event.target === element || !isOpeningToggle(event))
      return
    hoist()
  }

  document.addEventListener('toggle', onToggle, true)
  hoist()

  return () => {
    document.removeEventListener('toggle', onToggle, true)
    if (!shown)
      return
    element.hidePopover()
    shown = false
  }
}
