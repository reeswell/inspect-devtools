import { createUnplugin } from 'unplugin'
import type { InspectDevtoolsFramework, InspectDevtoolsOptions } from '@inspect-devtools/core'
import { transformReactInspectorSource } from '@inspect-devtools/vite-react'
import { transformSvelteInspectorSource } from '@inspect-devtools/vite-svelte'

export interface UnpluginInspectDevtoolsOptions extends InspectDevtoolsOptions {
  framework?: InspectDevtoolsFramework
}

const JSX_RE = /\.[cm]?[jt]sx$/
const SVELTE_RE = /\.svelte$/

export const unplugin = createUnplugin<UnpluginInspectDevtoolsOptions | undefined>((userOptions = {}) => {
  const framework = userOptions.framework

  return {
    name: 'inspect-devtools:unplugin',
    enforce: 'pre',
    transformInclude(id) {
      if (id.includes('/node_modules/'))
        return false

      const [filename] = id.split('?', 2)

      if (framework === 'react')
        return JSX_RE.test(filename)

      if (framework === 'svelte')
        return SVELTE_RE.test(filename)

      return JSX_RE.test(filename) || SVELTE_RE.test(filename)
    },
    transform(code, id) {
      const [filename] = id.split('?', 2)

      if (JSX_RE.test(filename)) {
        const transformed = transformReactInspectorSource(code, id)
        return transformed ? { code: transformed.code, map: transformed.map } : undefined
      }

      if (SVELTE_RE.test(filename)) {
        const transformed = transformSvelteInspectorSource(code, id)
        return transformed ? { code: transformed.code } : undefined
      }

      return undefined
    },
  }
})

export default unplugin
