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

```tsx
<Tag>Default Tag</Tag>
```

### Colored Tag

```tsx
<Tag color="primary">Primary Tag</Tag>
```

### Medium and Large Tag

```tsx
<Tag size="medium">Medium Tag</Tag>
<Tag size="large">Large Tag</Tag>
```

### Rounded Tag

```tsx
<Tag isRounded>Rounded Tag</Tag>
```

### Delete Tag (Button)

```tsx
<Tag isDelete onDelete={() => alert('Deleted!')} />
```

### With Margin

```tsx
<Tag m="4">Tag with Margin</Tag>
```

### Combined Styles

```tsx
<Tag color="success" size="medium" isRounded m="2">
  Combined Tag
</Tag>
```

### All Colors

```tsx
<>
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
</>
```

### Sizes Together

```tsx
<>
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
</>
```

### Hoverable Tag

```tsx
<Tag color="primary" isHoverable>
  Hoverable Tag
</Tag>
```

### Tag with Delete Component

```tsx
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
