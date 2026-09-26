# Inspect Devtools

[中文文档](./README.zh-CN.md)

Inspect Devtools is a modern developer tool for inspecting frontend components and locating their source files directly from the browser. Click or marquee-select any rendered element to highlight its component boundary, copy its source reference, jump to the exact line and column in your local editor, and generate **rich structured AI prompt context** and **smart component screenshots**.

Designed for rapid debugging, code review, issue filing, and seamless collaboration with AI coding assistants like **Cursor, Claude Code, and GitHub Copilot**.

![Inspect Devtools workflow](./docs/inspect-workflow.png)

---

## ✨ Features

- 🚀 **Full Major Framework Support**: First-class integration for **Next.js, Nuxt 3, React, Vue 3, and Svelte**.
- 📦 **Universal Bundler Compatibility**: Powered by Unplugin, supporting **Vite, Webpack, Rollup, Esbuild, and Rspack**.
- 🤖 **Rich AI Context Snapshot**: One-click generation of exact `@file:line:col` references, component hierarchy tree (`Hierarchy: App > DashboardPage`), and page route (`Route: /dashboard`) for instant AI understanding.
- 📸 **Smart Visual Crop**: Capture component screenshots directly to your clipboard with automatic page background color inheritance, preventing dark-on-dark transparent image issues.
- 🧭 **Component Hierarchy Breadcrumbs**: Interactive breadcrumb bar on the floating badge allows you to traverse and jump to parent components up the render tree.
- 🎨 **Photoshop-Style Marquee Selection**: Multi-element marquee, `Shift+click/drag` to add, `Alt+click/drag` to subtract, and persistent selection states.
- 💻 **Smart Editor Launching**: Automatically detects running instances of **VS Code, Cursor, and WebStorm**, or direct launching via URL Scheme protocols.

---

## 📦 Installation & Setup

Choose the package that fits your framework and bundler:

### 1. Next.js

```bash
pnpm add -D @inspect-devtools/next
```

Wrap your configuration in `next.config.mjs`:

```js
// next.config.mjs
import { withInspectDevtools } from '@inspect-devtools/next'

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withInspectDevtools(nextConfig)
```

Include the client component in your root layout (e.g. `app/layout.tsx`):

```tsx
// app/layout.tsx
import { InspectDevtools } from '@inspect-devtools/next/component'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InspectDevtools />
        {children}
      </body>
    </html>
  )
}
```

---

### 2. Nuxt 3

```bash
pnpm add -D @inspect-devtools/nuxt
```

Register the module in `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@inspect-devtools/nuxt'],
  inspectDevtools: {
    openOnClick: true, // Optional: open in editor on single click
  },
})
```

---

### 3. Vite + React

```bash
pnpm add -D @inspect-devtools/vite-react
```

Configure in `vite.config.ts`:

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { inspectDevtoolsReact } from '@inspect-devtools/vite-react'

export default defineConfig({
  plugins: [react(), ...inspectDevtoolsReact()],
})
```

---

### 4. Vite + Vue 3

```bash
pnpm add -D @inspect-devtools/vite-vue
```

Configure in `vite.config.ts`:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { inspectDevtoolsVue } from '@inspect-devtools/vite-vue'

export default defineConfig({
  plugins: [vue(), ...inspectDevtoolsVue()],
})
```

---

### 5. Vite + Svelte (Svelte 4/5)

```bash
pnpm add -D @inspect-devtools/vite-svelte
```

Configure in `vite.config.ts`:

```ts
// vite.config.ts
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { inspectDevtoolsSvelte } from '@inspect-devtools/vite-svelte'

export default defineConfig({
  plugins: [svelte(), ...inspectDevtoolsSvelte()],
})
```

---

### 6. Universal Bundlers (Webpack / Rollup / Rspack / Esbuild)

```bash
pnpm add -D @inspect-devtools/unplugin
```

Example with Webpack:

```js
// webpack.config.js
const inspectDevtools = require('@inspect-devtools/unplugin/webpack')

module.exports = {
  plugins: [
    inspectDevtools({ framework: 'react' }), // or 'vue' / 'svelte'
  ],
}
```

---

## ⚙️ Configuration Options

