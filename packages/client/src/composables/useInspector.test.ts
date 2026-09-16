import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { getInspectorShortcutAction, useInspector } from './useInspector'

const createClientOptions = (overrides: Partial<ClientInspectDevtoolsOptions> = {}): ClientInspectDevtoolsOptions => ({
  framework: 'vue',
  copyFormat: 'codex',
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
  localStorage.clear()
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
    expect(writeText).toHaveBeenCalledWith('[App.tsx](/project/src/App.tsx)')
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

  it('copies a Codex file reference without source metadata and confirms success', async () => {
    const writeText = stubClipboard()
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('[App.vue](/project/src/App.vue)')
    expect(inspector.feedback.value).toBe('Copied source location')
    inspector.dispose()
  })

  it('prefers the persisted copy format over the project default', async () => {
    const writeText = stubClipboard()
    localStorage.setItem('inspect-devtools:copy-format:/project', 'cursor')
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    expect(inspector.copyFormat.value).toBe('cursor')
    expect(inspector.isCopyFormatOverridden.value).toBe(true)

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('@src/App.vue')
    inspector.dispose()
  })

  it('applies a newly selected copy format immediately and persists it', async () => {
    const writeText = stubClipboard()
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    inspector.setCopyFormat('cursor')
    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('@src/App.vue')
    expect(localStorage.getItem('inspect-devtools:copy-format:/project')).toBe('cursor')
    expect(inspector.isCopyFormatOverridden.value).toBe(true)
    inspector.dispose()
  })

  it('restores the project default and clears the persisted override', async () => {
    const writeText = stubClipboard()
    localStorage.setItem('inspect-devtools:copy-format:/project', 'cursor')
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    inspector.resetCopyFormat()

    expect(inspector.copyFormat.value).toBe('codex')
    expect(inspector.isCopyFormatOverridden.value).toBe(false)
    expect(localStorage.getItem('inspect-devtools:copy-format:/project')).toBeNull()

    await inspector.copySelectionLocation()
    expect(writeText).toHaveBeenCalledWith('[App.vue](/project/src/App.vue)')
    inspector.dispose()
  })

  it('still copies when localStorage is unavailable', async () => {
    const writeText = stubClipboard()
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    })
    const inspector = useInspector(createClientOptions())
    inspector.selection.value = {
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('[App.vue](/project/src/App.vue)')
    expect(inspector.copyFormat.value).toBe('codex')
    inspector.dispose()
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
