---
title: Checkboxes
sidebar_label: Checkboxes
---

# Checkboxes

## Overview

The `Checkboxes` component wraps multiple `Checkbox` components in a Bulma-styled group. Use for vertical lists of boolean choices, such as preference lists or to-do checklists.

---

## Import

```tsx
import { Checkboxes, Checkbox } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                   | Description                                      |
| ----------- | ---------------------- | ------------------------------------------------ |
| `className` | `string`               | Additional CSS classes.                          |
| `children`  | `React.ReactNode`      | Checkbox elements to render in the group.        |
| ...         | All Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Grouped Checkboxes

This example demonstrates the `Checkboxes` component wrapping multiple `Checkbox` children. Use this pattern for vertical lists of boolean options, such as to-do lists or preference selections. Each `Checkbox` receives its own label via the `children` prop.

```tsx live
<Checkboxes>
  <Checkbox>Make the bed</Checkbox>
  <Checkbox>Brush teeth</Checkbox>
  <Checkbox>Do homework</Checkbox>
  <Checkbox>Feed the pet</Checkbox>
  <Checkbox>Take out the trash</Checkbox>
  <Checkbox>Clean your room</Checkbox>
  <Checkbox>Set the table</Checkbox>
  <Checkbox>Help with dishes</Checkbox>
  <Checkbox>Water the plants</Checkbox>
  <Checkbox>Put away toys</Checkbox>
</Checkboxes>
```

---

## Accessibility

- The group is rendered as a `<div class="checkboxes">` containing labeled checkboxes.
- Each child should be a `Checkbox` for proper labeling and accessibility.

---

## Related Components

- [`Checkbox`](./checkbox.md): Individual checkbox.
- [`Field`](./field.md): For labeled/grouped form fields.

---

## Additional Resources

- [Bulma Checkboxes Documentation](https://bulma.io/documentation/form/checkbox/#grouped-checkboxes)
- [Storybook: Checkbox Stories](https://bestax.cc/storybook/?path=/story/form-checkbox--listofcheckboxes)
