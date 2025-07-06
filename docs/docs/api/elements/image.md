---
title: Image
sidebar_label: Image
---

# Image

## Overview

The `Image` component wraps images, iframes, or custom content in a Bulma-styled container, supporting fixed sizes, aspect ratios, rounded corners, retina images, and all Bulma helper props for color and spacing.

:::info
Use `Image` for consistent responsive image containers, or to embed arbitrary media (like iframes) with Bulma styling.
:::

---

## Import

```tsx
import { Image } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default    | Description                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —          | Additional CSS classes.                                                   |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Text color helper for the container.                                      |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —          | Bulma color modifier for the image container.                             |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Background color helper for the container.                                |
| `size`      | Bulma size string (e.g., `'128x128'`, `'16by9'`, `'square'`)                                                                                                                                                                                                                             | —          | Fixed size or aspect ratio modifier for the image container.              |
| `isRounded` | `boolean`                                                                                                                                                                                                                                                                                | —          | Renders the image with rounded corners.                                   |
| `isRetina`  | `boolean`                                                                                                                                                                                                                                                                                | —          | Uses retina (2x) image source.                                            |
| `src`       | `string`                                                                                                                                                                                                                                                                                 | —          | Image source URL.                                                         |
| `alt`       | `string`                                                                                                                                                                                                                                                                                 | —          | Alternate text for the image.                                             |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —          | Arbitrary content (e.g., iframe, custom HTML) inside the image container. |
| `as`        | `'figure' \| 'div' \| 'p'`                                                                                                                                                                                                                                                               | `'figure'` | The tag to render as.                                                     |
| ...         | All standard `<figure>`/`<div>` and Bulma helper props                                                                                                                                                                                                                                   |            | (See [Helper Props](../helpers/usebulmaclasses))                          |

---

## Usage

### Default Image

```tsx
<Image
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
  alt="Sample image"
  size="128x128"
/>
```

### Rounded Image

```tsx
<Image src="..." alt="Rounded image" size="128x128" isRounded />
```

### Retina Image

```tsx
<Image src="..." alt="Retina image" size="128x128" isRetina />
```

### Aspect Ratio 16:9

```tsx
<Image src="..." alt="16:9 aspect ratio image" size="16by9" />
```

### Aspect Ratio 4:3

```tsx
<Image src="..." alt="4:3 aspect ratio image" size="4by3" />
```

### With Margin

```tsx
<Image src="..." alt="Image with margin" size="128x128" m="4" />
```

### With Iframe

```tsx
<Image size="16by9">
  <iframe
    className="has-ratio"
    width="640"
    height="360"
    src="https://www.youtube.com/embed/XxVg_s8xAms"
    frameBorder="0"
    allowFullScreen
    title="Sample YouTube Video"
  />
</Image>
```

### With Custom Child

```tsx
<Image size="4by3">
  <div
    className="has-ratio has-background-grey-light has-text-centered"
    style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <p>Custom Content</p>
  </div>
</Image>
```

### With Text Color and Background

```tsx
<Image
  src="..."
  alt="Image with text and background color"
  size="128x128"
  textColor="primary"
  bgColor="light"
/>
```

---

## Accessibility

- **Alt Text:** Always provide a descriptive `alt` attribute for images.
- **Aspect Ratios:** Maintains the correct aspect ratio for images, iframes, or any child.
- **Custom Content:** When embedding iframes or custom children, ensure accessibility via proper ARIA labeling or content.

:::warning
Do not use `Image` for decorative images without `alt=""`, unless purely presentational.
:::

---

## Related Components

- [`Box`](./box.md): For bordered, padded containers.
- [`Content`](./content.md): For typographically styled rich content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Image Documentation](https://bulma.io/documentation/elements/image/)
- [Storybook: Image Stories](https://bestax.cc/storybook/?path=/story/elements-image--default)
