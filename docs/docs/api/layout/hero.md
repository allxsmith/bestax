---
title: Hero
sidebar_label: Hero
description: The `Hero` component provides a responsive, flexible, and visually striking section for your Bulma React UI.
---

# Hero

## Overview

<!-- bestax:generated overview -->

The `Hero` component provides a responsive, flexible, and visually striking section for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports all Bulma hero color and size modifiers, including fullheight, background helpers, and composition with `Hero.Head`, `Hero.Body`, and `Hero.Foot` subcomponents. Use it to showcase prominent content, headers, or landing sections.

:::info
You can use `Hero` as a simple colored banner, or compose it with `Hero.Head`, `Hero.Body`, and `Hero.Foot` for complex layouts with navigation, content, and tabs.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Hero } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Hero

This example shows a standard `Hero` component with a centered title and subtitle. Use the `Hero` component to create visually striking banners or headers for your app. The `Hero.Body` subcomponent centers the content vertically.

```tsx live
<Hero>
  <Hero.Body>
    <Container>
      <Title>Hero title</Title>
      <SubTitle>Hero subtitle</SubTitle>
    </Container>
  </Hero.Body>
</Hero>
```

---

### All Colors

This example demonstrates the `color` prop, which applies Bulma color modifiers to the hero section. Use different `color` values to visually distinguish sections or indicate context.

```tsx live
<>
  <Hero color="link">
    <Hero.Body>
      <Container>
        <Title>Hero title (link)</Title>
        <SubTitle>Hero subtitle (link)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="primary">
    <Hero.Body>
      <Container>
        <Title>Hero title (primary)</Title>
        <SubTitle>Hero subtitle (primary)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="info">
    <Hero.Body>
      <Container>
        <Title>Hero title (info)</Title>
        <SubTitle>Hero subtitle (info)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="success">
    <Hero.Body>
      <Container>
        <Title>Hero title (success)</Title>
        <SubTitle>Hero subtitle (success)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="warning">
    <Hero.Body>
      <Container>
        <Title>Hero title (warning)</Title>
        <SubTitle>Hero subtitle (warning)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="danger">
    <Hero.Body>
      <Container>
        <Title>Hero title (danger)</Title>
        <SubTitle>Hero subtitle (danger)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
</>
```

---

### All Sizes

This example showcases the `size` prop to demonstrate the different predefined hero sizes. Combine with the `color` prop for varied visual effects.

```tsx live
<>
  <Hero color="info" size="small">
    <Hero.Body>
      <Container>
        <Title>Hero title (small)</Title>
        <SubTitle>Hero subtitle (small)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="primary" size="medium">
    <Hero.Body>
      <Container>
        <Title>Hero title (medium)</Title>
        <SubTitle>Hero subtitle (medium)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="success" size="large">
    <Hero.Body>
      <Container>
        <Title>Hero title (large)</Title>
        <SubTitle>Hero subtitle (large)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
  <Hero color="danger" size="fullheight">
    <Hero.Body>
      <Container>
        <Title>Hero title (fullheight)</Title>
        <SubTitle>Hero subtitle (fullheight)</SubTitle>
      </Container>
    </Hero.Body>
  </Hero>
</>
```

---

### Fullheight with Navbar

This example demonstrates using the `fullheightWithNavbar` prop to create a hero that takes the full height of the screen, adjusting for the height of the navbar. This is useful for landing pages or sections that require prominent visibility.

```tsx live
<>
  <Navbar>
    <Container>
      <Navbar.Menu id="navMenu">
        <Navbar.Start>
          <Navbar.Item as="a">Getting Started</Navbar.Item>
          <Navbar.Item as="a">APIs</Navbar.Item>
          <Navbar.Item as="a">Blog</Navbar.Item>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item as="span">
            <Button color="primary" isInverted as="a" mx="2">
              Github
            </Button>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Container>
  </Navbar>
  <Hero color="link" fullheightWithNavbar>
    <Hero.Body>
      <Container>
        <Title>Fullheight with navbar</Title>
      </Container>
    </Hero.Body>
  </Hero>
</>
```

---

### Fullheight with Head, Body, and Foot

