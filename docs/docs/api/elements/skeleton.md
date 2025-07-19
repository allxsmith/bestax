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

```tsx live
<Skeleton />
```

### Skeleton Text

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

```tsx live
<Skeleton variant="lines" lines={5} />
```

---

### Skeleton Examples from useBulmaClasses.stories.tsx

These show how the `skeleton` Bulma helper can be applied to various components using the `skeleton` prop and `useBulmaClasses`. The skeleton state toggles on an interval in Storybook.

#### Skeleton Button

```tsx live
<Button skeleton style={{ width: 120 }}>
  Skeleton Button
</Button>
```

#### Skeleton Buttons Group

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

```tsx live
<Icon
  name="star"
  skeleton
  ariaLabel="Star icon skeleton"
  style={{ fontSize: 32 }}
/>
```

#### Skeleton Image

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

```tsx live
<Notification skeleton style={{ width: 300 }}>
  Skeleton notification message.
</Notification>
```

#### Skeleton Tag

```tsx live
<Tag skeleton style={{ width: 100, display: 'inline-block' }}>
  Skeleton Tag
</Tag>
```

#### Skeleton Title

```tsx live
<Title skeleton size="2" style={{ width: 180 }}>
  Skeleton Title
</Title>
```

#### Skeleton SubTitle

```tsx live
<SubTitle skeleton size="4" style={{ width: 140 }}>
  Skeleton SubTitle
</SubTitle>
```

#### Skeleton Input

```tsx live
<Input skeleton placeholder="Skeleton Input" style={{ width: 160 }} />
```

#### Skeleton TextArea

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
- [Storybook: Skeleton Stories](https://bestax.cc/storybook/?path=/story/elements-skeleton--default)
