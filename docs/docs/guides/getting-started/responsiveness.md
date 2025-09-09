---
title: Responsiveness
sidebar_label: Responsiveness
sidebar_position: 6
---

# Responsiveness

This guide covers how these React components handle responsive design and how to work with Bulma's breakpoint system.

:::tip Test Responsive Behavior

Try resizing your browser window or using the responsive design mode in your browser's developer tools to see the responsive behavior in action. The live examples below demonstrate different behaviors across breakpoints: **mobile** (up to 768px), **tablet** (769px+), **desktop** (1024px+), **widescreen** (1216px+), and **fullhd** (1408px+).

:::

## Component Display Behavior

Many Bulma components are inherently vertical or block-level on mobile devices to ensure content remains accessible and readable on smaller screens.

### Vertical Components

These components automatically stack vertically on mobile:

- **Columns**: Individual columns stack vertically on mobile unless `isMobile` is specified
- **Level**: Level items stack vertically on mobile unless `isMobile` prop is used
- **Navbar**: Navbar items collapse into a burger menu on mobile

```tsx live
<>
  <p>These will stack on mobile by default</p>
  <Columns>
    <Column>
      <Notification color="primary">First column</Notification>
    </Column>
    <Column>
      <Notification color="info">Second column</Notification>
    </Column>
    <Column>
      <Notification color="success">Third column</Notification>
    </Column>
  </Columns>

  <Level>
    <LevelLeft>
      <LevelItem>Left content</LevelItem>
    </LevelLeft>
    <LevelRight>
      <LevelItem>Right content</LevelItem>
    </LevelRight>
  </Level>
</>
```

### Mobile Override

Use the `isMobile` property to maintain horizontal layout even on mobile devices:

```tsx live
<>
  <p>Force horizontal layout on mobile</p>
  <Columns isMobile>
    <Column>
      <Notification color="warning">Always</Notification>
    </Column>
    <Column>
      <Notification color="danger">Horizontal</Notification>
    </Column>
  </Columns>

  <Level isMobile>
    <LevelLeft>
      <LevelItem>Left</LevelItem>
    </LevelLeft>
    <LevelRight>
      <LevelItem>Right</LevelItem>
    </LevelRight>
  </Level>
</>
```

## Bulma Breakpoints

Bulma has 4 breakpoints which define 5 screen sizes:

| Size           | Range       | CSS Variable         |
| -------------- | ----------- | -------------------- |
| **mobile**     | up to 768px | --tablet: 769px      |
| **tablet**     | from 769px  | --desktop: 1024px    |
| **desktop**    | from 1024px | --widescreen: 1216px |
| **widescreen** | from 1216px | --fullhd: 1408px     |
| **fullhd**     | from 1408px | (no upper limit)     |

These breakpoints are used throughout Bulma for responsive utilities and component behavior.

## Container Responsiveness

The `Container` component provides responsive width constraints and breakpoint support:

### Breakpoint Properties

```tsx live
<>
  <p>Standard container - centered on desktop+</p>
  <Container>
    <Notification color="primary">Responsive container content</Notification>
  </Container>

  <p>Tablet breakpoint - full width until tablet</p>
  <Container breakpoint="tablet">
    <Notification color="info">
      Full width on mobile, constrained on tablet+
    </Notification>
  </Container>

  <p>Desktop breakpoint - full width until desktop</p>
  <Container breakpoint="desktop">
    <Notification color="success">Full width until desktop</Notification>
  </Container>

  <p>Widescreen breakpoint - full width until widescreen</p>
  <Container breakpoint="widescreen">
    <Notification color="warning">Full width until widescreen</Notification>
  </Container>
</>
```

### Maximum Width Constraints

Use `isMax` with breakpoints to limit container width:

```tsx live
<>
  <p>Maximum tablet width</p>
  <Container breakpoint="tablet" isMax>
    <Notification color="danger">
      Container width limited to tablet size minus container offset
    </Notification>
  </Container>

  <p>Maximum desktop width</p>
  <Container breakpoint="desktop" isMax>
    <Notification color="primary">
      Container width limited to desktop size minus container offset
    </Notification>
  </Container>

  <p>Maximum widescreen width</p>
  <Container breakpoint="widescreen" isMax>
    <Notification color="info">
      Container width limited to widescreen size minus container offset
    </Notification>
  </Container>
</>
```

### Fluid Containers

Fluid containers expand to full width with consistent padding:

```tsx live
<>
  <p>Full width with 32px padding on each side</p>
  <Container fluid>
    <Notification color="success">
      Full width container with small gaps on each side
    </Notification>
  </Container>
</>
```

### Widescreen and FullHD Options

Control when containers become constrained:

```tsx live
<>
  <p>Full width until widescreen breakpoint</p>
  <Container widescreen>
    <Notification color="warning">
      Expands until widescreen (1216px)
    </Notification>
  </Container>

  <p>Full width until fullhd breakpoint</p>
  <Container fullhd>
    <Notification color="danger">Expands until fullhd (1408px)</Notification>
  </Container>
</>
```

## Responsive Helper Classes

