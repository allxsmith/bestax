---
title: Tags
sidebar_label: Tags
---

# Tags

## Overview

The `Tags` component groups multiple `Tag` components together in a horizontal (or multiline) Bulma-styled container. Use it for tag clouds, keyword lists, multi-select UIs, or displaying collections of dismissible tokens.

:::info
Use `Tags` to organize tags with add-on and multiline layouts for a clean, compact UI.
:::

---

## Import

```tsx
import { Tags } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type                                        | Default | Description                                      |
| ------------- | ------------------------------------------- | ------- | ------------------------------------------------ |
| `className`   | `string`                                    | —       | Additional CSS classes.                          |
| `hasAddons`   | `boolean`                                   | —       | Group tags together as add-ons (no spacing).     |
| `isMultiline` | `boolean`                                   | —       | Allow tags to wrap onto multiple lines.          |
| `children`    | `ReactNode`                                 | —       | Tag elements to render inside the container.     |
| ...           | All standard `<div>` and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Tags

A basic `Tags` container groups several `Tag` components in a single line. Use this for simple tag lists or keyword clouds.

```tsx live
<Tags>
  <Tag color="primary">Primary</Tag>
  <Tag color="info">Info</Tag>
  <Tag color="success">Success</Tag>
</Tags>
```

### Add-ons (Grouped)

Set the `hasAddons` prop to group tags together as add-ons, removing spacing between them for a compact, connected look.

```tsx live
<Tags hasAddons>
  <Tag color="primary">Package</Tag>
  <Tag color="success">Ready</Tag>
  <Tag isDelete onDelete={() => alert('Deleted!')} />
</Tags>
```

### Multiline

Use the `isMultiline` prop to allow tags to wrap onto multiple lines, making the tag group responsive for long lists.

```tsx live
<Tags isMultiline>
  <Tag color="primary">Bulma</Tag>
  <Tag color="success">React</Tag>
  <Tag color="warning">Typescript</Tag>
  <Tag color="danger">Library</Tag>
  <Tag color="link">UI</Tag>
</Tags>
```

### With Margin

You can use Bulma helper props like `m="4"` to add margin around the tag group for spacing within layouts.

```tsx live
<Tags m="4">
  <Tag color="primary">With Margin</Tag>
</Tags>
```

### Mixed Tags

Combine props such as `isMultiline`, `size`, `isRounded`, and `isDelete` to create flexible, interactive tag groups for advanced UIs.

```tsx live
function example() {
  const [show, setShow] = useState();

  return (
    <Tags isMultiline>
      <Tag color="primary" size="medium">
        Primary Medium
      </Tag>
      <Tag color="success" isRounded>
        Success Rounded
      </Tag>
      {/* Dismissible tag */}
      {show && <Tag color="danger" isDelete onDelete={() => setShow(false)} />}
      <Tag color="info">Info</Tag>
    </Tags>
  );
}
```

### Add-ons with Delete Tag

You can combine `hasAddons` with a delete tag to create a tightly grouped, dismissible tag set.

```tsx live
<Tags hasAddons>
  <Tag color="danger">Allxsmith</Tag>
  <Tag isDelete onDelete={() => alert('Deleted!')} />
</Tags>
```

---

## Accessibility

- **Grouping:** The container is a `<div class="tags">`, which is semantically neutral.
- **Delete buttons:** If using delete tags, ensure each has an accessible label.
- **Multiline:** `isMultiline` ensures tags wrap for better readability on small screens.

:::tip
Use `hasAddons` for tightly grouped tags (no space between them).
:::

---

## Related Components

- [`Tag`](./tag.md): For individual tag elements.
- [`Delete`](./delete.md): For standalone delete buttons.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Tags Documentation](https://bulma.io/documentation/elements/tag/#list-of-tags)
- [Storybook: Tag Stories](https://bestax.io/storybook/?path=/story/elements-tag--default)
