import { describe, expect, it } from 'vitest'
import { resolveInspectDevtoolsOptions } from '../src/options'

describe('resolveInspectDevtoolsOptions', () => {
  it('defaults to the codex copy format and light theme', () => {
    const options = resolveInspectDevtoolsOptions()

    expect(options.copyFormat).toBe('codex')
    expect(options.theme).toBe('light')
  })

  it('keeps the editor override', () => {
    const options = resolveInspectDevtoolsOptions({ openInEditor: 'code' })

    expect(options.openInEditor).toBe('code')
  })

  it('resolves configured copy formats and themes', () => {
    expect(resolveInspectDevtoolsOptions({ copyFormat: 'cursor' }).copyFormat).toBe('cursor')
    expect(resolveInspectDevtoolsOptions({ theme: 'dark' }).theme).toBe('dark')
  })
})
