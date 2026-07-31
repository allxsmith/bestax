---
title: Carousel
sidebar_label: Carousel
description: The `Carousel` component provides an image/content slider with navigation arrows and indicators.
---

# Carousel

## Overview

<!-- bestax:generated overview -->

The `Carousel` component provides an image/content slider with navigation arrows and indicators.

<!-- /bestax:generated overview -->

It supports auto-play, drag navigation, and customizable styles.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Carousel, CarouselItem } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Carousel

A simple carousel with colored slides using the Hero component.

```tsx live
<Carousel indicatorStyle="dots">
  <CarouselItem>
    <Hero color="primary" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 1</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 2</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="danger" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 3</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
</Carousel>
```

---

### Auto-playing Carousel

Carousel that automatically advances slides.

```tsx live
<Carousel autoplay interval={3000}>
  <CarouselItem>
    <Hero color="info" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Info</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="warning" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Warning</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Success</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
</Carousel>
```

---

### Indicator Styles

Different indicator style options.

```tsx live
function IndicatorExample() {
  const [style, setStyle] = useState('dots');
  return (
    <Block>
      <Buttons mb="4">
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
      </Buttons>
      <Carousel indicatorStyle={style}>
        <CarouselItem>
          <Hero color="primary" size="medium">
            <Hero.Body textAlign="centered">
              <Paragraph textColor="white">Slide 1</Paragraph>
            </Hero.Body>
          </Hero>
        </CarouselItem>
        <CarouselItem>
          <Hero color="success" size="medium">
            <Hero.Body textAlign="centered">
              <Paragraph textColor="white">Slide 2</Paragraph>
            </Hero.Body>
          </Hero>
        </CarouselItem>
        <CarouselItem>
          <Hero color="danger" size="medium">
            <Hero.Body textAlign="centered">
              <Paragraph textColor="white">Slide 3</Paragraph>
            </Hero.Body>
          </Hero>
        </CarouselItem>
      </Carousel>
    </Block>
  );
}
```

---

### Without Arrows

Carousel with indicators only.

```tsx live
<Carousel arrow={false}>
  <CarouselItem>
    <Hero color="primary" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Swipe or Click Dots</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="link" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Navigation Only</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
</Carousel>
```

---

### Arrows on Hover

Show arrows only when hovering over the carousel.

```tsx live
<Carousel arrowHover>
  <CarouselItem>
    <Hero color="dark" size="medium">
      <Hero.Body textAlign="centered">
        <Paragraph textColor="white">Hover to see arrows</Paragraph>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="primary" size="medium">
      <Hero.Body textAlign="centered">
        <Paragraph textColor="white">Slide 2</Paragraph>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Paragraph textColor="white">Slide 3</Paragraph>
      </Hero.Body>
    </Hero>
  </CarouselItem>
</Carousel>
```

---

### Transparent Arrow Buttons

Remove the arrow button backgrounds to show just the icons.

```tsx live
<Carousel arrowBackground={false}>
  <CarouselItem>
    <Hero color="primary" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 1</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 2</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="danger" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 3</Title>
      </Hero.Body>
    </Hero>
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
    <Hero color="primary" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 1</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 2</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="danger" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 3</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
</Carousel>
```

### With Material Design Icons

```tsx live
<Carousel iconPrev="arrow-left" iconNext="arrow-right" iconLibrary="mdi">
  <CarouselItem>
    <Hero color="primary" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 1</Title>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Title as="p">Slide 2</Title>
      </Hero.Body>
    </Hero>
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
function ControlledExample() {
  const [currentSlide, setCurrentSlide] = useState(0);
  return (
    <Block>
      <Buttons mb="4">
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
      </Buttons>
      <Carousel
        value={currentSlide}
        onChange={setCurrentSlide}
        indicator={false}
      >
        <CarouselItem>
          <Hero color="primary" size="medium">
            <Hero.Body textAlign="centered">
              <Paragraph textColor="white">Slide 1</Paragraph>
            </Hero.Body>
          </Hero>
        </CarouselItem>
        <CarouselItem>
          <Hero color="success" size="medium">
            <Hero.Body textAlign="centered">
              <Paragraph textColor="white">Slide 2</Paragraph>
            </Hero.Body>
          </Hero>
        </CarouselItem>
        <CarouselItem>
          <Hero color="danger" size="medium">
            <Hero.Body textAlign="centered">
              <Paragraph textColor="white">Slide 3</Paragraph>
            </Hero.Body>
          </Hero>
        </CarouselItem>
      </Carousel>
      <Paragraph mt="2">Current slide: {currentSlide + 1}</Paragraph>
    </Block>
  );
}
```

---

