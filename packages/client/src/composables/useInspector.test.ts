import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { getClickSelectionAction, getInspectorShortcutAction, useInspector } from './useInspector'

const createClientOptions = (overrides: Partial<ClientInspectDevtoolsOptions> = {}): ClientInspectDevtoolsOptions => ({
  framework: 'vue',
  theme: 'light',
  copyRoute: true,
  copyFormat: 'mention',
  copyLineColumn: false,
  openOnClick: true,
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

describe('getClickSelectionAction', () => {
  it('maps Shift to add and Alt to subtract, with Shift taking precedence', () => {
    expect(getClickSelectionAction({ altKey: false, shiftKey: true })).toBe('add')
    expect(getClickSelectionAction({ altKey: true, shiftKey: false })).toBe('subtract')
    expect(getClickSelectionAction({ altKey: true, shiftKey: true })).toBe('add')
    expect(getClickSelectionAction({ altKey: false, shiftKey: false })).toBeUndefined()
  })
})

describe('useInspector', () => {
  const stubRects = (selectorRectMap: Record<string, { left: number, top: number, width: number, height: number }>) => {
    for (const [selector, rect] of Object.entries(selectorRectMap)) {
      const element = document.querySelector(selector)!
      element.getBoundingClientRect = () => ({
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => ({}),
      }) as DOMRect
    }
  }

  const dispatchPointer = (target: Element, type: string, x: number, y: number, init: MouseEventInit = {}) => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...init }))
  }

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
    expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/App.tsx')
    expect(fetch).toHaveBeenCalledWith('/__inspect-devtools__/open-in-editor', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ path: '/project/src/App.tsx', line: 8, column: 5 }),
    }))
    inspector.dispose()
  })

  it('selects an element, copies location with line and column when copyLineColumn is enabled', async () => {
    const writeText = stubClipboard()
    document.body.innerHTML = '<button data-inspect-devtools-source="/project/src/App.tsx:8:5">Save</button>'

    const inspector = useInspector(createClientOptions({
      framework: 'react',
      copyLineColumn: true,
      openOnClick: false,
    }))
    inspector.startInspecting()
    document.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(inspector.selection.value?.filePath).toBe('/project/src/App.tsx')
    expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/App.tsx:8:5')
    inspector.dispose()
  })

  it('copies location without opening the editor when openOnClick is false, but allows manual open', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetch)
    const writeText = stubClipboard()
    document.body.innerHTML = '<button data-inspect-devtools-source="/project/src/App.tsx:8:5">Save</button>'

    const inspector = useInspector(createClientOptions({
      framework: 'react',
      openOnClick: false,
      endpoints: { openInEditor: '/__inspect-devtools__/open-in-editor' },
    }))
    inspector.startInspecting()
    const button = document.querySelector('button')!
    dispatchPointer(button, 'pointermove', 10, 10)
    expect(inspector.sourceLabel.value?.hint).toBe('Click to copy source')

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(inspector.selection.value?.filePath).toBe('/project/src/App.tsx')
    expect(inspector.sourceLabel.value?.hint).toBe('Click badge to open in editor')
    expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/App.tsx')
    expect(fetch).not.toHaveBeenCalled()

    // Manually open via active selection
    await inspector.openActiveSelectionInEditor()
    expect(fetch).toHaveBeenCalledWith('/__inspect-devtools__/open-in-editor', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ path: '/project/src/App.tsx', line: 8, column: 5 }),
    }))
    inspector.dispose()
  })

  it('shows Click to open in editor when inspecting with openOnClick enabled', () => {
    document.body.innerHTML = '<button data-inspect-devtools-source="/project/src/App.tsx:8:5">Save</button>'
    const inspector = useInspector(createClientOptions({
      framework: 'react',
      openOnClick: true,
    }))
    inspector.startInspecting()
    const button = document.querySelector('button')!
    dispatchPointer(button, 'pointermove', 10, 10)
    expect(inspector.sourceLabel.value?.hint).toBe('Click to open in editor')
    inspector.dispose()
  })

  it('clears the selected element with Escape when not inspecting', () => {
    const inspector = useInspector(createClientOptions())
    inspector.selections.value = [{ framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue' }]
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }))

    expect(inspector.selection.value).toBeNull()
    expect(inspector.selections.value).toHaveLength(0)
    inspector.dispose()
  })

  it('copies an @ mention without source metadata and confirms success', async () => {
    const writeText = stubClipboard()
    const inspector = useInspector(createClientOptions())
    inspector.selections.value = [{
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }]

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/App.vue')
    expect(inspector.feedback.value).toBe('Copied source location')
    inspector.dispose()
  })

  it('appends the current route with search and hash to the copied mentions', async () => {
    window.history.pushState({}, '', '/dashboard?tab=overview#metrics')
    try {
      const writeText = stubClipboard()
      const inspector = useInspector(createClientOptions())
      inspector.selections.value = [{
        framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
      }]

      await inspector.copySelectionLocation()

      expect(writeText).toHaveBeenCalledWith('Route: /dashboard?tab=overview#metrics\n\n@src/App.vue')
      inspector.dispose()
    }
    finally {
      window.history.pushState({}, '', '/')
    }
  })

  it('omits the route line when copyRoute is disabled', async () => {
    const writeText = stubClipboard()
    const inspector = useInspector(createClientOptions({ copyRoute: false }))
    inspector.selections.value = [{
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }]

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('@src/App.vue')
    expect(inspector.feedback.value).toBe('Copied source location')
    inspector.dispose()
  })

  it('copies a Markdown link when copyFormat is link', async () => {
    const writeText = stubClipboard()
    const inspector = useInspector(createClientOptions({ copyFormat: 'link' }))
    inspector.selections.value = [{
      framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
    }]

    await inspector.copySelectionLocation()

    expect(writeText).toHaveBeenCalledWith('Route: / \n\n[App.vue](/project/src/App.vue)')
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
      inspector.selections.value = [{
        framework: 'vue', tagName: 'button', filePath: '/project/src/App.vue', line: 8, column: 5,
      }]

      await inspector.copySelectionLocation()
      expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/App.vue')
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
    inspector.selections.value = [{
      framework: 'react', tagName: 'button', filePath: '/project/src/App.tsx', line: 8, column: 5,
    }]

    const opening = inspector.openSelectionInEditor()
    expect(inspector.isOpening.value).toBe(true)
    expect(inspector.feedback.value).toBe('Opening in editor…')
    await opening

    expect(inspector.isOpening.value).toBe(false)
    expect(inspector.feedback.value).toBe('Opened in editor')
    inspector.dispose()
  })

  describe('marquee selection', () => {
    it('selects multiple elements and copies deduplicated mentions without auto-opening the editor', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      document.body.innerHTML = `
        <button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>
        <button id="b" data-inspect-devtools-source="/project/src/B.tsx:5:2">B</button>`
      stubRects({
        '#a': { left: 20, top: 20, width: 40, height: 20 },
        '#b': { left: 80, top: 20, width: 40, height: 20 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#a')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 140, 60)
      dispatchPointer(first, 'pointerup', 140, 60)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx', '/project/src/B.tsx'])
      expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/A.tsx\n@src/B.tsx')
      expect(fetch).not.toHaveBeenCalled()
      expect(inspector.feedback.value).toBe('Copied 2 source locations')
      inspector.dispose()
    })

    it('keeps one entry per element for same-file hits and deduplicates only at copy time', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      document.body.innerHTML = `
        <button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>
        <button id="b" data-inspect-devtools-source="/project/src/A.tsx:9:4">B</button>`
      stubRects({
        '#a': { left: 20, top: 20, width: 40, height: 20 },
        '#b': { left: 80, top: 20, width: 40, height: 20 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#a')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 140, 60)
      dispatchPointer(first, 'pointerup', 140, 60)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value).toHaveLength(2)
      expect(inspector.overlayStyles.value).toHaveLength(2)
      expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/A.tsx')
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith('/open', expect.objectContaining({
        body: JSON.stringify({ path: '/project/src/A.tsx', line: 3, column: 1 }),
      }))
      inspector.dispose()
    })

    it('reports when no marquee-selected element has resolvable source', async () => {
      document.body.innerHTML = '<button id="bare">Bare</button>'
      stubRects({ '#bare': { left: 20, top: 20, width: 40, height: 20 } })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#bare')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 140, 60)
      dispatchPointer(first, 'pointerup', 140, 60)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value).toHaveLength(0)
      expect(inspector.lastError.value).toBe('No source found for these elements')
      inspector.dispose()
    })

    it('excludes container elements that wrap other matched elements', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      document.body.innerHTML = `
        <div id="outer" data-inspect-devtools-source="/project/src/Outer.tsx:1:1">
          <button id="inner" data-inspect-devtools-source="/project/src/Inner.tsx:3:1">Inner</button>
        </div>`
      stubRects({
        '#outer': { left: 20, top: 20, width: 100, height: 60 },
        '#inner': { left: 30, top: 30, width: 40, height: 20 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#outer')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 140, 100)
      dispatchPointer(first, 'pointerup', 140, 100)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/Inner.tsx'])
      expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/Inner.tsx')
      inspector.dispose()
    })

    it('promotes the highlight frame to the outermost same-file ancestor', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      stubClipboard()
      document.body.innerHTML = `
        <article id="card" data-inspect-devtools-source="/project/src/MetricCard.tsx:10:3">
          <div id="inner" data-inspect-devtools-source="/project/src/MetricCard.tsx:14:7">value</div>
        </article>`
      stubRects({
        '#card': { left: 20, top: 20, width: 200, height: 120 },
        '#inner': { left: 30, top: 30, width: 160, height: 80 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#card')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 260, 180)
      dispatchPointer(first, 'pointerup', 260, 180)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/MetricCard.tsx'])
      expect(inspector.overlayStyles.value).toHaveLength(1)
      expect(inspector.overlayStyles.value[0]).toMatchObject({ width: '200px', height: '120px' })
      inspector.dispose()
    })

    it('does not promote the highlight frame to an ancestor of other matched elements', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      stubClipboard()
      document.body.innerHTML = `
        <div id="wrap" data-inspect-devtools-source="/project/src/main.tsx:12:217">
          <button id="a" data-inspect-devtools-source="/project/src/main.tsx:12:240">A</button>
          <article id="card" data-inspect-devtools-source="/project/src/MetricCard.tsx:10:3">C</article>
        </div>`
      stubRects({
        '#wrap': { left: 20, top: 20, width: 200, height: 200 },
        '#a': { left: 30, top: 30, width: 40, height: 20 },
        '#card': { left: 30, top: 70, width: 100, height: 120 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#wrap')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 260, 260)
      dispatchPointer(first, 'pointerup', 260, 260)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/main.tsx', '/project/src/MetricCard.tsx'])
      const frameWidths = inspector.overlayStyles.value.map(style => style.width)
      expect(frameWidths).toEqual(['40px', '100px'])
      expect(frameWidths).not.toContain('200px')
      inspector.dispose()
    })

    it('keeps single-click selection working below the drag threshold', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      document.body.innerHTML = '<button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>'

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const target = document.querySelector('#a')!
      dispatchPointer(target, 'pointerdown', 10, 10)
      dispatchPointer(target, 'pointermove', 12, 11)
      dispatchPointer(target, 'pointerup', 12, 11)
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx'])
      expect(writeText).toHaveBeenCalledWith('Route: / \n\n@src/A.tsx')
      inspector.dispose()
    })
  })

  describe('modifier selection', () => {
    const stubTwoButtons = () => {
      document.body.innerHTML = `
        <button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>
        <button id="b" data-inspect-devtools-source="/project/src/B.tsx:5:2">B</button>`
      stubRects({
        '#a': { left: 20, top: 20, width: 40, height: 20 },
        '#b': { left: 80, top: 20, width: 40, height: 20 },
      })
    }

    it('Shift+click adds elements while staying in inspect mode and copying all mentions', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      document.querySelector('#b')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx', '/project/src/B.tsx'])
      expect(inspector.isInspecting.value).toBe(true)
      expect(writeText).toHaveBeenLastCalledWith('Route: / \n\n@src/A.tsx\n@src/B.tsx')
      expect(inspector.feedback.value).toBe('Copied 2 source locations')
      expect(fetch).not.toHaveBeenCalled()
      inspector.dispose()
    })

    it('ignores Shift+click on an already selected element', async () => {
      vi.stubGlobal('fetch', vi.fn())
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const target = document.querySelector('#a')!
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value).toHaveLength(1)
      expect(writeText).toHaveBeenCalledTimes(1)
      inspector.dispose()
    })

    it('Alt+click removes elements one by one and confirms when the selection is emptied', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      for (const selector of ['#a', '#b'])
        document.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, altKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/B.tsx'])
      expect(inspector.isInspecting.value).toBe(true)
      expect(writeText).toHaveBeenLastCalledWith('Route: / \n\n@src/B.tsx')
      expect(fetch).not.toHaveBeenCalled()

      document.querySelector('#b')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, altKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value).toHaveLength(0)
      expect(inspector.feedback.value).toBe('Selection cleared')
      inspector.dispose()
    })

    it('treats Alt+click on an unselected element as a no-op', async () => {
      vi.stubGlobal('fetch', vi.fn())
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      document.querySelector('#b')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, altKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx'])
      expect(writeText).toHaveBeenCalledTimes(1)
      inspector.dispose()
    })

    it('Alt+click inside a promoted marquee frame removes that entry', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }))
      stubClipboard()
      document.body.innerHTML = `
        <article id="card" data-inspect-devtools-source="/project/src/MetricCard.tsx:10:3">
          <div id="inner" data-inspect-devtools-source="/project/src/MetricCard.tsx:14:7">value</div>
        </article>`
      stubRects({
        '#card': { left: 20, top: 20, width: 200, height: 120 },
        '#inner': { left: 30, top: 30, width: 160, height: 80 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const card = document.querySelector('#card')!
      dispatchPointer(card, 'pointerdown', 10, 10)
      dispatchPointer(card, 'pointermove', 260, 180)
      dispatchPointer(card, 'pointerup', 260, 180)
      // 浏览器会在拖拽后补发一次 click，这里模拟它被 suppressClick 吞掉
      card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(inspector.selections.value).toHaveLength(1)

      inspector.startInspecting()
      document.querySelector('#inner')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, altKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value).toHaveLength(0)
      expect(inspector.overlayStyles.value).toHaveLength(0)
      expect(inspector.feedback.value).toBe('Selection cleared')
      inspector.dispose()
    })

    it('Shift+drag merges marquee hits into the current selection without duplicates', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      const first = document.querySelector('#a')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 140, 60)
      dispatchPointer(first, 'pointerup', 140, 60, { shiftKey: true })
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx', '/project/src/B.tsx'])
      expect(inspector.isInspecting.value).toBe(true)
      expect(writeText).toHaveBeenLastCalledWith('Route: / \n\n@src/A.tsx\n@src/B.tsx')
      expect(fetch).not.toHaveBeenCalled()
      inspector.dispose()
    })

    it('Alt+drag removes selected elements fully enclosed by the marquee', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const first = document.querySelector('#a')!
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 140, 60)
      dispatchPointer(first, 'pointerup', 140, 60)
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(inspector.selections.value).toHaveLength(2)

      inspector.startInspecting()
      dispatchPointer(first, 'pointerdown', 10, 10)
      dispatchPointer(first, 'pointermove', 70, 50)
      dispatchPointer(first, 'pointerup', 70, 50, { altKey: true })
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/B.tsx'])
      expect(inspector.isInspecting.value).toBe(true)
      expect(writeText).toHaveBeenLastCalledWith('Route: / \n\n@src/B.tsx')
      expect(fetch).not.toHaveBeenCalled()
      inspector.dispose()
    })

    it('Shift+click keeps adding after a plain click exited Inspect mode', async () => {
      const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      vi.stubGlobal('fetch', fetch)
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(inspector.isInspecting.value).toBe(false)

      document.querySelector('#b')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx', '/project/src/B.tsx'])
      expect(writeText).toHaveBeenLastCalledWith('Route: / \n\n@src/A.tsx\n@src/B.tsx')
      expect(fetch).toHaveBeenCalledTimes(1)
      inspector.dispose()
    })

    it('Alt+click subtracts from a persisted selection when not inspecting', async () => {
      vi.stubGlobal('fetch', vi.fn())
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      for (const selector of ['#a', '#b'])
        document.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      inspector.stopInspecting()

      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, altKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/B.tsx'])
      expect(writeText).toHaveBeenLastCalledWith('Route: / \n\n@src/B.tsx')
      inspector.dispose()
    })

    it('leaves modified clicks alone when nothing is selected and not inspecting', async () => {
      vi.stubGlobal('fetch', vi.fn())
      const writeText = stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true })
      document.querySelector('#a')!.dispatchEvent(event)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(event.defaultPrevented).toBe(false)
      expect(inspector.selections.value).toHaveLength(0)
      expect(writeText).not.toHaveBeenCalled()
      inspector.dispose()
    })

    it('leaves plain clicks alone when not inspecting even with a selection', async () => {
      vi.stubGlobal('fetch', vi.fn())
      stubClipboard()
      stubTwoButtons()

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      inspector.stopInspecting()

      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      document.querySelector('#b')!.dispatchEvent(event)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(event.defaultPrevented).toBe(false)
      expect(inspector.selections.value.map(item => item.filePath)).toEqual(['/project/src/A.tsx'])
      inspector.dispose()
    })

    it('previews the hovered element separately from committed frames', async () => {
      vi.stubGlobal('fetch', vi.fn())
      stubClipboard()
      document.body.innerHTML = '<button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>'
      stubRects({ '#a': { left: 20, top: 20, width: 40, height: 20 } })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const target = document.querySelector('#a')!
      dispatchPointer(target, 'pointermove', 25, 25)

      expect(inspector.hoverOverlayStyle.value).toMatchObject({ display: 'block', width: '40px' })
      expect(inspector.overlayStyles.value).toHaveLength(0)

      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(inspector.overlayStyles.value).toHaveLength(1)

      dispatchPointer(target, 'pointermove', 25, 25)
      expect(inspector.hoverOverlayStyle.value.display).toBe('none')
      expect(inspector.overlayStyles.value).toHaveLength(1)
      inspector.dispose()
    })
  })

  describe('modifier hover preview', () => {
    it('tracks modifier intent from pointer movement and keyboard, and resets on window blur', () => {
      vi.stubGlobal('fetch', vi.fn())
      document.body.innerHTML = '<button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>'
      stubRects({ '#a': { left: 20, top: 20, width: 40, height: 20 } })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const target = document.querySelector('#a')!

      dispatchPointer(target, 'pointermove', 25, 25, { shiftKey: true })
      expect(inspector.modifierAction.value).toBe('add')
      dispatchPointer(target, 'pointermove', 25, 25, { altKey: true })
      expect(inspector.modifierAction.value).toBe('subtract')
      dispatchPointer(target, 'pointermove', 25, 25, { altKey: true, shiftKey: true })
      expect(inspector.modifierAction.value).toBe('add')
      dispatchPointer(target, 'pointermove', 25, 25)
      expect(inspector.modifierAction.value).toBeNull()

      // 不移动鼠标，仅按键盘也能切换预览意图
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift', shiftKey: true }))
      expect(inspector.modifierAction.value).toBe('add')
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: 'Shift', shiftKey: false }))
      expect(inspector.modifierAction.value).toBeNull()

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'AltLeft', key: 'Alt', altKey: true }))
      expect(inspector.modifierAction.value).toBe('subtract')
      window.dispatchEvent(new Event('blur'))
      expect(inspector.modifierAction.value).toBeNull()
      inspector.dispose()
    })

    it('previews the removal target frame instead of the hovered child when Alt is held', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }))
      stubClipboard()
      document.body.innerHTML = `
        <article id="card" data-inspect-devtools-source="/project/src/MetricCard.tsx:10:3">
          <div id="inner" data-inspect-devtools-source="/project/src/MetricCard.tsx:14:7">value</div>
        </article>
        <button id="other" data-inspect-devtools-source="/project/src/Other.tsx:1:1">O</button>`
      stubRects({
        '#card': { left: 20, top: 20, width: 200, height: 120 },
        '#inner': { left: 30, top: 30, width: 160, height: 80 },
        '#other': { left: 300, top: 300, width: 40, height: 20 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      const card = document.querySelector('#card')!
      dispatchPointer(card, 'pointerdown', 10, 10)
      dispatchPointer(card, 'pointermove', 260, 180)
      dispatchPointer(card, 'pointerup', 260, 180)
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(inspector.selections.value).toHaveLength(1)

      inspector.startInspecting()
      // Alt 悬浮在已选框内的子元素上：预览的是将被移除的整个外框
      dispatchPointer(document.querySelector('#inner')!, 'pointermove', 40, 40, { altKey: true })
      expect(inspector.modifierAction.value).toBe('subtract')
      expect(inspector.hoverOverlayStyle.value).toMatchObject({ display: 'block', width: '200px', height: '120px' })

      // Alt 悬浮在未选中元素上：没有可移除目标，不显示预览
      dispatchPointer(document.querySelector('#other')!, 'pointermove', 310, 310, { altKey: true })
      expect(inspector.hoverOverlayStyle.value.display).toBe('none')

      // 松开 Alt：恢复普通悬停预览
      dispatchPointer(document.querySelector('#other')!, 'pointermove', 310, 310)
      expect(inspector.modifierAction.value).toBeNull()
      expect(inspector.hoverOverlayStyle.value).toMatchObject({ display: 'block', width: '40px' })
      inspector.dispose()
    })

    it('previews add and remove on hover with modifiers even after Inspect mode exited', async () => {
      vi.stubGlobal('fetch', vi.fn())
      stubClipboard()
      document.body.innerHTML = `
        <button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>
        <button id="b" data-inspect-devtools-source="/project/src/B.tsx:5:2">B</button>`
      stubRects({
        '#a': { left: 20, top: 20, width: 40, height: 20 },
        '#b': { left: 80, top: 20, width: 40, height: 20 },
      })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      inspector.startInspecting()
      document.querySelector('#a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
      inspector.stopInspecting()

      // Shift+悬浮未选中元素：加选预览（即使不在检查模式）
      dispatchPointer(document.querySelector('#b')!, 'pointermove', 85, 25, { shiftKey: true })
      expect(inspector.modifierAction.value).toBe('add')
      expect(inspector.hoverOverlayStyle.value).toMatchObject({ display: 'block', width: '40px' })

      // Alt+悬浮已选元素：减选预览
      dispatchPointer(document.querySelector('#a')!, 'pointermove', 25, 25, { altKey: true })
      expect(inspector.modifierAction.value).toBe('subtract')
      expect(inspector.hoverOverlayStyle.value).toMatchObject({ display: 'block', width: '40px' })

      // 松开修饰键：不在检查模式，悬浮预览立即隐藏
      dispatchPointer(document.querySelector('#b')!, 'pointermove', 85, 25)
      expect(inspector.hoverOverlayStyle.value.display).toBe('none')
      inspector.dispose()
    })

    it('shows no hover preview outside Inspect mode when nothing is selected', () => {
      vi.stubGlobal('fetch', vi.fn())
      document.body.innerHTML = '<button id="a" data-inspect-devtools-source="/project/src/A.tsx:3:1">A</button>'
      stubRects({ '#a': { left: 20, top: 20, width: 40, height: 20 } })

      const inspector = useInspector(createClientOptions({ framework: 'react' }))
      dispatchPointer(document.querySelector('#a')!, 'pointermove', 25, 25, { shiftKey: true })
      expect(inspector.modifierAction.value).toBe('add')
      expect(inspector.hoverOverlayStyle.value.display).toBe('none')
      dispatchPointer(document.querySelector('#a')!, 'pointermove', 25, 25)
      expect(inspector.hoverOverlayStyle.value.display).toBe('none')
      inspector.dispose()
    })
  })
})
