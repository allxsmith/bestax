# Modular Sass build — component→partial mapping and procedure

Build a stylesheet containing only what the app uses, from the library's own SCSS sources.
This is the "Option C" pattern from the
[Modular guide](https://bestax.io/docs/guides/getting-started/modular#option-c--hand-rolled-modular-scss-advanced).

## Prerequisites

```sh
npm install -D sass
```

`sass` is Bulma's own compiler, dev-only. Vite compiles `.scss` out of the box — no plugin.
`bulma` is already present as a dependency of `@allxsmith/bestax-bulma`, and the library
publishes its SCSS sources (`src/scss` ships in the npm package, exposed via the
`@allxsmith/bestax-bulma/scss/*` export).

## The required base — always first

```scss
// Configure shared variables FIRST — a Sass module can only be configured on
// its first load, and every Bulma module loads utilities internally. The
// prebuilt bestax flavors set this brand primary; omit it and is-primary
// reverts to Bulma's default turquoise (verified failure mode).
@use 'bulma/sass/utilities' with (
  $primary: #1e6b99
);

// Required: reset + CSS variable definitions
@use 'bulma/sass/base';
@use 'bulma/sass/themes';
```

- `base` — minireset, generic element styles, keyframes.
- `themes` — registers the `--bulma-*` custom properties (colors, radii, schemes) and
  light/dark setup. Without it, components render unstyled-looking because every color
  resolves to nothing.
- Exception: `bulma/sass/grid/columns` and `bulma/sass/grid/grid` register their own CSS
  vars and can technically stand alone — include base + themes anyway; it is the safe
  default.

## Component → partial mapping

**Rule:** stock Bulma components map to `bulma/sass/<category>/<lowercased-name>`; bestax
extras map to `@allxsmith/bestax-bulma/scss/<category>/<lowercased-name>`. Components that
are pure stock Bulma (Button, Box, Card, Navbar, Modal, Hero, …) have **no** extras partial —
Bulma's own module is all they need.

Stock Bulma examples:

```scss
@use 'bulma/sass/elements/button'; // Button, Buttons
@use 'bulma/sass/elements/box'; // Box
@use 'bulma/sass/elements/notification'; // Notification
@use 'bulma/sass/elements/title'; // Title, SubTitle
@use 'bulma/sass/form/input'; // Input
@use 'bulma/sass/form/select'; // Select
@use 'bulma/sass/components/card'; // Card
@use 'bulma/sass/components/modal'; // Modal
@use 'bulma/sass/components/navbar'; // Navbar
@use 'bulma/sass/grid/columns'; // Columns, Column
@use 'bulma/sass/grid/grid'; // Grid, Cell
@use 'bulma/sass/layout/container'; // Container
@use 'bulma/sass/layout/section'; // Section
```

## Authoritative bestax extras inventory

Every extras partial that exists (from the library's `src/scss/**/_index.scss` — this list
is **more complete** than the docs page's Option C example, which omits several):

**Components** (`@allxsmith/bestax-bulma/scss/components/<name>`):
`loading`, `collapse`, `tooltip`, `steps`, `sidebar`, `toast`, `dialog`, `carousel`, `tabs`,
`reveal`, `avatar`, `avatars`, `badge`

**Form** (`@allxsmith/bestax-bulma/scss/form/<name>`):
`checkbox`, `radio`, `switch`, `slider`, `numberinput`, `rate`, `autocomplete`, `taginput`,
`picker-popover`, `dateinput`, `timeinput`, `datetimeinput`

**Elements** (`@allxsmith/bestax-bulma/scss/elements/<name>`): `linkbutton`

**Helpers** (`@allxsmith/bestax-bulma/scss/helpers/<name>`): `cursor`, `sizing`

Notes:

- The extras partial name is the component name lowercased (`Dialog` →
  `scss/components/dialog`; `NumberInput` → `scss/form/numberinput`).
- Extras `Tabs` **extends** stock Bulma tabs (vertical variant) — an app using `Tabs` needs
  both `bulma/sass/components/tabs` and `@allxsmith/bestax-bulma/scss/components/tabs`.
- `DateInput`/`TimeInput`/`DateTimeInput` also need `picker-popover`.
- Stock-Bulma form controls still need their Bulma module (`bulma/sass/form/…`); the extras
  form partials above style only the bestax-specific behavior.
- Bulma component modules pull their own internal sub-elements — e.g.
  `elements/notification` styles its `delete` close button itself (verified). No extra
  `@use` lines are needed for pieces rendered _inside_ a component you've already included.

## Bulma helper categories

Include a helper module **only if the app's helper props (or `className` strings) need it**:

⚠️ The `display` prop (`display="flex"`, `is-flex`, `is-block`, …) lives in **`visibility`**,
not `flexbox` — `flexbox` holds only the alignment props. Verified failure mode: omit
`visibility` and every `display="flex"` silently renders `block`.

```scss
@use 'bulma/sass/helpers/spacing'; // m*/p* props
@use 'bulma/sass/helpers/color'; // color/backgroundColor props, has-text-*/has-background-*
@use 'bulma/sass/helpers/typography'; // textSize/textAlign/textTransform/textWeight/fontFamily
@use 'bulma/sass/helpers/visibility'; // display/visibility props incl. display="flex" (is-flex/is-block/is-hidden*)
@use 'bulma/sass/helpers/flexbox'; // flex* alignment props (justifyContent/alignItems/flexGrow…) — NOT display="flex"
@use 'bulma/sass/helpers/other'; // overlay/interaction/radius/shadow/clearfix/relative…
```

## Procedure

1. **Inventory** — list every component the app imports from `@allxsmith/bestax-bulma`
   (grep the import statements; remember re-exports through local files).
2. **Map** — one `@use` line per component via the rule above; add the helper categories the
   app's helper props require; dedupe.
3. **Write `src/styles.scss`** — the `utilities` config first, then base + themes, then the
   mapped lines.
4. **Swap the import** — in `src/main.tsx`/`src/main.jsx`, replace the prebuilt CSS import
   (`bestax.css` or `versions/*.css`) with `import './styles.scss';`.
5. **Build and measure** — raw + gzip, compare against the prebuilt baseline, report the
   delta.
6. **Verify visually** — open the app; a missing partial shows up as an unstyled component,
   an omitted helper module as ignored spacing/color props. Add the missing `@use` line —
   never paper over it with custom CSS.

## Worked example — the create-bestax starter app

The `npm create bestax` starter renders `Container`, `Section`, `Columns`/`Column`, `Image`,
`Title`/`SubTitle`, `Box`, `Card`, `Buttons`/`Button`, and `Notification` — all stock Bulma,
no bestax extras. Its helper props are `display`/`justifyContent` (visibility + flexbox),
`textAlign` (typography), and `textColor` (color); it uses no spacing props. That inventory
compiles to the following — verified pixel-equivalent to the prebuilt `complete` flavor in
headless Chromium (light and dark), at 453 KB raw / 40 KB gzip vs 813 KB / 83 KB:

```scss
// src/styles.scss
@use 'bulma/sass/utilities' with (
  $primary: #1e6b99
);

@use 'bulma/sass/base';
@use 'bulma/sass/themes';

@use 'bulma/sass/elements/box';
@use 'bulma/sass/elements/button'; // Button + Buttons
@use 'bulma/sass/elements/image';
@use 'bulma/sass/elements/notification';
@use 'bulma/sass/elements/title'; // Title + SubTitle
@use 'bulma/sass/components/card';
@use 'bulma/sass/grid/columns';
@use 'bulma/sass/layout/container';
@use 'bulma/sass/layout/section';

@use 'bulma/sass/helpers/visibility'; // display="flex"
@use 'bulma/sass/helpers/flexbox'; // justifyContent/flexGrow/flexShrink
@use 'bulma/sass/helpers/typography'; // textAlign
@use 'bulma/sass/helpers/color'; // textColor
```

```tsx
// src/main.tsx — before
import '@allxsmith/bestax-bulma/bestax.css';
// after
import './styles.scss';
```

A custom class prefix is `$class-prefix` in the same `with (…)` block as `$primary`, paired
with `<ConfigProvider classPrefix="my-">` at the app root (the library's own
`src/scss/versions/*.scss` flavor builds use exactly this mechanism).
