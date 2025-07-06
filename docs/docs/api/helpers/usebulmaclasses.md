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

| Prop              | Type / Example Value                                                                                                                                                                                                                                 | Effect / Example Class                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `color`           | `'primary'`, `'link'`, `'info'`, `'success'`, `'warning'`, `'danger'`, `'black'`, `'black-bis'`, `'black-ter'`, `'grey-darker'`, `'grey-dark'`, `'grey'`, `'grey-light'`, `'grey-lighter'`, `'white'`, `'light'`, `'dark'`, `'inherit'`, `'current'` | `has-text-primary`, `has-text-grey-dark`, `has-text-inherit` |
| `backgroundColor` | Same as `color`                                                                                                                                                                                                                                      | `has-background-warning`                                     |
| `colorShade`      | `'00'`, `'05'`, `'10'`, `'15'`, `'20'`, `'25'`, `'30'`, `'35'`, `'40'`, `'45'`, `'50'`, `'55'`, `'60'`, `'65'`, `'70'`, `'75'`, `'80'`, `'85'`, `'90'`, `'95'`, `'invert'`, `'light'`, `'dark'`, `'soft'`, `'bold'`, `'on-scheme'`                   | `has-text-primary-25`, `has-background-info-dark`            |
| `m`               | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `m-4`, `m-auto`                                              |
| `mt`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mt-2`                                                       |
| `mr`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mr-6`                                                       |
| `mb`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mb-0`                                                       |
| `ml`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `ml-auto`                                                    |
| `mx`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `mx-2`                                                       |
| `my`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `my-5`                                                       |
| `p`               | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `p-3`, `p-auto`                                              |
| `pt`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pt-1`                                                       |
| `pr`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pr-6`                                                       |
| `pb`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pb-0`                                                       |
| `pl`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `pl-4`                                                       |
| `px`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `px-1`                                                       |
| `py`              | `'0'..'6'`, `'auto'`                                                                                                                                                                                                                                 | `py-6`                                                       |
| `textSize`        | `'1'..'7'`                                                                                                                                                                                                                                           | `is-size-3`                                                  |
| `textAlign`       | `'centered'`, `'justified'`, `'left'`, `'right'`                                                                                                                                                                                                     | `has-text-centered`                                          |
| `textTransform`   | `'capitalized'`, `'lowercase'`, `'uppercase'`, `'italic'`                                                                                                                                                                                            | `is-uppercase`, `is-italic`                                  |
| `textWeight`      | `'light'`, `'normal'`, `'medium'`, `'semibold'`, `'bold'`                                                                                                                                                                                            | `has-text-weight-bold`                                       |
| `fontFamily`      | `'sans-serif'`, `'monospace'`, `'primary'`, `'secondary'`, `'code'`                                                                                                                                                                                  | `is-family-monospace`                                        |
| `display`         | `'block'`, `'flex'`, `'inline'`, `'inline-block'`, `'inline-flex'`                                                                                                                                                                                   | `is-flex`, `is-inline-block`                                 |
| `visibility`      | `'hidden'`, `'sr-only'`                                                                                                                                                                                                                              | `is-hidden`, `is-sr-only`                                    |
| `flexDirection`   | `'row'`, `'row-reverse'`, `'column'`, `'column-reverse'`                                                                                                                                                                                             | `is-flex-direction-row`                                      |
| `flexWrap`        | `'nowrap'`, `'wrap'`, `'wrap-reverse'`                                                                                                                                                                                                               | `is-flex-wrap-nowrap`                                        |
| `justifyContent`  | `'flex-start'`, `'flex-end'`, `'center'`, `'space-between'`, `'space-around'`, `'space-evenly'`, `'start'`, `'end'`, `'left'`, `'right'`                                                                                                             | `is-justify-content-center`                                  |
| `alignContent`    | `'flex-start'`, `'flex-end'`, `'center'`, `'space-between'`, `'space-around'`, `'space-evenly'`, `'stretch'`                                                                                                                                         | `is-align-content-stretch`                                   |
| `alignItems`      | `'stretch'`, `'flex-start'`, `'flex-end'`, `'center'`, `'baseline'`, `'start'`, `'end'`                                                                                                                                                              | `is-align-items-center`                                      |
| `alignSelf`       | `'auto'`, `'flex-start'`, `'flex-end'`, `'center'`, `'baseline'`, `'stretch'`                                                                                                                                                                        | `is-align-self-center`                                       |
| `flexGrow`        | `'0'`, `'1'`                                                                                                                                                                                                                                         | `is-flex-grow-1`                                             |
| `flexShrink`      | `'0'`, `'1'`                                                                                                                                                                                                                                         | `is-flex-shrink-0`                                           |
| `float`           | `'left'`, `'right'`                                                                                                                                                                                                                                  | `is-pulled-left`, `is-pulled-right`                          |
| `overflow`        | `'clipped'`                                                                                                                                                                                                                                          | `is-clipped`                                                 |
| `overlay`         | `true`                                                                                                                                                                                                                                               | `is-overlay`                                                 |
| `interaction`     | `'unselectable'`, `'clickable'`                                                                                                                                                                                                                      | `is-unselectable`                                            |
| `radius`          | `'radiusless'`                                                                                                                                                                                                                                       | `is-radiusless`                                              |
| `shadow`          | `'shadowless'`                                                                                                                                                                                                                                       | `is-shadowless`                                              |
| `responsive`      | `'mobile'`, `'narrow'`                                                                                                                                                                                                                               | `is-mobile`, `is-narrow`                                     |
| `viewport`        | `'mobile'`, `'tablet'`, `'desktop'`, `'widescreen'`, `'fullhd'`                                                                                                                                                                                      | Adds suffix, e.g. `-mobile`, `-desktop`                      |
| `className`       | `string`                                                                                                                                                                                                                                             | Any additional classes                                       |

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
  flexGrow?: '0' | '1';
  flexShrink?: '0' | '1';
  float?: 'left' | 'right';
  overflow?: 'clipped';
  overlay?: boolean;
  interaction?: 'unselectable' | 'clickable';
  radius?: 'radiusless';
  shadow?: 'shadowless';
  responsive?: 'mobile' | 'narrow';
  viewport?: 'mobile' | 'tablet' | 'desktop' | 'widescreen' | 'fullhd';
  className?: string;
}
```

---

## Usage

### Basic Example

```tsx
const { bulmaHelperClasses, rest } = useBulmaClasses({
  color: 'primary',
  p: '4',
  textAlign: 'centered',
  className: 'custom-card',
  id: 'card1',
});

