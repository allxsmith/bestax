---
title: Level
sidebar_label: Level
---

# Level

## Overview

The `Level` component provides a flexible horizontal layout for your Bulma React UI, perfect for aligning items on the left and right, distributing items evenly, or centering statistics and controls. It supports Bulma color and background helpers, mobile responsiveness, and has subcomponents for left, right, and item sections.

:::info
Use `Level` for toolbars, status bars, or summary sections where you want to align content at the start, center, and end of a horizontal row.
:::

---

## Import

```tsx
import { Level } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| `isMobile`  | `boolean`                                                                                                                                                                                                                                                                                | `false` | Enables mobile layout (stacks vertically on mobile).       |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma color modifier for the level.                        |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma background color helper.                             |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma text color helper.                                   |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                    |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Level content (`Level.Left`, `Level.Right`, `Level.Item`). |
| ...         | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 |         | (See [Helper Props](../helpers/usebulmaclasses))           |

**Subcomponents:**

- `Level.Left`: Left-aligned content.
- `Level.Right`: Right-aligned content.
- `Level.Item`: Individual item, can be rendered as `div`, `p`, or `a`.

---

## Usage

### Default Level

This example shows the `Level` component with `Level.Left` and `Level.Right` subcomponents. Use `Level` to align content horizontally, such as toolbars, status bars, or summary sections. The `Level.Item` subcomponent is used for each item in the left or right section.

```tsx live
<Level>
  <Level.Left>
    <Level.Item>
      <SubTitle as="p" size="5">
        <Strong>Favorite Posts</Strong>
      </SubTitle>
    </Level.Item>
    <Level.Item>
      <Field hasAddons>
        <Control>
          <Input type="text" placeholder="Find a post" />
        </Control>
        <Control>
          <Button>Search</Button>
        </Control>
      </Field>
    </Level.Item>
  </Level.Left>
  <Level.Right>
    <Level.Item as="p">
      <Strong>All</Strong>
    </Level.Item>
    <Level.Item as="p">
      <Link>Published</Link>
    </Level.Item>
    <Level.Item as="p">
      <Link>Drafts</Link>
    </Level.Item>
    <Level.Item as="p">
      <Link>Deleted</Link>
    </Level.Item>
    <Level.Item as="p">
      <Button color="success" as="a">
        New
      </Button>
    </Level.Item>
  </Level.Right>
</Level>
```

---

### Centered Level (Statistics)

This example demonstrates using the `Level` component to create a centered statistics display. Each `Level.Item` in this example is centered and contains a heading and a value, making it suitable for displaying key metrics or statistics.

```tsx live
<Level>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Posts</Paragraph>
      <Title as="p">1,234</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Following</Paragraph>
      <Title as="p">6789</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Followers</Paragraph>
      <Title as="p">123K</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Likes</Paragraph>
      <Title as="p">9876</Title>
    </Block>
  </Level.Item>
</Level>
```

---

### Centered Level Menu

This example shows how to create a centered navigation menu using the `Level` component. Each item in the menu is centered and can be used for navigation links or important actions.

```tsx live
<Level>
  <Level.Item as="p" hasTextCentered>
    <Link textColor="info">Getting Started</Link>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <Link textColor="info">APIs</Link>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <img src="/img/bestax-type.svg" alt="Bestax" style={{ height: 30 }} />
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <Link textColor="info">Versions</Link>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <Link textColor="info">FAQ</Link>
  </Level.Item>
</Level>
```

---

### Mobile Level

This example demonstrates the `Level` component's mobile layout. When the `isMobile` prop is set, the `Level` component stacks its items vertically, making it suitable for mobile interfaces.

```tsx live
<Level isMobile>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Posts</Paragraph>
      <Title as="p">1,234</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Following</Paragraph>
      <Title as="p">4567</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Followers</Paragraph>
      <Title as="p">123K</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph className="heading">Likes</Paragraph>
      <Title as="p">9876</Title>
    </Block>
  </Level.Item>
</Level>
```

---

## Accessibility

- The root `Level` renders as a semantic `<nav>` for grouping and navigation.
- Items can be rendered as `<div>`, `<p>`, or `<a>`. Use `as="a"` for links, and provide clear text or accessible labels.
- Use Bulma helper props for spacing and color to improve contrast and readability.

:::note
For best accessibility, use semantic elements for headings/content within items, and ensure interactive elements (like `Button` or links) are focusable and labeled.
:::

---

## Related Components

- [`Button`](../elements/button.md): Often used inside `Level.Item`.
- [`Title`](../elements/title.md): For headings/statistics in level items.
- [`Field`](../form/field.md) and [`Input`](../form/input.md): For search bars or controls in toolbars.
- [Helper Props](../helpers/usebulmaclasses.md): Use Bulma utility helpers for spacing, color, etc.

---

## Additional Resources

- [Bulma Level Documentation](https://bulma.io/documentation/layout/level/)
- [Storybook: Level Stories](https://bestax.io/storybook/?path=/story/layout-level--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Level />`, `<Level.Left>`, `<Level.Right>`, and `<Level.Item>` for powerful utility-based styling.
:::
