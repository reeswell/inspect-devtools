import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/entry.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'entry',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.[ext]',
      },
    },
  },
})
