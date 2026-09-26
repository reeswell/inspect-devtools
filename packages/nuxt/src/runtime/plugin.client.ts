import { mountInspectDevtools } from '@inspect-devtools/client'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { clientEndpoints } from '@inspect-devtools/core/browser'

export default (nuxtApp: any) => {
  if (typeof window === 'undefined')
    return

  const config = (nuxtApp?.$config?.public?.inspectDevtools || {}) as Record<string, any>
  const baseURL = nuxtApp?.$config?.app?.baseURL || '/'

  const clientOptions: ClientInspectDevtoolsOptions = {
    framework: 'vue',
    theme: config.theme ?? 'light',
    copyRoute: config.copyRoute ?? false,
    copyFormat: config.copyFormat ?? 'mention',
    copyLineColumn: config.copyLineColumn ?? false,
    openOnClick: config.openOnClick ?? false,
    projectRoot: config.projectRoot ?? '',
    editorProtocol: config.editorProtocol ?? 'auto',
    openInEditor: config.openInEditor,
    endpoints: clientEndpoints(baseURL),
  }

  mountInspectDevtools(clientOptions)
}
