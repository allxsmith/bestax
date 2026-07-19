---
title: Migrating from react-bulma-components
sidebar_label: From react-bulma-components
sidebar_position: 3
---

# Migrating from react-bulma-components

[`react-bulma-components`](https://github.com/couds/react-bulma-components) was for years the most
popular React wrapper for Bulma, but it has been unmaintained since early 2022 and targets
Bulma 0.9.x. `@allxsmith/bestax-bulma` is actively maintained, targets **Bulma v1** (CSS
variables, dark mode, Grid), and covers the same component surface — so most apps can migrate
mechanically.

The **`bestax-migrate`** codemod automates that mechanical part. It supports
react-bulma-components **v4** (the TypeScript rewrite most surviving apps use).

## Run the codemod

```bash
# Preview the changes and the TODO report without writing anything
pnpm dlx bestax-migrate react-bulma-components src/ --dry

# Apply it
pnpm dlx bestax-migrate react-bulma-components src/
```

(`npx bestax-migrate …` works the same.) Useful flags: `--print` echoes transformed files to
stdout; `--extensions js,jsx,ts,tsx` controls which files are considered.

The codemod uses [jscodeshift](https://github.com/facebook/jscodeshift) to rewrite your source
in place:

- **Imports** — `react-bulma-components` → `@allxsmith/bestax-bulma`, including namespace imports
  and the `const { Input, Field } = Form;` destructuring pattern.
- **Components** — all 32 components and their compound sub-components are mapped, e.g.
  `Form.Textarea` → `TextArea`, `Card.Footer.Item` → `Card.FooterItem`, `Hero.Footer` →
  `Hero.Foot`, `Panel.Header` → `Panel.Heading`, `Heading subtitle` → `SubTitle`,
  `Level.Side align="right"` → `Level.Right`, `Loader` → `Loading`.
- **Props** — `renderAs` → `as` (where supported), boolean modifiers gain their bestax prefixes
  (`loading` → `isLoading`, `fullwidth` → `isFullWidth`), numeric spacing and text sizes become
  string unions (`textSize={4}` → `textSize="4"`), and values are remapped
  (`textAlign="center"` → `"centered"`, `state="hover"` → `isHovered`).
- **Responsive objects** — `mobile={{ size: 4 }}` flattens to `sizeMobile={4}`,
  `tablet={{ display: 'flex' }}` to `displayTablet="flex"`, and so on.
- **Structure** — `Table.Container` folds into `isResponsive` on the `Table`, Navbar dropdown
  markup is restructured to bestax's `Navbar.Dropdown`/`Navbar.DropdownMenu` split, icon-font
  children become `<Icon name="…" library="…">` props, and `Menu.List title` becomes a
  `Menu.Label` sibling.

## The TODO report

Anything without a safe automatic conversion is left in place with an inline comment:

```tsx
// TODO(bestax-migrate): `Tile` — Bulma v1 replaced tiles with the Grid/Cell components — …
```

and the run ends with a summary of every TODO by file and line. TODOs are expected output, not
errors. The recurring cases:

| Flagged                                           | What to do                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Element`, `Tile`                                 | No bestax equivalent — use a semantic component; `Tile` → the [Grid](../../../api/grid/grid.md) components |
| `Dropdown value/onChange`, `Dropdown.Item value`  | bestax Dropdown is compositional — own the selection state, `onClick` per item                             |
| `touch` / `untilWidescreen` / `{ only: true }`    | No bestax helper variants — use Bulma classes via `className`                                              |
| Dynamic prop values (`state={x}`, `textSize={n}`) | Convert at the source of the expression                                                                    |
| `Pagination` extras (`delta`, custom labels, …)   | bestax Pagination windows itself; render conditionally instead of `autoHide`                               |
| `Modal closeOnEsc/closeOnBlur/showClose`          | bestax defaults already do this when `onClose` is set — delete the props                                   |

:::tip Let an agent do the follow-up
The [`bestax-migrate` skill](/docs/skills/migrate) packages this whole workflow — codemod run,
TODO resolution recipes, and the CSS step — for Claude Code and other skills.sh-compatible
agents:

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
```

:::

## Finish the migration

1. **Dependencies** — `npm uninstall react-bulma-components && npm install @allxsmith/bestax-bulma bulma`.
2. **CSS** — react-bulma-components apps run Bulma 0.9; make sure the stylesheet import is
   Bulma v1 (`import 'bulma/css/bulma.min.css'`) or one of the
   [bundled bestax flavors](../installation.md), and read the
   [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md) for the CSS-level changes (Sass variables → CSS
   variables, Tiles → Grid, automatic dark mode).
3. **Verify** — typecheck, build, and compare the rendered app against the pre-migration UI.

## Version support

The codemod maps the react-bulma-components **v4** API. v3-era patterns are detected and
flagged rather than converted: bundled-CSS imports
(`react-bulma-components/dist/react-bulma-components.min.css`) are rewritten to the Bulma v1
stylesheet, and deep `react-bulma-components/lib/components/*` imports get a TODO pointing you
at the v4 named-import style first.

## Coming from a different library?

If you're using a specific React Bulma package that isn't supported by the migration tool yet,
[open a feature request](https://github.com/allxsmith/bestax/issues/new?template=feature-request.md)
naming the package and the components you use — the codemod platform is built to grow new
source libraries.
