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
are pure stock Bulma (Hero, Level, Media, …) have **no** extras partial —
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

Every extras partial that exists, from the library's `src/scss/**/_index.scss`. The Modular
guide's Option C shows a short example and links here for the full list:

**Components** (`@allxsmith/bestax-bulma/scss/components/<name>`):
`loading`, `collapse`, `tooltip`, `popover`, `hovercard`, `contextmenu`, `dropdown`, `steps`, `sidebar`,
`toast`, `dialog`, `modal`, `carousel`, `lightbox`, `tabs`, `menu`, `tableofcontents`, `reveal`, `avatar`, `avatars`,
`badge`, `emptystate`, `timeline`, `treeview`, `scrollarea`, `command`, `datatable`,
`pagination`, `affix`, `floatbutton`, `navbar`, `panel`, `tour`

**Layout** (`@allxsmith/bestax-bulma/scss/layout/<name>`): `appframe`, `splitter`, `stack`

**Form** (`@allxsmith/bestax-bulma/scss/form/<name>`):
`checkbox`, `checkboxcard`, `radio`, `radiocard`, `switch`, `slider`, `numberinput`, `pininput`,
`rate`, `autocomplete`, `combobox`, `taginput`, `picker-popover`, `dateinput`, `timeinput`,
`datetimeinput`, `daterangeinput`, `file`, `fieldset`, `field`, `dropzone`, `colorpicker`,
`colorinput`, `passwordinput`, `treeselect`, `cascader`

**Elements** (`@allxsmith/bestax-bulma/scss/elements/<name>`): `box`, `button`, `colorswatch`,
`delete`, `descriptionlist`, `divider`, `iconbutton`, `kbd`, `linkbutton`, `loader`, `notification`,
`pre`, `progress`, `ringprogress`, `skeleton`, `stat`, `table`, `tag`

**Helpers** (`@allxsmith/bestax-bulma/scss/helpers/<name>`): `color`, `cursor`, `sizing`, `visibility`

Notes:

- The extras partial name is the component name lowercased (`Dialog` →
  `scss/components/dialog`; `NumberInput` → `scss/form/numberinput`).
- Sass names a `@use` after the last part of its URL and refuses two with the same name in one
  file. A partial that extends a stock component often shares that name with the component's
  Bulma module (`components/tabs`, `elements/notification`), so give the bestax line a name of
  its own with `as`, the way the notes below do. The name changes nothing in the compiled CSS.
- Extras `Tabs` **extends** stock Bulma tabs (it shows only the selected `Tabs.Content` panel,
  lays out the vertical variant, draws a `Tabs.Tab`'s focus ring and a disabled tab's look, moves
  Bulma's focus ring inside most `Tabs.Item` links, brings a focused toggle tab in front of its
  neighbors, and keeps the active tab marked in forced colors, where Bulma's colors for it are
  replaced), so an app using `Tabs` needs both:

  ```scss
  @use 'bulma/sass/components/tabs';
  @use '@allxsmith/bestax-bulma/scss/components/tabs' as bestax-tabs;
  ```

