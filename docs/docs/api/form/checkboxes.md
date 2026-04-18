---
title: Checkboxes
sidebar_label: Checkboxes
---

# Checkboxes

## Overview

The `Checkboxes` component wraps multiple `Checkbox` components in a Bulma-styled group. Use for lists of boolean choices, such as preference lists or to-do checklists.

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

This example demonstrates the `Checkboxes` component wrapping multiple `Checkbox` children. Use this pattern for lists of boolean options, such as to-do lists or preference selections. Each `Checkbox` receives its own label via the `children` prop.

```tsx live
<Checkboxes>
  <Checkbox> Make the bed </Checkbox>
  <Checkbox> Brush teeth </Checkbox>
  <Checkbox> Do homework </Checkbox>
  <Checkbox> Feed the pet </Checkbox>
  <Checkbox> Take out the trash </Checkbox>
  <Checkbox> Clean your room </Checkbox>
  <Checkbox> Set the table </Checkbox>
  <Checkbox> Help with dishes </Checkbox>
  <Checkbox> Water the plants </Checkbox>
  <Checkbox> Put away toys </Checkbox>
</Checkboxes>
```

---

### Context-Aware Rendering

The `Checkboxes` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw checkbox group).

#### Default (with label)

The simplest usage — the component automatically renders its own Field and Control wrappers.

```tsx live
<Checkboxes label="Chores">
  <Checkbox> Make the bed </Checkbox>
  <Checkbox> Brush teeth </Checkbox>
  <Checkbox> Do homework </Checkbox>
</Checkboxes>
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Chores">
      <Field.Body>
        <Field>
          <Checkboxes>
            <Checkbox> Make the bed </Checkbox>
            <Checkbox> Brush teeth </Checkbox>
            <Checkbox> Do homework </Checkbox>
          </Checkboxes>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual control, wrap in both Field and Control. The component detects both and renders only the raw checkbox group.

```tsx live
function example() {
  return (
    <Field horizontal label="Chores">
      <Field.Body>
        <Field>
          <Control>
            <Checkboxes>
              <Checkbox> Make the bed </Checkbox>
              <Checkbox> Brush teeth </Checkbox>
              <Checkbox> Do homework </Checkbox>
            </Checkboxes>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
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
- [Storybook: Checkbox Stories](https://bestax.io/storybook/?path=/story/form-checkbox--listofcheckboxes)
