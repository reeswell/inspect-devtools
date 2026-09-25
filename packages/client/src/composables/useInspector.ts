import { computed, getCurrentInstance, onUnmounted, shallowRef } from 'vue'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { createGrabSelection, getReactDebugSource, getVueInspectorSource, type GrabSelection } from '@inspect-devtools/core/browser'
import { formatRouteLocation, formatSelectionLocation } from './selection-location'
import { formatEditorProtocolUrl, openViaUrlScheme } from './open-editor'
import { useRpc } from './useRpc'

const isDevtoolsElement = (element: EventTarget | null): boolean => {
  if (!(element instanceof Element))
    return false
  return Boolean(element.closest('[data-inspect-devtools="true"]'))
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

export const getInspectorShortcutAction = (event: Pick<KeyboardEvent, 'altKey' | 'code' | 'shiftKey' | 'target'>): 'cancel' | 'toggle' | undefined => {
  if (isEditableTarget(event.target))
    return undefined
  if (event.code === 'Escape')
    return 'cancel'
  if (event.altKey && event.shiftKey && event.code === 'KeyI')
    return 'toggle'
}

// Photoshop 惯例：Shift 加选、Alt 减选；同按时加选优先
export const getClickSelectionAction = (event: Pick<MouseEvent, 'altKey' | 'shiftKey'>): 'add' | 'subtract' | undefined => {
  if (event.shiftKey)
    return 'add'
  if (event.altKey)
    return 'subtract'
}

const formatSourceLabel = (selection: GrabSelection): string => {
  if (!selection.filePath)
    return selection.componentName || selection.tagName

  const normalized = selection.filePath.replace(/\\/g, '/')
  const srcIndex = normalized.lastIndexOf('/src/')
  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/')
  const displayPath = srcIndex >= 0
    ? normalized.slice(srcIndex + 1)
    : nodeModulesIndex >= 0
      ? normalized.slice(nodeModulesIndex + 1)
      : normalized.split('/').slice(-3).join('/')

  return `${displayPath}${selection.line ? `:${selection.line}` : ''}${selection.column ? `:${selection.column}` : ''}`
}

const copyText = async (text: string): Promise<void> => {
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

interface UseInspectorOptions {
  onInspectStart?: () => void
}

interface MarqueeRect {
  left: number
  top: number
  width: number
  height: number
}

type MarqueeMode = 'replace' | 'add' | 'subtract'

// selections 与 selectedElements 始终等长同序，一条 {element, selection} 对应一个高亮框
interface SelectionEntry {
  element: Element
  selection: GrabSelection
}

const FEEDBACK_TIMEOUT = 2400
const ERROR_TIMEOUT = 3600
const DRAG_THRESHOLD = 4

export const useInspector = (clientOptions: ClientInspectDevtoolsOptions, { onInspectStart }: UseInspectorOptions = {}) => {
  const rpc = useRpc(clientOptions)
  const isInspecting = shallowRef(false)
  const lastError = shallowRef('')
  const feedback = shallowRef('')
  const isOpening = shallowRef(false)
  const selections = shallowRef<GrabSelection[]>([])
  const hoverSelection = shallowRef<GrabSelection | null>(null)
  const hoveredElement = shallowRef<Element | null>(null)
  const selectedElements = shallowRef<Element[]>([])
  const viewportVersion = shallowRef(0)
  const dragStart = shallowRef<{ x: number, y: number } | null>(null)
  const isMarqueeing = shallowRef(false)
  const marqueeRect = shallowRef<MarqueeRect | null>(null)
  const pressedModifiers = shallowRef({ shift: false, alt: false })
  let suppressClick = false

  // 当前修饰键意图：Shift 加选、Alt 减选（与点击行为同规则，Shift 优先）
  const modifierAction = computed<'add' | 'subtract' | null>(() => {
    if (pressedModifiers.value.shift)
      return 'add'
    if (pressedModifiers.value.alt)
      return 'subtract'
    return null
  })

  // 悬浮预览的激活条件：检查模式中；或选区常驻期间按住 Shift/Alt（与点击拦截同规则）
  const hoverPreviewActive = computed(() =>
    isInspecting.value || (modifierAction.value !== null && selections.value.length > 0))

  const syncModifiers = (event: Pick<MouseEvent | KeyboardEvent, 'altKey' | 'shiftKey'>) => {
    if (event.shiftKey !== pressedModifiers.value.shift || event.altKey !== pressedModifiers.value.alt)
      pressedModifiers.value = { shift: event.shiftKey, alt: event.altKey }
  }

  const refreshViewport = () => {
    viewportVersion.value += 1
  }

  let resizeObserver: ResizeObserver | undefined
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      refreshViewport()
    })
  }

  const getEntries = (): SelectionEntry[] =>
    selections.value.map((selection, index) => ({ element: selectedElements.value[index], selection }))

  const setEntries = (entries: SelectionEntry[]) => {
    selectedElements.value = entries.map(entry => entry.element)
    selections.value = entries.map(entry => entry.selection)
    if (resizeObserver) {
      resizeObserver.disconnect()
      for (const entry of entries) {
        if (entry.element instanceof Element)
          resizeObserver.observe(entry.element)
      }
    }
  }

  const getElementDepth = (element: Element) => {
    let depth = 0
    for (let current = element.parentElement; current; current = current.parentElement)
      depth += 1
    return depth
  }

  // 找最内层“是目标或包含目标”的已选条目（兼容框选提升过的外框，点框内任意位置即命中）
  const findRemovalEntryIndex = (target: Element): number => {
    let matchIndex = -1
    let matchDepth = -1
    getEntries().forEach((entry, index) => {
      if (entry.element !== target && !entry.element.contains(target))
        return
      const depth = getElementDepth(entry.element)
      if (depth > matchDepth) {
        matchIndex = index
        matchDepth = depth
      }
    })
    return matchIndex
  }

  const selection = computed(() => selections.value[0] ?? null)
  const activeSelection = computed(() => hoverSelection.value ?? selection.value)

  let feedbackTimer: ReturnType<typeof setTimeout> | undefined
  let errorTimer: ReturnType<typeof setTimeout> | undefined

  const showFeedback = (message: string) => {
    feedback.value = message
    clearTimeout(feedbackTimer)
    if (message)
      feedbackTimer = setTimeout(() => { feedback.value = '' }, FEEDBACK_TIMEOUT)
  }

  const showError = (message: string) => {
    lastError.value = message
    clearTimeout(errorTimer)
    if (message)
      errorTimer = setTimeout(() => { lastError.value = '' }, ERROR_TIMEOUT)
  }

  const clearNotices = () => {
    clearTimeout(feedbackTimer)
    clearTimeout(errorTimer)
    feedback.value = ''
    lastError.value = ''
  }

  const toFrameStyle = (element: Element) => {
    const rect = element.getBoundingClientRect()
    return {
      display: 'block',
      transform: `translate(${rect.left}px, ${rect.top}px)`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    } as const
  }

  // 已提交选择的高亮框；悬停预览单独走 hoverOverlayStyle，多选时互不顶掉
  const overlayStyles = computed(() => {
    viewportVersion.value
    return selectedElements.value.map(toFrameStyle)
  })

  const hoverOverlayStyle = computed(() => {
    viewportVersion.value
    if (!hoverPreviewActive.value)
      return { display: 'none' } as const
    const element = hoveredElement.value
    if (!element)
      return { display: 'none' } as const
    // Alt 悬浮预演减选结果：高亮将被移除的已选条目（可能是提升过的外框），无可移除目标则不显示
    if (modifierAction.value === 'subtract') {
      const index = findRemovalEntryIndex(element)
      return index < 0 ? { display: 'none' } as const : toFrameStyle(selectedElements.value[index])
    }
    if (selectedElements.value.includes(element))
      return { display: 'none' } as const
    return toFrameStyle(element)
  })

  const marqueeStyle = computed(() => {
    const rect = marqueeRect.value
    if (!rect)
      return { display: 'none' } as const
    return {
      display: 'block',
      transform: `translate(${rect.left}px, ${rect.top}px)`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    } as const
  })

  const sourceLabel = computed(() => {
    const currentSelection = activeSelection.value
    if (!currentSelection)
      return null

    let hint = 'Source unresolved'
    if (currentSelection.filePath) {
      if (isInspecting.value) {
        hint = clientOptions.openOnClick ? 'Click to open in editor' : 'Click to copy source'
      }
      else {
        hint = 'Click badge to open in editor'
      }
    }

    return {
      label: formatSourceLabel(currentSelection),
      hint,
      canOpen: Boolean(currentSelection.filePath),
    }
  })

  const labelStyle = computed(() => {
    viewportVersion.value
    const element = hoveredElement.value ?? selectedElements.value[0] ?? null
    if (!element)
      return { display: 'none' }

    const rect = element.getBoundingClientRect()
    const labelHeight = 36
    const top = rect.top >= labelHeight + 8
      ? rect.top - labelHeight - 4
      : Math.min(rect.bottom + 4, window.innerHeight - labelHeight - 8)
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - 368))
    return {
      display: 'grid',
      transform: `translate(${left}px, ${top}px)`,
    }
  })

  const resolveSource = (element: Element) => {
    if (clientOptions.framework === 'react')
      return getReactDebugSource(element)
    return getVueInspectorSource(element)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!isInspecting.value || event.button !== 0 || isDevtoolsElement(event.target))
      return

    event.preventDefault()
    dragStart.value = { x: event.clientX, y: event.clientY }
  }

  const onPointerMove = (event: PointerEvent) => {
    syncModifiers(event)

    if (isDevtoolsElement(event.target))
      return

    // 预览未激活时（未检查且无修饰键意图）不跟踪悬浮，并清掉可能残留的悬浮态
    if (!hoverPreviewActive.value) {
      clearHover()
      return
    }

    if (dragStart.value) {
      const deltaX = event.clientX - dragStart.value.x
      const deltaY = event.clientY - dragStart.value.y
      if (!isMarqueeing.value && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        isMarqueeing.value = true
        hoveredElement.value = null
        hoverSelection.value = null
      }
      if (isMarqueeing.value) {
        marqueeRect.value = {
          left: Math.min(dragStart.value.x, event.clientX),
          top: Math.min(dragStart.value.y, event.clientY),
          width: Math.abs(deltaX),
          height: Math.abs(deltaY),
        }
        return
      }
    }

    if (!(event.target instanceof Element)) {
      hoveredElement.value = null
      hoverSelection.value = null
      return
    }

    hoveredElement.value = event.target
    hoverSelection.value = createGrabSelection(event.target, clientOptions.framework, resolveSource(event.target))
  }

  const openSelectionInEditor = async (currentSelection = selection.value) => {
    if (!currentSelection?.filePath || isOpening.value)
      return

    showError('')
    showFeedback('Opening in editor…')
    isOpening.value = true
    try {
      const protocol = clientOptions.editorProtocol
      if (protocol === 'vscode' || protocol === 'cursor' || protocol === 'webstorm') {
        const url = formatEditorProtocolUrl(protocol, currentSelection.filePath, currentSelection.line, currentSelection.column)
        openViaUrlScheme(url)
        showFeedback(`Opened in ${protocol}`)
        return
      }

      try {
        await rpc.openInEditor(currentSelection.filePath, currentSelection.line, currentSelection.column)
        showFeedback('Opened in editor')
      }
      catch (error) {
        if (protocol === 'auto' && (clientOptions.openInEditor === 'cursor' || clientOptions.openInEditor === 'code' || clientOptions.openInEditor === 'vscode')) {
          const fallbackProto = clientOptions.openInEditor === 'cursor' ? 'cursor' : 'vscode'
          const url = formatEditorProtocolUrl(fallbackProto, currentSelection.filePath, currentSelection.line, currentSelection.column)
          openViaUrlScheme(url)
          showFeedback(`Opened in ${fallbackProto}`)
          return
        }
        throw error
      }
    }
    catch (error) {
      showFeedback('')
      showError(error instanceof Error ? error.message : 'Unable to open file')
    }
    finally { isOpening.value = false }
  }

  const copySelectionLocation = async () => {
    const locations = [...new Set(
      selections.value
        .map(item => formatSelectionLocation(item, clientOptions.copyFormat, clientOptions.projectRoot, clientOptions.copyLineColumn))
        .filter((location): location is string => Boolean(location)),
    )]
    if (!locations.length)
      return

    showError('')
    try {
      // 路由是页面级上下文，整段复制只带一行，放在 @ 引用之前
      const routeLine = clientOptions.copyRoute ? `${formatRouteLocation(window.location)}\n\n` : ''
      await copyText(`${routeLine}${locations.join('\n')}`)
      showFeedback(locations.length > 1 ? `Copied ${locations.length} source locations` : 'Copied source location')
    }
    catch (error) {
      showFeedback('')
      showError(error instanceof Error ? error.message : 'Unable to copy path')
    }
  }

  const clearHover = () => {
    hoveredElement.value = null
    hoverSelection.value = null
  }

  // 加选：已在选择中的元素跳过；复制当前全部引用但不打开编辑器、不退出检查模式
  const addSelectionEntry = async (entry: SelectionEntry) => {
    clearHover()
    if (selectedElements.value.includes(entry.element))
      return
    setEntries([...getEntries(), entry])
    if (!entry.selection.filePath) {
      showFeedback('')
      showError('No source found for this element')
      return
    }
    await copySelectionLocation()
  }

  // 减选：移除命中的已选条目；复制当前全部引用但不打开编辑器、不退出检查模式
  const removeSelectionEntry = async (target: Element) => {
    clearHover()
    const matchIndex = findRemovalEntryIndex(target)
    if (matchIndex < 0)
      return
    setEntries(getEntries().filter((_, index) => index !== matchIndex))
    if (!selections.value.length) {
      showFeedback('Selection cleared')
      return
    }
    await copySelectionLocation()
  }

  const collectMarqueeEntries = (rect: MarqueeRect): SelectionEntry[] => {
    const right = rect.left + rect.width
    const bottom = rect.top + rect.height
    const matched: SelectionEntry[] = []

    for (const element of document.body.querySelectorAll('*')) {
      if (isDevtoolsElement(element))
        continue
      const bounds = element.getBoundingClientRect()
      if (!bounds.width && !bounds.height)
        continue
      if (bounds.left < rect.left || bounds.right > right || bounds.top < rect.top || bounds.bottom > bottom)
        continue

      const nextSelection = createGrabSelection(element, clientOptions.framework, resolveSource(element))
      if (nextSelection.filePath)
        matched.push({ element, selection: nextSelection })
    }

    // 只保留最内层命中：被其他命中元素包含的容器是祖先而非目标
    const innermost = matched.filter(item =>
      !matched.some(other => other.element !== item.element && item.element.contains(other.element)))

    // 高亮框向上提升到同文件最外层祖先（如卡片内层 div → MetricCard 外框）；
    // 护栏：不越过选框边界、不爬到“其他文件命中元素”的共同祖先（避免回到大容器）
    const innerItems = innermost.map(item => ({ element: item.element, filePath: item.selection.filePath! }))
    const entries: SelectionEntry[] = []
    const seenElements = new Set<Element>()
    for (const item of innermost) {
      const filePath = item.selection.filePath!
      let current = item.element
      for (let parent = current.parentElement; parent; parent = parent.parentElement) {
        if (isDevtoolsElement(parent))
          break
        const bounds = parent.getBoundingClientRect()
        if (bounds.left < rect.left || bounds.right > right || bounds.top < rect.top || bounds.bottom > bottom)
          break
        const parentSelection = createGrabSelection(parent, clientOptions.framework, resolveSource(parent))
        if (parentSelection.filePath !== filePath)
          break
        if (innerItems.some(other => other.element !== current && other.filePath !== filePath && parent.contains(other.element)))
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

  const selectElementsInRect = async (rect: MarqueeRect, mode: MarqueeMode) => {
    // 减选是纯几何操作：移除完全落在框内的已选条目，无需解析源码
    if (mode === 'subtract') {
      const right = rect.left + rect.width
      const bottom = rect.top + rect.height
      const remaining = getEntries().filter((entry) => {
        const bounds = entry.element.getBoundingClientRect()
        return bounds.left < rect.left || bounds.right > right || bounds.top < rect.top || bounds.bottom > bottom
      })
      if (remaining.length === selections.value.length)
        return
      setEntries(remaining)
      clearHover()
      if (!selections.value.length) {
        showFeedback('Selection cleared')
        return
      }
      await copySelectionLocation()
      return
    }

    const entries = collectMarqueeEntries(rect)
    if (!entries.length) {
      showFeedback('')
      showError('No source found for these elements')
      return
    }

    if (mode === 'add') {
      const existingElements = new Set(selectedElements.value)
      const fresh = entries.filter(entry => !existingElements.has(entry.element))
      if (!fresh.length) {
        showFeedback('Nothing new to add')
        return
      }
      setEntries([...getEntries(), ...fresh])
      clearHover()
      await copySelectionLocation()
      return
    }

    setEntries(entries)
    isInspecting.value = false
    clearHover()
    await copySelectionLocation()
    // 自动打开只在选择无歧义（恰好解析到一个文件）且 openOnClick 为 true 时发生；多文件交给 source badge 显式打开
    if (clientOptions.openOnClick && new Set(entries.map(entry => entry.selection.filePath)).size === 1)
      await openSelectionInEditor(entries[0].selection)
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragStart.value)
      return

    const rect = marqueeRect.value
    const wasMarqueeing = isMarqueeing.value
    dragStart.value = null
    isMarqueeing.value = false
    marqueeRect.value = null

    if (!wasMarqueeing || !rect)
      return

    event.preventDefault()
    event.stopPropagation()
    suppressClick = true
    const mode: MarqueeMode = event.shiftKey ? 'add' : event.altKey ? 'subtract' : 'replace'
    void selectElementsInRect(rect, mode)
  }

  const openActiveSelectionInEditor = () => openSelectionInEditor(activeSelection.value)

  const onClick = async (event: MouseEvent) => {
    // 拖拽后的那次 click 是框选手势的尾巴：无论是否还在检查模式都要吞掉并阻止页面响应
    if (suppressClick) {
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (isDevtoolsElement(event.target))
      return

    const clickAction = getClickSelectionAction(event)
    // 选区常驻：退出检查模式后只要高亮框还在，Shift/Alt+点击继续加减选；
    // 无修饰键或无选区时不拦截，保留 Shift+点击新开窗口、Alt+点击下载等原生行为
    if (!isInspecting.value && !(clickAction && selections.value.length))
      return

    event.preventDefault()
    event.stopPropagation()

    if (!(event.target instanceof Element))
      return

    if (clickAction === 'add') {
      await addSelectionEntry({
        element: event.target,
        selection: createGrabSelection(event.target, clientOptions.framework, resolveSource(event.target)),
      })
      return
    }
    if (clickAction === 'subtract') {
      await removeSelectionEntry(event.target)
      return
    }

    const nextSelection = createGrabSelection(event.target, clientOptions.framework, resolveSource(event.target))
    setEntries([{ element: event.target, selection: nextSelection }])
    isInspecting.value = false
    clearHover()
    if (!nextSelection.filePath) {
      showFeedback('')
      showError('No source found for this element')
      return
    }
    await copySelectionLocation()
    if (clientOptions.openOnClick)
      await openSelectionInEditor(nextSelection)
  }

  const startInspecting = () => {
    showError('')
    onInspectStart?.()
    isInspecting.value = true
  }

  const stopInspecting = () => {
    isInspecting.value = false
    clearHover()
    dragStart.value = null
    isMarqueeing.value = false
    marqueeRect.value = null
  }

  const clearSelection = () => {
    setEntries([])
    clearNotices()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    syncModifiers(event)
    const action = getInspectorShortcutAction(event)
    if (action === 'cancel' && isInspecting.value) {
      event.preventDefault()
      stopInspecting()
    }
    else if (action === 'cancel' && selections.value.length) {
      event.preventDefault()
      clearSelection()
    }
    if (action === 'toggle') {
      event.preventDefault()
      isInspecting.value ? stopInspecting() : startInspecting()
    }
  }

  const onKeyUp = (event: KeyboardEvent) => {
    syncModifiers(event)
  }

  // 窗口失焦时修饰键状态不可信（如 Alt+Tab），直接复位
  const onWindowBlur = () => {
    pressedModifiers.value = { shift: false, alt: false }
  }

  const dispose = () => {
    clearTimeout(feedbackTimer)
    clearTimeout(errorTimer)
    resizeObserver?.disconnect()
    window.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('pointermove', onPointerMove, true)
    window.removeEventListener('pointerup', onPointerUp, true)
    window.removeEventListener('click', onClick, true)
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('keyup', onKeyUp, true)
    window.removeEventListener('blur', onWindowBlur)
    window.removeEventListener('scroll', refreshViewport, true)
    window.removeEventListener('resize', refreshViewport)
  }

  window.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('pointermove', onPointerMove, true)
  window.addEventListener('pointerup', onPointerUp, true)
  window.addEventListener('click', onClick, true)
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp, true)
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('scroll', refreshViewport, true)
  window.addEventListener('resize', refreshViewport)

  if (getCurrentInstance())
    onUnmounted(dispose)

  return {
    activeSelection,
    hoveredElement,
    isInspecting,
    isMarqueeing,
    labelStyle,
    lastError,
    feedback,
    isOpening,
    copySelectionLocation,
    clearSelection,
    dispose,
    formatSelectionLocation,
    hoverOverlayStyle,
    marqueeStyle,
    modifierAction,
    openSelectionInEditor,
    openActiveSelectionInEditor,
    overlayStyles,
    selection,
    selections,
    sourceLabel,
    startInspecting,
    stopInspecting,
  }
}
