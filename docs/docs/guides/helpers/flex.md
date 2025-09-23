---
title: Flex
sidebar_label: Flex
sidebar_position: 6
---

# Flex

Bulma provides comprehensive flexbox helpers that give you full control over flex container and flex item behavior. Combined with `display="flex"`, all of the flexbox CSS properties are available as helper classes in bestax-bulma.

:::tip

All components in bestax-bulma have access to these flexbox properties through the `useBulmaClasses` hook. You can apply flexbox properties to any component in the library to create sophisticated responsive layouts.

:::

## Overview

Flexbox (Flexible Box Layout) is a powerful CSS layout method that allows you to arrange elements in a container with precise control over their alignment, direction, order, and size. Bulma's flexbox helpers cover all the essential flexbox properties:

- **flex-direction** - Controls the main axis direction
- **flex-wrap** - Controls whether items wrap to new lines
- **justify-content** - Aligns items along the main axis
- **align-content** - Aligns wrapped lines
- **align-items** - Aligns items along the cross axis
- **align-self** - Overrides align-items for individual items
- **flex-grow** - Controls how much an item should grow
- **flex-shrink** - Controls how much an item should shrink

## Flex Direction

The `flexDirection` prop controls the direction of the main axis in a flex container. This determines how flex items are laid out within the container.

| Property                         | Bulma Class                        | CSS Property                     |
| -------------------------------- | ---------------------------------- | -------------------------------- |
| `flexDirection="row"`            | `is-flex-direction-row`            | `flex-direction: row`            |
| `flexDirection="row-reverse"`    | `is-flex-direction-row-reverse`    | `flex-direction: row-reverse`    |
| `flexDirection="column"`         | `is-flex-direction-column`         | `flex-direction: column`         |
| `flexDirection="column-reverse"` | `is-flex-direction-column-reverse` | `flex-direction: column-reverse` |

### Flex Direction Examples

```tsx live
import { Box, Button, Card } from '@allxsmith/bestax-bulma';

function FlexDirectionExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Row Direction (Default)</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box display="flex" flexDirection="row" backgroundColor="light" p="3">
            <Button color="primary" mr="2">
              Item 1
            </Button>
            <Button color="info" mr="2">
              Item 2
            </Button>
            <Button color="success">Item 3</Button>
          </Box>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Row Reverse</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box
            display="flex"
            flexDirection="row-reverse"
            backgroundColor="light"
            p="3"
          >
            <Button color="primary" ml="2">
              Item 1
            </Button>
            <Button color="info" ml="2">
              Item 2
            </Button>
            <Button color="success">Item 3</Button>
          </Box>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Column Direction</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box
            display="flex"
            flexDirection="column"
            backgroundColor="light"
            p="3"
          >
            <Button color="primary" mb="2">
              Item 1
            </Button>
            <Button color="info" mb="2">
              Item 2
            </Button>
            <Button color="success">Item 3</Button>
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Column Reverse</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box
            display="flex"
            flexDirection="column-reverse"
            backgroundColor="light"
            p="3"
          >
            <Button color="primary" mt="2">
              Item 1
            </Button>
            <Button color="info" mt="2">
              Item 2
            </Button>
            <Button color="success">Item 3</Button>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Flex Wrap

The `flexWrap` prop controls whether flex items wrap to new lines when they exceed the container width. This is essential for responsive layouts.

| Property                  | Bulma Class                 | CSS Property              |
| ------------------------- | --------------------------- | ------------------------- |
| `flexWrap="nowrap"`       | `is-flex-wrap-nowrap`       | `flex-wrap: nowrap`       |
| `flexWrap="wrap"`         | `is-flex-wrap-wrap`         | `flex-wrap: wrap`         |
| `flexWrap="wrap-reverse"` | `is-flex-wrap-wrap-reverse` | `flex-wrap: wrap-reverse` |

### Flex Wrap Examples

```tsx live
import { Box, Tag, Card, Content } from '@allxsmith/bestax-bulma';

