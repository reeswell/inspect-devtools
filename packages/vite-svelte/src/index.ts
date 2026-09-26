import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { PluginOption } from 'vite'
import { createInspectDevtoolsPlugin, type InspectDevtoolsOptions } from '@inspect-devtools/core'
import { transformSvelteInspectorSource } from './source-transform.ts'

export type { InspectDevtoolsOptions }
export { transformSvelteInspectorSource } from './source-transform.ts'

const require = createRequire(import.meta.url)

const getClientAssets = () => {
  const clientPackage = require.resolve('@inspect-devtools/client/package.json')
  const clientDir = dirname(clientPackage)
  return {
    entry: join(clientDir, 'dist', 'entry.js'),
    style: join(clientDir, 'dist', 'style.css'),
  }
}

const svelteInspectorSourcePlugin = (): PluginOption => ({
  name: 'inspect-devtools:svelte-source',
  enforce: 'pre',
  apply: 'serve',
  transform(code, id, transformOptions) {
    if (transformOptions?.ssr)
      return

    const transformed = transformSvelteInspectorSource(code, id)
    return transformed ? { code: transformed.code } : undefined
  },
})

export const inspectDevtoolsSvelte = (options?: InspectDevtoolsOptions): PluginOption[] => {
  const client = getClientAssets()
  return [
    svelteInspectorSourcePlugin(),
    createInspectDevtoolsPlugin({
      framework: 'svelte',
      clientEntry: client.entry,
      clientStyle: client.style,
      options,
    }),
  ]
}

export default inspectDevtoolsSvelte
