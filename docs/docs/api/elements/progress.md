---
title: Progress
sidebar_label: Progress
description: The `Progress` component displays a Bulma-styled progress bar.
---

# Progress

## Overview

<!-- bestax:generated overview -->

The `Progress` component displays a Bulma-styled progress bar.

<!-- /bestax:generated overview -->

It supports color and size modifiers, value/max attributes, custom content, and all Bulma helper props for spacing and layout.

:::info
Use `Progress` for visualizing task completion, loading states, or quantitative user feedback.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Progress } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Progress

The default usage of the `Progress` component displays a horizontal progress bar. Set the `value` and `max` props to indicate completion percentage or progress toward a goal.

```tsx live
<Progress value={50} max={100} />
```

### Colored Progress

Set the `color` prop to visually distinguish different types of progress. Use color variants like `primary`, `success`, `warning`, `danger`, `info`, or `link` to match the context of the task or status.

```tsx live
<>
  <Progress color="primary" value={75} max={100} />
  <Progress color="success" value={90} max={100} />
  <Progress color="warning" value={30} max={100} />
  <Progress color="danger" value={10} max={100} />
  <Progress color="info" value={60} max={100} />
  <Progress color="link" value={80} max={100} />
</>
```

### Sizing

Adjust the size of the progress bar using the `size` prop. Options include `small`, `medium`, or `large` to fit the design requirements of your application.

```tsx live
<>
  <Progress size="small" value={50} max={100} />
  <Progress size="medium" value={50} max={100} />
  <Progress size="large" value={50} max={100} />
</>
```

### With Margin

Utilize Bulma's spacing helpers by adding margin props like `m="4"` to control the progress bar's margin. This example applies a margin of 4 units.

```tsx live
<Progress value={50} max={100} m="4" />
```

### Indeterminate Progress

For tasks with unknown progress, use the indeterminate state by omitting the `value` prop. This example shows a primary colored indeterminate progress bar.

```tsx live
<Progress color="primary" max={100} />
```

### Custom Content

The `Progress` component allows for custom content inside the progress bar. This example shows how to display text content indicating the completion percentage.

```tsx live
<Progress value={50} max={100}>
  50% Complete
</Progress>
```

### Multiple Indeterminate

Easily create multiple indeterminate progress bars with different sizes and colors. This example demonstrates a combination of small, medium, and large indeterminate bars.

```tsx live
<>
  <Progress size="small" color="primary" max={100} />
  <Progress color="danger" max={100} />
  <Progress size="medium" color="dark" max={100} />
  <Progress size="large" color="info" max={100} />
</>
```

---

## Accessibility

- **Role:** The `<progress>` element is natively accessible.
- **Labeling:** Always provide context for screen readers (e.g., with `aria-label` or visible text).
- **Indeterminate:** Omit the `value` prop for indeterminate progress bars.

:::warning
Ensure your progress bars have sufficient color contrast for users with visual impairments.
:::

---

## Related Components

- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Progress Documentation](https://bulma.io/documentation/elements/progress/)
- [Storybook: Progress Stories](https://bestax.io/storybook/?path=/story/elements-progress--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                        | Default | Description                                       |
| ----------- | ----------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                    | —       | Additional CSS classes to apply.                  |
| `color`     | [Bulma color](../helpers/valid-values.md)                   | —       | Bulma color modifier for the progress bar.        |
| `size`      | `'small'` \| `'medium'` \| `'large'`                        | —       | Size modifier for the progress bar.               |
| `value`     | `number`                                                    | —       | Current value of the progress bar.                |
| `max`       | `number`                                                    | —       | Maximum value of the progress bar.                |
| `children`  | `React.ReactNode`                                           | —       | Optional custom content inside the progress bar.  |
| `...`       | All standard `<progress>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Progress` registers these variables on its own `.progress` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                              | Sass Variable                      | Default                       |
| ----------------------------------------- | ---------------------------------- | ----------------------------- |
| `--bulma-progress-border-radius`          | `$progress-border-radius`          | `var(--bulma-radius-rounded)` |
| `--bulma-progress-bar-background-color`   | `$progress-bar-background-color`   | `var(--bulma-border-weak)`    |
| `--bulma-progress-value-background-color` | `$progress-value-background-color` | `var(--bulma-text)`           |
| `--bulma-progress-indeterminate-duration` | `$progress-indeterminate-duration` | `1.5s`                        |

<!-- /bestax:generated cssvars -->
