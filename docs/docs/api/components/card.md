---
title: Card
sidebar_label: Card
description: The `Card` component renders a Bulma-styled card with optional header, image, content, and footer.
---

# Card

## Overview

<!-- bestax:generated overview -->

The `Card` component renders a Bulma-styled card with optional header, image, content, and footer.

<!-- /bestax:generated overview -->

It supports custom colors, shadows, spacing, alignment, and more for flexible, attractive UI blocks.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Card } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Card (Header, Image, Content, Footer)

To create a flexible content block, use the `Card` component with optional `header`, `image`, `children` (for the main content), and `footer` props. This structure is ideal for displaying grouped information, media, or actions in a visually distinct container. You can further customize the card using props like `color`, `bgColor`, `textColor`, `hasShadow`, and Bulma helper props for spacing and alignment.

```tsx live
<Card
  header="Card Header"
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
  footer={[
    <Card.FooterItem key="save">Save</Card.FooterItem>,
    <Card.FooterItem key="cancel">Cancel</Card.FooterItem>,
  ]}
>
  Card content goes here.
</Card>
```

---

### With Header Only

Use the `header` prop to display a card with only a header section. This is useful for simple announcements or titles without additional content or actions. The header text appears in the card's top area, styled according to Bulma's card-header.

```tsx live
<Card header="Card Header">
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### With Footer Only

Provide the `footer` prop to render a card with only a footer section. Each footer item is wrapped in `.card-footer-item`, making it ideal for action links or summary information at the bottom of the card.

```tsx live
<Card
  footer={[
    <Card.FooterItem key="save">Save</Card.FooterItem>,
    <Card.FooterItem key="cancel">Cancel</Card.FooterItem>,
  ]}
>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### With Image Only

Set the `image` and `imageAlt` props to display a card with only an image. This is useful for gallery layouts or when you want to showcase a visual without additional content or actions.

```tsx live
<Card
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
/>
```

---

### With Image and Content

Combine the `image`, `imageAlt`, and `children` props to display a card with an image and content. This is a common pattern for media cards, product listings, or blog previews.

```tsx live
<Card
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### No Shadow

Set `hasShadow={false}` to remove the default card shadow. This creates a flatter, more minimal appearance, which can be useful for embedded or secondary cards.

```tsx live
<Card hasShadow={false}>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### Spaced (Margin and Padding)

Use Bulma helper props like `m` (margin) and `p` (padding) to control the card's spacing. For example, `m="4"` and `p="4"` add margin and padding of 4 units, respectively, for better separation and layout control.

```tsx live
<Card m="4" p="4">
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### Viewport Specific (Text Color on Tablet)

Apply the `textColor` prop with a value like `primary` and the `viewport` prop set to `tablet` to change the card's text color only on tablet screens. This enables responsive design adjustments for different devices.

```tsx live
<Card textColor="primary" viewport="tablet">
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### Interactive (Colors, Spacing, Alignment, Footer)

Combine multiple props such as `header`, `textColor`, `bgColor`, `m`, `p`, `textAlign`, `hasShadow`, and `footer` to create a highly interactive and visually distinct card. This pattern is ideal for call-to-action cards, dashboards, or feature highlights.

```tsx live
<Card
  header="Upgrade to Pro"
  headerIcon={
    <button className="card-header-icon">
      <Icon library="fa" name="bolt" textColor="warning" ariaLabel="Pro" />
    </button>
  }
  image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
  imageAlt="Dashboard analytics"
  m="3"
  textAlign="centered"
  hasShadow
  footer={[
    <Button key="upgrade" color="success">
      Upgrade Now
    </Button>,
    <Button key="learn" color="info" isOutlined>
      Learn More
    </Button>,
  ]}
>
  Unlock advanced analytics, priority support, and unlimited exports for your
  team.
</Card>
```

---

### Compound (dot-notation) usage

