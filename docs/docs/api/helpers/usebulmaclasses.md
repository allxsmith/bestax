---
title: useBulmaClasses
sidebar_label: useBulmaClasses
---

# useBulmaClasses

## Overview

`useBulmaClasses` is a custom React hook that generates Bulma helper class strings from a set of props. It makes it easy to apply color, spacing, alignment, typography, flexbox, and other Bulma utility classes to your components in a type-safe, composable way. It also separates out any non-helper props for direct use on elements.

---

## Import

```tsx
import { useBulmaClasses } from '@allxsmith/bestax-bulma';
```

---

## API

```tsx
const { bulmaHelperClasses, rest } = useBulmaClasses(props);
```

- **props**: An object supporting all Bulma helper class props (see table below), plus any additional props.
- **bulmaHelperClasses**: A string of Bulma utility classes to be applied to your element.
- **rest**: An object of all remaining props (with helper props stripped out), suitable for spreading onto your component.

---

## Supported Props

Below is the full list of supported props, derived from the `BulmaClassesProps` TypeScript definition:

| Prop                   | Type / Example Value                                                                                                                                                                                                                                 | Effect / Example Class                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `color`                | `'primary'`, `'link'`, `'info'`, `'success'`, `'warning'`, `'danger'`, `'black'`, `'black-bis'`, `'black-ter'`, `'grey-darker'`, `'grey-dark'`, `'grey'`, `'grey-light'`, `'grey-lighter'`, `'white'`, `'light'`, `'dark'`, `'inherit'`, `'current'` | `has-text-primary`, `has-text-grey-dark`, `has-text-inherit` |
| `backgroundColor`      | Same as `color`                                                                                                                                                                                                                                      | `has-background-warning`                                     |
| `colorShade`           | `'00'`, `'05'`, `'10'`, `'15'`, `'20'`, `'25'`, `'30'`, `'35'`, `'40'`, `'45'`, `'50'`, `'55'`, `'60'`, `'65'`, `'70'`, `'75'`, `'80'`, `'85'`, `'90'`, `'95'`, `'invert'`, `'light'`, `'dark'`, `'soft'`, `'bold'`, `'on-scheme'`                   | `has-text-primary-25`                                        |
| `backgroundColorShade` | `'00'`, `'05'`, `'10'`, `'15'`, `'20'`, `'25'`, `'30'`, `'35'`, `'40'`, `'45'`, `'50'`, `'55'`, `'60'`, `'65'`, `'70'`, `'75'`, `'80'`, `'85'`, `'90'`, `'95'`, `'invert'`, `'light'`, `'dark'`, `'soft'`, `'bold'`, `'on-scheme'`                   | `has-background-info-dark`                                   |
| `m`                    | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `m-4`, `m-auto`                                              |
| `mt`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mt-2`                                                       |
| `mr`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mr-6`                                                       |
| `mb`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mb-0`                                                       |
| `ml`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `ml-auto`                                                    |
| `mx`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mx-2`                                                       |
| `my`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `my-5`                                                       |
| `p`                    | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `p-3`, `p-auto`                                              |
| `pt`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pt-1`                                                       |
| `pr`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pr-6`                                                       |
| `pb`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pb-0`                                                       |
| `pl`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pl-4`                                                       |
| `px`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `px-1`                                                       |
| `py`                   | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `py-6`                                                       |
| `textSize`             | `'1'..'7'`                                                                                                                                                                                                                                           | `is-size-3`                                                  |
| `textAlign`            | `'centered'`, `'justified'`, `'left'`, `'right'`                                                                                                                                                                                                     | `has-text-centered`                                          |
| `textTransform`        | `'capitalized'`, `'lowercase'`, `'uppercase'`, `'italic'`                                                                                                                                                                                            | `is-uppercase`, `is-italic`                                  |
| `textWeight`           | `'light'`, `'normal'`, `'medium'`, `'semibold'`, `'bold'`                                                                                                                                                                                            | `has-text-weight-bold`                                       |
| `fontFamily`           | `'sans-serif'`, `'monospace'`, `'primary'`, `'secondary'`, `'code'`                                                                                                                                                                                  | `is-family-monospace`                                        |
| `display`              | `'block'`, `'flex'`, `'inline'`, `'inline-block'`, `'inline-flex'`                                                                                                                                                                                   | `is-flex`, `is-inline-block`                                 |
| `visibility`           | `'hidden'`, `'sr-only'`, `'invisible'`                                                                                                                                                                                                               | `is-hidden`, `is-sr-only`, `is-invisible`                    |
| `flexDirection`        | `'row'`, `'row-reverse'`, `'column'`, `'column-reverse'`                                                                                                                                                                                             | `is-flex-direction-row`                                      |
| `flexWrap`             | `'nowrap'`, `'wrap'`, `'wrap-reverse'`                                                                                                                                                                                                               | `is-flex-wrap-nowrap`                                        |
| `justifyContent`       | `'flex-start'`, `'flex-end'`, `'center'`, `'space-between'`, `'space-around'`, `'space-evenly'`, `'start'`, `'end'`, `'left'`, `'right'`                                                                                                             | `is-justify-content-center`                                  |
| `alignContent`         | `'flex-start'`, `'flex-end'`, `'center'`, `'space-between'`, `'space-around'`, `'space-evenly'`, `'stretch'`                                                                                                                                         | `is-align-content-stretch`                                   |
| `alignItems`           | `'stretch'`, `'flex-start'`, `'flex-end'`, `'center'`, `'baseline'`, `'start'`, `'end'`                                                                                                                                                              | `is-align-items-center`                                      |
| `alignSelf`            | `'auto'`, `'flex-start'`, `'flex-end'`, `'center'`, `'baseline'`, `'stretch'`                                                                                                                                                                        | `is-align-self-center`                                       |
| `flexGrow`             | `'0'`, `'1'`, `'2'`, `'3'`, `'4'`, `'5'`                                                                                                                                                                                                             | `is-flex-grow-1`                                             |
| `flexShrink`           | `'0'`, `'1'`, `'2'`, `'3'`, `'4'`, `'5'`                                                                                                                                                                                                             | `is-flex-shrink-0`                                           |
| `float`                | `'left'`, `'right'`                                                                                                                                                                                                                                  | `is-pulled-left`, `is-pulled-right`                          |
| `overflow`             | `'clipped'`                                                                                                                                                                                                                                          | `is-clipped`                                                 |
| `overlay`              | `true`                                                                                                                                                                                                                                               | `is-overlay`                                                 |
| `interaction`          | `'unselectable'`, `'clickable'`                                                                                                                                                                                                                      | `is-unselectable`                                            |
| `radius`               | `'radiusless'`                                                                                                                                                                                                                                       | `is-radiusless`                                              |
| `shadow`               | `'shadowless'`                                                                                                                                                                                                                                       | `is-shadowless`                                              |
| `responsive`           | `'mobile'`, `'narrow'`                                                                                                                                                                                                                               | `is-mobile`, `is-narrow`                                     |
| `viewport`             | `'mobile'`, `'tablet'`, `'desktop'`, `'widescreen'`, `'fullhd'`                                                                                                                                                                                      | Adds viewport suffix to supported properties                 |
| `skeleton`             | `true`                                                                                                                                                                                                                                               | `is-skeleton`                                                |
| `clearfix`             | `true`                                                                                                                                                                                                                                               | `is-clearfix`                                                |
| `relative`             | `true`                                                                                                                                                                                                                                               | `is-relative`                                                |

