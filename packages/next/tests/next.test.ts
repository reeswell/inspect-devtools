import { describe, expect, it, vi } from 'vitest'
import { withInspectDevtools } from '../src/index'
import inspectDevtoolsLoader from '../src/loader'

describe('@inspect-devtools/next', () => {
  describe('withInspectDevtools', () => {
    it('adds loader rule when dev is true', () => {
      const config = withInspectDevtools()
      const webpackConfig: any = { module: { rules: [] } }
      const context: any = { dev: true, isServer: false }

      const result = config.webpack!(webpackConfig, context)
      expect(result.module.rules.length).toBe(1)
      expect(result.module.rules[0].test).toEqual(/\.[cm]?[jt]sx$/)
    })

    it('does not add loader rule when dev is false', () => {
      const config = withInspectDevtools()
      const webpackConfig: any = { module: { rules: [] } }
      const context: any = { dev: false, isServer: false }

      const result = config.webpack!(webpackConfig, context)
      expect(result.module.rules.length).toBe(0)
    })

    it('chains custom nextConfig.webpack', () => {
      const customWebpack = vi.fn().mockImplementation(c => c)
      const config = withInspectDevtools({ webpack: customWebpack })
      const webpackConfig: any = { module: { rules: [] } }
      const context: any = { dev: true, isServer: false }

      config.webpack!(webpackConfig, context)
      expect(customWebpack).toHaveBeenCalledWith(webpackConfig, context)
    })

    it('sets process.env.REACT_EDITOR when options.openInEditor is passed', () => {
      delete process.env.REACT_EDITOR
      withInspectDevtools({}, { openInEditor: 'code' })
      expect(process.env.REACT_EDITOR).toBe('code')
      delete process.env.REACT_EDITOR
    })
  })

  describe('loader', () => {
    it('transforms JSX element and injects inspect attributes', () => {
      const callback = vi.fn()
      const context = {
        resourcePath: '/app/src/Button.tsx',
        callback,
      }

      const inputCode = `export function Button() { return <button>Click</button> }`
      inspectDevtoolsLoader.call(context as any, inputCode)

      expect(callback).toHaveBeenCalledTimes(1)
      const [err, outputCode] = callback.mock.calls[0]
      expect(err).toBeNull()
      expect(outputCode).toContain('data-inspect-devtools-source')
      expect(outputCode).toContain('/app/src/Button.tsx:1:')
    })

    it('bypasses files inside node_modules', () => {
      const callback = vi.fn()
      const context = {
        resourcePath: '/node_modules/some-lib/index.tsx',
        callback,
      }

      const inputCode = `export function Lib() { return <div>Lib</div> }`
      inspectDevtoolsLoader.call(context as any, inputCode)

      expect(callback).toHaveBeenCalledWith(null, inputCode, undefined)
    })
  })
})
