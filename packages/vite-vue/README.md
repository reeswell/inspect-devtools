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

Press `Alt+Shift+I`, click an element, then Inspect Devtools copies a `[filename](/absolute/path)` source reference (Codex format by default; the `cursor` format for Cursor and Claude Code is also available via the `copyFormat` option or the panel) and opens it at the precise `file:line:column` location in your editor. The panel stays closed unless opened explicitly. See the repository README for all shortcuts, options, and limitations.
