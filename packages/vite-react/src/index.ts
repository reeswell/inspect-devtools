import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { PluginOption } from 'vite'
import { createInspectDevtoolsPlugin, type InspectDevtoolsOptions } from '@inspect-devtools/core'
import { transformReactInspectorSource } from './source-transform.ts'

export type { InspectDevtoolsOptions }

const require = createRequire(import.meta.url)

const getClientAssets = () => {
  const clientPackage = require.resolve('@inspect-devtools/client/package.json')
  const clientDir = dirname(clientPackage)
  return {
    entry: join(clientDir, 'dist', 'entry.js'),
    style: join(clientDir, 'dist', 'style.css'),
  }
}

const reactInspectorSourcePlugin = (): PluginOption => ({
  name: 'inspect-devtools:react-source',
  enforce: 'pre',
  apply: 'serve',
  transform(code, id, transformOptions) {
    if (transformOptions?.ssr)
      return

    const transformed = transformReactInspectorSource(code, id)
    return transformed ? { code: transformed, map: null } : undefined
  },
})

export const inspectDevtoolsReact = (options?: InspectDevtoolsOptions): PluginOption[] => {
  const client = getClientAssets()
  return [
    reactInspectorSourcePlugin(),
    createInspectDevtoolsPlugin({
      framework: 'react',
      clientEntry: client.entry,
      clientStyle: client.style,
      options,
    }),
  ]
}

export default inspectDevtoolsReact
