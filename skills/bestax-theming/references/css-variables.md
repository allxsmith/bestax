# Bulma CSS variables & override mechanisms

`@allxsmith/bestax-bulma` wraps **Bulma 1.x**, which is themed entirely through `--bulma-*` CSS
custom properties. Every color, font, size, and radius resolves from one of these variables, so
theming means overriding the right `--bulma-*` values.

## How to override (three paths)

### 1. The `Theme` component (runtime, recommended)

`Theme` is exported from the package and writes `--bulma-*` variables for you.

- `isRoot` → injects the variables globally at `:root` (use once, at the app root). It writes
  them before the browser paints what it rendered, so an app rendered in the browser has them
  from its first frame of content. A server render doesn't include them, so a server-rendered
  page paints with the stylesheet's values until it hydrates: put what it needs from its first
  paint in CSS (path 2).
- without `isRoot` → wraps children in a `<div>` and scopes the variables to that subtree.
- Named props set the color/scheme HSL channels and common values (see "Theme props" below).
- `bulmaVars` sets any other variable, keyed by its real `--bulma-*` name. It only changes
  variables the component inherits, though: see "Component variables" below for the ones Bulma
  declares on the component itself.

```tsx
<Theme
  isRoot
  primaryH="265"
  primaryS="65%"
  primaryL="55%"
  bulmaVars={{
    '--bulma-radius': '0.75rem',
    '--bulma-family-primary': "'Inter', sans-serif",
  }}
>
  <App />
</Theme>
```

> Note: the type of the `bulmaVars` keys is not exported — pass it as an object literal (TypeScript
> still checks the keys against the allowed `--bulma-*` names).

> `--bulma-family-*` only selects the family — also load the font itself (a `<link>` in
> `index.html` or an `@fontsource/*` package import), or the browser silently falls back to
> the system font.

### 2. Plain CSS

Set the variables yourself on any selector. `:root` themes the whole document; a class scopes it.

```css
:root {
  --bulma-primary-h: 265;
  --bulma-primary-s: 65%;
  --bulma-primary-l: 55%;
  --bulma-radius: 0.75rem;
}
```

### 3. Build-time Sass

If compiling Bulma's Sass yourself, set the SCSS variables before the CSS variables are generated:

```scss
@use 'bulma/sass' with (
  $primary: #1e6b99,
  $link: #485fc7
);
```

(The library itself ships `$primary: #1e6b99` — HSL `202 / 67% / 36%` — this way.)

## Colors — override the H/S/L trio to recolor

Each color is three channels. For each color `<c>` ∈ `primary`, `link`, `info`, `success`,
`warning`, `danger`:

| Variable        | Meaning                    | `Theme` prop             |
| --------------- | -------------------------- | ------------------------ |
| `--bulma-<c>-h` | hue (unitless, e.g. `265`) | `<c>H` (e.g. `primaryH`) |
| `--bulma-<c>-s` | saturation (`%`)           | `<c>S`                   |
| `--bulma-<c>-l` | lightness (`%`)            | `<c>L`                   |

What a runtime trio moves: `--bulma-<c>`, the color itself, follows all three channels. Its
shades, its light and dark variants, and its invert and on-scheme colors follow the hue and
saturation, each at a lightness Bulma's Sass build wrote into the stylesheet for the color it was
given:

- the numeric shades `--bulma-<c>-00` … `--bulma-<c>-100` sit on a ramp of lightnesses
  (`--bulma-<c>-<n>-l`) laid out from the built color's own, and `--bulma-<c>-light` and
  `--bulma-<c>-dark` point into it. A new `-l` moves none of them, so a shade is as light as it
  was before; only a Sass build lays the ramp out from a new color.
- `--bulma-<c>-invert` and `--bulma-<c>-on-scheme` take the lightnesses below, which the build
  picked for contrast.

`--bulma-<c>-rgb` is the built color written out as a value, so it follows none of the trio.

### The lightnesses Bulma's build picks for contrast

The build picks the label and text lightnesses for each color by their contrast with the color it
was given. A trio set at runtime leaves them as they were, so when a new color reads lighter or
darker than the built one, which a change of hue or saturation can do as well as a change of
lightness, set them too:

| Variable                  | What reads it                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--bulma-<c>-invert-l`    | the label on a solid `<c>` surface: `Button`, `Tag` and `Notification` with `color="<c>"`, a colored `Hero` or `Navbar`, …   |
| `--bulma-<c>-on-scheme-l` | `<c>` text on the page: `textColor="<c>" colorShade="on-scheme"`, a colored `Message`'s body, a field's colored help text, … |

For `link`, the on-scheme lightness is also every link on the page (`--bulma-link-text`), so a new
link color that reads lighter than Bulma's own leaves the page's links pale.

bestax's stylesheet builds its primary from a dark blue, so the primary's invert is white
(`var(--bulma-primary-100-l)`). A light primary set through the trio alone keeps those white
labels: on stock Bulma's turquoise they read at under 2:1. Its on-scheme lightness was picked for
the blue too, and is too light for turquoise text on a white page. The other colors are built
from Bulma's own defaults. For a page made for stock Bulma, the bestax-migrate skill's
`references/css-migration.md` covers getting its turquoise back.

Set them alongside the trio, through `Theme`'s `bulmaVars` or in your CSS:

- **The invert** is one value for both schemes. Point it at a shade that reads on the new color: a
  near-black `var(--bulma-<c>-05-l)` on a light color, a near-white `var(--bulma-<c>-100-l)` on a
  dark one.
- **The on-scheme lightness** has to read on the page's background, so Bulma gives each scheme
  its own. One value applies in both schemes, so give each scheme its own: on an `isRoot`
  `Theme`, the on-scheme keys of `bulmaVars` take `{ light, dark }`, and `Theme` writes each
  where Bulma's own value for that scheme applies. A scheme you leave out keeps the
  stylesheet's value. `bestax-no-dark-mode.css` has no dark scheme, so with it give one string.

```tsx
// Stock Bulma's turquoise, with the values from bulma/css/bulma.css.
<Theme
  isRoot
  primaryH="171deg"
  primaryS="100%"
  primaryL="41%"
  bulmaVars={{
    '--bulma-primary-invert-l': 'var(--bulma-primary-05-l)',
    '--bulma-primary-on-scheme-l': { light: '21%', dark: '41%' },
  }}
>
  <App />
</Theme>
```

A scoped `Theme` writes its variables as an inline style, which can't hold a value per scheme, so
there the on-scheme lightness takes only a string, and `{ light, dark }` is skipped with a warning
in development. Set it in your CSS instead when a scoped section needs one per scheme, or when
the page is rendered on the server, which paints before `Theme` runs. In CSS, loaded after the
library's styles, a value on `:root` wins in both schemes, so give dark mode its own value on
both of its paths:

```css
/* Stock Bulma's turquoise, with the values from bulma/css/bulma.css. */
:root {
  --bulma-primary-h: 171deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 41%;
  --bulma-primary-invert-l: var(--bulma-primary-05-l);
  --bulma-primary-on-scheme-l: 21%;
}
[data-theme='dark'] {
  --bulma-primary-on-scheme-l: 41%;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --bulma-primary-on-scheme-l: 41%;
  }
}
```

For a color of your own, pick each value by its contrast (4.5:1 or more for text), or build
Bulma's Sass with the color (`@use 'bulma/sass' with ($primary: …)`), which computes both.

`textColor="<c>"` alone renders `has-text-<c>`, which reads the trio's own lightness, so text in a
light color on a light page takes `colorShade="on-scheme"` as well.

The build pairs each numbered shade, and the light and dark variants, with a label shade the same
way (`--bulma-<c>-<n>-invert-l`, `--bulma-<c>-light-invert-l`, `--bulma-<c>-dark-invert-l`),
picked for the hue and saturation it was given. After a change of hue, check the contrast of text
you put on a numbered shade.

## Scheme, text, background, border (light/dark surfaces)

| Variable                                                                          | Role                                                                                                                                                       |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bulma-scheme-h`, `--bulma-scheme-s`                                            | scheme hue/saturation (`Theme`: `schemeH`, `schemeS`)                                                                                                      |
| `--bulma-scheme-main`, `--bulma-scheme-main-bis`, `--bulma-scheme-main-ter`       | page/surface backgrounds (main + subtle steps); `Theme bulmaVars`-overridable, and the scheme `bgColor` values render them inline                          |
| `--bulma-scheme-invert`, `--bulma-scheme-invert-bis`, `--bulma-scheme-invert-ter` | inverted scheme surfaces; `Theme bulmaVars`-overridable, and the scheme `bgColor` values render them inline (pair with a foreground — see the color guide) |
| `--bulma-background`                                                              | secondary background                                                                                                                                       |
| `--bulma-text`, `--bulma-text-strong`, `--bulma-text-weak`                        | body / emphasized / muted text                                                                                                                             |
| `--bulma-border`, `--bulma-border-weak`                                           | borders                                                                                                                                                    |

