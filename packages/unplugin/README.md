# @inspect-devtools/unplugin

Unified cross-bundler plugin for **inspect-devtools** — supporting Vite, Webpack, Rspack, Rollup, and Esbuild.

## Installation

```bash
pnpm add -D @inspect-devtools/unplugin
# or
npm install -D @inspect-devtools/unplugin
```

## Usage

### Vite
```ts
// vite.config.ts
import InspectDevtools from '@inspect-devtools/unplugin/vite'

export default defineConfig({
  plugins: [
    InspectDevtools(),
  ],
})
```

### Webpack / Next.js
```js
// webpack.config.js / next.config.js
const InspectDevtools = require('@inspect-devtools/unplugin/webpack')

module.exports = {
  plugins: [
    InspectDevtools(),
  ],
}
```

### Rspack / Rsbuild
```ts
// rspack.config.ts
import InspectDevtools from '@inspect-devtools/unplugin/rspack'

export default {
  plugins: [
    InspectDevtools(),
  ],
}
```

### Rollup
```js
// rollup.config.js
import InspectDevtools from '@inspect-devtools/unplugin/rollup'

export default {
  plugins: [
    InspectDevtools(),
  ],
}
```

### Esbuild
```js
// esbuild.config.js
import { build } from 'esbuild'
import InspectDevtools from '@inspect-devtools/unplugin/esbuild'

build({
  plugins: [
    InspectDevtools(),
  ],
})
```