function FlexWrapExamples() {
  const tags = [
    'JavaScript',
    'TypeScript',
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'Next.js',
    'Nuxt.js',
  ];

  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>No Wrap (Default)</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Items overflow the container when they don't fit:
          </Content>
          :::tip Try This Resize your browser window to see the tags overflow
          horizontally when the container becomes too narrow. :::
          <Box display="flex" flexWrap="nowrap" backgroundColor="light" p="3">
            {tags.map((tag, index) => (
              <Tag key={index} color="info" mr="2">
                {tag}
              </Tag>
            ))}
          </Box>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Wrap</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">Items wrap to new lines when they don't fit:</Content>
          <Box display="flex" flexWrap="wrap" backgroundColor="light" p="3">
            {tags.map((tag, index) => (
              <Tag key={index} color="primary" mr="2" mb="2">
                {tag}
              </Tag>
            ))}
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Wrap Reverse</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">Items wrap to new lines in reverse order:</Content>
          <Box
            display="flex"
            flexWrap="wrap-reverse"
            backgroundColor="light"
            p="3"
          >
            {tags.map((tag, index) => (
              <Tag key={index} color="success" mr="2" mt="2">
                {tag}
              </Tag>
            ))}
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Justify Content

The `justifyContent` prop controls how flex items are aligned along the main axis. This determines the distribution of space between and around items.

| Property                         | Bulma Class                        | CSS Property                     |
| -------------------------------- | ---------------------------------- | -------------------------------- |
| `justifyContent="flex-start"`    | `is-justify-content-flex-start`    | `justify-content: flex-start`    |
| `justifyContent="flex-end"`      | `is-justify-content-flex-end`      | `justify-content: flex-end`      |
| `justifyContent="center"`        | `is-justify-content-center`        | `justify-content: center`        |
| `justifyContent="space-between"` | `is-justify-content-space-between` | `justify-content: space-between` |
| `justifyContent="space-around"`  | `is-justify-content-space-around`  | `justify-content: space-around`  |
| `justifyContent="space-evenly"`  | `is-justify-content-space-evenly`  | `justify-content: space-evenly`  |
| `justifyContent="start"`         | `is-justify-content-start`         | `justify-content: start`         |
| `justifyContent="end"`           | `is-justify-content-end`           | `justify-content: end`           |
| `justifyContent="left"`          | `is-justify-content-left`          | `justify-content: left`          |
| `justifyContent="right"`         | `is-justify-content-right`         | `justify-content: right`         |

### Justify Content Examples

```tsx live
import { Box, Button, Card, Content } from '@allxsmith/bestax-bulma';

function JustifyContentExamples() {
  const justifyOptions = [
    { value: 'flex-start', label: 'Flex Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'Flex End' },
    { value: 'space-between', label: 'Space Between' },
    { value: 'space-around', label: 'Space Around' },
    { value: 'space-evenly', label: 'Space Evenly' },
  ];

  return (
    <Box p="4">
      {justifyOptions.map(({ value, label }) => (
        <Card key={value} mb="4">
          <Card.Header>
            <Card.Header.Title>{label}</Card.Header.Title>
          </Card.Header>
          <Card.Content>
            <Box
              display="flex"
              justifyContent={value as any}
              backgroundColor="light"
              p="3"
            >
              <Button color="primary" size="small">
                A
              </Button>
              <Button color="info" size="small">
                B
              </Button>
              <Button color="success" size="small">
                C
              </Button>
            </Box>
          </Card.Content>
        </Card>
      ))}
    </Box>
  );
}
```

## Align Content

The `alignContent` prop controls how wrapped flex lines are aligned along the cross axis. This only applies when there are multiple lines of flex items.

| Property                       | Bulma Class                      | CSS Property                   |
| ------------------------------ | -------------------------------- | ------------------------------ |
| `alignContent="flex-start"`    | `is-align-content-flex-start`    | `align-content: flex-start`    |
| `alignContent="flex-end"`      | `is-align-content-flex-end`      | `align-content: flex-end`      |
| `alignContent="center"`        | `is-align-content-center`        | `align-content: center`        |
| `alignContent="space-between"` | `is-align-content-space-between` | `align-content: space-between` |
| `alignContent="space-around"`  | `is-align-content-space-around`  | `align-content: space-around`  |
| `alignContent="space-evenly"`  | `is-align-content-space-evenly`  | `align-content: space-evenly`  |
| `alignContent="stretch"`       | `is-align-content-stretch`       | `align-content: stretch`       |

### Align Content Examples

```tsx live
import { Box, Tag, Card, Content } from '@allxsmith/bestax-bulma';

function AlignContentExamples() {
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6'];

  const alignOptions = [
    { value: 'flex-start', label: 'Flex Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'Flex End' },
    { value: 'space-between', label: 'Space Between' },
    { value: 'space-around', label: 'Space Around' },
    { value: 'stretch', label: 'Stretch' },
  ];

  return (
    <Box p="4">
      <Content mb="4">
        <strong>Note:</strong> align-content only affects containers with
        multiple lines of wrapped items.
      </Content>

      {alignOptions.map(({ value, label }) => (
        <Card key={value} mb="4">
          <Card.Header>
            <Card.Header.Title>{label}</Card.Header.Title>
          </Card.Header>
          <Card.Content>
            <Box
              display="flex"
              flexWrap="wrap"
              alignContent={value as any}
              backgroundColor="light"
              p="3"
              style={{ height: '150px' }}
            >
              {items.map((item, index) => (
                <Tag key={index} color="info" mr="1" mb="1" size="small">
                  {item}
                </Tag>
              ))}
            </Box>
          </Card.Content>
        </Card>
      ))}
    </Box>
  );
}
```

## Align Items

The `alignItems` prop controls how flex items are aligned along the cross axis. This affects all items in the flex container.

| Property                  | Bulma Class                 | CSS Property              |
| ------------------------- | --------------------------- | ------------------------- |
| `alignItems="stretch"`    | `is-align-items-stretch`    | `align-items: stretch`    |
| `alignItems="flex-start"` | `is-align-items-flex-start` | `align-items: flex-start` |
| `alignItems="flex-end"`   | `is-align-items-flex-end`   | `align-items: flex-end`   |
| `alignItems="center"`     | `is-align-items-center`     | `align-items: center`     |
| `alignItems="baseline"`   | `is-align-items-baseline`   | `align-items: baseline`   |
| `alignItems="start"`      | `is-align-items-start`      | `align-items: start`      |
| `alignItems="end"`        | `is-align-items-end`        | `align-items: end`        |

### Align Items Examples

```tsx live
import { Box, Button, Card, Content } from '@allxsmith/bestax-bulma';

function AlignItemsExamples() {
  const alignOptions = [
    { value: 'stretch', label: 'Stretch (Default)' },
    { value: 'flex-start', label: 'Flex Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'Flex End' },
    { value: 'baseline', label: 'Baseline' },
  ];

  return (
    <Box p="4">
      {alignOptions.map(({ value, label }) => (
        <Card key={value} mb="4">
          <Card.Header>
            <Card.Header.Title>{label}</Card.Header.Title>
          </Card.Header>
          <Card.Content>
            <Box
              display="flex"
              alignItems={value as any}
              backgroundColor="light"
              p="3"
            >
              <Button color="primary" size="small" mr="2">
                Small
              </Button>
              <Button color="info" mr="2">
                Medium
              </Button>
              <Button color="success" size="large">
                Large
              </Button>
            </Box>
          </Card.Content>
        </Card>
      ))}
    </Box>
  );
}
```

## Align Self

The `alignSelf` prop allows individual flex items to override the `alignItems` value set on their container. This provides fine-grained control over individual item alignment.

| Property                 | Bulma Class                | CSS Property             |
| ------------------------ | -------------------------- | ------------------------ |
| `alignSelf="auto"`       | `is-align-self-auto`       | `align-self: auto`       |
| `alignSelf="flex-start"` | `is-align-self-flex-start` | `align-self: flex-start` |
| `alignSelf="flex-end"`   | `is-align-self-flex-end`   | `align-self: flex-end`   |
| `alignSelf="center"`     | `is-align-self-center`     | `align-self: center`     |
| `alignSelf="baseline"`   | `is-align-self-baseline`   | `align-self: baseline`   |
| `alignSelf="stretch"`    | `is-align-self-stretch`    | `align-self: stretch`    |

The `alignSelf` prop allows individual flex items to override the `alignItems` value set on their container. This property applies to elements that are flex items (children of a flex container), not to the flex container itself.

**Important:** The element using `alignSelf` doesn't need `display="flex"` - it just needs to be a child of a flex container.

### Align Self Examples

```tsx live
import { Box, Button, Card, Content } from '@allxsmith/bestax-bulma';

function AlignSelfExamples() {
  return (
    <Box p="4">
      <Card>
        <Card.Header>
          <Card.Header.Title>Individual Item Alignment</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Container has alignItems="flex-start", but individual items override
            with alignSelf:
          </Content>
          <Box
            display="flex"
            alignItems="flex-start"
            bgColor="light"
            p="3"
            style={{ height: '150px' }}
          >
            <Button color="primary" alignSelf="flex-start" mr="2">
              Flex Start
            </Button>
            <Button color="info" alignSelf="center" mr="2">
              Center
            </Button>
            <Button color="success" alignSelf="flex-end" mr="2">
              Flex End
            </Button>
            <Button color="warning" alignSelf="stretch">
              Stretch
            </Button>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Flex Grow and Shrink

The `flexGrow` and `flexShrink` props control how flex items grow and shrink relative to each other. These properties are essential for creating responsive layouts where items adjust their size based on available space.

### Flex Grow

| Property       | Bulma Class      | CSS Property   |
| -------------- | ---------------- | -------------- |
| `flexGrow="0"` | `is-flex-grow-0` | `flex-grow: 0` |
| `flexGrow="1"` | `is-flex-grow-1` | `flex-grow: 1` |
| `flexGrow="2"` | `is-flex-grow-2` | `flex-grow: 2` |
| `flexGrow="3"` | `is-flex-grow-3` | `flex-grow: 3` |
| `flexGrow="4"` | `is-flex-grow-4` | `flex-grow: 4` |
| `flexGrow="5"` | `is-flex-grow-5` | `flex-grow: 5` |

### Flex Shrink

| Property         | Bulma Class        | CSS Property     |
| ---------------- | ------------------ | ---------------- |
| `flexShrink="0"` | `is-flex-shrink-0` | `flex-shrink: 0` |
| `flexShrink="1"` | `is-flex-shrink-1` | `flex-shrink: 1` |
| `flexShrink="2"` | `is-flex-shrink-2` | `flex-shrink: 2` |
| `flexShrink="3"` | `is-flex-shrink-3` | `flex-shrink: 3` |
| `flexShrink="4"` | `is-flex-shrink-4` | `flex-shrink: 4` |
| `flexShrink="5"` | `is-flex-shrink-5` | `flex-shrink: 5` |

### Flex Grow and Shrink Examples

```tsx live
import { Box, Button, Card, Content } from '@allxsmith/bestax-bulma';

function FlexGrowShrinkExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Flex Grow</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Items grow to fill available space based on their flex-grow value:
          </Content>
          <Box
            display="flex"
            backgroundColor="light"
            p="3"
            style={{ height: '150px' }}
          >
            <Button color="primary" flexGrow="0" mr="2">
              Grow 0 (Fixed)
            </Button>
            <Button color="info" flexGrow="1" mr="2">
              Grow 1
            </Button>
            <Button color="success" flexGrow="2">
              Grow 2 (2x as much)
            </Button>
          </Box>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Flex Shrink</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Items shrink when space is limited based on their flex-shrink value:
          </Content>
          <Box
            display="flex"
            backgroundColor="light"
            p="3"
            style={{ height: '150px' }}
          >
            <Button color="primary" flexShrink="0" mr="2">
              No Shrink
            </Button>
            <Button color="info" flexShrink="1" mr="2">
              Shrink 1
            </Button>
            <Button color="success" flexShrink="3">
              Shrink 3
            </Button>
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Combined Grow and Shrink</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Responsive layout that adapts to container size:
          </Content>
          <Box
            display="flex"
            backgroundColor="light"
            p="3"
            style={{ height: '150px' }}
          >
            <Box
              backgroundColor="primary"
              color="white"
              p="2"
              mr="2"
              flexGrow="1"
              flexShrink="1"
              textAlign="centered"
            >
              Sidebar (1:1)
            </Box>
            <Box
              backgroundColor="info"
              color="white"
              p="2"
              mr="2"
              flexGrow="3"
              flexShrink="1"
              textAlign="centered"
            >
              Main Content (3:1)
            </Box>
            <Box
              backgroundColor="success"
              color="white"
              p="2"
              flexGrow="1"
              flexShrink="2"
              textAlign="centered"
            >
              Aside (1:2)
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Complete Layout Example

Here's a comprehensive example showing how to combine multiple flexbox properties to create a complex, responsive layout:

```tsx live
// import {
//   Box,
//   Card,
//   Title,
//   Content,
//   Button,
//   Tag,
// } from '@allxsmith/bestax-bulma';

function ComplexFlexboxLayout() {
  return (
    <Box p="4">
      <Card>
        <Card.Header>
          <Card.Header.Title>Complex Flexbox Layout</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          {/* Main container */}
          <Box display="flex" flexDirection="column">
            {/* Header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              backgroundColor="primary"
              color="white"
              p="3"
              flexShrink="0"
            >
              <Title size="5" color="white" mb="0">
                Dashboard
              </Title>
              <Box display="flex" alignItems="center">
                <Tag color="light" mr="2">
                  Status: Online
                </Tag>
                <Button color="light" size="small">
                  Settings
                </Button>
              </Box>
            </Box>

            {/* Content area */}
            <Box display="flex" flexGrow="1">
              {/* Sidebar */}
              <Box flexShrink="0" mb="0">
                <strong>Navigation</strong>
                <ul>
                  <li>Dashboard</li>
                  <li>Analytics</li>
                  <li>Reports</li>
                  <li>Settings</li>
                </ul>
              </Box>

              {/* Main content */}
              <Box flexGrow="1" p="4" display="flex" flexDirection="column">
                <Title size="4" mb="3">
                  Welcome to the Dashboard
                </Title>

                {/* Cards grid */}
                <Box
                  display="flex"
                  flexWrap="wrap"
                  justifyContent="space-between"
                  flexGrow="1"
                >
                  <Box
                    backgroundColor="info"
                    color="white"
                    p="3"
                    mb="3"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    Card 1
                  </Box>
                  <Box
                    backgroundColor="success"
                    color="white"
                    p="3"
                    mb="3"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    Card 2
                  </Box>
                  <Box
                    backgroundColor="warning"
                    color="white"
                    p="3"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    Card 3
                  </Box>
                  <Box
                    backgroundColor="danger"
                    color="white"
                    p="3"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    Card 4
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              backgroundColor="dark"
              color="white"
              p="2"
              flexShrink="0"
            >
              <Content color="white" mb="0" textAlign="centered">
                © 2025 Your Company. All rights reserved.
              </Content>
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Best Practices

:::tip Flexbox Guidelines

1. **Start with display="flex"**: Always set `display="flex"` on the container before using flexbox properties
2. **Understand the axes**: Remember that flexbox has a main axis (flex-direction) and a cross axis (perpendicular)
3. **Use semantic properties**: Choose properties that clearly express your layout intent
4. **Combine with responsive props**: Use viewport props for responsive flexbox layouts
5. **Test with different content**: Ensure your layout works with varying content sizes

:::

### Common Flexbox Patterns

```tsx live
import { Box, Title, Button, Content } from '@allxsmith/bestax-bulma';

function CommonFlexboxPatterns() {
  return (
    <Box p="4">
      {/* Centered content */}
      <Box mb="6">
        <Title size="5" mb="3">
          Centered Content
        </Title>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Content mb="0" textAlign="centered">
            Perfectly centered
          </Content>
        </Box>
      </Box>

      {/* Navigation bar */}
      <Box mb="6">
        <Title size="5" mb="3">
          Navigation Bar Layout
        </Title>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="primary"
          textColor="white"
          p="3"
        >
          <Title textColor="white" mb="0">
            Logo
          </Title>
          <Box display="flex">
            <Button color="light" mr="2">
              Home
            </Button>
            <Button color="light" mr="2">
              About
            </Button>
            <Button color="light">Contact</Button>
          </Box>
        </Box>
      </Box>

      {/* Responsive grid alternative */}
      <Box mb="6">
        <Title size="5" mb="3">
          Responsive Grid Alternative
        </Title>
        <Box
          display="flex"
          flexWrap="wrap"
          justifyContent="space-between"
          p="3"
        >
          <Box
            mb="3"
            backgroundColor="info"
            textColor="white"
            p="3"
            textAlign="centered"
          >
            Card 1
          </Box>
          <Box
            mb="3"
            backgroundColor="success"
            textColor="white"
            p="3"
            textAlign="centered"
          >
            Card 2
          </Box>
          <Box
            mb="3"
            backgroundColor="warning"
            textColor="white"
            p="3"
            textAlign="centered"
          >
            Card 3
          </Box>
          <Box
            mb="3"
            backgroundColor="danger"
            textColor="white"
            p="3"
            textAlign="centered"
          >
            Card 4
          </Box>
        </Box>
      </Box>

      {/* Sticky footer layout */}
      <Box>
        <Title size="5" mb="3">
          Sticky Footer Layout
        </Title>
        <Box display="flex" flexDirection="column" backgroundColor="light">
          <Box
            backgroundColor="primary"
            textColor="white"
            p="3"
            textAlign="centered"
          >
            Header
          </Box>
          <Box flexGrow="1" p="4" textAlign="centered">
            Main content area that grows to fill available space
          </Box>
          <Box
            backgroundColor="dark"
            textColor="white"
            p="3"
            textAlign="centered"
          >
            Footer
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
```

:::tip Learn More

For detailed API information about flexbox properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) - Complete flexbox property reference
- [Visibility Helpers](/docs/guides/helpers/visibility) - Display and visibility utilities
- [Responsive Design](/docs/guides/getting-started/responsiveness) - Responsive flexbox techniques
- [Layout Components](/docs/guides/library/layout) - Layout components that use flexbox
- [Bulma Flexbox Documentation](https://bulma.io/documentation/helpers/flexbox-helpers/) - Official Bulma flexbox helpers
