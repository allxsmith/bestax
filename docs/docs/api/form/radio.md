---
title: Radio
sidebar_label: Radio
description: The `Radio` component provides a Bulma-styled radio button input with flexible labels and helper classes.
---

# Radio

## Overview

<!-- bestax:generated overview -->

The `Radio` component provides a Bulma-styled radio button input with flexible labels and helper classes.

<!-- /bestax:generated overview -->

Use it for mutually exclusive choices in forms—either standalone or grouped (with the same `name`).

---

## Import

<!-- bestax:generated import -->

```tsx
import { Radio, Radios, Control } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color of the radio button.                        |
| `size`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size of the radio button.                         |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper.                                |
| `disabled`  | `boolean`                                                                       | `false` | Whether the radio is disabled.                    |
| `className` | `string`                                                                        | —       | Additional CSS classes to apply.                  |
| `children`  | `React.ReactNode`                                                               | —       | The label/content for the radio.                  |
| `ref`       | `React.Ref<HTMLInputElement>`                                                   | —       | Forwarded to the underlying element.              |
| `...`       | All standard `<input>` attributes and Bulma helper props                        | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Radio` registers these variables on its own `.styled-radio` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                        | Sass Variable                | Default                    |
| ----------------------------------- | ---------------------------- | -------------------------- |
| `--bulma-radio-size`                | `$radio-size`                | `1.25em`                   |
| `--bulma-radio-border-width`        | `$radio-border-width`        | `2px`                      |
| `--bulma-radio-border-color`        | `$radio-border-color`        | `var(--bulma-border)`      |
| `--bulma-radio-background`          | `$radio-background`          | `transparent`              |
| `--bulma-radio-dot-color`           | `$radio-dot-color`           | `var(--bulma-scheme-main)` |
| `--bulma-radio-active-color`        | `$radio-active-color`        | `var(--bulma-primary)`     |
| `--bulma-radio-label-gap`           | `$radio-label-gap`           | `0.5em`                    |
| `--bulma-radio-focus-shadow-size`   | `$radio-focus-shadow-size`   | `0 0 0 0.125em`            |
| `--bulma-radio-transition-duration` | `$radio-transition-duration` | `var(--bulma-duration)`    |

<!-- /bestax:generated cssvars -->
