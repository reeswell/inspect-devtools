# @inspect-devtools/vite-svelte

Official Svelte and SvelteKit Vite plugin for **inspect-devtools** — jump from DOM elements to component source code in your editor, copy streamlined AI prompts, and capture visual screenshots.

## Installation

```bash
pnpm add -D @inspect-devtools/vite-svelte
# or
npm install -D @inspect-devtools/vite-svelte
```

## Setup

In your `vite.config.ts` (or `svelte.config.js` with Vite):

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import inspectDevtools from '@inspect-devtools/vite-svelte'

export default defineConfig({
  plugins: [
    svelte(),
    inspectDevtools({
      editorProtocol: 'cursor', // 'cursor' | 'vscode' | 'auto'
      copyRoute: true,
    }),
  ],
})
```

## Features

- ⚡ **Seamless Svelte & SvelteKit integration** via Vite plugin.
- 🎯 **Click to Open in Editor** (Cursor, VS Code, WebStorm).
- 🧠 **AI Context Snapshot** (Route + Component Hierarchy + Source Location).
- 📸 **Pure Component Screenshot** with dual MIME clipboard integration.
- 🚀 **Zero production overhead** (automatically disabled in production builds).
