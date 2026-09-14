import { describe, expect, it } from 'vitest'
import { createGrabSelection, getReactDebugSource, getVueInspectorSource } from '../src/browser'

describe('createGrabSelection', () => {
  it('normalizes selected elements', () => {
    document.body.innerHTML = '<button id="save">Save changes</button>'
    const element = document.getElementById('save')!

    const selection = createGrabSelection(element, 'react', {
      componentName: 'SaveButton',
      filePath: '/src/save-button.tsx',
      line: 7,
    })

    expect(selection.framework).toBe('react')
    expect(selection.componentName).toBe('SaveButton')
    expect(selection.cssSelector).toBe('#save')
  })
})

describe('getReactDebugSource', () => {
  it('reads React inspector metadata from the DOM before falling back to fiber', () => {
    document.body.innerHTML = '<article><button data-inspect-devtools-source="/project/src/App.tsx:8:5" data-inspect-devtools-component="App"><span>Save</span></button></article>'
    const span = document.querySelector('span')!

    expect(getReactDebugSource(span)).toEqual({
      componentName: 'App',
      filePath: '/project/src/App.tsx',
      line: 8,
      column: 5,
    })
  })

  it('walks to the nearest React fiber host element and resolves app source', () => {
    document.body.innerHTML = '<article><button><span>Save</span></button></article>'
    const button = document.querySelector('button')!
    const span = document.querySelector('span')!
    const owner = {
      elementType: { name: 'SaveButton' },
      type: { name: 'SaveButton' },
      return: null,
    }

    Object.defineProperty(button, '__reactFiber$test', {
      value: {
        elementType: 'button',
        type: 'button',
        _debugOwner: owner,
        _debugSource: {
          fileName: 'http://localhost:5177/src/main.tsx?t=123',
          lineNumber: 10,
          columnNumber: 5,
        },
        return: owner,
      },
    })

    expect(getReactDebugSource(span)).toEqual({
      componentName: 'SaveButton',
      filePath: '/src/main.tsx',
      line: 10,
      column: 5,
    })
  })

  it('prefers app source over package wrapper source', () => {
    document.body.innerHTML = '<button>Open</button>'
    const button = document.querySelector('button')!
    const appFiber = {
      elementType: { name: 'FeatureButton' },
      type: { name: 'FeatureButton' },
      _debugSource: {
        fileName: '/project/src/FeatureButton.tsx',
        lineNumber: 24,
      },
      return: null,
    }

    Object.defineProperty(button, '__reactFiber$test', {
      value: {
        elementType: { name: 'Primitive.Button' },
        type: { name: 'Primitive.Button' },
        _debugSource: {
          fileName: '/project/node_modules/@acme/ui/button.tsx',
          lineNumber: 3,
        },
        return: appFiber,
      },
    })

    expect(getReactDebugSource(button)).toEqual({
      componentName: 'FeatureButton',
      filePath: '/project/src/FeatureButton.tsx',
      line: 24,
      column: undefined,
    })
  })

  it('uses React 19 debug stack when debugSource is missing', () => {
    document.body.innerHTML = '<button>Open</button>'
    const button = document.querySelector('button')!

    Object.defineProperty(button, '__reactFiber$test', {
      value: {
        elementType: { name: 'button' },
        type: 'button',
        _debugStack: {
          stack: 'Error\n    at ActionButton (/Users/dev/app/src/ActionButton.tsx:12:7)',
        },
        return: null,
      },
    })

    expect(getReactDebugSource(button)).toEqual({
      componentName: 'ActionButton',
      filePath: '/Users/dev/app/src/ActionButton.tsx',
      line: 12,
      column: 7,
    })
  })
})

describe('getVueInspectorSource', () => {
  it('reads non-enumerable vnode inspector metadata', () => {
    document.body.innerHTML = '<article><button>Open</button></article>'
    const article = document.querySelector('article')!

    Object.defineProperty(article, '__vnode', {
      value: {
        props: {},
        ctx: {
          vnode: {
            el: article,
            props: {},
          },
        },
      },
    })
    Object.defineProperty((article as any).__vnode.props, '__v_inspector', {
      value: '/project/src/App.vue:12:7',
      enumerable: false,
    })

    expect(getVueInspectorSource(article)).toEqual({
      filePath: '/project/src/App.vue',
      line: 12,
      column: 7,
    })
  })
})
