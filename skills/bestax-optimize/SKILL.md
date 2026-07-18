---
name: bestax-optimize
description: Reduce the built CSS size of an app using @allxsmith/bestax-bulma — measure raw and gzip size, then apply the cheapest lever that fits (lighter prebuilt CSS flavor, hand-rolled modular Sass build, import and icon-asset hygiene). Use when the CSS bundle looks too big, a size budget or Lighthouse audit flags stylesheet weight, switching bestax.css to a versions/*.css flavor, or setting up a modular @use Bulma/Sass build.
license: MIT
---

# Optimizing CSS size with @allxsmith/bestax-bulma

The JS side is tree-shakable (the **entire** library is ~49 KB min+gzip). The stylesheet is
not: a prebuilt flavor ships all of Bulma + the bestax extras regardless of which components
the app renders. Judge stylesheet weight by the **gzipped** transfer size — never the raw
`dist/` number.

## Always measure first

Run the production build, then measure the built CSS — raw and gzip:

```sh
npm run build
wc -c dist/assets/*.css            # raw bytes (what Vite reports)
gzip -c dist/assets/*.css | wc -c  # transfer bytes (what users download)
```

Re-measure after **every** step below and report the before/after delta (raw + gzip). Never
claim a saving without a number.

⚠️ **~800 KB raw is ~82 KB over the wire.** Seeing ~800 KB of CSS in `dist/` is expected
with the default flavor, not a build misconfiguration — servers and CDNs gzip/brotli by
default. If the gzip number is already within the app's budget, say so and stop: "your CSS is
already fine" is a valid, honest outcome.

## Decision flow

Cheapest first. Use only the library's own shipped CSS builds and SCSS sources — do not add
third-party build plugins (no CSS purgers/post-processors).

1. **Flavor switch** — one-line import change, minutes (up to ~15 KB gzip).
2. **Modular Sass build** — small `@use` file, the biggest honest win.
3. **Import & icon-asset hygiene** — minor; JS and icon fonts, not the Bulma CSS.

## Lever 1 — lighter prebuilt flavor

Swap the single CSS import (in `src/main.tsx` / `src/main.jsx`) between the shipped flavors.
Measured sizes drift slightly between releases — hence measure:

| Flavor       | Import                                                               |    Raw |   Gzip |
| ------------ | -------------------------------------------------------------------- | -----: | -----: |
| complete     | `import '@allxsmith/bestax-bulma/bestax.css';`                       | ~800KB | ~82 KB |
| no-dark-mode | `import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';` | ~680KB | ~70 KB |
| no-helpers   | `import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';`   | ~595KB | ~67 KB |

Prefixed variants (`versions/bestax-prefixed.css` ~875 KB/~84 KB,
`versions/bestax-no-helpers-prefixed.css` ~655 KB/~69 KB) exist for CSS-collision
**compatibility, not size** — a prefixed flavor must pair with
`<ConfigProvider classPrefix="bestax-">` at the app root, and switching a non-prefixed app to
one is never a size optimization.

- `no-dark-mode` (~12 KB gzip saved) — only when the app pins a single color scheme (a fixed
  `Theme colorMode` / `data-theme`).
- `no-helpers` (~15 KB gzip saved) — **hard gate below**.

⚠️ **The `no-helpers` gate: check for helper props first.** That flavor drops every class the
helper props compile to — components still render, but the props silently do nothing. Before
recommending it, grep the app's source for helper props on bestax components:

- spacing: `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`, `p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`
- color: `color`, `backgroundColor` (+ `colorShade`/`backgroundColorShade`), `textColor`, `bgColor`
- typography: `textSize`, `textAlign`, `textTransform`, `textWeight`, `fontFamily`
- display/visibility: `display`, `visibility` (+ `displayMobile`…`visibilityFullhd` viewport variants)
- flexbox: `flexDirection`, `flexWrap`, `justifyContent`, `alignContent`, `alignItems`, `alignSelf`, `flexGrow`, `flexShrink`
- misc: `float`, `overflow`, `overlay`, `interaction`, `cursor`, `radius`, `shadow`, `skeleton`, `clearfix`, `relative`, `fullHeight`

…and for raw Bulma helper classes in `className` strings (`is-*`, `has-*`, `m*-*`, `p*-*`,
`is-size-*`, `is-hidden*`, `is-flex*`). **Any hit → do not use `no-helpers`**; fall back to
`no-dark-mode` or Lever 2. The bestax extras helpers (`is-cursor-*`, sizing) are dropped too.

## Lever 2 — modular Sass build

Compile only the Bulma modules + bestax extras partials the app actually uses. Needs the
`sass` compiler as a dev dependency (Bulma's own build tool — Vite compiles `.scss` natively):

```sh
npm install -D sass
```

Create `src/styles.scss` — base + themes always come first:

```scss
// Configure shared variables FIRST (before anything loads utilities) —
// the prebuilt flavors set this brand primary; omit it and buttons revert
// to Bulma's default turquoise:
@use 'bulma/sass/utilities' with (
  $primary: #1e6b99
);

// Required base: reset + CSS variable definitions
@use 'bulma/sass/base';
@use 'bulma/sass/themes';

// One line per stock Bulma component the app imports…
@use 'bulma/sass/elements/button';
@use 'bulma/sass/components/navbar';
// …and per bestax extras component:
@use '@allxsmith/bestax-bulma/scss/components/dialog';
// Helper categories only if the app uses those helper props:
@use 'bulma/sass/helpers/spacing';
```

Then replace the prebuilt CSS import in `src/main.tsx` with `import './styles.scss';`,
build, and measure. Derive the `@use` list from the components the app imports from
`@allxsmith/bestax-bulma` — the full component→partial mapping, the authoritative extras
partial inventory, and a worked example are in `references/modular-build.md`.

## Lever 3 — import & icon-asset hygiene (minor)

- **Named imports.** `import * as Bestax from '@allxsmith/bestax-bulma'` defeats tree
  shaking. Convert to named imports (`import { Button, Card } from …`) — a JS-side saving
  (whole library ≈ 49 KB min+gzip), so report it honestly as minor.
- **Unused icon libraries.** Scaffolded apps may carry an icon library the app never uses:
  icon-font packages in `package.json` (`@fortawesome/fontawesome-free`, `@mdi/font`,
  `material-icons`, `material-symbols`) with their CSS imports in `src/main.*`, or Ionicons
  CDN `<script>` tags in `index.html`. Icon fonts often outweigh Bulma itself — if no
  `<Icon>` uses that library, delete the dependency/import/script. Pure win, no tooling.

## References

- `references/modular-build.md` — full Lever 2 procedure: component→partial mapping, the
  authoritative extras partial inventory, helper categories, and a worked `styles.scss`.
- Docs: [Optimizing CSS Size](https://bestax.io/docs/guides/getting-started/optimizing-css) ·
  [Modular — Option C](https://bestax.io/docs/guides/getting-started/modular#option-c--hand-rolled-modular-scss-advanced) ·
  [CSS Variations](https://bestax.io/docs/guides/getting-started/variations#file-size-comparison)
