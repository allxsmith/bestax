---
title: Margin & Padding
sidebar_label: Margin & Padding
sidebar_position: 3
---

# Margin & Padding

Bulma provides a comprehensive spacing system using margin and padding helpers. These utilities allow you to add consistent spacing throughout your application without writing custom CSS.

:::tip

All components in bestax-bulma have access to these spacing properties through the `useBulmaClasses` hook. You can apply margin and padding to any component in the library for consistent spacing.

:::

## Margin

Use margin props to add external spacing around elements. Margin creates space outside the element's border.

### All Sides Margin

| Property   | Bulma Class | Value   |
| ---------- | ----------- | ------- |
| `m="0"`    | `m-0`       | 0       |
| `m="1"`    | `m-1`       | 0.25rem |
| `m="2"`    | `m-2`       | 0.5rem  |
| `m="3"`    | `m-3`       | 0.75rem |
| `m="4"`    | `m-4`       | 1rem    |
| `m="5"`    | `m-5`       | 1.5rem  |
| `m="6"`    | `m-6`       | 3rem    |
| `m="auto"` | `m-auto`    | auto    |

### Top Margin

| Property    | Bulma Class | Value   |
| ----------- | ----------- | ------- |
| `mt="0"`    | `mt-0`      | 0       |
| `mt="1"`    | `mt-1`      | 0.25rem |
| `mt="2"`    | `mt-2`      | 0.5rem  |
| `mt="3"`    | `mt-3`      | 0.75rem |
| `mt="4"`    | `mt-4`      | 1rem    |
| `mt="5"`    | `mt-5`      | 1.5rem  |
| `mt="6"`    | `mt-6`      | 3rem    |
| `mt="auto"` | `mt-auto`   | auto    |

### Right Margin

| Property    | Bulma Class | Value   |
| ----------- | ----------- | ------- |
| `mr="0"`    | `mr-0`      | 0       |
| `mr="1"`    | `mr-1`      | 0.25rem |
| `mr="2"`    | `mr-2`      | 0.5rem  |
| `mr="3"`    | `mr-3`      | 0.75rem |
| `mr="4"`    | `mr-4`      | 1rem    |
| `mr="5"`    | `mr-5`      | 1.5rem  |
| `mr="6"`    | `mr-6`      | 3rem    |
| `mr="auto"` | `mr-auto`   | auto    |

### Bottom Margin

| Property    | Bulma Class | Value   |
| ----------- | ----------- | ------- |
| `mb="0"`    | `mb-0`      | 0       |
| `mb="1"`    | `mb-1`      | 0.25rem |
| `mb="2"`    | `mb-2`      | 0.5rem  |
| `mb="3"`    | `mb-3`      | 0.75rem |
| `mb="4"`    | `mb-4`      | 1rem    |
| `mb="5"`    | `mb-5`      | 1.5rem  |
| `mb="6"`    | `mb-6`      | 3rem    |
| `mb="auto"` | `mb-auto`   | auto    |

### Left Margin

| Property    | Bulma Class | Value   |
| ----------- | ----------- | ------- |
| `ml="0"`    | `ml-0`      | 0       |
| `ml="1"`    | `ml-1`      | 0.25rem |
| `ml="2"`    | `ml-2`      | 0.5rem  |
| `ml="3"`    | `ml-3`      | 0.75rem |
| `ml="4"`    | `ml-4`      | 1rem    |
| `ml="5"`    | `ml-5`      | 1.5rem  |
| `ml="6"`    | `ml-6`      | 3rem    |
| `ml="auto"` | `ml-auto`   | auto    |

### Horizontal Margin (Left + Right)

| Property    | Bulma Class | Value   |
| ----------- | ----------- | ------- |
| `mx="0"`    | `mx-0`      | 0       |
| `mx="1"`    | `mx-1`      | 0.25rem |
| `mx="2"`    | `mx-2`      | 0.5rem  |
| `mx="3"`    | `mx-3`      | 0.75rem |
| `mx="4"`    | `mx-4`      | 1rem    |
| `mx="5"`    | `mx-5`      | 1.5rem  |
| `mx="6"`    | `mx-6`      | 3rem    |
| `mx="auto"` | `mx-auto`   | auto    |

### Vertical Margin (Top + Bottom)

| Property    | Bulma Class | Value   |
| ----------- | ----------- | ------- |
| `my="0"`    | `my-0`      | 0       |
| `my="1"`    | `my-1`      | 0.25rem |
| `my="2"`    | `my-2`      | 0.5rem  |
| `my="3"`    | `my-3`      | 0.75rem |
| `my="4"`    | `my-4`      | 1rem    |
| `my="5"`    | `my-5`      | 1.5rem  |
| `my="6"`    | `my-6`      | 3rem    |
| `my="auto"` | `my-auto`   | auto    |

### Margin Examples

