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

It supports auto-play, drag navigation, several items in view at once, and customizable styles.

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

### Several Items in View

`itemsToShow` puts several items in view at once, and the `itemsToShow<Viewport>` props change that count at Bulma's breakpoints, the way a `Column`'s `size<Viewport>` props change its width. Here it's one card on mobile, two from tablet up, and three from desktop up.

```tsx live
<Carousel itemsToShow={1} itemsToShowTablet={2} itemsToShowDesktop={3}>
  {[
    'Garden Room',
    'Harbor Suite',
    'Loft',
    'Courtyard Twin',
    'Terrace Room',
    'Family Suite',
  ].map(room => (
    <CarouselItem key={room}>
      <Card m="2">
        <Card.Content>
          <Title as="p" size="5">
            {room}
          </Title>
          <SubTitle as="p" size="6">
            Sleeps two
          </SubTitle>
        </Card.Content>
      </Card>
    </CarouselItem>
  ))}
</Carousel>
```

Which count applies:

- `itemsToShowMobile` applies below Bulma's tablet breakpoint.
- `itemsToShowTablet`, `itemsToShowDesktop`, `itemsToShowWidescreen` and `itemsToShowFullhd` each apply from their own breakpoint up, so `itemsToShowTablet` alone covers every width from tablet up. Where several apply, the widest one wins.
- `itemsToShow` covers every width none of them reaches. It defaults to 1, one slide at a time.

The counts are whole numbers: a fraction is rounded down, and anything below 1 counts as 1.

The widths come from the stylesheet: `Carousel` writes each count prop as a CSS variable on its own element, and Bulma's breakpoint mixins pick the one for the viewport, so the first paint is right before any script runs, server rendering included. The arrows, the indicators and how far a step goes need the count too, so the component reads it from `matchMedia` on the same breakpoints once the page has hydrated, and uses `itemsToShow` until then. A Sass build that moves Bulma's breakpoints moves the widths with them, but not that reading, which follows Bulma's default breakpoints. The variables are the `--bulma-carousel-items-to-show*` rows under [CSS & Sass Variables](#css--sass-variables), and `--bulma-carousel-items-in-view` is the one the viewport picks. Set the counts with the props rather than with those variables, since the props also decide how far a step moves.

#### Stepping and indicators

`itemsToScroll` sets how many items one step moves, for an arrow, an arrow key, a swipe or an autoplay tick. It defaults to 1, and it's capped at the count in view, so a step never skips an item. A swipe moves one step however far it travels.

The indicators mark the positions a step can land on, not the items. Without `repeat`, the last position is the last full view, so the last step can be shorter and the end of the track never shows empty space: with seven items, three in view and `itemsToScroll={3}`, the positions start at items 1, 4 and 5.

```tsx live
<Carousel itemsToShow={3} itemsToScroll={3} repeat={false}>
  {[1, 2, 3, 4, 5, 6, 7].map(n => (
    <CarouselItem key={n}>
      <Box m="2" textAlign="centered">
        Item {n}
      </Box>
    </CarouselItem>
  ))}
</Carousel>
```

#### Spacing between items

The cards above keep apart with their own margin. To space the items themselves, set `--bulma-carousel-item-gap` to a length on the carousel's own element, for instance through a class you give it. The gap goes only between items, not at the track's edges, and the item widths make room for it. It defaults to `0px`. Like the carousel's other variables, it's declared on `.carousel`, so a value set on an ancestor doesn't reach it.

```css
.carousel.room-gallery {
  --bulma-carousel-item-gap: 1.5rem;
}
```

```tsx
<Carousel className="room-gallery" itemsToShow={3}>
  {/* items */}
</Carousel>
```

#### How the rest of the props behave with several in view

