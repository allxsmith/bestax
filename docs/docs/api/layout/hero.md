---
title: Hero
sidebar_label: Hero
---

# Hero

## Overview

The `Hero` component provides a responsive, flexible, and visually striking section for your Bulma React UI. It supports all Bulma hero color and size modifiers, including fullheight, background helpers, and composition with `Hero.Head`, `Hero.Body`, and `Hero.Foot` subcomponents. Use it to showcase prominent content, headers, or landing sections.

:::info
You can use `Hero` as a simple colored banner, or compose it with `Hero.Head`, `Hero.Body`, and `Hero.Foot` for complex layouts with navigation, content, and tabs.
:::

---

## Import

```tsx
import { Hero } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop                   | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `color`                | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| ...`                                                                                                                                                                                                             | —       | Bulma color modifier for the hero section.                           |
| `size`                 | `'small' \| 'medium' \| 'large' \| 'fullheight' \| 'fullheight-with-navbar'`                                                                                                                                                                                                             | —       | Hero size.                                                           |
| `fullheightWithNavbar` | `boolean`                                                                                                                                                                                                                                                                                | `false` | Use fullheight hero with a navbar offset.                            |
| `bgColor`              | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma background color helper.                                       |
| `className`            | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                              |
| `children`             | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Hero content (often includes `Hero.Head`, `Hero.Body`, `Hero.Foot`). |
| ...                    | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 |         | (See [Helper Props](../helpers/usebulmaclasses))                     |

**Subcomponents:**

- `Hero.Head`: Top bar for navigation or branding.
- `Hero.Body`: Main content area, vertically centered by default.
- `Hero.Foot`: Bottom bar for tabs or actions.

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
            <div className="buttons">
              <Button color="primary" isInverted as="a">
                Github
              </Button>
            </div>
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
            <img
              src="https://bulma.io/assets/images/bulma-type-white.png"
              alt="Logo"
            />
          </Navbar.Item>
          <span className="navbar-burger" data-target="navbarMenuHeroA">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </Navbar.Brand>
        <Navbar.Menu id="navbarMenuHeroA">
          <Navbar.End>
            <Navbar.Item as="a" active>
              Getting Started
            </Navbar.Item>
            <Navbar.Item as="a">APIs</Navbar.Item>
            <Navbar.Item as="a">Blog</Navbar.Item>
            <Navbar.Item as="span">
              <Button color="primary" isInverted as="a">
                <Icon
                  library="fa"
                  name="github"
                  variant="brands"
                  ariaLabel="github"
                />
                <span>Github</span>
              </Button>
            </Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Container>
    </Navbar>
  </Hero.Head>

  <Hero.Body>
    <Container className="has-text-centered">
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