// bulmaHelperClasses: 'has-text-primary p-4 has-text-centered'
// rest: { className: 'custom-card', id: 'card1' }
```

Apply to your component:

```tsx
<div className={bulmaHelperClasses} {...rest}>
  Card content
</div>
```

---

### Responsive Props

```tsx
const { bulmaHelperClasses } = useBulmaClasses({
  color: 'info',
  m: '2',
  textAlign: 'centered',
  viewport: 'mobile',
});
// bulmaHelperClasses: 'has-text-info-mobile m-2-mobile has-text-centered-mobile'
```

---

### With Flexbox Helpers

```tsx
const { bulmaHelperClasses } = useBulmaClasses({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',
});
// bulmaHelperClasses: 'is-flex is-flex-direction-column is-align-items-center is-justify-content-center'
```

---

### Using with Components

#### Columns

```tsx
// Inside Columns.tsx
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
```

#### Card

```tsx
const { bulmaHelperClasses, rest } = useBulmaClasses({
  color: textColor,
  backgroundColor: bgColor,
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
```

#### Dropdown

```tsx
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
```

---

### Storybook Example

```tsx
// Helper to preview Bulma classes
const { bulmaHelperClasses } = useBulmaClasses({
  color: 'success',
  m: '3',
  textAlign: 'left',
  viewport: 'desktop',
});
// bulmaHelperClasses: 'has-text-success m-3 has-text-left-desktop'
```

---

## Notes

- Any prop not recognized as a Bulma helper prop is passed through in `rest`.
- Responsive helper props (`viewport`) suffix classes with the breakpoint (e.g., `is-size-3-mobile`).
- You can use in combination with [`classNames`](./classnames.md) for more advanced use.

---

## See Also

- [classNames helper](./classnames.md)
- [Bulma Classes Reference](https://bulma.io/documentation/helpers/)
- [Storybook: useBulmaClasses Demo](https://storybook.bestax.cc/?path=/story/helpers-usebulmaclasses--default)
