---
title: bestax-bulma 4.x → 5.x
sidebar_label: 4.x to 5.x
sidebar_position: 1
---

# Upgrading bestax-bulma 4.x → 5.x

This guide explains what changes when you upgrade `@allxsmith/bestax-bulma` from 4.x to 5.x. There is **one** consumer-facing change: the `versions/bestax-bulma-prefixed.css` stylesheet and its package export (the variant that prefixed every class with `bulma-`) are removed. Everything else in the 5.x line is additive — new components and props; no component props or JavaScript exports are removed or renamed.

## TL;DR

:::tip One thing to check
5.x removes the **`versions/bestax-bulma-prefixed.css`** stylesheet. If you never imported that file, upgrade freely — nothing in your code needs to change. If you did, switch the import to `versions/bestax-prefixed.css` and change `classPrefix="bulma-"` to `classPrefix="bestax-"`.
:::

| Area                         | What changed                                                            | Action                                                                |
| ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| CSS variations               | `versions/bestax-bulma-prefixed.css` export removed                     | Import `versions/bestax-prefixed.css` and set `classPrefix="bestax-"` |
| Class prefix                 | One prefixed scheme (`bestax-`) instead of two (`bestax-` and `bulma-`) | Update custom CSS that targets `.bulma-*` classes to `.bestax-*`      |
| Component behavior           | No changes                                                              | None                                                                  |
| Component props / JS exports | No removals or renames                                                  | None                                                                  |
| React peer range             | Unchanged (`^18.0.0 \|\| ^19.0.0`)                                      | None                                                                  |

## The one breaking change: `bestax-bulma-prefixed.css` is removed

4.x shipped **two** prefixed CSS bundles: `versions/bestax-prefixed.css` (classes prefixed `bestax-`, e.g. `bestax-button`) and `versions/bestax-bulma-prefixed.css` (classes prefixed `bulma-`, e.g. `bulma-button`). 5.x standardizes on a single `bestax-` prefix scheme and drops the `bulma-`-prefixed bundle, including its `package.json` export.

**Who is affected:**

- ✅ Importing `bestax.css`, `versions/bestax-prefixed.css`, one of the `no-helpers` / `no-dark-mode` variants, `extras.css`, or building your own Sass — upgrade with no code changes. Those stylesheets are unchanged.
- ⚠️ Importing `versions/bestax-bulma-prefixed.css` — the import no longer resolves (`ERR_PACKAGE_PATH_NOT_EXPORTED`), so your build fails loudly rather than silently losing styles. Migrate as follows.

### Migrate in two steps

Swap the stylesheet import and the [`ConfigProvider`](/docs/api/helpers/config) prefix together:

```tsx title="Before (4.x)"
import { ConfigProvider, Button } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-bulma-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Button color="primary">Save</Button>
    </ConfigProvider>
  );
}
```

```tsx title="After (5.x)"
import { ConfigProvider, Button } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Button color="primary">Save</Button>
    </ConfigProvider>
  );
}
```

### Update anything that referenced `bulma-*` class names

The rendered class names change from `bulma-*` to `bestax-*`:

```html title="Rendered HTML, before → after"
<!-- 4.x with bestax-bulma-prefixed.css -->
<button class="bulma-button bulma-is-primary">Save</button>

<!-- 5.x with bestax-prefixed.css -->
<button class="bestax-button bestax-is-primary">Save</button>
```

So alongside the two-step swap, update anything in your project that referenced the old names: custom CSS overrides (`.bulma-button { … }` → `.bestax-button { … }`), and any tests or E2E selectors that queried `.bulma-*` classes.

### If you need to keep the `bulma-` prefix

The pre-built bundle is gone, but the prefix itself isn't reserved — you can rebuild the same stylesheet from Sass, exactly like the [Custom Brand variation](../variations.md#custom-brand-scss-only):

```scss title="src/styles/bulma-prefixed.scss"
@use 'bulma/sass' with (
  $class-prefix: 'bulma-'
);

// Include bestax extras (Toast, Dialog, Carousel, Slider, Switch, etc.)
@use '@allxsmith/bestax-bulma/scss';
```

Import that file instead of the removed CSS (you'll need `bulma` and `sass` installed — `pnpm add bulma sass`), keep `classPrefix="bulma-"`, and nothing else changes.

**Why this changed:** maintaining two parallel prefixed bundles doubled the prefixed build and test surface without adding capability — anything the `bulma-` bundle could do, the `bestax-` bundle (or a custom Sass build) does equally well. 5.x standardizes on the single `bestax-` scheme.

## No other breaking changes

No components, component props, or JavaScript exports were removed or renamed crossing the 5.0 boundary — the stylesheet export above is the only removal — and the React peer range is unchanged from 4.x (React 18 or 19). The rest of the 5.x line is additive — highlights since 4.x:

- New components: [Avatar](/docs/api/components/avatar), [Avatars](/docs/api/components/avatars), [Badge](/docs/api/components/badge), and [Reveal](/docs/api/components/reveal) (scroll-triggered animations).
- Compound (dot-notation) sub-components for all parent/child families — `Card.Header`, `Navbar.Item`, `Modal.Card`, and the rest.
- [`Theme`](/docs/api/helpers/theme) gained a `colorMode` prop for forcing light/dark mode.
- `Button` and `Link` accept a polymorphic `as` prop; `Columns` gained a `gap` prop.

The full list is in the [changelog](https://github.com/allxsmith/bestax/blob/main/bulma-ui/CHANGELOG.md).

:::note Coming from 3.x?
If you're upgrading across majors, read the [3.x → 4.x guide](./bulma-ui-3-to-4.md) first — that release raised the React floor to 18. And if you're coming all the way from 2.x, the [2.x → 3.x guide](./bulma-ui-2-to-3.md) is where the real migration work (if any) lives.
:::
