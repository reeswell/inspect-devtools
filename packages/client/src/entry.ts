import { createApp } from 'vue'
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import App from './App.vue'
import { installInspectLayer } from './inspect-layer'
import './style.css'

const CONTAINER_ID = '__inspect_devtools_container__'

export const mountInspectDevtools = (options: ClientInspectDevtoolsOptions): void => {
  if (document.getElementById(CONTAINER_ID))
    return

  const element = document.createElement('div')
  element.id = CONTAINER_ID
  element.dataset.inspectDevtools = 'true'
  document.body.appendChild(element)
  installInspectLayer(element)

  createApp(App, { options }).mount(element)
}
