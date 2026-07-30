---
title: Tooltip
sidebar_label: Tooltip
description: The `Tooltip` component displays helpful information when users hover over or focus on an element.
---

# Tooltip

## Overview

<!-- bestax:generated overview -->

The `Tooltip` component displays helpful information when users hover over or focus on an element.

<!-- /bestax:generated overview -->

It supports multiple positions, colors, and styles. Perfect for providing additional context, abbreviation expansions, or action descriptions.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Tooltip } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Tooltip

A simple tooltip on a button.

```tsx live
function example() {
  return (
    <Tooltip label="This is helpful information">
      <Button>Hover me</Button>
    </Tooltip>
  );
}
```

---

### Positions

Tooltip in different positions around the trigger.

```tsx live
function example() {
  return (
    <Buttons>
      <Tooltip label="Top tooltip" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip label="Bottom tooltip" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip label="Left tooltip" position="left">
        <Button>Left</Button>
      </Tooltip>
      <Tooltip label="Right tooltip" position="right">
        <Button>Right</Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### Colors

Tooltip with different color variants.

```tsx live
function example() {
  return (
    <Buttons>
      <Tooltip label="Primary" color="primary">
        <Button color="primary">Primary</Button>
      </Tooltip>
      <Tooltip label="Link" color="link">
        <Button color="link">Link</Button>
      </Tooltip>
      <Tooltip label="Info" color="info">
        <Button color="info">Info</Button>
      </Tooltip>
      <Tooltip label="Success" color="success">
        <Button color="success">Success</Button>
      </Tooltip>
      <Tooltip label="Warning" color="warning">
        <Button color="warning">Warning</Button>
      </Tooltip>
      <Tooltip label="Danger" color="danger">
        <Button color="danger">Danger</Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### Multiline

Tooltip that wraps to multiple lines for longer content.

```tsx live
function example() {
  return (
    <Block p="5">
      <Tooltip
        label="This is a longer tooltip that wraps to multiple lines. It's useful for displaying more detailed information."
        multiline
      >
        <Button>Hover for more info</Button>
      </Tooltip>
    </Block>
  );
}
```

---

### Always Visible

Tooltip that's always visible, regardless of hover state.

```tsx live
function example() {
  return (
    <Block p="5">
      <Tooltip label="I'm always visible!" active color="info">
        <Button>Always visible tooltip</Button>
      </Tooltip>
    </Block>
  );
}
```

---

### Dashed Underline

Tooltip on text with a dashed underline to indicate more info is available.

```tsx live
function example() {
  return (
    <Paragraph>
      The term{' '}
      <Tooltip label="Application Programming Interface" dashed>
        <Span>API</Span>
      </Tooltip>{' '}
      is commonly used in software development.
    </Paragraph>
  );
}
```

---

### With Delay

Tooltip that appears after a delay.

```tsx live
function example() {
  return (
    <Buttons>
      <Tooltip label="No delay" delay={0}>
        <Button>No delay</Button>
      </Tooltip>
      <Tooltip label="500ms delay" delay={500}>
        <Button>500ms delay</Button>
      </Tooltip>
      <Tooltip label="1 second delay" delay={1000}>
        <Button>1s delay</Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### On Icons

Tooltips on icon buttons for action descriptions.

```tsx live
function example() {
  return (
    <Block display="flex" gap="5" p="6">
      <Tooltip label="Delete item" color="danger" position="bottom">
        <Span cursor="pointer">
          <Icon name="fas fa-trash" />
        </Span>
      </Tooltip>
      <Tooltip label="Edit item" color="info" position="bottom">
        <Span cursor="pointer">
          <Icon name="fas fa-edit" />
        </Span>
      </Tooltip>
      <Tooltip label="Download" color="success" position="bottom">
        <Span cursor="pointer">
          <Icon name="fas fa-download" />
        </Span>
      </Tooltip>
    </Block>
  );
}
```

---

### Form Field Help

Using tooltips to provide help for form fields.

```tsx live
function example() {
  return (
    <Field>
      <label className="label">
        Password{' '}
        <Tooltip
          label="Must be at least 8 characters with one number and one special character"
          multiline
          color="info"
        >
          <Span cursor="help">
            <Icon name="fas fa-question-circle" size="small" />
          </Span>
        </Tooltip>
      </label>
      <Control>
        <Input type="password" placeholder="Enter password" />
      </Control>
    </Field>
  );
}
```

---

### Abbreviations

Using tooltips to explain abbreviations in text.

```tsx live
function example() {
  return (
    <Paragraph style={{ lineHeight: 1.8 }}>
      Hover over{' '}
      <Tooltip label="Cascading Style Sheets" color="info" dashed>
        <Span>CSS</Span>
      </Tooltip>{' '}
      or{' '}
      <Tooltip label="HyperText Markup Language" color="info" dashed>
        <Span>HTML</Span>
      </Tooltip>{' '}
      to see their full names.
    </Paragraph>
  );
}
```

---

## Related

- [Icon](../elements/icon.md) - Icon component
- [Button](../elements/button.md) - Button component

---

## Accessibility

- Tooltip content has `role="tooltip"` for screen reader announcement
- Has `aria-hidden` that toggles based on visibility
- Tooltip shows on both hover and focus for keyboard users
- The `dashed` style provides a visual cue that more information is available

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                     | Default | Description                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `label`            | `string`                                                                                                 | —       | The tooltip text content.                         |
| `content`          | `React.ReactNode`                                                                                        | —       | Rich tooltip content (alternative to `label`).    |
| `position`         | `'top'` \| `'bottom'` \| `'left'` \| `'right'` \| `'auto'`                                               | `'top'` | Position of the tooltip. Default: 'top'.          |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'dark'` \| `'light'` | —       | Color variant for the tooltip.                    |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                     | —       | Size of the tooltip.                              |
| `active`           | `boolean`                                                                                                | `false` | Force tooltip to be always visible.               |
| `multiline`        | `boolean`                                                                                                | `false` | Allow tooltip to wrap to multiple lines.          |
| `animated`         | `boolean`                                                                                                | `true`  | Enable fade animation. Default: true.             |
| `square`           | `boolean`                                                                                                | `false` | Use square corners instead of rounded.            |
| `dashed`           | `boolean`                                                                                                | `false` | Show dashed underline on trigger.                 |
| `delay`            | `number`                                                                                                 | `0`     | Delay before showing tooltip (ms).                |
| `closeDelay`       | `number`                                                                                                 | `0`     | Delay in ms before hiding the tooltip.            |
| `tooltipClassName` | `string`                                                                                                 | —       | Additional classes for the tooltip element.       |
| `children`         | `React.ReactNode`                                                                                        | —       | The element that triggers the tooltip.            |
| `className`        | `string`                                                                                                 | —       | Additional CSS classes.                           |
| `...`              | All standard `<span>` attributes and Bulma helper props                                                  | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tooltip` registers these variables on its own `.tooltip` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                   | Sass Variable           | Default           |
| ------------------------------ | ----------------------- | ----------------- |
| `--bulma-tooltip-dashed-color` | `$tooltip-dashed-color` | `hsl(0, 0%, 60%)` |

<!-- /bestax:generated cssvars -->