### Viewport-Specific Properties

The following properties allow you to set different values for each viewport breakpoint:

| Prop                   | Type / Example Value                                            | Effect / Example Class                                                     |
| ---------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `displayMobile`        | `'block'`, `'flex'`, `'inline'`, `'none'`, etc.                 | `is-block-mobile`, `is-flex-mobile`, `is-hidden-mobile`                    |
| `displayTablet`        | Same as above                                                   | `is-block-tablet`, `is-flex-tablet`, `is-hidden-tablet`                    |
| `displayDesktop`       | Same as above                                                   | `is-block-desktop`, `is-flex-desktop`, `is-hidden-desktop`                 |
| `displayWidescreen`    | Same as above                                                   | `is-block-widescreen`, `is-flex-widescreen`                                |
| `displayFullhd`        | Same as above                                                   | `is-block-fullhd`, `is-flex-fullhd`                                        |
| `textSizeMobile`       | `'1'..'7'`                                                      | `is-size-3-mobile`, `is-size-5-mobile`                                     |
| `textSizeTablet`       | `'1'..'7'`                                                      | `is-size-3-tablet`, `is-size-5-tablet`                                     |
| `textSizeDesktop`      | `'1'..'7'`                                                      | `is-size-3-desktop`, `is-size-5-desktop`                                   |
| `textSizeWidescreen`   | `'1'..'7'`                                                      | `is-size-3-widescreen`, `is-size-5-widescreen`                             |
| `textSizeFullhd`       | `'1'..'7'`                                                      | `is-size-3-fullhd`, `is-size-5-fullhd`                                     |
| `textAlignMobile`      | `'centered'`, `'left'`, `'right'`, `'justified'`                | `has-text-centered-mobile`, `has-text-left-mobile`                         |
| `textAlignTablet`      | Same as above                                                   | `has-text-centered-tablet`, `has-text-left-tablet`                         |
| `textAlignDesktop`     | Same as above                                                   | `has-text-centered-desktop`, `has-text-left-desktop`                       |
| `textAlignWidescreen`  | Same as above                                                   | `has-text-centered-widescreen`, `has-text-left-widescreen`                 |
| `textAlignFullhd`      | Same as above                                                   | `has-text-centered-fullhd`, `has-text-left-fullhd`                         |
| `visibilityMobile`     | `'hidden'`, `'sr-only'`, `'invisible'`                          | `is-hidden-mobile`, `is-sr-only-mobile`, `is-invisible-mobile`             |
| `visibilityTablet`     | Same as above                                                   | `is-hidden-tablet`, `is-sr-only-tablet`, `is-invisible-tablet`             |
| `visibilityDesktop`    | Same as above                                                   | `is-hidden-desktop`, `is-sr-only-desktop`, `is-invisible-desktop`          |
| `visibilityWidescreen` | Same as above                                                   | `is-hidden-widescreen`, `is-sr-only-widescreen`, `is-invisible-widescreen` |
| `visibilityFullhd`     | Same as above                                                   | `is-hidden-fullhd`, `is-sr-only-fullhd`, `is-invisible-fullhd`             |
| `responsive`           | `'mobile'`, `'narrow'`                                          | `is-mobile`, `is-narrow`                                                   |
| `clearfix`             | `true`                                                          | `is-clearfix`                                                              |
| `relative`             | `true`                                                          | `is-relative`                                                              |
| `viewport`             | `'mobile'`, `'tablet'`, `'desktop'`, `'widescreen'`, `'fullhd'` | Adds suffix, e.g. `-mobile`, `-desktop`                                    |
| `className`            | `string`                                                        | Any additional classes                                                     |

