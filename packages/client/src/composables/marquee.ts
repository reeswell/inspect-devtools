import type { GrabSelection, InspectDevtoolsFramework } from '@inspect-devtools/core'
import { collectAllElements, createGrabSelection } from '@inspect-devtools/core/browser'
import { composedContains, getParentOrShadowHost, isDevtoolsElement } from './dom'
import type { MarqueeRect, SelectionEntry } from './types'

export interface MarqueeCollectOptions {
  framework: InspectDevtoolsFramework
  resolveSource: (element: Element) => Partial<GrabSelection>
}

export const collectMarqueeEntries = (
  rect: MarqueeRect,
  { framework, resolveSource }: MarqueeCollectOptions,
): SelectionEntry[] => {
  const right = rect.left + rect.width
  const bottom = rect.top + rect.height
  const matched: SelectionEntry[] = []

  for (const element of collectAllElements(document.body)) {
    if (isDevtoolsElement(element))
      continue
    const bounds = element.getBoundingClientRect()
    if (!bounds.width && !bounds.height)
      continue
    if (bounds.left < rect.left || bounds.right > right || bounds.top < rect.top || bounds.bottom > bottom)
      continue

    const nextSelection = createGrabSelection(element, framework, resolveSource(element))
    if (nextSelection.filePath)
      matched.push({ element, selection: nextSelection })
  }

  // 只保留最内层命中：被其他命中元素包含的容器是祖先而非目标
  const innermost = matched.filter(item =>
    !matched.some(other => other.element !== item.element && composedContains(item.element, other.element)),
  )

  // 高亮框向上提升到同文件最外层祖先（如卡片内层 div → MetricCard 外框）；
  // 护栏：不越过选框边界、不爬到“其他文件命中元素”的共同祖先（避免回到大容器）
  const innerItems = innermost.map(item => ({ element: item.element, filePath: item.selection.filePath! }))
  const entries: SelectionEntry[] = []
  const seenElements = new Set<Element>()
  for (const item of innermost) {
    const filePath = item.selection.filePath!
    let current = item.element
    for (let parent = getParentOrShadowHost(current); parent; parent = getParentOrShadowHost(parent)) {
      if (isDevtoolsElement(parent))
        break
      const bounds = parent.getBoundingClientRect()
      if (bounds.left < rect.left || bounds.right > right || bounds.top < rect.top || bounds.bottom > bottom)
        break
      const parentSelection = createGrabSelection(parent, framework, resolveSource(parent))
      if (parentSelection.filePath !== filePath)
        break
      if (innerItems.some(other => other.element !== current && other.filePath !== filePath && composedContains(parent, other.element)))
        break
      current = parent
    }
    // 每个命中保留独立条目（复制时才按文件去重）；仅折叠提升到同一元素的情况
    if (seenElements.has(current))
      continue
    seenElements.add(current)
    entries.push({ element: current, selection: item.selection })
  }
  return entries
}
