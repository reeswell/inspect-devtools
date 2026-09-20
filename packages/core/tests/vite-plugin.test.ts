import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { INSPECT_DEVTOOLS_CLIENT_ID, RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID } from '../src/protocol'
import { createInspectDevtoolsPlugin } from '../src/vite-plugin'

const getHook = (hook: unknown): ((...args: unknown[]) => unknown) => {
  if (typeof hook === 'function')
    return hook as (...args: unknown[]) => unknown
  if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function')
    return hook.handler as (...args: unknown[]) => unknown
  throw new TypeError('Expected a Vite hook')
}

describe('createInspectDevtoolsPlugin', () => {
  it('injects a client bootstrap into development HTML', async () => {
    const plugin = createInspectDevtoolsPlugin({
      framework: 'react',
      clientEntry: '/packages/client/dist/entry.js',
      clientStyle: '/packages/client/dist/style.css',
    })

    getHook(plugin.configResolved)({ base: '/app/', root: '/project' })

    expect(getHook(plugin.resolveId)(INSPECT_DEVTOOLS_CLIENT_ID)).toBe(RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID)
    expect(getHook(plugin.transformIndexHtml)()).toEqual([{
      tag: 'script',
      injectTo: 'body',
      attrs: {
        type: 'module',
        src: '/app/@id/virtual:inspect-devtools-client',
      },
    }])

    const code = String(await getHook(plugin.load)(RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID))
    expect(code).toContain('import "/packages/client/dist/style.css"')
    expect(code).toContain('mountInspectDevtools')
    expect(code).toContain('"framework":"react"')
    expect(code).toContain('"theme":"light"')
    expect(code).toContain('"copyRoute":false')
    expect(code).toContain('"copyFormat":"mention"')
    expect(code).toContain('"projectRoot":"/project"')
  })

  it('passes the configured theme to the client', async () => {
    const plugin = createInspectDevtoolsPlugin({
      framework: 'react',
      clientEntry: '/packages/client/dist/entry.js',
      clientStyle: '/packages/client/dist/style.css',
      options: { theme: 'dark' },
    })

    getHook(plugin.configResolved)({ base: '/', root: '/project' })

    const code = String(await getHook(plugin.load)(RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID))
    expect(code).toContain('"theme":"dark"')
  })

  it('passes the copyRoute opt-out to the client', async () => {
    const plugin = createInspectDevtoolsPlugin({
      framework: 'react',
      clientEntry: '/packages/client/dist/entry.js',
      clientStyle: '/packages/client/dist/style.css',
      options: { copyRoute: false },
    })

    getHook(plugin.configResolved)({ base: '/', root: '/project' })

    const code = String(await getHook(plugin.load)(RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID))
    expect(code).toContain('"copyRoute":false')
  })

  it('passes the copyFormat option to the client', async () => {
    const plugin = createInspectDevtoolsPlugin({
      framework: 'react',
      clientEntry: '/packages/client/dist/entry.js',
      clientStyle: '/packages/client/dist/style.css',
      options: { copyFormat: 'link' },
    })

    getHook(plugin.configResolved)({ base: '/', root: '/project' })

    const code = String(await getHook(plugin.load)(RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID))
    expect(code).toContain('"copyFormat":"link"')
  })


  it('resolves the client project root to the repository root of a monorepo package', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'inspect-devtools-repo-'))
    const appRoot = join(repoRoot, 'playgrounds', 'react')
    await mkdir(join(repoRoot, '.git'))
    await mkdir(appRoot, { recursive: true })

    try {
      const plugin = createInspectDevtoolsPlugin({
        framework: 'react',
        clientEntry: '/packages/client/dist/entry.js',
        clientStyle: '/packages/client/dist/style.css',
      })

      getHook(plugin.configResolved)({ base: '/', root: appRoot })

      const code = String(await getHook(plugin.load)(RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID))
      expect(code).toContain(`"projectRoot":${JSON.stringify(repoRoot)}`)
    }
    finally {
      await rm(repoRoot, { recursive: true, force: true })
    }
  })
})
