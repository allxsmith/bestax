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
are pure stock Bulma (Box, Card, Modal, Hero, …) have **no** extras partial —
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
`toast`, `dialog`, `carousel`, `lightbox`, `tabs`, `menu`, `tableofcontents`, `reveal`, `avatar`, `avatars`,
`badge`, `emptystate`, `timeline`, `treeview`, `scrollarea`, `command`, `datatable`,
`pagination`, `affix`, `navbar`

**Layout** (`@allxsmith/bestax-bulma/scss/layout/<name>`): `appframe`, `splitter`, `stack`

**Form** (`@allxsmith/bestax-bulma/scss/form/<name>`):
`checkbox`, `checkboxcard`, `radio`, `radiocard`, `switch`, `slider`, `numberinput`, `pininput`,
`rate`, `autocomplete`, `combobox`, `taginput`, `picker-popover`, `dateinput`, `timeinput`,
`datetimeinput`, `daterangeinput`, `file`, `fieldset`, `field`, `dropzone`, `colorpicker`,
`colorinput`, `passwordinput`, `treeselect`

**Elements** (`@allxsmith/bestax-bulma/scss/elements/<name>`): `button`, `colorswatch`,
`delete`, `descriptionlist`, `iconbutton`, `kbd`, `linkbutton`, `loader`, `notification`,
`progress`, `ringprogress`, `skeleton`, `stat`

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
  starts each item's text at the right on a right-to-left page, and keeps the active item marked
  in forced colors, Windows' contrast themes), so an app using
  `Menu`, or a `TableOfContents`, which renders one, needs both, in either order, and the
  `tableofcontents` partial for the latter:

  ```scss
  @use 'bulma/sass/components/menu';
  @use '@allxsmith/bestax-bulma/scss/components/menu' as bestax-menu;
  @use '@allxsmith/bestax-bulma/scss/components/tableofcontents'; // TableOfContents only
  ```

- The `pagination` partial **extends** stock Bulma pagination (the links' keyboard focus ring,
  which Bulma's own styles turn off, and the current page marked in forced colors, where Bulma's
  colors for it are replaced), so an app using `Pagination`, or a `DataTable` with pages, whose
  pager is one, needs both, in either order:

  ```scss
  @use 'bulma/sass/components/pagination';
  @use '@allxsmith/bestax-bulma/scss/components/pagination' as bestax-pagination;
  ```

- The `navbar` partial **extends** stock Bulma navbar (it keeps the burger's bars in
  ButtonText in forced colors, where Chromium paints them in the page's Canvas color, and keeps a
  `fixed` navbar in place while an overlay locks the page's scrolling), so an app using `Navbar`
  needs both, in either order. `AppFrame.Burger` renders `Navbar.Burger`, so a build with one
  wants this partial too:

  ```scss
  @use 'bulma/sass/components/navbar';
  @use '@allxsmith/bestax-bulma/scss/components/navbar' as bestax-navbar;
  ```

- The `file` partial **extends** stock Bulma file (File's keyboard focus ring, and the rounded
  corners of a boxed `hasName` File with no name to show), so an app using `File` needs both, in
  either order:

  ```scss
  @use 'bulma/sass/form/file';
  @use '@allxsmith/bestax-bulma/scss/form/file' as bestax-file;
  ```

- The `field` partial **extends** stock Bulma's field (`bulma/sass/form/tools`): it puts the
  `message` of a horizontal form component (`Input horizontal`, `Checkboxes horizontal`,
  `Rate horizontal` and the rest) under its control, where Bulma's row would set it beside. An
  app with one needs it next to `bulma/sass/form/tools`, in either order:

  ```scss
  @use 'bulma/sass/form/tools';
  @use '@allxsmith/bestax-bulma/scss/form/field';
  ```

- `Dropzone`'s zone is Bulma's file widget, so an app using it needs `bulma/sass/form/file` and the
  `file` partial (its keyboard focus ring) next to `scss/form/dropzone`, plus
  `bulma/sass/elements/delete` and the `delete` partial for the remove buttons and
  `bulma/sass/form/tools` for its help lines.
- `DateInput`/`TimeInput`/`DateTimeInput` also need `picker-popover`.
- `DateRangeInput` needs `daterangeinput` for its field and `dateinput` for its calendar, and
  `picker-popover` too.
- `CheckboxCard` and `RadioCard` are Bulma cards, so an app using them needs
  `bulma/sass/components/card` next to `scss/form/checkboxcard` or `scss/form/radiocard`, and
  `bulma/sass/form/checkbox-radio` for the `Checkboxes` and `Radios` groups around them.
- `ColorPicker` draws its swatches and its preview with `ColorSwatch`, and its value field and eye
  dropper button are Bulma's, so an app using it needs `scss/elements/colorswatch`,
  `bulma/sass/form/input-textarea` and `bulma/sass/elements/button` next to
  `scss/form/colorpicker`, and `bulma/sass/form/tools` for the label and help text around it.
- `ColorInput` opens a `ColorPicker` in the pickers' popover, so it needs `colorpicker` (and what
  that needs) and `picker-popover` next to `colorinput`.
