# @inspect-devtools/nuxt

Official Nuxt 3 module for **inspect-devtools** — jump from DOM elements to component source code in your editor, copy streamlined AI prompts, and capture visual screenshots.

## Installation

```bash
pnpm add -D @inspect-devtools/nuxt
# or
npm install -D @inspect-devtools/nuxt
```

## Setup

Add `@inspect-devtools/nuxt` to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    '@inspect-devtools/nuxt',
  ],
  inspectDevtools: {
    // optional options
    editorProtocol: 'cursor', // 'cursor' | 'vscode' | 'auto'
    copyRoute: true,
  },
})
```

## Features

- ⚡ **Zero-config Nuxt 3 integration** via Nuxt Kit.
- 🎯 **Click to Open in Editor** (Cursor, VS Code, WebStorm).
- 🧠 **AI Context Snapshot** (Route + Component Hierarchy + Source Location).
- 📸 **Pure Component Screenshot** with dual MIME clipboard integration.
- 🚀 **Zero production overhead** (automatically disabled in `nuxt build`).
