# Icon libraries — setup, names, variants, troubleshooting

Facts an agent can act on for each of the five libraries `Icon` supports. The library ships no
icon fonts: the app must install the chosen library (the `npm create bestax` scaffold's
`--icon` flag wires it in; in an existing app, follow Setup below).

## How `Icon` renders

- `fa` / `mdi` — an `<i>` with CSS classes (`fas fa-rocket`, `mdi mdi-rocket-launch`).
- `material-icons` / `material-symbols` — an `<i>` whose **text content** is the name
  (a font ligature): `<i class="material-icons">rocket_launch</i>`. That's why these names are
  snake_case — they are literal text, not class names.
- `ion` — the `<ion-icon>` web component: `<ion-icon name="rocket-outline" />`.

The resolution order for the library is `library` prop → `ConfigProvider iconLibrary` → `'fa'`.
Set it once on `ConfigProvider` and omit `library` everywhere else.

## Font Awesome — `'fa'` (the default)

- **Setup:** `npm install @fortawesome/fontawesome-free` and
  `import '@fortawesome/fontawesome-free/css/all.min.css';` once (e.g. `main.tsx`).
- **Scaffold flag:** `--icon fontawesome`.
- **Names:** kebab-case without the `fa-` prefix: `rocket`, `circle-check`, `magnifying-glass`.
  A leading `fa-` in `name` is stripped automatically (so `fa-rocket` also works), but write
  the bare name.
- **Variants** (`variant` → class): `solid` → `fas` (default), `regular` → `far`, `brands` →
  `fab`, `light` → `fal`, `duotone` → `fad`, `thin` → `fat`. The free package includes only
  solid, regular (partial), and brands — light/duotone/thin need a Font Awesome Pro kit.
- **Features:** Font Awesome utility classes — `'fa-lg'`, `'fa-2x'`…`'fa-10x'`, `'fa-spin'`,
  `'fa-pulse'`, `'fa-border'`, `'fa-fw'`, `'fa-flip-horizontal'`, `'fa-rotate-90'`.
- Brand icons **require** `variant="brands"`: `<Icon name="github" variant="brands" />`.

## Material Design Icons — `'mdi'`

- **Setup:** `npm install @mdi/font` and
  `import '@mdi/font/css/materialdesignicons.min.css';`.
- **Scaffold flag:** `--icon mdi`.
- **Names:** kebab-case without the `mdi-` prefix: `account`, `rocket-launch`,
  `home-outline`. A leading `mdi-` is stripped automatically. Outline/off styles are part of
  the **name** (`home-outline`, `bell-off`), not a variant.
- **Variants:** none — `variant` is ignored for MDI.
- **Features:** MDI helpers (`'mdi-24px'`, `'mdi-48px'`, `'mdi-spin'`, `'mdi-rotate-90'`) or
  Bulma text-size classes (`'is-size-3'`).

## Ionicons — `'ion'` ⚠️ value is `ion`, not `ionicons`

- **Setup:** a CDN script pair in `index.html` (no npm package — it registers the
  `<ion-icon>` web component):

  ```html
  <script
    type="module"
    src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.esm.js"
  ></script>
  ```

  Ionicons v8 is ESM-only — there is no legacy `nomodule` bundle, so a single
  `type="module"` tag is all that is needed.

- **Scaffold flag:** `--icon ionicons` — which maps to `iconLibrary="ion"`. Passing
  `'ionicons'` as the `library`/`iconLibrary` value renders nothing.
- **Names:** kebab-case: `rocket`, `heart`, `settings`.
- **Variants:** `outline` and `sharp` — appended to the name (`variant="outline"` +
  `name="heart"` renders `<ion-icon name="heart-outline">`). Omit for the filled default.
- **Features:** not applicable (web component, not classes); size the container with `size`
  or style via CSS.

## Google Material Icons — `'material-icons'`

- **Setup:** `npm install material-icons` and `import 'material-icons/iconfont/filled.css';`, the
  style `Icon` renders by default. Add `outlined.css`, `round.css`, `sharp.css` or `two-tone.css`
  from `material-icons/iconfont/` for those variants; the bare `import 'material-icons';` loads
  all five fonts.
- **Scaffold flag:** `--icon material-icons` (imports `filled.css` only).
- **Names:** snake_case ligature text: `home`, `rocket_launch`, `shopping_cart`. A kebab-case
  name will not match a ligature and renders as raw text.
- **Variants:** `filled` (default) / `outlined` / `round` / `sharp` — note **`round`**, not
  `rounded`.
- **Features:** Bulma classes like `'is-size-1'` (the font scales with text size).

