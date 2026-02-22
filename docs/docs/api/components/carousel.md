---
title: Carousel
sidebar_label: Carousel
---

# Carousel

## Overview

The `Carousel` component provides an image/content slider with navigation arrows and indicators. It supports auto-play, drag navigation, and customizable styles.

:::info
The Carousel component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Carousel, CarouselItem } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

### Carousel

| Prop                | Type                                                                       | Default    | Description                                      |
| ------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `value`             | `number`                                                                   | `0`        | Current active slide index (controlled).         |
| `autoplay`          | `boolean`                                                                  | `false`    | Enable auto-play.                                |
| `interval`          | `number`                                                                   | `5000`     | Auto-play interval in milliseconds.              |
| `pauseOnHover`      | `boolean`                                                                  | `true`     | Pause auto-play on hover.                        |
| `repeat`            | `boolean`                                                                  | `true`     | Loop back to first slide after last.             |
| `hasDrag`           | `boolean`                                                                  | `true`     | Enable drag/swipe navigation.                    |
| `arrow`             | `boolean`                                                                  | `true`     | Show navigation arrows.                          |
| `arrowHover`        | `boolean`                                                                  | `false`    | Only show arrows on hover.                       |
| `arrowBackground`   | `boolean`                                                                  | `true`     | Show semi-transparent background on arrow buttons. Set to `false` for icon-only arrows. |
| `iconPrev`          | `string`                                                                   | —          | Icon name for the previous arrow button.         |
| `iconNext`          | `string`                                                                   | —          | Icon name for the next arrow button.             |
| `iconLibrary`       | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'` | —          | Icon library to use.                             |
| `iconVariant`       | `string`                                                                   | —          | Icon style variant (e.g., 'solid', 'outlined').  |
| `iconSize`          | `'small'` \| `'medium'` \| `'large'`                                       | —          | Icon size modifier.                              |
| `iconFeatures`      | `string \| string[]`                                                       | —          | Additional icon modifiers.                       |
| `indicator`         | `boolean`                                                                  | `true`     | Show slide indicators.                           |
| `indicatorInside`   | `boolean`                                                                  | `false`    | Position indicators inside carousel.             |
| `indicatorPosition` | `'bottom'` \| `'top'`                                                      | `'bottom'` | Indicator position.                              |
| `indicatorStyle`    | `'circles'` \| `'dots'` \| `'lines'` \| `'bars'`                           | `'dots'`   | Indicator style.                                 |
| `onChange`          | `(value: number) => void`                                                  | —          | Callback when slide changes.                     |
| `children`          | `React.ReactNode`                                                          | —          | CarouselItem children.                           |
| `className`         | `string`                                                                   | —          | Additional CSS classes.                          |
| `ref`               | `React.Ref<HTMLElement>`                                                   | —          | Ref forwarded to the carousel element.           |
| ...                 | All standard HTML and Bulma helper props                                   |            | (See [Helper Props](../helpers/usebulmaclasses)) |

### CarouselItem

| Prop        | Type      | Default | Description                                      |
| ----------- | --------- | ------- | ------------------------------------------------ |
| `active`    | `boolean` | —       | Whether this item is active (set automatically). |
| `className` | `string`  | —       | Additional CSS classes.                          |

---

## Usage

### Basic Carousel

A simple carousel with content slides.

```tsx live
<Carousel indicatorStyle="dots">
  <CarouselItem>
    <div
      style={{
        background: '#485fc7',
        color: '#fff',
        padding: '3rem',
        textAlign: 'center',
      }}
    >
      <Title subtitle textColor="white">
        Slide 1
      </Title>
      <p className="has-text-white">First slide content</p>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{
        background: '#48c78e',
        color: '#fff',
        padding: '3rem',
        textAlign: 'center',
      }}
    >
      <Title subtitle textColor="white">
        Slide 2
      </Title>
      <p className="has-text-white">Second slide content</p>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{
        background: '#f14668',
        color: '#fff',
        padding: '3rem',
        textAlign: 'center',
      }}
    >
      <Title subtitle textColor="white">
        Slide 3
      </Title>
      <p className="has-text-white">Third slide content</p>
    </div>
  </CarouselItem>
</Carousel>
```

---

### Auto-playing Carousel

Carousel that automatically advances slides.

```tsx live
<Carousel autoplay interval={3000}>
  <CarouselItem>
    <div
      style={{ background: '#3e8ed0', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Auto Slide 1
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#ffe08a', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle>Auto Slide 2</Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#48c78e', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Auto Slide 3
      </Title>
    </div>
  </CarouselItem>
</Carousel>
```

---

### Indicator Styles

Different indicator style options.

```tsx live
function example() {
  const [style, setStyle] = useState('dots');
  return (
    <div>
      <div className="buttons mb-4">
        <Button
          onClick={() => setStyle('dots')}
          color={style === 'dots' ? 'primary' : undefined}
        >
          Dots
        </Button>
        <Button
          onClick={() => setStyle('circles')}
          color={style === 'circles' ? 'primary' : undefined}
        >
          Circles
        </Button>
        <Button
          onClick={() => setStyle('lines')}
          color={style === 'lines' ? 'primary' : undefined}
        >
          Lines
        </Button>
        <Button
          onClick={() => setStyle('bars')}
          color={style === 'bars' ? 'primary' : undefined}
        >
          Bars
        </Button>
      </div>
      <Carousel indicatorStyle={style}>
        <CarouselItem>
          <div
            style={{
              background: '#485fc7',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p className="has-text-white">Slide 1</p>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div
            style={{
              background: '#48c78e',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p className="has-text-white">Slide 2</p>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div
            style={{
              background: '#f14668',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p className="has-text-white">Slide 3</p>
          </div>
        </CarouselItem>
      </Carousel>
    </div>
  );
}
```

