---
title: Lightbox
sidebar_label: Lightbox
description: The `Lightbox` component shows a set of images one at a time in a modal viewer, with previous and next, a counter, captions and zoom, opened from the `Lightbox.Trigger` buttons you place.
keywords:
  - lightbox
  - image preview
  - image viewer
  - photo viewer
  - gallery
  - media viewer
  - zoom
---

# Lightbox

## Overview

<!-- bestax:generated overview -->

The `Lightbox` component shows a set of images one at a time in a modal viewer, with previous and next, a counter, captions and zoom, opened from the `Lightbox.Trigger` buttons you place.

<!-- /bestax:generated overview -->

Reach for it when people want to see pictures bigger than the page shows them: a product's photos,
a property listing's album behind a "View all photos" button, a gallery in a blog post, or a
screenshot or a scanned page someone has to zoom into to read.

You give it the images as `items`, and put a `Lightbox.Trigger` around each thumbnail, wherever
your layout wants it. A trigger is a real button, so each thumbnail can be reached and opened from
the keyboard, and focus goes back to it when the viewer closes. The viewer is a `Modal`: focus
moves to its close button, Tab stays inside, Escape and a click on the dark background close it,
and the page behind doesn't scroll.

:::info
Bulma's docs build an image modal from `.modal`, `.modal-content` and `.modal-close`. `Lightbox`
renders those same classes and adds what a viewer needs on top, in its own styles in `bestax.css`
and its variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Lightbox } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Pass the images in order, each a `src` and an `alt`, and put a trigger with the image's `index`
around each thumbnail. `Lightbox` renders its children where it stands, with no wrapper of its
own, so the triggers sit straight in `Columns` or a `Grid`.

```tsx live
function example() {
  const photos = [
    {
      src: '/img/carousel/carousel-banner-1.jpg',
      alt: 'Vibrant galaxy with purple and gold tones',
      caption: 'A galaxy in purple and gold',
    },
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'Milky Way over silhouetted mountains',
    },
    {
      src: '/img/carousel/carousel-banner-3.jpg',
      alt: 'Starry night sky over mountain silhouettes',
    },
  ];

  return (
    <Lightbox items={photos}>
      <Columns isMobile>
        {photos.map((photo, i) => (
          <Column key={photo.src} size="one-third">
            <Lightbox.Trigger index={i}>
              <Image as="div" src={photo.src} alt={photo.alt} size="4by3" />
            </Lightbox.Trigger>
          </Column>
        ))}
      </Columns>
    </Lightbox>
  );
}
```

The thumbnail's `alt` is the trigger's name, so a screen reader hears the button as the photo it
opens. A ratio `Image` renders a `<figure>` unless you say otherwise, and an image inside a figure
doesn't name the button around it, so a thumbnail in a trigger takes `as="div"`. A development
build warns about a trigger with no name. A real gallery would give each thumbnail a smaller file
of its own than the image the viewer shows.

### A Button That Opens the Album

A trigger can open the viewer at any image, so a cover photo or a "View all photos" button is a
trigger with `index={0}`. Here the words name the button, so the image inside is decoration with
an empty `alt`. The viewer goes from the last image back to the first, as Carousel does, and
`repeat={false}` stops it at the ends.

```tsx live
function example() {
  const photos = [
    {
      src: '/img/carousel/carousel-banner-3.jpg',
      alt: 'Starry night sky over mountain silhouettes',
    },
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'Milky Way over silhouetted mountains',
    },
    {
      src: '/img/carousel/carousel-banner-1.jpg',
      alt: 'Vibrant galaxy with purple and gold tones',
    },
  ];

  return (
    <Lightbox items={photos}>
      <Lightbox.Trigger index={0}>
        <Image as="div" src={photos[0].src} alt="" size="16by9" />
        <Span display="block" mt="2" textWeight="semibold">
          View all {photos.length} photos
        </Span>
      </Lightbox.Trigger>
    </Lightbox>
  );
}
```