Every card section is also available as a static — `Card.Header` (with `Card.Header.Title` and `Card.Header.Icon`), `Card.Image`, `Card.Content`, `Card.Footer`, and `Card.FooterItem` — so a whole card can be composed from the single `Card` import. Each static's props are listed under [Compound component props](#compound-component-props).

#### Complete Card with Compound Components

```tsx live
import { Icon, Image } from '@allxsmith/bestax-bulma';

<Card>
  <Card.Header>
    <Card.Header.Title>Compound Component Card</Card.Header.Title>
    <Card.Header.Icon aria-label="more options">
      <Icon name="angle-down" variant="solid" ariaLabel="expand" />
    </Card.Header.Icon>
  </Card.Header>
  <Card.Image>
    <Image
      src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
      alt="Beautiful forest"
      size="4by3"
    />
  </Card.Image>
  <Card.Content>
    <Content>
      This card is built using compound components for maximum flexibility.
    </Content>
  </Card.Content>
  <Card.Footer>
    <Card.FooterItem>
      <Button color="primary">Save</Button>
    </Card.FooterItem>
    <Card.FooterItem>
      <Button>Cancel</Button>
    </Card.FooterItem>
  </Card.Footer>
</Card>;
```

#### Minimal Compound Card

```tsx live
<Card>
  <Card.Header>
    <Card.Header.Title>Simple Header</Card.Header.Title>
  </Card.Header>
  <Card.Content>
    <Paragraph>Just some minimal content using compound components.</Paragraph>
  </Card.Content>
</Card>
```

#### Card Header with Icon

```tsx live
function ExpandableCard() {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Card>
      <Card.Header>
        <Card.Header.Title>Expandable Card</Card.Header.Title>
        <Card.Header.Icon
          aria-label={isOpen ? 'collapse' : 'expand'}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon
            library="fa"
            name={isOpen ? 'angle-up' : 'angle-down'}
            ariaLabel={isOpen ? 'collapse' : 'expand'}
          />
        </Card.Header.Icon>
      </Card.Header>
      {isOpen && (
        <Card.Content>
          This card uses React state to toggle content visibility. Click the
          icon in the header to expand or collapse this section.
        </Card.Content>
      )}
    </Card>
  );
}
```

#### Mixed Approach

You can combine the traditional prop-based API with compound components:

```tsx live
<Card header="Prop-based header" textColor="primary" m="3">
  <Card.Content bgColor="light">
    <Paragraph>
      You can mix prop-based and compound component approaches!
    </Paragraph>
  </Card.Content>
  <Card.Footer>
    <Card.FooterItem>Mixed approach example</Card.FooterItem>
  </Card.Footer>
</Card>
```

---

## Accessibility

- The card image uses an `alt` attribute for screen readers.
- Use semantic content for the header, body, and footer as needed.

---

## Related Components

