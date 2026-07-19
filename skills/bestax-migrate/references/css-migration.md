# Stylesheets: Bulma 0.9 → Bulma v1 + bestax

react-bulma-components apps style with Bulma 0.9.x; bestax-bulma targets Bulma v1. The
codemod automates most of this layer — this reference explains what it did and how to
finish what it flagged.

## What the codemod already did (default `--css bestax`)

- **CSS imports**: `bulma/css/bulma(.min).css` and v3-era
  `react-bulma-components/dist/*.css` imports became the recommended combined bundle
  `@allxsmith/bestax-bulma/bestax.css` (Bulma v1 + the bestax extras that themed
  Radio/Checkbox and the advanced form controls need). A separate `extras.css` import
  next to it is collapsed.
- **SCSS files**: Bulma 0.9's `@import 'bulma/bulma.sass'` (plus preceding
  `$var: value !default;` overrides) became Bulma v1 module syntax, with simple literal
  overrides folded in:

  ```scss
  @use 'bulma/sass' with (
      $primary: #ff6b35,
      $family-primary: 'Nunito',
      sans-serif
    );
  @use '@allxsmith/bestax-bulma/scss/extras';
  ```

  0.9 `_all` aggregator imports (`bulma/sass/elements/_all`) became directory modules
  (`@use 'bulma/sass/elements';`).

- **package.json**: `react-bulma-components` removed, `@allxsmith/bestax-bulma` added,
  `bulma` bumped to `^1.0.4` (or added when sources still import `bulma/…` directly),
  and dead `node-sass` replaced with dart `sass`. Run the package manager's install
  afterwards — the codemod never installs anything.

Flag reference: `--css bulma` keeps plain `bulma/css/bulma.min.css` and adds a separate
`@allxsmith/bestax-bulma/extras.css` import; `--css keep` leaves stylesheets alone;
`--no-deps` skips the package.json step.

## Finishing the flagged cases

- **Computed Sass variables** (`$primary: lighten(#333, 10%);` and anything with
  functions/interpolation): move them into the `with (…)` configuration by hand —
  `with (…)` values must be compile-time literals, so resolve the expression or compute
  it after the `@use`.
- **Indented-syntax `.sass` files**: flagged, not rewritten. Convert `@import` lines to
  `@use "bulma/sass" with (…)` manually (same rules as SCSS, minus semicolons/braces).
- **Unknown 0.9 partial paths**: the v1 sass tree is `bulma/sass/{utilities,base,
elements,form,components,grid,layout,helpers,themes}` with leaf partials like
  `bulma/sass/utilities/initial-variables` — find the equivalent module and `@use` it.

## Choosing a CSS flavor (optional)

`bestax.css` is right for almost every app. Alternatives (swap the import specifier):

| Import                                                            | Use when                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `@allxsmith/bestax-bulma/versions/bestax-prefixed.css`            | class conflicts with another framework — pair with `<ConfigProvider classPrefix="bestax-">` |
| `@allxsmith/bestax-bulma/versions/bestax-no-helpers.css`          | smallest CSS; **helper props like `mt="4"` stop working**                                   |
| `@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css` | both of the above                                                                           |
| `@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css`        | light-mode-only product                                                                     |

## Custom SCSS builds with bestax

Do **not** `@use '@allxsmith/bestax-bulma/scss/bestax'` when you need your own
`$variable` overrides — that entry pre-configures `bulma/sass` and Sass forbids
configuring a module twice. The correct pairing (what the codemod emits) is:

```scss
@use 'bulma/sass' with (
  $primary: …
);
@use '@allxsmith/bestax-bulma/scss/extras';
```

Per-component partials also exist (`@use '@allxsmith/bestax-bulma/scss/components/dialog';`,
`…/scss/form/autocomplete`, …) for modular builds.

## Runtime theming

Bulma v1 themes with `--bulma-*` CSS variables at runtime (dark mode is automatic).
Sass `with (…)` is for compile-time tokens; for brand/dark-mode work use the bestax
`Theme` component — see the `bestax-theming` skill and
https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1 for the broader
0.9 → 1 changes (Tiles → Grid, `is-bold` gradients removed, automatic dark mode).