A trigger draws nothing of its own and fills the width it's given. Render it through `Button` with
`as` and it takes Button's props, so `as={Button} color="link"` is Bulma's link button:

```tsx live
<Lightbox
  items={[
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'Milky Way over silhouetted mountains',
    },
  ]}
>
  <Lightbox.Trigger as={Button} color="link" index={0}>
    Open the photo
  </Lightbox.Trigger>
</Lightbox>
```

### Captions and Sizes

An item's `caption` is shown under the image as its `<figcaption>`, and can hold markup.

```tsx live
function example() {
  const photos = [
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'Milky Way over silhouetted mountains',
      caption: (
        <>
          <strong>The Milky Way</strong>, over a line of peaks
        </>
      ),
    },
    {
      src: '/img/carousel/carousel-banner-3.jpg',
      alt: 'Starry night sky over mountain silhouettes',
      caption: 'Stars over the mountains',
    },
  ];

  return (
    <Lightbox items={photos}>
      <Buttons>
        {photos.map((photo, i) => (
          <Lightbox.Trigger key={photo.src} as={Button} index={i}>
            Photo {i + 1}
          </Lightbox.Trigger>
        ))}
      </Buttons>
    </Lightbox>
  );
}
```

`srcSet` and `sizes` go on the `<img>` as they would anywhere, so the browser picks a file for the
screen, and the images either side of the one shown are fetched ahead with them:

```tsx
const photos = [
  {
    src: '/photos/harbour-1600.jpg',
    srcSet: '/photos/harbour-800.jpg 800w, /photos/harbour-1600.jpg 1600w',
    sizes: '100vw',
    alt: 'Harbour at dusk',
  },
];
```

### Keeping the Image in the URL

Both pairs of state are yours to hold when you need them: `open` with `onOpenChange`, and `value`
(the index of the image shown) with `onChange`. Here they're one piece of state, as a `?photo=`
query would be. A trigger calls `onChange` with its index before `onOpenChange(true)`, even when
it's the image already shown, so a parent that opens the viewer from `value` hears it. A `value`
past either end wraps round, or with `repeat={false}` shows the last or the first image, and
doesn't call `onChange`.

```tsx live
function example() {
  const [photo, setPhoto] = useState<number>();
  const photos = [
    {
      src: '/img/carousel/carousel-banner-1.jpg',
      alt: 'Vibrant galaxy with purple and gold tones',
    },
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'Milky Way over silhouetted mountains',
    },
    {
      src: '/img/carousel/carousel-banner-3.jpg',
      alt: 'Starry night sky over mountain silhouettes',
    },
  ];

  return (
    <>
      <Paragraph mb="3">
        {photo === undefined ? 'No photo open.' : `?photo=${photo + 1}`}
      </Paragraph>
      <Button onClick={() => setPhoto(2)}>Open the third photo</Button>
      <Lightbox
        items={photos}
        open={photo !== undefined}
        onOpenChange={open => !open && setPhoto(undefined)}
        value={photo ?? 0}
        onChange={setPhoto}
      />
    </>
  );
}
```

Without `value`, the viewer remembers the last image shown, and opens there when `open` or
`defaultOpen` opens it. `defaultValue` is where it starts.

### Zoom

Zoom is on by default: the zoom buttons, the wheel at the pointer, a double click or a double tap,
pinch, and the `+`, `-` and `0` keys. A zoomed image pans by dragging it or with the arrow keys,
and stops at its edges. `maxZoom` sets how far it goes, as a multiple of the fitted size, 3 unless
you say otherwise. A move to another image fits it again.

```tsx live
<Lightbox
  maxZoom={6}
  items={[
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'Milky Way over silhouetted mountains',
      caption: 'Zoom in on the stars',
    },
  ]}
>
  <Lightbox.Trigger as={Button} index={0}>
    Open the tall photo
  </Lightbox.Trigger>
</Lightbox>
```

