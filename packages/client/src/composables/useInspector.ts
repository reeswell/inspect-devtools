import { computed, getCurrentInstance, onUnmounted, shallowRef } from 'vue'
import type { ClientInspectDevtoolsOptions, GrabSelection } from '@inspect-devtools/core'
import {
  createAIContextSnapshot,
  createGrabSelection,
  getComponentRootElements,
  getEventTargetElement,
  getReactDebugSource,
  getSvelteSource,
  getVueInspectorSource,
} from '@inspect-devtools/core/browser'
import { formatRouteLocation, formatSelectionLocation } from './selection-location'
import { formatEditorProtocolUrl, openViaUrlScheme } from './open-editor'
import { useRpc } from './useRpc'
import { DRAG_THRESHOLD, ERROR_TIMEOUT, FEEDBACK_TIMEOUT } from './constants'
import type { MarqueeMode, MarqueeRect, SelectionEntry, UseInspectorOptions } from './types'
import { composedContains, getElementDepth, isDevtoolsElement, isEditableTarget } from './dom'
import { collectMarqueeEntries } from './marquee'
import { getClickSelectionAction, getInspectorShortcutAction } from './keyboard'
import { copyAIContext, copyText } from './clipboard'
import { computeLabelStyle, computeSourceLabel, toFrameStyle, toMarqueeStyle } from './overlay'
import { captureElementToBlob, copyImageBlobToClipboard } from './visualCrop'

export { composedContains, getParentOrShadowHost, isDevtoolsElement, isEditableTarget } from './dom'
export { getClickSelectionAction, getInspectorShortcutAction } from './keyboard'
export type { MarqueeMode, MarqueeRect, SelectionEntry, UseInspectorOptions } from './types'