## Radius, typography

| Variable                                                                      | Default                           | `Theme` prop                    |
| ----------------------------------------------------------------------------- | --------------------------------- | ------------------------------- |
| `--bulma-radius-small` / `--bulma-radius` / `--bulma-radius-large`            | 0.25 / 0.375 / 0.75rem            | via `bulmaVars`                 |
| `--bulma-radius-rounded`                                                      | 9999px                            | via `bulmaVars`                 |
| `--bulma-family-primary` / `--bulma-family-secondary` / `--bulma-family-code` | sans / sans / mono                | via `bulmaVars`                 |
| `--bulma-size-1` … `--bulma-size-7`                                           | 3rem … 0.75rem                    | CSS only, not a `bulmaVars` key |
| `--bulma-size-small` / `-normal` / `-medium` / `-large`                       | 0.75 / 1 / 1.25 / 1.5rem          | via `bulmaVars`                 |
| `--bulma-weight-light/normal/medium/semibold/bold/extrabold`                  | 300 / 400 / 500 / 600 / 700 / 800 | via `bulmaVars`                 |

## Component variables: set them on the component, not on `Theme`

A custom property set on an ancestor only reaches an element that declares no value of its own.
Bulma declares the scheme, color, typography, radius and spacing tokens on `:root`, so `Theme`
(scoped or `isRoot`) and plain `:root` CSS both work for them. Some of those Bulma also declares
again on one component, which keeps its own value while everything else takes yours; that
component's API page lists the variable as declared on it, and `Theme` doesn't warn about these.
To change that one component too, set the variable on it as described below.

Bulma's per-component variables (`--bulma-card-radius`, `--bulma-tag-h`,
`--bulma-delete-dimensions`, …) are declared on the component's own element instead (`.card`,
`.tag`, `.delete`), so a value set on any ancestor, including `Theme`'s `bulmaVars`, always loses
and nothing changes. `bulmaVars` still accepts those keys, and `Theme` logs a development warning
naming them.

Set a component variable on the component itself: in your CSS on its own class, loaded after
the library styles (mind the class prefix), e.g. `.card { --bulma-card-radius: 1.5rem; }`, on a
class you pass through `className`, or with the component's `style` prop. A size or color
modifier can declare the variable again on a more specific selector (`.delete.is-small`), which a
lone class loses to and `style` does not. Each component's API page lists its variables under
**CSS & Sass Variables** and says where Bulma declares them; the extras below follow the same
rule.

## Shadow — override the upstream token, not the derived one

`--bulma-shadow` (plus its `--bulma-shadow-h`/`-s`/`-l` channels) is a real Bulma variable that
`.box`, `.card`, `.dropdown`, and `.panel` each derive their own shadow variable from
(`--bulma-box-shadow`, `--bulma-card-shadow`, …). It **is** a key of `bulmaVars`, so `Theme` can
set it directly:

```tsx
<Theme bulmaVars={{ '--bulma-shadow': '0 0 0 2px var(--bulma-primary)' }}>
  <Box>featured</Box>
</Theme>
```

There is no individual `shadow` prop for it — `shadow` already names the unrelated
`shadowless` helper class (`shadow="shadowless"` → `is-shadowless`) — so reach it through
`bulmaVars` as shown above.

Do **not** reach for `--bulma-box-shadow`/`--bulma-card-shadow` from an ancestor instead —
those are re-declared on `.box`/`.card` themselves, so an inherited value always loses. Setting
`--bulma-shadow` from an ancestor `Theme` is the one override that cascades into all of them
(the same rule as the extras section below).

## Extras component variables

Every "Beyond Bulma" extra registers its own `--bulma-<component>-*` variables. Most are
registered on the component's **own selector** (`.avatar`, `.dialog`, … — `.bestax-avatar`
etc. with the prefixed CSS flavor), not on `:root`. A value set on a wrapping
ancestor — including `Theme`'s `bulmaVars` on a wrapping `Theme` — is only _inherited_ and
always loses to the component-level declaration, so it will NOT take effect. Working overrides
target the component's own element instead: redeclare on the component's own class in your CSS
(mind the class prefix), e.g. `.avatar { --bulma-avatar-size: 3.5rem; }`, or pass a
`className` and scope the override under it
(`.avatar.big-avatar { --bulma-avatar-size: 3.5rem; }`), or set it via the component's `style`
prop. Several default to core theme vars above, so they already flow through a custom theme.

Two exceptions where that advice silently fails, because the declarations sit somewhere a
lone class or the `style` prop cannot outrank:

- **Compound selectors** — LinkButton's variables are declared on `.button.link-button`
  (specificity 0-2-0). A single class added via `className` is 0-1-0 and loses regardless of
  stylesheet order. Override with the `style` prop, or in CSS loaded after the library
  styles with a selector that matches or exceeds the compound:
  `.button.link-button { --bulma-link-button-ghost-color: … }`.
- **Constituent elements** — Tooltip's variables (all but `--bulma-tooltip-dashed-color`)
  are declared on `.tooltip-content`, Popover's on its panel, `.popover-content`, HoverCard's
  on its card, `.hover-card-content`, ContextMenu's on the box its menu hangs from,
  `.context-menu-content`, and Sidebar's
  `--bulma-sidebar-overlay-background` on `.sidebar-background`. Values set via `className` or
  `style` land on the component root and are only inherited by the constituent, so they lose to
  its own declaration — target the declaring element in your CSS:
  `.tooltip-content { --bulma-tooltip-background: … }`.

The `style` prop also misses on Checkbox and Radio, which put it on their hidden `<input>`; set
their variables through `className` (see their entries below).

### Avatar / Avatars / Badge

| Variable                                                          | Default                          |
| ----------------------------------------------------------------- | -------------------------------- |
| `--bulma-avatar-size`                                             | `48px`                           |
| `--bulma-avatar-background` / `--bulma-avatar-color`              | `background` / `text`            |
| `--bulma-avatar-weight`                                           | `weight-semibold`                |
| `--bulma-avatar-rounded-radius`                                   | `radius-large`                   |
| `--bulma-avatars-ring-color` / `--bulma-avatars-ring-width`       | `scheme-main` / `2px`            |
| `--bulma-avatars-spacing`                                         | `0.75rem` (`sm` 0.5 / `lg` 1rem) |
| `--bulma-badge-height` / `--bulma-badge-min-width`                | `1.25em` / `1.25em`              |
| `--bulma-badge-padding` / `--bulma-badge-font-size`               | `0 0.4em` / `0.7rem`             |
| `--bulma-badge-radius`                                            | `radius-rounded`                 |
| `--bulma-badge-ring-color` / `--bulma-badge-ring-width`           | `scheme-main` / `2px`            |
| `--bulma-badge-dot-size`                                          | `0.65em`                         |
| `--bulma-badge-inset-circle` / `--bulma-badge-animation-duration` | `12%` / `1.4s`                   |

