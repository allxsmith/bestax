---
title: Radios
sidebar_label: Radios
---

# Radios

## Overview

The `Radios` component wraps multiple `Radio` components in a Bulma-styled group. Use it for vertical lists of mutually exclusive choices, such as RSVP or selection lists.

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

This example demonstrates the `Radios` component wrapping multiple `Radio` children, all with the same `name` prop for mutual exclusivity. The `disabled` prop is set on each `Radio` to render them as non-interactive. Use this pattern for vertical lists of mutually exclusive options, such as RSVP or selection lists.

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
- [Storybook: Radio Stories](https://bestax.cc/storybook/?path=/story/form-radio--listofradios)
