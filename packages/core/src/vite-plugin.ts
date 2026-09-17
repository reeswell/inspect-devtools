import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { clientEndpoints, INSPECT_DEVTOOLS_CLIENT_ID, RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID } from './protocol.ts'
import { resolveInspectDevtoolsOptions } from './options.ts'
import { registerInspectDevtoolsServer } from './server.ts'
import type { ClientInspectDevtoolsOptions, InspectDevtoolsFramework, InspectDevtoolsOptions } from './types.ts'

interface CreateInspectDevtoolsPluginOptions {
  framework: InspectDevtoolsFramework
  clientEntry: string
  clientStyle: string
  options?: InspectDevtoolsOptions
}

const findRepositoryRoot = (root: string): string => {
  let current = root
  for (;;) {
    if (existsSync(join(current, '.git')))
      return current
    const parent = dirname(current)
    if (parent === current)
      return root
    current = parent
  }
}

export const createInspectDevtoolsPlugin = ({ framework, clientEntry, clientStyle, options = {} }: CreateInspectDevtoolsPluginOptions): Plugin => {
  const resolvedOptions = resolveInspectDevtoolsOptions(options)
  let config: ResolvedConfig
  let projectRoot: string

  return {
    name: `inspect-devtools:${framework}`,
    enforce: 'pre',
    apply: 'serve',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      projectRoot = findRepositoryRoot(config.root)
    },
    configureServer(server) {
      registerInspectDevtoolsServer({
        server,
        root: config.root,
        options: resolvedOptions,
      })
    },
    resolveId(id) {
      if (id === INSPECT_DEVTOOLS_CLIENT_ID)
        return RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID
    },
    async load(id) {
      if (id === RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID) {
        const clientOptions: ClientInspectDevtoolsOptions = {
          framework,
          copyFormat: resolvedOptions.copyFormat,
          theme: resolvedOptions.theme,
          projectRoot,
          endpoints: clientEndpoints(config.base || '/'),
        }
        return [
          `import ${JSON.stringify(clientStyle)}`,
          `import { mountInspectDevtools } from ${JSON.stringify(clientEntry)}`,
          `mountInspectDevtools(${JSON.stringify(clientOptions)})`,
        ].join('\n')
      }
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'body',
          attrs: {
            type: 'module',
            src: `${config.base || '/'}@id/${INSPECT_DEVTOOLS_CLIENT_ID}`,
          },
        },
      ]
    },
  }
}