---

### Without Arrows

Carousel with indicators only.

```tsx live
<Carousel arrow={false}>
  <CarouselItem>
    <div
      style={{ background: '#00d1b2', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Swipe or Click Dots
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#485fc7', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Navigation Only
      </Title>
    </div>
  </CarouselItem>
</Carousel>
```

---

### Arrows on Hover

Show arrows only when hovering over the carousel.

```tsx live
<Carousel arrowHover>
  <CarouselItem>
    <div
      style={{ background: '#363636', padding: '3rem', textAlign: 'center' }}
    >
      <p className="has-text-white">Hover to see arrows</p>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#485fc7', padding: '3rem', textAlign: 'center' }}
    >
      <p className="has-text-white">Slide 2</p>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#48c78e', padding: '3rem', textAlign: 'center' }}
    >
      <p className="has-text-white">Slide 3</p>
    </div>
  </CarouselItem>
</Carousel>
```

---

### Transparent Arrow Buttons

Remove the arrow button backgrounds to show just the icons.

```tsx live
<Carousel arrowBackground={false}>
  <CarouselItem>
    <div
      style={{ background: '#485fc7', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 1
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#48c78e', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 2
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#f14668', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 3
      </Title>
    </div>
  </CarouselItem>
</Carousel>
```

---

### Custom Arrow Icons

Customize navigation arrows using the icon props. The Carousel uses the Icon component internally.

```tsx live
<Carousel
  iconPrev="chevron-left"
  iconNext="chevron-right"
  iconLibrary="fa"
  iconVariant="solid"
>
  <CarouselItem>
    <div
      style={{ background: '#485fc7', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 1
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#48c78e', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 2
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#f14668', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 3
      </Title>
    </div>
  </CarouselItem>
</Carousel>
```

### With Material Design Icons

```tsx live
<Carousel iconPrev="arrow-left" iconNext="arrow-right" iconLibrary="mdi">
  <CarouselItem>
    <div
      style={{ background: '#485fc7', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 1
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#48c78e', padding: '3rem', textAlign: 'center' }}
    >
      <Title subtitle textColor="white">
        Slide 2
      </Title>
    </div>
  </CarouselItem>
</Carousel>
```

:::tip Icon Libraries
The icon props follow the same naming as the [Icon component](../elements/icon.md). See [Alternative Icon Libraries](../../guides/getting-started/alternative-icons.md) for setup instructions.
:::

---

### Controlled Carousel

Externally controlled carousel with custom navigation.

```tsx live
function example() {
  const [currentSlide, setCurrentSlide] = useState(0);
  return (
    <div>
      <div className="buttons mb-4">
        <Button
          onClick={() => setCurrentSlide(0)}
          color={currentSlide === 0 ? 'primary' : undefined}
        >
          1
        </Button>
        <Button
          onClick={() => setCurrentSlide(1)}
          color={currentSlide === 1 ? 'primary' : undefined}
        >
          2
        </Button>
        <Button
          onClick={() => setCurrentSlide(2)}
          color={currentSlide === 2 ? 'primary' : undefined}
        >
          3
        </Button>
      </div>
      <Carousel
        value={currentSlide}
        onChange={setCurrentSlide}
        indicator={false}
      >
        <CarouselItem>
          <div
            style={{
              background: '#485fc7',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p className="has-text-white">Slide 1</p>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div
            style={{
              background: '#48c78e',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p className="has-text-white">Slide 2</p>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div
            style={{
              background: '#f14668',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p className="has-text-white">Slide 3</p>
          </div>
        </CarouselItem>
      </Carousel>
      <p className="mt-2">Current slide: {currentSlide + 1}</p>
    </div>
  );
}
```

---

### Non-repeating Carousel

Carousel that stops at the first and last slides.

```tsx live
<Carousel repeat={false}>
  <CarouselItem>
    <div
      style={{ background: '#f14668', padding: '3rem', textAlign: 'center' }}
    >
      <p className="has-text-white">First (no previous)</p>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#ffe08a', padding: '3rem', textAlign: 'center' }}
    >
      <p>Middle slide</p>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{ background: '#48c78e', padding: '3rem', textAlign: 'center' }}
    >
      <p className="has-text-white">Last (no next)</p>
    </div>
  </CarouselItem>
</Carousel>
```

---

## Accessibility

- Uses `role="region"` with `aria-roledescription="carousel"`
- Navigation arrows have `aria-label` for screen readers
- Indicators use `role="tablist"` and `role="tab"` semantics
- Keyboard navigation with arrow keys when focused
- Previous/Next buttons are properly disabled at boundaries when not repeating

---

## Related Components

- [Modal](./modal.md) - For displaying content in an overlay
- [Tabs](./tabs.md) - For tabbed content navigation

---

## Additional Resources

- [Storybook: Carousel Stories](https://bestax.io/storybook/?path=/story/components-carousel)

:::tip Pro Tip
Use the `pauseOnHover` prop (enabled by default) to let users interact with carousel content without it auto-advancing.
:::
