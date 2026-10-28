# Modular Sass build — component→partial mapping and procedure

Build a stylesheet containing only what the app uses, from the library's own SCSS sources.
This is the "Option C" pattern from the
[Modular guide](https://bestax.io/docs/guides/getting-started/modular#option-c--hand-rolled-modular-scss-advanced).

## Prerequisites

```sh
# with the project's own package manager (pnpm add, yarn add) if it isn't npm
npm install bulma
npm install -D sass
```

`sass` is Bulma's own compiler, dev-only. Vite compiles `.scss` out of the box — no plugin.
`bulma` has to be a dependency of the app itself: bestax-bulma depends on it, but under pnpm's
default layout the app's Sass can only load the packages the app lists. The library
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

Bulma groups its form controls, so their modules don't follow the name: `Input` and `TextArea`
are `bulma/sass/form/input-textarea`, `Checkbox`, `Checkboxes`, `Radio` and `Radios` are
`bulma/sass/form/checkbox-radio`, and `Field` and `Control` are `bulma/sass/form/tools`.
`Select` and `File` follow the rule.

Stock Bulma examples:

```scss
@use 'bulma/sass/elements/button'; // Button, Buttons
@use 'bulma/sass/elements/box'; // Box
@use 'bulma/sass/elements/notification'; // Notification
@use 'bulma/sass/elements/title'; // Title, SubTitle
@use 'bulma/sass/form/input-textarea'; // Input, TextArea
@use 'bulma/sass/form/select'; // Select
@use 'bulma/sass/form/tools'; // Field, Control
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
`loading`, `collapse`, `tooltip`, `popover`, `hovercard`, `contextmenu`, `steps`, `sidebar`,
`toast`, `dialog`, `carousel`, `tabs`, `menu`, `reveal`, `avatar`, `avatars`, `badge`,
`emptystate`, `timeline`, `treeview`, `scrollarea`, `command`

**Layout** (`@allxsmith/bestax-bulma/scss/layout/<name>`): `splitter`

**Form** (`@allxsmith/bestax-bulma/scss/form/<name>`):
`checkbox`, `checkboxcard`, `radio`, `radiocard`, `switch`, `slider`, `numberinput`, `pininput`,
`rate`, `autocomplete`, `combobox`, `taginput`, `picker-popover`, `dateinput`, `timeinput`,
`datetimeinput`, `daterangeinput`, `file`

**Elements** (`@allxsmith/bestax-bulma/scss/elements/<name>`): `descriptionlist`, `kbd`,
`linkbutton`, `loader`, `notification`, `progress`, `ringprogress`, `skeleton`

**Helpers** (`@allxsmith/bestax-bulma/scss/helpers/<name>`): `cursor`, `sizing`

Notes:

- The extras partial name is the component name lowercased (`Dialog` →
  `scss/components/dialog`; `NumberInput` → `scss/form/numberinput`).
- Sass names a `@use` after the last part of its URL and refuses two with the same name in one
  file. A partial that extends a stock component often shares that name with the component's
  Bulma module (`components/tabs`, `elements/notification`), so give the bestax line a name of
  its own with `as`, the way the notes below do. The name changes nothing in the compiled CSS.
- Extras `Tabs` **extends** stock Bulma tabs (vertical variant), so an app using `Tabs` needs
  both:

  ```scss
  @use 'bulma/sass/components/tabs';
  @use '@allxsmith/bestax-bulma/scss/components/tabs' as bestax-tabs;
  ```

- The `menu` partial **extends** stock Bulma menu (it draws `Menu.Section`'s heading and chevron,
  and keeps the active item marked in forced colors, Windows' contrast themes), so an app using
  `Menu` needs both, in either order:

  ```scss
  @use 'bulma/sass/components/menu';
  @use '@allxsmith/bestax-bulma/scss/components/menu' as bestax-menu;
  ```

- The `file` partial **extends** stock Bulma file (File's keyboard focus ring, and the rounded
  corners of a boxed `hasName` File with no name to show), so an app using `File` needs both, in
  either order:

  ```scss
  @use 'bulma/sass/form/file';
  @use '@allxsmith/bestax-bulma/scss/form/file' as bestax-file;
  ```

- `DateInput`/`TimeInput`/`DateTimeInput` also need `picker-popover`.
- `DateRangeInput` needs `daterangeinput` for its field and `dateinput` for its calendar, and
  `picker-popover` too.
- `CheckboxCard` and `RadioCard` are Bulma cards, so an app using them needs
  `bulma/sass/components/card` next to `scss/form/checkboxcard` or `scss/form/radiocard`, and
  `bulma/sass/form/checkbox-radio` for the `Checkboxes` and `Radios` groups around them.
- `PinInput`'s boxes are Bulma inputs, so an app using it needs `bulma/sass/form/input-textarea`
  next to `scss/form/pininput`, and `bulma/sass/form/tools` for the label and help text around it.
- `Popover.Close` renders a Bulma button, so an app using it needs `bulma/sass/elements/button`
  next to `scss/components/popover`.
- `ContextMenu`'s menu is Bulma's dropdown markup, so an app using it needs
  `bulma/sass/components/dropdown` next to `scss/components/contextmenu`.
- `Loader` is stock Bulma styled by `bulma/sass/elements/loader`, and the `isLoading`
  spinners on `Button`, `Control` and `Select` are Bulma's too. The `loader` extras partial
  stops all of them under `prefers-reduced-motion: reduce`, hides everything inside a loading
  button where Bulma hides only the label, and keeps each ring open in forced colors (Windows'
  contrast themes), so include it (`as bestax-loader`) next to the Bulma modules in any build
  that shows one. Its
  rules win over Bulma's either way, so the order of the two `@use` lines does not matter.
- `Progress` and the skeletons are stock Bulma too (`bulma/sass/elements/progress`,
  `bulma/sass/base/skeleton`). The `progress` and `skeleton` extras partials
  (`as bestax-progress`, `as bestax-skeleton`) stop the indeterminate bar's sweep and the
  skeleton pulse (`Skeleton`, the `skeleton` prop, `hasSkeleton`) under
  `prefers-reduced-motion: reduce`, the same way and in either order.
- `Notification` is stock Bulma too (`bulma/sass/elements/notification`). The `notification`
  extras partial pads the end of one with a close button (`hasDelete`, or a `Delete` passed in)
  so its text clears the button, so include it (`as bestax-notification`) next to the Bulma
  module in any build that shows a dismissible notification. It doesn't depend on the order of
  the two `@use` lines either.
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
@use 'bulma/sass/helpers/gap'; // gap/columnGap/rowGap/gapless props, Grid's gap props included
@use 'bulma/sass/helpers/color'; // color/backgroundColor props, has-text-*/has-background-*
@use 'bulma/sass/helpers/typography'; // textSize/textAlign/textTransform/textWeight/fontFamily
@use 'bulma/sass/helpers/visibility'; // display/visibility props incl. display="flex" (is-flex/is-block/is-hidden*)
@use 'bulma/sass/helpers/flexbox'; // flex* alignment props (justifyContent/alignItems/flexGrow…) — NOT display="flex"
@use 'bulma/sass/helpers/float'; // float/clearfix props
@use 'bulma/sass/helpers/overflow'; // overflow/overflowX/overflowY props
@use 'bulma/sass/helpers/position'; // pos/relative/overlay props
@use 'bulma/sass/helpers/border'; // radius sizes (small/normal/large/rounded)
@use 'bulma/sass/helpers/aspect-ratio'; // aspectRatio prop
@use 'bulma/sass/helpers/other'; // interaction, radius="radiusless", shadow="shadowless"
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
`Title`/`SubTitle`, `Box`, `Card`, `Buttons`/`Button`, and `Notification` with its close
button: all stock Bulma, plus the `notification` extras partial for that close button. Its
helper props are `display` (visibility), `flexGrow` (flexbox), and `textAlign` (typography);
it uses no spacing or color props. That inventory compiles to the following, verified
pixel-equivalent to the prebuilt `complete` flavor in headless Chromium (light and dark, phone
and desktop width, notification open), at 274 KB raw / 30 KB gzip vs 819 KB / 84 KB.
Scaffolded with an icon library, the starter also needs `bulma/sass/elements/icon` for its
`IconText` card titles:

```scss
// src/styles.scss
@use 'bulma/sass/utilities' with (
  $primary: #1e6b99
);

@use 'bulma/sass/base';
@use 'bulma/sass/themes';

@use 'bulma/sass/elements/box';
@use 'bulma/sass/elements/button'; // Button + Buttons
@use 'bulma/sass/elements/delete'; // Notification's close button
@use 'bulma/sass/elements/image';
@use 'bulma/sass/elements/notification';
@use 'bulma/sass/elements/title'; // Title + SubTitle
@use 'bulma/sass/components/card';
@use 'bulma/sass/grid/columns';
@use 'bulma/sass/layout/container';
@use 'bulma/sass/layout/section';

@use 'bulma/sass/helpers/visibility'; // display="flex"
@use 'bulma/sass/helpers/flexbox'; // flexGrow
@use 'bulma/sass/helpers/typography'; // textAlign

@use '@allxsmith/bestax-bulma/scss/elements/notification' as bestax-notification; // text clears the close button
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