The remaining extras register the variables below — names only; each default lives in the
component's SCSS partial under `bulma-ui/src/scss/` as a `$<name> !default` variable. The same
own-selector override rule applies.

### Autocomplete

`--bulma-autocomplete-border-color`, `--bulma-autocomplete-border-hover-color`,
`--bulma-autocomplete-dropdown-background`, `--bulma-autocomplete-dropdown-offset`,
`--bulma-autocomplete-dropdown-padding-y`, `--bulma-autocomplete-dropdown-radius`,
`--bulma-autocomplete-dropdown-shadow`, `--bulma-autocomplete-dropdown-z-index`,
`--bulma-autocomplete-empty-color`, `--bulma-autocomplete-header-footer-color`,
`--bulma-autocomplete-header-footer-padding`, `--bulma-autocomplete-header-footer-size`,
`--bulma-autocomplete-icon-hover-color`, `--bulma-autocomplete-item-color`,
`--bulma-autocomplete-item-disabled-color`, `--bulma-autocomplete-item-disabled-opacity`,
`--bulma-autocomplete-item-hover-background`, `--bulma-autocomplete-item-hover-color`,
`--bulma-autocomplete-item-large-padding`, `--bulma-autocomplete-item-medium-padding`,
`--bulma-autocomplete-item-padding`, `--bulma-autocomplete-item-small-padding`,
`--bulma-autocomplete-loader-active-color`, `--bulma-autocomplete-loader-border-color`,
`--bulma-autocomplete-loader-duration`, `--bulma-autocomplete-scrollbar-thumb`,
`--bulma-autocomplete-scrollbar-thumb-hover`, `--bulma-autocomplete-scrollbar-track`,
`--bulma-autocomplete-scrollbar-width`

### Carousel

`--bulma-carousel-arrow-background`, `--bulma-carousel-arrow-background-hover`,
`--bulma-carousel-arrow-color`, `--bulma-carousel-arrow-disabled-opacity`,
`--bulma-carousel-arrow-icon-size`, `--bulma-carousel-arrow-icon-size-mobile`,
`--bulma-carousel-arrow-offset`, `--bulma-carousel-arrow-offset-mobile`,
`--bulma-carousel-arrow-radius`, `--bulma-carousel-arrow-size`,
`--bulma-carousel-arrow-size-mobile`, `--bulma-carousel-fade-duration`,
`--bulma-carousel-indicator-background`, `--bulma-carousel-indicator-background-active`,
`--bulma-carousel-indicator-background-hover`, `--bulma-carousel-indicator-bar-height`,
`--bulma-carousel-indicator-bar-height-mobile`, `--bulma-carousel-indicator-bar-width`,
`--bulma-carousel-indicator-bar-width-mobile`, `--bulma-carousel-indicator-circle-size`,
`--bulma-carousel-indicator-gap`, `--bulma-carousel-indicator-gap-mobile`,
`--bulma-carousel-indicator-line-height`, `--bulma-carousel-indicator-line-height-mobile`,
`--bulma-carousel-indicator-line-radius`, `--bulma-carousel-indicator-line-width`,
`--bulma-carousel-indicator-line-width-mobile`, `--bulma-carousel-indicator-size`,
`--bulma-carousel-indicator-size-mobile`, `--bulma-carousel-item-gap`,
`--bulma-carousel-items-in-view`, `--bulma-carousel-items-to-show`,
`--bulma-carousel-items-to-show-desktop`, `--bulma-carousel-items-to-show-fullhd`,
`--bulma-carousel-items-to-show-mobile`, `--bulma-carousel-items-to-show-tablet`,
`--bulma-carousel-items-to-show-widescreen`, `--bulma-carousel-overlay-arrow-background`,
`--bulma-carousel-overlay-arrow-background-hover`, `--bulma-carousel-overlay-arrow-color`,
`--bulma-carousel-overlay-indicator-background`,
`--bulma-carousel-overlay-indicator-background-active`,
`--bulma-carousel-overlay-indicator-background-hover`, `--bulma-carousel-transition-duration`

`--bulma-carousel-item-gap` (a length, default `0px`) is the space between items in view; set it
on the carousel's own element through a class. The `--bulma-carousel-items-to-show*` variables
come from the `itemsToShow*` props, and `--bulma-carousel-items-in-view` is the one of them the
viewport picks. The props also decide how far a step moves, so set the count with the props
rather than with these variables.

The `--bulma-carousel-overlay-*` variables color the arrows, and indicators over the slides, only
while the overlay look is on: `overlayControls`, which follows `indicatorInside` unless set. The look
also puts a dark gradient band behind indicators over the slides (a `background`, not a variable),
and while it's on the arrows ignore `arrowColor`. For indicators over light slides, such as white
cards, use `<Carousel indicatorInside overlayControls={false}>`: plain colors and no band.
`overlayControls` alone gives the arrows the overlay look with the indicators below the slides. The
overlay colors default to light ones (`--bulma-white`) in either color scheme, since they sit on a
dark tint.

### Checkbox

`--bulma-checkbox-active-color`, `--bulma-checkbox-background`, `--bulma-checkbox-border-color`,
`--bulma-checkbox-border-width`, `--bulma-checkbox-check-color`,
`--bulma-checkbox-focus-shadow-size`, `--bulma-checkbox-indeterminate-color`,
`--bulma-checkbox-label-gap`, `--bulma-checkbox-radius`, `--bulma-checkbox-size`,
`--bulma-checkbox-transition-duration`

The check mark and the mixed dash are both `--bulma-checkbox-check-color`, on the
`--bulma-checkbox-active-color` (checked) or `--bulma-checkbox-indeterminate-color` (mixed) fill,
so a dark fill needs a light check color. Set these on a class you pass through `className`, not
with `style`: Checkbox puts `style` and its other attributes on the hidden `<input>`, not on the
`.styled-checkbox` label that declares them. Name both classes in the selector
(`.styled-checkbox.my-box`, mind the class prefix) so it wins whatever order the stylesheets load
in. A `color` prop declares both fills again on `.styled-checkbox.is-<color>`, which ties with
that selector, so leave `color` unset when a class sets the fill. The unchecked border, `--bulma-checkbox-border-color`, defaults to `text-weak` so
the box holds the 3:1 WCAG asks of a control's boundary; keep a replacement at 3:1 against what
the form sits on.

`--bulma-checkbox-size` (default `1.25em`) can't take the box below 24px: the stylesheet gives the
`.check` box a `min-width` and `min-height` of 24px, WCAG 2.2's minimum target size, so with
Bulma's default font sizes the box is 24px at the default and `small` sizes. For a smaller box, set the size and also
`min-width: 0; min-height: 0` on `.styled-checkbox.my-box .check` (mind the class prefix), and keep
the label text inside the `Checkbox`, since the whole label is the click target.

### CheckboxCard

