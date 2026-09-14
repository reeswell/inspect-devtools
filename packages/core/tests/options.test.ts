import { describe, expect, it } from 'vitest'
import { resolveInspectDevtoolsOptions } from '../src/options'

describe('resolveInspectDevtoolsOptions', () => {
  it('keeps the zero-config default empty', () => {
    const options = resolveInspectDevtoolsOptions()

    expect(options).toEqual({})
  })

  it('keeps the editor override', () => {
    const options = resolveInspectDevtoolsOptions({ openInEditor: 'code' })

    expect(options.openInEditor).toBe('code')
  })
})
