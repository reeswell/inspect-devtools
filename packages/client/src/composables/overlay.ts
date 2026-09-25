import type { MarqueeRect } from './types'

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
