import { describe, expect, it } from 'vitest'
import { transformSvelteInspectorSource } from '../src/source-transform'
import { inspectDevtoolsSvelte } from '../src/index'

describe('@inspect-devtools/vite-svelte', () => {
  describe('transformSvelteInspectorSource', () => {
    it('injects inspect attributes into Svelte HTML elements', () => {
      const code = `<script>let count = 0;</script>\n<button on:click={() => count++}>Count: {count}</button>`
      const id = '/src/lib/Counter.svelte'

      const result = transformSvelteInspectorSource(code, id)
      expect(result).toBeDefined()
      expect(result?.code).toContain('data-inspect-devtools-component="Counter"')
      expect(result?.code).toContain('data-inspect-devtools-source="/src/lib/Counter.svelte"')
    })

    it('ignores files in node_modules', () => {
      const code = `<button>Click</button>`
      const id = '/node_modules/some-svelte-lib/Button.svelte'

      const result = transformSvelteInspectorSource(code, id)
      expect(result).toBeUndefined()
    })

    it('ignores non-svelte files', () => {
      const code = `export const a = 1`
      const id = '/src/lib/utils.ts'

      const result = transformSvelteInspectorSource(code, id)
      expect(result).toBeUndefined()
    })
  })

  describe('inspectDevtoolsSvelte', () => {
    it('returns an array containing source and client devtools plugins', () => {
      const plugins = inspectDevtoolsSvelte()
      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBe(2)
      expect((plugins[0] as any).name).toBe('inspect-devtools:svelte-source')
      expect((plugins[1] as any).name).toBe('inspect-devtools:svelte')
    })
  })
})
