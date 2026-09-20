# Inspect Devtools

[中文文档](./README.zh-CN.md)

Inspect Devtools is a Vite development plugin for locating the source behind a rendered React or Vue element. Select an element in the browser and the tool copies a source-file reference and opens that file in your editor.

It is intended for quick local debugging and for handing a source-file reference to a teammate, issue, or coding agent.

![Inspect Devtools workflow](./docs/inspect-workflow.png)

## Requirements

- Vite `6`, `7`, or `8`
- A React or Vue application running in Vite serve mode
- A local editor recognized by [`launch-editor`](https://github.com/vitejs/launch-editor), or an explicit editor command

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

### Theme

The dock and panel use a light theme by default. Pass `theme` to make the dark theme the project default.

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ theme: 'dark' }),
]
```

The dock also offers a theme toggle; its choice is stored per project in the browser's `localStorage` as a personal override of the Vite default.

The same option is available on `inspectDevtoolsVue`.

### Route context in copies

Copies default to a bare `@`-mention so Cursor and other coding agents can recognize the file reference. Pass `copyRoute: true` to append a single `Route:` line holding the current pathname, search, and hash (no origin), so the agent knows which page the selected elements live on—which instance of a reused component you mean, and where to reproduce an issue.

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ copyRoute: true }),
]
```

The same option is available on `inspectDevtoolsVue`.

### Copy format

Copies default to an `@`-mention (`copyFormat: 'mention'`), a shape coding agents understand. Pass `copyFormat: 'link'` to copy a standard Markdown link such as `[App.vue](/absolute/path/App.vue)` instead—useful when the paste destination is a document, ticket, or chat tool rather than an AI agent.

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ copyFormat: 'link' }),
]
```

The same option is available on `inspectDevtoolsVue`.

## Workflow

1. Start the Vite dev server.
2. Press `Alt+Shift+I` or click the crosshair button in the bottom dock. The crosshair button shows a badge with the current selection count.
3. Hover an element to preview its source label, then click the element to select it. Drag a marquee to select several elements at once: every matched element gets its own highlight frame, and `@`-mentions are deduplicated per source file at copy time, one per line.
4. Refine the selection Photoshop-style without leaving Inspect mode: `Shift+click` or `Shift+drag` adds elements, `Alt+click` (`Option+click` on macOS) or `Alt+drag` removes them—click anywhere inside a highlight frame to remove that entry. Holding `Shift` or `Alt` while hovering previews the outcome: a solid green frame for what will be selected, a red frame over the entry that will be removed (and the marquee turns red while `Alt`-dragging). Every change re-copies the full set of `@`-mentions to the clipboard. The selection persists after Inspect mode exits: as long as highlight frames remain on the page, the hover previews stay live and `Shift+click`/`Alt+click` keep adding and removing (unmodified hovers and clicks are never intercepted); `Escape` clears the selection.
5. When source metadata is available, selecting automatically copies a reference to the source file. The configured editor opens the file at its exact line and column only when the selection resolves to exactly one file; for multi-file selections, click the source label to open the active entry instead.

Copy produces an `@`-mention of the file relative to the repository root, such as `@playgrounds/vue/src/App.vue` (or `@/absolute/path/App.vue` when the file lives outside the repository)—a shape understood by Cursor, Claude Code, and other coding agents. It deliberately omits line and column information; those remain available to the editor-opening action for precise navigation. When enabled, `copyRoute: true` appends a `Route: /dashboard?tab=overview` line naming the page the selection lives on. For pasting outside AI tools, `copyFormat: 'link'` copies a Markdown link instead—see [Copy format](#copy-format).

Feedback and errors surface as transient toasts above the dock; when no source file can be resolved for an element, a toast says so instead of copying or opening anything.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+I` | Toggle Inspect mode |
| `Shift+click` / `Shift+drag` while inspecting | Add elements to the selection |
| `Alt+click` / `Alt+drag` while inspecting (`Option` on macOS) | Remove elements from the selection |
| `Escape` while inspecting | Stop Inspect mode |
| `Escape` with a selection | Clear the selection |

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
