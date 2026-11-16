---
title: Skeleton
sidebar_label: Skeleton
description: The `Skeleton` component provides a Bulma-styled skeleton loader for React applications, useful for indicating that content is loading.
---

# Skeleton

## Overview

<!-- bestax:generated overview -->

The `Skeleton` component provides a Bulma-styled skeleton loader for React applications, useful for indicating that content is loading.

<!-- /bestax:generated overview -->

It can be used as a placeholder for headings, paragraphs, blocks, or custom content.

:::info
Use `Skeleton` to improve perceived performance and give users a visual cue that content is being fetched.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Skeleton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Skeleton

The default usage of the `Skeleton` component renders a block placeholder, ideal for simulating loading content such as cards, images, or sections.

```tsx live
<Skeleton />
```

### Skeleton Text

Use the `children` prop to display placeholder text or content inside the skeleton block. This is useful for simulating paragraphs or multi-line content while data is loading. A screen reader still reads the text, so hide it with `aria-hidden`.

```tsx live
<Skeleton aria-hidden="true">
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

These show how the `skeleton` Bulma helper can be applied to various components using the `skeleton` prop and `useBulmaClasses`. A screen reader still reads what a skeleton hides, and the keyboard still reaches a skeleton control, so each one hides its text or is disabled, as the [accessibility notes](#accessibility) say.

#### Skeleton Button

Demonstrates a button with a skeleton loader, useful for indicating an action is in progress.

```tsx live
<Button skeleton isDisabled color="dark">
  Skeleton Button
</Button>
```

#### Skeleton Buttons Group

A group of buttons with skeleton loaders, ideal for simulating multiple actions loading simultaneously.

```tsx live
<Buttons>
  <Button skeleton isDisabled color="dark">
    Skeleton
  </Button>
  <Button skeleton isDisabled color="dark">
    Skeleton
  </Button>
  <Button skeleton isDisabled color="dark">
    Skeleton
  </Button>
</Buttons>
```

#### Skeleton Icon

An icon with a skeleton loader, perfect for indicating an icon's action is loading.

```tsx live
<Icon name="star" skeleton size="medium" />
```

#### Skeleton Image

An image with a skeleton loader, great for simulating image loading.

```tsx live
<Image skeleton src="/img/react-logo.png" alt="Skeleton image" size="128x128" />
```

#### Skeleton Media

Media object with a skeleton loader, useful for indicating media content is loading.

```tsx live
<Media skeleton aria-hidden="true">
  <Media.Left>
    <Image
      skeleton
      as="p"
      size="64x64"
      src="/img/carousel/carousel-banner-1-1by1.jpg"
      alt=""
    />
  </Media.Left>
  <Media.Content>
    <Content>
      <Paragraph>
        <Strong>Skeleton Name</Strong> <small>@skelly</small> <small>1m</small>
        <br />
        This is a skeleton media example.
      </Paragraph>
    </Content>
  </Media.Content>
</Media>
```

#### Skeleton Notification

A notification with a skeleton loader, ideal for indicating a message or alert is loading.

```tsx live
<Notification skeleton aria-hidden="true">
  Skeleton notification message.
</Notification>
```

#### Skeleton Tag

A tag with a skeleton loader, great for simulating tag or category loading.

```tsx live
<Tag skeleton aria-hidden="true" size="medium">
  Skeleton Tag
</Tag>
```

#### Skeleton Title

A title with a skeleton loader, useful for indicating a section or heading is loading.

```tsx live
<Title skeleton aria-hidden="true" size="2">
  Skeleton Title
</Title>
```

#### Skeleton SubTitle

A subtitle with a skeleton loader, perfect for simulating secondary heading loading.

```tsx live
<SubTitle skeleton aria-hidden="true" size="4">
  Skeleton SubTitle
