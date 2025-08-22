---
title: Color
sidebar_label: Color
sidebar_position: 1
---

# Color

Bulma provides a comprehensive set of color helpers for text and background colors. These helpers allow you to quickly apply consistent coloring throughout your application without writing custom CSS.

:::tip

All components in bestax-bulma have access to these standard color properties through the `useBulmaClasses` hook. This means you can apply color properties to any component in the library.

:::

## Text Color

Use the `color` prop to apply text colors to any component. The color prop accepts Bulma's standard color palette.

### Standard Colors

| Property          | Bulma Class        | Color Value         |
| ----------------- | ------------------ | ------------------- |
| `color="primary"` | `has-text-primary` | Primary theme color |
| `color="link"`    | `has-text-link`    | Link color          |
| `color="info"`    | `has-text-info`    | Info blue           |
| `color="success"` | `has-text-success` | Success green       |
| `color="warning"` | `has-text-warning` | Warning yellow      |
| `color="danger"`  | `has-text-danger`  | Danger red          |

### Monochrome Colors

| Property               | Bulma Class             | Color Value   |
| ---------------------- | ----------------------- | ------------- |
| `color="black"`        | `has-text-black`        | Pure black    |
| `color="black-bis"`    | `has-text-black-bis`    | Almost black  |
| `color="black-ter"`    | `has-text-black-ter`    | Dark grey     |
| `color="grey-darker"`  | `has-text-grey-darker`  | Darker grey   |
| `color="grey-dark"`    | `has-text-grey-dark`    | Dark grey     |
| `color="grey"`         | `has-text-grey`         | Standard grey |
| `color="grey-light"`   | `has-text-grey-light`   | Light grey    |
| `color="grey-lighter"` | `has-text-grey-lighter` | Lighter grey  |
| `color="white"`        | `has-text-white`        | Pure white    |

### Theme Colors

| Property        | Bulma Class      | Color Value       |
| --------------- | ---------------- | ----------------- |
| `color="light"` | `has-text-light` | Light theme color |
| `color="dark"`  | `has-text-dark`  | Dark theme color  |

### Special Colors

| Property          | Bulma Class        | Color Value         |
| ----------------- | ------------------ | ------------------- |
| `color="inherit"` | `has-text-inherit` | Inherit from parent |
| `color="current"` | `has-text-current` | Current color value |

### Example Usage

```tsx
import { Title, SubTitle, Button, Box } from '@allxsmith/bestax-bulma';

function ColorExamples() {
  return (
    <Box p="4">
      <Title color="primary">Primary colored title</Title>
      <SubTitle color="info">Info colored subtitle</SubTitle>

      <Button color="success">Success button</Button>
      <Button color="warning">Warning button</Button>
      <Button color="danger">Danger button</Button>

      <p>
        <span color="grey">Grey text </span>
        <span color="black">Black text </span>
        <span color="white">White text</span>
      </p>
    </Box>
  );
}
```

## Background Color

Use the `backgroundColor` prop to apply background colors to any component. The backgroundColor prop accepts the same color values as the text color prop.

### Standard Background Colors

| Property                    | Bulma Class              | Background Value          |
| --------------------------- | ------------------------ | ------------------------- |
| `backgroundColor="primary"` | `has-background-primary` | Primary theme background  |
| `backgroundColor="link"`    | `has-background-link`    | Link background           |
| `backgroundColor="info"`    | `has-background-info`    | Info blue background      |
| `backgroundColor="success"` | `has-background-success` | Success green background  |
| `backgroundColor="warning"` | `has-background-warning` | Warning yellow background |
| `backgroundColor="danger"`  | `has-background-danger`  | Danger red background     |

### Monochrome Backgrounds

| Property                         | Bulma Class                   | Background Value         |
| -------------------------------- | ----------------------------- | ------------------------ |
| `backgroundColor="black"`        | `has-background-black`        | Black background         |
| `backgroundColor="black-bis"`    | `has-background-black-bis`    | Almost black background  |
| `backgroundColor="black-ter"`    | `has-background-black-ter`    | Dark grey background     |
| `backgroundColor="grey-darker"`  | `has-background-grey-darker`  | Darker grey background   |
| `backgroundColor="grey-dark"`    | `has-background-grey-dark`    | Dark grey background     |
| `backgroundColor="grey"`         | `has-background-grey`         | Standard grey background |
| `backgroundColor="grey-light"`   | `has-background-grey-light`   | Light grey background    |
| `backgroundColor="grey-lighter"` | `has-background-grey-lighter` | Lighter grey background  |
| `backgroundColor="white"`        | `has-background-white`        | White background         |

### Theme Backgrounds

| Property                  | Bulma Class            | Background Value       |
| ------------------------- | ---------------------- | ---------------------- |
| `backgroundColor="light"` | `has-background-light` | Light theme background |
| `backgroundColor="dark"`  | `has-background-dark`  | Dark theme background  |

### Example Usage

