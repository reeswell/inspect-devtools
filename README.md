# Inspect Devtools

[中文文档](./README.zh-CN.md)

Inspect Devtools is a Vite development plugin for locating the source behind a rendered React or Vue element. Select an element in the browser and the tool copies its source location and opens that file in your editor.

It is intended for quick local debugging and for handing an exact `file:line:column` reference to a teammate, issue, or coding agent.

## Requirements

- Vite `6`, `7`, or `8`
- A React or Vue application running in Vite serve mode
- A local editor recognized by [`launch-editor`](https://github.com/yyx990803/launch-editor), or an explicit editor command

## Install

```bash
pnpm add -D @inspect-devtools/vite-react
# or
pnpm add -D @inspect-devtools/vite-vue
```

## Configure Vite

### React

Place Inspect Devtools after the React plugin.

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { inspectDevtoolsReact } from '@inspect-devtools/vite-react'

export default defineConfig({
  plugins: [react(), ...inspectDevtoolsReact()],
})
```

### Vue

Place Inspect Devtools after the Vue plugin.

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { inspectDevtoolsVue } from '@inspect-devtools/vite-vue'

export default defineConfig({
  plugins: [vue(), ...inspectDevtoolsVue()],
})
```

### Editor override

By default, the plugin uses the editor command available in your environment. Pass `openInEditor` when an explicit command is required.

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ openInEditor: 'code' }),
]
```

The same option is available on `inspectDevtoolsVue`.

## Workflow

1. Start the Vite dev server.
2. Press `Alt+Shift+I` or click **Inspect** in the bottom dock.
3. Hover an element to preview its source label, then click the element.
4. When source metadata is available, selecting automatically copies the complete `file:line:column` location and opens that file in the configured editor.
5. Use the panel's **Copy** or **Open** buttons to repeat either action independently.

The panel includes the nearest component name, source path, line, column, and a generated CSS selector. The displayed File value uses a compact relative path where possible; its tooltip contains the full path.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+I` | Toggle Inspect mode |
| `Alt+Shift+P` | Toggle the panel |
| `Escape` while inspecting | Stop Inspect mode |
| `Escape` with a selection | Clear the selection and return to Ready |

Shortcuts are ignored while focus is inside an input, textarea, select, or editable element.

## Source resolution

- **React:** transformed development metadata and React Fiber debug information.
- **Vue:** `vite-plugin-vue-inspector` metadata.

Some elements have no resolvable application source file—for example, browser-generated nodes, third-party output, or framework internals. The panel then displays `Source file unavailable`, does not auto-open an editor, and retains the remaining selection data.

## Development-only behavior

Inspect Devtools is injected only during Vite `serve` mode. It is not injected into production builds.

## Playgrounds

This repository includes React and Vue playgrounds with Home, Dashboard, and Settings hash routes. They provide nested components, navigation, form controls, state changes, and links for exercising source selection.

```bash
pnpm play:react
pnpm play:vue
```

Visit `#/`, `#/dashboard`, or `#/settings` in either playground.

## Local development

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Current scope

- React and Vue only
- Vite development server only
- Local editor integration and clipboard handoff only
- No production runtime, AI provider integration, or remote source lookup