## Material Symbols — `'material-symbols'`

- **Setup:** `npm install material-symbols` and `import 'material-symbols/outlined.css';`, the
  style `Icon` renders by default. Add `rounded.css` or `sharp.css` for those variants; the bare
  `import 'material-symbols';` loads all three fonts.
- **Scaffold flag:** `--icon material-symbols` (imports `outlined.css` only).
- **Names:** snake_case ligature text, same as Material Icons: `rocket_launch`.
- **Variants:** `outlined` (default) / `rounded` / `sharp` — note **`rounded`** here vs
  Material Icons' `round`.
- **Features:** Bulma classes like `'is-size-1'`.

### Making the font smaller

`outlined.css` loads the whole variable font (every symbol at every fill, weight, grade and
optical size), several megabytes however few icons the app shows. Keep that import as the
default: it is one line, works offline, and any name renders. Offer a smaller font only when
the user cares about download size (a size budget, a Lighthouse flag, slow networks), and
present it as an optimisation with the trade-offs below:

- **One stylesheet per style rendered.** If the app has the bare `import 'material-symbols';`,
  replace it with `outlined.css`, adding `rounded.css` or `sharp.css` only where a `variant`
  uses them. The bare import ships every style's font in the build (a browser fetches each one
  only when a page renders it). This is where the scaffold already stands, and the style left
  is still the whole variable font, which the options below shrink.
- **Google Fonts subset.** Replace the import with a stylesheet link in `index.html`:
  `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=home,palette,settings&display=block" />`.
  `icon_names` takes the ligature names comma-separated and sorted alphabetically, and keep
  `&display=block` (it stops the names flashing as text). The returned CSS defines the same
  `material-symbols-outlined` class, so components don't change. Costs: the browser fetches
  the icons from Google (privacy, no offline use), and the list must hold every name the app
  renders, since a missing one shows as plain text. `variant="rounded"`/`"sharp"` need
  `Material+Symbols+Rounded`/`Material+Symbols+Sharp` requested too, and an app that sets
  `font-variation-settings` must request those axes in the URL.
- **Self-hosted subset.** Cut a subset from the package's `.woff2` with a font subsetting tool
  (fontTools' subsetter, for one), keeping the glyphs for the names the app renders, and load
  it with the app's own `@font-face` plus the `.material-symbols-outlined` rules. No request to
  Google, same list upkeep.
- **Fewer variations.** `@material-symbols/font-400`, from the same project, keeps every
  symbol with weight, grade and optical size fixed, at a fraction of the size. Import
  `@material-symbols/font-400/outlined.css` in place of `material-symbols/outlined.css`; it
  defines the same class, and there is no list to maintain.

Docs: https://bestax.io/docs/guides/getting-started/alternative-icons#making-the-font-smaller

## One glyph, five names

| Glyph    | fa                 | mdi             | ion        | material-icons / material-symbols |
| -------- | ------------------ | --------------- | ---------- | --------------------------------- |
| Rocket   | `rocket`           | `rocket-launch` | `rocket`   | `rocket_launch`                   |
| Home     | `house` / `home`   | `home`          | `home`     | `home`                            |
| Settings | `gear`             | `cog`           | `settings` | `settings`                        |
| Search   | `magnifying-glass` | `magnify`       | `search`   | `search`                          |

## Blank icon? Check in this order

1. **Library value** — `'ion'` not `'ionicons'`; the five valid values are `fa`, `mdi`,
   `ion`, `material-icons`, `material-symbols`.
2. **Name format for that library** — kebab vs snake_case (see the table above); for
   material-* a wrong name renders as literal text instead of a glyph.
3. **The library's CSS/script is actually loaded** — the import in `main.tsx` (or the
   Ionicons scripts in `index.html`) must exist; bestax ships none of them.
4. **Variant availability** — Font Awesome free has no `light`/`duotone`/`thin`; brand
   glyphs need `variant="brands"`.

## IconText

Pairs icon(s) with text inside a Bulma `icon-text` container. Single icon:

```tsx
<IconText iconProps={{ name: 'check', 'aria-hidden': 'true' }}>Saved</IconText>
```

Multiple segments via `items`:

```tsx
<IconText
  items={[
    { iconProps: { name: 'train', 'aria-hidden': 'true' }, text: 'Metro' },
    {
      iconProps: { name: 'arrow-right', 'aria-hidden': 'true' },
      text: 'Airport',
    },
  ]}
/>
```

Icons inside `IconText` sit next to their visible text, so leave them decorative: no
`ariaLabel`, or an explicit `aria-hidden` (see SKILL.md's accessibility rules).
