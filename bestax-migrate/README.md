# bestax-migrate

Codemods that migrate existing React apps to [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) — the actively maintained React component library for **Bulma v1**.

Currently supported source libraries:

| Source                                                                           | Status                                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`react-bulma-components`](https://github.com/couds/react-bulma-components) (v4) | ✅ All 32 components mapped (a few patterns are flagged as TODOs) |

## Usage

```bash
# Preview what would change (no writes)
pnpm dlx bestax-migrate react-bulma-components src/ --dry

# Apply the migration
pnpm dlx bestax-migrate react-bulma-components src/
```

npm and yarn work too: `npx bestax-migrate …` / `yarn dlx bestax-migrate …`.

The codemod uses [jscodeshift](https://github.com/facebook/jscodeshift) to:

- rewrite `react-bulma-components` imports to `@allxsmith/bestax-bulma` (including `const { Input } = Form` destructuring and namespace imports)
- rename components and compound sub-components (`Form.Textarea` → `TextArea`, `Card.Footer.Item` → `Card.FooterItem`, `Hero.Footer` → `Hero.Foot`, …)
- convert props (`renderAs` → `as`, `loading` → `isLoading`, numeric spacing/text sizes → string unions, `textAlign="center"` → `textAlign="centered"`, …)
- flatten responsive breakpoint objects (`mobile={{ size: 4 }}` → `sizeMobile={4}`)
- restructure patterns bestax models differently (`Table.Container`, Navbar dropdowns, `Form.Help`, icon-font children → `<Icon name=…>`)

Anything without a safe automatic conversion is left in place with a `// TODO(bestax-migrate): …` comment, and the run ends with a report of every TODO by file and line. TODOs are expected output, not errors — resolve them with the [migration guide](https://bestax.io/docs/guides/getting-started/migration/react-bulma-components), or let the [`bestax-migrate` Agent Skill](https://bestax.io/docs/skills/intro) walk them for you:

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
```

## Options

| Flag                 | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `--dry`, `-d`        | Report what would change without writing files       |
| `--print`, `-p`      | Print transformed sources to stdout                  |
| `--extensions`, `-e` | File extensions to include (default `js,jsx,ts,tsx`) |

## After the codemod

1. Swap the dependency: `npm uninstall react-bulma-components && npm install @allxsmith/bestax-bulma bulma`
2. Make sure your Bulma CSS import points at Bulma v1 (`import 'bulma/css/bulma.min.css'`)
3. Search for `TODO(bestax-migrate)` and resolve each comment
4. Typecheck/build and review the rendered app

Full walkthrough: [react-bulma-components migration guide](https://bestax.io/docs/guides/getting-started/migration/react-bulma-components).

## License

MIT © Alex Smith
