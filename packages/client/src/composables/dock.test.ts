import { describe, expect, it } from 'vitest'
import { calculateMagneticSnap, loadPersistedDockPosition, persistDockPosition } from './dock'

describe('dock utilities', () => {
  it('calculates magnetic snap to edges', () => {
    // Near left edge (< 32px)
    const snapLeft = calculateMagneticSnap(20, 200, 68, 36, 1000, 800)
    expect(snapLeft.x).toBe(12)
    expect(snapLeft.y).toBe(200)

    // Near bottom edge (< 32px from 800 - 36 = 764)
    const snapBottom = calculateMagneticSnap(500, 750, 68, 36, 1000, 800)
    expect(snapBottom.x).toBe(500)
    expect(snapBottom.y).toBe(800 - 36 - 12)

    // Center area (no snap)
    const center = calculateMagneticSnap(400, 400, 68, 36, 1000, 800)
    expect(center.x).toBe(400)
    expect(center.y).toBe(400)
  })

  it('persists and loads dock position', () => {
    const root = '/test-project'
    persistDockPosition(root, { x: 100, y: 200 })
    expect(loadPersistedDockPosition(root)).toEqual({ x: 100, y: 200 })

    persistDockPosition(root, null)
    expect(loadPersistedDockPosition(root)).toBeNull()
  })
})
