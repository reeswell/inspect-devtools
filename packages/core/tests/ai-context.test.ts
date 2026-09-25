import { describe, expect, it } from 'vitest'
import {
  createAIContextSnapshot,
  formatAIContextMarkdown,
  formatHierarchyChain,
} from '../src/ai-context'
import type { ComponentAIContextSnapshot, GrabSelection } from '../src/types'

describe('formatHierarchyChain', () => {
  it('formats hierarchy chain with backticks and chevron arrows', () => {
    const chain = formatHierarchyChain([
      { componentName: 'App' },
      { componentName: 'Dashboard' },
      { componentName: 'MetricCard' },
    ])
    expect(chain).toBe('`App` > `Dashboard` > `MetricCard`')
  })

  it('returns undefined for empty hierarchy', () => {
    expect(formatHierarchyChain([])).toBeUndefined()
    expect(formatHierarchyChain(undefined)).toBeUndefined()
  })
})

describe('createAIContextSnapshot', () => {
  it('creates clean snapshot with route and location', () => {
    const el = document.createElement('div')
    const selection: GrabSelection = {
      framework: 'react',
      tagName: 'div',
      componentName: 'MetricCard',
      filePath: '/src/components/MetricCard.tsx',
      line: 10,
      column: 2,
      hierarchy: [{ componentName: 'App' }, { componentName: 'MetricCard' }],
    }

    const snapshot = createAIContextSnapshot(el, selection)
    expect(snapshot.componentName).toBe('MetricCard')
    expect(snapshot.filePath).toBe('/src/components/MetricCard.tsx')
    expect(snapshot.line).toBe(10)
    expect(snapshot.column).toBe(2)
    expect(snapshot.hierarchy).toHaveLength(2)
    expect(snapshot.route).toBe('/')
  })
})

describe('formatAIContextMarkdown', () => {
  it('formats snapshot into clean 3-line markdown', () => {
    const snapshot: ComponentAIContextSnapshot = {
      componentName: 'MetricCard',
      filePath: '/src/components/MetricCard.tsx',
      line: 12,
      column: 4,
      route: '/dashboard',
      hierarchy: [
        { componentName: 'App' },
        { componentName: 'MetricCard', filePath: '/src/components/MetricCard.tsx', line: 12, column: 4 },
      ],
    }

    const md = formatAIContextMarkdown(snapshot)
    expect(md).toBe('@/src/components/MetricCard.tsx:12:4\nHierarchy: `App` > `MetricCard`\nRoute: /dashboard')
    expect(md).not.toContain('<MetricCard />')
  })

  it('handles snapshot without source file path', () => {
    const snapshot: ComponentAIContextSnapshot = {
      componentName: 'UnknownButton',
      route: '/',
    }

    const md = formatAIContextMarkdown(snapshot)
    expect(md).toBe('<UnknownButton />\nRoute: /')
  })
})
