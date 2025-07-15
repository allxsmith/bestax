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

```tsx live
<Level>
  <Level.Left>
    <Level.Item>
      <Title as="p" size="5" className="subtitle">
        <strong>Favorite Posts</strong> posts
      </Title>
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
      <strong>All</strong>
    </Level.Item>
    <Level.Item as="p">
      <a>From Followers</a>
    </Level.Item>
    <Level.Item as="p">
      <a>From Verified Followers</a>
    </Level.Item>
    <Level.Item as="p">
      <a>Replies</a>
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

```tsx live
<Level>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Posts</p>
      <Title as="p">1,234</Title>
    </div>
  </Level.Item>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Following</p>
      <Title as="p">6789</Title>
    </div>
  </Level.Item>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Followers</p>
      <Title as="p">123K</Title>
    </div>
  </Level.Item>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Likes</p>
      <Title as="p">9876</Title>
    </div>
  </Level.Item>
</Level>
```

---

### Centered Level Menu

```tsx live
<Level>
  <Level.Item as="p" hasTextCentered>
    <a className="link is-info">Getting Started</a>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <a className="link is-info">APIs</a>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <img
      src="https://bulma.io/assets/images/bulma-type.png"
      alt=""
      style={{ height: 30 }}
    />
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <a className="link is-info">Versions</a>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <a className="link is-info">FAQ</a>
  </Level.Item>
</Level>
```

---

### Mobile Level

```tsx live
<Level isMobile>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Posts</p>
      <Title as="p">1,234</Title>
    </div>
  </Level.Item>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Following</p>
      <Title as="p">4567</Title>
    </div>
  </Level.Item>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Followers</p>
      <Title as="p">123K</Title>
    </div>
  </Level.Item>
  <Level.Item hasTextCentered>
    <div>
      <p className="heading">Likes</p>
      <Title as="p">9876</Title>
    </div>
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
- [Storybook: Level Stories](https://bestax.cc/storybook/?path=/story/layout-level--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Level />`, `<Level.Left>`, `<Level.Right>`, and `<Level.Item>` for powerful utility-based styling.
:::
