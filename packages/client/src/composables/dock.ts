import { computed, onUnmounted, shallowRef } from 'vue'

export interface DockPosition {
  x: number
  y: number
}

const DOCK_POSITION_STORAGE_PREFIX = 'inspect-devtools:dock-position:'
const DOCK_COLLAPSED_STORAGE_PREFIX = 'inspect-devtools:dock-collapsed:'
const SNAP_THRESHOLD = 32
const DRAG_THRESHOLD = 4

export const loadPersistedDockPosition = (projectRoot?: string): DockPosition | null => {
  if (typeof window === 'undefined' || !window.localStorage || !projectRoot)
    return null

  try {
    const raw = window.localStorage.getItem(`${DOCK_POSITION_STORAGE_PREFIX}${projectRoot}`)
    if (!raw)
      return null
    const parsed = JSON.parse(raw) as DockPosition
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number')
      return parsed
  }
  catch {}
  return null
}

export const persistDockPosition = (projectRoot: string | undefined, position: DockPosition | null): void => {
  if (typeof window === 'undefined' || !window.localStorage || !projectRoot)
    return

  try {
    const key = `${DOCK_POSITION_STORAGE_PREFIX}${projectRoot}`
    if (!position)
      window.localStorage.removeItem(key)
    else
      window.localStorage.setItem(key, JSON.stringify(position))
  }
  catch {}
}

export const loadPersistedDockCollapsed = (projectRoot?: string): boolean => {
  if (typeof window === 'undefined' || !window.localStorage || !projectRoot)
    return false

  try {
    return window.localStorage.getItem(`${DOCK_COLLAPSED_STORAGE_PREFIX}${projectRoot}`) === 'true'
  }
  catch {}
  return false
}

export const persistDockCollapsed = (projectRoot: string | undefined, collapsed: boolean): void => {
  if (typeof window === 'undefined' || !window.localStorage || !projectRoot)
    return

  try {
    const key = `${DOCK_COLLAPSED_STORAGE_PREFIX}${projectRoot}`
    if (collapsed)
      window.localStorage.setItem(key, 'true')
    else
      window.localStorage.removeItem(key)
  }
  catch {}
}

export const calculateMagneticSnap = (
  x: number,
  y: number,
  dockWidth: number,
  dockHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): DockPosition => {
  let targetX = x
  let targetY = y

  // Clamp within viewport
  targetX = Math.max(8, Math.min(targetX, viewportWidth - dockWidth - 8))
  targetY = Math.max(8, Math.min(targetY, viewportHeight - dockHeight - 8))

  // Magnetic snap to edges
  if (targetX < SNAP_THRESHOLD)
    targetX = 12
  else if (viewportWidth - (targetX + dockWidth) < SNAP_THRESHOLD)
    targetX = viewportWidth - dockWidth - 12

  if (targetY < SNAP_THRESHOLD)
    targetY = 12
  else if (viewportHeight - (targetY + dockHeight) < SNAP_THRESHOLD)
    targetY = viewportHeight - dockHeight - 12

  return { x: targetX, y: targetY }
}

export const useDock = (projectRoot?: string) => {
  const position = shallowRef<DockPosition | null>(loadPersistedDockPosition(projectRoot))
  const isCollapsed = shallowRef<boolean>(loadPersistedDockCollapsed(projectRoot))
  const isDragging = shallowRef(false)
  const dragOffset = shallowRef<{ x: number, y: number } | null>(null)
  const dragStart = shallowRef<{ x: number, y: number } | null>(null)
  let suppressClick = false

  const dockStyle = computed(() => {
    if (!position.value)
      return {}

    return {
      left: `${position.value.x}px`,
      top: `${position.value.y}px`,
      bottom: 'auto',
      right: 'auto',
      transform: 'none',
    }
  })

  const onPointerDown = (event: PointerEvent, dockElement: HTMLElement | null) => {
    if (event.button !== 0 || !dockElement)
      return

    const rect = dockElement.getBoundingClientRect()
    dragStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const onPointerMove = (event: PointerEvent, dockWidth = 68, dockHeight = 36) => {
    if (!dragStart.value || !dragOffset.value)
      return

    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y

    if (!isDragging.value && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD)
      isDragging.value = true

    if (isDragging.value) {
      suppressClick = true
      const newX = event.clientX - dragOffset.value.x
      const newY = event.clientY - dragOffset.value.y
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      position.value = {
        x: Math.max(4, Math.min(newX, viewportWidth - dockWidth - 4)),
        y: Math.max(4, Math.min(newY, viewportHeight - dockHeight - 4)),
      }
    }
  }

  const onPointerUp = (dockWidth = 68, dockHeight = 36) => {
    if (isDragging.value && position.value) {
      const snapped = calculateMagneticSnap(
        position.value.x,
        position.value.y,
        dockWidth,
        dockHeight,
        window.innerWidth,
        window.innerHeight,
      )
      position.value = snapped
      persistDockPosition(projectRoot, snapped)
    }

    dragStart.value = null
    dragOffset.value = null
    setTimeout(() => {
      isDragging.value = false
      suppressClick = false
    }, 50)
  }

  const toggleCollapsed = () => {
    if (suppressClick)
      return
    isCollapsed.value = !isCollapsed.value
    persistDockCollapsed(projectRoot, isCollapsed.value)
  }

  const resetPosition = () => {
    position.value = null
    persistDockPosition(projectRoot, null)
  }

  const consumeClick = (): boolean => {
    if (suppressClick) {
      suppressClick = false
      return true
    }
    return false
  }

  return {
    consumeClick,
    dockStyle,
    isCollapsed,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    position,
    resetPosition,
    toggleCollapsed,
  }
}
