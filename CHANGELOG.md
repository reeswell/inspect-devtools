# Changelog

All notable changes to Inspect Devtools are documented here.

## 0.7.1

- Reveal the theme toggle from the Inspect dock button without shifting the Inspect icon.
- Refresh the Inspect icon to a four-corner focus frame with a center point.

## 0.7.0

- Copy now prepends a single `Route:` line before the `@`-mentions, carrying the current pathname, search, and hash (no origin), so coding agents know which page the selection lives on. A route ending with `/` gets a trailing space so pasting into an agent input doesn't trigger slash-command completion. Add a `copyRoute` project option (`true` by default); set it to `false` to keep copies to bare `@`-mentions.
- Bring back a project-level copy format option as `copyFormat`: `'mention'` (default) keeps the `@`-mention for coding agents; `'link'` copies a standard Markdown link such as `[App.vue](/absolute/path/App.vue)` for documents, tickets, and other non-AI destinations.

## 0.5.0

**Breaking:** the floating panel and its `Alt+Shift+P` shortcut are removed. The bottom dock is now the only persistent UI, holding the Inspect toggle and the theme toggle; feedback and errors surface as transient toasts above the dock.

- Selecting an element with no resolvable source now reports "No source found for this element" instead of staying silent.
- The theme toggle moved into the dock; the per-project browser override still applies.

## 0.4.0

**Breaking:** the `copyFormat` option and the panel's Copy format picker are removed. Copy now always produces an `@`-mention of the source file relative to the repository root (falling back to `@/absolute/path` outside it), a shape understood by Cursor, Claude Code, and other coding agents. Remove `copyFormat` from your Vite config when upgrading.

- The panel keeps only the Inspect toggle, status, and theme preference.
- The README gains a workflow GIF and light/dark panel screenshots.

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
