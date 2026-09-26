# @inspect-devtools/next

Official Next.js plugin for **inspect-devtools** — jump from DOM elements to component source code in your editor, copy streamlined AI prompts, and capture visual screenshots.

## Installation

```bash
pnpm add -D @inspect-devtools/next
# or
npm install -D @inspect-devtools/next
```

## Setup

Wrap your Next.js config in `next.config.mjs` (or `next.config.js`):

```js
import withInspectDevtools from '@inspect-devtools/next'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // your standard Next.js config
}

export default withInspectDevtools(nextConfig, {
  editorProtocol: 'cursor', // 'cursor' | 'vscode' | 'auto'
  copyRoute: true,
})
```

And in your root layout (`app/layout.tsx` or `pages/_app.tsx`):

```tsx
import { InspectDevtools } from '@inspect-devtools/next/component'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <InspectDevtools />
      </body>
    </html>
  )
}
```

## Features

- ⚡ **Seamless Next.js integration** with Webpack & App Router / Pages Router.
- 🎯 **Click to Open in Editor** (Cursor, VS Code, WebStorm).
- 🧠 **AI Context Snapshot** (Route + Component Hierarchy + Source Location).
- 📸 **Pure Component Screenshot** with dual MIME clipboard integration.
- 🚀 **Zero production overhead** (automatically disabled in production builds).
