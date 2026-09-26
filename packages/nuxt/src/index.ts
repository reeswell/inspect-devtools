import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addPlugin, addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import type { Plugin } from 'vite'
import { inspectDevtoolsVue } from '@inspect-devtools/vite-vue'
import { resolveInspectDevtoolsOptions, type InspectDevtoolsOptions } from '@inspect-devtools/core'

export type { InspectDevtoolsOptions }

const resolvePluginPath = (): string => {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const distPath = join(currentDir, 'runtime', 'plugin.client.js')
  if (existsSync(distPath))
    return distPath
  const srcPath = join(currentDir, 'runtime', 'plugin.client.ts')
  if (existsSync(srcPath))
    return srcPath
  return distPath
}

const inspectDevtoolsModule: NuxtModule<InspectDevtoolsOptions> = defineNuxtModule<InspectDevtoolsOptions>({
  meta: {
    name: '@inspect-devtools/nuxt',
    configKey: 'inspectDevtools',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {},
  setup(options, nuxt) {
    if (!nuxt.options.dev)
      return

    const resolvedOptions = resolveInspectDevtoolsOptions(options)

    nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {} as any
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.inspectDevtools = {
      ...resolvedOptions,
      projectRoot: nuxt.options.rootDir || '',
    }

    nuxt.options.css = nuxt.options.css || []
    nuxt.options.css.push('@inspect-devtools/client/dist/style.css')

    const plugins = (inspectDevtoolsVue(options) as (Plugin | null | undefined)[]).filter(Boolean) as Plugin[]
    for (const plugin of plugins)
      addVitePlugin(plugin)

    addPlugin({
      src: resolvePluginPath(),
      mode: 'client',
    })
  },
})

export default inspectDevtoolsModule
