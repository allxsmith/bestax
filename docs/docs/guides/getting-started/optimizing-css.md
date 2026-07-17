---
title: Optimizing CSS Size
sidebar_label: Optimizing CSS Size
sidebar_position: 6
---

# Optimizing CSS Size

The JavaScript side of bestax-bulma is lean and tree-shakable (~49 KB min+gzip for the
_entire_ library — apps ship only the components they import) — but the **stylesheet** ships
all of Bulma plus the bestax extras, whatever your app uses. With the default `complete` flavor, that's roughly **800 KB of CSS (~82 KB gzipped)** in
a production build, essentially constant regardless of how many components you render.

That's a reasonable default — every component just works, helpers included — but if CSS weight
matters to you, this page gives you the three levers, cheapest first.

_Sizes below are the minified files shipped in the current package; expect small drift between
releases._

## Lever 1 — pick a lighter flavor (zero effort)

The [CSS variations](./variations.md) trade features for weight. If you don't use Bulma's
helper classes (bestax's helper **props** like `mt="4"` compile to them — most apps _do_ use
them), or you [pin a single color scheme](../features/css-variables.md#dark-mode--contrast),
the lighter flavors are a one-line change:

| Flavor                                       | Import                                    | Raw     | Gzip   |
| -------------------------------------------- | ----------------------------------------- | ------- | ------ |
| `complete` (default)                         | `bestax.css`                              | ~800 KB | ~82 KB |
| `no-dark-mode`                               | `versions/bestax-no-dark-mode.css`        | ~680 KB | ~70 KB |
| `no-helpers`                                 | `versions/bestax-no-helpers.css`          | ~595 KB | ~67 KB |
| `no-helpers` + `prefixed`                    | `versions/bestax-no-helpers-prefixed.css` | ~655 KB | ~69 KB |
| `prefixed` (compat, not a size optimization) | `versions/bestax-prefixed.css`            | ~875 KB | ~84 KB |

:::warning
`no-helpers` removes the classes that the **helper props** (`m`/`p`, `textAlign`,
`textColor`, `display`, …) compile to — components render, but those props do nothing. Only
pick it if your app styles without them.
:::

The `npm create bestax` scaffold's `--bulma` flag selects a flavor at project creation
(`-b no-dark-mode`, etc.).

## Lever 2 — purge unused selectors (build step, biggest win)

Most of the remaining weight is selectors your app never renders. An opt-in
[PurgeCSS](https://purgecss.com/) step removes them at build time. In a Vite app:

```bash
npm install -D @fullhuman/postcss-purgecss
```

```js title="postcss.config.js"
import purgecss from '@fullhuman/postcss-purgecss';

export default {
  plugins: [
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss({
            content: [
              './index.html',
              './src/**/*.{js,jsx,ts,tsx}',
              // bestax's static class literals (button, card, …) live in the
              // library bundle, not your source — scan it too:
              './node_modules/@allxsmith/bestax-bulma/dist/**/*.js',
            ],
            // Classes bestax assembles at runtime (helper props like mt="4"
            // → mt-4, is-active state flips, [data-theme] scheme switching)
            // never appear verbatim in any scanned file — safelist them by
            // pattern:
            safelist: {
              standard: [/^is-/, /^has-/, /^m[trblxy]?-/, /^p[trblxy]?-/],
              deep: [/data-theme/, /theme-dark/, /theme-light/],
              greedy: [/^bestax-/, /data-theme/],
            },
          }),
        ]
      : []),
  ],
};
```

Results depend entirely on how much of the framework you use — small apps commonly drop the
stylesheet by half or more. **Verify the UI after enabling it**: any class name your app
produces only at runtime that isn't matched by `content` scanning or the safelist gets
purged. Test open/active/error states and both color schemes before trusting the number.

:::tip
Keep the `safelist` patterns above as your starting point. If a style disappears in
production only, it's almost always a purged dynamic class — widen the safelist rather than
disabling the plugin.
:::

## Lever 3 — hand-rolled modular Sass (maximum control)

Compile only the Bulma modules and bestax extras partials you actually use — the
[Modular guide's Option C](./modular.md#option-c--hand-rolled-modular-scss-advanced) walks
through it. This yields the smallest honest stylesheet with no purging heuristics, at the cost
of maintaining the import list as your usage grows.

## Which lever?

- Shipping a typical app and want a quick win → **Lever 1** (`no-dark-mode` if you pinned a
  scheme).
- CSS weight is a real budget item → **Lever 2**, verified against your UI states.
- Design-system discipline and a stable component set → **Lever 3**.

## Related

- [CSS Variations](./variations.md) — what each flavor includes.
- [Modular](./modular.md) — JS tree-shaking and the three CSS loading strategies.
- [Dark Mode & Contrast](../features/css-variables.md#dark-mode--contrast) — pin the scheme
  before reaching for `no-dark-mode`.
