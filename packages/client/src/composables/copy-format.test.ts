import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearPersistedCopyFormat, isCopyFormat, loadPersistedCopyFormat, persistCopyFormat } from './copy-format'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('isCopyFormat', () => {
  it('accepts the supported copy formats', () => {
    expect(isCopyFormat('codex')).toBe(true)
    expect(isCopyFormat('cursor')).toBe(true)
  })

  it('rejects unknown or empty values', () => {
    expect(isCopyFormat('claude-code')).toBe(false)
    expect(isCopyFormat('markdown')).toBe(false)
    expect(isCopyFormat('')).toBe(false)
    expect(isCopyFormat(null)).toBe(false)
    expect(isCopyFormat(undefined)).toBe(false)
  })
})

describe('copy format persistence', () => {
  it('returns undefined when nothing is persisted', () => {
    expect(loadPersistedCopyFormat('/project')).toBeUndefined()
  })

  it('round-trips a persisted format per project root', () => {
    persistCopyFormat('/project', 'cursor')
    persistCopyFormat('/other-project', 'codex')

    expect(loadPersistedCopyFormat('/project')).toBe('cursor')
    expect(loadPersistedCopyFormat('/other-project')).toBe('codex')
    expect(localStorage.getItem('inspect-devtools:copy-format:/project')).toBe('cursor')
  })

  it('clears a persisted override', () => {
    persistCopyFormat('/project', 'cursor')
    clearPersistedCopyFormat('/project')

    expect(loadPersistedCopyFormat('/project')).toBeUndefined()
    expect(localStorage.getItem('inspect-devtools:copy-format:/project')).toBeNull()
  })

  it('ignores persisted values that are not valid copy formats', () => {
    localStorage.setItem('inspect-devtools:copy-format:/project', 'not-a-format')

    expect(loadPersistedCopyFormat('/project')).toBeUndefined()
  })

  it('keeps working when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    })

    expect(loadPersistedCopyFormat('/project')).toBeUndefined()
    expect(() => persistCopyFormat('/project', 'cursor')).not.toThrow()
    expect(() => clearPersistedCopyFormat('/project')).not.toThrow()
  })
})
