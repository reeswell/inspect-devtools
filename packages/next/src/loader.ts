import { transformReactInspectorSource } from '@inspect-devtools/vite-react'

export interface InspectDevtoolsLoaderContext {
  resourcePath: string
  callback: (err: Error | null, content?: string, sourceMap?: unknown) => void
}

export default function inspectDevtoolsLoader(
  this: InspectDevtoolsLoaderContext,
  source: string,
  map?: unknown,
) {
  const resourcePath = this.resourcePath
  if (!resourcePath || resourcePath.includes('node_modules'))
    return this.callback(null, source, map)

  try {
    const transformed = transformReactInspectorSource(source, resourcePath)
    if (transformed)
      return this.callback(null, transformed.code, transformed.map || map)
    return this.callback(null, source, map)
  }
  catch {
    return this.callback(null, source, map)
  }
}
