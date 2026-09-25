export type InspectDevtoolsFramework = 'react' | 'vue'
// 'mention' 是 @ 引用（Cursor、Claude Code 等可解析）；'link' 是标准 Markdown 链接，面向非 AI 的粘贴目的地
export type CopyFormat = 'mention' | 'link'
export type CopyLineColumn = boolean | 'line' | 'column'
export type InspectDevtoolsTheme = 'dark' | 'light'
export type EditorProtocol = 'auto' | 'server' | 'vscode' | 'cursor' | 'webstorm' | 'custom'

export interface InspectDevtoolsOptions {
  openInEditor?: string
  editorProtocol?: EditorProtocol
  allowedDirs?: string[]
  theme?: InspectDevtoolsTheme
  copyRoute?: boolean
  copyFormat?: CopyFormat
  copyLineColumn?: CopyLineColumn
  openOnClick?: boolean
}

export interface ResolvedInspectDevtoolsOptions {
  openInEditor?: string
  editorProtocol: EditorProtocol
  allowedDirs: string[]
  theme: InspectDevtoolsTheme
  copyRoute: boolean
  copyFormat: CopyFormat
  copyLineColumn: CopyLineColumn
  openOnClick: boolean
}

export interface ClientInspectDevtoolsOptions {
  framework: InspectDevtoolsFramework
  theme: InspectDevtoolsTheme
  copyRoute: boolean
  copyFormat: CopyFormat
  copyLineColumn: CopyLineColumn
  openOnClick: boolean
  projectRoot: string
  editorProtocol: EditorProtocol
  openInEditor?: string
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
