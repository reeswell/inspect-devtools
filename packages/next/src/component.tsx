'use client'

import { useEffect } from 'react'
import { mountInspectDevtools } from '@inspect-devtools/client'
import { resolveInspectDevtoolsOptions, type InspectDevtoolsOptions } from '@inspect-devtools/core/browser'

export interface InspectDevtoolsProps {
  options?: InspectDevtoolsOptions
}

export function InspectDevtools({ options }: InspectDevtoolsProps): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined')
      return

    // Dynamically load client styles on client-side mount without failing Node ESM in next.config
    // @ts-expect-error untyped css asset
    import('@inspect-devtools/client/dist/style.css').catch(() => {})

    const resolved = resolveInspectDevtoolsOptions(options)
    mountInspectDevtools({
      framework: 'react',
      theme: resolved.theme,
      copyRoute: resolved.copyRoute,
      copyFormat: resolved.copyFormat,
      copyLineColumn: resolved.copyLineColumn,
      openOnClick: resolved.openOnClick,
      projectRoot: '',
      editorProtocol: resolved.editorProtocol,
      openInEditor: resolved.openInEditor,
      endpoints: {
        openInEditor: '/__nextjs_launch-editor',
      },
    })
  }, [options])

  return null
}
