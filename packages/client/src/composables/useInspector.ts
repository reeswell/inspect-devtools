import { computed, getCurrentInstance, onUnmounted, shallowRef } from 'vue'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { createGrabSelection, getReactDebugSource, getVueInspectorSource, type GrabSelection } from '@inspect-devtools/core/browser'
import { formatSelectionLocation } from './selection-location'
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

const FEEDBACK_TIMEOUT = 2400
const ERROR_TIMEOUT = 3600

export const useInspector = (clientOptions: ClientInspectDevtoolsOptions, { onInspectStart }: UseInspectorOptions = {}) => {
  const rpc = useRpc(clientOptions)
  const isInspecting = shallowRef(false)
  const lastError = shallowRef('')
  const feedback = shallowRef('')
  const isOpening = shallowRef(false)
  const selection = shallowRef<GrabSelection | null>(null)
  const hoverSelection = shallowRef<GrabSelection | null>(null)
  const hoveredElement = shallowRef<Element | null>(null)
  const selectedElement = shallowRef<Element | null>(null)
  const viewportVersion = shallowRef(0)

  const activeElement = computed(() => hoveredElement.value ?? selectedElement.value)
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

  const overlayStyle = computed(() => {
    viewportVersion.value
    const element = activeElement.value
    if (!element)
      return { display: 'none' }

    const rect = element.getBoundingClientRect()
    return {
      display: 'block',
      transform: `translate(${rect.left}px, ${rect.top}px)`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }
  })

  const sourceLabel = computed(() => {
    const currentSelection = activeSelection.value
    if (!currentSelection)
      return null

    return {
      label: formatSourceLabel(currentSelection),
      hint: currentSelection.filePath ? 'Click to open in editor' : 'Source unresolved',
      canOpen: Boolean(currentSelection.filePath),
    }
  })

  const labelStyle = computed(() => {
    viewportVersion.value
    const element = activeElement.value
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

  const onPointerMove = (event: PointerEvent) => {
    if (!isInspecting.value || isDevtoolsElement(event.target))
      return

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
      await rpc.openInEditor(currentSelection.filePath, currentSelection.line, currentSelection.column)
      showFeedback('Opened in editor')
    }
    catch (error) {
      showFeedback('')
      showError(error instanceof Error ? error.message : 'Unable to open file')
    }
    finally { isOpening.value = false }
  }

  const copySelectionLocation = async () => {
    const currentSelection = selection.value
    const location = currentSelection ? formatSelectionLocation(currentSelection, clientOptions.projectRoot) : undefined
    if (!location)
      return

    showError('')
    try {
      await copyText(location)
      showFeedback('Copied source location')
    }
    catch (error) {
      showFeedback('')
      showError(error instanceof Error ? error.message : 'Unable to copy path')
    }
  }

  const openActiveSelectionInEditor = () => openSelectionInEditor(activeSelection.value)

  const onClick = async (event: MouseEvent) => {
    if (!isInspecting.value || isDevtoolsElement(event.target))
      return

    event.preventDefault()
    event.stopPropagation()

    if (!(event.target instanceof Element))
      return

    const nextSelection = createGrabSelection(event.target, clientOptions.framework, resolveSource(event.target))
    selectedElement.value = event.target
    selection.value = nextSelection
    isInspecting.value = false
    hoveredElement.value = null
    hoverSelection.value = null
    if (!nextSelection.filePath) {
      showFeedback('')
      showError('No source found for this element')
      return
    }
    await copySelectionLocation()
    await openSelectionInEditor(nextSelection)
  }

  const startInspecting = () => {
    showError('')
    onInspectStart?.()
    isInspecting.value = true
  }

  const stopInspecting = () => {
    isInspecting.value = false
    hoveredElement.value = null
    hoverSelection.value = null
  }

  const clearSelection = () => {
    selectedElement.value = null
    selection.value = null
    clearNotices()
  }

  const refreshViewport = () => {
    viewportVersion.value += 1
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const action = getInspectorShortcutAction(event)
    if (action === 'cancel' && isInspecting.value) {
      event.preventDefault()
      stopInspecting()
    }
    else if (action === 'cancel' && selection.value) {
      event.preventDefault()
      clearSelection()
    }
    if (action === 'toggle') {
      event.preventDefault()
      isInspecting.value ? stopInspecting() : startInspecting()
    }
  }

  const dispose = () => {
    clearTimeout(feedbackTimer)
    clearTimeout(errorTimer)
    window.removeEventListener('pointermove', onPointerMove, true)
    window.removeEventListener('click', onClick, true)
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('scroll', refreshViewport, true)
    window.removeEventListener('resize', refreshViewport)
  }

  window.addEventListener('pointermove', onPointerMove, true)
  window.addEventListener('click', onClick, true)
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('scroll', refreshViewport, true)
  window.addEventListener('resize', refreshViewport)

  if (getCurrentInstance())
    onUnmounted(dispose)

  return {
    activeSelection,
    hoveredElement,
    isInspecting,
    labelStyle,
    lastError,
    feedback,
    isOpening,
    copySelectionLocation,
    clearSelection,
    dispose,
    formatSelectionLocation,
    openSelectionInEditor,
    openActiveSelectionInEditor,
    overlayStyle,
    selection,
    sourceLabel,
    startInspecting,
    stopInspecting,
  }
}