- The `visibility` helpers partial **extends** stock Bulma's visibility helpers: it draws
  `is-sr-only` at each breakpoint, which Bulma draws at every width only and the viewport
  visibility props write for `'sr-only'` (`visibilityTablet="sr-only"`). An app using those adds
  it, in either order with Bulma's own visibility helpers when it uses them too:

  ```scss
  @use 'bulma/sass/helpers/visibility';
  @use '@allxsmith/bestax-bulma/scss/helpers/visibility' as bestax-visibility;
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

- The `modal` partial **extends** stock Bulma modal (a modal card keeps an edge in forced colors,
  Windows' contrast themes, where Bulma's card has none and the backdrop's dark fill is
  replaced), so an app using `Modal` with a card needs both, in either order:

  ```scss
  @use 'bulma/sass/components/modal';
  @use '@allxsmith/bestax-bulma/scss/components/modal' as bestax-modal;
  ```

- The `pagination` partial **extends** stock Bulma pagination (the links' keyboard focus ring,
  which Bulma's own styles turn off, and the current page marked in forced colors, where Bulma's
  colors for it are replaced), so an app using `Pagination`, or a `DataTable` with pages, whose
  pager is one, needs both, in either order:

  ```scss
  @use 'bulma/sass/components/pagination';
  @use '@allxsmith/bestax-bulma/scss/components/pagination' as bestax-pagination;
  ```

- The `dropdown` partial **extends** stock Bulma dropdown (it draws a divider in CanvasText in
  forced colors, where Bulma's fill takes the menu's own Canvas color), so an app using
  `Dropdown`, or a `ContextMenu`, whose menu is Bulma's dropdown markup, needs both, in either
  order:

  ```scss
  @use 'bulma/sass/components/dropdown';
  @use '@allxsmith/bestax-bulma/scss/components/dropdown' as bestax-dropdown;
  ```

- The `navbar` partial **extends** stock Bulma navbar (it keeps the burger's bars in
  ButtonText and `Navbar.Divider` in CanvasText in forced colors, where Chromium paints the
  bars in the page's Canvas color and Bulma's fill takes the menu's, marks the active item there
  with a bar in the system's highlight color, where Bulma's colors for it are replaced, keeps a
  `fixed` navbar in place while an overlay locks the page's scrolling, gives an active item's
  text the invert of the link color it sits on, where Bulma's leaves it in the navbar's text
  color, draws a navbar in a colored `Hero` in the hero's colors, where Bulma's draws its active item and burger in the link
  color, and, in a build with a class prefix, draws a dropdown's active link row, other than a tab, as it draws without one,
  where Bulma's draws it as a plain row), so an app using `Navbar` needs both, in either order. `AppFrame.Burger` renders `Navbar.Burger`, so a build with one
  wants this partial too:

  ```scss
  @use 'bulma/sass/components/navbar';
  @use '@allxsmith/bestax-bulma/scss/components/navbar' as bestax-navbar;
  ```

- The `panel` partial **extends** stock Bulma panel (it keeps the heading of a panel with no
  `color` readable on the dark scheme, where Bulma writes it white on light gray, and a colored
  panel's active block and tab, their text, icon and underline, readable on both schemes, and
  keeps the panel's edge drawn and the active block and tab marked in forced colors, which drop
  Bulma's shadows and replace its colors for them), so an app using `Panel` needs both, in
  either order:

  ```scss
  @use 'bulma/sass/components/panel';
  @use '@allxsmith/bestax-bulma/scss/components/panel' as bestax-panel;
  ```

- The `file` partial **extends** stock Bulma file (File's keyboard focus ring, a file dropped on
  its button or name reaching its input, which Bulma's module draws them over, and the rounded
  corners of a boxed `hasName` File with no name to show), so an app using `File` needs both, in
  either order:

  ```scss
  @use 'bulma/sass/form/file';
  @use '@allxsmith/bestax-bulma/scss/form/file' as bestax-file;
  ```

- The `field` partial **extends** stock Bulma's field (`bulma/sass/form/tools`): it puts the
  `message` of a horizontal form component (`Input horizontal`, `Checkboxes horizontal`,
  `Rate horizontal` and the rest) under its control, where Bulma's row would set it beside, and
  keeps a horizontal label's text against its control on a right-to-left page. An app with one
  needs it next to `bulma/sass/form/tools`, in either order:

  ```scss
  @use 'bulma/sass/form/tools';
  @use '@allxsmith/bestax-bulma/scss/form/field';
  ```

- `Dropzone`'s zone is Bulma's file widget, so an app using it needs `bulma/sass/form/file` and the
  `file` partial (its keyboard focus ring) next to `scss/form/dropzone`, plus
  `bulma/sass/elements/delete` and the `delete` partial for the remove buttons and
  `bulma/sass/form/tools` for its help lines.
- `DateInput`/`TimeInput`/`DateTimeInput` also need `picker-popover`.
- `Calendar` is the pickers' calendar on the page, so it needs `dateinput`, which draws its frame
  and its months too, and no `picker-popover`.
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
- `Cascader` opens its columns in the pickers' popover, with a `Combobox` list for its search, and
  its items are Bulma's dropdown items. Its partial brings `form/combobox` with it, for the search
  and the values its items start from, so it needs `picker-popover` and
  `bulma/sass/components/dropdown` next to `cascader`, with `bulma/sass/form/input-textarea`,
  `bulma/sass/elements/delete` and `elements/delete` for the field and the clear button, and
  `bulma/sass/elements/loader`, `elements/loader` and `bulma/sass/elements/button` for a column
  that's loading or failed to load.
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
- `AppFrame.Nav rail` shows each label of its rail in a `Tooltip`, so an app with a rail needs
  `scss/components/tooltip` next to `scss/layout/appframe`, plus Menu's two partials (above),
  which set the menu's icons.
- `Tour` draws a step's Skip, Back and Next as Bulma buttons and its close button as a delete
  button, so an app using it needs `bulma/sass/elements/button`, `bulma/sass/elements/delete`
  and the `delete` partial next to `scss/components/tour`.
- `ContextMenu`'s menu is Bulma's dropdown markup, so an app using it needs
  `bulma/sass/components/dropdown` and the `dropdown` partial above next to
  `scss/components/contextmenu`.
- `Dialog` is drawn inside Bulma's modal, which makes it an overlay, with Bulma buttons for its
  actions, so an app using it needs `bulma/sass/components/modal`, `bulma/sass/elements/button`
  and the `button` partial next to `scss/components/dialog`. Without the modal module the
  dialog sits in the page's flow with no backdrop. A `Command.Dialog` is drawn inside the modal
  too, so an app with one needs it beside `scss/components/command`.
- `Lightbox`'s viewer is Bulma's modal, with Bulma buttons for its controls and a `Loader` for a
  slow image, so an app using it needs `bulma/sass/components/modal`,
  `bulma/sass/elements/button` and `bulma/sass/elements/loader` next to
  `scss/components/lightbox`, and the `delete` partial below for its close button in forced
  colors.
- `Loader` is stock Bulma styled by `bulma/sass/elements/loader`, and the `isLoading`
  spinners on `Button`, `Control` and `Select` are Bulma's too. The `loader` extras partial
  stops all of them under `prefers-reduced-motion: reduce`, hides everything inside a loading
  button where Bulma hides only the label, outlines a loading button that has keyboard focus,
  whose focus shadow Bulma takes away, and keeps each ring open in forced colors (Windows'
  contrast themes), so include it (`as bestax-loader`) next to the Bulma modules in any build
  that shows one. Its
  rules win over Bulma's either way, so the order of the two `@use` lines does not matter.
- `Progress` and the skeletons are stock Bulma too (`bulma/sass/elements/progress`,
  `bulma/sass/base/skeleton`). The `progress` and `skeleton` extras partials
  (`as bestax-progress`, `as bestax-skeleton`) stop the indeterminate bar's sweep and the
  skeleton pulse (`Skeleton`, the `skeleton` prop, `hasSkeleton`) under
  `prefers-reduced-motion: reduce`, in either order. The `progress` partial
  also keeps the bar drawn in forced colors, its fill and an edge in the text color, where
  Bulma's module leaves the whole bar the page's color. The `skeleton` partial keeps each shape
  drawn there too, in `GrayText`, with the text Bulma hides still hidden, where Bulma's module
  leaves the shape the page's color and shows that text.
- `Notification` is stock Bulma too (`bulma/sass/elements/notification`). The `notification`
  extras partial pads the end of one with a close button (`hasDelete`, or a `Delete` passed in)
  so its text clears the button, and gives a dark or light one its color's own text and
  background, and a white or black one with `isLight` the light color's text, where Bulma's module
  lets its text inherit the color around it. Include it (`as bestax-notification`) next to the
  Bulma module in any build that shows a dismissible, dark or light notification, or a white or
  black one with `isLight`. It doesn't depend on the order of the two `@use` lines either.
- `Tag` is stock Bulma too (`bulma/sass/elements/tag`). The `tag` extras partial gives a light tag,
  and a white, black or dark one with `isLight`, text that reads on its light background, where
  Bulma's module lets its text inherit the color around it, which on the dark scheme leaves it hard
  to read, sets a normal-size tag in a table cell at the bottom of its line, where Bulma's
  baseline makes the row taller than a row of text, and gives a button tag (`as="button"`,
  `isDelete`) the weight, spacing and other text a span tag takes from the text around it, where
  the browser gives a button its own. Include it (`as bestax-tag`) next to the Bulma module in any
  build that shows one of those tags, a tag in a table or a button tag. It doesn't depend on the
  order of the two `@use` lines either.
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
- `Button` is stock Bulma too (`bulma/sass/elements/button`). Bulma shows a focused button with its
  border and a shadow, which a ghost button doesn't have and a static one doesn't show, and forced
  colors (Windows' contrast themes) drops the shadow and sets the border's color, so a focused
  button can look like an unfocused one there. Forced colors also replaces a colored button's fill,
  which Bulma draws with no border, so an icon-only one shows only its glyph there. The `button`
  extras partial gives those focused buttons an outline, apart from a loading one, which the
  `loader` partial outlines, a pressed `ToggleButton`, a checked `SegmentedControl` segment and any other button with Bulma's `is-selected` the
  system's highlight colors in forced colors, where the fill that marks them is replaced, a colored
  button a 1px border in forced colors, and an outlined button the lightness Bulma picks for its
  color's text on the page where that's lighter, so a dark color reads on the dark scheme, so
  include it (`as bestax-button`) in any build that loads Bulma's button module. Its rules win over
  Bulma's either way, so the order of the `@use` lines does not matter.
- `Box` is stock Bulma (`bulma/sass/elements/box`), which draws a box's edge as a shadow with no
  border. Forced colors (Windows' contrast themes) drops every shadow and paints the box in the
  page's own color, so its edge vanishes there. The `box` extras partial draws it back as an
  outline in the system's text color, so include it (`as bestax-box`) next to Bulma's module in
  any build that shows a `Box`. Its rule wins over Bulma's either way, so the order of the `@use`
  lines does not matter.
- `Divider` renders an `<hr>`, which Bulma draws in its base (`bulma/sass/base`) as a background
  color with no border. Forced colors (Windows' contrast themes) replaces that color with the
  page's own, so the line vanishes there. The `divider` extras partial draws it as a border in the
  system's text color, so include it in any build that shows a `Divider` or an `<hr>`. Its rule
  wins over Bulma's either way, so the order of the `@use` lines does not matter, and an `<hr>`
  with a class of its own keeps its own rules.
- `Pre` is a `<pre>`, which Bulma styles in its base (`bulma/sass/base`) and scrolls sideways when a
  line runs long. While it overflows, `Pre` is a tab stop, and the `pre` extras partial draws its
  keyboard focus ring in Bulma's focus color, so include it in any build that shows a `Pre`.
  Bulma styles no focus on a `<pre>`, so the order of the `@use` lines does not matter.
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

  The `table` extras partial draws the keyboard focus ring of a responsive table's container
  (`isResponsive`), which is a tab stop while the table overflows it, in Bulma's focus color, and
  marks a selected row or cell (`Tr isSelected`, and a `DataTable`'s selected rows) with a double
  line in forced colors, where Bulma's fill for it is replaced. Include it next to the Bulma module
  in any build with a responsive table or selected rows:

  ```scss
  @use '@allxsmith/bestax-bulma/scss/elements/table' as bestax-table;
  ```

  Bulma's module sets no outline on the container or on a selected row or cell, so the order of
  the two `@use` lines does not matter.

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
// In Bulma's own order: its helpers are all !important with one class, so the
// later one wins, and is-sr-only comes after spacing, overflow and position.
@use 'bulma/sass/helpers/aspect-ratio'; // aspectRatio prop
@use 'bulma/sass/helpers/border'; // radius sizes (small/normal/large/rounded)
@use 'bulma/sass/helpers/color'; // color/backgroundColor props, has-text-*/has-background-*
@use 'bulma/sass/helpers/flexbox'; // flex* alignment props (justifyContent/alignItems/flexGrow…) — NOT display="flex"
@use 'bulma/sass/helpers/float'; // float/clearfix props
@use 'bulma/sass/helpers/gap'; // gap/columnGap/rowGap/gapless props, Grid's gap props included
@use 'bulma/sass/helpers/overflow'; // overflow/overflowX/overflowY props
@use 'bulma/sass/helpers/position'; // pos/relative/overlay props
@use 'bulma/sass/helpers/spacing'; // m*/p* props
@use 'bulma/sass/helpers/typography'; // textSize/textAlign/textTransform/textWeight/fontFamily
@use 'bulma/sass/helpers/visibility'; // display/visibility props incl. display="flex" (is-flex/is-block/is-hidden*)
@use '@allxsmith/bestax-bulma/scss/helpers/visibility' as bestax-visibility; // visibility*="sr-only" at a breakpoint (is-sr-only-tablet…)
@use 'bulma/sass/helpers/other'; // interaction, radius="radiusless", shadow="shadowless"
```

With `bulma/sass/helpers/color`, include the `color` extras partial (`as bestax-color`) too. On
the dark scheme it gives a color's text (`textColor`, `has-text-*`) the color's on-scheme
lightness wherever that's the lighter one, so a dark color such as the bestax blue primary reads
there. It doesn't depend on the order of the two `@use` lines:

```scss
@use 'bulma/sass/helpers/color';
@use '@allxsmith/bestax-bulma/scss/helpers/color' as bestax-color;
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
button, the `button` partial for the buttons' focus outline and edge in forced colors, and the
`box` partial for the boxes' edge in forced colors. Its helper
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

@use '@allxsmith/bestax-bulma/scss/elements/box' as bestax-box; // the edge in forced colors
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
