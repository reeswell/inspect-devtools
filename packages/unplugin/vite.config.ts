import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        vite: fileURLToPath(new URL('./src/vite.ts', import.meta.url)),
        webpack: fileURLToPath(new URL('./src/webpack.ts', import.meta.url)),
        rspack: fileURLToPath(new URL('./src/rspack.ts', import.meta.url)),
        rollup: fileURLToPath(new URL('./src/rollup.ts', import.meta.url)),
        esbuild: fileURLToPath(new URL('./src/esbuild.ts', import.meta.url)),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        /^@inspect-devtools\//,
        'unplugin',
        'vite',
        'webpack',
        '@rspack/core',
        'rollup',
        'esbuild',
        /^node:/,
      ],
    },
  },
})
