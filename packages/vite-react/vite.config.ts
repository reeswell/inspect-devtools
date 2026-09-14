import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@inspect-devtools/core',
        '@babel/generator',
        '@babel/parser',
        '@babel/traverse',
        '@babel/types',
        'vite',
        /^node:/,
      ],
    },
  },
})
