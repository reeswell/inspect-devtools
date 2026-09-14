# Publishing

The four public packages are versioned together:

- `@inspect-devtools/core`
- `@inspect-devtools/client`
- `@inspect-devtools/vite-react`
- `@inspect-devtools/vite-vue`

Before publishing:

```bash
pnpm install --frozen-lockfile
pnpm release:check
pnpm -r pack --pack-destination /tmp/inspect-devtools-pack
```

Inspect each tarball and confirm it contains `dist`, `README.md`, `LICENSE`, and `package.json` only. `workspace:*` dependencies are rewritten to the matching published version by pnpm.

Publish the packages in dependency order:

```bash
pnpm --filter @inspect-devtools/core publish
pnpm --filter @inspect-devtools/client publish
pnpm --filter @inspect-devtools/vite-react publish
pnpm --filter @inspect-devtools/vite-vue publish
```

Use `--access public` if your npm configuration does not read `publishConfig.access`. Create the npm access token and provenance/CI setup outside this repository; no credentials belong in source control.
