import { describe, expect, it } from 'vitest'
import { resolveInspectDevtoolsOptions } from '../src/options'

describe('resolveInspectDevtoolsOptions', () => {
  it('defaults to the light theme', () => {
    const options = resolveInspectDevtoolsOptions()

    expect(options.theme).toBe('light')
  })

  it('keeps the editor override', () => {
    const options = resolveInspectDevtoolsOptions({ openInEditor: 'code' })

    expect(options.openInEditor).toBe('code')
  })

  it('resolves the configured theme', () => {
    expect(resolveInspectDevtoolsOptions({ theme: 'dark' }).theme).toBe('dark')
  })
})
