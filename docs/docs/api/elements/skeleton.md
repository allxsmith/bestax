---
title: Skeleton
sidebar_label: Skeleton
---

# Skeleton

## Overview

The `Skeleton` component provides a Bulma-styled skeleton loader for React applications, useful for indicating that content is loading. It can be used as a placeholder for headings, paragraphs, blocks, or custom content.

:::info
Use `Skeleton` to improve perceived performance and give users a visual cue that content is being fetched.
:::

---

## Import

```tsx
import { Skeleton } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                     | Default   | Description                                        |
| ----------- | ---------------------------------------- | --------- | -------------------------------------------------- |
| `className` | `string`                                 | —         | Additional CSS classes.                            |
| `variant`   | `'block' \| 'lines'`                     | `'block'` | Skeleton variant: block (single block) or lines.   |
| `lines`     | `number`                                 | `3`       | Number of lines (only for `lines` variant).        |
| `children`  | `React.ReactNode`                        | —         | Content inside the block (only for block variant). |
| ...         | All standard HTML and Bulma helper props |           | (See [Helper Props](../helpers/usebulmaclasses))   |

---

## Usage

### Default Skeleton

The default usage of the `Skeleton` component renders a block placeholder, ideal for simulating loading content such as cards, images, or sections.

```tsx live
<Skeleton />
```

### Skeleton Text

Use the `children` prop to display placeholder text or content inside the skeleton block. This is useful for simulating paragraphs or multi-line content while data is loading.

```tsx live
<Skeleton>
  "Quando in rerum natura homines aequales creantur, ab ipso Creatore quibusdam
  iuribus inalienabilibus donantur, inter quae sunt Vita, Libertas et quaerenda
  felicitas. Quoties aliquod regimen haec iura destruere conatur, populus habet
  potestatem tale regimen abrogare et novum constituere, quod iuribus suis
  tutandis aptissimum videatur. Prudentia quidem dictat vetera regimina levibus
  de causis non mutanda esse; sed cum diuturnus abusus ad despotismum vergit,
  ius est, immo officium, talia regimina exuere et novas custodes securitatis
  futurae constituere."
</Skeleton>
```

### Lines Skeleton

The `lines` variant of the `Skeleton` component renders multiple line placeholders, perfect for simulating text content loading. Use the `lines` prop to specify the number of lines.

```tsx live
<Skeleton variant="lines" lines={5} />
```

---

### Skeleton Examples from useBulmaClasses.stories.tsx

These show how the `skeleton` Bulma helper can be applied to various components using the `skeleton` prop and `useBulmaClasses`. The skeleton state toggles on an interval in Storybook.

#### Skeleton Button

Demonstrates a button with a skeleton loader, useful for indicating an action is in progress.

```tsx live
<Button skeleton style={{ width: 120 }}>
  Skeleton Button
</Button>
```

#### Skeleton Buttons Group

A group of buttons with skeleton loaders, ideal for simulating multiple actions loading simultaneously.

```tsx live
<Buttons>
  <Button skeleton style={{ width: 120 }}>
    Skeleton
  </Button>
  <Button skeleton style={{ width: 120 }}>
    Skeleton
  </Button>
  <Button skeleton style={{ width: 120 }}>
    Skeleton
  </Button>
</Buttons>
```

#### Skeleton Icon

An icon with a skeleton loader, perfect for indicating an icon's action is loading.

```tsx live
<Icon
  name="star"
  skeleton
  ariaLabel="Star icon skeleton"
  style={{ fontSize: 32 }}
/>
```

#### Skeleton Image

An image with a skeleton loader, great for simulating image loading.

```tsx live
<Image
  skeleton
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
  alt="Skeleton image"
  size="128x128"
  style={{ width: 128, height: 128 }}
/>
```

#### Skeleton Media

Media object with a skeleton loader, useful for indicating media content is loading.

```tsx live
<Media skeleton>
  <Media.Left>
    <Image
      skeleton
      as="p"
      size="64x64"
      src="https://bulma.io/assets/images/placeholders/128x128.png"
      alt=""
    />
  </Media.Left>
  <Media.Content>
    <Content>
      <p>
        <strong>Skeleton Name</strong> <small>@skelly</small> <small>1m</small>
        <br />
        This is a skeleton media example.
      </p>
    </Content>
  </Media.Content>
</Media>
```

#### Skeleton Notification

A notification with a skeleton loader, ideal for indicating a message or alert is loading.

```tsx live
<Notification skeleton style={{ width: 300 }}>
  Skeleton notification message.
</Notification>
```

#### Skeleton Tag

A tag with a skeleton loader, great for simulating tag or category loading.

```tsx live
<Tag skeleton style={{ width: 100, display: 'inline-block' }}>
  Skeleton Tag
</Tag>
```

#### Skeleton Title

A title with a skeleton loader, useful for indicating a section or heading is loading.

```tsx live
<Title skeleton size="2" style={{ width: 180 }}>
  Skeleton Title
</Title>
```

#### Skeleton SubTitle

A subtitle with a skeleton loader, perfect for simulating secondary heading loading.

```tsx live
<SubTitle skeleton size="4" style={{ width: 140 }}>
  Skeleton SubTitle
</SubTitle>
```

#### Skeleton Input

An input field with a skeleton loader, ideal for indicating form input is loading.

```tsx live
<Input skeleton placeholder="Skeleton Input" style={{ width: 160 }} />
```

#### Skeleton TextArea

A textarea with a skeleton loader, useful for simulating multi-line text input loading.

```tsx live
<TextArea
  skeleton
  placeholder="Skeleton TextArea"
  rows={3}
  style={{ width: 220 }}
/>
```

---

## Accessibility

- **Role:** Consider using `aria-busy="true"` on container elements to indicate loading state.
- **Label:** Optionally use `aria-label="Loading..."` or similar for better screen reader support.
- **Focus:** Skeletons should not be focusable and should be replaced with real content as soon as data is available.

:::tip
Skeleton loaders provide a visual cue for loading but should not block navigation or accessibility.
:::

---

## Related Components

The following components support the `skeleton` property for Bulma skeleton loaders:

- [`Button`](./button.md)
- [`Buttons`](./buttons.md)
- [`Icon`](./icon.md)
- [`Image`](./image.md)
- [`Media`](../layout/media.md)
- [`Notification`](./notification.md)
- [`Tag`](./tag.md)
- [`Title`](./title.md)
- [`SubTitle`](./subtitle.md)
- [`Input`](../form/input.md)
- [`TextArea`](../form/textarea.md)
- [`useBulmaClasses`](../helpers/usebulmaclasses.md): The helper hook that enables the `skeleton` prop for any compatible component.

---

## Additional Resources

- [Bulma Skeleton Documentation](https://bulma.io/documentation/features/skeletons/)
- [Storybook: Skeleton Stories](https://bestax.io/storybook/?path=/story/elements-skeleton--default)
