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

```tsx live
<Control>
  <Radio name="mutuallyExclusive"> Yes </Radio>
  <Radio name="mutuallyExclusive"> No </Radio>
  <Radio name="mutuallyExclusive"> Maybe </Radio>
</Control>
```

---

### Default Selected Radio

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
- [Storybook: Radio Stories](https://bestax.cc/storybook/?path=/story/form-radio--mutuallyexclusive)
