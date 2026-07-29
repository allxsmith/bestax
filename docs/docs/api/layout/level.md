---
title: Level
sidebar_label: Level
description: The `Level` component provides a flexible horizontal layout for your Bulma React UI, perfect for aligning items on the left and right, distributing items evenly, or centering statistics and controls.
---

# Level

## Overview

<!-- bestax:generated overview -->

The `Level` component provides a flexible horizontal layout for your Bulma React UI, perfect for aligning items on the left and right, distributing items evenly, or centering statistics and controls.

<!-- /bestax:generated overview -->

It supports Bulma color and background helpers, mobile responsiveness, and has subcomponents for left, right, and item sections.

:::info
Use `Level` for toolbars, status bars, or summary sections where you want to align content at the start, center, and end of a horizontal row.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Level } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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

### Compound (dot-notation) usage

`LevelLeft`, `LevelRight`, and `LevelItem` are also available as `Level.Left`, `Level.Right`, and `Level.Item`, so the whole level can be composed from the single `Level` import.

```tsx live
<Level>
  <Level.Left>
    <Level.Item>
      <Title as="p" size="5">
        <strong>All Posts</strong>
      </Title>
    </Level.Item>
  </Level.Left>
  <Level.Right>
    <Level.Item as="p">
      <a>Published</a>
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

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                                |
| ----------- | ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| `isMobile`  | `boolean`                                                               | `false` | Enables mobile layout (stacks vertically on mobile).       |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier for the level.                        |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma background color helper.                             |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma text color helper.                                   |
| `className` | `string`                                                                | —       | Additional CSS classes.                                    |
| `children`  | `React.ReactNode`                                                       | —       | Level content (`Level.Left`, `Level.Right`, `Level.Item`). |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)          |

**Subcomponents:**

- `Level.Left`: Left-aligned content.
- `Level.Right`: Right-aligned content.
- `Level.Item`: Individual item, can be rendered as `div`, `p`, or `a`.

### Level.Left

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier.                             |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color.                                 |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color.                                       |
| `className` | `string`                                                                | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                                       | —       | Content.                                          |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Level.Right

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier.                             |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color.                                 |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color.                                       |
| `className` | `string`                                                                | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                                       | —       | Content.                                          |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Level.Item

| Prop              | Type                                                                    | Default | Description                                       |
| ----------------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `as`              | `'div'` \| `'p'` \| `'a'`                                               | `'div'` | Element type to render.                           |
| `hasTextCentered` | `boolean`                                                               | `false` | Center the text in the item.                      |
| `color`           | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier.                             |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color.                                 |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color.                                       |
| `className`       | `string`                                                                | —       | Additional CSS classes.                           |
| `children`        | `React.ReactNode`                                                       | —       | Content.                                          |
| `href`            | `string`                                                                | —       | Href for "a" tag.                                 |
| `target`          | `string`                                                                | —       | Target for "a" tag                                |
| `rel`             | `string`                                                                | —       | Rel for "a" tag                                   |
| `...`             | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Level` registers these variables on its own `.level` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                 | Sass Variable         | Default                                  |
| ---------------------------- | --------------------- | ---------------------------------------- |
| `--bulma-level-item-spacing` | `$level-item-spacing` | `calc(var(--bulma-block-spacing) * 0.5)` |

<!-- /bestax:generated cssvars -->
