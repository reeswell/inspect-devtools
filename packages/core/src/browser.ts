import type { InspectDevtoolsFramework, GrabSelection, ComponentHierarchyItem, ComponentAIContextSnapshot } from './types.ts'

export type { GrabSelection, ComponentHierarchyItem, ComponentAIContextSnapshot }
export {
  createAIContextSnapshot,
  formatAIContextMarkdown,
} from './ai-context.ts'

interface ReactDebugSource {
  fileName?: string
  lineNumber?: number
  columnNumber?: number
}

interface ReactFiberLike {
  elementType?: unknown
  type?: unknown
  stateNode?: unknown
  child?: ReactFiberLike | null
  sibling?: ReactFiberLike | null
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

export const getEventTargetElement = (event: Event): Element | null => {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  for (const item of path) {
    if (item instanceof Element)
      return item
  }
  return event.target instanceof Element ? event.target : null
}

export const collectAllElements = (root: Element | Document = document.body): Element[] => {
  const elements: Element[] = []
  const queue: Array<Element | DocumentFragment> = [root instanceof Document ? root.body : root]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current)
      continue
    const children = current.children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      elements.push(child)
      if (child.shadowRoot)
        queue.push(child.shadowRoot)
      if (child.children.length > 0)
        queue.push(child)
    }
  }
  return elements
}

export const getReactHierarchy = (element: Element): ComponentHierarchyItem[] => {
  const domSources = new Map<string, { filePath: string, line?: number, column?: number }>()
  let domScan: Element | null = element
  while (domScan) {
    const raw = domScan.getAttribute('data-inspect-devtools-source')
    const comp = domScan.getAttribute('data-inspect-devtools-component')
    if (raw && comp) {
      const match = raw.match(INSPECTOR_SOURCE_RE)
      if (match && !domSources.has(comp)) {
        const [, filePath, line, column] = match
        domSources.set(comp, {
          filePath: normalizeSourcePath(filePath),
          line: Number(line) || undefined,
          column: Number(column) || undefined,
        })
      }
    }
    domScan = domScan.parentElement
  }

  const fiber = getReactFiber(element)

  if (fiber) {
    const items: ComponentHierarchyItem[] = []
    const seenNames = new Set<string>()
    let current: ReactFiberLike | null = fiber
    const nearestName = getNearestComponentName(fiber, isSourceComponentName)
    const inspectorSource = getReactInspectorSource(element)

    while (current) {
      let name = getFiberDisplayName(current)
      const stack = parseDebugStack(current._debugStack)
        || (fiber?._debugOwner === current ? parseDebugStack(fiber._debugStack) : undefined)

      if (!isSourceComponentName(name) && stack?.componentName)
        name = stack.componentName

      if (isSourceComponentName(name)) {
        if (!seenNames.has(name)) {
          seenNames.add(name)

          const domSource = domSources.get(name)
          let filePath: string | undefined
          let line: number | undefined
          let column: number | undefined

          if (name === nearestName && inspectorSource.filePath) {
            filePath = inspectorSource.filePath
            line = inspectorSource.line
            column = inspectorSource.column
          }
          else if (domSource) {
            filePath = domSource.filePath
            line = domSource.line
            column = domSource.column
          }
          else {
            const source = current._debugSource
              || (fiber?._debugOwner === current ? fiber._debugSource : undefined)
            filePath = source?.fileName ? normalizeSourcePath(source.fileName) : stack?.filePath
            line = source?.lineNumber ?? stack?.line
            column = source?.columnNumber ?? stack?.column
          }

          items.unshift({
            componentName: name,
            filePath,
            line,
            column,
          })
        }
      }
      current = current.return ?? null
    }

    if (items.length > 0)
      return items
  }

  // Fallback: walk DOM ancestors with inspector metadata
  const items: ComponentHierarchyItem[] = []
  const seenNames = new Set<string>()
  let domCurrent: Element | null = element

  while (domCurrent) {
    const raw = domCurrent.getAttribute('data-inspect-devtools-source')
    const comp = domCurrent.getAttribute('data-inspect-devtools-component')
    if (raw) {
      const match = raw.match(INSPECTOR_SOURCE_RE)
      if (match) {
        const [, filePath, line, column] = match
        const name = comp || domCurrent.tagName.toLowerCase()
        if (isSourceComponentName(name) && !seenNames.has(name)) {
          seenNames.add(name)
          items.unshift({
            componentName: name,
            filePath: normalizeSourcePath(filePath),
            line: Number(line) || undefined,
            column: Number(column) || undefined,
          })
        }
      }
    }
    domCurrent = domCurrent.parentElement
  }

  return items
}

