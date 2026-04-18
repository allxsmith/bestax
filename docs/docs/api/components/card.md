---
title: Card
sidebar_label: Card
---

# Card

## Overview

The `Card` component renders a Bulma-styled card with optional header, image, content, and footer. It supports custom colors, shadows, spacing, alignment, and more for flexible, attractive UI blocks.

---

## Import

```tsx
import { Card } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop             | Type                                                                                                                                                                                                                                                                                     | Description                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `className`      | `string`                                                                                                                                                                                                                                                                                 | Additional CSS classes to apply.                                  |
| `textColor`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Text color for the card.                                          |
| `color`          | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | Bulma color modifier for the card.                                |
| `bgColor`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Background color for the card.                                    |
| `hasShadow`      | `boolean`                                                                                                                                                                                                                                                                                | Whether the card has a shadow (default: `true`).                  |
| `header`         | `React.ReactNode`                                                                                                                                                                                                                                                                        | Card header content, rendered inside `.card-header-title`.        |
| `headerCentered` | `boolean`                                                                                                                                                                                                                                                                                | If true, centers the header title.                                |
| `headerIcon`     | `React.ReactNode`                                                                                                                                                                                                                                                                        | Card header icon, rendered as a sibling to the header title.      |
| `footer`         | `React.ReactNode \| React.ReactNode[]`                                                                                                                                                                                                                                                   | Card footer content; each item is wrapped in `.card-footer-item`. |
| `image`          | `React.ReactNode \| string`                                                                                                                                                                                                                                                              | Card image node or image src string.                              |
| `imageAlt`       | `string`                                                                                                                                                                                                                                                                                 | Alternate text for the card image.                                |
| `children`       | `React.ReactNode`                                                                                                                                                                                                                                                                        | Card content (body).                                              |
| `m`/`p`          | `string`                                                                                                                                                                                                                                                                                 | Bulma margin/padding helper props (e.g. `'4'`, `'auto'`).         |
| `textAlign`      | `'centered' \| 'justified' \| 'left' \| 'right'`                                                                                                                                                                                                                                         | Text alignment.                                                   |
| ...              | All Bulma and standard HTML props                                                                                                                                                                                                                                                        | (See [Helper Props](../helpers/usebulmaclasses))                  |

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
    <Button key="upgrade" color="success">Upgrade Now</Button>,
    <Button key="learn" color="info" isOutlined>Learn More</Button>,
  ]}
>
  Unlock advanced analytics, priority support, and unlimited exports for your team.
</Card>
```

---

## Compound Components

The `Card` component also supports a compound component API for maximum flexibility. This allows you to compose cards with fine-grained control over each section.

### Card.Header

Renders the card header section with proper styling. When used without `Card.Header.Title`, it automatically wraps content in a `.card-header-title` div. When used with `Card.Header.Title`, it renders the title component directly without additional wrapping.

**Props:**

- `className?`: Additional CSS classes
- `centered?`: Whether to center the header content (only applies when not using `Card.Header.Title`)
- All standard HTML attributes for `<header>`

### Card.Header.Title

Renders the card header title with proper styling. This provides more granular control over the header title when using compound components. When used inside `Card.Header`, it prevents automatic wrapping.

**Props:**

- `className?`: Additional CSS classes
- `centered?`: Whether to center the header title
- All standard HTML attributes for `<div>`

### Card.Header.Icon

Renders the card header icon button with proper styling. This is typically placed after `Card.Header.Title` for actions like expand/collapse or accessing more options.

**Props:**

- `className?`: Additional CSS classes
- `aria-label?`: Accessibility label (defaults to "more options")
- All standard HTML attributes for `<button>`

### Card.Image

Renders the card image section.

**Props:**

- `className?`: Additional CSS classes
- All standard HTML attributes for `<div>`

### Card.Content

Renders the main card content section.

**Props:**

- `className?`: Additional CSS classes
- All standard HTML attributes for `<div>`

### Card.Footer

Renders the card footer section.

**Props:**

- `className?`: Additional CSS classes
- All standard HTML attributes for `<footer>`

### Card.FooterItem

Renders individual footer items with proper styling.

**Props:**

- `className?`: Additional CSS classes
- All standard HTML attributes for `<span>`

### Compound Component Examples

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
    <Paragraph>You can mix prop-based and compound component approaches!</Paragraph>
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
