import { afterEach, describe, expect, it, vi } from 'vitest'
import { getInspectorShortcutAction, useInspector } from './useInspector'

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('getInspectorShortcutAction', () => {
  it('toggles inspection with Alt+Shift+I and cancels with Escape', () => {
    expect(getInspectorShortcutAction({ altKey: true, code: 'KeyI', shiftKey: true, target: document.body })).toBe('toggle')
    expect(getInspectorShortcutAction({ altKey: true, code: 'KeyP', shiftKey: true, target: document.body })).toBe('toggle-panel')
    expect(getInspectorShortcutAction({ altKey: false, code: 'Escape', shiftKey: false, target: document.body })).toBe('cancel')
  })

  it('ignores shortcuts from editable elements', () => {
    const input = document.createElement('input')
    expect(getInspectorShortcutAction({ altKey: true, code: 'KeyI', shiftKey: true, target: input })).toBeUndefined()
  })
})

describe('useInspector', () => {
  it('selects an element, copies its location, and opens the editor', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    document.body.innerHTML = '<button data-inspect-devtools-source="/project/src/App.tsx:8:5">Save</button>'

    const inspector = useInspector({
      framework: 'react',
      endpoints: { openInEditor: '/__inspect-devtools__/open-in-editor' },
    })
    inspector.startInspecting()
    document.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(inspector.selection.value?.filePath).toBe('/project/src/App.tsx')
    expect(fetch).toHaveBeenCalledWith('/__inspect-devtools__/open-in-editor', expect.objectContaining({ method: 'POST' }))
    inspector.dispose()
  })

  it('clears the selected element with Escape when not inspecting', () => {
    const inspector = useInspector({ framework: 'vue', endpoints: { openInEditor: '/open' } })
    inspector.selection.value = { framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue' }
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }))

    expect(inspector.selection.value).toBeNull()
    inspector.dispose()
  })

  it('copies the complete source location and confirms success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const inspector = useInspector({ framework: 'vue', endpoints: { openInEditor: '/open' } })
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('/project/src/App.vue:8:5')
    expect(inspector.feedback.value).toBe('Copied source location')
    inspector.dispose()
  })

  it('reports editor opening progress and success', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetch)
    const inspector = useInspector({ framework: 'react', endpoints: { openInEditor: '/open' } })
    inspector.selection.value = {
      framework: 'react', tagName: 'button', filePath: '/project/src/App.tsx', line: 8, column: 5,
    }

    const opening = inspector.openSelectionInEditor()
    expect(inspector.isOpening.value).toBe(true)
    expect(inspector.feedback.value).toBe('Opening in editor…')
    await opening

    expect(inspector.isOpening.value).toBe(false)
    expect(inspector.feedback.value).toBe('Opened in editor')
    inspector.dispose()
  })
})