`zoomable={false}` drops the zoom buttons, the gestures and the keys, for images there's nothing
to gain from zooming into.

### Other Languages and Right to Left

Every word the viewer writes is in `labels`, and `ariaLabel` names the dialog. Inside a
`LocaleProvider` the numbers in the counter and in the default progress line are written in its
locale, and with `dir="rtl"` the previous button sits on the right, the left arrow key and a swipe
to the right go forward, and the toolbar mirrors. A `progress` of your own gets the numbers as
they are, so format them yourself.

```tsx live
function example() {
  const arabic = new Intl.NumberFormat('ar-EG');
  const photos = [
    {
      src: '/img/carousel/carousel-banner-2.jpg',
      alt: 'درب التبانة فوق ظلال الجبال',
    },
    {
      src: '/img/carousel/carousel-banner-3.jpg',
      alt: 'سماء ليلية مرصعة بالنجوم فوق قمم الجبال',
    },
  ];

  return (
    <LocaleProvider dir="rtl" locale="ar-EG">
      <Lightbox
        items={photos}
        ariaLabel="عارض الصور"
        labels={{
          close: 'إغلاق',
          previous: 'الصورة السابقة',
          next: 'الصورة التالية',
          zoomIn: 'تكبير',
          zoomOut: 'تصغير',
          resetZoom: 'إعادة الحجم',
          loading: 'جارٍ تحميل الصورة',
          loadError: 'تعذّر تحميل هذه الصورة.',
          retry: 'إعادة المحاولة',
          progress: (current, total) =>
            `الصورة ${arabic.format(current)} من ${arabic.format(total)}`,
        }}
      >
        <Lightbox.Trigger as={Button} index={0}>
          عرض الصور
        </Lightbox.Trigger>
      </Lightbox>
    </LocaleProvider>
  );
}
```

### Compound (dot-notation) usage

`Lightbox.Trigger` is attached to `Lightbox`, and also exported on its own as `LightboxTrigger`.

```tsx live
<Lightbox
  items={[
    {
      src: '/img/carousel/carousel-banner-1.jpg',
      alt: 'Vibrant galaxy with purple and gold tones',
    },
    {
      src: '/img/carousel/carousel-banner-3.jpg',
      alt: 'Starry night sky over mountain silhouettes',
    },
  ]}
>
  <Buttons>
    <LightboxTrigger as={Button} index={0}>
      LightboxTrigger
    </LightboxTrigger>
    <Lightbox.Trigger as={Button} index={1}>
      Lightbox.Trigger
    </Lightbox.Trigger>
  </Buttons>
</Lightbox>
```

---

## Keys and Gestures

| Key or gesture                           | What it does                                                          |
| ---------------------------------------- | --------------------------------------------------------------------- |
| Left and Right Arrow                     | The previous and next image, swapped right to left. While zoomed, pan |
| Up and Down Arrow                        | Pan, while zoomed                                                     |
| Home and End                             | The first and the last image                                          |
| `+` (or `=`), `-` and `0`                | Zoom in, zoom out, and fit the image again                            |
| Escape                                   | Close                                                                 |
| Swipe left or right                      | The next or previous image, the way the arrows point                  |
| Swipe down                               | Close                                                                 |
| Wheel                                    | Zoom at the pointer                                                   |
| Double click or double tap               | Zoom to twice the fitted size at the pointer, and back                |
| Pinch                                    | Zoom, following the fingers                                           |
| Drag, while zoomed                       | Pan                                                                   |
| Click on the background around the image | Close, unless `closeOnClickOutside` is `false`                        |

Swipes start on the image, or on a failed image's message, and stop while it's zoomed, when a drag
pans instead. A press on the caption, a link or Retry keeps its own behavior, so the caption's
text can be selected. Zoom waits for the image to
load. Keys with Ctrl,
Alt or Command held are left to the browser, so its own zoom still works, and keys typed into a
field in a caption are the field's.

