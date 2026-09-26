import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        'runtime/plugin.client': fileURLToPath(new URL('./src/runtime/plugin.client.ts', import.meta.url)),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '#app',
        '@nuxt/kit',
        '@inspect-devtools/client',
        '@inspect-devtools/core',
        '@inspect-devtools/vite-vue',
        'vite',
        /^node:/,
      ],
    },
  },
})