- `PasswordInput` lays its button over a Bulma input, so an app using it needs
  `bulma/sass/form/input-textarea` next to `scss/form/passwordinput`, and `bulma/sass/form/tools`
  for the label and help text around it.
- `TreeSelect` opens a `TreeView` in the pickers' popover, so it needs `components/treeview`,
  `form/checkbox` for its boxes and `picker-popover` next to `treeselect`, with
  `bulma/sass/form/input-textarea`, `bulma/sass/elements/tag`, `bulma/sass/elements/delete` and
  `elements/delete` for the field, the tags and the clear button.
- `PinInput`'s boxes are Bulma inputs, so an app using it needs `bulma/sass/form/input-textarea`
  next to `scss/form/pininput`, and `bulma/sass/form/tools` for the label and help text around it.
- `Popover.Close` renders a Bulma button, so an app using it needs `bulma/sass/elements/button`
  next to `scss/components/popover`.
- `IconButton` is a Bulma button holding an icon, so an app using it needs
  `bulma/sass/elements/button` and `bulma/sass/elements/icon`. The `iconbutton` partial makes a
  rounded one a circle, where Bulma's `is-rounded` gives a pill, and keeps the `text` and `ghost`
  looks from underlining the glyph. Its rules win over Bulma's either way, so the order of the
  `@use` lines does not matter.
- `CopyButton` is a Bulma button holding an icon and a label, with no partial of its own, so an app
  using it needs `bulma/sass/elements/button` and `bulma/sass/elements/icon`. With
  `showLabel={false}` it's an `IconButton`, so add `iconbutton` for a rounded one to be a circle.
- `ContextMenu`'s menu is Bulma's dropdown markup, so an app using it needs
  `bulma/sass/components/dropdown` next to `scss/components/contextmenu`.
- `Lightbox`'s viewer is Bulma's modal, with Bulma buttons for its controls and a `Loader` for a
  slow image, so an app using it needs `bulma/sass/components/modal`,
  `bulma/sass/elements/button` and `bulma/sass/elements/loader` next to
  `scss/components/lightbox`, and the `delete` partial below for its close button in forced
  colors.
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
- `Delete` is stock Bulma too, and it's the close button of `Notification`, `Message`, `Toast`, a
  `Modal` card, `AppFrame`'s drawer and the tags of `Taginput`, `Combobox`, `Dropzone` and
  `TreeSelect`. Bulma draws it in `bulma/sass/elements/delete`, and the modules of the components
  it sits in don't, so a build that shows one needs that module next to theirs. Without it the
  button doesn't show, though it still takes keyboard focus. The `Modal`'s floating close is the
  exception, since `bulma/sass/components/modal` draws that one itself. Bulma draws the circle and
  cross as background colors, which forced colors (Windows' contrast themes) replaces, so they
  vanish there. The `delete` extras partial keeps them drawn in the system's button colors, and
  the `Modal`'s floating close and `Tag isDelete` (`bulma/sass/elements/tag`) with them, so
  include it (`as bestax-delete`) in any build that shows a close button. Its rules win over
  Bulma's either way, so the order of the `@use` lines does not matter.
- `Button` is stock Bulma too (`bulma/sass/elements/button`). Bulma shows a focused button with
  its border and a shadow, which a ghost button doesn't have, and forced colors (Windows'
  contrast themes) drops the shadow and sets the border's color, so a focused button can look
  like an unfocused one there. Forced colors also replaces a colored button's fill, which Bulma
  draws with no border, so an icon-only one shows only its glyph there. The `button` extras
  partial gives those focused buttons an outline, and a colored button a 1px border in forced
  colors, so include it (`as bestax-button`) in any build that loads Bulma's button module. Its
  rules win over Bulma's either way, so the order of the `@use` lines does not matter.
- `Stats` lays its row out on Bulma's smart grid (`.grid` and `is-col-min-*`), so a build with a
  `Stats` row wants `bulma/sass/grid/grid` beside the `stat` partial, which only resets the row's
  margins.
- `Table` is stock Bulma (`bulma/sass/elements/table`), and `DataTable` renders one. The prebuilt
  stylesheets build it with `$table-cell-text-align: start`, so header cells line up with the
  body cells under them on a right-to-left page, where Bulma's default, `left`, keeps them on the
  left. A build with a table gets the same by configuring the module where it loads it:

  ```scss
  @use 'bulma/sass/elements/table' with (
    $table-cell-text-align: start
  );
  ```

- Stock-Bulma form controls still need their Bulma module (`bulma/sass/form/…`); the extras
  form partials above style only the bestax-specific behavior.
- Bulma's module for a component doesn't always style what bestax renders inside it. A close
  button is the common case: it needs `bulma/sass/elements/delete` and the `delete` partial, as
  the `Delete` note above says.

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
button: all stock Bulma, plus the `notification` and `delete` extras partials for that close
button and the `button` partial for the buttons' focus outline and edge in forced colors. Its helper
props are `display` (visibility), `flexGrow` (flexbox), and `textAlign` (typography);
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

@use '@allxsmith/bestax-bulma/scss/elements/button' as bestax-button; // focus outline and edge in forced colors
@use '@allxsmith/bestax-bulma/scss/elements/delete' as bestax-delete; // the close button in forced colors
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
