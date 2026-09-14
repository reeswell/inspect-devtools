import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { PluginOption } from 'vite'
import VueInspector from 'vite-plugin-vue-inspector'
import { createInspectDevtoolsPlugin, type InspectDevtoolsOptions } from '@inspect-devtools/core'

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

export const inspectDevtoolsVue = (options?: InspectDevtoolsOptions): PluginOption[] => {
  const client = getClientAssets()
  return [
    VueInspector({
      toggleButtonVisibility: 'never',
      toggleComboKey: '',
    }),
    createInspectDevtoolsPlugin({
      framework: 'vue',
      clientEntry: client.entry,
      clientStyle: client.style,
      options,
    }),
  ]
}

export default inspectDevtoolsVue