```tsx
import { Box, Notification, Card } from '@allxsmith/bestax-bulma';

function BackgroundColorExamples() {
  return (
    <div>
      <Box backgroundColor="primary" color="white" p="4" mb="3">
        Primary background with white text
      </Box>

      <Box backgroundColor="info" color="white" p="4" mb="3">
        Info background with white text
      </Box>

      <Notification backgroundColor="success" color="white">
        Success notification with custom colors
      </Notification>

      <Card backgroundColor="light" p="4">
        <Card.Content>Light background card</Card.Content>
      </Card>
    </div>
  );
}
```

## Color Shades

:::info

Bulma v1 introduces comprehensive color shades using CSS variables. You can combine the `color` or `backgroundColor` prop with the `colorShade` prop to access different variations of each color.

:::

### Available Shades

| Property          | Bulma Class Suffix | Description              |
| ----------------- | ------------------ | ------------------------ |
| `colorShade="00"` | `-00`              | Lightest shade (0%)      |
| `colorShade="05"` | `-05`              | Very light shade (5%)    |
| `colorShade="10"` | `-10`              | Light shade (10%)        |
| `colorShade="15"` | `-15`              | Light shade (15%)        |
| `colorShade="20"` | `-20`              | Light shade (20%)        |
| `colorShade="25"` | `-25`              | Light shade (25%)        |
| `colorShade="30"` | `-30`              | Light shade (30%)        |
| `colorShade="35"` | `-35`              | Light shade (35%)        |
| `colorShade="40"` | `-40`              | Medium light shade (40%) |
| `colorShade="45"` | `-45`              | Medium light shade (45%) |
| `colorShade="50"` | `-50`              | Medium shade (50%)       |
| `colorShade="55"` | `-55`              | Medium shade (55%)       |
| `colorShade="60"` | `-60`              | Medium dark shade (60%)  |
| `colorShade="65"` | `-65`              | Medium dark shade (65%)  |
| `colorShade="70"` | `-70`              | Dark shade (70%)         |
| `colorShade="75"` | `-75`              | Dark shade (75%)         |
| `colorShade="80"` | `-80`              | Dark shade (80%)         |
| `colorShade="85"` | `-85`              | Dark shade (85%)         |
| `colorShade="90"` | `-90`              | Very dark shade (90%)    |
| `colorShade="95"` | `-95`              | Darkest shade (95%)      |

### Special Shades

| Property                 | Bulma Class Suffix | Description                  |
| ------------------------ | ------------------ | ---------------------------- |
| `colorShade="invert"`    | `-invert`          | Inverted color               |
| `colorShade="light"`     | `-light`           | Light variant                |
| `colorShade="dark"`      | `-dark`            | Dark variant                 |
| `colorShade="soft"`      | `-soft`            | Soft variant                 |
| `colorShade="bold"`      | `-bold`            | Bold variant                 |
| `colorShade="on-scheme"` | `-on-scheme`       | Contrasting color for scheme |

### Example Usage

```tsx
import { Button, Box, Tag } from '@allxsmith/bestax-bulma';

function ColorShadeExamples() {
  return (
    <Box p="4">
      {/* Text color shades */}
      <Title color="primary" colorShade="30" mb="3">
        Primary 30% shade title
      </Title>

      {/* Background color shades */}
      <Box backgroundColor="info" colorShade="10" p="3" mb="3">
        Light info background (10%)
      </Box>

      <Box backgroundColor="success" colorShade="70" color="white" p="3" mb="3">
        Dark success background (70%)
      </Box>

      {/* Button variations */}
      <div>
        <Button color="danger" colorShade="light" mr="2">
          Light danger
        </Button>
        <Button color="warning" colorShade="dark" mr="2">
          Dark warning
        </Button>
        <Button color="primary" colorShade="invert">
          Inverted primary
        </Button>
      </div>

      {/* Tag variations */}
      <div className="mt-4">
        <Tag color="info" colorShade="25" mr="2">
          25% Info
        </Tag>
        <Tag color="success" colorShade="50" mr="2">
          50% Success
        </Tag>
        <Tag color="warning" colorShade="75">
          75% Warning
        </Tag>
      </div>
    </Box>
  );
}
```

## Combining Colors and Shades

You can create sophisticated color schemes by combining text and background colors with different shades:

```tsx
import { Card, Title, Content, Button } from '@allxsmith/bestax-bulma';

function AdvancedColorExample() {
  return (
    <Card backgroundColor="primary" colorShade="10" p="4">
      <Card.Content>
        <Title color="primary" colorShade="dark" size="4">
          Primary Card with Shaded Background
        </Title>
        <Content color="primary" colorShade="70">
          This card uses a light primary background (10% shade) with darker
          primary text (70% shade) for optimal contrast.
        </Content>
        <Button backgroundColor="primary" colorShade="invert" color="primary">
          Inverted Button
        </Button>
      </Card.Content>
    </Card>
  );
}
```

:::tip Learn More

For detailed API information about color properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [Color Palette Helpers](/docs/guides/helpers/color-palette) - Extended color palette with semantic variations
- [CSS Variables](/docs/guides/features/css-variables) - Runtime color customization
- [Theme Component](/docs/api/helpers/theme) - Dynamic theming system
- [Bulma Color Documentation](https://bulma.io/documentation/helpers/color-helpers/) - Official Bulma color helpers