export const useInspector = (
  clientOptions: ClientInspectDevtoolsOptions,
  { onInspectStart }: UseInspectorOptions = {},
) => {
  const rpc = useRpc(clientOptions)
  const isInspecting = shallowRef(false)
  const isHoldInspecting = shallowRef(false)
  const lastError = shallowRef('')
  const feedback = shallowRef('')
  const isOpening = shallowRef(false)
  const selections = shallowRef<GrabSelection[]>([])
  const hoverSelection = shallowRef<GrabSelection | null>(null)
  const hoveredElement = shallowRef<Element | null>(null)
  const selectedElements = shallowRef<Element[]>([])
  const activeHierarchyIndex = shallowRef<number | null>(null)
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
    const isSingleComponent = entries.length >= 1 && entries.every(e =>
      e.selection.filePath === entries[0].selection.filePath
      && e.selection.componentName === entries[0].selection.componentName,
    )
    if (isSingleComponent && entries[0].selection.hierarchy?.length) {
      const h = entries[0].selection.hierarchy
      const matchIdx = h.findIndex(
        item => item.componentName === entries[0].selection.componentName
          && (!item.filePath || item.filePath === entries[0].selection.filePath),
      )
      activeHierarchyIndex.value = matchIdx >= 0 ? matchIdx : h.length - 1
    }
    else {
      activeHierarchyIndex.value = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      for (const entry of entries) {
        if (entry.element instanceof Element)
          resizeObserver.observe(entry.element)
      }
    }
  }

  // 找最内层“是目标或包含目标”的已选条目（兼容框选提升过的外框，点框内任意位置即命中）
  const findRemovalEntryIndex = (target: Element): number => {
    let matchIndex = -1
    let matchDepth = -1
    getEntries().forEach((entry, index) => {
      if (entry.element !== target && !composedContains(entry.element, target))
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
  const selectionCount = computed(() => {
    return new Set(
      selections.value
        .map(s => `${s.filePath || ''}:${s.line || ''}:${s.column || ''}:${s.componentName || ''}`)
        .filter(Boolean),
    ).size || selections.value.length
  })

  let feedbackTimer: ReturnType<typeof setTimeout> | undefined
  let errorTimer: ReturnType<typeof setTimeout> | undefined

  const showFeedback = (message: string) => {
    feedback.value = message
    clearTimeout(feedbackTimer)
    if (message) feedbackTimer = setTimeout(() => { feedback.value = '' }, FEEDBACK_TIMEOUT)
  }

  const showError = (message: string) => {
    lastError.value = message
    clearTimeout(errorTimer)
    if (message) errorTimer = setTimeout(() => { lastError.value = '' }, ERROR_TIMEOUT)
  }

  const clearNotices = () => {
    clearTimeout(feedbackTimer)
    clearTimeout(errorTimer)
    feedback.value = ''
    lastError.value = ''
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
    viewportVersion.value
    return toMarqueeStyle(marqueeRect.value)
  })

  const sourceLabel = computed(() =>
    computeSourceLabel(activeSelection.value, {
      isInspecting: isInspecting.value,
      openOnClick: clientOptions.openOnClick,
      activeHierarchyIndex: activeHierarchyIndex.value,
    }),
  )


  const labelStyle = computed(() => {
    viewportVersion.value
    const element = hoveredElement.value ?? selectedElements.value[0] ?? null
    const hasBreadcrumb = !isInspecting.value && (activeSelection.value?.hierarchy?.length ?? 0) > 1
    return computeLabelStyle(element, hasBreadcrumb)
  })

  const resolveSource = (element: Element) => {
    if (clientOptions.framework === 'react')
      return getReactDebugSource(element)
    if (clientOptions.framework === 'svelte')
      return getSvelteSource(element)
    return getVueInspectorSource(element)
  }

  const onPointerDown = (event: PointerEvent) => {
    const target = getEventTargetElement(event)
    if (!isInspecting.value || event.button !== 0 || isDevtoolsElement(target))
      return

    event.preventDefault()
    dragStart.value = { x: event.clientX, y: event.clientY }
  }

  const onPointerMove = (event: PointerEvent) => {
    syncModifiers(event)
    const target = getEventTargetElement(event)

    if (isDevtoolsElement(target))
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

    if (!(target instanceof Element)) {
      hoveredElement.value = null
      hoverSelection.value = null
      return
    }

    hoveredElement.value = target
    hoverSelection.value = createGrabSelection(target, clientOptions.framework, resolveSource(target))
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

  const copyCurrentAIContext = async () => {
    const element = selectedElements.value[0] ?? hoveredElement.value ?? null
    const currentSelection = activeSelection.value
    if (!element || !currentSelection) {
      showError('No element selected for AI context')
      return
    }

    showError('')
    try {
      const snapshot = createAIContextSnapshot(element, currentSelection)
      await copyAIContext(snapshot)
      showFeedback('Copied rich AI context')
    }
    catch (error) {
      showFeedback('')
      showError(error instanceof Error ? error.message : 'Unable to copy AI context')
    }
  }

  const copyCurrentVisualCrop = async () => {
    const elements = selectedElements.value.length
      ? selectedElements.value
      : (hoveredElement.value ? [hoveredElement.value] : [])
    if (!elements.length) {
      showError('No element selected for screenshot')
      return
    }

    showError('')
    try {
      const active = activeSelection.value ?? selections.value[0]
      const sourceText = active?.filePath
        ? formatSelectionLocation(active, clientOptions.copyFormat, clientOptions.projectRoot, clientOptions.copyLineColumn || true)
        : undefined

      const blob = await captureElementToBlob(elements)
      if (!blob) {
        showError('Unable to capture screenshot')
        return
      }

      const copied = await copyImageBlobToClipboard(blob, sourceText)
      if (copied)
        showFeedback('Copied component screenshot')
      else
        showError('Clipboard image copy not supported')
    }
    catch (error) {
      showFeedback('')
      showError(error instanceof Error ? error.message : 'Failed to capture screenshot')
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

    const entries = collectMarqueeEntries(rect, {
      framework: clientOptions.framework,
      resolveSource,
    })
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

    const target = getEventTargetElement(event)
    if (isDevtoolsElement(target))
      return

    const clickAction = getClickSelectionAction(event)
    const isDirectOpen = Boolean(event.metaKey || event.ctrlKey)

    const isTargetInSelection = selections.value.length > 0
      && target instanceof Element
      && selectedElements.value.some(el => el === target || composedContains(el, target))

    // 选区常驻：退出检查模式后只要高亮框还在，Shift/Alt+点击继续加减选；
    // 如果按住 Cmd/Ctrl 点击高亮选区内的元素，直接唤醒打开编辑器！
    if (!isInspecting.value && !(clickAction && selections.value.length) && !(isDirectOpen && isTargetInSelection))
      return

    event.preventDefault()
    event.stopPropagation()

    if (!(target instanceof Element))
      return

    if (!isInspecting.value && isDirectOpen && isTargetInSelection) {
      await openActiveSelectionInEditor()
      return
    }

    if (clickAction === 'add') {
      await addSelectionEntry({
        element: target,
        selection: createGrabSelection(target, clientOptions.framework, resolveSource(target)),
      })
      return
    }
    if (clickAction === 'subtract') {
      await removeSelectionEntry(target)
      return
    }

    const nextSelection = createGrabSelection(target, clientOptions.framework, resolveSource(target))
    setEntries([{ element: target, selection: nextSelection }])
    isInspecting.value = false
    isHoldInspecting.value = false
    clearHover()
    if (!nextSelection.filePath) {
      showFeedback('')
      showError('No source found for this element')
      return
    }
    await copySelectionLocation()
    if (clientOptions.openOnClick || isDirectOpen)
      await openSelectionInEditor(nextSelection)
  }

  const onDblClick = async (event: MouseEvent) => {
    const target = getEventTargetElement(event)
    if (isDevtoolsElement(target) || !(target instanceof Element))
      return

    if (isInspecting.value) {
      event.preventDefault()
      event.stopPropagation()
      const nextSelection = createGrabSelection(target, clientOptions.framework, resolveSource(target))
      if (nextSelection.filePath)
        await openSelectionInEditor(nextSelection)
      return
    }

    if (selections.value.length > 0) {
      const isTargetInSelection = selectedElements.value.some(el => el === target || composedContains(el, target))
      if (isTargetInSelection) {
        event.preventDefault()
        event.stopPropagation()
        await openActiveSelectionInEditor()
      }
    }
  }

  const startInspecting = () => {
    showError('')
    onInspectStart?.()
    isInspecting.value = true
  }

  const stopInspecting = () => {
    isHoldInspecting.value = false
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

  const selectHierarchyIndex = async (index: number) => {
    const current = selections.value[0]
    if (!current?.hierarchy || index < 0 || index >= current.hierarchy.length)
      return

    activeHierarchyIndex.value = index
    const item = current.hierarchy[index]
    const updatedSelection: GrabSelection = {
      ...current,
      componentName: item.componentName,
      filePath: item.filePath,
      line: item.line,
      column: item.column,
    }

    const anchorElement = selectedElements.value[0]
    const targetElements = anchorElement && item.componentName
      ? getComponentRootElements(anchorElement, item.componentName)
      : [anchorElement].filter((el): el is Element => Boolean(el))

    const entries: SelectionEntry[] = targetElements.length > 0
      ? targetElements.map(el => ({ element: el, selection: updatedSelection }))
      : [{ element: anchorElement, selection: updatedSelection }]

    setEntries(entries)
    activeHierarchyIndex.value = index
    if (item.filePath) {
      await copySelectionLocation()
      showFeedback(`Selected <${item.componentName}>`)
    }
    else {
      showFeedback(`Selected <${item.componentName}> (no source)`)
    }
  }

  const onKeyDown = async (event: KeyboardEvent) => {
    syncModifiers(event)
    const action = getInspectorShortcutAction(event)
    if (action === 'cancel' && isInspecting.value) {
      event.preventDefault()
      isHoldInspecting.value = false
      stopInspecting()
      return
    }
    else if (action === 'cancel' && selections.value.length) {
      event.preventDefault()
      clearSelection()
      return
    }
    if (action === 'toggle') {
      event.preventDefault()
      isHoldInspecting.value = false
      isInspecting.value ? stopInspecting() : startInspecting()
      return
    }
    if (action === 'copy-ai-context') {
      if (selections.value.length || hoveredElement.value) {
        event.preventDefault()
        await copyCurrentAIContext()
        return
      }
    }
    if (action === 'copy-visual-crop') {
      if (selections.value.length || hoveredElement.value) {
        event.preventDefault()
        await copyCurrentVisualCrop()
        return
      }
    }

    // Hold-to-inspect: pressing Alt outside editable target when not inspecting and no active selection
    if (
      (event.key === 'Alt' || event.code === 'AltLeft' || event.code === 'AltRight')
      && !event.repeat
      && !isInspecting.value
      && selections.value.length === 0
      && !isEditableTarget(event.target)
    ) {
      isHoldInspecting.value = true
      startInspecting()
      return
    }

    // Hierarchy navigation: ArrowUp / ArrowDown / Enter when a component hierarchy is active
    if (
      !isInspecting.value
      && selections.value.length >= 1
      && selections.value[0]?.hierarchy
      && selections.value[0].hierarchy.length > 1
      && !isEditableTarget(event.target)
    ) {
      if (event.key === 'ArrowUp' || event.code === 'ArrowUp') {
        event.preventDefault()
        const currentIdx = activeHierarchyIndex.value ?? (selections.value[0].hierarchy.length - 1)
        if (currentIdx > 0)
          await selectHierarchyIndex(currentIdx - 1)
        return
      }
      if (event.key === 'ArrowDown' || event.code === 'ArrowDown') {
        event.preventDefault()
        const currentIdx = activeHierarchyIndex.value ?? (selections.value[0].hierarchy.length - 1)
        if (currentIdx < selections.value[0].hierarchy.length - 1)
          await selectHierarchyIndex(currentIdx + 1)
        return
      }
      if (event.key === 'Enter' || event.code === 'Enter') {
        event.preventDefault()
        await openActiveSelectionInEditor()
        return
      }
    }
  }

  const onKeyUp = async (event: KeyboardEvent) => {
    syncModifiers(event)

    if (
      (event.key === 'Alt' || event.code === 'AltLeft' || event.code === 'AltRight')
      && isHoldInspecting.value
    ) {
      isHoldInspecting.value = false
      const element = hoveredElement.value
      const currentHoverSelection = hoverSelection.value
      if (element && currentHoverSelection) {
        setEntries([{ element, selection: currentHoverSelection }])
        isInspecting.value = false
        clearHover()
        if (currentHoverSelection.filePath) {
          await copySelectionLocation()
          if (clientOptions.openOnClick)
            await openSelectionInEditor(currentHoverSelection)
        }
      }
      else {
        stopInspecting()
      }
    }
  }

  // 窗口失焦时修饰键状态不可信（如 Alt+Tab），直接复位
  const onWindowBlur = () => {
    pressedModifiers.value = { shift: false, alt: false }
    if (isHoldInspecting.value) {
      isHoldInspecting.value = false
      stopInspecting()
    }
  }

  const dispose = () => {
    clearTimeout(feedbackTimer)
    clearTimeout(errorTimer)
    resizeObserver?.disconnect()
    window.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('pointermove', onPointerMove, true)
    window.removeEventListener('pointerup', onPointerUp, true)
    window.removeEventListener('click', onClick, true)
    window.removeEventListener('dblclick', onDblClick, true)
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
  window.addEventListener('dblclick', onDblClick, true)
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp, true)
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('scroll', refreshViewport, true)
  window.addEventListener('resize', refreshViewport)

  if (getCurrentInstance())
    onUnmounted(dispose)

  return {
    activeHierarchyIndex,
    activeSelection,
    hoveredElement,
    isHoldInspecting,
    isInspecting,
    isMarqueeing,
    labelStyle,
    lastError,
    feedback,
    isOpening,
    copySelectionLocation,
    copyCurrentAIContext,
    copyCurrentVisualCrop,
    clearSelection,
    dispose,
    formatSelectionLocation,
    hoverOverlayStyle,
    marqueeStyle,
    modifierAction,
    openSelectionInEditor,
    openActiveSelectionInEditor,
    overlayStyles,
    selectHierarchyIndex,
    selection,
    selections,
    selectionCount,
    sourceLabel,
    startInspecting,
    stopInspecting,
  }
}