export const createGrabSelection = (
  element: Element,
  framework: InspectDevtoolsFramework,
  source?: Partial<Pick<GrabSelection, 'componentName' | 'filePath' | 'line' | 'column' | 'hierarchy'>>,
): GrabSelection => ({
  framework,
  tagName: element.tagName.toLowerCase(),
  componentName: source?.componentName,
  filePath: source?.filePath,
  line: source?.line,
  column: source?.column,
  cssSelector: createElementSelector(element),
  hierarchy: source?.hierarchy,
})

export const getReactDebugSource = (element: Element): Partial<GrabSelection> => {
  const hierarchy = getReactHierarchy(element)
  const inspectorSource = getReactInspectorSource(element)
  if (inspectorSource.filePath) {
    return {
      ...inspectorSource,
      hierarchy: hierarchy.length > 0 ? hierarchy : undefined,
    }
  }

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
    return {
      ...selectionSource,
      hierarchy: hierarchy.length > 0 ? hierarchy : undefined,
    }
  }

  const componentName = getNearestComponentName(fiber)
  return componentName
    ? { componentName, hierarchy: hierarchy.length > 0 ? hierarchy : undefined }
    : (hierarchy.length > 0 ? { hierarchy } : {})
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

interface VueSubTreeChildLike {
  el?: Element | null
}

interface VueSubTreeLike {
  el?: Element | null
  children?: VueSubTreeChildLike[] | null
  type?: unknown
}

interface VueComponentTypeLike {
  __name?: string
  name?: string
  __file?: string
}

interface VueInstanceLike {
  type?: VueComponentTypeLike | null
  parent?: VueInstanceLike | null
  subTree?: VueSubTreeLike | null
  $el?: Element | null
}

const getVueInstance = (element: Element): VueInstanceLike | null => {
  const record = element as unknown as {
    __vueParentComponent?: VueInstanceLike
    __vnode?: { ctx?: VueInstanceLike }
  }
  return record.__vueParentComponent ?? record.__vnode?.ctx ?? null
}

export const getVueHierarchy = (element: Element): ComponentHierarchyItem[] => {
  let inst = getVueInstance(element)

  if (inst) {
    const items: ComponentHierarchyItem[] = []
    const seenNames = new Set<string>()
    const initialData = getVueInspectorData(element)
    const initialMatch = initialData?.match(VUE_INSPECTOR_RE)
    let isInnermost = true

    while (inst) {
      const type = inst.type
      if (type && typeof type === 'object') {
        const name = type.__name || type.name || (typeof type.__file === 'string' ? type.__file.split('/').pop()?.replace(/\.\w+$/, '') : undefined)
        const filePath = typeof type.__file === 'string' ? normalizeSourcePath(type.__file) : undefined
        if (name && !seenNames.has(name)) {
          seenNames.add(name)

          let line: number | undefined
          let column: number | undefined

          if (isInnermost && initialMatch) {
            line = Number(initialMatch[2]) || undefined
            column = Number(initialMatch[3]) || undefined
          }

          items.unshift({
            componentName: name,
            filePath,
            line,
            column,
          })
        }
        isInnermost = false
      }
      inst = inst.parent ?? null
    }

    if (items.length > 0)
      return items
  }

  // Fallback: walk DOM ancestors with inspector metadata
  const items: ComponentHierarchyItem[] = []
  const seenNames = new Set<string>()
  let domCurrent: Element | null = element

  while (domCurrent) {
    const data = getVueInspectorData(domCurrent)
    if (data) {
      const match = data.match(VUE_INSPECTOR_RE)
      if (match) {
        const [, filePath, line, column] = match
        const baseName = filePath.split('/').pop()?.replace(/\.\w+$/, '') || domCurrent.tagName.toLowerCase()
        if (!seenNames.has(baseName)) {
          seenNames.add(baseName)
          items.unshift({
            componentName: baseName,
            filePath: normalizeSourcePath(filePath),
            line: Number(line) || undefined,
            column: Number(column) || undefined,
          })
        }
      }
    }
    domCurrent = domCurrent.parentElement
  }

  return items
}

