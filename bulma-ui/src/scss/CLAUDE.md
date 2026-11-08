# scss/ — styles for the bestax "extras"

**Only extras get SCSS.** Components that are stock Bulma (Box, Card, Navbar, …) ship no CSS
of their own — Bulma provides it. A partial exists only for components that extend beyond Bulma
(Carousel, Collapse, Dialog, the extended form inputs, …) — or that extend a stock component
(e.g. `_tabs.scss` adds vertical Tabs). The `_index.scss` files are the authoritative inventory.

## Structure

- `bestax.scss` — main entrypoint: `@use 'bulma/sass' with (…)`, bestax's Bulma configuration, + all the extras
- `extras.scss` — extras-only entrypoint (builds `dist/extras.css`, for apps bringing their own Bulma)
- `components/`, `form/`, `elements/`, `layout/`, `helpers/` — one `_foo.scss` partial per extra,
  **registered in that folder's `_index.scss`** (an unregistered partial silently ships nothing)
- `_variables.scss` — `$extras-*` tokens derived from Bulma's HSL channel vars (`--bulma-primary-h/s/l`)
- `_mixins.scss` — shared mixins: `extras-transition`, `extras-focus-outline` (a11y), `extras-sr-only`.
  It loads no Bulma module, since tests compile it with only this folder on the load path
- `_selected-row.scss` — `extras-selected-table-cell`, the cells Checkbox's and Radio's
  selected-row rules share; it reads Bulma's `$colors`, which is why it isn't in `_mixins.scss`
- `_input-trigger.scss` — `extras-input-trigger`, a button laid over an input's right edge, which
  the date and time pickers' launcher and PasswordInput's toggle share; it reads Bulma's class
  prefix and variables, so it isn't in `_mixins.scss` either
- `versions/` — the flavor builds: `bestax-prefixed`, `bestax-no-helpers`, `bestax-no-dark-mode`,
  `bestax-no-helpers-prefixed`. A new partial is included by all of them automatically (they reuse
  the same `_index` imports), but must **work** under each — especially the prefixed build.
  Each one repeats `bestax.scss`'s Bulma configuration in its own `with (…)`, so a change to it
  goes in every one. A default bestax changes in stock Bulma belongs there, configured, rather
  than in a partial overriding it: `extras.css` then sets nothing, and an app's own Bulma build
  keeps its value.

## The pattern (every partial follows it — `components/_collapse.scss` is the template)

```scss
@use 'bulma/sass/utilities/initial-variables' as iv;
@use 'bulma/sass/utilities/css-variables' as cv;
@use '../mixins' as *;

// 1. SCSS vars, !default, derived from Bulma tokens — never hardcoded hex
$collapse-border-color: cv.getVar('border') !default;

// 2. Register them as --bulma-* CSS vars on the root class
.#{iv.$class-prefix}collapse {
  @include cv.register-vars(
    (
      'collapse-border-color': #{$collapse-border-color},
    )
  );
}

// 3. Consume only via cv.getVar(); class names only via the prefix interpolation
.#{iv.$class-prefix}collapse.#{iv.$class-prefix}is-bordered {
  border: 1px solid cv.getVar('collapse-border-color');
}
```

Rules the pattern encodes:

- **Never a literal class selector** (`.collapse`) — always `.#{iv.$class-prefix}collapse`,
  or the `bestax-prefixed` flavor breaks silently.
- **Never a raw color/size value** in declarations — derive from Bulma tokens via `cv.getVar()`
  so the extra is themeable exactly like stock Bulma (`--bulma-collapse-border-color: …`).
  This is the contract the `Theme` component and the `bestax-theming` skill rely on.
- **Register every themable value** — durations, offsets, and insets included, not just colors.
  Prefer an existing Bulma token (`cv.getVar('radius-rounded')`, never `9999px`); dark mode
  works only through scheme tokens (`scheme-main`, `text`, `border`) — a hardcoded grey is a
  dark-mode bug.
- **Reuse `extras-*` mixins** for transitions, focus outlines, and screen-reader-only content
  instead of re-rolling them (focus style consistency is an a11y requirement).
- New CSS variables should be documented in
  `skills/bestax-theming/references/css-variables.md`, and the component's rows added to
  `skills/bestax-theming/references/themeable-components.md`, in the same PR.
- **A wrapper component styling a compound selector** (LinkButton's
  `.#{iv.$class-prefix}button.#{iv.$class-prefix}link-button`) is claimed by class AND key
  prefix together: name your variables `<your-prefix>-*` or the matcher assigns them to
  nobody. After adding one, run `pnpm gen:api-sources` and confirm the component's
  `SCSS_SOURCES` entry is non-empty — an empty entry silently suppresses the API page's
  CSS & Sass Variables section, which is how LinkButton shipped its variables invisibly
  (#464). The orphan rule in `check:conformance` now fails on a partial that no component
  claims, so the miss is loud, but the fix is still yours to make.

## A partial that adjusts stock Bulma

Some partials change a stock component rather than add one (`elements/_button.scss`,
`components/_pagination.scss`, `components/_menu.scss`). They follow the pattern above, plus:

- **Outrank Bulma whichever stylesheet loads first.** An app may load `extras.css` before or
  after Bulma, so match Bulma's selector and add one class or ancestor (`.button.button`,
  `.pagination .pagination-link`), and test both load orders.
- **Check every case the selector reaches.** A loop over Bulma's `$colors` also reaches `text`,
  which is every `LinkButton`. A rule for one state can erase another state's only cue: a border
  at rest in forced colors is the same border Bulma draws for focus. List the variants, sizes and
  states the rule touches, and check each.
- **Forced colors:** scope the rule to `@media (forced-colors: active)`, paint with system colors
  (`CanvasText`, `ButtonText`), and put `forced-color-adjust: none` only on the smallest element
  that needs it, so everything else keeps the user's palette.
- **Name the `@use`.** Docs that show the partial beside the Bulma module it adjusts load it
  `as bestax-<name>`, since Sass refuses two `@use` lines with the same name.
- `ORPHAN_EXEMPT` in `scripts/check-conformance.mjs` is for a partial no component can claim. Its
  reason says why that stays true, not which issue added it.
- A new partial also means updating every page that lists the partials: see "Finishing a change"
  in the root `CLAUDE.md`.
