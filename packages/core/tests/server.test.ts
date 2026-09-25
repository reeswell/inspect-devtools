import { realpathSync } from 'node:fs'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveProjectFile } from '../src/server'

describe('server utilities', () => {
  it('resolves project files', async () => {
    const root = join(process.cwd(), 'tmp-context-test')
    await mkdir(join(root, 'src'), { recursive: true })
    const path = join(root, 'src', 'main.tsx')
    await writeFile(path, 'export const App = () => null')

    expect(resolveProjectFile('src/main.tsx', root)).toBe(path)
  })

  it('blocks files outside the project root', async () => {
    const root = join(process.cwd(), 'tmp-context-test-block')
    await mkdir(root, { recursive: true })

    expect(() => resolveProjectFile('/etc/passwd', root)).toThrow('outside')
  })

  it('maps Vite dev-server source URLs back to project files', async () => {
    const root = join(process.cwd(), 'tmp-context-test-url')
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'src', 'main.tsx'), 'export const App = () => null')

    const file = resolveProjectFile('http://localhost:5177/src/main.tsx?t=123', root)

    expect(file).toBe(join(root, 'src', 'main.tsx'))
  })

  it('blocks symlinks that resolve outside the project root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'inspect-devtools-link-'))
    const outsideDir = await mkdtemp(join(tmpdir(), 'inspect-devtools-outside-'))
    const outside = join(outsideDir, 'secret.ts')
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(outside, 'export const secret = true')
    await symlink(outside, join(root, 'src', 'secret.ts'))

    expect(() => resolveProjectFile('src/secret.ts', root)).toThrow('outside')
  })

  it('allows symlinks when target directory is in allowedDirs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'inspect-devtools-link-allowed-'))
    const outsideDir = await mkdtemp(join(tmpdir(), 'inspect-devtools-outside-allowed-'))
    const outside = join(outsideDir, 'shared.ts')
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(outside, 'export const shared = true')
    await symlink(outside, join(root, 'src', 'shared.ts'))

    const resolved = resolveProjectFile('src/shared.ts', root, [outsideDir])
    expect(resolved).toBe(realpathSync(outside))
  })

  it('allows resolving files when located inside workspace root', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'inspect-devtools-ws-'))
    await mkdir(join(workspaceRoot, '.git'), { recursive: true })
    const packageRoot = join(workspaceRoot, 'packages', 'app')
    const sharedPackage = join(workspaceRoot, 'packages', 'ui')
    await mkdir(join(packageRoot, 'src'), { recursive: true })
    await mkdir(join(sharedPackage, 'src'), { recursive: true })

    const uiFile = join(sharedPackage, 'src', 'button.tsx')
    await writeFile(uiFile, 'export const Button = () => null')

    const resolved = resolveProjectFile('packages/ui/src/button.tsx', packageRoot)
    expect(resolved).toBe(realpathSync(uiFile))
  })
})