export const getVueInspectorSource = (element: Element): Partial<GrabSelection> => {
  const hierarchy = getVueHierarchy(element)
  const candidates: Element[] = []
  let current: Element | null = element
  while (current) {
    candidates.push(current)
    current = current.parentElement
  }
  const raw = candidates.map(getVueInspectorData).find(Boolean)
  if (!raw)
    return hierarchy.length > 0 ? { hierarchy } : {}

  const match = raw.match(VUE_INSPECTOR_RE)
  if (!match)
    return hierarchy.length > 0 ? { hierarchy } : {}

  const [, filePath, line, column] = match
  return {
    filePath,
    line: Number(line) || undefined,
    column: Number(column) || undefined,
    hierarchy: hierarchy.length > 0 ? hierarchy : undefined,
  }
}

export const getComponentRootElements = (element: Element, componentName: string): Element[] => {
  // 1. React Fiber traversal
  const fiber = getReactFiber(element)
  if (fiber) {
    let current: ReactFiberLike | null = fiber
    while (current) {
      const name = getFiberDisplayName(current)
      if (name === componentName) {
        const elements: Element[] = []
        const traverse = (node: ReactFiberLike | null | undefined) => {
          if (!node)
            return
          if (node.stateNode instanceof Element) {
            elements.push(node.stateNode)
            traverse(node.sibling)
          }
          else {
            traverse(node.child)
            traverse(node.sibling)
          }
        }
        traverse(current.child)
        if (elements.length > 0)
          return elements
        break
      }
      current = current.return ?? null
    }
  }

  // 2. Vue instance traversal
  let inst = getVueInstance(element)
  while (inst) {
    const type = inst.type
    const name = type?.__name || type?.name || (typeof type?.__file === 'string' ? type.__file.split('/').pop()?.replace(/\.\w+$/, '') : undefined)
    if (name === componentName) {
      const subTree = inst.subTree
      if (subTree) {
        if (Array.isArray(subTree.children)) {
          const elements = subTree.children
            .map(c => c?.el)
            .filter((el): el is Element => el instanceof Element)
          if (elements.length > 0)
            return elements
        }
        if (subTree.el instanceof Element)
          return [subTree.el]
      }
      if (inst.$el instanceof Element)
        return [inst.$el]
      break
    }
    inst = inst.parent ?? null
  }

  // 3. Fallback: all top-level DOM nodes matching data-inspect-devtools-component
  const domMatches = Array.from(document.querySelectorAll(`[data-inspect-devtools-component="${componentName}"]`))
  if (domMatches.length > 0) {
    const topLevel = domMatches.filter(el =>
      !domMatches.some(other => other !== el && other.contains(el)),
    )
    if (topLevel.length > 0)
      return topLevel
  }

  const ancestor = element.closest(`[data-inspect-devtools-component="${componentName}"]`)
  return ancestor ? [ancestor] : [element]
}