This example shows a comprehensive usage of the `Hero` component with all its subcomponents: `Hero.Head`, `Hero.Body`, and `Hero.Foot`. It's a complete layout for a hero section, including navigation, main content, and footer tabs.

```tsx live
<Hero color="primary" size="medium">
  <Hero.Head>
    <Navbar>
      <Container>
        <Navbar.Brand>
          <Navbar.Item as="a">
            <Image src="/img/bestax-type-white.svg" alt="Bestax" mx="2" />
          </Navbar.Item>
          <Navbar.Burger />
        </Navbar.Brand>
        <Navbar.Menu id="navbarMenuHeroA">
          <Navbar.End>
            <Navbar.Item as="a" active>
              Getting Started
            </Navbar.Item>
            <Navbar.Item as="a">APIs</Navbar.Item>
            <Navbar.Item as="a">Blog</Navbar.Item>
            <Navbar.Item as="span">
              <Button color="primary" isInverted as="a" mx="2">
                <Icon
                  library="fa"
                  name="github"
                  variant="brands"
                  ariaLabel="github"
                />
                <Span>Github</Span>
              </Button>
            </Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Container>
    </Navbar>
  </Hero.Head>

  <Hero.Body>
    <Container textAlign="centered">
      <Title>Bestax</Title>
      <SubTitle>A Bulma Component Library</SubTitle>
    </Container>
  </Hero.Body>

  <Hero.Foot>
    <Tabs>
      <Container>
        <Tabs.List>
          <Tabs.Item>
            <a>Elements</a>
          </Tabs.Item>
          <Tabs.Item>
            <a>Components</a>
          </Tabs.Item>
          <Tabs.Item>
            <a>Columns</a>
          </Tabs.Item>
          <Tabs.Item>
            <a>Grid</a>
          </Tabs.Item>
          <Tabs.Item>
            <a>Layout</a>
          </Tabs.Item>
        </Tabs.List>
      </Container>
    </Tabs>
  </Hero.Foot>
</Hero>
```

---

### Compound (dot-notation) usage

`HeroHead`, `HeroBody`, and `HeroFoot` are also available as `Hero.Head`, `Hero.Body`, and `Hero.Foot`, so the whole hero can be composed from the single `Hero` import.

```tsx live
<Hero color="info">
  <Hero.Head>
    <Container textAlign="centered" pt="4">
      <Title size="6">Hero head via dot notation</Title>
    </Container>
  </Hero.Head>
  <Hero.Body>
    <Container textAlign="centered">
      <Title>Hero title</Title>
      <SubTitle>Hero subtitle</SubTitle>
    </Container>
  </Hero.Body>
  <Hero.Foot>
    <Container textAlign="centered" pb="4">
      <SubTitle size="6">Hero foot via dot notation</SubTitle>
    </Container>
  </Hero.Foot>
</Hero>
```

---

## Accessibility

- The hero renders as a semantic `<section>` by default.
- Subcomponents use semantic `<div>` for layout but you can use accessible children/content.
- Use headings (`<Title>`, `<SubTitle>`) for best screen reader support.

:::note
When using fullheight or fullheight-with-navbar, ensure your layout remains keyboard navigable and visually accessible.
:::

---

## Related Components

- [`Container`](./container.md): To constrain content width inside the hero section.
- [`Navbar`](../components/navbar.md): For navigation in the `Hero.Head`.
- [`Tabs`](../components/tabs.md): For tabs in the `Hero.Foot`.
- [`Button`](../elements/button.md), [`Title`](../elements/title.md), [`SubTitle`](../elements/subtitle.md): For content and actions in the hero.
- [Helper Props](../helpers/usebulmaclasses.md): Use Bulma utility helpers for spacing, color, etc.

---

## Additional Resources