- [`Icon`](../elements/icon.md): For icons in card headers and content.
- [`Image`](../elements/image.md): For responsive card images with proper aspect ratios.
- [Helper Props](../helpers/usebulmaclasses.md) for spacing, color, and alignment utilities.
- [Bulma Card Documentation](https://bulma.io/documentation/components/card/)

---

## Additional Resources

- [Storybook: Card Stories](https://bestax.io/storybook/?path=/story/components-card--default)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                            | Default | Description                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`      | `string`                                                                        | —       | Additional CSS classes to apply.                                                                                                                                                                                                         |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the card.                                                                                                                                                                                                                 |
| `color`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Text color alias: renders `has-text-<color>`, exactly like `textColor`. Not a filled card variant (no `.card.is-<color>` CSS exists). Prefer `textColor`, which takes precedence when both are set; use `bgColor` for a colored surface. |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color for the card.                                                                                                                                                                                                           |
| `hasShadow`      | `boolean`                                                                       | `true`  | Whether the card has a shadow (default: `true`).                                                                                                                                                                                         |
| `header`         | `React.ReactNode`                                                               | —       | Card header content, rendered inside `.card-header-title`.                                                                                                                                                                               |
| `headerCentered` | `boolean`                                                                       | `false` | If true, centers the header title.                                                                                                                                                                                                       |
| `headerIcon`     | `React.ReactNode`                                                               | —       | Card header icon, rendered as a sibling to the header title.                                                                                                                                                                             |
| `footer`         | `React.ReactNode` \| `React.ReactNode[]`                                        | —       | Card footer content; each item is wrapped in `.card-footer-item`.                                                                                                                                                                        |
| `image`          | `React.ReactNode` \| `string`                                                   | —       | Card image node or image src string.                                                                                                                                                                                                     |
| `imageAlt`       | `string`                                                                        | —       | Alternate text for the card image.                                                                                                                                                                                                       |
| `children`       | `React.ReactNode`                                                               | —       | Card content (body).                                                                                                                                                                                                                     |
| `textAlign`      | `'centered'` \| `'justified'` \| `'left'` \| `'right'`                          | —       | Text alignment.                                                                                                                                                                                                                          |
| `...`            | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                        |

**Subcomponents:**

- `Card.Header`: Card header compound component. Wraps children in a `.card-header` element.
- `Card.Header.Title`: Card header title compound component. Renders a `.card-header-title` element.
- `Card.Header.Icon`: Card header icon compound component. Renders a `.card-header-icon` button.
- `Card.Image`: Card image compound component. Wraps children in a `.card-image` element.
- `Card.Content`: Card content compound component. Wraps children in a `.card-content` element.
- `Card.Footer`: Card footer compound component. Wraps children in a `.card-footer` element.
- `Card.FooterItem`: Card footer item compound component. Wraps children in a `.card-footer-item` span.

### Card.Header

| Prop        | Type                                                                    | Default | Description                                                  |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).                    |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                     |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set.      |
| `className` | `string`                                                                | —       | Additional CSS classes.                                      |
| `children`  | `React.ReactNode`                                                       | —       | Header content. Wrap in Card.Header.Title for Bulma styling. |
| `centered`  | `boolean`                                                               | `false` | Whether to center the header title text.                     |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)            |

### Card.Header.Title

| Prop        | Type                                                                    | Default | Description                                             |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set. |
| `className` | `string`                                                                | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Title text content.                                     |
| `centered`  | `boolean`                                                               | `false` | Whether to center the title text.                       |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

### Card.Header.Icon

| Prop        | Type                                                                    | Default | Description                                             |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set. |
| `className` | `string`                                                                | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Icon content (e.g. an icon element).                    |
| `...`       | All standard `<button>` attributes and Bulma helper props               | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

### Card.Image

| Prop        | Type                                                                    | Default | Description                                             |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set. |
| `className` | `string`                                                                | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Image content (e.g. a `<figure>` with an `<img>`).      |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

### Card.Content

| Prop        | Type                                                                    | Default | Description                                             |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set. |
| `className` | `string`                                                                | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Card body content.                                      |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

### Card.Footer

| Prop        | Type                                                                    | Default | Description                                             |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set. |
| `className` | `string`                                                                | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Footer content, typically Card.FooterItem elements.     |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

### Card.FooterItem

| Prop        | Type                                                                    | Default | Description                                             |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier (text color helper).               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper; wins over `color` when both are set. |
| `className` | `string`                                                                | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Footer item content (link, button, text, etc.).         |
| `...`       | All standard `<span>` attributes and Bulma helper props                 | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

<!-- /bestax:generated props -->

### Compound component props

The `Card` component also supports a compound component API for maximum flexibility. This allows you to compose cards with fine-grained control over each section.

You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with every `Card` sub-part for utility-based styling — spacing (`m`, `p`), colors, flexbox (`display="flex"`, `flexGrow`), and more. Each sub-part also takes `color` (text color), `bgColor` (background), and `textColor` (wins over `color` when both are set).