`--bulma-checkbox-card-active-color`, `--bulma-checkbox-card-border-color`,
`--bulma-checkbox-card-border-width`, `--bulma-checkbox-card-check-color`,
`--bulma-checkbox-card-checked-border-width`, `--bulma-checkbox-card-description-color`,
`--bulma-checkbox-card-disabled-opacity`, `--bulma-checkbox-card-focus-color`,
`--bulma-checkbox-card-focus-offset`, `--bulma-checkbox-card-focus-width`,
`--bulma-checkbox-card-gap`, `--bulma-checkbox-card-hover-border-color`,
`--bulma-checkbox-card-indicator-border-color`, `--bulma-checkbox-card-indicator-border-width`,
`--bulma-checkbox-card-indicator-radius`, `--bulma-checkbox-card-indicator-size`,
`--bulma-checkbox-card-min-width`, `--bulma-checkbox-card-title-weight`,
`--bulma-checkbox-card-transition-duration`

Declared on the card, the `.checkbox-card` label, which is also Bulma's `.card`, so the
`--bulma-card-*` variables style its surface and `--bulma-card-radius` rounds its edge too. Set
either family on a class you pass through `className`, with both classes in the selector
(`.checkbox-card.my-card`, mind the class prefix): `style` goes to the hidden `<input>`. A `color`
prop declares `--bulma-checkbox-card-active-color` again on `.checkbox-card.is-<color>`, which ties
that selector. A checked card's edge is `--bulma-checkbox-card-checked-border-width`, thicker than
`--bulma-checkbox-card-border-width`, so the selection isn't color alone; keep it thicker. The focus
outline is Bulma's focus color, not the active color. `--bulma-checkbox-card-min-width` is how
narrow a card gets in a `Checkboxes` row before the row wraps. In forced colors the edge takes
`CanvasText`, and `Highlight` when checked, whatever these say.

### Collapse

`--bulma-collapse-border-color`, `--bulma-collapse-group-gap`, `--bulma-collapse-header-weight`,
`--bulma-collapse-margin-bottom`, `--bulma-collapse-radius`,
`--bulma-collapse-trigger-icon-margin`, `--bulma-collapse-trigger-icon-size`

`--bulma-collapse-group-gap` is the exception to the own-selector rule above. It spaces the
items of a `Collapses` group, which reads it with a 0.5rem fallback and declares no value itself,
so set it on the group or on any ancestor, `:root` included. (`Theme`'s `bulmaVars` does not
list it, so set it in your CSS or through a `style` prop.)

### Combobox

Declared on the root, `.combobox`, and again on a menu rendered with `appendToBody`,
`.combobox-menu.is-portal`, outside the root. A menu in place inherits the root's, so a value set on
`.combobox` reaches it; for a portaled one, set it on `.combobox-menu.is-portal` as well, where
they're declared. A lone `.combobox-menu` loses to that on specificity, and
`.combobox-menu.is-portal` ties, so your rule wins only when it loads after the library styles. Each
size class (`.is-small`, `.is-medium`, `.is-large`, on the root and on the menu) sets the item size
and padding, so retune a size on that class. The highlight is the link color and its invert, the
pair Bulma gives an active dropdown item, and the colors come from Bulma's tokens, so the list
follows dark mode with no override. The menu reads these rather than Bulma's `--bulma-dropdown-*`,
which Bulma declares on `.dropdown` alone.

`--bulma-combobox-check-color`, `--bulma-combobox-check-gap`, `--bulma-combobox-check-size`,
`--bulma-combobox-disabled-color`, `--bulma-combobox-divider-color`, `--bulma-combobox-empty-color`,
`--bulma-combobox-group-label-color`, `--bulma-combobox-group-label-size`,
`--bulma-combobox-group-label-weight`, `--bulma-combobox-highlight-background`,
`--bulma-combobox-highlight-color`, `--bulma-combobox-item-color`,
`--bulma-combobox-item-hover-background`, `--bulma-combobox-item-padding-x`,
`--bulma-combobox-item-padding-y`, `--bulma-combobox-item-size`, `--bulma-combobox-list-max-height`,
`--bulma-combobox-menu-background`, `--bulma-combobox-menu-border-color`,
`--bulma-combobox-menu-offset`, `--bulma-combobox-menu-padding-y`, `--bulma-combobox-menu-radius`,
`--bulma-combobox-menu-shadow`, `--bulma-combobox-menu-z-index`, `--bulma-combobox-portal-z-index`

### Command

Declared on the root, `.command`, which `Command.Dialog` renders too, as the dialog's box, so a
value set on `.command` reaches both. The highlight is the link color and its invert, the pair
Bulma gives an active dropdown item, as Combobox's is, and the colors come from Bulma's tokens, so
the list follows dark mode with no override. The search field is Bulma's `Input`, themed with
`--bulma-input-*`. `--bulma-command-dialog-offset` is how far down the viewport the dialog sits.

`--bulma-command-background`, `--bulma-command-border-color`, `--bulma-command-description-color`,
`--bulma-command-description-size`, `--bulma-command-dialog-offset`,
`--bulma-command-dialog-shadow`, `--bulma-command-dialog-width`, `--bulma-command-disabled-color`,
`--bulma-command-divider-color`, `--bulma-command-empty-color`, `--bulma-command-empty-padding`,
`--bulma-command-gap`, `--bulma-command-group-label-color`, `--bulma-command-group-label-size`,
`--bulma-command-group-label-weight`, `--bulma-command-highlight-background`,
`--bulma-command-highlight-color`, `--bulma-command-hint-color`, `--bulma-command-icon-color`,
`--bulma-command-item-color`, `--bulma-command-item-gap`, `--bulma-command-item-hover-background`,
`--bulma-command-item-padding-x`, `--bulma-command-item-padding-y`, `--bulma-command-item-radius`,
`--bulma-command-item-size`, `--bulma-command-list-max-height`, `--bulma-command-padding`,
`--bulma-command-radius`

### ContextMenu

Both are declared on the box the menu hangs from, `.context-menu-content`, which is portaled away
from the trigger. See the constituent-element exception above.

`--bulma-context-menu-max-height`, `--bulma-context-menu-z-index`

The menu inside that box is Bulma's dropdown markup, and the box is a `.dropdown` too, so the
`--bulma-dropdown-*` variables theme it. Bulma declares them on `.dropdown`, so a context menu
takes a value set on the box: `.dropdown.context-menu-content { --bulma-dropdown-content-radius: … }`
changes context menus and leaves `Dropdown` alone.

### DateInput

`--bulma-dateinput-cell-color`, `--bulma-dateinput-cell-disabled-color`,
`--bulma-dateinput-cell-hover-bg`, `--bulma-dateinput-cell-other-month-color`,
`--bulma-dateinput-cell-radius`, `--bulma-dateinput-cell-range-bg`,
`--bulma-dateinput-cell-range-preview-bg`, `--bulma-dateinput-cell-selected-bg`,
`--bulma-dateinput-cell-selected-color`, `--bulma-dateinput-cell-size`,
`--bulma-dateinput-cell-today-color`, `--bulma-dateinput-day-name-color`,
`--bulma-dateinput-day-name-size`, `--bulma-dateinput-focus-ring-color`,
`--bulma-dateinput-header-padding`, `--bulma-dateinput-min-width`,
`--bulma-dateinput-nav-button-size`

The two `range` variables paint a range calendar (`DateRangeInput`): the band between a range's
ends, and the fainter band shown while the end is still being picked. Both are mixed from
`--bulma-dateinput-cell-selected-bg`, so `color` and an override of the selected fill re-tint
them too. Inside a band, a nearby month's day reads `--bulma-dateinput-cell-color` rather than
`--bulma-dateinput-cell-other-month-color`, and today's tint leans a fifth of the way toward
`--bulma-text-strong`, so both stay readable on the band's color.

### DateRangeInput

The field around the two inputs. Its calendar is the `DateInput` one, with the variables above.

`--bulma-daterangeinput-gap`, `--bulma-daterangeinput-separator-color`

### DateTimeInput

