# @inspect-devtools/vite-react

Vite development plugin for locating the React source behind a rendered element.

```bash
pnpm add -D @inspect-devtools/vite-react
```

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { inspectDevtoolsReact } from '@inspect-devtools/vite-react'

export default defineConfig({ plugins: [react(), ...inspectDevtoolsReact()] })
```

Press `Alt+Shift+I`, click an element, then Inspect Devtools copies a `[filename](/absolute/path)` source reference (Codex format by default; the `cursor` format for Cursor and Claude Code is also available via the `copyFormat` option or the panel) and opens it at the precise `file:line:column` location in your editor. The panel stays closed unless opened explicitly. See the repository README for all shortcuts, options, and limitations.