Use the `viewport` prop to apply styles at specific breakpoints:

### Text Alignment

```tsx live
<>
  <p>Different text alignment per breakpoint</p>
  <Box textAlign="left" viewport="mobile">
    Left aligned on mobile
  </Box>

  <Box textAlign="centered" viewport="tablet">
    Centered on tablet and up
  </Box>
</>
```

### Spacing

```tsx live
<>
  <p>Responsive margins</p>
  <Box m="2" viewport="mobile">
    Small margin on mobile
  </Box>

  <Box m="4" viewport="desktop">
    Larger margin on desktop
  </Box>
</>
```

### Display Properties

```tsx live
<>
  <p>Hide on mobile, show on desktop</p>
  <Box visibility="hidden" viewport="mobile">
    Hidden on mobile
  </Box>

  <p>Flex layout only on tablet+</p>
  <Box display="flex" viewport="tablet" justifyContent="space-between">
    <span>Flex layout on tablet+</span>
    <span>Space between items</span>
  </Box>
</>
```

### Typography

```tsx live
<>
  <p>Responsive text sizes</p>
  <Title textSize="6" viewport="mobile">
    Mobile Title
  </Title>

  <Title textSize="3" viewport="desktop">
    Desktop Title
  </Title>
</>
```

## Column System Responsiveness

The column system is highly responsive with size controls per breakpoint:

### Basic Responsive Columns

```tsx live
<Columns>
  <Column
    size="full" // Full width on mobile
    sizeTablet="half" // Half width on tablet
    sizeDesktop="one-third" // One third on desktop
  >
    <Notification color="primary">Responsive column</Notification>
  </Column>
  <Column size="full" sizeTablet="half" sizeDesktop="two-thirds">
    <Notification color="info">Complementary column</Notification>
  </Column>
</Columns>
```

### Column Offsets

```tsx live
<Columns>
  <Column
    size="half"
    offset="one-quarter" // Offset on all sizes
    offsetTablet="0" // No offset on tablet+
  >
    <Notification color="warning">Responsive offset column</Notification>
  </Column>
</Columns>
```

### Narrow Columns

```tsx live
<Columns>
  <Column
    narrow // Content-sized on all
    narrowTablet={false} // Full-width on tablet
  >
    <Notification color="success">Conditionally narrow</Notification>
  </Column>
  <Column>
    <Notification color="danger">Flexible column</Notification>
  </Column>
</Columns>
```

## Grid System Responsiveness

The CSS Grid system provides modern responsive layout:

### Responsive Column Counts

```tsx live
<Grid
  isFixed
  fixedCols={2} // 2 columns by default
  fixedColsTablet={3} // 3 columns on tablet
  fixedColsDesktop={4} // 4 columns on desktop
  fixedColsWidescreen={5} // 5 columns on widescreen
  fixedColsFullhd={6} // 6 columns on fullhd
>
  {[...Array(12)].map((_, i) => (
    <Cell key={i}>
      <Notification>Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

### Smart Grid with Minimum Columns

```tsx live
<>
  <p>Automatically responsive based on min column width</p>
  <Grid minCol={4}>
    {[...Array(20)].map((_, i) => (
      <Cell key={i}>
        <Box p="3">
          <Button>Item {i + 1}</Button>
        </Box>
      </Cell>
    ))}
  </Grid>
</>
```

## Best Practices

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx live
<>
  <p>Good: Mobile-first responsive design</p>
  <Box
    p="3" // Small padding on mobile
    pTablet="4" // Medium padding on tablet
    pDesktop="5" // Large padding on desktop
    textAlign="centered" // Centered on mobile
    textAlignDesktop="left" // Left-aligned on desktop
  >
    <Title
      textSize="5" // Smaller on mobile
      textSizeDesktop="3" // Larger on desktop
    >
      Responsive Title
    </Title>
    <Button
      size="small" // Small on mobile
      sizeTablet="normal" // Normal on tablet+
    >
      Responsive Button
    </Button>
  </Box>
</>
```

### Test Across Breakpoints

Always test your layouts across all breakpoints.

Use browser dev tools to test these breakpoints:

- 375px (mobile)
- 768px (tablet boundary)
- 1024px (desktop boundary)
- 1216px (widescreen boundary)
- 1408px (fullhd boundary)

### Combine Techniques

Combine different responsive approaches for complex layouts:

```tsx live
<Container breakpoint="desktop" isMax>
  <Columns isMobile>
    <Column isNarrow isNarrowTablet={false} display="flex">
      <Box p="3" pTablet="4" textAlign="centered" textAlignTablet="left">
        <Title textSize="5" textSizeTablet="4">
          Sidebar
        </Title>
      </Box>
    </Column>
    <Column>
      <Grid gap={2} gapTablet={3}>
        {[...Array(9)].map((_, i) => (
          <Cell key={i}>
            <Notification>Card {i + 1}</Notification>
          </Cell>
        ))}
      </Grid>
    </Column>
  </Columns>
</Container>
```

This creates a sophisticated responsive layout that adapts elegantly across all screen sizes while maintaining usability and visual hierarchy.
