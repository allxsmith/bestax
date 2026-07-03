---
title: Helper Utilities Overview
sidebar_label: Helpers
---

# Helper Utilities

This page summarizes the helper utilities in Bestax, with a brief description, usage example, and links to full documentation for each. Use these helpers to simplify class name management and apply Bulma utility classes in a type-safe, composable way.

---

## Helper props at a glance

Most components accept these shared helper props (they map to Bulma utility classes via [`useBulmaClasses`](../../api/helpers/usebulmaclasses); a few thin wrappers like `Skeleton` opt out). Prefer them over inline `style` — they are type-checked, theme-aware, and responsive.

| Group          | Representative props                                                          | Example                   | Renders                     |
| -------------- | ----------------------------------------------------------------------------- | ------------------------- | --------------------------- |
| **Spacing**    | `m` `mt` `mb` `ml` `mr` `mx` `my` `p` `pt` `pb` `px` `py` (`0`–`6` \| `auto`) | `mt="4"`                  | `mt-4`                      |
| **Color**      | `textColor` `bgColor` `colorShade`                                            | `textColor="primary"`     | `has-text-primary`          |
| **Typography** | `textSize` `textAlign` `textWeight` `textTransform` `fontFamily`              | `textAlign="centered"`    | `has-text-centered`         |
| **Display**    | `display` `visibility`                                                        | `display="flex"`          | `is-flex`                   |
| **Flexbox**    | `flexDirection` `justifyContent` `alignItems` `flexGrow` `flexShrink`         | `justifyContent="center"` | `is-justify-content-center` |
| **Other**      | `float` `radius` `shadow` `overflow` `clearfix`                               | `float="right"`           | `is-pulled-right`           |

## Inline styles → helper props

Reach for a helper prop before an inline `style`. Reserve `style` / CSS variables only for values the design system doesn't tokenize (e.g. a one-off brand hex).

| Instead of…                       | Use                              | Renders                    |
| --------------------------------- | -------------------------------- | -------------------------- |
| `style={{ marginTop: '1rem' }}`   | `mt="4"`                         | `mt-4`                     |
| `style={{ padding: '0.5rem' }}`   | `p="2"`                          | `p-2`                      |
| `style={{ textAlign: 'center' }}` | `textAlign="centered"`           | `has-text-centered`        |
| `style={{ color: '…' }}`          | `textColor="…"` (+ `colorShade`) | `has-text-…`               |
| `style={{ background: '…' }}`     | `bgColor="…"`                    | `has-background-…`         |
| `style={{ fontWeight: 600 }}`     | `textWeight="semibold"`          | `has-text-weight-semibold` |
| `style={{ display: 'flex' }}`     | `display="flex"`                 | `is-flex`                  |

Spacing scale: `0` = 0, `1` = 0.25rem, `2` = 0.5rem, `3` = 0.75rem, `4` = 1rem, `5` = 1.5rem, `6` = 3rem, `auto` = auto. See [margin & padding](../helpers/margin-and-padding) for every side.

---

## useBulmaClasses

A custom React hook that generates Bulma helper class strings from a set of props. Makes it easy to apply color, spacing, alignment, typography, flexbox, and other Bulma utility classes to your components. Returns both the class string and the remaining props for spreading onto elements.

### Color

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

```tsx live
<Button color="primary">Primary Button</Button>
```

### Color Palette

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

```tsx live
<Box bgColor="info" colorShade="30">
  Info 30
</Box>
```

### Spacing

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

```tsx live
<Box m="4" px="2" py="5">
  Box with margin and padding
</Box>
```

### Typography

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

```tsx live
<Box
  textSize="3"
  textAlign="centered"
  textTransform="uppercase"
  textWeight="bold"
  fontFamily="monospace"
>
  Typography Example
</Box>
```

### Visibility

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

```tsx live
<Button visibility="hidden" viewport="mobile">
  Hidden on Mobile
</Button>
```

### Flexbox

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

```tsx live
<Box
  display="flex"
  flexDirection="row"
  justifyContent="center"
  alignItems="center"
>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</Box>
```

### Other

Additional Bulma helpers are supported via these props:

#### is-clearfix

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `clearfix` prop.

```tsx live
<Box clearfix>
  <Button float="left">Left</Button>
  <Button float="right">Right</Button>
</Box>
```

#### is-pulled-left / is-pulled-right

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

:::note

Notice in the example that the float is reversing the rendered order of the elements

:::

Use the `float` prop.

```tsx live
<>
  <Button float="Right">Pulled Right</Button>
  <Button float="left">Pulled Left</Button>
</>
```

#### is-overlay

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `overlay` prop.

```tsx
<Box overlay>
  <span>Overlay Content</span>
  <div />
</Box>
```

#### is-clipped

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `overflow` prop.

```tsx live
<Message overflow="clipped" style={{ width: 200, height: '3.25rem' }}>
  This is a very long line of text that will be clipped and not overflow the
  box.
</Message>
```

#### is-radiusless

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `radius` prop.

```tsx live
<Button radius="radiusless">Radiusless Button</Button>
```

#### is-shadowless

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `shadow` prop.

```tsx live
<Box shadow="shadowless">No Shadow</Box>
```

#### is-unselectable

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `interaction` prop.

:::tip

Try to select me, bet you can't!

:::

```tsx live
<Box interaction="unselectable">Unselectable Text</Box>
```

#### is-clickable

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `interaction` prop.

```tsx live
<Box interaction="clickable">Clickable Box</Box>
```

#### is-relative

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `relative` prop.

```tsx live
<Box relative p="4" style={{ height: '100px', border: '1px dashed #ccc' }}>
  <Tag style={{ position: 'absolute', top: '8px', right: '8px' }}>Badge</Tag>
  Relative container
</Box>
```

#### is-cursor-help

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `cursor` prop.

```tsx live
<Box cursor="help">Hover for help cursor</Box>
```

#### is-full-height

:::info
More examples and full property coverage are available in [usebulmaclasses.md](../../api/helpers/usebulmaclasses).
:::

Use the `fullHeight` prop.

```tsx live
<Columns>
  <Column>
    <Notification color="primary" fullHeight>
      Short content
    </Notification>
  </Column>
  <Column>
    <Notification color="info" fullHeight>
      Taller content that takes more space to demonstrate equal height
    </Notification>
  </Column>
</Columns>
```

[View full documentation.](../../api/helpers/usebulmaclasses)

---

## classNames

A utility function for conditionally joining class names together. Accepts any mix of strings, numbers, arrays, or objects, and returns a space-separated string of unique class names. Useful for dynamically constructing `className` values in React and other frameworks.

```tsx
classNames('column', 'is-half', {
  'has-text-primary': true,
  'is-hidden': false,
});
// => 'column is-half has-text-primary'
```

[View full documentation.](../../api/helpers/classnames)

---

## Theme

A component that injects Bulma CSS variables for local or global theming. Wrap any subtree in `<Theme>` to override design tokens like colors, typography, and spacing without writing custom CSS.

[View full documentation.](../../api/helpers/theme)

---

## ConfigProvider

A context provider for global settings like class prefix and icon library. Wrap your app in `<ConfigProvider>` to configure all bestax-bulma components at once — e.g. set `iconLibrary="fa"` once at the root so `<Icon name="check" />` needs no per-icon `library` prop.

[View full documentation.](../../api/helpers/config) · [Configuration guide](../features/configuration)

---

For more details and advanced usage, see the full documentation for each helper linked above.