### Non-repeating Carousel

Carousel that stops at the first and last slides.

```tsx live
<Carousel repeat={false}>
  <CarouselItem>
    <Hero color="danger" size="medium">
      <Hero.Body textAlign="centered">
        <Paragraph textColor="white">First (no previous)</Paragraph>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="warning" size="medium">
      <Hero.Body textAlign="centered">
        <Paragraph>Middle slide</Paragraph>
      </Hero.Body>
    </Hero>
  </CarouselItem>
  <CarouselItem>
    <Hero color="success" size="medium">
      <Hero.Body textAlign="centered">
        <Paragraph textColor="white">Last (no next)</Paragraph>
      </Hero.Body>
    </Hero>
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

---

## Props

### Carousel

<!-- bestax:generated props -->

| Prop                | Type                                                                       | Default            | Description                                                                             |
| ------------------- | -------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `value`             | `number`                                                                   | `0`                | Current active slide index (controlled).                                                |
| `autoplay`          | `boolean`                                                                  | `false`            | Enable auto-play.                                                                       |
| `interval`          | `number`                                                                   | `5000`             | Auto-play interval in milliseconds. Default: 5000.                                      |
| `pauseOnHover`      | `boolean`                                                                  | `true`             | Pause auto-play on hover. Default: true.                                                |
| `repeat`            | `boolean`                                                                  | `true`             | Loop back to first slide after last. Default: true.                                     |
| `hasDrag`           | `boolean`                                                                  | `true`             | Enable drag/swipe navigation. Default: true.                                            |
| `arrow`             | `boolean`                                                                  | `true`             | Show navigation arrows. Default: true.                                                  |
| `arrowHover`        | `boolean`                                                                  | `false`            | Only show arrows on hover.                                                              |
| `indicator`         | `boolean`                                                                  | `true`             | Show slide indicators. Default: true.                                                   |
| `indicatorInside`   | `boolean`                                                                  | `false`            | Position indicators inside carousel.                                                    |
| `indicatorPosition` | `'bottom'` \| `'top'`                                                      | `'bottom'`         | Indicator position. Default: 'bottom'.                                                  |
| `indicatorStyle`    | `'circles'` \| `'dots'` \| `'lines'` \| `'bars'`                           | `'dots'`           | Indicator style. Default: 'dots'.                                                       |
| `iconPrev`          | `string`                                                                   | —                  | Icon name for the previous arrow button.                                                |
| `iconNext`          | `string`                                                                   | —                  | Icon name for the next arrow button.                                                    |
| `iconLibrary`       | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'` | —                  | Icon library to use.                                                                    |
| `iconVariant`       | `string`                                                                   | —                  | Icon style variant (e.g., 'solid', 'outlined').                                         |
| `iconSize`          | `'small'` \| `'medium'` \| `'large'`                                       | —                  | Icon size modifier.                                                                     |
| `iconFeatures`      | `string` \| `string[]`                                                     | —                  | Additional icon modifiers.                                                              |
| `arrowBackground`   | `boolean`                                                                  | `true`             | Show semi-transparent background on arrow buttons. Set to `false` for icon-only arrows. |
| `arrowColor`        | `'light'` \| `'dark'`                                                      | —                  | Color theme for navigation arrows.                                                      |
| `ariaLabel`         | `string`                                                                   | `'Image carousel'` | Accessible label for the carousel region. Default: 'Image carousel'.                    |
| `onChange`          | `(value: number) => void`                                                  | —                  | Callback when slide changes.                                                            |
| `children`          | `React.ReactNode`                                                          | —                  | CarouselItem children.                                                                  |
| `className`         | `string`                                                                   | —                  | Additional CSS classes.                                                                 |
| `ref`               | `React.Ref<HTMLElement>`                                                   | —                  | Ref forwarded to the carousel element.                                                  |
| `...`               | All standard `<div>` attributes and Bulma helper props                     | —                  | See [Helper Props](../helpers/usebulmaclasses.md)                                       |

<!-- /bestax:generated props -->

### CarouselItem

