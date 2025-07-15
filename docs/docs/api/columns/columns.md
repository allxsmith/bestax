---
title: Columns
sidebar_label: Columns
sidebar_position: 1
---

# Columns

## Overview

The `Columns` component provides Bulma's flexible, responsive grid container for aligning and distributing [`Column`](./column.md) components. It supports wrapping, gap control, centering, vertical alignment, responsive breakpoints, and all Bulma/utility helper props. Use it as the parent for one or more `Column` children.

---

## Import

```tsx
import { Columns, Column } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop                | Type                                                                                                                                                                                                                                                                                     | Description                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `className`         | `string`                                                                                                                                                                                                                                                                                 | Additional CSS classes for the columns container.    |
| `textColor`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Text color.                                          |
| `color`             | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                          | Bulma color modifier for all columns.                |
| `bgColor`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Background color for all columns.                    |
| `isCentered`        | `boolean`                                                                                                                                                                                                                                                                                | Horizontally center columns within the container.    |
| `isGapless`         | `boolean`                                                                                                                                                                                                                                                                                | Remove gap between columns.                          |
| `isMultiline`       | `boolean`                                                                                                                                                                                                                                                                                | Allow columns to wrap to multiple lines.             |
| `isVCentered`       | `boolean`                                                                                                                                                                                                                                                                                | Vertically center columns within the container.      |
| `isMobile`          | `boolean`                                                                                                                                                                                                                                                                                | Apply columns layout on mobile and up.               |
| `isDesktop`         | `boolean`                                                                                                                                                                                                                                                                                | Apply columns layout on desktop and up.              |
| `gapSize`           | number \| string (0-8)                                                                                                                                                                                                                                                                   | Gap size for all breakpoints.                        |
| `gapSizeMobile`     | number \| string (0-8)                                                                                                                                                                                                                                                                   | Gap size for mobile.                                 |
| `gapSizeTablet`     | number \| string (0-8)                                                                                                                                                                                                                                                                   | Gap size for tablet.                                 |
| `gapSizeDesktop`    | number \| string (0-8)                                                                                                                                                                                                                                                                   | Gap size for desktop.                                |
| `gapSizeWidescreen` | number \| string (0-8)                                                                                                                                                                                                                                                                   | Gap size for widescreen.                             |
| `gapSizeFullhd`     | number \| string (0-8)                                                                                                                                                                                                                                                                   | Gap size for fullhd.                                 |
| `children`          | `React.ReactNode`                                                                                                                                                                                                                                                                        | Columns to render within the container.              |
| ...                 | All Bulma helper and HTML props                                                                                                                                                                                                                                                          | (See [Helper Props](../api/helpers/usebulmaclasses)) |

---

## Usage

### Basic Columns

```tsx live
<Columns>
  <Column>
    <Notification color="primary">First column</Notification>
  </Column>
  <Column>
    <Notification color="info">Second column</Notification>
  </Column>
  <Column>
    <Notification color="link">Third column</Notification>
  </Column>
  <Column>
    <Notification color="warning">Fourth column</Notification>
  </Column>
</Columns>
```

---

### Columns on Mobile and Desktop

```tsx live
<>
  {
    // Columns enabled on mobile screens and up
  }
  <Columns isMobile>
    <Column>
      <Notification color="primary">1</Notification>
    </Column>
    <Column>
      <Notification color="primary">2</Notification>
    </Column>
    <Column>
      <Notification color="primary">3</Notification>
    </Column>
    <Column>
      <Notification color="primary">4</Notification>
    </Column>
    <Column>
      <Notification color="primary">5</Notification>
    </Column>
  </Columns>

  {
    // Columns enabled on desktop screens and up
  }
  <Columns isDesktop>
    <Column>
      <Notification color="primary">1</Notification>
    </Column>
    <Column>
      <Notification color="primary">2</Notification>
    </Column>
    <Column>
      <Notification color="primary">3</Notification>
    </Column>
    <Column>
      <Notification color="primary">4</Notification>
    </Column>
    <Column>
      <Notification color="primary">5</Notification>
    </Column>
  </Columns>
