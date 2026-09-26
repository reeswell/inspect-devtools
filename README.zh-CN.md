# Inspect Devtools

[English](./README.md)

Inspect Devtools 是一个现代化前端开发期审查与源码定位工具。在浏览器中直观选中任意页面元素，工具即可自动定位并高亮对应组件，一键在本地编辑器中定位到文件与行列号，并支持生成**结构化 AI 提示词上下文**与**智能组件截图**。

专为日常开发调试、代码审查、问题汇报，以及与 **Cursor / Claude Code / GitHub Copilot** 等 AI 编程助手高效协同而设计。

![Inspect Devtools 使用流程](./docs/inspect-workflow.png)

---

## ✨ 核心特性

- 🚀 **全主流框架支持**：深度集成 **Next.js、Nuxt 3、React、Vue 3、Svelte**。
- 📦 **全打包器通用**：内置基于 Unplugin 的适配层，支持 **Vite、Webpack、Rollup、Esbuild、Rspack**。
- 🤖 **AI 富上下文快照**：一键生成标准 `@file:line:col`、组件层级拓扑树 `Hierarchy: App > DashboardPage` 与当前路由 `Route: /dashboard`，助 AI 精准理解界面位置。
- 📸 **智能组件截图（Visual Crop）**：一键截取组件图片至剪贴板，自动递归继承页面真实环境底色，杜绝透底黑图，直推给多模态 AI。
- 🧭 **组件层级面包屑（Breadcrumbs）**：浮动悬浮条支持交互式向上溯源父级组件，支持一键点击跨级跳转。
- 🎨 **Photoshop 级选区体验**：支持矩形框选、`Shift+点击/拖拽`加选、`Alt+点击/拖拽`减选、选区常驻预览。
- 💻 **编辑器智能调起**：支持自动探测本地运行的 **VS Code、Cursor、WebStorm**，亦支持通过 URL Scheme 协议直连唤起。

---

## 📦 安装与配置

根据您的技术栈选择对应的适配包：

### 1. Next.js

```bash
pnpm add -D @inspect-devtools/next
```

在 `next.config.mjs` 中包装配置：

```js
// next.config.mjs
import { withInspectDevtools } from '@inspect-devtools/next'

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withInspectDevtools(nextConfig)
```

在根布局（如 `app/layout.tsx`）中引入客户端组件：

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

在 `nuxt.config.ts` 中注册模块：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@inspect-devtools/nuxt'],
  inspectDevtools: {
    openOnClick: true, // 可选：单选组件时直接在编辑器打开
  },
})
```

---

### 3. Vite + React

```bash
pnpm add -D @inspect-devtools/vite-react
```

在 `vite.config.ts` 中配置插件：

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

在 `vite.config.ts` 中配置插件：

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

在 `vite.config.ts` 中配置插件：

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

### 6. 通用打包器 (Webpack / Rollup / Rspack / Esbuild)

```bash
pnpm add -D @inspect-devtools/unplugin
```

以 Webpack 为例：

```js
// webpack.config.js
const inspectDevtools = require('@inspect-devtools/unplugin/webpack')