| Prop        | Type      | Default | Description                                      |
| ----------- | --------- | ------- | ------------------------------------------------ |
| `active`    | `boolean` | —       | Whether this item is active (set automatically). |
| `className` | `string`  | —       | Additional CSS classes.                          |

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Carousel` registers these variables on its own `.carousel` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                           | Sass Variable                                   | Default                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `--bulma-carousel-arrow-size`                          | `$carousel-arrow-size`                          | `48px`                                                                                  |
| `--bulma-carousel-arrow-size-mobile`                   | `$carousel-arrow-size-mobile`                   | `36px`                                                                                  |
| `--bulma-carousel-arrow-background`                    | `$carousel-arrow-background`                    | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l), 0.8)`   |
| `--bulma-carousel-arrow-background-hover`              | `$carousel-arrow-background-hover`              | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l), 0.95)`  |
| `--bulma-carousel-arrow-color`                         | `$carousel-arrow-color`                         | `var(--bulma-text)`                                                                     |
| `--bulma-carousel-arrow-disabled-opacity`              | `$carousel-arrow-disabled-opacity`              | `0.3`                                                                                   |
| `--bulma-carousel-arrow-offset`                        | `$carousel-arrow-offset`                        | `1rem`                                                                                  |
| `--bulma-carousel-arrow-offset-mobile`                 | `$carousel-arrow-offset-mobile`                 | `0.5rem`                                                                                |
| `--bulma-carousel-arrow-icon-size`                     | `$carousel-arrow-icon-size`                     | `24px`                                                                                  |
| `--bulma-carousel-arrow-icon-size-mobile`              | `$carousel-arrow-icon-size-mobile`              | `18px`                                                                                  |
| `--bulma-carousel-arrow-radius`                        | `$carousel-arrow-radius`                        | `var(--bulma-radius)`                                                                   |
| `--bulma-carousel-indicator-size`                      | `$carousel-indicator-size`                      | `10px`                                                                                  |
| `--bulma-carousel-indicator-size-mobile`               | `$carousel-indicator-size-mobile`               | `8px`                                                                                   |
| `--bulma-carousel-indicator-gap`                       | `$carousel-indicator-gap`                       | `0.5rem`                                                                                |
| `--bulma-carousel-indicator-gap-mobile`                | `$carousel-indicator-gap-mobile`                | `0.375rem`                                                                              |
| `--bulma-carousel-indicator-background`                | `$carousel-indicator-background`                | `var(--bulma-border)`                                                                   |
| `--bulma-carousel-indicator-background-hover`          | `$carousel-indicator-background-hover`          | `var(--bulma-border-hover)`                                                             |
| `--bulma-carousel-indicator-background-active`         | `$carousel-indicator-background-active`         | `var(--bulma-primary)`                                                                  |
| `--bulma-carousel-indicator-circle-size`               | `$carousel-indicator-circle-size`               | `12px`                                                                                  |
| `--bulma-carousel-indicator-line-width`                | `$carousel-indicator-line-width`                | `30px`                                                                                  |
| `--bulma-carousel-indicator-line-width-mobile`         | `$carousel-indicator-line-width-mobile`         | `20px`                                                                                  |
| `--bulma-carousel-indicator-line-height`               | `$carousel-indicator-line-height`               | `4px`                                                                                   |
| `--bulma-carousel-indicator-line-height-mobile`        | `$carousel-indicator-line-height-mobile`        | `3px`                                                                                   |
| `--bulma-carousel-indicator-line-radius`               | `$carousel-indicator-line-radius`               | `var(--bulma-radius-small)`                                                             |
| `--bulma-carousel-indicator-bar-width`                 | `$carousel-indicator-bar-width`                 | `24px`                                                                                  |
| `--bulma-carousel-indicator-bar-width-mobile`          | `$carousel-indicator-bar-width-mobile`          | `16px`                                                                                  |
| `--bulma-carousel-indicator-bar-height`                | `$carousel-indicator-bar-height`                | `6px`                                                                                   |
| `--bulma-carousel-indicator-bar-height-mobile`         | `$carousel-indicator-bar-height-mobile`         | `4px`                                                                                   |
| `--bulma-carousel-overlay-arrow-background`            | `$carousel-overlay-arrow-background`            | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.3)` |
| `--bulma-carousel-overlay-arrow-background-hover`      | `$carousel-overlay-arrow-background-hover`      | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.5)` |
| `--bulma-carousel-overlay-arrow-color`                 | `$carousel-overlay-arrow-color`                 | `var(--bulma-scheme-main)`                                                              |
| `--bulma-carousel-overlay-indicator-background`        | `$carousel-overlay-indicator-background`        | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l), 0.5)`   |
| `--bulma-carousel-overlay-indicator-background-hover`  | `$carousel-overlay-indicator-background-hover`  | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l), 0.8)`   |
| `--bulma-carousel-overlay-indicator-background-active` | `$carousel-overlay-indicator-background-active` | `var(--bulma-scheme-main)`                                                              |
| `--bulma-carousel-transition-duration`                 | `$carousel-transition-duration`                 | `var(--bulma-duration)`                                                                 |
| `--bulma-carousel-fade-duration`                       | `$carousel-fade-duration`                       | `0.5s`                                                                                  |

<!-- /bestax:generated cssvars -->