</>
```

---

### Different Column Sizes Per Breakpoint

```tsx live
<Columns isMobile>
  <Column
    sizeMobile="three-quarters"
    sizeTablet="two-thirds"
    sizeDesktop="half"
    sizeWidescreen="one-third"
    sizeFullhd="one-quarter"
  >
    <Notification color="primary">
      <code>sizeMobile="three-quarters"</code>
      <br />
      <code>sizeTablet="two-thirds"</code>
      <br />
      <code>sizeDesktop="half"</code>
      <br />
      <code>sizeWidescreen="one-third"</code>
      <br />
      <code>sizeFullhd="one-quarter"</code>
    </Notification>
  </Column>
  <Column>
    <Notification color="primary">2</Notification>
  </Column>
  <Column>
    <Notification color="primary">3</Notification>
  </Column>
  <Column>
    <Notification color="primary">4</Notification>
  </Column>
  <Column>
    <Notification color="primary">5</Notification>
  </Column>
</Columns>
```

---

### Nested Columns

```tsx live
<Columns>
  <Column>
    <Notification color="primary">First column</Notification>
    <Columns isMobile>
      <Column>
        <Notification color="primary">First nested column</Notification>
      </Column>
      <Column>
        <Notification color="primary">Second nested column</Notification>
      </Column>
    </Columns>
  </Column>
  <Column>
    <Notification color="primary">Second column</Notification>
    <Columns isMobile>
      <Column size="half">
        <Notification color="primary">50%</Notification>
      </Column>
      <Column>
        <Notification color="primary">Auto</Notification>
      </Column>
      <Column>
        <Notification color="primary">Auto</Notification>
      </Column>
    </Columns>
  </Column>
</Columns>
```

---

### Gap Sizes & Responsive Gaps

```tsx live
<>
  <Columns gapSize={0}>
    <Column>
      <Notification color="primary">gapSize=0</Notification>
    </Column>
    <Column>
      <Notification color="primary">gapSize=0</Notification>
    </Column>
  </Columns>
  <Columns gapSize={3}>
    <Column>
      <Notification color="primary">gapSize=3</Notification>
    </Column>
    <Column>
      <Notification color="primary">gapSize=3</Notification>
    </Column>
  </Columns>
  <Columns gapSizeMobile={1} gapSizeTablet={3} gapSizeDesktop={6}>
    <Column>
      <Notification color="primary">
        gapSizeMobile=1 gapSizeTablet=3 gapSizeDesktop=6
      </Notification>
    </Column>
    <Column>
      <Notification color="primary">
        gapSizeMobile=1 gapSizeTablet=3 gapSizeDesktop=6
      </Notification>
    </Column>
  </Columns>
</>
```

---

### Offsets

```tsx live
<>
  <Columns isMobile>
    <Column size="half" offset="one-quarter">
      <Notification color="primary">
        <code>size="half" offset="one-quarter"</code>
      </Notification>
    </Column>
  </Columns>
  <Columns isMobile>
    <Column size="three-fifths" offset="one-fifth">
      <Notification color="primary">
        <code>size="three-fifths" offset="one-fifth"</code>
      </Notification>
    </Column>
  </Columns>
  <Columns isMobile>
    <Column size={4} offset={8}>
      <Notification color="primary">
        <code>
          size={4} offset={8}
        </code>
      </Notification>
    </Column>
  </Columns>
  <Columns isMobile>
    <Column size={11} offset={1}>
      <Notification color="primary">
        <code>size=11 offset=1</code>
      </Notification>
    </Column>
  </Columns>
</>
```

---

### Narrow Columns

```tsx live
<Columns>
  <Column isNarrow>
    <Notification color="primary" style={{ width: 200 }}>
      <span style={{ fontWeight: 'bold' }}>Narrow column</span>
      <br />
      <span>This column is only 200px wide.</span>
    </Notification>
  </Column>
  <Column>
    <Notification color="primary">
      <span style={{ fontWeight: 'bold' }}>Flexible column</span>
      <br />
      <span>This column will take up the remaining space available.</span>
    </Notification>
  </Column>
</Columns>
```

---

### Gapless Columns

```tsx live
<Columns isGapless>
  <Column>
    <Notification color="primary">1</Notification>
  </Column>
  <Column>
    <Notification color="primary">2</Notification>
  </Column>
  <Column>
    <Notification color="primary">3</Notification>
  </Column>
  <Column>
    <Notification color="primary">4</Notification>
  </Column>
