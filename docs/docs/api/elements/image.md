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

The simplest usage of the `Image` component, requiring only the `src` and `alt` props. The `size` prop controls the dimensions.

```tsx live
<Image
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
  alt="Sample image"
  size="128x128"
/>
```

### Rounded Image

The `isRounded` prop adds rounded corners to the image, useful for profile pictures or any image where a softer look is desired.

```tsx live
<Image src="..." alt="Rounded image" size="128x128" isRounded />
```

### Retina Image

The `isRetina` prop enables support for high-resolution (2x) images, ensuring crisp visuals on retina displays. Use this for logos or images that need to look sharp on all devices.

```tsx live
<Image src="..." alt="Retina image" size="128x128" isRetina />
```

### Aspect Ratio 16:9

Set the `size` prop to `16by9` to create a responsive image container with a 16:9 aspect ratio. This is ideal for video thumbnails or wide images.

```tsx live
<Image src="..." alt="16:9 aspect ratio image" size="16by9" />
```

### Aspect Ratio 4:3

Set the `size` prop to `4by3` for a classic photo or video aspect ratio. This helps maintain consistent layouts for media content.

```tsx live
<Image src="..." alt="4:3 aspect ratio image" size="4by3" />
```

### With Margin

You can use Bulma spacing helpers like `m` to add margin around the image for better layout control.

```tsx live
<Image src="..." alt="Image with margin" size="128x128" m="4" />
```

### With Iframe

The `Image` component can wrap arbitrary children, such as iframes, to provide responsive aspect ratios and Bulma styling for embedded media.

```tsx live
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

You can also wrap custom content inside the `Image` component, such as a styled div or any React node, to maintain aspect ratio and Bulma styling.

```tsx live
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

Combine the `textColor` and `bgColor` props to style the image container for branding or emphasis.

```tsx live
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
