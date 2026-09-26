import { describe, expect, it } from 'vitest'
import unplugin from '../src/index'

describe('@inspect-devtools/unplugin', () => {
  it('exposes bundler integration plugins', () => {
    expect(typeof unplugin.vite).toBe('function')
    expect(typeof unplugin.webpack).toBe('function')
    expect(typeof unplugin.rspack).toBe('function')
    expect(typeof unplugin.rollup).toBe('function')
    expect(typeof unplugin.esbuild).toBe('function')
  })

  it('transforms JSX source code with React framework', () => {
    const rawPlugin = unplugin.raw({ framework: 'react' }, {} as any)
    const id = '/src/Button.tsx'
    const code = `export function Button() { return <button>Click</button> }`

    const shouldTransform = (rawPlugin as any).transformInclude?.(id)
    expect(shouldTransform).toBe(true)

    const result = (rawPlugin as any).transform?.(code, id)
    expect(result).toBeDefined()
    expect(result.code).toContain('data-inspect-devtools-source')
  })

  it('transforms Svelte source code with Svelte framework', () => {
    const rawPlugin = unplugin.raw({ framework: 'svelte' }, {} as any)
    const id = '/src/Button.svelte'
    const code = `<button>Click</button>`

    const shouldTransform = (rawPlugin as any).transformInclude?.(id)
    expect(shouldTransform).toBe(true)

    const result = (rawPlugin as any).transform?.(code, id)
    expect(result).toBeDefined()
    expect(result.code).toContain('data-inspect-devtools-source')
  })

  it('ignores node_modules files', () => {
    const rawPlugin = unplugin.raw({}, {} as any)
    const id = '/node_modules/pkg/Button.tsx'

    const shouldTransform = (rawPlugin as any).transformInclude?.(id)
    expect(shouldTransform).toBe(false)
  })
})
