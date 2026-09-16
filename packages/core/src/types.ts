export type InspectDevtoolsFramework = 'react' | 'vue'
// 'cursor' produces an `@relative/path` file mention, which both Cursor and Claude Code accept.
export type CopyFormat = 'codex' | 'cursor'

export interface InspectDevtoolsOptions {
  openInEditor?: string
  copyFormat?: CopyFormat
}

export interface ResolvedInspectDevtoolsOptions {
  openInEditor?: string
  copyFormat: CopyFormat
}

export interface ClientInspectDevtoolsOptions {
  framework: InspectDevtoolsFramework
  copyFormat: CopyFormat
  projectRoot: string
  endpoints: {
    openInEditor: string
  }
}

export interface GrabSelection {
  framework: InspectDevtoolsFramework
  tagName: string
  componentName?: string
  filePath?: string
  line?: number
  column?: number
  cssSelector?: string
}