---

### Full TypeScript Definition

```ts
export interface BulmaClassesProps {
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'black-bis'
    | 'black-ter'
    | 'grey-darker'
    | 'grey-dark'
    | 'grey'
    | 'grey-light'
    | 'grey-lighter'
    | 'white'
    | 'light'
    | 'dark'
    | 'inherit'
    | 'current';
  backgroundColor?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'black-bis'
    | 'black-ter'
    | 'grey-darker'
    | 'grey-dark'
    | 'grey'
    | 'grey-light'
    | 'grey-lighter'
    | 'white'
    | 'light'
    | 'dark'
    | 'inherit'
    | 'current';
  colorShade?:
    | '00'
    | '05'
    | '10'
    | '15'
    | '20'
    | '25'
    | '30'
    | '35'
    | '40'
    | '45'
    | '50'
    | '55'
    | '60'
    | '65'
    | '70'
    | '75'
    | '80'
    | '85'
    | '90'
    | '95'
    | 'invert'
    | 'light'
    | 'dark'
    | 'soft'
    | 'bold'
    | 'on-scheme';
  m?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  mt?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  mr?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  mb?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  ml?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  mx?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  my?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  p?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  pt?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  pr?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  pb?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  pl?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  px?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  py?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'auto';
  textSize?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  textAlign?: 'centered' | 'justified' | 'left' | 'right';
  textTransform?: 'capitalized' | 'lowercase' | 'uppercase' | 'italic';
  textWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: 'sans-serif' | 'monospace' | 'primary' | 'secondary' | 'code';
  display?: 'block' | 'flex' | 'inline' | 'inline-block' | 'inline-flex';
  visibility?: 'hidden' | 'sr-only';
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'start'
    | 'end'
    | 'left'
    | 'right';
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch';
  alignItems?:
    | 'stretch'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'baseline'
    | 'start'
    | 'end';
  alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'baseline'
    | 'stretch';
  flexGrow?: '0' | '1' | '2' | '3' | '4' | '5';
  flexShrink?: '0' | '1' | '2' | '3' | '4' | '5';
  float?: 'left' | 'right';
  overflow?: 'clipped';
  overlay?: boolean;
  interaction?: 'unselectable' | 'clickable';
  radius?: 'radiusless';
  shadow?: 'shadowless';
  responsive?: 'mobile' | 'narrow';
  viewport?: 'mobile' | 'tablet' | 'desktop' | 'widescreen' | 'fullhd';
  clearfix?: boolean;
  relative?: boolean;
  className?: string;
}
```

