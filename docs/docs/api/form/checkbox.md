---
title: Checkbox
sidebar_label: Checkbox
description: The `Checkbox` component provides a Bulma-styled checkbox input.
---

# Checkbox

## Overview

<!-- bestax:generated overview -->

The `Checkbox` component provides a Bulma-styled checkbox input.

<!-- /bestax:generated overview -->

Pass the label as children; you can include plain text, links, or custom JSX. Use it for boolean choices and combine with the `Checkboxes` component for grouped options.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Checkboxes, Checkbox } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Checkbox

This example shows a simple `Checkbox` component for a single boolean choice. The label is provided as the `children` prop, and the checkbox is fully accessible and styled with Bulma.

```tsx live
<Checkbox> Stay Signed In </Checkbox>
```

### Checkbox With Link

This example demonstrates using the `Checkbox` component with a custom label that includes a link. The `children` prop can contain any React nodes, such as anchor tags, to create rich, accessible labels for agreements or terms.

```tsx live
<Checkbox>
  I have read and agree to the
  <a href="#" target="_blank" rel="noopener noreferrer">
    terms and conditions
  </a>
  .
</Checkbox>
```

### Disabled Checkbox

Set the `disabled` prop to render a non-interactive checkbox. This is useful for indicating unavailable options in forms, and the checkbox will appear visually disabled and cannot be toggled by the user.

```tsx live
<Checkbox disabled> Stay Signed In </Checkbox>
```

### Group/List of Checkboxes

This example uses the `Checkboxes` component to render a list of checkboxes. Each `Checkbox` receives its own label via the `children` prop. Use this pattern for lists of boolean options, such as tasks or preferences.

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

## Accessibility

- Each `Checkbox` is rendered as a `<label>` wrapping an `<input type="checkbox">` and the label text, for optimal accessibility.
- The clickable area includes both box and label by default.

---

## Related Components

- [`Checkboxes`](./checkboxes.md): For grouped checkboxes.
- [`Field`](./field.md): For labeled/structured forms.
- [Helper Props](../helpers/usebulmaclasses.md): For spacing, color, etc.

---

## Additional Resources

- [Bulma Checkbox Documentation](https://bulma.io/documentation/form/checkbox/)
- [Storybook: Checkbox Stories](https://bestax.io/storybook/?path=/story/form-checkbox--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color of the checkbox.                            |
| `size`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size of the checkbox.                             |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper.                                |
| `disabled`  | `boolean`                                                                       | `false` | Whether the checkbox is disabled.                 |
| `className` | `string`                                                                        | —       | Additional CSS classes to apply.                  |
| `children`  | `React.ReactNode`                                                               | —       | The label/content for the checkbox.               |
| `ref`       | `React.Ref<HTMLInputElement>`                                                   | —       | Forwarded to the underlying element.              |
| `...`       | All standard `<input>` attributes and Bulma helper props                        | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Checkbox` registers these variables on its own `.styled-checkbox` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                           | Sass Variable                   | Default                      |
| -------------------------------------- | ------------------------------- | ---------------------------- |
| `--bulma-checkbox-size`                | `$checkbox-size`                | `1.25em`                     |
| `--bulma-checkbox-border-width`        | `$checkbox-border-width`        | `2px`                        |
| `--bulma-checkbox-radius`              | `$checkbox-radius`              | `var(--bulma-radius-small)`  |
| `--bulma-checkbox-border-color`        | `$checkbox-border-color`        | `var(--bulma-border)`        |
| `--bulma-checkbox-background`          | `$checkbox-background`          | `transparent`                |
| `--bulma-checkbox-check-color`         | `$checkbox-check-color`         | `var(--bulma-scheme-invert)` |
| `--bulma-checkbox-active-color`        | `$checkbox-active-color`        | `var(--bulma-primary)`       |
| `--bulma-checkbox-label-gap`           | `$checkbox-label-gap`           | `0.5em`                      |
| `--bulma-checkbox-focus-shadow-size`   | `$checkbox-focus-shadow-size`   | `0 0 0 0.125em`              |
| `--bulma-checkbox-transition-duration` | `$checkbox-transition-duration` | `var(--bulma-duration)`      |
| `--bulma-checkbox-indeterminate-color` | `$checkbox-indeterminate-color` | `var(--bulma-primary)`       |

<!-- /bestax:generated cssvars -->
