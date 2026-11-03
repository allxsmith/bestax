---
title: Flex
sidebar_label: Flex
sidebar_position: 6
---

# Flex

Bulma provides comprehensive flexbox helpers that give you full control over flex container and flex item behavior, and bestax-bulma takes each of them as a prop.

The container props (`flexDirection`, `flexWrap`, `justifyContent`, `alignContent` and `alignItems`) need a flex container. [`Flex`](/docs/api/layout/flex), [`Stack`](/docs/api/layout/stack), [`Group`](/docs/api/layout/group) and [`Center`](/docs/api/layout/center) are flex containers already, so they take them as they are. On any other component, set `display="flex"` as well. The item props (`alignSelf`, `flexGrow` and `flexShrink`) go on the children and need neither.

:::tip Composable hook

These props are also available standalone via the `useFlexboxClasses` hook (container classes only emit when a `display` prop is `flex` or `inline-flex`, or when the hook is told the element is a flex container by its own CSS) — see [Composable Mini-Hooks](/docs/api/helpers/usebulmaclasses#composable-mini-hooks).

:::

:::info Reference

This page documents the bestax-bulma prop API for Bulma's flexbox helpers. For the underlying CSS utilities, see the [official Bulma flexbox helpers](https://bulma.io/documentation/helpers/flexbox-helpers/).

:::

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

The [gap helpers](#gap) put space between the items, on a flex container or a grid.

## Flex Direction

The `flexDirection` prop controls the direction of the main axis in a flex container. This determines how flex items are laid out within the container.

| Property                         | Bulma Class                        | CSS Property                     |
| -------------------------------- | ---------------------------------- | -------------------------------- |
| `flexDirection="row"`            | `is-flex-direction-row`            | `flex-direction: row`            |
| `flexDirection="row-reverse"`    | `is-flex-direction-row-reverse`    | `flex-direction: row-reverse`    |
| `flexDirection="column"`         | `is-flex-direction-column`         | `flex-direction: column`         |
| `flexDirection="column-reverse"` | `is-flex-direction-column-reverse` | `flex-direction: column-reverse` |

The reversed directions change only what's seen: a screen reader and the Tab key still follow the children's order, so use them where the order carries no meaning (WCAG 1.3.2 and 2.4.3).

### Flex Direction Examples

```tsx live
import { Box, Button, Card, Flex } from '@allxsmith/bestax-bulma';

function FlexDirectionExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Row Direction (Default)</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Flex flexDirection="row" gap="1" bgColor="light" p="3">
            <Button color="primary">Item 1</Button>
            <Button color="info">Item 2</Button>
            <Button color="success">Item 3</Button>
          </Flex>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Row Reverse</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Flex flexDirection="row-reverse" gap="1" bgColor="light" p="3">
            <Button color="primary">Item 1</Button>
            <Button color="info">Item 2</Button>
            <Button color="success">Item 3</Button>
          </Flex>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Column Direction</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Flex flexDirection="column" gap="1" bgColor="light" p="3">
            <Button color="primary">Item 1</Button>
            <Button color="info">Item 2</Button>
            <Button color="success">Item 3</Button>
          </Flex>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Column Reverse</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Flex flexDirection="column-reverse" gap="1" bgColor="light" p="3">
            <Button color="primary">Item 1</Button>
            <Button color="info">Item 2</Button>
            <Button color="success">Item 3</Button>
          </Flex>
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
import { Box, Tag, Card, Content, Flex } from '@allxsmith/bestax-bulma';

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
            Items overflow the container when they don't fit. Make the window
            narrower to see them run past its edge:
          </Content>
          <Flex flexWrap="nowrap" gap="1" bgColor="light" p="3">
            {tags.map((tag, index) => (
              <Tag key={index} color="info">
                {tag}
              </Tag>
            ))}
          </Flex>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Wrap</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">Items wrap to new lines when they don't fit:</Content>
          <Flex flexWrap="wrap" gap="1" bgColor="light" p="3">
            {tags.map((tag, index) => (
              <Tag key={index} color="primary">
                {tag}
              </Tag>
            ))}
          </Flex>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Wrap Reverse</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">Items wrap to new lines in reverse order:</Content>
          <Flex flexWrap="wrap-reverse" gap="1" bgColor="light" p="3">
            {tags.map((tag, index) => (
              <Tag key={index} color="success">
                {tag}
              </Tag>
            ))}
          </Flex>
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
import { Box, Button, Card, Flex } from '@allxsmith/bestax-bulma';

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
            <Flex justifyContent={value as any} bgColor="light" p="3">
              <Button color="primary" size="small">
                A
              </Button>
              <Button color="info" size="small">
                B
              </Button>
              <Button color="success" size="small">
                C
              </Button>
            </Flex>
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
import { Box, Tag, Card, Content, Flex } from '@allxsmith/bestax-bulma';

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
            <Flex
              flexWrap="wrap"
              alignContent={value as any}
              gap="0.5"
              bgColor="light"
              p="3"
              style={{ height: '150px' }}
            >
              {items.map((item, index) => (
                <Tag key={index} color="info">
                  {item}
                </Tag>
              ))}
            </Flex>
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
import { Box, Button, Card, Flex } from '@allxsmith/bestax-bulma';

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
            <Flex alignItems={value as any} gap="1" bgColor="light" p="3">
              <Button color="primary" size="small">
                Small
              </Button>
              <Button color="info">Medium</Button>
              <Button color="success" size="large">
                Large
              </Button>
            </Flex>
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
import { Box, Button, Card, Content, Flex } from '@allxsmith/bestax-bulma';

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
          <Flex
            alignItems="flex-start"
            gap="1"
            bgColor="light"
            p="3"
            style={{ height: '150px' }}
          >
            <Button color="primary" alignSelf="flex-start">
              Flex Start
            </Button>
            <Button color="info" alignSelf="center">
              Center
            </Button>
            <Button color="success" alignSelf="flex-end">
              Flex End
            </Button>
            <Button color="warning" alignSelf="stretch">
              Stretch
            </Button>
          </Flex>
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
import { Box, Button, Card, Content, Flex } from '@allxsmith/bestax-bulma';

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
          <Flex gap="1" bgColor="light" p="3" style={{ height: '150px' }}>
            <Button color="primary" flexGrow="0">
              Grow 0 (Fixed)
            </Button>
            <Button color="info" flexGrow="1">
              Grow 1
            </Button>
            <Button color="success" flexGrow="2">
              Grow 2 (2x as much)
            </Button>
          </Flex>
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
          <Flex gap="1" bgColor="light" p="3" style={{ height: '150px' }}>
            <Button color="primary" flexShrink="0">
              No Shrink
            </Button>
            <Button color="info" flexShrink="1">
              Shrink 1
            </Button>
            <Button color="success" flexShrink="3">
              Shrink 3
            </Button>
          </Flex>
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
          <Flex gap="1" bgColor="light" p="3" style={{ height: '150px' }}>
            <Box
              bgColor="primary"
              textColor="white"
              p="2"
              flexGrow="1"
              flexShrink="1"
              textAlign="centered"
            >
              Sidebar (1:1)
            </Box>
            <Box
              bgColor="info"
              textColor="white"
              p="2"
              flexGrow="3"
              flexShrink="1"
              textAlign="centered"
            >
              Main Content (3:1)
            </Box>
            <Box
              bgColor="success"
              textColor="white"
              p="2"
              flexGrow="1"
              flexShrink="2"
              textAlign="centered"
            >
              Aside (1:2)
            </Box>
          </Flex>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Gap

The gap helpers put space between the items of a flex container, or the cells of a grid, without a margin on any of the items. `gap` spaces both axes, and `columnGap` and `rowGap` set one.

| Property        | Bulma Class       | CSS Property       |
| --------------- | ----------------- | ------------------ |
| `gap="2"`       | `is-gap-2`        | `gap: 1rem`        |
| `columnGap="2"` | `is-column-gap-2` | `column-gap: 1rem` |
| `rowGap="2"`    | `is-row-gap-2`    | `row-gap: 1rem`    |
| `gapless`       | `is-gapless`      | `gap: 0`           |

Each whole step is 0.5rem, from `0` up to `8` (4rem), with a half step between each pair, such as `"1.5"` for 0.75rem. That is not the margin scale: `gap="2"` is 1rem where `m="2"` is 0.5rem. A step can also be written as a number (`gap={2}`).

The helpers set the CSS `gap`, so they only take effect on a flex or grid container. Components that already are one, such as `Stack`, `Group`, `Flex`, `Buttons`, `Tags` and `Grid`, take them as they are, and the helper replaces the spacing they'd have otherwise.

`gapless` is the shortcut for `gap="0"`, and `gap` wins when both are set. `columnGap` and `rowGap` win on their own axis over either.

### Gap Examples

A row of items, spaced apart and centered on each other, is a [`Group`](/docs/api/layout/group), which wraps when it runs out of room:

```tsx live
<Group gap="2">
  <Button color="primary">Save</Button>
  <Button>Cancel</Button>
  <Span textColor="grey">Last saved a minute ago</Span>
</Group>
```

A vertical stack is a [`Stack`](/docs/api/layout/stack). Bulma's block elements, such as `Notification` and `Box`, bring their own bottom margin, which a Stack zeroes, so the gap is the only space between them:

```tsx live
<Stack gap="3">
  <Notification color="info">First</Notification>
  <Notification color="success">Second</Notification>
  <Notification color="warning">Third</Notification>
</Stack>
```

Without a gap of their own, a Stack spaces its children by Bulma's block spacing and a Group by half of it. In a flex container of your own, made with `display="flex"`, those bottom margins add to the gap, so give each block `mb="0"`.

Different spacing on each axis, with wrapping:

```tsx live
<Tags columnGap="4" rowGap="1">
  {['React', 'TypeScript', 'Bulma', 'Sass', 'Vite', 'Storybook', 'Jest'].map(
    name => (
      <Tag key={name} color="link">
        {name}
      </Tag>
    )
  )}
</Tags>
```

`Grid` takes `gap`, `columnGap` and `rowGap` as its own props and renders these same classes. `Columns` has a `gap` of its own for its gutters, which takes whole steps; see [Columns](../../api/columns/columns.md).

## Complete Layout Example

Here's an example that combines the layout components with the flex props to build a dashboard: a `Stack` for the page, a `Group` for the header, a `Flex` for the side and the main part, and `Center` for the cards and the footer.

```tsx live
// import {
//   Box,
//   Button,
//   Card,
//   Center,
//   Content,
//   Flex,
//   Group,
//   Stack,
//   Tag,
//   Title,
// } from '@allxsmith/bestax-bulma';

function ComplexFlexboxLayout() {
  return (
    <Card>
      <Card.Header>
        <Card.Header.Title>Complex Flexbox Layout</Card.Header.Title>
      </Card.Header>
      <Card.Content>
        {/* Main container */}
        <Stack gap="3">
          {/* Header */}
          <Group
            justifyContent="space-between"
            bgColor="primary"
            textColor="white"
            p="3"
          >
            <Title size="5" textColor="white">
              Dashboard
            </Title>
            <Group gap="1">
              <Tag color="light">Status: Online</Tag>
              <Button color="light" size="small">
                Settings
              </Button>
            </Group>
          </Group>

          {/* Content area */}
          <Flex gap="3" alignItems="flex-start">
            {/* Sidebar */}
            <Box flexShrink="0">
              <strong>Navigation</strong>
              <ul>
                <li>Dashboard</li>
                <li>Analytics</li>
                <li>Reports</li>
                <li>Settings</li>
              </ul>
            </Box>

            {/* Main content */}
            <Stack flexGrow="1" gap="3">
              <Title size="4">Welcome to the Dashboard</Title>

              {/* Cards */}
              <Group isFullwidth breakpoint="tablet">
                <Center bgColor="info" textColor="white" p="3">
                  Card 1
                </Center>
                <Center bgColor="success" textColor="white" p="3">
                  Card 2
                </Center>
                <Center bgColor="warning" textColor="black" p="3">
                  Card 3
                </Center>
                <Center bgColor="danger" textColor="white" p="3">
                  Card 4
                </Center>
              </Group>
            </Stack>
          </Flex>

          {/* Footer */}
          <Center bgColor="dark" textColor="white" p="2">
            <Content textColor="white" textAlign="centered">
              © 2025 Your Company. All rights reserved.
            </Content>
          </Center>
        </Stack>
      </Card.Content>
    </Card>
  );
}
```

## Best Practices

:::tip Flexbox Guidelines

1. **Start with a flex container**: `Flex`, `Stack`, `Group` and `Center` are one already. On any other component, set `display="flex"` before the container props
2. **Understand the axes**: Remember that flexbox has a main axis (flex-direction) and a cross axis (perpendicular)
3. **Use semantic properties**: Choose properties that clearly express your layout intent
4. **Combine with responsive props**: Use viewport props for responsive flexbox layouts, or `Group`'s `breakpoint` for a row that stacks on a phone
5. **Test with different content**: Ensure your layout works with varying content sizes

:::

### Common Flexbox Patterns

```tsx live
// import {
//   Box,
//   Button,
//   Center,
//   Content,
//   Group,
//   Stack,
//   Title,
// } from '@allxsmith/bestax-bulma';

function CommonFlexboxPatterns() {
  return (
    <Stack gap="6">
      {/* Centered content */}
      <div>
        <Title size="5" mb="3">
          Centered Content
        </Title>
        <Center bgColor="light" p="5">
          <Content textAlign="centered">Perfectly centered</Content>
        </Center>
      </div>

      {/* Navigation bar */}
      <div>
        <Title size="5" mb="3">
          Navigation Bar Layout
        </Title>
        <Group
          justifyContent="space-between"
          bgColor="primary"
          textColor="white"
          p="3"
        >
          <Title textColor="white">Logo</Title>
          <Group gap="1">
            <Button color="light">Home</Button>
            <Button color="light">About</Button>
            <Button color="light">Contact</Button>
          </Group>
        </Group>
      </div>

      {/* Responsive grid alternative */}
      <div>
        <Title size="5" mb="3">
          Responsive Grid Alternative
        </Title>
        <Group justifyContent="space-between" p="3">
          <Box bgColor="info" textColor="white" p="3" textAlign="centered">
            Card 1
          </Box>
          <Box bgColor="success" textColor="white" p="3" textAlign="centered">
            Card 2
          </Box>
          <Box bgColor="warning" textColor="black" p="3" textAlign="centered">
            Card 3
          </Box>
          <Box bgColor="danger" textColor="white" p="3" textAlign="centered">
            Card 4
          </Box>
        </Group>
      </div>

      {/* Header, main and footer */}
      <div>
        <Title size="5" mb="3">
          Header, Main and Footer
        </Title>
        <Stack gap="0" bgColor="light">
          <Box bgColor="primary" textColor="white" p="3" textAlign="centered">
            Header
          </Box>
          <Box flexGrow="1" p="4" textAlign="centered">
            Main content area that grows to fill available space
          </Box>
          <Box bgColor="dark" textColor="white" p="3" textAlign="centered">
            Footer
          </Box>
        </Stack>
      </div>
    </Stack>
  );
}
```

:::tip Learn More

For detailed API information about flexbox properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) - Complete flexbox property reference
- [Visibility Helpers](/docs/guides/helpers/visibility) - Display and visibility utilities
- [Responsive Design](/docs/guides/features/responsiveness) - Responsive flexbox techniques
- [Layout Components](/docs/guides/library/layout) - Layout components that use flexbox
- [Bulma Flexbox Documentation](https://bulma.io/documentation/helpers/flexbox-helpers/) - Official Bulma flexbox helpers
