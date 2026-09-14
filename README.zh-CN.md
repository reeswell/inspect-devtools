# Inspect Devtools

[English](./README.md)

Inspect Devtools 是一个 Vite 开发期插件，用于从浏览器中定位 React 或 Vue 渲染元素对应的源码。选中元素后，工具会复制源码位置，并在编辑器中打开对应文件。

它适合本地调试，也适合把精确的 `file:line:column` 位置交给同事、写入 issue，或粘贴给编码助手。

## 环境要求

- Vite `6`、`7` 或 `8`
- 运行在 Vite serve 模式下的 React 或 Vue 应用
- 系统环境可被 [`launch-editor`](https://github.com/yyx990803/launch-editor) 识别的本地编辑器，或显式配置编辑器命令

## 安装

```bash
pnpm add -D @inspect-devtools/vite-react
# 或
pnpm add -D @inspect-devtools/vite-vue
```

## 配置 Vite

### React

将 Inspect Devtools 放在 React 插件之后。

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

将 Inspect Devtools 放在 Vue 插件之后。

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { inspectDevtoolsVue } from '@inspect-devtools/vite-vue'

export default defineConfig({
  plugins: [vue(), ...inspectDevtoolsVue()],
})
```

### 指定编辑器

默认使用当前环境可用的编辑器命令。若需要明确指定，可传入 `openInEditor`。

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ openInEditor: 'code' }),
]
```

`inspectDevtoolsVue` 同样支持该选项。

## 使用流程

1. 启动 Vite 开发服务器。
2. 按 `Alt+Shift+I`，或点击底部 dock 中的 **Inspect**。
3. 悬停可预览源码标签；点击目标元素完成选中。
4. 当元素存在可用源码信息时，选中会自动复制完整 `file:line:column`，并在配置的编辑器中打开对应位置。
5. 使用面板中的 **Copy** 或 **Open**，可以单独重复其中一个动作。

面板显示最近组件名、源码路径、行、列和生成的 CSS selector。File 默认显示更紧凑的相对路径；悬停可查看完整路径。

## 快捷键

| 快捷键 | 操作 |
| --- | --- |
| `Alt+Shift+I` | 切换 Inspect 模式 |
| `Alt+Shift+P` | 切换面板 |
| Inspect 中按 `Escape` | 退出 Inspect 模式 |
| 已选中时按 `Escape` | 清除选中状态并回到 Ready |

当焦点位于 input、textarea、select 或可编辑元素时，工具不会拦截这些快捷键。

## 源码定位方式

- **React：** 转换后的开发元数据与 React Fiber 调试信息。
- **Vue：** `vite-plugin-vue-inspector` 元数据。

有些元素没有可解析的应用源码，例如浏览器生成节点、第三方输出或框架内部节点。此时面板会显示 `Source file unavailable`，不会自动打开编辑器，但仍会保留其他选中信息。

## 仅开发期运行

Inspect Devtools 只会在 Vite 的 `serve` 模式注入，不会进入生产构建。

## Playground

仓库中提供 React 和 Vue 两个 playground，均包含 Home、Dashboard、Settings 三个 hash 路由，以及嵌套组件、导航、表单控件、状态变化和链接，方便验证选中行为。

```bash
pnpm play:react
pnpm play:vue
```

在两个 playground 中均可访问 `#/`、`#/dashboard`、`#/settings`。

## 本地开发

```bash
pnpm test
pnpm typecheck
pnpm build
```

## 当前范围

- 仅支持 React 与 Vue
- 仅支持 Vite 开发服务器
- 仅支持本地编辑器与剪贴板交接
- 不包含生产环境运行时、AI 服务集成或远程源码定位
