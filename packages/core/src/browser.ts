import type { InspectDevtoolsFramework, GrabSelection } from './types.ts'

export type { GrabSelection }

interface ReactDebugSource {
  fileName?: string
  lineNumber?: number
  columnNumber?: number
}

interface ReactFiberLike {
  elementType?: unknown
  type?: unknown
  return?: ReactFiberLike | null
  _debugOwner?: ReactFiberLike | null
  _debugSource?: ReactDebugSource | null
  _debugStack?: { stack?: string } | string | null
}

const NON_COMPONENT_PREFIXES = ['_', '$', 'motion.', 'styled.', 'chakra.', 'ark.', 'Primitive.', 'Slot.']
const INTERNAL_COMPONENT_NAMES = new Set([
  'AppRouter',
  'AppRouterAnnouncer',
  'AppDevOverlay',
  'AppDevOverlayErrorBoundary',
  'ClientPageRoot',
  'ClientSegmentRoot',
  'ErrorBoundary',
  'Fragment',
  'HandleRedirect',
  'Head',
  'HistoryUpdater',
  'HotReload',
  'InnerLayoutRouter',
  'LoadableComponent',
  'MotionDOMComponent',
  'OuterLayoutRouter',
  'Profiler',
  'RedirectBoundary',
  'RootErrorBoundary',
  'Router',
  'ServerRoot',
  'Slot',
  'SlotClone',
  'StrictMode',
  'Suspense',
  'SuspenseList',
])

const SOURCE_FILE_RE = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/i
const STACK_FRAME_RE = /^\s*at\s+(?:(.*?)\s+\()?(.+\.(?:[cm]?[jt]sx?|vue|svelte|astro)):(\d+):(\d+)\)?\s*$/i

const isUsefulComponentName = (name: string | undefined): name is string => {
  if (!name || INTERNAL_COMPONENT_NAMES.has(name))
    return false
  return !NON_COMPONENT_PREFIXES.some(prefix => name.startsWith(prefix))
}

const isSourceComponentName = (name: string | undefined): name is string => {
  if (!isUsefulComponentName(name))
    return false
  if (name.length <= 1 || name[0] !== name[0].toUpperCase())
    return false
  return !name.endsWith('Provider') && !name.endsWith('Context')
}

const getTypeDisplayName = (type: unknown): string | undefined => {
  if (!type || typeof type === 'string')
    return undefined

  if (typeof type === 'function')
    return (type as { displayName?: string }).displayName || type.name || undefined

  if (typeof type !== 'object')
    return undefined

  const value = type as {
    displayName?: string
    name?: string
    render?: unknown
    type?: unknown
  }
  return value.displayName
    || value.name
    || getTypeDisplayName(value.render)
    || getTypeDisplayName(value.type)
}

const getFiberDisplayName = (fiber: ReactFiberLike | null | undefined): string | undefined => {
  if (!fiber)
    return undefined
  return getTypeDisplayName(fiber.elementType) || getTypeDisplayName(fiber.type)
}

const getNearestComponentName = (
  fiber: ReactFiberLike | null | undefined,
  predicate: (name: string | undefined) => name is string = isUsefulComponentName,
): string | undefined => {
  let current = fiber
  while (current) {
    const displayName = getFiberDisplayName(current)
    if (predicate(displayName))
      return displayName
    current = current.return ?? null
  }
}

