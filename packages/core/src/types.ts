export type InspectDevtoolsFramework = 'react' | 'vue'

export interface InspectDevtoolsOptions {
  openInEditor?: string
}

export interface ResolvedInspectDevtoolsOptions {
  openInEditor?: string
}

export interface ClientInspectDevtoolsOptions {
  framework: InspectDevtoolsFramework
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
