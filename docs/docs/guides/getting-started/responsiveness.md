---
title: Responsiveness
sidebar_label: Responsiveness
sidebar_position: 6
---

# Responsiveness

This guide covers how these React components handle responsive design and how to work with Bulma's breakpoint system.

## Component Display Behavior

Many Bulma components are inherently vertical or block-level on mobile devices to ensure content remains accessible and readable on smaller screens.

### Vertical Components

These components automatically stack vertically on mobile:

- **Columns**: Individual columns stack vertically on mobile unless `isMobile` is specified
- **Level**: Level items stack vertically on mobile unless `isMobile` prop is used
- **Navbar**: Navbar items collapse into a burger menu on mobile

```tsx
// These will stack on mobile by default
<Columns>
  <Column>First column</Column>
  <Column>Second column</Column>
  <Column>Third column</Column>
</Columns>

<Level>
  <LevelLeft>
    <LevelItem>Left content</LevelItem>
  </LevelLeft>
  <LevelRight>
    <LevelItem>Right content</LevelItem>
  </LevelRight>
</Level>
```

### Mobile Override

Use the `isMobile` property to maintain horizontal layout even on mobile devices:

```tsx
// Force horizontal layout on mobile
<Columns isMobile>
  <Column>Always</Column>
  <Column>Horizontal</Column>
</Columns>

<Level isMobile>
  <LevelLeft>
    <LevelItem>Left</LevelItem>
  </LevelLeft>
  <LevelRight>
    <LevelItem>Right</LevelItem>
  </LevelRight>
</Level>
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

```tsx
// Standard container - centered on desktop+
<Container>
  <Content>Responsive container content</Content>
</Container>

// Tablet breakpoint - full width until tablet
<Container breakpoint="tablet">
  <Content>Full width on mobile, constrained on tablet+</Content>
</Container>

// Desktop breakpoint - full width until desktop
<Container breakpoint="desktop">
  <Content>Full width until desktop</Content>
</Container>

// Widescreen breakpoint - full width until widescreen
<Container breakpoint="widescreen">
  <Content>Full width until widescreen</Content>
</Container>
```

### Maximum Width Constraints

Use `isMax` with breakpoints to limit container width:

```tsx
// Maximum tablet width
<Container breakpoint="tablet" isMax>
  <Content>
    Container width limited to tablet size minus container offset
  </Content>
</Container>

// Maximum desktop width
<Container breakpoint="desktop" isMax>
  <Content>
    Container width limited to desktop size minus container offset
  </Content>
</Container>

// Maximum widescreen width
<Container breakpoint="widescreen" isMax>
  <Content>
    Container width limited to widescreen size minus container offset
  </Content>
</Container>
```

### Fluid Containers

Fluid containers expand to full width with consistent padding:

```tsx
// Full width with 32px padding on each side
<Container fluid>
  <Content>Full width container with small gaps on each side</Content>
</Container>
```

### Widescreen and FullHD Options

Control when containers become constrained:

```tsx
// Full width until widescreen breakpoint
<Container widescreen>
  <Content>Expands until widescreen (1216px)</Content>
</Container>

// Full width until fullhd breakpoint
<Container fullhd>
  <Content>Expands until fullhd (1408px)</Content>
</Container>
```

## Responsive Helper Classes

Use the `viewport` prop to apply styles at specific breakpoints:

### Text Alignment

```tsx
// Different text alignment per breakpoint
<Box
  textAlign="left"           // Default
  viewport="mobile"          // Only on mobile
>
  Left aligned on mobile
</Box>

<Box
  textAlign="centered"
  viewport="tablet"          // Tablet and up
>
  Centered on tablet and up
</Box>
```

### Spacing

```tsx
// Responsive margins
<Box
  m="2"                      // Default margin
  viewport="mobile"          // Only on mobile
>
  Small margin on mobile
</Box>

<Box
  m="4"
  viewport="desktop"         // Desktop and up
>
  Larger margin on desktop
</Box>
```

### Display Properties

```tsx
// Hide on mobile, show on desktop
<Box
  visibility="hidden"
  viewport="mobile"
>
  Hidden on mobile
</Box>

// Flex layout only on tablet+
<Box
  display="flex"
  viewport="tablet"
  justifyContent="space-between"
>
  <span>Flex layout on tablet+</span>
  <span>Space between items</span>
</Box>
```

### Typography

```tsx
// Responsive text sizes
<Title
  textSize="6"               // Small on mobile
  viewport="mobile"
>
  Mobile Title
</Title>

<Title
  textSize="3"               // Larger on desktop
  viewport="desktop"
>
  Desktop Title
</Title>
```

## Column System Responsiveness

The column system is highly responsive with size controls per breakpoint:

### Basic Responsive Columns

```tsx
<Columns>
  <Column
    size="full" // Full width on mobile
    sizeTablet="half" // Half width on tablet
    sizeDesktop="one-third" // One third on desktop
  >
    Responsive column
  </Column>
  <Column size="full" sizeTablet="half" sizeDesktop="two-thirds">
    Complementary column
  </Column>
</Columns>
```

### Column Offsets

```tsx
<Columns>
  <Column
    size="half"
    offset="one-quarter" // Offset on all sizes
    offsetTablet="0" // No offset on tablet+
  >
    Responsive offset column
  </Column>
</Columns>
```

### Narrow Columns

```tsx
<Columns>
  <Column
    narrow // Content-sized on all
    narrowTablet={false} // Full-width on tablet
  >
    Conditionally narrow
  </Column>
  <Column>Flexible column</Column>
</Columns>
```

## Grid System Responsiveness

The CSS Grid system provides modern responsive layout:

### Responsive Column Counts

```tsx
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

```tsx
// Automatically responsive based on min column width
<Grid minCol={4}>
  {[...Array(20)].map((_, i) => (
    <Cell key={i}>
      <Box p="3">
        <Button>Item {i + 1}</Button>
      </Box>
    </Cell>
  ))}
</Grid>
```

## Best Practices

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// ✅ Good: Mobile-first responsive design
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
```

### Test Across Breakpoints

Always test your layouts across all breakpoints:

```tsx
// Use browser dev tools to test these breakpoints:
// - 375px (mobile)
// - 768px (tablet boundary)
// - 1024px (desktop boundary)
// - 1216px (widescreen boundary)
// - 1408px (fullhd boundary)
```

### Combine Techniques

Combine different responsive approaches for complex layouts:

```tsx
<Container breakpoint="desktop" isMax>
  <Columns isMobile>
    <Column size="narrow" narrowTablet={false}>
      <Box
        p="3"
        pTablet="4"
        backgroundColor="light"
        textAlign="centered"
        textAlignTablet="left"
      >
        <Title textSize="5" textSizeTablet="4">
          Sidebar
        </Title>
      </Box>
    </Column>
    <Column>
      <Grid minCol={3} gap={2} gapTablet={3}>
        {[...Array(9)].map((_, i) => (
          <Cell key={i}>
            <Card>
              <Box p="4">
                <Title textSize="6">Card {i + 1}</Title>
              </Box>
            </Card>
          </Cell>
        ))}
      </Grid>
    </Column>
  </Columns>
</Container>
```

This creates a sophisticated responsive layout that adapts elegantly across all screen sizes while maintaining usability and visual hierarchy.
