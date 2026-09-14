export const INSPECT_DEVTOOLS_PATH = '/__inspect-devtools__'
export const INSPECT_DEVTOOLS_CLIENT_ID = 'virtual:inspect-devtools-client'
export const RESOLVED_INSPECT_DEVTOOLS_CLIENT_ID = `\0${INSPECT_DEVTOOLS_CLIENT_ID}`

export const clientEndpoints = (base = '/') => ({
  openInEditor: `${base}${INSPECT_DEVTOOLS_PATH.slice(1)}/open-in-editor`,
})
