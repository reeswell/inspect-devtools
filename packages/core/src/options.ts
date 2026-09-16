import type { InspectDevtoolsOptions, ResolvedInspectDevtoolsOptions } from './types.ts'

export const resolveInspectDevtoolsOptions = (options: InspectDevtoolsOptions = {}): ResolvedInspectDevtoolsOptions => ({
  openInEditor: options.openInEditor,
  copyFormat: options.copyFormat ?? 'codex',
})
