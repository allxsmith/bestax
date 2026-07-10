---
title: Valid value constants
sidebar_label: Valid value constants
---

# Valid value constants

## Overview

The `valid*` constant arrays enumerate every accepted value for the shared Bulma helper props — public API you can import to build prop types and validation. Each is a readonly `as const` tuple, so `(typeof validColors)[number]` gives you the exact string-literal union. `useBulmaClasses` (and the per-concern hooks) silently ignore values outside these lists, so validating against them tells you exactly what will produce a class.

---

## Import

```tsx
import {
  validColors,
  validSizes,
  validViewports,
} from '@allxsmith/bestax-bulma';
```

All 18 constants are importable the same way.

---

## Constants

| Constant               | Values                                                                                                                                   | Used by prop family                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `validColors`          | `'primary'`, `'link'`, `'info'`, `'success'`, `'warning'`, `'danger'`, `'black'` … `'white'`, `'light'`, `'dark'` (17 values)            | `color`, `backgroundColor` (also component `color` props)                 |
| `validColorShades`     | `'00'`, `'05'` … `'95'`, `'invert'`, `'light'`, `'dark'`, `'soft'`, `'bold'`, `'on-scheme'`                                              | `colorShade`, `backgroundColorShade`                                      |
| `validSizes`           | `'0'`–`'6'`, `'auto'`                                                                                                                    | Spacing: `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`, `p`, `pt`, … `px`, `py` |
| `validTextSizes`       | `'1'`–`'7'`                                                                                                                              | `textSize` (+ `textSizeMobile` … `textSizeFullhd`)                        |
| `validAlignments`      | `'centered'`, `'justified'`, `'left'`, `'right'`                                                                                         | `textAlign` (+ viewport variants)                                         |
| `validTextTransforms`  | `'capitalized'`, `'lowercase'`, `'uppercase'`, `'italic'`                                                                                | `textTransform`                                                           |
| `validTextWeights`     | `'light'`, `'normal'`, `'medium'`, `'semibold'`, `'bold'`                                                                                | `textWeight`                                                              |
| `validFontFamilies`    | `'sans-serif'`, `'monospace'`, `'primary'`, `'secondary'`, `'code'`                                                                      | `fontFamily`                                                              |
| `validDisplays`        | `'block'`, `'flex'`, `'inline'`, `'inline-block'`, `'inline-flex'`                                                                       | `display` (+ `displayMobile` … `displayFullhd`)                           |
| `validVisibilities`    | `'hidden'`, `'sr-only'`, `'invisible'`                                                                                                   | `visibility` (+ viewport variants)                                        |
| `validFlexDirections`  | `'row'`, `'row-reverse'`, `'column'`, `'column-reverse'`                                                                                 | `flexDirection`                                                           |
| `validFlexWraps`       | `'nowrap'`, `'wrap'`, `'wrap-reverse'`                                                                                                   | `flexWrap`                                                                |
| `validJustifyContents` | `'flex-start'`, `'flex-end'`, `'center'`, `'space-between'`, `'space-around'`, `'space-evenly'`, `'start'`, `'end'`, `'left'`, `'right'` | `justifyContent`                                                          |
| `validAlignContents`   | `'flex-start'`, `'flex-end'`, `'center'`, `'space-between'`, `'space-around'`, `'space-evenly'`, `'stretch'`                             | `alignContent`                                                            |
| `validAlignItems`      | `'stretch'`, `'flex-start'`, `'flex-end'`, `'center'`, `'baseline'`, `'start'`, `'end'`                                                  | `alignItems`                                                              |
| `validAlignSelfs`      | `'auto'`, `'flex-start'`, `'flex-end'`, `'center'`, `'baseline'`, `'stretch'`                                                            | `alignSelf`                                                               |
| `validFlexGrowShrink`  | `'0'`–`'5'`                                                                                                                              | `flexGrow`, `flexShrink`                                                  |
| `validViewports`       | `'mobile'`, `'tablet'`, `'desktop'`, `'widescreen'`, `'fullhd'`                                                                          | `viewport` (responsive modifier)                                          |

---

## Typing with `(typeof …)[number]`

Because the arrays are `as const`, indexing them with `number` yields the union of their literal values — the same idiom the library uses internally for its prop types:

```ts
import { validColors, validSizes } from '@allxsmith/bestax-bulma';

type Color = (typeof validColors)[number]; // 'primary' | 'link' | … | 'dark'
type Spacing = (typeof validSizes)[number]; // '0' | '1' | … | '6' | 'auto'

interface MyComponentProps {
  color?: Color;
  m?: Spacing;
}
```

They also work as runtime validators:

```ts
function isColor(value: string): value is (typeof validColors)[number] {
  return (validColors as readonly string[]).includes(value);
}
```

:::warning `validSizes` is for spacing, not element sizes

`validSizes` (`'0'`–`'6'` | `'auto'`) enumerates the **spacing helper** scale — the values for `m`/`p` props like `m="4"` (→ `m-4`). Element `size` props are a different axis: `Button`, `Icon`, and friends declare an inline union such as `'small' | 'medium' | 'large'` (Button adds `'normal'`), **not** `validSizes`. Don't use `validSizes` to type a component's `size` prop.

:::

---

## See Also

- [`useBulmaClasses`](./usebulmaclasses.md): The hook that consumes these values and generates the helper classes.
- [Helper guides](../../guides/helpers/color.md): Task-oriented walkthroughs of the helper-prop system (color, spacing, typography, flex, visibility).
