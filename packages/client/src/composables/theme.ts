import type { InspectDevtoolsTheme } from '@inspect-devtools/core'

export const THEMES: InspectDevtoolsTheme[] = ['dark', 'light']
export const isTheme = (value: string | null | undefined): value is InspectDevtoolsTheme => Boolean(value && THEMES.includes(value as InspectDevtoolsTheme))
const storageKey = (projectRoot: string) => `inspect-devtools:theme:${projectRoot}`
export const loadPersistedTheme = (projectRoot: string): InspectDevtoolsTheme | undefined => {
  try {
    const value = localStorage.getItem(storageKey(projectRoot))
    return isTheme(value) ? value : undefined
  } catch { return undefined }
}
export const persistTheme = (projectRoot: string, theme: InspectDevtoolsTheme): void => {
  try { localStorage.setItem(storageKey(projectRoot), theme) } catch {}
}