```tsx live
import { Box, Button, Title, Card } from '@allxsmith/bestax-bulma';

function MarginExamples() {
  return (
    <Box p="4">
      <Title mb="4">Margin Examples</Title>

      {/* All sides margin */}
      <Box backgroundColor="light" color="dark" p="2" m="4" mb="4">
        Box with margin on all sides (m="4")
      </Box>

      {/* Specific side margins */}
      <Box
        backgroundColor="info"
        color="dark"
        p="2"
        mt="3"
        mr="6"
        mb="2"
        ml="1"
      >
        Box with different margins on each side
      </Box>

      {/* Horizontal and vertical margins */}
      <Box
        backgroundColor="success"
        color="white"
        p="2"
        mx="auto"
        my="3"
        style={{ width: '200px' }}
      >
        Centered box with vertical margin
      </Box>

      {/* Button spacing */}
      <div className="mt-4">
        <Button mr="2">First Button</Button>
        <Button mr="2">Second Button</Button>
        <Button>Third Button</Button>
      </div>

      {/* Card spacing */}
      <Card mt="5" mb="3">
        <Card.Content>Card with top and bottom margins</Card.Content>
      </Card>
    </Box>
  );
}
```

## Padding

Use padding props to add internal spacing within elements. Padding creates space inside the element's border.

### All Sides Padding

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `p="0"`  | `p-0`       | 0       |
| `p="1"`  | `p-1`       | 0.25rem |
| `p="2"`  | `p-2`       | 0.5rem  |
| `p="3"`  | `p-3`       | 0.75rem |
| `p="4"`  | `p-4`       | 1rem    |
| `p="5"`  | `p-5`       | 1.5rem  |
| `p="6"`  | `p-6`       | 3rem    |

### Top Padding

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `pt="0"` | `pt-0`      | 0       |
| `pt="1"` | `pt-1`      | 0.25rem |
| `pt="2"` | `pt-2`      | 0.5rem  |
| `pt="3"` | `pt-3`      | 0.75rem |
| `pt="4"` | `pt-4`      | 1rem    |
| `pt="5"` | `pt-5`      | 1.5rem  |
| `pt="6"` | `pt-6`      | 3rem    |

### Right Padding

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `pr="0"` | `pr-0`      | 0       |
| `pr="1"` | `pr-1`      | 0.25rem |
| `pr="2"` | `pr-2`      | 0.5rem  |
| `pr="3"` | `pr-3`      | 0.75rem |
| `pr="4"` | `pr-4`      | 1rem    |
| `pr="5"` | `pr-5`      | 1.5rem  |
| `pr="6"` | `pr-6`      | 3rem    |

### Bottom Padding

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `pb="0"` | `pb-0`      | 0       |
| `pb="1"` | `pb-1`      | 0.25rem |
| `pb="2"` | `pb-2`      | 0.5rem  |
| `pb="3"` | `pb-3`      | 0.75rem |
| `pb="4"` | `pb-4`      | 1rem    |
| `pb="5"` | `pb-5`      | 1.5rem  |
| `pb="6"` | `pb-6`      | 3rem    |

### Left Padding

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `pl="0"` | `pl-0`      | 0       |
| `pl="1"` | `pl-1`      | 0.25rem |
| `pl="2"` | `pl-2`      | 0.5rem  |
| `pl="3"` | `pl-3`      | 0.75rem |
| `pl="4"` | `pl-4`      | 1rem    |
| `pl="5"` | `pl-5`      | 1.5rem  |
| `pl="6"` | `pl-6`      | 3rem    |

### Horizontal Padding (Left + Right)

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `px="0"` | `px-0`      | 0       |
| `px="1"` | `px-1`      | 0.25rem |
| `px="2"` | `px-2`      | 0.5rem  |
| `px="3"` | `px-3`      | 0.75rem |
| `px="4"` | `px-4`      | 1rem    |
| `px="5"` | `px-5`      | 1.5rem  |
| `px="6"` | `px-6`      | 3rem    |

### Vertical Padding (Top + Bottom)

| Property | Bulma Class | Value   |
| -------- | ----------- | ------- |
| `py="0"` | `py-0`      | 0       |
| `py="1"` | `py-1`      | 0.25rem |
| `py="2"` | `py-2`      | 0.5rem  |
| `py="3"` | `py-3`      | 0.75rem |
| `py="4"` | `py-4`      | 1rem    |
| `py="5"` | `py-5`      | 1.5rem  |
| `py="6"` | `py-6`      | 3rem    |

### Padding Examples

