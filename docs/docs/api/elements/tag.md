---
title: Tag
sidebar_label: Tag
---

# Tag

## Overview

The `Tag` component renders a Bulma-styled label or badge. It supports color, size, rounded, hoverable, and delete (close) variants. Use it for status indicators, categorization, dismissible tokens, or compact UI elements.

:::info
Tags are perfect for highlighting statuses, categories, or adding removable tokens to your UI.
:::

---

## Import

```tsx
import { Tag } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type                                                                                                             | Default | Description                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className`   | `string`                                                                                                         | —       | Additional CSS classes.                          |
| `color`       | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` | —       | Bulma color modifier for the tag.                |
| `size`        | `'normal' \| 'medium' \| 'large'`                                                                                | —       | Tag size.                                        |
| `isRounded`   | `boolean`                                                                                                        | —       | Renders a rounded tag.                           |
| `isDelete`    | `boolean`                                                                                                        | —       | Renders a delete-style tag (delete button).      |
| `isHoverable` | `boolean`                                                                                                        | —       | Adds hover effect to the tag.                    |
| `onDelete`    | `() => void`                                                                                                     | —       | Callback for delete tag/button.                  |
| `children`    | `React.ReactNode`                                                                                                | —       | Tag content.                                     |
| ...           | All standard `<span>` and Bulma helper props                                                                     |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Tag

A basic `Tag` renders a simple label. Use this for static status indicators or simple badges.

```tsx live
<Tag>Default Tag</Tag>
```

### Colored Tag

Set the `color` prop to apply a Bulma color modifier, such as `color="primary"`, for visual emphasis or to indicate status.

```tsx live
<Tag color="primary">Primary Tag</Tag>
```

### Medium and Large Tag

Use the `size` prop with values like `size="medium"` or `size="large"` to adjust the tag's size for different UI contexts.

```tsx live
<Tags>
  <Tag size="medium">Medium Tag</Tag>
  <Tag size="large">Large Tag</Tag>
</Tags>
```

### Rounded Tag

Add the `isRounded` prop to render a tag with fully rounded corners, making it stand out as a pill-shaped badge.

```tsx live
<Tag isRounded>Rounded Tag</Tag>
```

### Delete Tag (Button)

Set `isDelete` to render a tag as a delete button. Use the `onDelete` callback to handle removal actions.

```tsx live
<Tag isDelete onDelete={() => alert('Deleted!')} />
```

### With Margin

You can use Bulma helper props like `m="4"` to add margin around the tag for spacing within layouts.

```tsx live
<Tag m="4">Tag with Margin</Tag>
```

### Combined Styles

Combine multiple props such as `color`, `size`, `isRounded`, and spacing helpers to create visually distinct tags.

```tsx live
<Tag color="success" size="medium" isRounded m="2">
  Combined Tag
</Tag>
```

### All Colors

Render a set of tags with different `color` values to display a palette of available Bulma color modifiers. The `isHoverable` prop adds a hover effect to each tag.

```tsx live
<Tags>
  {[
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
    'black',
    'dark',
    'light',
    'white',
  ].map(color => (
    <Tag key={color} color={color} isHoverable>
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </Tag>
  ))}
</Tags>
```

### Sizes Together

You can combine `color`, `size`, and `isHoverable` props to show all size variants for each color in a single layout.

```tsx live
<Tags>
  {['primary', 'success', 'danger'].map(color => (
    <div key={color} style={{ display: 'flex', gap: '10px' }}>
      <Tag color={color} size="normal" isHoverable>
        {color.charAt(0).toUpperCase() + color.slice(1)} Normal
      </Tag>
      <Tag color={color} size="medium" isHoverable>
        {color.charAt(0).toUpperCase() + color.slice(1)} Medium
      </Tag>
      <Tag color={color} size="large" isHoverable>
        {color.charAt(0).toUpperCase() + color.slice(1)} Large
      </Tag>
    </div>
  ))}
</Tags>
```

### Hoverable Tag

Set `isHoverable` to add a hover effect, making the tag interactive for mouse users.

```tsx live
<Tag color="primary" isHoverable>
  Hoverable Tag
</Tag>
```

### Tag with Delete Component

You can combine `Tag` with the `Delete` component for custom dismissible tags. Use `hasAddons` on the `Tags` container to group them visually.

```tsx live
import { Tags, Delete } from '@allxsmith/bestax-bulma';

<Tags hasAddons>
  <Tag color="primary" size="medium">
    Tag with Delete
    <Delete onClick={() => alert('Tag deleted!')} />
  </Tag>
</Tags>;
```

---

## Accessibility

- **Delete buttons:** Use `aria-label` for delete tags for screen readers.
- **Keyboard:** Delete tags are rendered as `<button>`, supporting keyboard activation.
- **Semantics:** Use tags for supplemental information, not as primary headings.

:::tip
Combine `Tag` with `Tags` for grouped, multi-tag UIs.
:::

---

## Related Components

- [`Tags`](./tags.md): For grouping tags.
- [`Delete`](./delete.md): For standalone delete buttons.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Tag Documentation](https://bulma.io/documentation/elements/tag/)
- [Storybook: Tag Stories](https://bestax.cc/storybook/?path=/story/elements-tag--default)
