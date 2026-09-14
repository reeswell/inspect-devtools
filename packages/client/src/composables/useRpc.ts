import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  })
  const body = await response.json()
  if (!response.ok || body.error)
    throw new Error(body.error ?? `Request failed with ${response.status}`)
  return body as T
}

export const useRpc = (options: ClientInspectDevtoolsOptions) => {
  const openInEditor = (path: string, line?: number, column?: number) => requestJson<{ ok: boolean }>(options.endpoints.openInEditor, {
    method: 'POST',
    body: JSON.stringify({ path, line, column }),
  })

  return { openInEditor }
}