---

## Accessibility

- **A modal dialog:** the viewer is a `Modal` with `role="dialog"` and `aria-modal`, named by
  `ariaLabel` ("Image viewer" by default) rather than by the image's alt, which changes with every
  image. Focus moves to the close button when it opens, Tab stays inside, Escape closes it when
  it's the topmost overlay, and focus goes back to the trigger, or to whatever had it when `open`
  was set.
- **Real triggers:** each `Lightbox.Trigger` is a `<button type="button" aria-haspopup="dialog">`,
  or the button `Button` renders with `as={Button}`, named by its content. So the thumbnail's `alt`
  is the button's name, as long as it isn't inside a `<figure>` (give a ratio `Image` `as="div"`).
- **Every image has an alt:** `alt` is required in the type, a development build warns once for an
  item without one, and the caption is the `<figure>`'s `<figcaption>`, which names it.
- **Moves are announced:** after the viewer opens and after each move, a polite status line says
  "Image 3 of 10: Harbour at dusk", from `labels.progress` and the image's alt. The visible counter
  is hidden from screen readers, so it isn't read twice. For an image that fails to load, the line
  starts with `labels.loadError`: "This image didn't load. Image 3 of 10: Harbour at dusk", and a
  Retry that fails again is announced again.
- **At the ends:** with `repeat={false}`, the previous or next button is `aria-disabled` but stays in
  the tab order, so focus isn't dropped when it stops working. The zoom buttons do the same at their
  limits.
- **Single-pointer alternatives:** pinch has the zoom buttons and a double click or tap. Panning a
  zoomed image is a drag, so zoom-out and reset are always one press away, and the arrow keys pan.
- **Right to left:** the arrows, the keys and swipes follow the reading direction, so the next
  image is always the way the next arrow points.
- **Contrast:** the counter, the caption and the buttons' icons are white on Bulma's near-black
  modal background in both schemes, well over the 4.5:1 WCAG asks of text.
- **Forced colors:** the buttons draw their borders in the system's colors and the focus ring
  shows.
- **Motion:** the open fade, the crossfade between images and the zoom transition stop under
  `prefers-reduced-motion: reduce`.

---

## Related Components

- [`Modal`](./modal.md): The dialog the viewer is built on, for content that isn't a set of
  images.
