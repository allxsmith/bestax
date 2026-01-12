---
title: Divider
sidebar_label: Divider
---

# Divider

## Overview

The `Divider` component renders a styled horizontal rule (`<hr>`) element with Bulma helper class integration. Use it to visually separate content sections with a clean horizontal line.

:::info
The Divider component is a thin wrapper around the HTML `<hr>` element, providing consistent Bulma styling and helper class support.
:::

---

## Import

```tsx
import { Divider } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| ...         | All standard `<hr>` and Bulma helper props                                                                                                                                                                                                                                               |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Divider

The default usage of the `Divider` component renders a standard horizontal rule.

```tsx live
<div>
  <Block>Content above the divider</Block>
  <Divider />
  <Block>Content below the divider</Block>
</div>
```

### With Vertical Margin

Use margin helpers to add spacing around the divider.

```tsx live
<div>
  <Block>Content above</Block>
  <Divider my="6" />
  <Block>Content below</Block>
</div>
```

### Colored Divider

Apply a background color to create a colored divider line.

```tsx live
<div>
  <Block>Content above</Block>
  <Divider bgColor="primary" />
  <Block>Content below</Block>
</div>
```

### All Colors

Display dividers in various Bulma theme colors.

```tsx live
<div>
  <Block>Default</Block>
  <Divider />
  <Block>Primary</Block>
  <Divider bgColor="primary" />
  <Block>Info</Block>
  <Divider bgColor="info" />
  <Block>Success</Block>
  <Divider bgColor="success" />
  <Block>Warning</Block>
  <Divider bgColor="warning" />
  <Block>Danger</Block>
  <Divider bgColor="danger" />
  <Block>End</Block>
</div>
```

### Separating Content Sections

Use dividers to create visual separation between major content sections.

```tsx live
<div>
  <Title size="4">Section One</Title>
  <Paragraph>This is the first section of content.</Paragraph>
  <Divider my="5" />
  <Title size="4">Section Two</Title>
  <Paragraph>This is the second section of content.</Paragraph>
  <Divider my="5" />
  <Title size="4">Section Three</Title>
  <Paragraph>This is the third section of content.</Paragraph>
</div>
```

---

## Accessibility

- **Visual Separation:** The `<hr>` element provides visual separation and has implicit semantic meaning as a thematic break.
- **Screen Readers:** Screen readers typically announce `<hr>` elements, so use them meaningfully to separate distinct content sections.
- **Decorative Use:** If the divider is purely decorative, consider using CSS borders instead.

:::info
Use dividers for thematic breaks between content sections, not just for visual spacing (use margin helpers for spacing alone).
:::

---

## Related Components

- [`Block`](./block.md): For content containers with vertical spacing.
- [`Box`](./box.md): For bordered content containers.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: hr element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr)
- [Storybook: Divider Stories](https://bestax.io/storybook/?path=/story/elements-divider--default)
