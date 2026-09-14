import { createRequire } from 'node:module'
import { parse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'

const JSX_RE = /\.[cm]?[jt]sx$/
const require = createRequire(import.meta.url)
const generateCode = require('@babel/generator').default as typeof import('@babel/generator').default
const traverseAst = require('@babel/traverse').default as typeof import('@babel/traverse').default

const jsxNameToString = (name: t.JSXNamespacedName | t.JSXMemberExpression | t.JSXIdentifier): string => {
  if (t.isJSXIdentifier(name))
    return name.name
  if (t.isJSXNamespacedName(name))
    return `${name.namespace.name}:${name.name.name}`
  return `${jsxNameToString(name.object)}.${jsxNameToString(name.property)}`
}

const isDomTag = (name: string): boolean => /^[a-z]/.test(name)

const hasAttribute = (attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>, name: string): boolean => {
  return attributes.some(attribute => t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name) && attribute.name.name === name)
}

const createStringAttribute = (name: string, value: string): t.JSXAttribute => {
  return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value))
}

const findComponentName = (path: NodePath<t.JSXOpeningElement>): string | undefined => {
  const functionParent = path.findParent(parent => parent.isFunctionDeclaration() || parent.isFunctionExpression() || parent.isArrowFunctionExpression())
  if (functionParent?.isFunctionDeclaration() && functionParent.node.id?.name)
    return functionParent.node.id.name

  const variableParent = path.findParent(parent => parent.isVariableDeclarator())
  if (variableParent?.isVariableDeclarator() && t.isIdentifier(variableParent.node.id))
    return variableParent.node.id.name

  return undefined
}

export const transformReactInspectorSource = (code: string, id: string): string | undefined => {
  const [filename] = id.split('?', 2)
  if (!JSX_RE.test(filename) || filename.includes('/node_modules/'))
    return undefined

  const ast = parse(code, {
    sourceFilename: filename,
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  let changed = false

  traverseAst(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      const tagName = jsxNameToString(path.node.name)
      if (!isDomTag(tagName))
        return

      const location = path.node.loc?.start
      if (!location)
        return

      const source = `${filename}:${location.line}:${location.column + 1}`
      if (!hasAttribute(path.node.attributes, 'data-inspect-devtools-source')) {
        path.node.attributes.push(createStringAttribute('data-inspect-devtools-source', source))
        changed = true
      }

      const componentName = findComponentName(path)
      if (componentName && !hasAttribute(path.node.attributes, 'data-inspect-devtools-component')) {
        path.node.attributes.push(createStringAttribute('data-inspect-devtools-component', componentName))
        changed = true
      }
    },
  })

  if (!changed)
    return undefined

  return generateCode(ast, { retainLines: true }, code).code
}
