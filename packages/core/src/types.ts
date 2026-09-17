export type InspectDevtoolsFramework = 'react' | 'vue'
// 'cursor' produces an `@relative/path` file mention, which both Cursor and Claude Code accept.
export type CopyFormat = 'codex' | 'cursor'
export type InspectDevtoolsTheme = 'dark' | 'light'

export interface InspectDevtoolsOptions {
  openInEditor?: string
  copyFormat?: CopyFormat
  theme?: InspectDevtoolsTheme
}

export interface ResolvedInspectDevtoolsOptions {
  openInEditor?: string
  copyFormat: CopyFormat
  theme: InspectDevtoolsTheme
}

export interface ClientInspectDevtoolsOptions {
  framework: InspectDevtoolsFramework
  copyFormat: CopyFormat
  theme: InspectDevtoolsTheme
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
