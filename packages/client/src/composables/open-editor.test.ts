import { describe, expect, it } from 'vitest'
import { formatEditorProtocolUrl } from './open-editor'

describe('formatEditorProtocolUrl', () => {
  it('formats vscode file URLs with line and column', () => {
    const url = formatEditorProtocolUrl('vscode', '/app/src/App.tsx', 12, 4)
    expect(url).toBe('vscode://file//app/src/App.tsx:12:4')
  })

  it('formats cursor file URLs with default line and column if not provided', () => {
    const url = formatEditorProtocolUrl('cursor', '/app/src/Button.tsx')
    expect(url).toBe('cursor://file//app/src/Button.tsx:1:1')
  })

  it('formats webstorm URLs', () => {
    const url = formatEditorProtocolUrl('webstorm', '/app/src/index.ts', 20, 5)
    expect(url).toBe('webstorm://open?file=%2Fapp%2Fsrc%2Findex.ts&line=20&column=5')
  })
})
