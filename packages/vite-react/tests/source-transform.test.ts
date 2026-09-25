import { describe, expect, it } from 'vitest'
import { transformReactInspectorSource } from '../src/source-transform'

describe('transformReactInspectorSource', () => {
  it('adds inspect metadata to JSX DOM elements', () => {
    const code = `
export const MetricCard = () => (
  <article className="metric-card">
    <strong>42ms</strong>
  </article>
)
`

    const transformed = transformReactInspectorSource(code, '/project/src/main.tsx')!

    expect(transformed.code).toContain('data-inspect-devtools-source="/project/src/main.tsx:3:3"')
    expect(transformed.code).toContain('data-inspect-devtools-component="MetricCard"')
    expect(transformed.code).toContain('data-inspect-devtools-source="/project/src/main.tsx:4:5"')
    expect(transformed.map).toBeDefined()
    expect(transformed.map.sources).toContain('/project/src/main.tsx')
  })

  it('does not add source metadata to component tags', () => {
    const code = 'export const App = () => <MetricCard label="Latency" />'

    expect(transformReactInspectorSource(code, '/project/src/main.tsx')).toBeUndefined()
  })

  it('keeps existing inspect metadata intact', () => {
    const code = 'export const App = () => <button data-inspect-devtools-source="custom:1:1" />'

    const transformed = transformReactInspectorSource(code, '/project/src/main.tsx')!

    expect(transformed.code).toContain('data-inspect-devtools-source="custom:1:1"')
    expect(transformed.code).not.toContain('data-inspect-devtools-source="/project/src/main.tsx')
    expect(transformed.map).toBeDefined()
  })
})
