import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        browser: fileURLToPath(new URL('./src/browser.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: id => id === 'launch-editor' || id === 'vite' || id.startsWith('node:'),
    },
  },
})
