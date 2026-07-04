# scss/ — styles for the bestax "extras"

**Only extras get SCSS.** Components that are stock Bulma (Button, Card, Navbar, …) ship no CSS
of their own — Bulma provides it. A partial exists only for components that extend beyond Bulma
(Carousel, Collapse, Dialog, Steps, Tabs, Tooltip, the extended form inputs, …).

## Structure

- `bestax.scss` — entrypoint: `@use 'bulma/sass' with ($primary: #1e6b99)` + all the extras
- `components/`, `form/`, `elements/`, `helpers/` — one `_foo.scss` partial per extra,
  **registered in that folder's `_index.scss`** (an unregistered partial silently ships nothing)
- `_variables.scss` — `$extras-*` tokens derived from Bulma's HSL channel vars (`--bulma-primary-h/s/l`)
- `_mixins.scss` — shared mixins: `extras-transition`, `extras-focus-outline` (a11y), `extras-sr-only`
- `versions/` — the flavor builds: `bestax-prefixed`, `bestax-no-helpers`, `bestax-no-dark-mode`,
  `bestax-no-helpers-prefixed`. A new partial is included by all of them automatically (they reuse
  the same `_index` imports), but must **work** under each — especially the prefixed build.

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
- **Reuse `extras-*` mixins** for transitions, focus outlines, and screen-reader-only content
  instead of re-rolling them (focus style consistency is an a11y requirement).
- New CSS variables should be documented in
  `skills/bestax-theming/references/css-variables.md` alongside the docs page.
