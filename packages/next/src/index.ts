import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { InspectDevtoolsOptions } from '@inspect-devtools/core'

export type { InspectDevtoolsOptions }

const require = createRequire(import.meta.url)

export interface NextWebpackConfig {
  module?: {
    rules?: unknown[]
  }
  [key: string]: unknown
}

export interface NextWebpackContext {
  dev: boolean
  isServer: boolean
  [key: string]: unknown
}

export interface NextConfig {
  webpack?: (config: NextWebpackConfig, context: NextWebpackContext) => NextWebpackConfig
  [key: string]: unknown
}

const resolveLoaderPath = (): string => {
  try {
    return require.resolve('@inspect-devtools/next/loader')
  }
  catch {}

  const currentDir = dirname(fileURLToPath(import.meta.url))
  const distPath = join(currentDir, 'loader.js')
  if (existsSync(distPath))
    return distPath

  const tsPath = join(currentDir, 'loader.ts')
  if (existsSync(tsPath))
    return tsPath

  return '@inspect-devtools/next/loader'
}

export const withInspectDevtools = (
  nextConfig: NextConfig = {},
  options?: InspectDevtoolsOptions,
): NextConfig => {
  if (options?.openInEditor && !process.env.REACT_EDITOR) {
    process.env.REACT_EDITOR = options.openInEditor
  }

  return {
    ...nextConfig,
    webpack(config: NextWebpackConfig, context: NextWebpackContext) {
      if (context.dev) {
        if (!config.module)
          config.module = {}
        if (!config.module.rules)
          config.module.rules = []

        config.module.rules.push({
          test: /\.[cm]?[jt]sx$/,
          exclude: /node_modules/,
          use: [
            {
              loader: resolveLoaderPath(),
              options,
            },
          ],
        })
      }

      if (typeof nextConfig.webpack === 'function')
        return nextConfig.webpack(config, context)

      return config
    },
  }
}

export default withInspectDevtools
