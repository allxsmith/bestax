---
title: Helper Utilities Overview
sidebar_label: Helpers
---

# Helper Utilities

This page summarizes the helper utilities in Bestax, with a brief description, usage example, and links to full documentation for each. Use these helpers to simplify class name management and apply Bulma utility classes in a type-safe, composable way.

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

Not directly mapped; use Bulma's class directly if needed.

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

Not currently mapped; use Bulma's class directly if needed.

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

For more details and advanced usage, see the full documentation for each helper linked above.
