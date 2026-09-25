import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path'
import launchEditor from 'launch-editor'
import type { ViteDevServer } from 'vite'
import { INSPECT_DEVTOOLS_PATH } from './protocol.ts'
import type { ResolvedInspectDevtoolsOptions } from './types.ts'

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

interface ServerRPCOptions {
  server: ViteDevServer
  root: string
  options: ResolvedInspectDevtoolsOptions
}

const sendJson = (response: ServerResponse, statusCode: number, body: unknown) => {
  response.writeHead(statusCode, JSON_HEADERS)
  response.end(JSON.stringify(body))
}

const readBody = async <T>(request: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = []
  for await (const chunk of request)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))

  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) as T : {} as T
}

const isSubPath = (base: string, target: string): boolean => {
  const candidate = relative(base, target)
  return candidate === '' || (!candidate.startsWith('..') && !isAbsolute(candidate))
}

const findWorkspaceRoot = (root: string): string => {
  let current = root
  for (;;) {
    if (existsSync(join(current, '.git')) || existsSync(join(current, 'pnpm-workspace.yaml')))
      return current
    const parent = dirname(current)
    if (parent === current)
      return root
    current = parent
  }
}

const cleanInlineReference = (value: string): string => value.trim().replace(/[),;]+$/g, '')

const normalizeRequestedPath = (requestedPath: string, root: string): string => {
  const cleaned = cleanInlineReference(requestedPath)

  try {
    const url = new URL(cleaned)
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:')
      return normalizeRequestedPath(decodeURIComponent(url.pathname), root)
  }
  catch {}

  const withoutQuery = cleaned.replace(/[?#].*$/, '')
  const fsPath = withoutQuery.replace(/^\/?@fs\//, '/')
  if (isAbsolute(fsPath) && !existsSync(fsPath)) {
    const projectRelative = fsPath.slice(1)
    if (existsSync(join(root, projectRelative)))
      return projectRelative
  }

  return fsPath
}

export const resolveProjectFile = (
  requestedPath: string,
  root: string,
  allowedDirs: string[] = [],
): string => {
  const normalizedPath = normalizeRequestedPath(requestedPath, root)
  const projectRoot = realpathSync(root)
  const workspaceRoot = findWorkspaceRoot(root)

  const safeRoots = [
    projectRoot,
    ...(workspaceRoot !== root && existsSync(workspaceRoot) ? [realpathSync(workspaceRoot)] : []),
    ...allowedDirs
      .map(dir => (existsSync(dir) ? realpathSync(dir) : null))
      .filter((dir): dir is string => dir !== null),
  ]

  const candidates = [
    resolve(isAbsolute(normalizedPath) ? normalizedPath : join(root, normalizedPath)),
    resolve(root, normalizedPath.replace(/^\/+/, '')),
  ]

  if (workspaceRoot !== root) {
    candidates.push(resolve(workspaceRoot, normalizedPath.replace(/^\/+/, '')))
  }

  const path = candidates.find((candidate) => {
    if (!existsSync(candidate) || !statSync(candidate).isFile())
      return false
    const realCandidate = realpathSync(candidate)
    return safeRoots.some(safeRoot => isSubPath(safeRoot, realCandidate))
  })
  if (!path)
    throw new Error('File is outside the project root or does not exist')

  return realpathSync(path)
}

export const registerInspectDevtoolsServer = ({ server, root, options }: ServerRPCOptions) => {
  server.middlewares.use(INSPECT_DEVTOOLS_PATH, async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost')
      const pathname = normalize(url.pathname)

      if (request.method === 'POST' && pathname === '/open-in-editor') {
        const body = await readBody<{ path?: string, line?: number, column?: number }>(request)
        if (!body.path)
          throw new Error('Missing path')
        const file = resolveProjectFile(body.path, root, options.allowedDirs)
        const suffix = body.line ? `:${body.line}${body.column ? `:${body.column}` : ''}` : ''
        launchEditor(`${file}${suffix}`, options.openInEditor)
        sendJson(response, 200, { ok: true })
        return
      }

      sendJson(response, 404, { error: 'Not found' })
    }
    catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  })
}