</SubTitle>
```

#### Skeleton Input

An input field with a skeleton loader, ideal for indicating form input is loading.

```tsx live
<Input skeleton disabled placeholder="Skeleton Input" />
```

#### Skeleton TextArea

A textarea with a skeleton loader, useful for simulating multi-line text input loading.

```tsx live
<TextArea skeleton disabled placeholder="Skeleton TextArea" rows={3} />
```

---

## Accessibility

- **Its text is still read:** Bulma hides a skeleton's text with a transparent color, and a screen
  reader reads it anyway, so `<Skeleton>Lorem ipsum</Skeleton>` reads "Lorem ipsum" and a `Title`
  with the `skeleton` prop is still a heading. Give a skeleton that holds placeholder text
  `aria-hidden="true"`, on `Skeleton` or on the component with the `skeleton` prop, or leave the
  block empty. The `lines` variant holds no text.
- **Controls still take the keyboard:** Bulma's skeleton stops the pointer and not the keyboard, so
  a `Button` with the `skeleton` prop is still reached with Tab and pressed with Enter. Pass it
  `isDisabled`, which takes it out of the tab order and keeps its look. A form control takes
  `disabled`, which Bulma draws lighter.
- **Say that it's loading:** a skeleton has no role, and ARIA doesn't allow a name on its `<div>`,
  so don't give it an `aria-label`. Set `aria-busy="true"` on the region it stands in for, and
  remove it when the content arrives. To announce that loading started or finished, change the
  text of a live region already on the page, as [`Loader`](./loader.md#accessibility) does.
- **Reduced motion:** under `prefers-reduced-motion: reduce` the pulse stops and each shape stays
  drawn in the skeleton color. That covers `Skeleton`, the `skeleton` prop and `hasSkeleton`. The
  rule ships in bestax's stylesheets: `bestax.css` and its variants, or `extras.css` next to your
  own Bulma, in either order.
- **Forced colors:** Bulma paints each shape as a background color, which a contrast theme
  replaces with the page's color, and hides the text inside with a transparent color, which the
  theme paints in its text color. In forced colors, bestax draws every shape in `GrayText`, the
  theme's color for something unavailable, such as a disabled control, and turns the theme's
  colors off on the skeleton so the text Bulma hides stays hidden. That reaches what's inside it
  too, so anything there that Bulma draws in colors of its own, such as a control's edge and focus
  ring or a link, keeps Bulma's colors rather than the theme's. That covers `Skeleton`, the
  `skeleton` prop and `hasSkeleton`, and ships in the same stylesheets as the reduced-motion rule.

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

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                            | Default   | Description                                        |
| ----------- | ------------------------------- | --------- | -------------------------------------------------- |
| `className` | `string`                        | —         | Additional CSS classes to apply                    |
| `variant`   | `'block'` \| `'lines'`          | `'block'` | Skeleton variant: block (single block) or lines.   |
| `lines`     | `number`                        | `3`       | Number of lines (only for `lines` variant).        |
| `children`  | `React.ReactNode`               | —         | Content inside the block (only for block variant). |
| `...`       | All standard `<div>` attributes | —         |                                                    |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

Bulma declares these variables globally rather than on `Skeleton`'s own element, so the defaults come from the theme. Override them anywhere above the component — on the element itself (via `className`/`style`) for a one-off, or on `:root` to retheme every instance. See [Theme](../helpers/theme.md).

| CSS Variable                        | Sass Variable                | Default                     |
| ----------------------------------- | ---------------------------- | --------------------------- |
| `--bulma-skeleton-background`       | `$skeleton-background`       | `var(--bulma-border)`       |
| `--bulma-skeleton-radius`           | `$skeleton-radius`           | `var(--bulma-radius-small)` |
| `--bulma-skeleton-block-min-height` | `$skeleton-block-min-height` | `4.5em`                     |
| `--bulma-skeleton-lines-gap`        | `$skeleton-lines-gap`        | `0.75em`                    |
| `--bulma-skeleton-line-height`      | `$skeleton-line-height`      | `0.75em`                    |

<!-- /bestax:generated cssvars -->