</Columns>
```

---

### Multiline and Gapless

```tsx live
<Columns isGapless isMultiline isMobile>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column size="half">
    <Notification color="primary">is-half</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">is-one-quarter</Notification>
  </Column>
  <Column>
    <Notification color="primary">Auto</Notification>
  </Column>
</Columns>
```

---

### Variable Gap

```tsx live
<>
  <Columns gapSize={2}>
    <Column size={3}>
      <Notification color="primary" className="has-text-centered">
        Side
      </Notification>
    </Column>
    <Column size={9}>
      <Notification color="primary" className="has-text-centered">
        Main
      </Notification>
    </Column>
  </Columns>
  <Columns gapSize={2}>
    <Column size={4}>
      <Notification color="primary" className="has-text-centered">
        Three columns
      </Notification>
    </Column>
    <Column size={4}>
      <Notification color="primary" className="has-text-centered">
        Three columns
      </Notification>
    </Column>
    <Column size={4}>
      <Notification color="primary" className="has-text-centered">
        Three columns
      </Notification>
    </Column>
  </Columns>
  <Columns gapSize={2}>
    {Array.from({ length: 12 }).map((_, i) => (
      <Column key={i + 1}>
        <Notification color="primary" className="has-text-centered">
          {i + 1}
        </Notification>
      </Column>
    ))}
  </Columns>
</>
```

---

### Breakpoint Based Column Gaps

```tsx live
<Columns
  gapSizeMobile={1}
  gapSizeTablet={4}
  gapSizeDesktop={3}
  gapSizeWidescreen={8}
  gapSizeFullhd={2}
>
  {[...Array(6)].map((_, idx) => (
    <Column key={idx}>
      <Notification color="primary">Column</Notification>
    </Column>
  ))}
</Columns>
```

---

### Vertical Alignment

```tsx live
<Columns isVCentered>
  <Column size={8}>
    <Notification color="primary">First column</Notification>
  </Column>
  <Column>
    <Notification color="primary">
      Can you see the vertical alignment? It should be really noticable with
      these two columns.
    </Notification>
  </Column>
</Columns>
```

---

### Multiline Columns

```tsx live
<Columns isMultiline isMobile>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column size="half">
    <Notification color="primary">
      <code>is-half</code>
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary">
      <code>is-one-quarter</code>
    </Notification>
  </Column>
  <Column>
    <Notification color="primary">Auto</Notification>
  </Column>
</Columns>
```

---

### Centering Columns

```tsx live
<Columns isMobile isCentered>
  <Column size="half">
    <Notification color="primary">
      <code className="html">is-half</code>
      <br />
    </Notification>
  </Column>
</Columns>
```

---

### Multiline Centered Columns

```tsx live
<Columns isMobile isMultiline isCentered>
  <Column isNarrow>
    <Notification color="primary">
      <code className="html">is-narrow</code>
      <br />
      First Column
    </Notification>
  </Column>
  <Column isNarrow>
    <Notification color="primary">
      <code className="html">is-narrow</code>
      <br />
      Our Second Column
    </Notification>
  </Column>
  <Column isNarrow>
    <Notification color="primary">
      <code className="html">is-narrow</code>
      <br />
      Third Column
    </Notification>
  </Column>
  <Column isNarrow>
    <Notification color="primary">
      <code className="html">is-narrow</code>
      <br />
      The Fourth Column
    </Notification>
  </Column>
  <Column isNarrow>
    <Notification color="primary">
      <code className="html">is-narrow</code>
      <br />
      Fifth Column
    </Notification>
  </Column>
</Columns>
```

---

## Notes

- Use `Column` as a direct child of `Columns` for proper grid behavior.
- All gap, centering, and alignment props support responsive variants.
- Combine with [Bulma helper props](../api/helpers/usebulmaclasses) for utility-first styling.
- All standard `<div>` HTML props are supported.

---

## See Also

- [Column component](./column.md)
- [Bulma Columns Documentation](https://bulma.io/documentation/columns/)
- [Storybook: Columns Story](https://bestax.cc/storybook/?path=/story/columns-columns--mobile-columns)
