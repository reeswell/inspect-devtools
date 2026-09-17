import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTheme, loadPersistedTheme, persistTheme } from './theme'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('isTheme', () => {
  it('accepts the supported themes', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('light')).toBe(true)
  })

  it('rejects unknown or empty values', () => {
    expect(isTheme('auto')).toBe(false)
    expect(isTheme('')).toBe(false)
    expect(isTheme(null)).toBe(false)
    expect(isTheme(undefined)).toBe(false)
  })
})

describe('theme persistence', () => {
  it('returns undefined when nothing is persisted', () => {
    expect(loadPersistedTheme('/project')).toBeUndefined()
  })

  it('round-trips a persisted theme per project root', () => {
    persistTheme('/project', 'light')
    persistTheme('/other-project', 'dark')

    expect(loadPersistedTheme('/project')).toBe('light')
    expect(loadPersistedTheme('/other-project')).toBe('dark')
    expect(localStorage.getItem('inspect-devtools:theme:/project')).toBe('light')
  })

  it('ignores persisted values that are not valid themes', () => {
    localStorage.setItem('inspect-devtools:theme:/project', 'not-a-theme')

    expect(loadPersistedTheme('/project')).toBeUndefined()
  })

  it('keeps working when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    })

    expect(loadPersistedTheme('/project')).toBeUndefined()
    expect(() => persistTheme('/project', 'light')).not.toThrow()
  })
})
