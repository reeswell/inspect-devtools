# Publishing

The four public packages are versioned together:

- `@inspect-devtools/core`
- `@inspect-devtools/client`
- `@inspect-devtools/vite-react`
- `@inspect-devtools/vite-vue`

## One-Click Release (Recommended)

Ensure you are logged in to npm first:

```bash
npm whoami
# If not logged in:
npm login
```

Then run the one-click release script:

```bash
pnpm release
```

The script will automatically:
1. Verify npm credentials.
2. Let you choose the semver increment (patch / minor / major / custom).
3. Run `pnpm release:check` (tests, typecheck, build).
4. Update `package.json` versions across all 4 packages.
5. Create a Git commit and annotated Git tag (`vX.Y.Z`).
6. Push commits and tags to GitHub (`origin`).
7. Publish all packages to the official npm registry in topological order.

---

## Manual Release

Before publishing manually:

```bash
pnpm install --frozen-lockfile
pnpm release:check
pnpm -r pack --pack-destination /tmp/inspect-devtools-pack
```

Inspect each tarball and confirm it contains `dist`, `README.md`, `LICENSE`, and `package.json` only. `workspace:*` dependencies are rewritten to the matching published version by pnpm.

Publish the packages in dependency order:

```bash
pnpm --filter @inspect-devtools/core publish --access public
pnpm --filter @inspect-devtools/client publish --access public
pnpm --filter @inspect-devtools/vite-react publish --access public
pnpm --filter @inspect-devtools/vite-vue publish --access public
```

Use `--access public` if your npm configuration does not read `publishConfig.access`. Create the npm access token and provenance/CI setup outside this repository; no credentials belong in source control.
