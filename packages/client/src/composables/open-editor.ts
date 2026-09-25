export type SupportedProtocol = 'vscode' | 'cursor' | 'webstorm'

export const formatEditorProtocolUrl = (
  protocol: SupportedProtocol,
  filePath: string,
  line?: number,
  column?: number,
): string => {
  const lineNum = line || 1
  const colNum = column || 1
  if (protocol === 'webstorm') {
    return `webstorm://open?file=${encodeURIComponent(filePath)}&line=${lineNum}&column=${colNum}`
  }
  return `${protocol}://file/${encodeURI(filePath)}:${lineNum}:${colNum}`
}

export const openViaUrlScheme = (url: string): void => {
  if (typeof window !== 'undefined') {
    window.location.assign(url)
  }
}
