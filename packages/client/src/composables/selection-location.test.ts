import { describe, expect, it } from 'vitest'
import { formatSelectionLocation } from './selection-location'

describe('formatSelectionLocation', () => {
  it('formats copied locations with line and column numbers', () => {
    expect(formatSelectionLocation({
      framework: 'react',
      tagName: 'button',
      filePath: '/project/src/App.tsx',
      line: 12,
      column: 7,
    })).toBe('/project/src/App.tsx:12:7')
  })

  it('formats a location with only a line number', () => {
    expect(formatSelectionLocation({ framework: 'react', tagName: 'div', filePath: '/project/src/App.tsx', line: 12 }))
      .toBe('/project/src/App.tsx:12')
  })

  it('keeps the file path when line metadata is missing', () => {
    expect(formatSelectionLocation({
      framework: 'vue',
      tagName: 'button',
      filePath: '/project/src/App.vue',
    })).toBe('/project/src/App.vue')
  })
})
