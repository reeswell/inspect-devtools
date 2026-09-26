import { beforeEach, describe, expect, it, vi } from 'vitest'

const addVitePluginMock = vi.fn()
const addPluginMock = vi.fn()
const inspectDevtoolsVueMock = vi.fn()

vi.mock('@nuxt/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nuxt/kit')>()
  return {
    ...actual,
    addVitePlugin: addVitePluginMock,
    addPlugin: addPluginMock,
  }
})

vi.mock('@inspect-devtools/vite-vue', () => ({
  inspectDevtoolsVue: inspectDevtoolsVueMock,
}))

describe('@inspect-devtools/nuxt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has correct module metadata via getMeta()', async () => {
    const { default: nuxtModule } = await import('../src/index')
    const meta = await nuxtModule.getMeta?.()
    expect(meta?.name).toBe('@inspect-devtools/nuxt')
    expect(meta?.configKey).toBe('inspectDevtools')
  })

  it('registers inspectDevtoolsVue in dev mode', async () => {
    const fakePlugin1 = { name: 'fake-plugin-1' }
    const fakePlugin2 = { name: 'fake-plugin-2' }
    inspectDevtoolsVueMock.mockReturnValue([fakePlugin1, fakePlugin2])

    const { default: nuxtModule } = await import('../src/index')

    const fakeNuxt = {
      _version: '3.15.0',
      options: {
        dev: true,
      },
      callHook: vi.fn().mockResolvedValue(undefined),
      hook: vi.fn(),
    } as any

    await (nuxtModule as any)({ openOnClick: true }, fakeNuxt)

    expect(inspectDevtoolsVueMock).toHaveBeenCalledWith({ openOnClick: true })
    expect(addVitePluginMock).toHaveBeenCalledWith(fakePlugin1)
    expect(addVitePluginMock).toHaveBeenCalledWith(fakePlugin2)
    expect(addPluginMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'client',
    }))
  })

  it('does not register inspectDevtoolsVue in production mode', async () => {
    const { default: nuxtModule } = await import('../src/index')

    const fakeNuxt = {
      _version: '3.15.0',
      options: {
        dev: false,
      },
      callHook: vi.fn().mockResolvedValue(undefined),
      hook: vi.fn(),
    } as any

    await (nuxtModule as any)({}, fakeNuxt)

    expect(inspectDevtoolsVueMock).not.toHaveBeenCalled()
    expect(addVitePluginMock).not.toHaveBeenCalled()
    expect(addPluginMock).not.toHaveBeenCalled()
  })
})
