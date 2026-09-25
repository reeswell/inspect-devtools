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

  it('defaults copyRoute to false and honors an explicit opt-in', () => {
    expect(resolveInspectDevtoolsOptions().copyRoute).toBe(false)
    expect(resolveInspectDevtoolsOptions({ copyRoute: true }).copyRoute).toBe(true)
  })

  it('defaults copyFormat to mention and resolves the link format', () => {
    expect(resolveInspectDevtoolsOptions().copyFormat).toBe('mention')
    expect(resolveInspectDevtoolsOptions({ copyFormat: 'link' }).copyFormat).toBe('link')
  })

  it('defaults copyLineColumn to false and resolves boolean and granularity values', () => {
    expect(resolveInspectDevtoolsOptions().copyLineColumn).toBe(false)
    expect(resolveInspectDevtoolsOptions({ copyLineColumn: true }).copyLineColumn).toBe(true)
    expect(resolveInspectDevtoolsOptions({ copyLineColumn: 'line' }).copyLineColumn).toBe('line')
    expect(resolveInspectDevtoolsOptions({ copyLineColumn: 'column' }).copyLineColumn).toBe('column')
  })

  it('defaults openOnClick to true and honors an explicit opt-out', () => {
    expect(resolveInspectDevtoolsOptions().openOnClick).toBe(true)
    expect(resolveInspectDevtoolsOptions({ openOnClick: false }).openOnClick).toBe(false)
  })

  it('defaults editorProtocol to auto and honors configured protocols', () => {
    expect(resolveInspectDevtoolsOptions().editorProtocol).toBe('auto')
    expect(resolveInspectDevtoolsOptions({ editorProtocol: 'cursor' }).editorProtocol).toBe('cursor')
    expect(resolveInspectDevtoolsOptions({ editorProtocol: 'vscode' }).editorProtocol).toBe('vscode')
  })

  it('defaults allowedDirs to empty array and resolves configured allowedDirs', () => {
    expect(resolveInspectDevtoolsOptions().allowedDirs).toEqual([])
    expect(resolveInspectDevtoolsOptions({ allowedDirs: ['/custom/path'] }).allowedDirs).toEqual(['/custom/path'])
  })
})