`--bulma-datetimeinput-gap`, `--bulma-datetimeinput-time-card-background`,
`--bulma-datetimeinput-time-card-border-color`, `--bulma-datetimeinput-time-card-padding`,
`--bulma-datetimeinput-time-card-radius`, `--bulma-datetimeinput-time-card-shadow`,
`--bulma-datetimeinput-time-overlay-background`, `--bulma-datetimeinput-time-overlay-blur`

### DescriptionList

Declared on the root, `.description-list`. The values take the root's color, so a `textColor` on
the list recolors them, and the labels keep `--bulma-description-list-label-color`. The gaps are in
`em`, so `textSize` scales them. `--bulma-description-list-label-max-width` is the most the labels'
column takes when the labels sit beside their values; it's a percentage of the list by default.

`--bulma-description-list-column-gap`, `--bulma-description-list-divider-color`,
`--bulma-description-list-divider-width`, `--bulma-description-list-gap`,
`--bulma-description-list-label-color`, `--bulma-description-list-label-max-width`,
`--bulma-description-list-label-weight`, `--bulma-description-list-row-gap`,
`--bulma-description-list-value-color`

### Dialog

`--bulma-dialog-animation-duration`, `--bulma-dialog-background`, `--bulma-dialog-body-color`,
`--bulma-dialog-body-line-height`, `--bulma-dialog-body-padding`, `--bulma-dialog-border-color`,
`--bulma-dialog-footer-gap`, `--bulma-dialog-footer-padding`, `--bulma-dialog-header-padding`,
`--bulma-dialog-icon-margin`, `--bulma-dialog-icon-size`, `--bulma-dialog-max-width`,
`--bulma-dialog-radius`, `--bulma-dialog-shadow`, `--bulma-dialog-title-color`,
`--bulma-dialog-title-size`, `--bulma-dialog-title-weight`, `--bulma-dialog-width`

### EmptyState

Declared on the root, `.empty-state`. Each size class (`.is-small`, `.is-medium`, `.is-large`)
sets its own gap, padding, indicator and icon sizes, and title and description sizes, so retune a
size on that class. The color classes and `.is-filled` set the indicator's background and color
from Bulma's scheme tokens, so the circle follows dark mode with no override. The description is
`currentColor`, so it reads on whatever surface holds it.

`--bulma-empty-state-description-color`, `--bulma-empty-state-description-max-width`,
`--bulma-empty-state-description-size`, `--bulma-empty-state-gap`, `--bulma-empty-state-icon-size`,
`--bulma-empty-state-indicator-background`, `--bulma-empty-state-indicator-color`,
`--bulma-empty-state-indicator-radius`, `--bulma-empty-state-indicator-size`,
`--bulma-empty-state-padding`, `--bulma-empty-state-title-size`

### Fieldset

Declared on the root, `.fieldset`. The surfaces and the border come from Bulma's scheme tokens, so
the box follows dark mode with no override. `.is-filled` paints
`--bulma-fieldset-filled-background` in place of `--bulma-fieldset-background`, and `.is-unstyled`
drops the box. The legend takes Bulma's
label look from the `--bulma-label-*` tokens. In forced colors the border takes the system's text
color whatever these say.

`--bulma-fieldset-background`, `--bulma-fieldset-border-color`, `--bulma-fieldset-border-width`,
`--bulma-fieldset-filled-background`, `--bulma-fieldset-legend-color`,
`--bulma-fieldset-legend-padding`, `--bulma-fieldset-legend-size`,
`--bulma-fieldset-legend-spacing`, `--bulma-fieldset-legend-weight`, `--bulma-fieldset-padding`,
`--bulma-fieldset-padding-top`, `--bulma-fieldset-radius`, `--bulma-fieldset-spacing`

### HoverCard

All are declared on the card, `.hover-card-content`, so a card rendered with `appendToBody` keeps
them. See the constituent-element exception above.

`--bulma-hover-card-animation-duration`, `--bulma-hover-card-background`,
`--bulma-hover-card-border-color`, `--bulma-hover-card-color`, `--bulma-hover-card-max-width`,
`--bulma-hover-card-min-width`, `--bulma-hover-card-offset`, `--bulma-hover-card-padding`,
`--bulma-hover-card-radius`, `--bulma-hover-card-shadow`, `--bulma-hover-card-z-index`

### Kbd

Declared on each key, `.kbd`. The border color and the fill default to `color-mix()` of
`currentColor` with `transparent`, so a key follows its text in dark mode, in a filled button and
in a tooltip without an override of its own. The sizes are in `em`, so `textSize` scales them.

`--bulma-kbd-background`, `--bulma-kbd-border-bottom-width`, `--bulma-kbd-border-color`,
`--bulma-kbd-border-width`, `--bulma-kbd-color`, `--bulma-kbd-family`, `--bulma-kbd-padding`,
`--bulma-kbd-radius`, `--bulma-kbd-size`, `--bulma-kbd-weight`

### LinkButton

Declared on the compound `.button.link-button` — see the compound-selector exception above.

`--bulma-link-button-ghost-color`, `--bulma-link-button-ghost-hover-color`,
`--bulma-link-button-transition-duration`, `--bulma-link-button-underline-offset`

### Loading

`--bulma-loading-animation-duration`, `--bulma-loading-cancel-background`,
`--bulma-loading-cancel-border-color`, `--bulma-loading-cancel-color`,
`--bulma-loading-cancel-hover-border-color`, `--bulma-loading-cancel-hover-color`,
`--bulma-loading-cancel-radius`, `--bulma-loading-cancel-size`, `--bulma-loading-content-gap`,
`--bulma-loading-icon-border-width`, `--bulma-loading-icon-border-width-large`,
`--bulma-loading-icon-border-width-medium`, `--bulma-loading-icon-border-width-small`,
`--bulma-loading-icon-size`, `--bulma-loading-icon-size-large`,
`--bulma-loading-icon-size-medium`, `--bulma-loading-icon-size-small`,
`--bulma-loading-icon-spin-color`, `--bulma-loading-overlay-background`,
`--bulma-loading-overlay-fullpage-opacity`, `--bulma-loading-overlay-opacity`,
`--bulma-loading-overlay-opacity-dark`, `--bulma-loading-overlay-opacity-light`,
`--bulma-loading-overlay-opacity-opaque`, `--bulma-loading-text-color`,
`--bulma-loading-text-size`

### Menu

`Menu.Section`'s, declared on the root, `.menu`, where Bulma declares its own `--bulma-menu-*`:
the room between a section heading's words and its chevron, and the chevron's box, color and
turn. The heading itself reads Bulma's label variables (`--bulma-menu-label-color`,
`--bulma-menu-label-font-size`, `--bulma-menu-label-letter-spacing`,
`--bulma-menu-label-spacing`), so retheming the menu's labels restyles section headings too.

`--bulma-menu-section-chevron-color`, `--bulma-menu-section-chevron-duration`,
`--bulma-menu-section-chevron-size`, `--bulma-menu-section-gap`

### Notification

`--bulma-notification-delete-padding-inline-end` is the end padding of a notification with a close
button, which keeps the text clear of the button. It applies with `hasDelete`, and to a `Delete`
passed as a direct child in browsers that support `:has()`. It is the padding for a default-size
button: a `Delete` passed in with a `size` gets it plus or minus the difference between the two
sizes. Bulma's own `--bulma-notification-*` variables set the rest.

### Numberinput

`--bulma-numberinput-disabled-opacity`, `--bulma-numberinput-rounded-button-size`,
`--bulma-numberinput-stepper-border-color`, `--bulma-numberinput-stepper-button-color`,
`--bulma-numberinput-stepper-button-hover-bg`, `--bulma-numberinput-stepper-button-hover-color`,
`--bulma-numberinput-stepper-width`

### PinInput

