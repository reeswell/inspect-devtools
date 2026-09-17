import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { getInspectorShortcutAction, useInspector } from './useInspector'

const createClientOptions = (overrides: Partial<ClientInspectDevtoolsOptions> = {}): ClientInspectDevtoolsOptions => ({
  framework: 'vue',
  theme: 'light',
  projectRoot: '/project',
  endpoints: { openInEditor: '/open' },
  ...overrides,
})

const stubClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('getInspectorShortcutAction', () => {
  it('toggles inspection with Alt+Shift+I and cancels with Escape', () => {
    expect(getInspectorShortcutAction({ altKey: true, code: 'KeyI', shiftKey: true, target: document.body })).toBe('toggle')
    expect(getInspectorShortcutAction({ altKey: false, code: 'Escape', shiftKey: false, target: document.body })).toBe('cancel')
    expect(getInspectorShortcutAction({ altKey: true, code: 'KeyP', shiftKey: true, target: document.body })).toBeUndefined()
  })

  it('ignores shortcuts from editable elements', () => {
    const input = document.createElement('input')
    expect(getInspectorShortcutAction({ altKey: true, code: 'KeyI', shiftKey: true, target: input })).toBeUndefined()
  })
})

describe('useInspector', () => {
  it('selects an element, copies its location, and opens the editor with line and column', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetch)
    const writeText = stubClipboard()
    document.body.innerHTML = '<button data-inspect-devtools-source="/project/src/App.tsx:8:5">Save</button>'

    const inspector = useInspector(createClientOptions({
      framework: 'react',
      endpoints: { openInEditor: '/__inspect-devtools__/open-in-editor' },
    }))
    inspector.startInspecting()
    document.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(inspector.selection.value?.filePath).toBe('/project/src/App.tsx')
    expect(writeText).toHaveBeenCalledWith('@src/App.tsx')
    expect(fetch).toHaveBeenCalledWith('/__inspect-devtools__/open-in-editor', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ path: '/project/src/App.tsx', line: 8, column: 5 }),
    }))
    inspector.dispose()
  })

  it('clears the selected element with Escape when not inspecting', () => {
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = { framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue' }
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }))

    expect(inspector.selection.value).toBeNull()
    inspector.dispose()
  })

  it('copies an @ mention without source metadata and confirms success', async () => {
    const writeText = stubClipboard()
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('@src/App.vue')
    expect(inspector.feedback.value).toBe('Copied source location')
    inspector.dispose()
  })

  it('reports when no source can be resolved for the selected element', async () => {
    document.body.innerHTML = '<button>Bare</button>'
    const inspector = useInspector(createClientOptions({ framework: 'react' }))
    inspector.startInspecting()
    document.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(inspector.selection.value?.filePath).toBeUndefined()
    expect(inspector.lastError.value).toBe('No source found for this element')
    expect(inspector.feedback.value).toBe('')
    inspector.dispose()
  })

  it('dismisses feedback and error notices automatically', async () => {
    vi.useFakeTimers()
    try {
      const writeText = stubClipboard()
      const inspector = useInspector(createClientOptions())
      inspector.selection.value = {
        framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
      }

      await inspector.copySelectionLocation()
      expect(writeText).toHaveBeenCalledWith('@src/App.vue')
      expect(inspector.feedback.value).toBe('Copied source location')

      vi.advanceTimersByTime(2400)
      expect(inspector.feedback.value).toBe('')
      inspector.dispose()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('reports editor opening progress and success', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetch)
    const inspector = useInspector(createClientOptions({ framework: 'react' }))
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
