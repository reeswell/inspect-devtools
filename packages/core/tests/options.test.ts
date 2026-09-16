import { describe, expect, it } from 'vitest'
import { resolveInspectDevtoolsOptions } from '../src/options'

describe('resolveInspectDevtoolsOptions', () => {
  it('defaults to the codex copy format', () => {
    const options = resolveInspectDevtoolsOptions()

    expect(options.copyFormat).toBe('codex')
  })

  it('keeps the editor override', () => {
    const options = resolveInspectDevtoolsOptions({ openInEditor: 'code' })

    expect(options.openInEditor).toBe('code')
  })

  it('resolves configured copy formats', () => {
    expect(resolveInspectDevtoolsOptions({ copyFormat: 'cursor' }).copyFormat).toBe('cursor')
  })
})