- [`Image`](../elements/image.md): The thumbnails inside the triggers.
- [`Carousel`](./carousel.md): Images in a strip on the page, rather than over it.
- [`Figure`](../elements/figure.md): An image with its caption, on the page.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Lightbox Stories](https://bestax.io/storybook/?path=/story/components-lightbox--default)
- [Bulma: Modal (the image modal example)](https://bulma.io/documentation/components/modal/)
- [WAI-ARIA Authoring Practices: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WCAG 2.2: Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [WCAG 2.2: Understanding Pointer Gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                   | Default          | Description                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`               | `LightboxItem[]`                                       | —                | **Required.** The images, in order.                                                                                                                                                                                                                                                                                                                                             |
| `children`            | `React.ReactNode`                                      | —                | Rendered in place: usually `Lightbox.Trigger`s, in whatever layout you like.                                                                                                                                                                                                                                                                                                    |
| `open`                | `boolean`                                              | —                | Whether the viewer is open (controlled). With no `items` it shows nothing.                                                                                                                                                                                                                                                                                                      |
| `defaultOpen`         | `boolean`                                              | `false`          | Whether the viewer starts open (uncontrolled).                                                                                                                                                                                                                                                                                                                                  |
| `onOpenChange`        | `(open: boolean) => void`                              | —                | Called when a trigger, the close button, Escape, a click on the background or a swipe down opens or closes the viewer, and with `false` when `items` goes from some to none while it's open.                                                                                                                                                                                    |
| `value`               | `number`                                               | —                | The index of the image shown (controlled). A value past either end is shown as the last or the first image, or wrapped round with `repeat`, without calling `onChange`.                                                                                                                                                                                                         |
| `defaultValue`        | `number`                                               | `0`              | The image an uncontrolled viewer shows when something other than a trigger opens it. A trigger opens at its own `index`.                                                                                                                                                                                                                                                        |
| `onChange`            | `(value: number) => void`                              | —                | Called with the new index when an arrow, a key or a swipe changes the image, and when a trigger opens the viewer, with the trigger's `index` even when that's the image already shown, before `onOpenChange(true)`. A parent that opens the viewer from `value` hears the trigger that way.                                                                                     |
| `repeat`              | `boolean`                                              | `true`           | Go from the last image to the first and back, as Carousel does. Off, the previous and next buttons are `aria-disabled` at the ends.                                                                                                                                                                                                                                             |
| `zoomable`            | `boolean`                                              | `true`           | Zoom with the buttons, the wheel, a double click or tap, pinch and the `+`, `-` and `0` keys, and pan a zoomed image by dragging or with the arrow keys. Zoom waits for the image to load. `false` drops the zoom buttons and all of it.                                                                                                                                        |
| `maxZoom`             | `number`                                               | `3`              | How far an image zooms, as a multiple of its fitted size. The smallest zoom is always the fitted size.                                                                                                                                                                                                                                                                          |
| `closeOnEscape`       | `boolean`                                              | `true`           | Close on Escape. Only the topmost open overlay answers, as with Modal.                                                                                                                                                                                                                                                                                                          |
| `closeOnClickOutside` | `boolean`                                              | `true`           | Close on a click on the dark background around the image. The space around the image, beside the toolbar's buttons and under the caption is all background.                                                                                                                                                                                                                     |
| `portal`              | `boolean` \| `string` \| `HTMLElement`                 | `true`           | Renders the viewer into a portal: `true` for the `ConfigProvider`'s `portalContainer` (`document.body` by default), a selector string, or an element. `false` renders it in place. It's on by default, unlike Modal's, Dialog's and Command.Dialog's, because its triggers sit in gallery cells, and a cell with a transform or a filter would trap a viewer rendered in place. |
| `ariaLabel`           | `string`                                               | `'Image viewer'` | The dialog's accessible name. It stays the same from image to image; the status line says which image is shown.                                                                                                                                                                                                                                                                 |
| `labels`              | `LightboxLabels`                                       | —                | The words it writes, for another language.                                                                                                                                                                                                                                                                                                                                      |
| `className`           | `string`                                               | —                | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                         |
| `ref`                 | `React.Ref<HTMLDivElement>`                            | —                | Ref forwarded to the viewer's `.modal` element, `null` while it's closed.                                                                                                                                                                                                                                                                                                       |
| `...`                 | All standard `<div>` attributes and Bulma helper props | —                | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                               |

**Subcomponents:**

- `Lightbox.Trigger`: A button around a thumbnail, or a line of text, that opens the viewer at its `index`.

### Lightbox.Trigger

| Prop        | Type                                                                                                     | Default    | Description                                                                                                                                                                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`        | `React.ElementType`                                                                                      | `'button'` | Renders the trigger through another component, which gets its class, `aria-haspopup`, `type="button"`, click handler and ref along with its own props. `as={Button} color="link"` draws it as Bulma's link button. `color` is taken only with a component: on an element it would be HTML's old presentational attribute. |
| `index`     | `number`                                                                                                 | —          | **Required.** The index in `items` the viewer opens at.                                                                                                                                                                                                                                                                   |
| `children`  | `React.ReactNode`                                                                                        | —          | What the button shows: a thumbnail, or text such as "View all photos". A ratio `Image` here takes `as="div"`, since its `<figure>` would keep the image's alt from naming the button.                                                                                                                                     |
| `className` | `string`                                                                                                 | —          | Additional CSS classes.                                                                                                                                                                                                                                                                                                   |
| `ref`       | `PolymorphicRef<React.ElementType>`                                                                      | —          | Ref forwarded to the element `as` renders: the `<button>`, or what `Button` renders.                                                                                                                                                                                                                                      |
| `...`       | Remaining props of the element or component selected by `as` (default `<button>`) and Bulma helper props | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                         |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Lightbox` registers these variables on a compound selector (higher specificity than a single class). Override them with inline `style`, or with a selector that exceeds that specificity (one that only matches it must load after the library styles to win by source order) — a lone class via `className` loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                       | Sass Variable                               | Default                                                                                 |
| -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `--bulma-lightbox-arrow-background`                | `$lightbox-arrow-background`                | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.3)` |
| `--bulma-lightbox-arrow-background-hover`          | `$lightbox-arrow-background-hover`          | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.5)` |
| `--bulma-lightbox-arrow-color`                     | `$lightbox-arrow-color`                     | `var(--bulma-white)`                                                                    |
| `--bulma-lightbox-arrow-size`                      | `$lightbox-arrow-size`                      | `3rem`                                                                                  |
| `--bulma-lightbox-arrow-offset`                    | `$lightbox-arrow-offset`                    | `1rem`                                                                                  |
| `--bulma-lightbox-arrow-icon-size`                 | `$lightbox-arrow-icon-size`                 | `1.5rem`                                                                                |
| `--bulma-lightbox-toolbar-button-background`       | `$lightbox-toolbar-button-background`       | `var(--bulma-lightbox-arrow-background)`                                                |
| `--bulma-lightbox-toolbar-button-background-hover` | `$lightbox-toolbar-button-background-hover` | `var(--bulma-lightbox-arrow-background-hover)`                                          |
| `--bulma-lightbox-toolbar-icon-size`               | `$lightbox-toolbar-icon-size`               | `1.25rem`                                                                               |
| `--bulma-lightbox-button-border-width`             | `$lightbox-button-border-width`             | `1px`                                                                                   |
| `--bulma-lightbox-disabled-opacity`                | `$lightbox-disabled-opacity`                | `0.4`                                                                                   |
| `--bulma-lightbox-controls-z-index`                | `$lightbox-controls-z-index`                | `$extras-z-index-base`                                                                  |
| `--bulma-lightbox-toolbar-color`                   | `$lightbox-toolbar-color`                   | `var(--bulma-white)`                                                                    |
| `--bulma-lightbox-toolbar-gap`                     | `$lightbox-toolbar-gap`                     | `0.75rem`                                                                               |
| `--bulma-lightbox-caption-color`                   | `$lightbox-caption-color`                   | `var(--bulma-white)`                                                                    |
| `--bulma-lightbox-caption-max-width`               | `$lightbox-caption-max-width`               | `40em`                                                                                  |
| `--bulma-lightbox-caption-padding`                 | `$lightbox-caption-padding`                 | `0.75rem 1rem 0`                                                                        |
| `--bulma-lightbox-error-color`                     | `$lightbox-error-color`                     | `var(--bulma-lightbox-caption-color)`                                                   |
| `--bulma-lightbox-error-gap`                       | `$lightbox-error-gap`                       | `0.75rem`                                                                               |
| `--bulma-lightbox-error-padding`                   | `$lightbox-error-padding`                   | `1rem`                                                                                  |
| `--bulma-lightbox-loader-size`                     | `$lightbox-loader-size`                     | `2.5rem`                                                                                |
| `--bulma-lightbox-spacing`                         | `$lightbox-spacing`                         | `4.5rem`                                                                                |
| `--bulma-lightbox-image-max-height`                | `$lightbox-image-max-height`                | `calc(100% - 2 * var(--bulma-lightbox-spacing))`                                        |
| `--bulma-lightbox-animation-duration`              | `$lightbox-animation-duration`              | `var(--bulma-duration)`                                                                 |

<!-- /bestax:generated cssvars -->
