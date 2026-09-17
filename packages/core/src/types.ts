export type InspectDevtoolsFramework = 'react' | 'vue'
export type InspectDevtoolsTheme = 'dark' | 'light'

export interface InspectDevtoolsOptions {
  openInEditor?: string
  theme?: InspectDevtoolsTheme
}

export interface ResolvedInspectDevtoolsOptions {
  openInEditor?: string
  theme: InspectDevtoolsTheme
}

export interface ClientInspectDevtoolsOptions {
  framework: InspectDevtoolsFramework
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
