# Themeable component props

This is the self-contained inventory of the color/size/variant props that matter for theming in
`@allxsmith/bestax-bulma`. All values are source-verified. Components import from the package root:
`import { Button, Notification, Tag, Box, Message, Input, Title, SubTitle } from '@allxsmith/bestax-bulma'`.

## Two kinds of color props

1. **Component `color` modifier** → emits `is-<color>` (the filled Bulma variant). The accepted
   values are component-specific (see the table). Example: `<Button color="primary">` → `is-primary`.
2. **Helper color props** (available on virtually every component, applied as utility classes):
   - `color` / `textColor` → `has-text-<color>` (text color)
   - `backgroundColor` / `bgColor` → `has-background-<color>` (background)
   - `colorShade` / `backgroundColorShade` → adds a shade suffix, e.g. `has-text-primary-30`

   When a component has its own `color` modifier (Button, Tag, Input, …), use **`textColor`** /
   **`bgColor`** for utility coloring so the two don't collide.

`<color>` for the helper props is one of **`validColors`**:

```
primary, link, info, success, warning, danger,
black, black-bis, black-ter, grey-darker, grey-dark, grey, grey-light, grey-lighter,
white, light, dark
```

Shades (`colorShade` / `backgroundColorShade`): `00, 05, 10, … 95, invert, light, dark, soft, bold, on-scheme`.

## Component `color` / `size` props (verbatim unions)

| Component      | `color` accepts                                                                                               | `size` accepts                                                            | Notes                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Button`       | `primary \| link \| info \| success \| warning \| danger \| white \| light \| dark \| black \| text \| ghost` | `small \| normal \| medium \| large`                                      | adds `text`, `ghost`; also `isLight`, `isOutlined`, `isInverted`, `isRounded` |
| `Notification` | the 17 `validColors`                                                                                          | —                                                                         | also `isLight`                                                                |
| `Tag`          | `primary \| link \| info \| success \| warning \| danger \| black \| dark \| light \| white`                  | `normal \| medium \| large`                                               | also `isRounded`, `isDelete`, `isHoverable`                                   |
| `Box`          | `primary \| link \| info \| success \| warning \| danger`                                                     | —                                                                         | the 6 only; also `hasShadow`                                                  |
| `Message`      | `primary \| link \| info \| success \| warning \| danger`                                                     | —                                                                         | the 6 only                                                                    |
| `Input`        | `primary \| link \| info \| success \| warning \| danger \| black \| dark \| light \| white`                  | `small \| medium \| large`                                                | also `isRounded`, `isStatic`                                                  |
| `Avatar`       | `primary \| link \| info \| success \| warning \| danger \| black \| dark \| light \| white`                  | `16x16 \| 24x24 \| 32x32 \| 48x48 \| 64x64 \| 96x96 \| 128x128 \| number` | initials/icon background (auto-derived from `name` when unset); also `shape`  |
| `Badge`        | `primary \| link \| info \| success \| warning \| danger \| black \| dark \| light \| white`                  | —                                                                         | pill background; default `danger`                                             |
| `Title`        | — (no `color`; use `textColor`)                                                                               | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                                              | also `isSpaced`                                                               |
| `SubTitle`     | — (no `color`; use `textColor`)                                                                               | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                                              | —                                                                             |

The 6 brand colors (`primary, link, info, success, warning, danger`) are the ones a custom theme
recolors via the HSL trios (see `css-variables.md`). The greyscale and `white`/`light`/`dark`
entries follow the scheme variables.

## Typography & misc helper props (on most components)

| Prop                                         | Accepts                                                   | Class                  |
| -------------------------------------------- | --------------------------------------------------------- | ---------------------- |
| `textSize`                                   | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7`                         | `is-size-<n>`          |
| `textWeight`                                 | `light \| normal \| medium \| semibold \| bold`           | `has-text-weight-<w>`  |
| `fontFamily`                                 | `sans-serif \| monospace \| primary \| secondary \| code` | `is-family-<f>`        |
| `textAlign`                                  | `centered \| justified \| left \| right`                  | `has-text-<a>`         |
| `radius`                                     | `radiusless`                                              | `is-radiusless`        |
| `shadow`                                     | `shadowless`                                              | `is-shadowless`        |
| `m` / `p` (+ `mt/mr/mb/ml/mx/my`, `pt/…/py`) | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| auto`                 | `m-<n>` / `p-<n>` etc. |

These map to Bulma utility classes that read the same `--bulma-*` variables, so a custom theme
flows through them automatically.

## Pattern

```tsx
// Brand-colored, themeable components — colors recolor with the theme's HSL trios:
<Button color="primary">Save</Button>
<Notification color="info">Heads up</Notification>
<Tag color="success">Active</Tag>

// Utility coloring on a component that already has its own `color`:
<Button color="primary" textColor="white">Save</Button>

// Shade + background:
<Box bgColor="primary" backgroundColorShade="05">Subtle brand surface</Box>
```