---

## Usage

### Basic Example

```tsx live
function example() {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: 'link',
    backgroundColor: 'primary',
    p: '4',
    textAlign: 'centered',
    id: 'card1',
  });

  return JSON.stringify({ bulmaHelperClasses, rest });
  // bulmaHelperClasses: 'has-text-link has-background-primary p-4 has-text-centered'
  // rest: { className: 'custom-card', id: 'card1' }
}
```

Apply to your component:

```tsx live
function example() {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: 'link',
    backgroundColor: 'primary',
    p: '4',
    textAlign: 'centered',
    id: 'card1',
  });

  return (
    <div className={classNames('custom-card', bulmaHelperClasses)} {...rest}>
      Card content
    </div>
  );
}
```

---

### Responsive Props

```tsx live
function example() {
  const { bulmaHelperClasses } = useBulmaClasses({
    color: 'link',
    backgroundColor: 'primary',
    m: '2',
    textAlign: 'centered',
    viewport: 'mobile',
  });
  return JSON.stringify({ bulmaHelperClasses });
  // bulmaHelperClasses: 'has-text-info-mobile m-2-mobile has-text-centered-mobile'
}
```

---

### With Flexbox Helpers

Flexbox properties are divided into two categories:

#### Container Properties

These properties apply to elements with `display: flex` or `display: inline-flex`:

- `flexDirection` - Direction of flex items
- `flexWrap` - Whether items wrap
- `justifyContent` - Alignment along main axis
- `alignContent` - Alignment of wrapped lines
- `alignItems` - Alignment along cross axis

#### Item Properties

These properties apply to flex items (children of flex containers) and **do not require** the element itself to have `display: flex`:

- `alignSelf` - Override container's alignItems for this item
- `flexGrow` - How much the item should grow
- `flexShrink` - How much the item should shrink

```tsx live
function example() {
  const { bulmaHelperClasses } = useBulmaClasses({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
  });
  return JSON.stringify({ bulmaHelperClasses });
  // bulmaHelperClasses: 'is-flex is-flex-direction-column is-align-items-center is-justify-content-center'
}
```

Example with flex items:

```tsx
// Container with display flex
<Box display="flex" alignItems="center">
  {/* Items don't need display flex to use alignSelf, flexGrow, flexShrink */}
  <Button alignSelf="flex-start">Start</Button>
  <Button alignSelf="center" flexGrow="1">
    Center & Grow
  </Button>
  <Button alignSelf="flex-end" flexShrink="0">
    End & No Shrink
  </Button>
</Box>
```

---

### Using with Components

#### Columns