const getReactFiber = (element: Element): ReactFiberLike | null => {
  let current: Element | null = element
  while (current) {
    const record = current as unknown as Record<string, unknown>
    const fiberKey = Object.getOwnPropertyNames(record)
      .find(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'))
    if (fiberKey)
      return record[fiberKey] as ReactFiberLike
    current = current.parentElement
  }
  return null
}

const normalizeSourcePath = (filePath: string): string => {
  let normalized = filePath.trim()

  try {
    const url = new URL(normalized)
    normalized = url.protocol === 'file:' ? url.pathname : url.pathname
  }
  catch {}

  normalized = decodeURIComponent(normalized)
    .replace(/^\/?@fs\//, '/')
    .replace(/^(?:webpack-internal:|webpack:|rsc:)\/+/i, '')
    .replace(/[?#].*$/, '')

  return normalized.startsWith('./') ? normalized.slice(2) : normalized
}

const getSourceOrigin = (filePath: string): 'app' | 'package' | 'unknown' => {
  const normalized = normalizeSourcePath(filePath).replace(/\\/g, '/')
  if (normalized.includes('/node_modules/') || normalized.startsWith('node_modules/'))
    return 'package'
  return SOURCE_FILE_RE.test(normalized) ? 'app' : 'unknown'
}

const parseDebugStack = (stack: ReactFiberLike['_debugStack']): Partial<Pick<GrabSelection, 'componentName' | 'filePath' | 'line' | 'column'>> | undefined => {
  const text = typeof stack === 'string' ? stack : stack?.stack
  if (!text)
    return undefined

  for (const line of text.split('\n')) {
    const match = line.match(STACK_FRAME_RE)
    if (!match)
      continue

    const [, rawName, rawFilePath, rawLine, rawColumn] = match
    const componentName = rawName?.replace(/^new\s+/, '')
    return {
      componentName: isSourceComponentName(componentName) ? componentName : undefined,
      filePath: normalizeSourcePath(rawFilePath),
      line: Number(rawLine) || undefined,
      column: Number(rawColumn) || undefined,
    }
  }
}

const INSPECTOR_SOURCE_RE = /(.+):(\d+):(\d+)$/

const getReactInspectorSource = (element: Element): Partial<GrabSelection> => {
  let current: Element | null = element
  while (current) {
    const raw = current.getAttribute('data-inspect-devtools-source')
    if (raw) {
      const match = raw.match(INSPECTOR_SOURCE_RE)
      if (!match)
        return {}

      const [, filePath, line, column] = match
      const componentName = current.getAttribute('data-inspect-devtools-component') || undefined
      return {
        componentName,
        filePath: normalizeSourcePath(filePath),
        line: Number(line) || undefined,
        column: Number(column) || undefined,
      }
    }
    current = current.parentElement
  }
  return {}
}

const escapeSelectorPart = (value: string): string => {
  if (globalThis.CSS?.escape)
    return globalThis.CSS.escape(value)

  return value.replace(/[^a-zA-Z0-9_-]/g, match => `\\${match}`)
}

export const createElementSelector = (element: Element): string => {
  if (element.id)
    return `#${escapeSelectorPart(element.id)}`

  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== document.body && parts.length < 4) {
    const tagName = current.tagName.toLowerCase()
    const classNames = Array.from(current.classList).slice(0, 2).map(className => `.${escapeSelectorPart(className)}`)
    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(child => child.tagName === current!.tagName)
      : []
    const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : ''
    parts.unshift(`${tagName}${classNames.join('')}${nth}`)
    current = current.parentElement
  }

  return parts.join(' > ')
}

export const createGrabSelection = (
  element: Element,
  framework: InspectDevtoolsFramework,
  source?: Partial<Pick<GrabSelection, 'componentName' | 'filePath' | 'line' | 'column'>>,
): GrabSelection => ({
  framework,
  tagName: element.tagName.toLowerCase(),
  componentName: source?.componentName,
  filePath: source?.filePath,
  line: source?.line,
  column: source?.column,
  cssSelector: createElementSelector(element),
})

export const getReactDebugSource = (element: Element): Partial<GrabSelection> => {
  const inspectorSource = getReactInspectorSource(element)
  if (inspectorSource.filePath)
    return inspectorSource

  const fiber = getReactFiber(element)
  const candidates: Array<Partial<Pick<GrabSelection, 'componentName' | 'filePath' | 'line' | 'column'>> & { origin: 'app' | 'package' | 'unknown' }> = []
  let current = fiber

  while (current) {
    const source = current._debugSource
    const componentName = getNearestComponentName(current._debugOwner, isSourceComponentName)
      || getNearestComponentName(current, isSourceComponentName)

    if (source?.fileName) {
      const filePath = normalizeSourcePath(source.fileName)
      candidates.push({
        componentName,
        filePath,
        line: source.lineNumber,
        column: source.columnNumber,
        origin: getSourceOrigin(filePath),
      })
    }

    const stackSource = parseDebugStack(current._debugStack)
    if (stackSource?.filePath) {
      candidates.push({
        componentName: stackSource.componentName || componentName,
        filePath: stackSource.filePath,
        line: stackSource.line,
        column: stackSource.column,
        origin: getSourceOrigin(stackSource.filePath),
      })
    }

    current = current.return ?? null
  }

  const source = candidates.find(candidate => candidate.origin === 'app')
    || candidates.find(candidate => candidate.origin === 'package')
    || candidates[0]

  if (source) {
    const { origin: _, ...selectionSource } = source
    return selectionSource
  }

  const componentName = getNearestComponentName(fiber)
  return componentName ? { componentName } : {}
}

const VUE_INSPECTOR_RE = /(.+):(\d+):(\d+)$/

const getVueInspectorData = (element: Element): string | undefined => {
  const current = element as Element & {
    __vnode?: {
      props?: Record<string, unknown>
      ctx?: { vnode?: { el?: Element, props?: Record<string, unknown> } }
    }
  }

  const vnodeInspector = current.__vnode?.props?.__v_inspector
  if (typeof vnodeInspector === 'string')
    return vnodeInspector

  const ctxVNode = current.__vnode?.ctx?.vnode
  const ctxInspector = ctxVNode?.el === element ? ctxVNode.props?.__v_inspector : undefined
  if (typeof ctxInspector === 'string')
    return ctxInspector

  const attrInspector = element.getAttribute('data-v-inspector')
  return attrInspector || undefined
}

export const getVueInspectorSource = (element: Element): Partial<GrabSelection> => {
  const candidates: Element[] = []
  let current: Element | null = element
  while (current) {
    candidates.push(current)
    current = current.parentElement
  }
  const raw = candidates.map(getVueInspectorData).find(Boolean)
  if (!raw)
    return {}

  const match = raw.match(VUE_INSPECTOR_RE)
  if (!match)
    return {}

  const [, filePath, line, column] = match
  return {
    filePath,
    line: Number(line) || undefined,
    column: Number(column) || undefined,
  }
}
