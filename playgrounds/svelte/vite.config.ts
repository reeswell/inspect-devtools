import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { inspectDevtoolsSvelte } from '@inspect-devtools/vite-svelte'

export default defineConfig({
  plugins: [svelte(), ...inspectDevtoolsSvelte()],
})