- [Bulma Hero Documentation](https://bulma.io/documentation/layout/hero/)
- [Storybook: Hero Stories](https://bestax.io/storybook/?path=/story/layout-hero--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Hero />` and its subcomponents for utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop                   | Type                                                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`            | `string`                                                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `color`                | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Bulma color modifier for the hero section (renders `is-<color>`). Only `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`, `white`, `light`, and `dark` have shipped CSS for `.hero`. The other accepted values (`black-bis`, `black-ter`, `grey-darker`, `grey-dark`, `grey`, `grey-light`, `grey-lighter`, `inherit`, `current`) emit a class no CSS rule matches, so the hero renders unstyled; they log a console warning in development and will be removed from this union in the next major version. |
| `size`                 | `'small'` \| `'medium'` \| `'large'` \| `'fullheight'` \| `'fullheight-with-navbar'`                            | —       | Hero size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `bgColor`              | [Bulma color](../helpers/valid-values.md) \| `(typeof validSchemeColors)[number]` \| `'inherit'` \| `'current'` | —       | Bulma background color helper. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class. The `scheme-invert*` values do not change text color — pair them with a contrasting foreground.                                                                                                                                                                                                                                                                            |
| `fullheightWithNavbar` | `boolean`                                                                                                       | `false` | Use fullheight hero with a navbar offset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `children`             | `React.ReactNode`                                                                                               | —       | Hero content (often includes `Hero.Head`, `Hero.Body`, `Hero.Foot`).                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `...`                  | All standard HTML attributes and Bulma helper props                                                             | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Subcomponents:**

- `Hero.Head`: Top bar for navigation or branding.
- `Hero.Body`: Main content area, vertically centered by default.
- `Hero.Foot`: Bottom bar for tabs or actions.

### Hero.Head

| Prop        | Type                                                                                                            | Default | Description                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                             |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Bulma color modifier for text.                                                                                                                                                                                                      |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `(typeof validSchemeColors)[number]` \| `'inherit'` \| `'current'` | —       | Background color. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class. The `scheme-invert*` values do not change text color — pair them with a contrasting foreground. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Text color.                                                                                                                                                                                                                         |
| `children`  | `React.ReactNode`                                                                                               | —       | Content.                                                                                                                                                                                                                            |
| `...`       | All standard `<div>` attributes and Bulma helper props                                                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                   |

### Hero.Body

| Prop        | Type                                                                                                            | Default | Description                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                             |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Bulma color modifier for text.                                                                                                                                                                                                      |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `(typeof validSchemeColors)[number]` \| `'inherit'` \| `'current'` | —       | Background color. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class. The `scheme-invert*` values do not change text color — pair them with a contrasting foreground. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Text color.                                                                                                                                                                                                                         |
| `children`  | `React.ReactNode`                                                                                               | —       | Content.                                                                                                                                                                                                                            |
| `...`       | All standard `<div>` attributes and Bulma helper props                                                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                   |

### Hero.Foot

| Prop        | Type                                                                                                            | Default | Description                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                             |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Bulma color modifier for text.                                                                                                                                                                                                      |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `(typeof validSchemeColors)[number]` \| `'inherit'` \| `'current'` | —       | Background color. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class. The `scheme-invert*` values do not change text color — pair them with a contrasting foreground. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Text color.                                                                                                                                                                                                                         |
| `children`  | `React.ReactNode`                                                                                               | —       | Content.                                                                                                                                                                                                                            |
| `...`       | All standard `<div>` attributes and Bulma helper props                                                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                   |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Hero` registers these variables on its own `.hero` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                       | Sass Variable               | Default       |
| ---------------------------------- | --------------------------- | ------------- |
| `--bulma-hero-body-padding`        | `$hero-body-padding`        | `3rem 1.5rem` |
| `--bulma-hero-body-padding-tablet` | `$hero-body-padding-tablet` | `3rem 3rem`   |
| `--bulma-hero-body-padding-small`  | `$hero-body-padding-small`  | `1.5rem`      |
| `--bulma-hero-body-padding-medium` | `$hero-body-padding-medium` | `9rem 4.5rem` |
| `--bulma-hero-body-padding-large`  | `$hero-body-padding-large`  | `18rem 6rem`  |
| `--bulma-hero-gradient-h-offset`   | `$hero-gradient-h-offset`   | `5deg`        |
| `--bulma-hero-gradient-s-offset`   | `$hero-gradient-s-offset`   | `10%`         |
| `--bulma-hero-gradient-l-offset`   | `$hero-gradient-l-offset`   | `5%`          |

<!-- /bestax:generated cssvars -->
