# Inspect Devtools

[English](./README.md)

Inspect Devtools 是一个 Vite 开发期插件，用于从浏览器中定位 React 或 Vue 渲染元素对应的源码。选中元素后，工具会复制源码文件引用，并在编辑器中打开对应文件。

它适合本地调试，也适合把源码文件引用交给同事、写入 issue，或粘贴给编码助手。

![选中元素即复制 @ 引用，并在编辑器中打开源码](https://raw.githubusercontent.com/reeswell/inspect-devtools/main/docs/inspect.gif)

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

### 复制格式

复制的源码引用支持两种格式。通过 `copyFormat` 设置项目默认格式。

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ copyFormat: 'codex' }),
]
```

| `copyFormat` | 输出示例 | 适用工具 |
| --- | --- | --- |
| `'codex'`（默认） | `[App.vue](/绝对路径/App.vue)` | Codex 及其他支持 Markdown 的工具 |
| `'cursor'` | `@playgrounds/react/src/components/App.vue`（相对仓库根目录；仓库外文件回退为 `@/绝对路径`） | Cursor、Claude Code |

Claude Code 的文件引用与 Cursor 同为 `@路径` 形式，因此 `cursor` 格式同时适用于两者。

所有格式都会将 Windows 路径统一为正斜杠，且不包含行列号；精确的 `行:列` 定位仍保留给编辑器打开动作。

Vite 配置是面向所有人的项目默认值。面板中还提供 **Copy format** 选择器（Codex、Cursor / Claude Code），选择结果按项目保存在浏览器 `localStorage` 中，作为当前浏览器的个人覆盖。面板选择优先于 Vite 默认值，并立即作用于自动复制；**Reset to default** 可清除覆盖、恢复项目默认。当 `localStorage` 不可用时，选择仅保留在本次会话内存中，复制功能不受影响。启动 Inspect 或选中元素都不会自动打开面板。

`inspectDevtoolsVue` 同样支持该选项。

### 主题

dock 与面板默认使用浅色主题。通过 `theme` 可将深色主题设为项目默认。

```ts
plugins: [
  react(),
  ...inspectDevtoolsReact({ theme: 'dark' }),
]
```

面板头部也提供主题切换按钮，选择结果按项目保存在浏览器 `localStorage` 中，作为当前浏览器对 Vite 默认值的个人覆盖。

![浅色主题下的面板](https://raw.githubusercontent.com/reeswell/inspect-devtools/main/docs/panel-light.png#gh-light-mode-only)
![深色主题下的面板](https://raw.githubusercontent.com/reeswell/inspect-devtools/main/docs/panel-dark.png#gh-dark-mode-only)

`inspectDevtoolsVue` 同样支持该选项。

## 使用流程

1. 启动 Vite 开发服务器。
2. 按 `Alt+Shift+I`，或点击底部 dock 中的准星按钮。
3. 悬停可预览源码标签；点击目标元素完成选中。面板保持关闭，除非主动通过 Panel 按钮或快捷键打开。
4. 当元素存在可用源码信息时，选中会自动复制源码文件引用，并在配置的编辑器中精确打开对应行列。

Copy 生成相对仓库根目录的 `@` 引用，如 `@playgrounds/vue/src/App.vue`（文件在仓库外时为 `@/绝对路径/App.vue`），Cursor、Claude Code 等编码助手都能识别。复制不附带行列信息；行列仅供编辑器打开时精确跳转使用。启动 Inspect 或选中元素都不会自动打开面板。

面板承载当前浏览器的主题偏好；工具栏状态标签会显示当前是否有选中的元素。

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

有些元素没有可解析的应用源码，例如浏览器生成节点、第三方输出或框架内部节点。此时不会自动复制，也不会自动打开编辑器。

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