All packages share a consistent options interface:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `openOnClick` | `boolean` | `false` / framework preset | Whether clicking an element immediately opens your editor. If `false`, opens on double-click or badge click |
| `openInEditor` | `string` | Auto-detect | Specific editor CLI command, e.g. `'code'` (VS Code), `'cursor'`, `'webstorm'` |
| `editorProtocol` | `'auto' \| 'vscode' \| 'cursor' \| 'webstorm'` | `'auto'` | Editor trigger mechanism. `'auto'` uses the dev server RPC; specific values launch via OS URL Schemes |
| `theme` | `'light' \| 'dark'` | `'light'` | Default theme for bottom dock and overlay elements |
| `copyRoute` | `boolean` | `false` | Whether to append the current URL route (e.g. `Route: /dashboard`) when copying references |
| `copyLineColumn` | `boolean \| 'line' \| 'column'` | `false` | Whether to include line and column numbers in standard reference copies (e.g. `@App.vue:15:3`) |
| `copyFormat` | `'mention' \| 'link'` | `'mention'` | Source reference format: `'mention'` for `@path`; `'link'` for Markdown link `[name](path)` |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `Alt+Shift+I` | **Toggle Inspect Mode** | Globally toggle component inspection on and off |
| `Cmd+Alt+C` / `Ctrl+Alt+C` | **Copy AI Context Snapshot** | Copies `@file:line:col` + Hierarchy breadcrumbs + Page route |
| `Cmd+Shift+C` / `Ctrl+Shift+C` | **Copy Visual Component Screenshot** | Copies visual PNG crop to clipboard with inherited background color |
| `Shift + click / drag` | **Add to selection** | Add more components into the active selection |
| `Alt + click / drag` | **Subtract from selection** | Remove components from the active selection |
| `Cmd/Ctrl + click` | **Direct open inside selection** | While selection is active, modifier-click directly opens in editor |
| `Escape` | **Exit / Clear selection** | Exit inspect mode or clear existing selection frames |

> Note: Shortcuts are automatically ignored when focus is inside an `input`, `textarea`, or content-editable element.

---

## 🤖 AI Rich Context Snapshot

Press `Cmd+Alt+C` (or click the **✨** button on the floating badge) to copy structured component context:

```text
@/Users/project/src/pages/HomePage.tsx:12:5
Hierarchy: `App` > `HomePage` > `MetricCard`
Route: /dashboard
```

Paste directly into Cursor, Claude Code, or Copilot prompts so the AI immediately understands the component's exact physical code location and runtime tree position.

---

## 🎯 Playgrounds

The repository provides 5 preconfigured playgrounds for hands-on testing:

```bash
# React Playground (Vite)
pnpm play:react

# Vue 3 Playground (Vite)
pnpm play:vue

# Svelte Playground (Vite)
pnpm play:svelte

# Next.js Playground (App Router)
pnpm play:next

# Nuxt 3 Playground (Vite + Nitro)
pnpm play:nuxt
```

---

## 🏗️ Architecture

This repository is structured as a pnpm monorepo:

- [`@inspect-devtools/core`](./packages/core): AST transformation, DOM resolution, RPC protocol, and server launch engine.
- [`@inspect-devtools/client`](./packages/client): Floating dock, overlay frames, visual screenshot engine, and interaction logic.
- [`@inspect-devtools/vite-react`](./packages/vite-react): React + Vite integration adapter.
- [`@inspect-devtools/vite-vue`](./packages/vite-vue): Vue 3 + Vite integration adapter.
- [`@inspect-devtools/vite-svelte`](./packages/vite-svelte): Svelte + Vite integration adapter.
- [`@inspect-devtools/next`](./packages/next): Next.js integration (Webpack loader + client runtime).
- [`@inspect-devtools/nuxt`](./packages/nuxt): Nuxt 3 native module.
- [`@inspect-devtools/unplugin`](./packages/unplugin): Universal bundler abstraction for Webpack, Rollup, Esbuild, and Rspack.

---

## 🛠️ Local Development

```bash
# Install dependencies
pnpm install

# Run unit tests
pnpm test

# Run type check
pnpm typecheck

# Build all packages
pnpm build

# Full pipeline check
pnpm release:check
```

---

## 📄 License

[MIT](./LICENSE)