module.exports = {
  plugins: [
    inspectDevtools({ framework: 'react' }), // 或 'vue' / 'svelte'
  ],
}
```

---

## ⚙️ 常用配置项

所有包均支持统一的配置项接口：

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `openOnClick` | `boolean` | `false` / 框架自定义 | 单击选中元素时是否直接在编辑器打开。若为 `false`，则点击悬浮徽章或双击时打开 |
| `openInEditor` | `string` | 自动推导 | 指定编辑器 CLI 命令，例如 `'code'`（VS Code）、`'cursor'`、`'webstorm'` |
| `editorProtocol` | `'auto' \| 'vscode' \| 'cursor' \| 'webstorm'` | `'auto'` | 编辑器唤起方式。`'auto'` 走本地开发服务 RPC；指定协议名称时通过系统 URL Scheme 直连唤起 |
| `theme` | `'light' \| 'dark'` | `'light'` | 底部 Dock 与交互面板的默认主题模式 |
| `copyRoute` | `boolean` | `false` | 复制普通引用时是否附加一行页面路由信息（如 `Route: /dashboard`） |
| `copyLineColumn` | `boolean \| 'line' \| 'column'` | `false` | 复制普通引用时是否包含行号与列号（如 `@App.vue:15:3`） |
| `copyFormat` | `'mention' \| 'link'` | `'mention'` | 源码引用格式：`'mention'` 为 `@path` 形式；`'link'` 为 Markdown 链接 `[name](path)` |

---

## ⌨️ 快捷键速查

| 快捷键 | 作用 | 说明 |
| :--- | :--- | :--- |
| `Alt+Shift+I` | **开启 / 退出审查模式** | 全局切换组件高亮检查状态 |
| `Cmd+Alt+C` / `Ctrl+Alt+C` | **复制 AI 富上下文快照** | 输出 `@file:line:col` + 层级面包屑 + 当前页面路由 |
| `Cmd+Shift+C` / `Ctrl+Shift+C` | **复制组件精准截图** | 自动合成真实环境底色并复制 PNG 图片到剪贴板 |
| `Shift + 点击/拖拽` | **加选元素** | 追加组件，支持框选多组件批量引用 |
| `Alt + 点击/拖拽` | **减选元素** | 排除或剔除已选框内的组件 |
| `Cmd/Ctrl + 点击` | **选区内快捷打开** | 选区常驻期间，按住修饰键点击选区内组件直接唤起编辑器 |
| `Escape` | **退出 / 清空选区** | 退出审查模式或清除当前所有选区高亮框 |

> 提示：当输入焦点落在 `input`、`textarea` 或可编辑元素内部时，快捷键会自动被忽略。

---

## 🤖 AI 富上下文快照格式

按快捷键 `Cmd+Alt+C` 或点击悬浮徽章上的 **✨** 图标，剪贴板将获得如下专为 AI 编码助手设计的结构化上下文：

```text
@/Users/project/src/pages/HomePage.tsx:12:5
Hierarchy: `App` > `HomePage` > `MetricCard`
Route: /dashboard
```

直接粘贴给 Cursor、Claude Code、GitHub Copilot 等，模型即可瞬间理解具体组件在整棵视图树中的物理定位与运行时位置。

---

## 🎯 演练场（Playgrounds）

仓库内置了 5 套涵盖不同框架的标准演练场，开箱即用：

```bash
# React 演练场 (Vite)
pnpm play:react

# Vue 3 演练场 (Vite)
pnpm play:vue

# Svelte 演练场 (Vite)
pnpm play:svelte

# Next.js 演练场 (App Router)
pnpm play:next

# Nuxt 3 演练场 (Vite + Nitro)
pnpm play:nuxt
```

---

## 🏗️ 架构说明

本仓库为 pnpm monorepo 结构：

- [`@inspect-devtools/core`](./packages/core)：核心 AST 转换、DOM 节点溯源算法、RPC 协议与服务端解析引擎。
- [`@inspect-devtools/client`](./packages/client)：前端浮动 Dock、高亮遮罩、截图渲染与交互控制器。
- [`@inspect-devtools/vite-react`](./packages/vite-react)：React + Vite 适配器。
- [`@inspect-devtools/vite-vue`](./packages/vite-vue)：Vue 3 + Vite 适配器。
- [`@inspect-devtools/vite-svelte`](./packages/vite-svelte)：Svelte + Vite 适配器。
- [`@inspect-devtools/next`](./packages/next)：Next.js 适配器（Webpack Loader + 客户端运行时组件）。
- [`@inspect-devtools/nuxt`](./packages/nuxt)：Nuxt 3 专用模块。
- [`@inspect-devtools/unplugin`](./packages/unplugin)：通用打包器（Vite/Webpack/Rollup/Esbuild/Rspack）抽象层。

---

## 🛠️ 本地开发与贡献

```bash
# 安装依赖
pnpm install

# 运行全量测试
pnpm test

# 全量类型检查
pnpm typecheck

# 全包构建
pnpm build

# 一键全量流水线校验
pnpm release:check
```

---

## 📄 License

[MIT](./LICENSE)
