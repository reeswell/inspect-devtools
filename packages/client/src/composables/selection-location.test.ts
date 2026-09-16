import { describe, expect, it } from 'vitest'
import { formatSelectionLocation } from './selection-location'

describe('formatSelectionLocation', () => {
  it('returns undefined when no source file is available', () => {
    expect(formatSelectionLocation({ framework: 'react', tagName: 'div' })).toBeUndefined()
  })

  describe('codex format', () => {
    it('formats a standard Markdown link without line and column numbers', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'button',
        filePath: '/project/src/App.tsx',
        line: 12,
        column: 7,
      })).toBe('[App.tsx](/project/src/App.tsx)')
    })

    it('omits source metadata when only a line number is available', () => {
      expect(formatSelectionLocation({ framework: 'react', tagName: 'div', filePath: '/project/src/App.tsx', line: 12 }))
        .toBe('[App.tsx](/project/src/App.tsx)')
    })

    it('formats a Vue file path', () => {
      expect(formatSelectionLocation({
        framework: 'vue',
        tagName: 'button',
        filePath: '/project/src/App.vue',
      })).toBe('[App.vue](/project/src/App.vue)')
    })

    it('normalizes Windows paths and escapes Markdown delimiters', () => {
      expect(formatSelectionLocation({
        framework: 'vue',
        tagName: 'button',
        filePath: 'C:\\workspace\\[demo]\\App[preview].vue',
      })).toBe('[App\\[preview\\].vue](C:/workspace/\\[demo\\]/App\\[preview\\].vue)')
    })

    it('escapes parentheses in the link destination', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'button',
        filePath: '/project/src/App (copy).tsx',
      })).toBe('[App (copy).tsx](/project/src/App \\(copy\\).tsx)')
    })
  })

  describe('cursor format', () => {
    it('formats a project-relative path with an @ prefix', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'div',
        filePath: '/project/playgrounds/react/src/components/ActivityFeed.tsx',
        line: 4,
        column: 2,
      }, 'cursor', '/project')).toBe('@playgrounds/react/src/components/ActivityFeed.tsx')
    })

    it('falls back to an absolute path for files outside the project root', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'div',
        filePath: '/other/lib/index.ts',
      }, 'cursor', '/project')).toBe('@/other/lib/index.ts')
    })

    it('falls back to an absolute path when no project root is provided', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'div',
        filePath: '/project/src/App.tsx',
      }, 'cursor')).toBe('@/project/src/App.tsx')
    })

    it('normalizes Windows paths and tolerates a trailing slash on the project root', () => {
      expect(formatSelectionLocation({
        framework: 'vue',
        tagName: 'button',
        filePath: 'C:\\workspace\\app\\src\\App.vue',
      }, 'cursor', 'C:\\workspace\\app\\')).toBe('@src/App.vue')
    })
  })
})
