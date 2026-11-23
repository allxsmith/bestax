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
      <Field label="Search posts" labelProps={{ htmlFor: 'level-find-post' }}>
        <Field hasAddons>
          <Control>
            <Input id="level-find-post" type="text" placeholder="Find a post" />
          </Control>
          <Control>
            <Button>Search</Button>
          </Control>
        </Field>
      </Field>
    </Level.Item>
  </Level.Left>
  <Level.Right>
    <Level.Item as="p">
      <Strong>All</Strong>
    </Level.Item>
    <Level.Item as="p">
      <Link href="#published">Published</Link>
    </Level.Item>
    <Level.Item as="p">
      <Link href="#drafts">Drafts</Link>
    </Level.Item>
    <Level.Item as="p">
      <Link href="#deleted">Deleted</Link>
    </Level.Item>
    <Level.Item as="p">
      <Button color="success" as="a" href="#new-post">
        New
      </Button>
    </Level.Item>
  </Level.Right>
</Level>
```

---

### Centered Level (Statistics)

This example demonstrates using the `Level` component to create a centered statistics display. Each `Level.Item` in this example is centered and contains a small label and a value, making it suitable for displaying key metrics or statistics. A row of figures isn't navigation, so the level renders a `<div>` with `as="div"` rather than its default `<nav>`.

Bulma 0.9 drew that label with a `heading` class, which Bulma v1 dropped, so the label here is a `Paragraph` made small, uppercase, and semibold with helper props.

:::tip
For a row of figures in an app, reach for [`Stats`](../elements/stats.md) instead. Nothing in a level ties a value to its label, while `Stats` makes the row one description list, and each [`Stat`](../elements/stat.md) writes its number the way the locale does.
:::

```tsx live
<Level as="div">
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Posts
      </Paragraph>
      <Title as="p">1,234</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Following
      </Paragraph>
      <Title as="p">6,789</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Followers
      </Paragraph>
      <Title as="p">123K</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Likes
      </Paragraph>
      <Title as="p">9,876</Title>
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
    <Link href="#getting-started" textColor="info">
      Getting Started
    </Link>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <Link href="#apis" textColor="info">
      APIs
    </Link>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <img src="/img/bestax-type.svg" alt="Bestax" style={{ height: 30 }} />
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <Link href="#versions" textColor="info">
      Versions
    </Link>
  </Level.Item>
  <Level.Item as="p" hasTextCentered>
    <Link href="#faq" textColor="info">
      FAQ
    </Link>
  </Level.Item>
</Level>
```

---

### Mobile Level

This example demonstrates the `Level` component's mobile layout. A level stacks its items vertically below tablet by default; setting the `isMobile` prop keeps them laid out horizontally on mobile too. It keeps `Level.Left` and `Level.Right` side by side as well, but not the items inside them, which still stack on a phone, as Bulma 1 draws them. For a row on a phone, put the items straight in the level, as this example does. Bulma doesn't let a level's items shrink, so keep an `isMobile` level to what fits a phone: a row that doesn't fit runs past the edge of the screen, where Bulma's default `overflow-x: hidden` on the page cuts it off (WCAG 1.4.10 Reflow). Like the statistics above, these figures aren't navigation, so the level takes `as="div"`.

```tsx live
<Level as="div" isMobile>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Posts
      </Paragraph>
      <Title as="p">1,234</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Following
      </Paragraph>
      <Title as="p">4,567</Title>
    </Block>
  </Level.Item>
  <Level.Item hasTextCentered>
    <Block>
      <Paragraph
        textSize="7"
        textTransform="uppercase"
        textWeight="semibold"
        mb="1"
      >
        Followers
      </Paragraph>
      <Title as="p">123K</Title>
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
      <a href="#published">Published</a>
    </Level.Item>
    <Level.Item as="p">
      <Button color="success" as="a" href="#new-post">
        New
      </Button>
    </Level.Item>
  </Level.Right>
</Level>
```

---

## Accessibility

- `Level` renders a `<nav>` by default, as Bulma's markup does. A `nav` is a navigation landmark, which a screen reader user can list and jump to, so keep it for a row of links. A row that isn't navigation, such as the statistics above, takes `as="div"`, which adds no landmark. `as="header"` suits a level that opens a section and `as="footer"` one that closes it.
- Items can be rendered as `<div>`, `<p>`, or `<a>`. Use `as="a"` for links, with an `href`: an `<a>` without one isn't a link, and Tab skips it. Provide clear text or accessible labels.
- Below tablet a level's items stack. `isMobile` keeps its own items, and its `Level.Left` and `Level.Right`, in a row there, though the items inside `Level.Left` and `Level.Right` still stack. Bulma doesn't let a level's items shrink, so a row that doesn't fit a 320px screen runs past its edge, where Bulma's default `overflow-x: hidden` on the page cuts it off (WCAG 1.4.10 Reflow). Keep it for a row that fits.
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
You can use [Bulma helper props](../helpers/usebulmaclasses.md) with `<Level />`, `<Level.Left>`, `<Level.Right>`, and `<Level.Item>` for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`        | `'nav'` \| `'div'` \| `'header'` \| `'footer'`                          | `'nav'` | HTML element to render (default: `nav`, as in Bulma's markup). A `nav` is a `navigation` landmark, so keep it for a row of links. A row that is not navigation, such as figures or a toolbar, takes `div`, which is no landmark. `header` suits a level that opens a section and `footer` one that closes it. A `header` is a `banner` landmark, and a `footer` a `contentinfo` one, only when no `section`, `article`, `aside`, `nav` or `main` is around it.                                                                      |
| `isMobile`  | `boolean`                                                               | `false` | Keeps the level's own items, and its `Level.Left` and `Level.Right`, in a row on mobile (Bulma `is-mobile`), where they otherwise stack below tablet. Items inside `Level.Left` and `Level.Right` still stack there, as Bulma 1 draws them: for a row on a phone, put the items straight in the level. Bulma doesn't let a level's items shrink, so a row that doesn't fit a 320px screen runs past its edge, where Bulma's default `overflow-x: hidden` on the page cuts it off (WCAG 1.4.10 Reflow): keep it for a row that fits. |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier for the level.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `className` | `string`                                                                | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `children`  | `React.ReactNode`                                                       | —       | Level content (`Level.Left`, `Level.Right`, `Level.Item`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Subcomponents:**

- `Level.Left`: Left-aligned content. Its items stack below tablet, in a level with `isMobile` too.
- `Level.Right`: Right-aligned content. Its items stack below tablet, in a level with `isMobile` too.
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
| `...`             | All standard `<a>` / `<div>` / `<p>` attributes and Bulma helper props  | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Level` registers these variables on its own `.level` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                 | Sass Variable         | Default                                  |
| ---------------------------- | --------------------- | ---------------------------------------- |
| `--bulma-level-item-spacing` | `$level-item-spacing` | `calc(var(--bulma-block-spacing) * 0.5)` |

<!-- /bestax:generated cssvars -->