- **`repeat`** loops only when some item is out of view. It runs the view on past the last item into the first ones, so a view can show the end and the start side by side. Copies of a full view's worth of items sit at each end of the track (as many as the widest count any viewport sets), and whichever copy of an item is on screen is the one a screen reader or the keyboard reaches.
- **Fewer children than the count in view** (or exactly as many): every item keeps its share of the width, so the cards stay the size they'd be in a full carousel, and nothing moves. No arrows or indicators render, and autoplay has nothing to do.
- **A controlled `value`** is the index of the first item in view. One between two positions is shown as given, and the next step goes on from there. With `repeat`, a value past either end wraps around; without it, one that would leave empty space after the last item shows the last full view. Neither correction calls `onChange`.
- **When the window's width changes the count**, the first item in view stays in view. Where the view can't start there any more (three in view can't start at the last item), it starts at the last full view instead.
- **`autoplay`** moves one step per `interval`. Without `repeat` it stops at the last position.

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
  const [style, setStyle] = useState<'dots' | 'circles' | 'lines' | 'bars'>(
    'dots'
  );
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
- Each item is a `group` with `aria-roledescription="slide"`, named for its place, such as "2 of 6". An item's own `aria-label` or `aria-labelledby` takes the place of that name
- Items out of view are `aria-hidden` and `inert`, so screen readers skip them and nothing in them takes focus. With several in view, every item in view is exposed. The copies a loop adds at each end of the track follow the same rule, so where the view runs past the last item, the copies on screen are the ones exposed
- The track is a polite live region, so what comes into view is announced, except while autoplay is moving it (`aria-live="off"`)
- Autoplay waits while the pointer is over the carousel (with `pauseOnHover`) and while focus is inside one of its items, so an item being read or used never moves out of view
- Navigation arrows have `aria-label` for screen readers
- Indicators use `role="tablist"` and `role="tab"` semantics, one for each position a step can land on
- The Left and Right arrow keys move the carousel while focus is on its arrows or indicators. Inside an item they're left to the item's content, such as a field or a slider
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

| Prop                    | Type                                                                       | Default            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                 | `number`                                                                   | `0`                | Index of the first item in view (controlled); with one item in view, the slide shown. A value between two of the positions a step lands on (see `itemsToScroll`) is shown as given, and the next step goes on from it. With `repeat`, a value past either end wraps around; without it, one that would leave empty space after the last item shows the last full view. Neither correction calls `onChange`.                                                                                                                                                                                                                                                                                           |
| `autoplay`              | `boolean`                                                                  | `false`            | Enable auto-play: one step (`itemsToScroll` items) per `interval`. Without `repeat` it stops at the last position. It waits while the pointer is over the carousel (see `pauseOnHover`) and while focus is inside one of its items, so an item being read or used never moves out of view.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `interval`              | `number`                                                                   | `5000`             | Auto-play interval in milliseconds. Default: 5000.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pauseOnHover`          | `boolean`                                                                  | `true`             | Pause auto-play on hover. Default: true.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `repeat`                | `boolean`                                                                  | `true`             | Loop back to the first position after the last. Default: true. With several items in view, the view runs on past the last item into the first ones, so it can show the end and the start side by side. Only loops when some item is out of view.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `hasDrag`               | `boolean`                                                                  | `true`             | Enable drag/swipe navigation. Default: true. A swipe moves one step, however far it travels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `itemsToShow`           | `number`                                                                   | `1`                | How many items are in view at once, at every width no `itemsToShow<Viewport>` prop covers. Those props read the way a `Column`'s `size<Viewport>` props do: `itemsToShowMobile` applies below Bulma's tablet breakpoint, each of the others from its own breakpoint up, and where several apply the widest one wins. A whole number, rounded down and at least 1. The widths come from the stylesheet, so they are right on the first paint; the arrows, indicators and steps use the count for the window's width once the page has hydrated, and this one until then. With this many children or fewer, every item keeps its share of the width, nothing moves, and no arrows or indicators render. |
| `itemsToShowMobile`     | `number`                                                                   | —                  | Items in view below Bulma's tablet breakpoint (up to 768px). Falls back to `itemsToShow`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `itemsToShowTablet`     | `number`                                                                   | —                  | Items in view from Bulma's tablet breakpoint (769px) up, until a wider viewport's prop takes over. Falls back to `itemsToShow`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `itemsToShowDesktop`    | `number`                                                                   | —                  | Items in view from Bulma's desktop breakpoint (1024px) up, until a wider viewport's prop takes over. Falls back to `itemsToShowTablet`, then `itemsToShow`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `itemsToShowWidescreen` | `number`                                                                   | —                  | Items in view from Bulma's widescreen breakpoint (1216px) up, until `itemsToShowFullhd` takes over. Falls back to `itemsToShowDesktop`, and on down to `itemsToShow`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `itemsToShowFullhd`     | `number`                                                                   | —                  | Items in view from Bulma's fullhd breakpoint (1408px) up. Falls back to `itemsToShowWidescreen`, and on down to `itemsToShow`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `itemsToScroll`         | `number`                                                                   | `1`                | How many items one step moves, for an arrow, an arrow key, a swipe or an autoplay tick. A whole number, capped at the count in view so a step never skips an item. Without `repeat`, the last step stops at the last full view, so it can be shorter; with `repeat`, the step after the last position goes on to the first one. The indicators mark these positions, one per step rather than one per item. When the count in view changes with the window's width, the first item in view stays in view.                                                                                                                                                                                             |
| `arrow`                 | `boolean`                                                                  | `true`             | Show navigation arrows. Default: true. They render `type="button"`, so a carousel inside a form is not submitted by moving between slides.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `arrowHover`            | `boolean`                                                                  | `false`            | Only show arrows on hover.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `indicator`             | `boolean`                                                                  | `true`             | Show slide indicators. Default: true. There is one for each position a step can land on (see `itemsToScroll`). They render `type="button"`, so a carousel inside a form is not submitted by picking a slide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `indicatorInside`       | `boolean`                                                                  | `false`            | Position indicators inside carousel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `indicatorPosition`     | `'bottom'` \| `'top'`                                                      | `'bottom'`         | Indicator position. Default: 'bottom'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `indicatorStyle`        | `'circles'` \| `'dots'` \| `'lines'` \| `'bars'`                           | `'dots'`           | Indicator style. Default: 'dots'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `iconPrev`              | `string`                                                                   | —                  | Icon name for the previous arrow button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `iconNext`              | `string`                                                                   | —                  | Icon name for the next arrow button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `iconLibrary`           | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'` | —                  | Icon library to use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `iconVariant`           | `string`                                                                   | —                  | Icon style variant (e.g., 'solid', 'outlined').                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `iconSize`              | `'small'` \| `'medium'` \| `'large'`                                       | —                  | Icon size modifier.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `iconFeatures`          | `string` \| `string[]`                                                     | —                  | Additional icon modifiers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `arrowBackground`       | `boolean`                                                                  | `true`             | Show semi-transparent background on arrow buttons. Set to `false` for icon-only arrows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `arrowColor`            | `'light'` \| `'dark'`                                                      | —                  | Color theme for navigation arrows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ariaLabel`             | `string`                                                                   | `'Image carousel'` | Accessible label for the carousel region. Default: 'Image carousel'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `onChange`              | `(value: number) => void`                                                  | —                  | Called with the index of the first item in view when an arrow, an arrow key, an indicator, a swipe or autoplay moves the carousel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `children`              | `React.ReactNode`                                                          | —                  | CarouselItem children.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `className`             | `string`                                                                   | —                  | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ref`                   | `React.Ref<HTMLElement>`                                                   | —                  | Ref forwarded to the carousel element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `...`                   | All standard `<div>` attributes and Bulma helper props                     | —                  | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

<!-- /bestax:generated props -->

### CarouselItem

| Prop        | Type      | Default | Description                                                                                                         |
| ----------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `active`    | `boolean` | —       | Whether this item is in view. `Carousel` sets it on every item in view, so with several in view several are active. |
| `className` | `string`  | —       | Additional CSS classes.                                                                                             |

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
| `--bulma-carousel-item-gap`                            | `$carousel-item-gap`                            | `0px`                                                                                   |
| `--bulma-carousel-items-to-show`                       | —                                               | `1`                                                                                     |
| `--bulma-carousel-items-to-show-mobile`                | —                                               | `var(--bulma-carousel-items-to-show)`                                                   |
| `--bulma-carousel-items-to-show-tablet`                | —                                               | `var(--bulma-carousel-items-to-show)`                                                   |
| `--bulma-carousel-items-to-show-desktop`               | —                                               | `var(--bulma-carousel-items-to-show-tablet)`                                            |
| `--bulma-carousel-items-to-show-widescreen`            | —                                               | `var(--bulma-carousel-items-to-show-desktop)`                                           |
| `--bulma-carousel-items-to-show-fullhd`                | —                                               | `var(--bulma-carousel-items-to-show-widescreen)`                                        |
| `--bulma-carousel-items-in-view`                       | —                                               | `var(--bulma-carousel-items-to-show)`                                                   |

<!-- /bestax:generated cssvars -->