Declared on the row, `.pin-input`. Each box is a Bulma `.input`, so Bulma's `--bulma-input-*`
variables color it, and a box's size comes from its size class. The gap and the caret's size are
in `em`, so they follow the size of the boxes, and the caret is `currentColor`, the box's text.

`--bulma-pin-input-box-width`, `--bulma-pin-input-caret-blink-duration`,
`--bulma-pin-input-caret-color`, `--bulma-pin-input-caret-height`, `--bulma-pin-input-caret-width`,
`--bulma-pin-input-gap`

### Picker popover (DateInput / TimeInput / DateTimeInput / DateRangeInput)

`--bulma-picker-popover-animation-duration`, `--bulma-picker-popover-background`,
`--bulma-picker-popover-border-color`, `--bulma-picker-popover-offset`,
`--bulma-picker-popover-padding`, `--bulma-picker-popover-radius`,
`--bulma-picker-popover-shadow`, `--bulma-picker-popover-z-index`,
`--bulma-picker-trigger-color`, `--bulma-picker-trigger-hover-color`,
`--bulma-picker-trigger-width`

### Popover

All are declared on the panel, `.popover-content`, so a panel rendered with `appendToBody` keeps
them. See the constituent-element exception above.

`--bulma-popover-animation-duration`, `--bulma-popover-background`,
`--bulma-popover-body-padding`, `--bulma-popover-border-color`, `--bulma-popover-color`,
`--bulma-popover-footer-gap`, `--bulma-popover-footer-padding`, `--bulma-popover-header-color`,
`--bulma-popover-header-padding`, `--bulma-popover-header-weight`, `--bulma-popover-max-width`,
`--bulma-popover-min-width`, `--bulma-popover-offset`, `--bulma-popover-radius`,
`--bulma-popover-shadow`, `--bulma-popover-z-index`

### Radio

`--bulma-radio-active-color`, `--bulma-radio-background`, `--bulma-radio-border-color`,
`--bulma-radio-border-width`, `--bulma-radio-dot-color`, `--bulma-radio-focus-shadow-size`,
`--bulma-radio-label-gap`, `--bulma-radio-size`, `--bulma-radio-transition-duration`

As with Checkbox, set these on a class you pass through `className`, with both classes in the
selector (`.styled-radio.my-radio`): `style` goes to the hidden `<input>`. A `color` prop
declares `--bulma-radio-active-color` again on `.styled-radio.is-<color>`, which ties that
selector, so leave `color` unset when a class sets it. The unchecked ring, `--bulma-radio-border-color`, defaults to `text-weak` for the same 3:1 boundary
contrast.

`--bulma-radio-size` (default `1.25em`) can't take the circle below 24px: the stylesheet gives the
`.check` circle a `min-width` and `min-height` of 24px, WCAG 2.2's minimum target size, so with
Bulma's default font sizes the circle is 24px at the default and `small` sizes. For a smaller circle, set the size and also
`min-width: 0; min-height: 0` on `.styled-radio.my-radio .check` (mind the class prefix), and keep
the label text inside the `Radio`, since the whole label is the click target.

### RadioCard

`--bulma-radio-card-active-color`, `--bulma-radio-card-border-color`,
`--bulma-radio-card-border-width`, `--bulma-radio-card-checked-border-width`,
`--bulma-radio-card-description-color`, `--bulma-radio-card-disabled-opacity`,
`--bulma-radio-card-focus-color`, `--bulma-radio-card-focus-offset`,
`--bulma-radio-card-focus-width`, `--bulma-radio-card-gap`,
`--bulma-radio-card-hover-border-color`, `--bulma-radio-card-indicator-border-color`,
`--bulma-radio-card-indicator-border-width`, `--bulma-radio-card-indicator-size`,
`--bulma-radio-card-min-width`, `--bulma-radio-card-title-weight`,
`--bulma-radio-card-transition-duration`

The same as CheckboxCard's, on the `.radio-card` label, with a ring and a dot for the indicator and
`--bulma-radio-card-min-width` for a `Radios` row.

### Rate

`--bulma-rate-color-active`, `--bulma-rate-color-hover`, `--bulma-rate-color-inactive`,
`--bulma-rate-disabled-opacity`, `--bulma-rate-font-icon-size`,
`--bulma-rate-font-icon-size-large`, `--bulma-rate-font-icon-size-medium`,
`--bulma-rate-font-icon-size-small`, `--bulma-rate-gap`, `--bulma-rate-icon-size`,
`--bulma-rate-icon-size-large`, `--bulma-rate-icon-size-medium`, `--bulma-rate-icon-size-small`,
`--bulma-rate-pop-scale`, `--bulma-rate-score-color`, `--bulma-rate-score-weight`,
`--bulma-rate-spaced-gap`, `--bulma-rate-text-color`, `--bulma-rate-text-size`,
`--bulma-rate-transition-duration`

### RingProgress

Declared on the root, `.ring-progress`; the color and size classes set `--bulma-ring-progress-arc-color`
and `--bulma-ring-progress-size`. The thickness is in the ring's own units: it's 100 across with a
radius of 42, so up to 16 fits. In forced colors the arcs take `CanvasText` and the track `GrayText`
whatever these say.

`--bulma-ring-progress-arc-color`, `--bulma-ring-progress-duration`,
`--bulma-ring-progress-label-color`, `--bulma-ring-progress-label-size`,
`--bulma-ring-progress-label-weight`,
`--bulma-ring-progress-size`, `--bulma-ring-progress-thickness`,
`--bulma-ring-progress-track-color`

### Reveal

`--bulma-reveal-duration`, `--bulma-reveal-easing`, `--bulma-reveal-flip-angle`,
`--bulma-reveal-offset`, `--bulma-reveal-offset-large`, `--bulma-reveal-scale`

### ScrollArea

Declared on the frame, `.scroll-area`, and read by the viewport inside it, so set them on the
frame, through `className` or `style`. `--bulma-scroll-area-scrollbar-width` takes what
`scrollbar-width` takes: `thin`, `auto` or `none`. `none` hides the bars while the area still
scrolls, which hides that it scrolls at all, so keep to `thin` or `auto`. Restyled bars owe
WCAG's 3:1, so keep a thumb color that clears it against the background in both schemes. In forced colors the browser gives the bars the system's colors
whatever these say.

`--bulma-scroll-area-fade-size`, `--bulma-scroll-area-scrollbar-width`,
`--bulma-scroll-area-thumb-color`, `--bulma-scroll-area-thumb-hover-color`,
`--bulma-scroll-area-track-color`

### Sidebar

`--bulma-sidebar-background`, `--bulma-sidebar-close-color`,
`--bulma-sidebar-close-hover-background`, `--bulma-sidebar-close-line-width`,
`--bulma-sidebar-close-radius`, `--bulma-sidebar-close-size`, `--bulma-sidebar-content-padding`,
`--bulma-sidebar-footer-border-color`, `--bulma-sidebar-footer-margin-top`,
`--bulma-sidebar-footer-padding`, `--bulma-sidebar-header-border-color`,
`--bulma-sidebar-header-margin-bottom`, `--bulma-sidebar-header-padding`,
`--bulma-sidebar-menu-item-active-background`, `--bulma-sidebar-menu-item-active-color`,
`--bulma-sidebar-menu-item-hover-background`, `--bulma-sidebar-menu-item-padding`,
`--bulma-sidebar-menu-item-radius`, `--bulma-sidebar-overlay-background`,
`--bulma-sidebar-scrollbar-color`, `--bulma-sidebar-scrollbar-color-hover`,
`--bulma-sidebar-scrollbar-width`, `--bulma-sidebar-shadow`,
`--bulma-sidebar-static-border-color`, `--bulma-sidebar-title-color`,
`--bulma-sidebar-title-size`, `--bulma-sidebar-title-weight`,
`--bulma-sidebar-transition-duration`, `--bulma-sidebar-width`