#### Card.Header

Renders the card header section with proper styling. When used without `Card.Header.Title`, it automatically wraps content in a `.card-header-title` div. When used with `Card.Header.Title`, it renders the title component directly without additional wrapping.

**Props:**

- `className?`: Additional CSS classes
- `centered?`: Whether to center the header content (only applies when not using `Card.Header.Title`)
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<header>` and [Bulma helper props](../helpers/usebulmaclasses.md)

#### Card.Header.Title

Renders the card header title with proper styling. This provides more granular control over the header title when using compound components. When used inside `Card.Header`, it prevents automatic wrapping.

**Props:**

- `className?`: Additional CSS classes
- `centered?`: Whether to center the header title
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<div>` and [Bulma helper props](../helpers/usebulmaclasses.md)

#### Card.Header.Icon

Renders the card header icon button with proper styling. This is typically placed after `Card.Header.Title` for actions like expand/collapse or accessing more options.

**Props:**

- `className?`: Additional CSS classes
- `aria-label?`: Accessibility label (defaults to "more options")
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<button>` and [Bulma helper props](../helpers/usebulmaclasses.md)

#### Card.Image

Renders the card image section.

**Props:**

- `className?`: Additional CSS classes
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<div>` and [Bulma helper props](../helpers/usebulmaclasses.md)

#### Card.Content

Renders the main card content section.

**Props:**

- `className?`: Additional CSS classes
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<div>` and [Bulma helper props](../helpers/usebulmaclasses.md)

#### Card.Footer

Renders the card footer section.

**Props:**

- `className?`: Additional CSS classes
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<footer>` and [Bulma helper props](../helpers/usebulmaclasses.md)

#### Card.FooterItem

Renders individual footer items with proper styling.

**Props:**

- `className?`: Additional CSS classes
- `color?` / `bgColor?` / `textColor?`: [Bulma color](../helpers/valid-values.md) helpers
- All standard HTML attributes for `<span>` and [Bulma helper props](../helpers/usebulmaclasses.md)

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Card` registers these variables on its own `.card` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                            | Sass Variable                    | Default                                                                                                  |
| --------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--bulma-card-color`                    | `$card-color`                    | `var(--bulma-text)`                                                                                      |
| `--bulma-card-background-color`         | `$card-background-color`         | `var(--bulma-scheme-main)`                                                                               |
| `--bulma-card-shadow`                   | `$card-shadow`                   | `var(--bulma-shadow)`                                                                                    |
| `--bulma-card-radius`                   | `$card-radius`                   | `0.75rem`                                                                                                |
| `--bulma-card-header-background-color`  | `$card-header-background-color`  | `transparent`                                                                                            |
| `--bulma-card-header-color`             | `$card-header-color`             | `var(--bulma-text-strong)`                                                                               |
| `--bulma-card-header-padding`           | `$card-header-padding`           | `0.75rem 1rem`                                                                                           |
| `--bulma-card-header-shadow`            | `$card-header-shadow`            | `0 0.125em 0.25em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.1)` |
| `--bulma-card-header-weight`            | `$card-header-weight`            | `var(--bulma-weight-bold)`                                                                               |
| `--bulma-card-content-background-color` | `$card-content-background-color` | `transparent`                                                                                            |
| `--bulma-card-content-padding`          | `$card-content-padding`          | `1.5rem`                                                                                                 |
| `--bulma-card-footer-background-color`  | `$card-footer-background-color`  | `transparent`                                                                                            |
| `--bulma-card-footer-border-top`        | `$card-footer-border-top`        | `1px solid var(--bulma-border-weak)`                                                                     |
| `--bulma-card-footer-padding`           | `$card-footer-padding`           | `0.75rem`                                                                                                |
| `--bulma-card-media-margin`             | `$card-media-margin`             | `var(--bulma-block-spacing)`                                                                             |

<!-- /bestax:generated cssvars -->
