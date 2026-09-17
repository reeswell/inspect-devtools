# Changelog

All notable changes to Inspect Devtools are documented here.

## 0.3.0

- Redesign the dock and panel with a minimal icon-based UI: the dock becomes two icon buttons, and the panel keeps only the Inspect toggle, status, and preferences.
- Add a `theme` option (`'light'` by default, `'dark'` available) covering the dock, panel, and overlays; the panel header theme toggle persists a per-project override in the browser.
- Remove the Selection details section from the panel, including its Copy/Open repeat buttons; selecting an element still auto-copies and opens the editor, and the source badge remains clickable.
- Rework the copy-format picker as a segmented control with an on-demand reset-to-default affordance.

## 0.2.0

- Add a `copyFormat` project option: `codex` (default) copies a standard Markdown link such as `[App.vue](/absolute/path/App.vue)`; `cursor` copies an `@`-mention relative to the repository root, accepted by both Cursor and Claude Code.
- Add a panel copy-format selector with a per-project `localStorage` override for the current browser and a reset-to-default action.
- Copy output no longer carries `line:column`; opening in the editor still navigates to the exact line and column.

## 0.1.1

- Add GitHub repository, homepage, and issue tracker metadata to published packages.

## 0.1.0

- Initial public release.
- Vite development-time source inspection for React and Vue.
- Automatic source-location copy and editor opening on selection.
- Keyboard shortcuts, selection reset, and React/Vue playgrounds.
