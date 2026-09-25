export const isDevtoolsElement = (element: EventTarget | null): boolean => {
  if (!(element instanceof Element))
    return false
  return Boolean(element.closest('[data-inspect-devtools="true"]'))
}

export const composedContains = (parent: Element, child: Element): boolean => {
  let current: Node | null = child
  while (current) {
    if (current === parent)
      return true
    if (current instanceof ShadowRoot)
      current = current.host
    else
      current = current.parentNode
  }
  return false
}

export const getParentOrShadowHost = (element: Element): Element | null => {
  if (element.parentElement)
    return element.parentElement
  const root = element.getRootNode?.()
  if (root instanceof ShadowRoot && root.host instanceof Element)
    return root.host
  return null
}

export const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element))
    return false

  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.isContentEditable)
    || Boolean(target.closest('[contenteditable="true"]'))
}

export const getElementDepth = (element: Element): number => {
  let depth = 0
  for (let current = getParentOrShadowHost(element); current; current = getParentOrShadowHost(current))
    depth += 1
  return depth
}
