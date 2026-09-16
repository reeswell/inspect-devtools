import type { CopyFormat } from '@inspect-devtools/core'

export const COPY_FORMATS: CopyFormat[] = ['codex', 'cursor']
export const isCopyFormat = (value: string | null | undefined): value is CopyFormat => Boolean(value && COPY_FORMATS.includes(value as CopyFormat))
const storageKey = (projectRoot: string) => `inspect-devtools:copy-format:${projectRoot}`
export const loadPersistedCopyFormat = (projectRoot: string): CopyFormat | undefined => {
  try {
    const value = localStorage.getItem(storageKey(projectRoot))
    return isCopyFormat(value) ? value : undefined
  } catch { return undefined }
}
export const persistCopyFormat = (projectRoot: string, format: CopyFormat): void => {
  try { localStorage.setItem(storageKey(projectRoot), format) } catch {}
}
export const clearPersistedCopyFormat = (projectRoot: string): void => {
  try { localStorage.removeItem(storageKey(projectRoot)) } catch {}
}
