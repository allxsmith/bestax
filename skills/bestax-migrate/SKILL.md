---
name: bestax-migrate
description: Migrate an existing app from an unmaintained React Bulma library — react-bulma-components (v4), rbx (v2) or bloomer (0.6) — to @allxsmith/bestax-bulma on Bulma v1. Run the bestax-migrate codemod, then resolve every TODO(bestax-migrate) comment it leaves using the per-source mapping references. Use when a repo imports react-bulma-components, rbx or bloomer and wants to move to bestax-bulma, when TODO(bestax-migrate) comments are present in a codebase, or when asked to migrate off an unmaintained React Bulma library.
license: MIT
---

# Migrating to bestax-bulma

`@allxsmith/bestax-bulma` is an actively maintained React library for **Bulma v1**. The
`bestax-migrate` codemod automates most of the conversion from an unmaintained predecessor;
this skill drives the codemod and finishes what it flags.

## Pick the source

The codemod's first argument names the library you are migrating _from_. Check the app's
`package.json` and imports:

| Source                                                                        | Argument                 | References                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `react-bulma-components` v4 (unmaintained since 2022, Bulma 0.9.x)            | `react-bulma-components` | [`references/react-bulma-components/`](references/react-bulma-components/component-map.md) |
| `rbx` v2 (abandoned 2019, pins Bulma **0.7.5** plus four extensions)          | `rbx`                    | [`references/rbx/`](references/rbx/component-map.md)                                       |
| `bloomer` 0.6 (archived 2018, Bulma 0.6 era, React 16 + `create-react-class`) | `bloomer`                | [`references/bloomer/`](references/bloomer/component-map.md)                               |

Everything below is written as `<source>`; substitute the argument from that table. The
reference paths follow the same split — `references/<source>/component-map.md`,
`prop-map.md`, `unmappables.md` — while
[`references/css-migration.md`](references/css-migration.md) is shared, because the stylesheet
work is about Bulma, not about which wrapper you came from.

## Workflow

Run these steps in order. Don't hand-convert what the codemod converts automatically.

1. **Dry-run the codemod** on the source directory and review the report:

   ```sh
   pnpm dlx bestax-migrate <source> src/ --dry
   ```

2. **Apply it** (same command without `--dry`), then run the project's formatter — the
   codemod preserves surrounding formatting but doesn't prettify what it rewrites.
   Besides the components, it also migrates **stylesheets** (CSS imports →
   `@allxsmith/bestax-bulma/bestax.css`; SCSS `@import 'bulma/bulma'` + `$var` overrides
   → `@use 'bulma/sass' with (…)` plus the bestax extras) and **package.json**.
   Flags: `--css bulma|keep` for other stylesheet targets, `--no-deps` to leave
   package.json alone.

3. **Install** — the codemod edits package.json but never runs a package manager:

   ```sh
   npm install   # or pnpm/yarn
   ```

   The report groups its entries by rule. `deps` covers every package.json edit —
   what was removed, added, or left for you to decide; `imports` covers a source
   import the codemod could not rewrite and left in place; `unsupported-file` names
   a file type it cannot parse (`.vue`, `.astro`) that still imports the source;
   `value-reference` marks a component used as a value rather than as JSX. Rules
   named `component:X` and `prop:y` are per-component and per-prop, and each is
   documented in the per-source `references/` pages.

   The report's `peer-deps` entries predict install failures: bestax-bulma needs
   **React 18/19** (react-bulma-components also ran on 17, while rbx and bloomer peer-depended
   on **React 16** — upgrade react/react-dom first) and its optional Font Awesome peer wants
   **FA ≥ 6.7** (an app pinned to FA 5 either upgrades or installs with
   `npm install --legacy-peer-deps`).

4. **Resolve every TODO**: `grep -rn "TODO(bestax-migrate)" src/`. Each comment names the
   prop/component and a hint. Recipes for every recurring case are in
   `references/<source>/unmappables.md`; the full tables are in
   `references/<source>/component-map.md` and `references/<source>/prop-map.md`. Delete each
   comment as you resolve it.

5. **Finish the stylesheet layer** — flagged Sass cases (computed variables,
   indented-syntax `.sass` files), CSS flavor choice, and Bulma 0.9→1 styling changes:
   follow [references/css-migration.md](references/css-migration.md).

6. **Finish**: typecheck/build, and review the rendered app side by side against the
   pre-migration UI.

## What the codemod handles vs. flags

Every export of every supported source has a mapping entry, held to that library's real export
surface by a coverage test. Imports (named, namespace, and destructuring), component renames,
prop renames and value conversions, breakpoint objects, CSS/SCSS stylesheet imports, and
package.json dependencies convert automatically.

It flags with `TODO(bestax-migrate)` instead of guessing: components with no bestax equivalent,
controlled APIs whose shape differs, breakpoints bestax has no prop for, dynamic prop values it
can't rewrite, and props with no counterpart. Files in formats it can't parse (`.astro`,
`.vue`, `.svelte`, `.mdx`) that import the source library are reported as `unsupported-file` —
migrate those by hand with the component map. Never "fix" a TODO by silencing it — convert the
code per the references, or deliberately keep the old markup with `className` styling.

### Source-specific headlines

- **react-bulma-components**: all 32 v4 components are mapped. `Element` and `Tile` have no
  bestax equivalent; `renderAs` becomes `as` where supported.
- **rbx**: migrating removes rbx itself — it pinned `bulma@0.7.5` as a direct
  dependency plus `bulma-badge`, `bulma-divider`, `bulma-pageloader` and `bulma-tooltip`, so
  the app can finally choose its own Bulma version. rbx's badge and tooltip _helper props_
  become real wrapping `<Badge>` / `<Tooltip>` components. Its `as` is universal, bestax's is
  not. Because rbx pinned Bulma 0.7.5, you cross **two** Bulma majors — expect more visual
  drift than the 0.9 → 1 guide alone describes.
- **bloomer**: every export is a flat name and most become dotted bestax compounds
  (`CardHeaderTitle` → `Card.Header.Title`). Its `is*` booleans already are bestax's; the
  work is in `isSize`/`isColor`/`isAlign` (renamed per component), the `isDisplay`/`isHidden`
  helpers (flattened, arrays and objects included), `tag` (→ `as` where bestax has one) and
  `render` (always a TODO). Its icons are className-based and Font Awesome 4 — the biggest
  visual risk, see `references/bloomer/unmappables.md`. The app declared its own Bulma 0.6,
  which the codemod bumps; there is no pinned Bulma to free.

## Rules

- The codemod is idempotent on already-migrated files (it only touches files importing the
  source library) — safe to re-run after partial manual work.
- Don't downgrade converted props back to the old names; bestax uses `is*` booleans
  (`isLoading`), string size unions (`textSize="4"`), and `as` rather than `renderAs`.
- If a component the app uses isn't in the component map, it wasn't part of that library's
  public API — check for a local wrapper component and migrate its internals instead.