### Slider

`--bulma-slider-disabled-opacity`, `--bulma-slider-fill-color`,
`--bulma-slider-output-background`, `--bulma-slider-output-color`,
`--bulma-slider-output-font-size`, `--bulma-slider-output-font-weight`, `--bulma-slider-radius`,
`--bulma-slider-thumb-border`, `--bulma-slider-thumb-color`, `--bulma-slider-thumb-shadow`,
`--bulma-slider-thumb-size`, `--bulma-slider-thumb-size-large`,
`--bulma-slider-thumb-size-medium`, `--bulma-slider-thumb-size-small`,
`--bulma-slider-tick-color`, `--bulma-slider-tick-height`, `--bulma-slider-tick-label-color`,
`--bulma-slider-tick-label-font-size`, `--bulma-slider-tick-opacity`,
`--bulma-slider-tick-width`, `--bulma-slider-track-color`, `--bulma-slider-track-height`,
`--bulma-slider-track-height-large`, `--bulma-slider-track-height-medium`,
`--bulma-slider-track-height-small`, `--bulma-slider-transition-duration`,
`--bulma-slider-vertical-height`

### Splitter

Declared on the root, `.splitter`. The handle reads them, and its line and grip are borders, so a
forced-colors page keeps them and draws an active handle in `Highlight`.
`--bulma-splitter-handle-size-coarse` is the strip's width for a coarse pointer, kept at 24px or
more for WCAG 2.5.8.

`--bulma-splitter-grip-color`, `--bulma-splitter-grip-length`, `--bulma-splitter-grip-radius`,
`--bulma-splitter-grip-size`, `--bulma-splitter-handle-size`,
`--bulma-splitter-handle-size-coarse`, `--bulma-splitter-line-active-color`,
`--bulma-splitter-line-active-size`, `--bulma-splitter-line-color`, `--bulma-splitter-line-size`

### Steps

`--bulma-steps-animation-duration`, `--bulma-steps-content-margin-top`,
`--bulma-steps-default-color`, `--bulma-steps-divider-height`, `--bulma-steps-marker-background`,
`--bulma-steps-marker-font-size`, `--bulma-steps-marker-font-weight`,
`--bulma-steps-marker-size`, `--bulma-steps-marker-size-large`,
`--bulma-steps-marker-size-medium`, `--bulma-steps-marker-size-small`,
`--bulma-steps-navigation-margin-top`, `--bulma-steps-title-active-color`,
`--bulma-steps-title-active-weight`, `--bulma-steps-title-color`, `--bulma-steps-title-size`,
`--bulma-steps-title-weight`, `--bulma-steps-vertical-content-margin-left`,
`--bulma-steps-vertical-padding`

### Switch

`--bulma-switch-active-color`, `--bulma-switch-background`, `--bulma-switch-border-width`,
`--bulma-switch-circle-color`, `--bulma-switch-circle-shadow`, `--bulma-switch-focus-shadow`,
`--bulma-switch-height`, `--bulma-switch-label-gap`, `--bulma-switch-padding`,
`--bulma-switch-radius`, `--bulma-switch-thin-circle-size`, `--bulma-switch-thin-height`,
`--bulma-switch-transition-duration`, `--bulma-switch-width`

### Tabs

`--bulma-tabs-content-padding`, `--bulma-tabs-vertical-border-color`,
`--bulma-tabs-vertical-border-width`, `--bulma-tabs-vertical-min-width`

### Taginput

`--bulma-taginput-background`, `--bulma-taginput-border-color`, `--bulma-taginput-border-radius`,
`--bulma-taginput-dropdown-max-height`, `--bulma-taginput-height`, `--bulma-taginput-min-height`,
`--bulma-taginput-padding`, `--bulma-taginput-tag-gap`, `--bulma-taginput-transition-duration`

### TimeInput

`--bulma-timeinput-footer-padding`, `--bulma-timeinput-separator-color`,
`--bulma-timeinput-separator-size`, `--bulma-timeinput-wheel-bg`,
`--bulma-timeinput-wheel-color`, `--bulma-timeinput-wheel-dim-color`,
`--bulma-timeinput-wheel-gap`, `--bulma-timeinput-wheel-hover-bg`,
`--bulma-timeinput-wheel-item-height`, `--bulma-timeinput-wheel-mask`,
`--bulma-timeinput-wheel-radius`, `--bulma-timeinput-wheel-selected-bg`,
`--bulma-timeinput-wheel-selected-color`, `--bulma-timeinput-wheel-width`

`--bulma-timeinput-wheel-item-height` is registered but has no effect: the component sets each
wheel item's height inline.

### Timeline

Declared on the root, `.timeline`. The states and the color classes set
`--bulma-timeline-marker-color` for each marker, and the layouts set
`--bulma-timeline-rail-center`, so retheme the markers through `--bulma-timeline-neutral-color`
and `--bulma-timeline-active-color` rather than those two. `--bulma-timeline-marker-background`
fills the upcoming rings and the pending loader, and a reached icon marker's tint is mixed into
it. It's the page's color by default, so it hides the line behind them. A record's icon circles
take `--bulma-timeline-marker-icon-background`, which the color classes set. Every size is in
`em`, so `textSize` scales them all.

`--bulma-timeline-active-color`, `--bulma-timeline-content-gap`, `--bulma-timeline-dot-size`,
`--bulma-timeline-gap`, `--bulma-timeline-halo-offset`, `--bulma-timeline-line-color`,
`--bulma-timeline-line-width`, `--bulma-timeline-marker-background`,
`--bulma-timeline-marker-color`, `--bulma-timeline-marker-icon-background`,
`--bulma-timeline-marker-icon-color`, `--bulma-timeline-marker-size`,
`--bulma-timeline-neutral-color`, `--bulma-timeline-pending-duration`,
`--bulma-timeline-pending-size`,
`--bulma-timeline-rail-center`, `--bulma-timeline-rail-size`, `--bulma-timeline-rail-size-icon`,
`--bulma-timeline-time-color`, `--bulma-timeline-time-size`, `--bulma-timeline-title-color`,
`--bulma-timeline-title-weight`

### Toast

`--bulma-toast-action-hover-opacity`, `--bulma-toast-action-radius`,
`--bulma-toast-action-weight`, `--bulma-toast-animation-duration`, `--bulma-toast-background`,
`--bulma-toast-color`, `--bulma-toast-gap`, `--bulma-toast-max-width`,
`--bulma-toast-message-size`, `--bulma-toast-min-width`, `--bulma-toast-padding`,
`--bulma-toast-radius`, `--bulma-toast-shadow`

### Tooltip

All but `--bulma-tooltip-dashed-color` are declared on `.tooltip-content` — see the
constituent-element exception above.

Raising `--bulma-tooltip-arrow-size` or `--bulma-tooltip-arrow-margin` widens the gap between the
trigger and the tooltip past what the pointer can cross on its own, so give the tooltip a
`closeDelay` long enough to cross it.

`--bulma-tooltip-arrow-margin`, `--bulma-tooltip-arrow-size`, `--bulma-tooltip-background`,
`--bulma-tooltip-color`, `--bulma-tooltip-dashed-color`, `--bulma-tooltip-font-size`,
`--bulma-tooltip-font-weight`, `--bulma-tooltip-line-height`, `--bulma-tooltip-max-width`,
`--bulma-tooltip-multiline-width`, `--bulma-tooltip-padding`, `--bulma-tooltip-radius`,
`--bulma-tooltip-z-index`

### TreeView

