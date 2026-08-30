---
title: Migrating from rbx
sidebar_label: From rbx
sidebar_position: 6
---

# Migrating from rbx

[`rbx`](https://github.com/dfee/rbx) was a well-built, fully typed React wrapper for Bulma — its
last commit was **June 2019**. `@allxsmith/bestax-bulma` is actively maintained, targets
**Bulma v1** (CSS variables, dark mode, Grid), and covers the same component surface.

rbx users are stuck in a way most legacy-library users are not, for two reasons:

- **rbx pins Bulma itself.** It ships `bulma@0.7.5` as a _direct_ dependency, plus
  `bulma-badge`, `bulma-divider`, `bulma-pageloader` and `bulma-tooltip`. Your app cannot pick
  its own Bulma version while rbx is installed, so there is no incremental path to Bulma v1.
- **React 19 removed `defaultProps` on function components**, which is what rbx's
  `forwardRefAs` base is built on.

Migrating clears both at once. The codemod deletes **five dependencies** — rbx and all four of
its Bulma extensions — and replaces them with `@allxsmith/bestax-bulma` and Bulma v1.

:::tip See how they compare
For a capability-by-capability comparison of bestax against the other major React libraries, see
the latest edition of [**The State of React**](/blog/tags/state-of-react).
:::

## Run the codemod

```bash
# Preview the changes and the TODO report without writing anything
pnpm dlx bestax-migrate rbx src/ --dry

# Apply it
pnpm dlx bestax-migrate rbx src/
```

(`npx bestax-migrate …` works the same.) Useful flags: `--print` echoes transformed files to
stdout; `--extensions` controls which files are considered (default
`js,jsx,ts,tsx,scss,sass`); `--css bestax|bulma|keep` picks the stylesheet target
(default `bestax`); `--no-deps` skips the package.json update.

The codemod uses [jscodeshift](https://github.com/facebook/jscodeshift) to rewrite your source
in place:

- **Imports** — `rbx` → `@allxsmith/bestax-bulma`, including namespace imports and
  `const { Item } = Card;` destructuring. Deep imports like `rbx/base/theme` are flagged with a
  pointer to bestax's `Theme` and `ConfigProvider`.
- **Components** — every rbx export and its dot-notation compounds are mapped, e.g.
  `Card.Footer.Item` → `Card.FooterItem`, `Tag.Group` → `Tags`, `Column.Group` → `Columns`,
  `Table.Cell` → `Table.Td`, `PageLoader` → `Loading` (with `isFullPage`), `Navbar.Dropdown` → `Navbar.DropdownMenu` (bestax's `Navbar.Dropdown` is the outer container,
  which `<Navbar.Item dropdown>` becomes), `Level.Item align="right"` →
  `Level.Right`, `Navbar.Segment align="end"` → `Navbar.End`, and `Title subtitle` → `SubTitle`.
- **Props** — bare boolean modifiers gain their bestax prefixes (`outlined` → `isOutlined`,
  `rounded` → `isRounded`), `state="loading"` → `isLoading`, and the Bulma v1 spacing helpers
  replace the removed `is-*less` classes (`marginless` → `m="0"`, `radiusless` →
  `radius="radiusless"`). Most of rbx's helper values need no remapping at all — its
  `textAlign`, `textWeight` and `display` unions are already bestax's.
- **Breakpoint objects** — all three rbx shapes flatten:
  `responsive={{ tablet: { display: { value: 'flex' } } }}` → `displayTablet="flex"`,
  `<Column tablet={{ size: 6 }}>` → `sizeTablet={6}`, and
  `<Column.Group tablet={{ gapSize: 2 }}>` → `gapTablet={2}`.
- **Structure** — rbx's badge and tooltip _helper props_ become real wrapping components
  (`<Button tooltip="Hi" />` → `<Tooltip label="Hi"><Button /></Tooltip>`), `Select.Container`
  and `Image.Container` fold onto the component they wrap, and `Help`/`Label` become the plain
  Bulma markup bestax expects.
- **Stylesheets** — Bulma 0.9-era `@import` lines become `@use "bulma/sass" with (…)`, and the
  `bulma-badge` / `bulma-divider` / `bulma-pageloader` / `bulma-tooltip` imports are dropped:
  bestax ships `Badge`, `Divider`, `Loading` and `Tooltip` itself.

## The TODO report

Anything the codemod cannot convert safely is left in place with a
`// TODO(bestax-migrate): …` comment on the enclosing statement, and summarised in a report at
the end of the run. Nothing is ever silently dropped or best-guessed.

The four you are most likely to see, in the order they show up when the codemod is run over
rbx's own documentation examples:

| What               | Why                                                                                                                       | What to do                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `component:Icon`   | bestax's `Icon` takes a required `name`, which cannot be read out of an rbx `<FontAwesomeIcon icon={faHome} />` child     | `<Icon name="home" library="fa" variant="solid" />`                                     |
| `component:Tile`   | Bulma v1 removed Tiles                                                                                                    | Use [Grid and Cell](/docs/api/grid); see the [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md) |
| `component:File.*` | bestax's `<File>` renders the whole file-input structure from its own props                                               | Drop the parts; set `label`, `hasName`, `isBoxed` on `<File>`                           |
| `prop:as`          | rbx's `forwardRefAs` puts `as` on every component; bestax declares it on a smaller set, several narrowed to specific tags | Restructure, or render the tag directly                                                 |

`Generic`, `Tile`, `List`, `Fieldset`, `Numeric` and `Highlight` have no bestax counterpart, so
their imports are kept (trimmed and TODO-annotated) — your app still runs while you migrate
them by hand.

## Finish the migration

1. **Install** — the codemod already rewrote `package.json`; apply it with `npm install` (or
   pnpm/yarn). Expect a `peer-deps` report entry: rbx peer-depended on React `^16.8.6` and
   bestax-bulma needs **React 18 or 19**, so upgrade `react`/`react-dom` first. If you were on
   Font Awesome 5, bestax's optional peer wants **FA ≥ 6.7** — upgrade, or install with
   `npm install --legacy-peer-deps`.
2. **Styling follow-ups** — pick a different [CSS flavor](../installation.md) if you need
   prefixed/no-helpers/light-only builds, and read the
   [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md) for the styling changes that aren't code-level.
   Because rbx pinned Bulma **0.7.5**, you are crossing two Bulma majors — expect more visual
   drift than the guide's 0.9 → 1 baseline describes. One deliberate change:
   `bestax.css` ships `$primary` as bestax blue (`#1e6b99`) rather than Bulma's stock
   turquoise — keep the stock look with `--css bulma`, or set your own brand color via the
   `--bulma-primary-*` CSS variables.
3. **Theming** — rbx's `ThemeContext` (`rbx/base/theme`) has no direct equivalent. bestax
   splits that job between [`Theme`](/docs/api/helpers/theme) for CSS-variable overrides and
   `ConfigProvider` for the class prefix and icon library.
4. **Verify** — typecheck, build, and compare the rendered app against the pre-migration UI.

## Version support

The codemod maps the rbx **v2** API (v2.2.0 is the final release). The mapping table is checked
against rbx's own export surface in both directions, so a component it does not know about is
reported as `unknown-component` rather than being silently skipped.

## Coming from a different library?

If you're using a specific React Bulma package that isn't supported by the migration tool yet,
[open a feature request](https://github.com/allxsmith/bestax/issues/new?template=feature-request.md)
naming the package and the components you use — the codemod platform is built to grow new
source libraries.
