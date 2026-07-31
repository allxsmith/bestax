---
title: Tag
sidebar_label: Tag
description: The `Tag` component renders a Bulma-styled label or badge.
---

# Tag

## Overview

<!-- bestax:generated overview -->

The `Tag` component renders a Bulma-styled label or badge.

<!-- /bestax:generated overview -->

It supports color, size, rounded, hoverable, and delete (close) variants. Use it for status indicators, categorization, dismissible tokens, or compact UI elements.

:::info
Tags are perfect for highlighting statuses, categories, or adding removable tokens to your UI.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Tag } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
<Block>
  {['primary', 'success', 'danger'].map(color => (
    <Tags key={color}>
      <Tag color={color} size="normal" isHoverable>
        {color.charAt(0).toUpperCase() + color.slice(1)} Normal
      </Tag>
      <Tag color={color} size="medium" isHoverable>
        {color.charAt(0).toUpperCase() + color.slice(1)} Medium
      </Tag>
      <Tag color={color} size="large" isHoverable>
        {color.charAt(0).toUpperCase() + color.slice(1)} Large
      </Tag>
    </Tags>
  ))}
</Block>
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
- [Storybook: Tag Stories](https://bestax.io/storybook/?path=/story/elements-tag--default)

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                    | Default | Description                                       |
| ------------- | ------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className`   | `string`                                                | —       | Additional CSS classes to apply.                  |
| `color`       | `TagColor`                                              | —       | Bulma color modifier for the tag.                 |
| `size`        | `'normal'` \| `'medium'` \| `'large'`                   | —       | Tag size.                                         |
| `isRounded`   | `boolean`                                               | `false` | Renders a rounded tag.                            |
| `isDelete`    | `boolean`                                               | `false` | Renders a delete-style tag (delete button).       |
| `isHoverable` | `boolean`                                               | `false` | Adds hover effect to the tag.                     |
| `onDelete`    | `() => void`                                            | —       | Callback for delete tag/button.                   |
| `children`    | `React.ReactNode`                                       | —       | Tag content.                                      |
| `...`         | All standard `<span>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

**Types:**

- `TagColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — Valid color values for the Tag component (Bulma tag colors).

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tag` registers these variables on its own `.tag` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                            | Sass Variable                    | Default                                  |
| --------------------------------------- | -------------------------------- | ---------------------------------------- |
| `--bulma-tag-h`                         | `$tag-h`                         | `var(--bulma-scheme-h)`                  |
| `--bulma-tag-s`                         | `$tag-s`                         | `var(--bulma-scheme-s)`                  |
| `--bulma-tag-background-l`              | `$tag-background-l`              | `var(--bulma-background-l)`              |
| `--bulma-tag-background-l-delta`        | `$tag-background-l-delta`        | `0%`                                     |
| `--bulma-tag-hover-background-l-delta`  | `$tag-hover-background-l-delta`  | `var(--bulma-hover-background-l-delta)`  |
| `--bulma-tag-active-background-l-delta` | `$tag-active-background-l-delta` | `var(--bulma-active-background-l-delta)` |
| `--bulma-tag-color-l`                   | `$tag-color-l`                   | `var(--bulma-text-l)`                    |
| `--bulma-tag-radius`                    | `$tag-radius`                    | `var(--bulma-radius)`                    |
| `--bulma-tag-delete-margin`             | `$tag-delete-margin`             | `1px`                                    |

<!-- /bestax:generated cssvars -->