Declared on the root, `.tree-view`. A tree looks like Bulma's menu, but the menu's variables
don't reach it: `--bulma-menu-*` is registered on `.menu` alone, so retheme a tree through these.
Each default is the base token the matching menu variable defaults to (`scheme-h`, `text-l`,
`link-l`, `radius-small`, `border` and so on), so a theme's base tokens move the tree and the menu
together. A selected row swaps in the `item-selected-*` values on its own row, and a row's hover
and press tints change `--bulma-tree-view-item-background-l-delta` there. A checkbox tree's boxes
are `Checkbox`'s, themed through `--bulma-checkbox-*`.

`--bulma-tree-view-gap`, `--bulma-tree-view-group-border`, `--bulma-tree-view-group-margin`,
`--bulma-tree-view-group-padding`, `--bulma-tree-view-item-active-background-l-delta`,
`--bulma-tree-view-item-background-l`, `--bulma-tree-view-item-background-l-delta`,
`--bulma-tree-view-item-color-l`, `--bulma-tree-view-item-disabled-color`,
`--bulma-tree-view-item-h`, `--bulma-tree-view-item-hover-background-l-delta`,
`--bulma-tree-view-item-padding`, `--bulma-tree-view-item-radius`, `--bulma-tree-view-item-s`,
`--bulma-tree-view-item-selected-background-l`, `--bulma-tree-view-item-selected-color-l`,
`--bulma-tree-view-item-selected-h`, `--bulma-tree-view-item-selected-s`,
`--bulma-tree-view-line-height`, `--bulma-tree-view-toggle-color`,
`--bulma-tree-view-toggle-duration`, `--bulma-tree-view-toggle-size`

## Dark mode (`Theme colorMode`)

Drive the light/dark scheme with the `Theme` component's **`colorMode`** prop —
`'light' | 'dark' | 'system'`:

```tsx
<Theme isRoot colorMode={mode}>
  <App />
</Theme>
```

`colorMode` writes Bulma's **`data-theme`** attribute on `<html>`, so it is always **global** (even
on a scoped `Theme`). `'system'` removes the attribute, so Bulma falls back to the OS
`@media (prefers-color-scheme: dark)`. Omitting `colorMode` leaves the current setting untouched.

Under the hood this is Bulma 1.x's own mechanism — `[data-theme="dark"]` / `.theme-dark` selectors
(plus the `prefers-color-scheme` media query). Setting the attribute by hand still works
(`document.documentElement.setAttribute('data-theme', 'dark')`); `colorMode` just does it for you.

A prefixed flavor names the attribute after its prefix: `bestax-prefixed.css` and
`bestax-no-helpers-prefixed.css` read `data-bestax-theme` (and `.bestax-theme-dark`), never
`data-theme`. Under `<ConfigProvider classPrefix="bestax-">`, `colorMode` writes both attributes,
so it works with those flavors. Setting it by hand there means setting `data-bestax-theme`, and
custom dark-mode CSS keyed off `[data-theme='dark']` still matches, because `colorMode` writes
`data-theme` too.

Under dark mode Bulma flips the scheme/text/border/background lightness variables (e.g.
`--bulma-scheme-main-l` 100% → 9%, `--bulma-text-l` 29% → 71%). Your brand color overrides from
`Theme isRoot` or `:root` still apply on top, because they set the hue/saturation/lightness
channels directly. Each color's on-scheme lightness is the exception: Bulma gives dark mode its
own, so a new color sets one per scheme (see "The lightnesses Bulma's build picks for contrast").

### The scheme of the first paint

`Theme` writes the attribute before the browser paints what it rendered, but a page can paint
before the app's script runs at all: a client-rendered app (the create-bestax scaffold, for one)
can show its empty page first, and a server-rendered one shows its server HTML. That first frame
takes whatever `<html>` already carries: with nothing there, the visitor's OS scheme, which then
flips. So the scheme for that frame comes from `index.html`:

- **A scheme that never changes** goes on the `<html>` itself,
  `<html lang="en" data-theme="light">`, and needs no `colorMode`.
- **A scheme the visitor picks** is written by an inline script in `<head>`, from the saved
  choice or else the OS preference, before anything renders. `examples/dark-mode.tsx` has the
  script and the app's side: the app starts from the attribute the script wrote, passes its
  state to `Theme colorMode` for the toggle, and saves each choice in `localStorage` under the
  key the script reads. Keep it a plain inline script: one with `type="module"`, like the app's
  own, waits until the whole page is parsed, which can be after the first paint.

A prefixed flavor reads `data-bestax-theme`, so with one, `index.html` and the script write that
attribute as well.

Because the script always writes an attribute, custom dark-mode CSS keyed on `[data-theme='dark']`
reaches every visitor. To offer the OS preference as a third choice, both sides change. The script
writes no attribute for a saved `'system'`. The app adds `'system'` to its `ColorMode` and to what
it reads back from storage, so it passes `colorMode="system"`, which keeps the attribute off, and
its toggle becomes a choice of three, such as a `SegmentedControl`. With no attribute, Bulma's
`prefers-color-scheme` rules apply from the first frame and follow the OS when it changes, and
custom tokens then need both dark-mode paths (below).

### The single-mode contrast trap

Because the OS preference applies whenever no `data-theme` attribute is set, which is the
default state of every app that never sets one, a light-only design silently breaks for any
dark-mode visitor: Bulma's text goes near-white while author-defined fixed tokens stay light,
white text on cream. The failure is invisible unless the author's own OS is in dark mode.

**If the design is single-mode, pin the scheme** on the `<html>` in `index.html`
(`<html lang="en" data-theme="light">`, as above), so text can't flip out from under the palette.
`<Theme isRoot colorMode="light">` pins it too, but only once the app's script runs, so the
page can show the OS scheme before that.

**If both modes are supported, never expose a fixed custom token to the flip** — derive it from
scheme variables, or flip it yourself:

```css
/* Preferred: track the scheme automatically. */
:root {
  --my-canvas: var(--bulma-scheme-main);
  --my-ink: var(--bulma-text);
}
/* Or, when custom values must be kept, provide the dark pair for BOTH
   ways dark mode arrives — the explicit attribute (colorMode="dark")… */
[data-theme='dark'] {
  --my-canvas: #14251b;
  --my-ink: #eef3e7;
}

/* …and the OS preference, which applies when no data-theme is set
   (colorMode="system" removes the attribute): */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --my-canvas: #14251b;
    --my-ink: #eef3e7;
  }
}
```

Deriving from scheme variables is preferred precisely because it covers both dark-mode paths
with no extra selector.

The same reasoning applies to **fixed-color surfaces** inside either kind of page (a dark hero,
a brand banner): content sitting on a surface that never flips must use pinned colors — filled
buttons and explicit text colors — not scheme-derived defaults (see the layout skill's hero CTA
rule).

## `Theme` props (named)

Color trios: `primaryH/primaryS/primaryL`, `linkH/linkS/linkL`, `infoH/S/L`, `successH/S/L`,
`warningH/S/L`, `dangerH/S/L`. Scheme: `schemeH`, `schemeS`, `lightL`, `darkL`, `lightInvertL`,
`darkInvertL`, `softL`, `boldL`, `softInvertL`, `boldInvertL`. Interaction deltas:
`hoverBackgroundLDelta`, `activeBackgroundLDelta`, `hoverBorderLDelta`, `activeBorderLDelta`,
`hoverColorLDelta`, `activeColorLDelta`, `hoverShadowADelta`, `activeShadowADelta`. Everything else:
`bulmaVars={{ '--bulma-…': '…' }}`, each color's `--bulma-<c>-invert-l` and
`--bulma-<c>-on-scheme-l` included. All values are strings, except that an on-scheme key also
takes `{ light, dark }` on an `isRoot` `Theme`.