```tsx live
function example() {
  const props = {
    isGapless = true,
  };

  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const columnsClasses = classNames(
    'columns',
    { 'is-gapless': isGapless },
    bulmaHelperClasses
  );
  return (
    <div className={columnsClasses} {...rest}>
      {children}
    </div>
  );
}

// Inside Columns.tsx
```

#### Card

```tsx live
function example() {
  const props = {};

  const textColor = 'white';
  const bgColor = 'primary';
  const hasShadow = true;
  const className = 'custom-card';
  const children = <p>Making a custom card</p>;
  const p = '4';

  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    p,
    ...props,
  });
  const cardClasses = classNames('card', className, bulmaHelperClasses, {
    'is-shadowless': !hasShadow,
  });
  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
}
```

#### Dropdown

```tsx live
function example() {
  const props = {};
  const active = true;
  const right = true;
  const className = 'custom-dropdown';

  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const dropdownClasses = classNames(
    'dropdown',
    bulmaHelperClasses,
    {
      'is-active': active,
      'is-right': right,
      // ...
    },
    className
  );

  return dropdownClasses;
}
```

---

### Colors

Use the `color` prop to apply Bulma color classes. Here, each button demonstrates a different color:

```tsx live
<Buttons>
  <Button color="primary">Primary</Button>
  <Button color="link">Link</Button>
  <Button color="info">Info</Button>
  <Button color="success">Success</Button>
  <Button color="warning">Warning</Button>
  <Button color="danger">Danger</Button>
  <Button color="black">Black</Button>
  <Button color="white">White</Button>
</Buttons>
```

### Background Color

Use the `backgroundColor` prop to set the background color. Here, each Box demonstrates a different background color:

```tsx live
<Columns isMultiline>
  <Column size="one-quarter">
    <Box backgroundColor="primary">Primary</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="link">Link</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="info">Info</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="success">Success</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="warning">Warning</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="danger">Danger</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="black">Black</Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="white">White</Box>
  </Column>
</Columns>
```

### Color Shade

Use the `color` and `colorShade` props to apply color shades. Here, each button demonstrates a different shade:

```tsx live
<Buttons>
  <Button color="primary" colorShade="10">
    Primary 10
  </Button>
  <Button color="primary" colorShade="30">
    Primary 30
  </Button>
  <Button color="primary" colorShade="60">
    Primary 60
  </Button>
  <Button color="primary" colorShade="90">
    Primary 90
  </Button>
  <Button color="primary" colorShade="invert">
    Primary Invert
  </Button>
</Buttons>
```

### Background Color Shade

Use the `backgroundColor` and `colorShade` props to apply background color shades. Here, each Box demonstrates a different shade:

```tsx live
<Columns isMultiline>
  <Column size="one-quarter">
    <Box backgroundColor="primary" colorShade="10">
      Primary 10
    </Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="primary" colorShade="30">
      Primary 30
    </Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="primary" colorShade="60">
      Primary 60
    </Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="primary" colorShade="90">
      Primary 90
    </Box>
  </Column>
  <Column size="one-quarter">
    <Box backgroundColor="primary" colorShade="invert">
      Primary Invert
    </Box>
  </Column>
</Columns>
```

### Margin

Use margin props to add spacing. Here, margin is applied to buttons, and to a row of buttons using the `Buttons` component:

```tsx live
<>
  <Buttons>
    <Button>Left</Button>
    <Button m="4">Margin 4</Button>
    <Button>Right</Button>
  </Buttons>
  <Buttons mt="5" mb="5">
    <Button>Top/Bottom Margin</Button>
    <Button>Row 2</Button>
  </Buttons>
</>
```

### Text Size

Apply `textSize` to Notifications to illustrate different sizes:

```tsx live
<>
  <Notification textSize="1">Size 1</Notification>
  <Notification textSize="3">Size 3</Notification>
  <Notification textSize="5">Size 5</Notification>
  <Notification textSize="7">Size 7</Notification>
</>
```

### Text Align

Apply `textAlign` to a Box to illustrate text alignment:

