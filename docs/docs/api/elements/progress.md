---
title: Progress
sidebar_label: Progress
---

# Progress

## Overview

The `Progress` component displays a Bulma-styled progress bar. It supports color and size modifiers, value/max attributes, custom content, and all Bulma helper props for spacing and layout.

:::info
Use `Progress` for visualizing task completion, loading states, or quantitative user feedback.
:::

---

## Import

```tsx
import { Progress } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                             | Default | Description                                      |
| ----------- | ------------------------------------------------ | ------- | ------------------------------------------------ |
| `className` | `string`                                         | —       | Additional CSS classes.                          |
| `color`     | `Bulma color` (e.g. `'primary'`, `'info'`, etc.) | —       | Bulma color modifier for the progress bar.       |
| `size`      | `'small' \| 'medium' \| 'large'`                 | —       | Size modifier for the progress bar.              |
| `value`     | `number`                                         | —       | Current value of the progress bar.               |
| `max`       | `number`                                         | —       | Maximum value of the progress bar.               |
| `children`  | `React.ReactNode`                                | —       | Optional custom content inside the progress bar. |
| ...         | All standard `<progress>` and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Progress

```tsx
<Progress value={50} max={100} />
```

### Colored Progress

```tsx
<Progress color="primary" value={75} max={100} />
<Progress color="success" value={90} max={100} />
<Progress color="warning" value={30} max={100} />
<Progress color="danger" value={10} max={100} />
<Progress color="info" value={60} max={100} />
<Progress color="link" value={80} max={100} />
```

### Sizing

```tsx
<Progress size="small" value={50} max={100} />
<Progress size="medium" value={50} max={100} />
<Progress size="large" value={50} max={100} />
```

### With Margin

```tsx
<Progress value={50} max={100} m="4" />
```

### Indeterminate Progress

```tsx
<Progress color="primary" max={100} />
```

### Custom Content

```tsx
<Progress value={50} max={100}>
  50% Complete
</Progress>
```

### Multiple Indeterminate

```tsx
<>
  <Progress className="is-small is-primary" max={100} />
  <Progress className="is-danger" max={100} />
  <Progress className="is-medium is-dark" max={100} />
  <Progress className="is-large is-info" max={100} />
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
- [Storybook: Progress Stories](https://bestax.cc/storybook/?path=/story/elements-progress--default)
