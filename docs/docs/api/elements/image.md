---
title: Image
sidebar_label: Image
description: The `Image` component wraps images, iframes, or custom content in a Bulma-styled container, supporting fixed sizes, aspect ratios, rounded corners, retina images, and Bulma helper props for color and spacing.
---

# Image

## Overview

<!-- bestax:generated overview -->

The `Image` component wraps images, iframes, or custom content in a Bulma-styled container, supporting fixed sizes, aspect ratios, rounded corners, retina images, and Bulma helper props for color and spacing.

<!-- /bestax:generated overview -->

:::info
Use `Image` for consistent responsive image containers, or to hold other content (like iframes) at a ratio with Bulma styling.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Image } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Image

The simplest usage of the `Image` component, requiring only the `src` and `alt` props. The `size` prop controls the dimensions.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="Sample image"
  size="128x128"
/>
```

### Rounded Image

The `isRounded` prop adds rounded corners to the image, useful for profile pictures or any image where a softer look is desired.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="Rounded image"
  size="128x128"
  isRounded
/>
```

### Retina Image

The `isRetina` prop enables support for high-resolution (2x) images, ensuring crisp visuals on retina displays. Use this for logos or images that need to look sharp on all devices.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="Retina image"
  size="128x128"
  isRetina
/>
```

### Aspect Ratio 16:9

Set the `size` prop to `16by9` to create a responsive image container with a 16:9 aspect ratio. This is ideal for video thumbnails or wide images. A ratio `Image` placed directly inside another ratio `.image` needs `className="has-ratio"`, like any other child, to fill it.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="16:9 aspect ratio image"
  size="16by9"
/>
```

### Aspect Ratio 4:3

Set the `size` prop to `4by3` for a classic photo or video aspect ratio. This helps maintain consistent layouts for media content.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="4:3 aspect ratio image"
  size="4by3"
/>
```

### With Margin

You can use Bulma spacing helpers like `m` to add margin around the image for better layout control.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="Image with margin"
  size="128x128"
  m="4"
/>
```

### With Iframe

The `Image` component can wrap arbitrary children, such as iframes, to provide responsive aspect ratios and Bulma styling for embedded content. Give the child `className="has-ratio"`: Bulma stretches an `<img>` over the ratio by itself, and any other child only when it carries that class.

```tsx live
<Image size="16by9">
  <iframe
    className="has-ratio"
    width="640"
    height="360"
    srcDoc="<!doctype html><html lang='en'><style>html{color-scheme:light dark;background:Canvas;color:CanvasText}body{margin:0;height:100vh;box-sizing:border-box;padding:1rem;border:2px dashed;display:grid;place-items:center;text-align:center;font:1.25rem system-ui,sans-serif}</style><p>This frame keeps a 16:9 ratio at any width.</p></html>"
    title="A frame that keeps a 16:9 ratio"
  />
</Image>
```

### With Custom Child

You can also wrap custom content inside the `Image` component, such as a styled div or any React node, to maintain aspect ratio and Bulma styling.

```tsx live
<Image size="4by3">
  <Block
    display="flex"
    alignItems="center"
    justifyContent="center"
    bgColor="grey-light"
    textColor="dark"
    textAlign="centered"
    className="has-ratio"
    style={{ height: '100%' }}
  >
    <Paragraph>Custom Content</Paragraph>
  </Block>
</Image>
```

### With Text Color and Background

Combine the `textColor` and `bgColor` props to style the image container for branding or emphasis.

```tsx live
<Image
  src="/img/bestax-solar-system-3d.png"
  alt="Image with text and background color"
  size="128x128"
  textColor="primary"
  bgColor="light"
/>
```

---

## Accessibility

- **Alt Text:** Give each image an `alt` that says what it shows, or `alt=""` for a decorative one, which a screen reader then skips. A development build warns about an `<img>` with no `alt`.
- **Aspect Ratios:** Maintains the correct aspect ratio for images, iframes, or any child.
- **Custom Content:** Give an iframe a `title` that says what it shows. Video or audio you embed needs its own captions and description; `Image` adds none.

:::warning
Do not use `Image` for decorative images without `alt=""`, unless purely presentational.
:::

---

## Related Components

- [`Box`](./box.md): For padded containers with an optional shadow.
- [`Content`](./content.md): For typographically styled rich content.
- [`Card`](../components/card.md): For cards with responsive images and proper aspect ratios.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Image Documentation](https://bulma.io/documentation/elements/image/)
- [Storybook: Image Stories](https://bestax.io/storybook/?path=/story/elements-image--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                                                                                                                                                                                                                                          | Default | Description                                                                                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                                                                                                                                                                                                                                      | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                             |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                                                                                                                                                       | —       | Text color helper for the container.                                                                                                                                                                                                                                                         |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                               | —       | Text color alias: renders `has-text-<color>`, exactly like `textColor`. Not a filled variant (no `.image.is-<color>` CSS exists). Prefer `textColor`, which takes precedence when both are set; use `bgColor` for a colored surface.                                                         |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                                                                                                                                                       | —       | Background color helper for the container.                                                                                                                                                                                                                                                   |
| `size`      | `'16x16'` \| `'24x24'` \| `'32x32'` \| `'48x48'` \| `'64x64'` \| `'96x96'` \| `'128x128'` \| `'square'` \| `'1by1'` \| `'5by4'` \| `'4by3'` \| `'3by2'` \| `'5by3'` \| `'16by9'` \| `'2by1'` \| `'3by1'` \| `'4by5'` \| `'3by4'` \| `'2by3'` \| `'3by5'` \| `'9by16'` \| `'1by2'` \| `'1by3'` | —       | Fixed size or aspect ratio modifier for the image container. A ratio (`16by9` and the rest) renders only its `is-<ratio>` class there. Bulma stretches an `<img>` inside to fill the ratio, but any other child, such as an `iframe`, fills it only with `className="has-ratio"` of its own. |
| `isRounded` | `boolean`                                                                                                                                                                                                                                                                                     | `false` | Renders the image with rounded corners.                                                                                                                                                                                                                                                      |
| `isRetina`  | `boolean`                                                                                                                                                                                                                                                                                     | `false` | Uses retina (2x) image source.                                                                                                                                                                                                                                                               |
| `src`       | `string`                                                                                                                                                                                                                                                                                      | —       | Image source URL.                                                                                                                                                                                                                                                                            |
| `alt`       | `string`                                                                                                                                                                                                                                                                                      | —       | Alternate text for the image: what it shows, for a reader who can't see it. Pass `alt=""` for a decorative image, which a screen reader then skips. Left unset, the `<img>` has no alt, and a development build warns.                                                                       |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                             | —       | Arbitrary content (e.g., iframe, custom HTML) inside the image container.                                                                                                                                                                                                                    |
| `as`        | `'figure'` \| `'div'` \| `'p'`                                                                                                                                                                                                                                                                | —       | Container element tag. Defaults to `'figure'` when using aspect-ratio sizes, `'div'` otherwise.                                                                                                                                                                                              |
| `...`       | All standard HTML attributes and Bulma helper props                                                                                                                                                                                                                                           | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                            |

<!-- /bestax:generated props -->
