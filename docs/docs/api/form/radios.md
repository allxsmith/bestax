---
title: Radios
sidebar_label: Radios
---

# Radios

## Overview

The `Radios` component wraps multiple `Radio` components in a Bulma-styled group. Use it for lists of mutually exclusive choices, such as RSVP or selection lists.

---

## Import

```tsx
import { Radios, Radio } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                   | Description                                      |
| ----------- | ---------------------- | ------------------------------------------------ |
| `className` | `string`               | Additional CSS classes.                          |
| `children`  | `React.ReactNode`      | Radio elements to render in the group.           |
| ...         | All Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Grouped Radios (All Disabled Example)

This example demonstrates the `Radios` component wrapping multiple `Radio` children, all with the same `name` prop for mutual exclusivity. The `disabled` prop is set on each `Radio` to render them as non-interactive. Use this pattern for lists of mutually exclusive options, such as RSVP or selection lists.

```tsx live
<Radios>
  <Radio name="event" disabled>
    {' '}
    Attend{' '}
  </Radio>
  <Radio name="event" disabled>
    {' '}
    Decline{' '}
  </Radio>
  <Radio name="event" disabled>
    {' '}
    Tentative{' '}
  </Radio>
</Radios>
```

---

### Context-Aware Rendering

The `Radios` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw radio group).

#### Default (with label)

The simplest usage — the component automatically renders its own Field and Control wrappers.

```tsx live
<Radios label="RSVP">
  <Radio name="rsvp"> Attend </Radio>
  <Radio name="rsvp"> Decline </Radio>
  <Radio name="rsvp"> Tentative </Radio>
</Radios>
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="RSVP">
      <Field.Body>
        <Field>
          <Radios>
            <Radio name="rsvp2"> Attend </Radio>
            <Radio name="rsvp2"> Decline </Radio>
            <Radio name="rsvp2"> Tentative </Radio>
          </Radios>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual control, wrap in both Field and Control. The component detects both and renders only the raw radio group.

```tsx live
function example() {
  return (
    <Field horizontal label="RSVP">
      <Field.Body>
        <Field>
          <Control>
            <Radios>
              <Radio name="rsvp3"> Attend </Radio>
              <Radio name="rsvp3"> Decline </Radio>
              <Radio name="rsvp3"> Tentative </Radio>
            </Radios>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Accessibility

- The group is rendered as a `<div class="radios">` containing labeled radio buttons.
- Each child should be a `Radio` for proper labeling and accessibility.
- Use the same `name` for all radios in a group to ensure mutual exclusivity.

---

## Related Components

- [`Radio`](./radio.md): Individual radio button.
- [`Field`](./field.md): For labeled/grouped form fields.

---

## Additional Resources

- [Bulma Radios Documentation](https://bulma.io/documentation/form/radio/#grouped-radios)
- [Storybook: Radio Stories](https://bestax.io/storybook/?path=/story/form-radio--listofradios)
