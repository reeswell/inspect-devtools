import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`)

  if (response.status === 204)
    return { ok: true } as T

  const contentType = response.headers?.get?.('content-type') ?? ''
  if (contentType && !contentType.includes('application/json'))
    throw new Error(`Unexpected server response (${contentType || 'non-json'})`)

  const body = typeof response.json === 'function' ? await response.json() : {}
  if (body?.error)
    throw new Error(body.error)
  return body as T
}

export const useRpc = (options: ClientInspectDevtoolsOptions) => {
  const openInEditor = async (path: string, line?: number, column?: number) => {
    const endpoint = options.endpoints?.openInEditor || '/__inspect-devtools__/open-in-editor'
    if (endpoint.includes('__nextjs_launch-editor')) {
      const url = new URL(endpoint, window.location.origin)
      url.searchParams.set('file', path)
      if (line)
        url.searchParams.set('line1', String(line))
      if (column)
        url.searchParams.set('column1', String(column))
      const res = await fetch(url.toString())
      if (!res.ok)
        throw new Error(`Failed to launch editor (${res.status})`)
      return { ok: true }
    }

    return requestJson<{ ok: boolean }>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ path, line, column }),
    })
  }

  return { openInEditor }
}
