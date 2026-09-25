import { describe, expect, it, vi } from 'vitest'
import {
  copyImageBlobToClipboard,
  findCommonAncestor,
} from './visualCrop'

describe('findCommonAncestor', () => {
  it('returns null for empty elements array', () => {
    expect(findCommonAncestor([])).toBeNull()
  })

  it('returns single element as its own ancestor', () => {
    const el = document.createElement('div')
    expect(findCommonAncestor([el])).toBe(el)
  })

  it('finds common parent element for sibling elements', () => {
    const parent = document.createElement('div')
    const child1 = document.createElement('span')
    const child2 = document.createElement('button')
    parent.appendChild(child1)
    parent.appendChild(child2)

    expect(findCommonAncestor([child1, child2])).toBe(parent)
  })
})

describe('copyImageBlobToClipboard', () => {
  it('writes PNG blob using ClipboardItem when supported', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined)
    class FakeClipboardItem {
      data: Record<string, Blob>
      constructor(data: Record<string, Blob>) {
        this.data = data
      }
    }

    vi.stubGlobal('navigator', {
      clipboard: {
        write: writeMock,
      },
    })
    vi.stubGlobal('ClipboardItem', FakeClipboardItem)

    const blob = new Blob(['image data'], { type: 'image/png' })
    const success = await copyImageBlobToClipboard(blob)

    expect(success).toBe(true)
    expect(writeMock).toHaveBeenCalledTimes(1)
  })

  it('writes PNG blob along with source text when text is provided', async () => {
    let capturedData: Record<string, Blob> | undefined
    const writeMock = vi.fn().mockImplementation(async (items) => {
      capturedData = items[0]?.data
    })
    class FakeClipboardItem {
      data: Record<string, Blob>
      constructor(data: Record<string, Blob>) {
        this.data = data
      }
    }

    vi.stubGlobal('navigator', {
      clipboard: {
        write: writeMock,
      },
    })
    vi.stubGlobal('ClipboardItem', FakeClipboardItem)

    const blob = new Blob(['image data'], { type: 'image/png' })
    const success = await copyImageBlobToClipboard(blob, '@src/Button.tsx:10:5')

    expect(success).toBe(true)
    expect(capturedData?.['image/png']).toBeDefined()
    expect(capturedData?.['text/plain']).toBeDefined()
  })

  it('returns false when clipboard write fails or is unsupported', async () => {
    vi.stubGlobal('navigator', {})
    const blob = new Blob(['image data'], { type: 'image/png' })
    const success = await copyImageBlobToClipboard(blob)
    expect(success).toBe(false)
  })
})