```tsx live
<>
  <Box textAlign="centered">Centered text</Box>
  <Box textAlign="right">Right aligned text</Box>
  <Box textAlign="left">Left aligned text</Box>
</>
```

### Text Transform

Apply `textTransform` to a Content tag with a paragraph of the Declaration of Independence:

```tsx live
<>
  <Box>
    <Content textTransform="uppercase">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content textTransform="lowercase">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content textTransform="capitalized">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content textTransform="italic">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
</>
```

### Text Weight

Apply `textWeight` to Content tags to illustrate different font weights:

```tsx live
<>
  <Box>
    <Content textWeight="light">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content textWeight="normal">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content textWeight="medium">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content textWeight="bold">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
</>
```

### Font Family

Use Content blocks with different font families:

```tsx live
<>
  <Box>
    <Content fontFamily="sans-serif">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content fontFamily="monospace">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content fontFamily="primary">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content fontFamily="secondary">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
  <Box>
    <Content fontFamily="code">
      <p>
        We hold these truths to be self-evident, that all men are created
        equal...
      </p>
    </Content>
  </Box>
</>
```

### Visibility

Show three buttons, one hidden, one screen-reader only:

```tsx live
<Buttons>
  <Button visibility="hidden">Hidden</Button>
  <Button visibility="sr-only">Screen Reader Only</Button>
  <Button>Visible</Button>
</Buttons>
```

### Overflow

Show a Box with clipped overflow:

```tsx live
<Box overflow="clipped" style={{ width: 200, height: 50 }}>
  This is a very long line of text that will be clipped and not overflow the
  box.
</Box>
```

### Overlay

Show an overlay (toggle with button click):

```tsx
function OverlayExample() {
  const [show, setShow] = useState(false);
  return (
    <Box overlay={show}>
      <Button onClick={() => setShow(s => !s)}>
        {show ? 'Hide Overlay' : 'Show Overlay'}
      </Button>
    </Box>
  );
}
```

### Interaction

Show text in a Box with `unselectable`, and another Box with `clickable`:

```tsx live
<>
  <Box interaction="unselectable">This text cannot be selected.</Box>
  <Box interaction="clickable">This box is clickable.</Box>
</>
```

### Radius

Show buttons with `radiusless`:

```tsx live
<Buttons>
  <Button radius="radiusless">Radiusless</Button>
  <Button>Normal</Button>
</Buttons>
```

### Shadowless

Show a Box with `shadowless`:

```tsx live
<Box shadow="shadowless">This box has no shadow.</Box>
```

### ClassName

Show a Message with a custom className:

```tsx live
<Message className="custom-message">
  This message uses a custom className.
</Message>
```

### Clearfix

Show containers with and without clearfix to demonstrate the importance of clearing floated elements:

```tsx live
<>
  <Box mb="4">
    <h4>Without Clearfix (Container Collapse)</h4>
    <Box p="3" style={{ background: '#ffebee', border: '2px solid #f44336' }}>
      <Button float="left" color="primary">
        Left
      </Button>
      <Button float="right" color="danger">
        Right
      </Button>
    </Box>
  </Box>

  <Box>
    <h4>With Clearfix (Proper Container)</h4>
    <Box
      p="3"
      clearfix
      style={{ background: '#e8f5e8', border: '2px solid #4caf50' }}
    >
      <Button float="left" color="primary">
        Left
      </Button>
      <Button float="right" color="danger">
        Right
      </Button>
    </Box>
  </Box>
</>
```

### Relative Position

Show a container with relative positioning that provides context for absolutely positioned children:

```tsx live
<Box
  relative
  p="4"
  style={{ background: '#f5f5f5', border: '2px solid #333', height: '150px' }}
>
  <span>This container has position: relative</span>
  <Box
    style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: '#ff5722',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
    }}
  >
    Absolutely positioned child
  </Box>
</Box>
```

---

### Skeleton Examples

The `skeleton` prop applies Bulma's skeleton loading effect. Here are examples for each component:

#### Skeleton Button

```tsx live
<Button skeleton>Skeleton Button</Button>
```

#### Skeleton Buttons Group

