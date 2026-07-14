# Icon libraries — setup, names, variants, troubleshooting

Facts an agent can act on for each of the five libraries `Icon` supports. The library ships no
icon fonts: the app must install the chosen library (the `npm create bestax` scaffold's
`--icon` flag does this; in an existing app, follow Setup below).

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
  <script
    nomodule
    src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.js"
  ></script>
  ```

- **Scaffold flag:** `--icon ionicons` — which maps to `iconLibrary="ion"`. Passing
  `'ionicons'` as the `library`/`iconLibrary` value renders nothing.
- **Names:** kebab-case: `rocket`, `heart`, `settings`.
- **Variants:** `outline` and `sharp` — appended to the name (`variant="outline"` +
  `name="heart"` renders `<ion-icon name="heart-outline">`). Omit for the filled default.
- **Features:** not applicable (web component, not classes); size the container with `size`
  or style via CSS.

## Google Material Icons — `'material-icons'`

- **Setup:** `npm install material-icons` and `import 'material-icons';`.
- **Scaffold flag:** `--icon material-icons`.
- **Names:** snake_case ligature text: `home`, `rocket_launch`, `shopping_cart`. A kebab-case
  name will not match a ligature and renders as raw text.
- **Variants:** `filled` (default) / `outlined` / `round` / `sharp` — note **`round`**, not
  `rounded`.
- **Features:** Bulma classes like `'is-size-1'` (the font scales with text size).

## Material Symbols — `'material-symbols'`

- **Setup:** `npm install material-symbols` and `import 'material-symbols';`.
- **Scaffold flag:** `--icon material-symbols`.
- **Names:** snake_case ligature text, same as Material Icons: `rocket_launch`.
- **Variants:** `outlined` (default) / `rounded` / `sharp` — note **`rounded`** here vs
  Material Icons' `round`.
- **Features:** Bulma classes like `'is-size-1'`.

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

Icons inside `IconText` sit next to their visible text — mark them decorative with
`aria-hidden` (see SKILL.md's accessibility rules).
