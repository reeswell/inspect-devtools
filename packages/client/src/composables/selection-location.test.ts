import { describe, expect, it } from 'vitest'
import { formatRouteLocation, formatSelectionLocation } from './selection-location'

describe('formatSelectionLocation', () => {
  it('returns undefined when no source file is available', () => {
    expect(formatSelectionLocation({ framework: 'react', tagName: 'div' })).toBeUndefined()
  })

  describe('mention format', () => {
    it('formats a project-relative @ mention without line and column numbers', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'button',
        filePath: '/project/src/App.tsx',
        line: 12,
        column: 7,
      }, 'mention', '/project')).toBe('@src/App.tsx')
    })

    it('omits source metadata when only a line number is available', () => {
      expect(formatSelectionLocation({ framework: 'react', tagName: 'div', filePath: '/project/src/App.tsx', line: 12 }, 'mention', '/project'))
        .toBe('@src/App.tsx')
    })

    it('formats a nested monorepo package path relative to the repository root', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'div',
        filePath: '/project/playgrounds/react/src/components/MetricCard.tsx',
      }, 'mention', '/project')).toBe('@playgrounds/react/src/components/MetricCard.tsx')
    })

    it('falls back to an absolute path for files outside the project root', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'div',
        filePath: '/other/lib/index.ts',
      }, 'mention', '/project')).toBe('@/other/lib/index.ts')
    })

    it('falls back to an absolute path when no project root is provided', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'div',
        filePath: '/project/src/App.tsx',
      })).toBe('@/project/src/App.tsx')
    })

    it('normalizes Windows paths and tolerates a trailing slash on the project root', () => {
      expect(formatSelectionLocation({
        framework: 'vue',
        tagName: 'button',
        filePath: 'C:\\workspace\\app\\src\\App.vue',
      }, 'mention', 'C:\\workspace\\app\\')).toBe('@src/App.vue')
    })
  })

  describe('link format', () => {
    it('formats a standard Markdown link without line and column numbers', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'button',
        filePath: '/project/src/App.tsx',
        line: 12,
        column: 7,
      }, 'link')).toBe('[App.tsx](/project/src/App.tsx)')
    })

    it('formats a Vue file path', () => {
      expect(formatSelectionLocation({
        framework: 'vue',
        tagName: 'button',
        filePath: '/project/src/App.vue',
      }, 'link')).toBe('[App.vue](/project/src/App.vue)')
    })

    it('normalizes Windows paths and escapes Markdown delimiters', () => {
      expect(formatSelectionLocation({
        framework: 'vue',
        tagName: 'button',
        filePath: 'C:\\workspace\\[demo]\\App[preview].vue',
      }, 'link')).toBe('[App\\[preview\\].vue](C:/workspace/\\[demo\\]/App\\[preview\\].vue)')
    })

    it('escapes parentheses in the link destination', () => {
      expect(formatSelectionLocation({
        framework: 'react',
        tagName: 'button',
        filePath: '/project/src/App (copy).tsx',
      }, 'link')).toBe('[App (copy).tsx](/project/src/App \\(copy\\).tsx)')
    })
  })
})

describe('formatRouteLocation', () => {
  it('formats pathname, search, and hash without the origin', () => {
    expect(formatRouteLocation({ pathname: '/dashboard', search: '?tab=overview', hash: '#metrics' }))
      .toBe('Route: /dashboard?tab=overview#metrics')
  })

  it('pads a trailing space when the route ends with a slash', () => {
    expect(formatRouteLocation({ pathname: '/', search: '', hash: '' })).toBe('Route: / ')
    expect(formatRouteLocation({ pathname: '/dashboard/', search: '', hash: '' })).toBe('Route: /dashboard/ ')
  })

  it('does not pad when search or hash follows the trailing slash', () => {
    expect(formatRouteLocation({ pathname: '/', search: '?tab=overview', hash: '' })).toBe('Route: /?tab=overview')
  })
})
