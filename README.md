# Inspect Devtools

[中文文档](./README.zh-CN.md)

Inspect Devtools is a Vite development plugin for locating the source behind a rendered React or Vue element. Select an element in the browser and the tool copies a source-file reference and opens that file in your editor.

It is intended for quick local debugging and for handing a source-file reference to a teammate, issue, or coding agent.

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

### Copy format

Copied source references support two formats. Pass `copyFormat` to set the project default.

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ copyFormat: 'codex' }),
]
```

| `copyFormat` | Example output | Intended for |
| --- | --- | --- |
| `'codex'` (default) | `[App.vue](/absolute/path/to/App.vue)` | Codex and other Markdown-aware tools |
| `'cursor'` | `@playgrounds/react/src/components/App.vue` (relative to the repository root; falls back to `@/absolute/path` outside it) | Cursor and Claude Code |

Claude Code file mentions use the same `@path` shape as Cursor, so the `cursor` format covers both editors.

All formats normalize Windows paths to forward slashes and omit line and column numbers; precise `line:column` navigation remains available to the editor-opening action.

The Vite option is the project default for everyone. The panel also offers a **Copy format** selector (Codex, Cursor / Claude Code) whose choice is stored per project in the browser's `localStorage` as a personal override. The panel selection takes precedence over the Vite default and applies immediately to automatic copying; **Reset to default** clears the override. If `localStorage` is unavailable, the selection stays in memory for the session and copying keeps working. Starting Inspect or selecting an element never opens the panel automatically.

The same option is available on `inspectDevtoolsVue`.

### Theme

The dock and panel use a light theme by default. Pass `theme` to make the dark theme the project default.

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ theme: 'dark' }),
]
```

The panel header also offers a theme toggle; its choice is stored per project in the browser's `localStorage` as a personal override of the Vite default.

The same option is available on `inspectDevtoolsVue`.

## Workflow

1. Start the Vite dev server.
2. Press `Alt+Shift+I` or click the crosshair button in the bottom dock.
3. Hover an element to preview its source label, then click the element. The panel remains closed unless you open it explicitly.
4. When source metadata is available, selecting automatically copies a source-file reference in the active copy format and opens that file at its exact line and column in the configured editor.

Copy produces a reference such as `[App.vue](/absolute/path/to/App.vue)` in the default Codex format. It deliberately omits line and column information; those remain available to the editor-opening action for precise navigation.

The panel hosts per-browser preferences (copy format and theme); the status pill next to the Inspect toggle shows whether an element is selected.

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

Some elements have no resolvable application source file—for example, browser-generated nodes, third-party output, or framework internals. Inspect Devtools then skips the automatic copy and editor opening for that element.

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