```tsx live
<Buttons>
  <Button skeleton>Skeleton</Button>
  <Button skeleton>Skeleton</Button>
  <Button skeleton>Skeleton</Button>
</Buttons>
```

#### Skeleton Icon

```tsx live
<Icon name="star" skeleton ariaLabel="Star icon skeleton" />
```

#### Skeleton Image

```tsx live
<Image
  skeleton
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
  alt="Skeleton image"
  size="128x128"
/>
```

#### Skeleton Notification

```tsx live
<Notification skeleton>Skeleton notification message.</Notification>
```

#### Skeleton Tag

```tsx live
<Tag skeleton>Skeleton Tag</Tag>
```

#### Skeleton Title

```tsx live
<Title skeleton size="2">
  Skeleton Title
</Title>
```

#### Skeleton SubTitle

```tsx live
<SubTitle skeleton size="4">
  Skeleton SubTitle
</SubTitle>
```

#### Skeleton Input

```tsx live
<Input skeleton placeholder="Skeleton Input" />
```

#### Skeleton TextArea

```tsx live
<TextArea skeleton placeholder="Skeleton TextArea" rows={3} />
```

---

## Responsive Design

### Global Viewport Property (Legacy)

The `viewport` prop applies a single viewport modifier to ALL properties that support it:

```tsx
const { bulmaHelperClasses } = useBulmaClasses({
  color: 'primary',
  textAlign: 'centered',
  textSize: '4',
  viewport: 'mobile', // Applies -mobile to ALL properties
});
// Result: has-text-primary-mobile has-text-centered-mobile is-size-4-mobile
```

### Viewport-Specific Properties (Recommended)

Viewport-specific properties allow you to set **different values for each viewport**:

```tsx
const { bulmaHelperClasses } = useBulmaClasses({
  // Different text sizes for each viewport
  textSizeMobile: '6', // Small on mobile
  textSizeTablet: '5', // Medium on tablet
  textSizeDesktop: '4', // Large on desktop

  // Different text alignment for each viewport
  textAlignMobile: 'centered', // Center on mobile
  textAlignDesktop: 'left', // Left align on desktop

  // Different visibility for each viewport
  visibilityMobile: 'hidden', // Hidden on mobile
  visibilityTablet: 'invisible', // Invisible on tablet
});
// Result: is-size-6-mobile is-size-5-tablet is-size-4-desktop
//         has-text-centered-mobile has-text-left-desktop is-hidden-mobile is-invisible-tablet
```

### Breakpoint Reference

Bulma's responsive breakpoints:

- **mobile**: up to 768px
- **tablet**: 769px - 1023px
- **desktop**: 1024px - 1215px
- **widescreen**: 1216px - 1407px
- **fullhd**: 1408px and above

### Properties That Support Viewport Modifiers

Only certain properties support responsive variants:

**✅ Support Viewport Modifiers:**

- Text size (`textSize`, `textSizeMobile`, `textSizeTablet`, etc.)
- Text alignment (`textAlign`, `textAlignMobile`, `textAlignTablet`, etc.)
- Display (`display`, `displayMobile`, `displayTablet`, etc.)
- Visibility (`visibility`, `visibilityMobile`, `visibilityTablet`, etc.)

**❌ Do NOT Support Viewport Modifiers:**

- Spacing (`m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`, `p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`)
- Background colors (`backgroundColor`)
- Flexbox properties (`flexDirection`, `flexWrap`, `justifyContent`, etc.)
- Other helpers (`float`, `clearfix`, `relative`, `borderRadius`, `shadow`, etc.)

---

## Notes

- Any prop not recognized as a Bulma helper prop is passed through in `rest`.
- Responsive helper props (`viewport`) suffix classes with the breakpoint (e.g., `is-size-3-mobile`).
- You can use in combination with [`classNames`](./classnames.md) for more advanced use.

---

## See Also

- [classNames helper](./classnames.md)
- [Bulma Classes Reference](https://bulma.io/documentation/helpers/)
- [Storybook: useBulmaClasses Demo](https://bestax.cc/storybook/?path=/story/helpers-usebulmaclasses--default)