```tsx live
// import {
//   Box,
//   Card,
//   Notification,
//   Button,
//   Title,
// } from '@allxsmith/bestax-bulma';

function PaddingExamples() {
  return (
    <Box p="4">
      <Title mb="4">Padding Examples</Title>

      {/* All sides padding */}
      <Box backgroundColor="primary" color="white" p="6" mb="4">
        Box with large padding on all sides (p="6")
      </Box>

      {/* Specific side padding */}
      <Box
        backgroundColor="info"
        color="dark"
        pt="1"
        pr="4"
        pb="2"
        pl="6"
        mb="4"
      >
        Box with different padding on each side
      </Box>

      {/* Horizontal and vertical padding */}
      <Box backgroundColor="success" color="white" px="5" py="2" mb="4">
        Box with horizontal and vertical padding
      </Box>

      {/* Card with custom padding */}
      <Card mb="4">
        <Card.Content p="6">
          <Title size="5" mb="3">
            Card with Custom Padding
          </Title>
          <p>
            This card content has extra padding (p="6") for a more spacious
            feel.
          </p>
        </Card.Content>
      </Card>

      {/* Notification with minimal padding */}
      <Notification color="warning" p="2" mb="4">
        Compact notification with minimal padding
      </Notification>

      {/* Button with custom padding */}
      <Button px="6" py="3" backgroundColor="danger" color="white">
        Button with Custom Padding
      </Button>
    </Box>
  );
}
```

## Combining Margin and Padding

You can combine margin and padding properties to create sophisticated spacing layouts:

```tsx live
import { Box, Card, Title, Content, Button } from '@allxsmith/bestax-bulma';

function CombinedSpacingExample() {
  return (
    <Box p="4">
      <Title mb="5">Combined Spacing Example</Title>

      {/* Article-style layout */}
      <Card mx="auto" my="4" p="0" style={{ maxWidth: '600px' }}>
        <Card.Content pt="6" px="6" pb="4">
          <Title size="3" mb="3">
            Article Title
          </Title>
          <Content mb="4">
            <p>
              This is an example of combining margin and padding for a clean
              article layout with proper spacing.
            </p>
          </Content>
        </Card.Content>

        <Card.Content pt="0" px="6" pb="6">
          <Box backgroundColor="light" color="dark" p="4" mb="4">
            <Content>
              <p>
                This is a highlighted section with its own padding and margin
                within the card.
              </p>
            </Content>
          </Box>

          <Button mr="3" px="4" py="2">
            Read More
          </Button>
          <Button variant="outlined" px="4" py="2" color="dark">
            Share
          </Button>
        </Card.Content>
      </Card>

      {/* Grid-like layout with spacing */}
      <Box mt="6">
        <Title size="4" mb="4">
          Grid Layout with Spacing
        </Title>
        <Box display="flex" flexWrap="wrap" mx="-2">
          {[1, 2, 3, 4, 5, 6].map(num => (
            <Box key={num} style={{ width: '33.333%' }} px="2" mb="4">
              <Card p="4" backgroundColor="light" color="dark">
                <Title size="6" mb="2" color="dark">
                  Item {num}
                </Title>
                <Content>
                  Content with consistent spacing using margin and padding.
                </Content>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
```

## Best Practices

:::tip Spacing Guidelines

1. **Default First**: Prefer using component default spacing before customizing
2. **Consistency**: Use the spacing scale consistently throughout your application
3. **Hierarchy**: Use larger spacing values to create visual hierarchy
4. **Rhythm**: Establish vertical rhythm with consistent margin values
5. **Semantic spacing**: Use spacing to group related content together

:::

### Recommended Spacing Patterns

:::tip Best Practice

The recommended approach is to use the default padding and spacing that comes built into Bulma components. Components are designed with appropriate spacing out of the box. Only override spacing when absolutely necessary for your specific design requirements.

:::

```tsx
// PREFERRED: Use default component spacing
<Card>                    // Uses default Card spacing
  <Card.Content>          // Uses default Content spacing
    <Title>               // Uses default Title spacing
    <Content>             // Uses default Content spacing
    <Button>              // Uses default Button spacing
</Card>

// ACCEPTABLE: Override only when needed
// (In an imperfect world, sometimes customization is necessary)
<Card m="3">              // Override only when layout requires it
  <Card.Content p="5">    // Override only for specific design needs
    <Title mb="3">        // Override only when default doesn't work
    <Content mb="4">      // Override sparingly
    <Button mt="3">       // Override as last resort
</Card>

// AVOID: Excessive spacing overrides
<Card m="3" p="0" mx="auto" my="5">     // Too many overrides
  <Card.Content p="5" pt="6" pb="4">    // Overly complex spacing
    <Title mb="3" mt="2" mx="1">        // Unnecessary customization
```

:::warning Override with Caution

While spacing overrides are available and sometimes necessary, they should be used sparingly. Excessive customization can lead to inconsistent designs and maintenance challenges. When you do override default spacing, document your reasoning and ensure it aligns with your design system.

:::

:::tip Learn More

For detailed API information about spacing properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) - Complete spacing property reference
- [Responsive Design](/docs/guides/getting-started/responsiveness) - Responsive spacing techniques
- [Layout Components](/docs/guides/library/layout) - Layout components with built-in spacing
- [Bulma Spacing Documentation](https://bulma.io/documentation/helpers/spacing-helpers/) - Official Bulma spacing helpers
