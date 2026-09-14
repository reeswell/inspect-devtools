# @inspect-devtools/vite-vue

Vite development plugin for locating the Vue source behind a rendered element.

```bash
pnpm add -D @inspect-devtools/vite-vue
```

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { inspectDevtoolsVue } from '@inspect-devtools/vite-vue'

export default defineConfig({ plugins: [vue(), ...inspectDevtoolsVue()] })
```

Press `Alt+Shift+I`, click an element, then Inspect Devtools copies its `file:line:column` source location and opens it in your editor. See the repository README for all shortcuts, options, and limitations.
