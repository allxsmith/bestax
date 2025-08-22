---
title: Syntax
sidebar_label: Syntax
sidebar_position: 4
---

# Syntax

This guide introduces you to how Bulma works and how our React components relate to Bulma's class-based system.

## Bulma Syntax

Bulma is a CSS framework that uses modifier classes to control the appearance and behavior of components. Understanding Bulma's syntax is essential to effectively using this React library.

### Basic Button Example

Here's how a button works in Bulma HTML:

```html
<!-- Basic button -->
<button class="button">Button</button>

<!-- Primary colored button -->
<button class="button is-primary">Primary</button>

<!-- Large primary button -->
<button class="button is-primary is-large">Large Primary</button>

<!-- Rounded loading button -->
<button class="button is-primary is-large is-rounded is-loading">
  Loading
</button>
```

### Modifier Classes

Bulma uses modifier classes that follow consistent patterns:

- **Color modifiers**: `is-primary`, `is-info`, `is-success`, `is-warning`, `is-danger`
- **Size modifiers**: `is-small`, `is-normal`, `is-medium`, `is-large`
- **State modifiers**: `is-loading`, `is-disabled`, `is-active`
- **Style modifiers**: `is-rounded`, `is-outlined`, `is-inverted`

### Combining Modifiers

Modifiers can be combined to create complex styling:

```html
<button class="button is-primary is-large is-outlined is-rounded">
  Fancy Button
</button>
```

## React Component Mapping

This React library maps properties to Bulma classes, making it easier and more type-safe to work with Bulma in React applications.

### Property to Class Conversion

Instead of writing class names manually, you use React props:

```tsx
// Instead of this HTML:
<button class="button is-primary is-large is-rounded is-loading">
  Loading
</button>

// You write this React:
<Button color="primary" size="large" rounded loading>
  Loading
</Button>
```

### Helper Classes Integration

The library integrates with Bulma's helper classes through the `useBulmaClasses` hook. You can apply spacing, colors, typography, and other utilities directly as props:

```tsx
// Typography and spacing helpers
<Button
  color="primary"
  textSize="5"
  textWeight="bold"
  m="4"
  p="2"
>
  Styled Button
</Button>

// Flexbox helpers
<Box
  display="flex"
  justifyContent="center"
  alignItems="center"
  backgroundColor="light"
  p="5"
>
  <Button color="primary">Centered Button</Button>
</Box>
```

### Property Types and Mappings

#### Color and Background Color

Color properties map to Bulma's text and background color classes:

```tsx
// Text colors
<Title color="primary">Primary text</Title>        // → has-text-primary
<Title color="grey-dark">Dark grey text</Title>    // → has-text-grey-dark

// Background colors
<Box backgroundColor="info">Info background</Box>  // → has-background-info
<Box backgroundColor="light">Light background</Box> // → has-background-light
```

#### Spacing

Spacing properties use Bulma's spacing scale (0-6):

```tsx
// Margin
<Box m="4">All margins</Box>           // → m-4
<Box mt="2" mb="3">Top/bottom</Box>    // → mt-2 mb-3
<Box mx="auto">Centered</Box>          // → mx-auto

// Padding
<Box p="5">All padding</Box>           // → p-5
<Box px="3" py="2">Horizontal/vertical</Box> // → px-3 py-2
```

#### Typography

Typography properties control text appearance:

```tsx
<Title textSize="1" textAlign="centered" textWeight="bold">
  Large Centered Title
</Title>
// → is-size-1 has-text-centered has-text-weight-bold

<Content textTransform="uppercase" fontFamily="monospace">
  <p>Uppercase monospace content</p>
</Content>
// → is-uppercase is-family-monospace
```

#### Visibility and Display

Control element visibility and display behavior:

```tsx
// Display utilities
<Box display="flex">Flexbox container</Box>        // → is-flex
<Box display="inline-block">Inline block</Box>     // → is-inline-block

// Visibility utilities
<Box visibility="hidden">Hidden content</Box>      // → is-hidden
<Box visibility="sr-only">Screen reader only</Box> // → is-sr-only
```

#### Flexbox

Flexbox properties provide layout control:

```tsx
<Box
  display="flex"
  flexDirection="column"
  justifyContent="space-between"
  alignItems="center"
>
  <Button>Top</Button>
  <Button>Bottom</Button>
</Box>
// → is-flex is-flex-direction-column is-justify-content-space-between is-align-items-center
```

#### Other Utilities

Additional helper properties for common use cases:

```tsx
// Float utilities
<Box float="left">Float left</Box>              // → is-pulled-left
<Box float="right">Float right</Box>            // → is-pulled-right

// Overflow control
<Box overflow="clipped">Clipped overflow</Box>   // → is-clipped

// Border radius and shadow
<Box radius="radiusless">No radius</Box>        // → is-radiusless
<Box shadow="shadowless">No shadow</Box>        // → is-shadowless

// Interactive states
<Box interaction="unselectable">No select</Box>  // → is-unselectable
<Box interaction="clickable">Clickable</Box>     // → is-clickable
```

### Responsive Properties

Many properties support responsive breakpoints using the `viewport` prop:

```tsx
<Box textAlign="left" viewport="mobile" m="2">
  Mobile-specific styling
</Box>
// → has-text-left-mobile m-2-mobile
```

Available breakpoints:

- `mobile`: up to 768px
- `tablet`: from 769px
- `desktop`: from 1024px
- `widescreen`: from 1216px
- `fullhd`: from 1408px

### Component-Specific Properties

In addition to helper classes, each component has its own specific properties that map to Bulma modifiers:

```tsx
// Button-specific properties
<Button color="primary" size="large" outlined rounded loading>
  Button Text
</Button>

// Input-specific properties
<Input
  type="email"
  placeholder="Email"
  color="success"
  size="medium"
  rounded
/>

// Column-specific properties
<Column size="half" offset="one-quarter">
  Column Content
</Column>
```

## Advanced Usage

For more complex scenarios, you can combine the helper classes with custom CSS classes:

```tsx
<Button
  color="primary"
  className="my-custom-button"
  textSize="4"
  m="3"
  display="flex"
  alignItems="center"
>
  <Icon name="star" mr="2" />
  Custom Styled Button
</Button>
```

## Further Reading

This guide covers the essential syntax concepts. For comprehensive details about all available helper properties and their mappings, see the [useBulmaClasses documentation](../../api/helpers/usebulmaclasses.md).
