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

```tsx
<Card
  header="Card Header"
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
  footer={[
    <span key="save" className="card-footer-item">
      Save
    </span>,
    <span key="cancel" className="card-footer-item">
      Cancel
    </span>,
  ]}
>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### With Header Only

```tsx
<Card header="Card Header">
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### With Footer Only

```tsx
<Card
  footer={[
    <span key="save" className="card-footer-item">
      Save
    </span>,
    <span key="cancel" className="card-footer-item">
      Cancel
    </span>,
  ]}
>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### With Image Only

```tsx
<Card
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
/>
```

---

### With Image and Content

```tsx
<Card
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### No Shadow

```tsx
<Card hasShadow={false}>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### Spaced (Margin and Padding)

```tsx
<Card m="4" p="4">
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### Viewport Specific (Text Color on Tablet)

```tsx
<Card textColor="primary" viewport="tablet">
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

### Interactive (Colors, Spacing, Alignment, Footer)

```tsx
<Card
  header="Interactive Card"
  textColor="success"
  bgColor="dark"
  m="3"
  p="3"
  textAlign="centered"
  hasShadow
  footer={[
    <span key="action1" className="card-footer-item">
      Action 1
    </span>,
    <span key="action2" className="card-footer-item">
      Action 2
    </span>,
  ]}
>
  Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae...
</Card>
```

---

## Accessibility

- The card image uses an `alt` attribute for screen readers.
- Use semantic content for the header, body, and footer as needed.

---

## Related Components

- [Helper Props](../helpers/usebulmaclasses.md) for spacing, color, and alignment utilities.
- [Bulma Card Documentation](https://bulma.io/documentation/components/card/)

---

## Additional Resources

- [Storybook: Card Stories](https://bestax.cc/storybook/?path=/story/components-card--default)
