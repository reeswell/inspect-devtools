import type { InspectDevtoolsOptions, ResolvedInspectDevtoolsOptions } from './types.ts'

export const resolveInspectDevtoolsOptions = (options: InspectDevtoolsOptions = {}): ResolvedInspectDevtoolsOptions => ({
  openInEditor: options.openInEditor,
  theme: options.theme ?? 'light',
  copyRoute: options.copyRoute ?? false,
  copyFormat: options.copyFormat ?? 'mention',
  copyLineColumn: options.copyLineColumn ?? false,
  openOnClick: options.openOnClick ?? true,
})
