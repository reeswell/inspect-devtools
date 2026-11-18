import type { InspectDevtoolsOptions, ResolvedInspectDevtoolsOptions } from './types.ts'

export const normalizeCopyMentionPrefix = (prefix: string | undefined): string => {
  if (!prefix)
    return ''
  return prefix.replace(/\\/g, '/').trim().replace(/^@+/, '').replace(/^\/+|\/+$/g, '')
}

export const resolveInspectDevtoolsOptions = (options: InspectDevtoolsOptions = {}): ResolvedInspectDevtoolsOptions => ({
  openInEditor: options.openInEditor,
  editorProtocol: options.editorProtocol ?? 'auto',
  allowedDirs: options.allowedDirs ?? [],
  theme: options.theme ?? 'light',
  copyRoute: options.copyRoute ?? false,
  copyFormat: options.copyFormat ?? 'mention',
  copyLineColumn: options.copyLineColumn ?? false,
  copyMentionPrefix: normalizeCopyMentionPrefix(options.copyMentionPrefix),
  openOnClick: options.openOnClick ?? false,
})
