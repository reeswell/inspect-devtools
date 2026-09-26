import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        loader: fileURLToPath(new URL('./src/loader.ts', import.meta.url)),
        component: fileURLToPath(new URL('./src/component.tsx', import.meta.url)),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'next',
        /^@inspect-devtools\//,
        /^node:/,
      ],
      output: {
        banner(chunk) {
          if (chunk.name === 'component') {
            return `'use client';`
          }
          return ''
        },
      },
    },
  },
})
