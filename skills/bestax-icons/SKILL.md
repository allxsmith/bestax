---
name: bestax-icons
description: Use icons in an app built with @allxsmith/bestax-bulma — the Icon/IconText components and the five supported libraries (Font Awesome, Material Design Icons, Ionicons, Google Material Icons, Material Symbols). Use when adding an icon, choosing or configuring the app-wide icon library, fixing an icon that renders blank, pairing icons with text, or making icons accessible (decorative vs labeled).
license: MIT
---

# Icons with @allxsmith/bestax-bulma

`Icon` renders a Bulma icon container (`span.icon`) around a glyph from any of five icon
libraries behind one normalized API. `IconText` pairs icons with text. The library ships **no
icon fonts** — the chosen library's package (or CDN script) must be installed in the app.

## Quick start

```tsx
import { ConfigProvider, Icon, IconText } from '@allxsmith/bestax-bulma';

// Set the library ONCE at the app root; <Icon> then never needs `library`.
<ConfigProvider iconLibrary="fa">
  <App />
</ConfigProvider>;

// Inside the app:
<Icon name="rocket" ariaLabel="Launch" />;
<IconText iconProps={{ name: 'star', 'aria-hidden': 'true' }}>
  Starred
</IconText>;
```

## The five libraries

| Library                | `iconLibrary` / `library` value | Name format                  | Example `name`  |
| ---------------------- | ------------------------------- | ---------------------------- | --------------- |
| Font Awesome (default) | `'fa'`                          | kebab-case, no `fa-` prefix  | `rocket`        |
| Material Design Icons  | `'mdi'`                         | kebab-case, no `mdi-` prefix | `rocket-launch` |
| Ionicons               | `'ion'`                         | kebab-case                   | `rocket`        |
| Google Material Icons  | `'material-icons'`              | snake_case (a text ligature) | `rocket_launch` |
| Material Symbols       | `'material-symbols'`            | snake_case (a text ligature) | `rocket_launch` |

⚠️ **The Ionicons value is `'ion'`, not `'ionicons'`.** The `npm create bestax` scaffold's
`--icon ionicons` flag maps to `iconLibrary="ion"` — passing `'ionicons'` to `ConfigProvider`
or `library` silently renders nothing.

**The same glyph has a different name per library** (`rocket` vs `rocket-launch` vs
`rocket_launch`). When an icon renders blank, the name format for the active library is the
first thing to check. A redundant `fa-`/`mdi-` prefix in `name` is tolerated (stripped), but
don't rely on it.

## Styling

- `size` — `'small' | 'medium' | 'large'` sizes the Bulma **container** (`is-small` ≈ 1rem,
  `is-medium` ≈ 2rem, `is-large` ≈ 3rem box). To scale the **glyph**, use `features`
  (Font Awesome `'fa-lg'`/`'fa-2x'`) or a Bulma text-size class (`'is-size-3'`).
- `variant` — per-library style: Font Awesome `solid` (default) / `regular` / `brands` /
  `light` / `duotone` / `thin`; Material Icons `filled` (default) / `outlined` / `round` /
  `sharp`; Material Symbols `outlined` (default) / `rounded` / `sharp`; Ionicons `outline` /
  `sharp`. MDI has no variants. Note Material **Icons** uses `round`, Material **Symbols**
  uses `rounded`.
- `features` — extra library classes, string or array: `'fa-spin'`, `['fa-lg', 'fa-border']`.
- Color via the helper props: `textColor="primary"`, `textColor="danger"`, etc.

## Custom node (SVG, react-icons, FontAwesome React)

`Icon` also accepts `children` instead of `name` — an inline SVG, a `react-icons` component, a
Font Awesome React `<FontAwesomeIcon>`, … — rendered in place of a class-based glyph. `name`
and `children` are mutually exclusive (the type rejects passing both, or neither). `size`,
`textColor`, `bgColor`, `ariaLabel` and `containerClassName` behave identically; `library`,
`variant`, `features` and `libraryFeatures` are ignored since there's no class-based glyph to
style.

```tsx
<Icon ariaLabel="Custom icon">
  <MyReactIconsComponent />
</Icon>
```

`IconText`'s `iconProps` / `items[].iconProps` and `Control`'s `iconLeft`/`iconRight` accept
the same escape hatch — pass a node directly (instead of an `IconProps` object) and it is
wrapped in an `Icon` for you: `<IconText iconProps={<MySvg />}>Starred</IconText>`.

`Panel.Icon` takes the same `children`, but its container is `panel-icon` rather than `icon` —
it always overrides `containerClassName`, so style and query that class instead.

⚠️ **`children` excludes `undefined`.** Write a conditional icon as `cond ? <MySvg /> : null`
(or `cond && <MySvg />`), never `cond ? <MySvg /> : undefined` — the latter is a type error,
because the renderer would fall through to the `name` path with no name. In the `IconText` and
`Control` slots a falsy node counts as "no icon": nothing is rendered, and `Control` falls back
to `iconLeftName`/`iconRightName` if one is given, otherwise leaving the icon column unreserved.

## Accessibility

Every `Icon` renders `aria-label` (default `"icon"`), set via its camelCase `ariaLabel` prop.
Only a few components declare that prop (`Icon`, `Delete`, `Slider`, `Carousel`) — everything
else takes the standard `aria-label` attribute, e.g. `<Navbar.Burger aria-label="menu" />`.

- **Meaningful icon** (stands alone, conveys information): pass a descriptive
  `ariaLabel="Delete item"`.
- **Decorative icon** (next to visible text that says the same thing, e.g. inside `IconText`
  or a labeled `Button`): hide it from screen readers with `aria-hidden`:
  `<Icon name="check" aria-hidden="true" />` — otherwise "icon" (or a duplicate label) is
  announced alongside the text.

## References

- `references/icon-libraries.md` — per-library setup (install/import/CDN), the full
  name-format and variant tables, `features` values, and the blank-icon troubleshooting list.
- `examples/icon-usage.tsx` — runnable example: ConfigProvider setup, sizes, variants,
  colors, IconText, and decorative-vs-labeled patterns.
