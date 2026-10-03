# bestax-migrate (Codemod Registry)

Migrates a React app to
[`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
on Bulma v1 from:

- `react-bulma-components` v4
- `rbx` v2
- `bloomer` 0.6
- `bulma-classes`: Bulma's classes on plain JSX, no library

This registry package runs the
[`bestax-migrate`](https://www.npmjs.com/package/bestax-migrate) CLI from npm at
a pinned version, and that release carries signed npm provenance. The full
documentation is the
[bestax-migrate README](https://github.com/allxsmith/bestax/tree/main/bestax-migrate#readme).

## Usage

Run it from your app root, with Node.js 22 or newer:

```bash
# Preview: report what would change and write nothing
npx codemod bestax-migrate --workflow preview --param source=react-bulma-components

# Apply
npx codemod bestax-migrate --param source=react-bulma-components

# Other sources, paths and options
npx codemod bestax-migrate --param source=rbx --param paths="src lib"
npx codemod bestax-migrate --param source=bulma-classes --param options="--css bestax"
```

`source` is required: `react-bulma-components`, `rbx`, `bloomer` or
`bulma-classes`. `paths` defaults to `src`. `options` passes extra flags through
to the CLI (`--css`, `--no-deps`, `--extensions`).

Codemod's own `--dry-run` skips shell steps, so it shows nothing for this
package. Use `--workflow preview` instead.

## After it runs

1. Run your package manager's install. The codemod rewrote `package.json` but
   never installs anything.
2. Resolve each `// TODO(bestax-migrate)` comment. The run ends with a list of
   them by file and line.
3. Typecheck, build, and review the rendered app.

Migration guides:
[react-bulma-components](https://bestax.io/docs/guides/getting-started/migration/react-bulma-components),
[rbx](https://bestax.io/docs/guides/getting-started/migration/rbx),
[bloomer](https://bestax.io/docs/guides/getting-started/migration/bloomer),
[Bulma classes](https://bestax.io/docs/guides/getting-started/migration/bulma-classes).
