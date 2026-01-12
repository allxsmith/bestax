---
title: Figure
sidebar_label: Figure
---

# Figure

## Overview

The `Figure` component renders a styled `<figure>` element with Bulma helper class integration. Use it to group self-contained content like images, illustrations, diagrams, or code snippets with an optional caption via `Figure.Caption`.

:::info
The Figure component is a thin wrapper around the HTML `<figure>` element with a `Figure.Caption` subcomponent for `<figcaption>`.
:::

---

## Import

```tsx
import { Figure } from '@allxsmith/bestax-bulma';
```

---

## Props

### Figure Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to render inside the figure.             |
| ...         | All standard `<figure>` and Bulma helper props                                                                                                                                                                                                                                           |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Figure.Caption Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Caption text to render.                          |
| ...         | All standard `<figcaption>` and Bulma helper props                                                                                                                                                                                                                                       |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Figure

The default usage of the `Figure` component with an image.

```tsx live
<Figure>
  <Image src="/img/bestax-solar-system-3d.png" alt="Placeholder" />
</Figure>
```

### Figure with Caption

Add a caption using `Figure.Caption`.

```tsx live
<Figure>
  <Image src="/img/bestax-solar-system-3d.png" alt="Placeholder" />
  <Figure.Caption>This is a caption for the image</Figure.Caption>
</Figure>
```

### Styled Caption

Apply color and typography helpers to the caption.

```tsx live
<Figure>
  <Image src="/img/bestax-solar-system-3d.png" alt="Placeholder" />
  <Figure.Caption textColor="grey" textSize="7" mt="2">
    Grey caption with smaller text
  </Figure.Caption>
</Figure>
```

### Figure with Background

Add a background and padding to create a framed effect.

```tsx live
<Figure bgColor="light" textColor="dark" p="4">
  <Image src="/img/bestax-solar-system-3d.png" alt="Placeholder" />
  <Figure.Caption mt="2">Figure with background and padding</Figure.Caption>
</Figure>
```

### Centered Caption

Center the caption and content using text alignment.

```tsx live
<Figure textAlign="centered">
  <Image src="/img/bestax-solar-system-3d.png" alt="Placeholder" />
  <Figure.Caption textSize="7" mt="2">
    Centered caption
  </Figure.Caption>
</Figure>
```

### Code Figure

Use Figure to wrap code blocks with captions.

```tsx live
<Figure bgColor="dark" p="4">
  <Pre textColor="white" m="0">
    <Code>{`function hello() {
  console.log("Hello, World!");
}`}</Code>
  </Pre>
  <Figure.Caption textColor="grey-light" mt="2">
    Example code snippet
  </Figure.Caption>
</Figure>
```

---

## Accessibility

- **Image Alt Text:** Always provide meaningful alt text for images within figures.
- **Figure Semantics:** The `<figure>` element groups content that is referenced from the main flow but could be moved without affecting the document's meaning.
- **Caption Association:** Screen readers associate `<figcaption>` content with the figure automatically.

:::info
The `<figure>` element is ideal for images, illustrations, diagrams, code listings, or anything that is referenced as a unit from the main content.
:::

---

## Related Components

- [`Image`](./image.md): For Bulma-styled images.
- [`Pre`](./pre.md): For preformatted code blocks.
- [`Code`](./code.md): For inline code.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: figure element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure)
- [MDN: figcaption element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption)
- [Storybook: Figure Stories](https://bestax.io/storybook/?path=/story/elements-figure--default)
