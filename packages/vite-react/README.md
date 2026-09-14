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

Press `Alt+Shift+I`, click an element, then Inspect Devtools copies its `file:line:column` source location and opens it in your editor. See the repository README for all shortcuts, options, and limitations.
