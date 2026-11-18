import { describe, expect, it } from 'vitest'
import { installInspectLayer } from './inspect-layer'

const openingToggle = (): Event => {
  const event = new Event('toggle', { bubbles: true })
  Object.defineProperty(event, 'newState', { value: 'open' })
  return event
}

describe('installInspectLayer', () => {
  it('does not mark the overlay as a popover when the browser cannot show one', () => {
    const element = document.createElement('div')
    element.showPopover = undefined as unknown as HTMLElement['showPopover']
    installInspectLayer(element)
    expect(element.hasAttribute('popover')).toBe(false)
  })

  it('stays above a newly opened dialog or popover and ignores its own toggle', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const calls: string[] = []
    element.showPopover = () => { calls.push('show') }
    element.hidePopover = () => { calls.push('hide') }

    const dispose = installInspectLayer(element)
    expect(element.getAttribute('popover')).toBe('manual')
    expect(calls).toEqual(['show'])

    const dialog = document.createElement('dialog')
    document.body.appendChild(dialog)
    dialog.dispatchEvent(openingToggle())
    expect(calls).toEqual(['show', 'hide', 'show'])

    element.dispatchEvent(openingToggle())
    expect(calls).toEqual(['show', 'hide', 'show'])

    dispose()
    expect(calls).toEqual(['show', 'hide', 'show', 'hide'])
    element.remove()
    dialog.remove()
  })
})
