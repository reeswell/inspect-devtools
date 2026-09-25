import { toBlob } from 'html-to-image'

export const findCommonAncestor = (elements: Element[]): HTMLElement | null => {
  if (!elements.length)
    return null
  if (elements.length === 1)
    return elements[0] instanceof HTMLElement ? elements[0] : elements[0].parentElement

  let current: Element | null = elements[0]
  while (current) {
    if (elements.every(el => current!.contains(el)))
      return current instanceof HTMLElement ? current : current.parentElement
    current = current.parentElement
  }
  return document.body
}

export const captureElementToBlob = async (
  target: Element | Element[],
): Promise<Blob | null> => {
  if (typeof window === 'undefined' || typeof document === 'undefined')
    return null

  const elements = Array.isArray(target) ? target : [target]
  if (!elements.length)
    return null

  try {
    const node = elements.length === 1
      ? (elements[0] instanceof HTMLElement ? elements[0] : elements[0].parentElement)
      : findCommonAncestor(elements)

    if (!node)
      return null

    const rawBlob = await toBlob(node, {
      cacheBust: true,
      filter: (child: Node) => {
        if (child instanceof Element && child.hasAttribute('data-inspect-devtools'))
          return false
        return true
      },
    })
    return rawBlob || null
  }
  catch (error) {
    console.error('[inspect-devtools] captureElementToBlob error:', error)
    return null
  }
}

export const copyImageBlobToClipboard = async (
  blob: Blob,
  text?: string,
): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined')
    return false

  try {
    const itemData: Record<string, Blob> = {
      'image/png': blob,
    }
    if (text)
      itemData['text/plain'] = new Blob([text], { type: 'text/plain' })

    try {
      await navigator.clipboard.write([
        new ClipboardItem(itemData),
      ])
      return true
    }
    catch {
      if (text) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        return true
      }
      return false
    }
  }
  catch (error) {
    console.error('[inspect-devtools] copyImageBlobToClipboard error:', error)
    return false
  }
}
