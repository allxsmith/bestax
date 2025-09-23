---
title: Radio
sidebar_label: Radio
---

# Radio

## Overview

The `Radio` component provides a Bulma-styled radio button input with flexible labels and helper classes. Use it for mutually exclusive choices in forms—either standalone or grouped (with the same `name`).

---

## Import

```tsx
import { Radio, Radios, Control } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                       | Description                                      |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `disabled`  | `boolean`                                                  | Whether the radio is disabled.                   |
| `className` | `string`                                                   | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                                          | Label/content for the radio.                     |
| ...         | All standard `<input type="radio">` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Mutually Exclusive Radios (Only One Can Be Selected)

This example shows how to use the `Radio` component for mutually exclusive choices. Assign the same `name` prop to each `Radio` in a group to ensure only one can be selected at a time. Use within a `Control` for proper Bulma styling.

```tsx live
<Control>
  <Radio name="mutuallyExclusive"> Yes </Radio>
  <Radio name="mutuallyExclusive"> No </Radio>
  <Radio name="mutuallyExclusive"> Maybe </Radio>
</Control>
```

---

### Default Selected Radio

Set the `defaultChecked` prop on a `Radio` to make it selected by default. This is useful for pre-selecting a common or recommended option in a group.

```tsx live
<Control>
  <Radio name="pet"> Cat </Radio>
  <Radio name="pet" defaultChecked>
    {' '}
    Dog{' '}
  </Radio>
</Control>
```

---

### Disabled Radios

Use the `disabled` prop to render radios that cannot be selected. This is helpful for indicating unavailable options in a group.

```tsx live
<Control>
  <Radio name="response" disabled>
    {' '}
    Attend{' '}
  </Radio>
  <Radio name="response" disabled>
    {' '}
    Decline{' '}
  </Radio>
  <Radio name="response" disabled>
    {' '}
    Tentative{' '}
  </Radio>
</Control>
```

---

### List of Radios (Grouped with the `Radios` Wrapper)

Render a list of radios using the `Radios` wrapper component. This is useful for grouping related radio buttons together, especially when they share the same `name` prop. In this example, all radios are disabled.

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

- Each `Radio` is rendered as a `<label>` wrapping an `<input type="radio">` and the label text, for optimal accessibility.
- Use the same `name` prop for a group of radios to ensure only one can be selected.

---

## Related Components

- [`Radios`](./radios.md): For grouped radio buttons.
- [`Field`](./field.md): For labeled/grouped form fields.
- [Helper Props](../helpers/usebulmaclasses.md)

---

## Additional Resources

- [Bulma Radio Documentation](https://bulma.io/documentation/form/radio/)
- [Storybook: Radio Stories](https://bestax.io/storybook/?path=/story/form-radio--mutuallyexclusive)
