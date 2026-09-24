---
title: Color Shades
sidebar_label: Color Shades
sidebar_position: 2
---

# Color Shades

Bulma v1 introduces an extended color palette system that provides semantic color variations beyond the basic color helpers. These palette helpers give you access to a comprehensive range of color shades and semantic meanings for each color.

Bestax-bulma refers to the color palette as **Color Shades** `colorShades`.

:::tip Composable hook

These props are also available standalone via the `useColorClasses` hook (the same hook covers both colors and shades) — see [Composable Mini-Hooks](/docs/api/helpers/usebulmaclasses#composable-mini-hooks).

:::

:::info Reference

This page documents the bestax-bulma prop API for Bulma's palette helpers. For the underlying CSS utilities, see the [official Bulma palette helpers](https://bulma.io/documentation/helpers/palette-helpers/).

:::

:::info

The color palette system is built on CSS variables, allowing for runtime customization and dynamic theming. All palette colors work seamlessly with the [Theme component](/docs/api/helpers/theme) for advanced theming scenarios.

:::

## Available Shades

:::info

Bulma v1 introduces comprehensive color shades using CSS variables. You can combine the `color` prop with the `colorShade` prop for text colors, and the `bgColor` prop with the `backgroundColorShade` prop for background colors to access different variations of each color.

:::

### Numeric Shades (00-95)

**Text Color Shades:**

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

**Background Color Shades:**

| Property                    | Bulma Class Suffix | Description              |
| --------------------------- | ------------------ | ------------------------ |
| `backgroundColorShade="00"` | `-00`              | Lightest shade (0%)      |
| `backgroundColorShade="05"` | `-05`              | Very light shade (5%)    |
| `backgroundColorShade="10"` | `-10`              | Light shade (10%)        |
| `backgroundColorShade="15"` | `-15`              | Light shade (15%)        |
| `backgroundColorShade="20"` | `-20`              | Light shade (20%)        |
| `backgroundColorShade="25"` | `-25`              | Light shade (25%)        |
| `backgroundColorShade="30"` | `-30`              | Light shade (30%)        |
| `backgroundColorShade="35"` | `-35`              | Light shade (35%)        |
| `backgroundColorShade="40"` | `-40`              | Medium light shade (40%) |
| `backgroundColorShade="45"` | `-45`              | Medium light shade (45%) |
| `backgroundColorShade="50"` | `-50`              | Medium shade (50%)       |
| `backgroundColorShade="55"` | `-55`              | Medium shade (55%)       |
| `backgroundColorShade="60"` | `-60`              | Medium dark shade (60%)  |
| `backgroundColorShade="65"` | `-65`              | Medium dark shade (65%)  |
| `backgroundColorShade="70"` | `-70`              | Dark shade (70%)         |
| `backgroundColorShade="75"` | `-75`              | Dark shade (75%)         |
| `backgroundColorShade="80"` | `-80`              | Dark shade (80%)         |
| `backgroundColorShade="85"` | `-85`              | Dark shade (85%)         |
| `backgroundColorShade="90"` | `-90`              | Very dark shade (90%)    |
| `backgroundColorShade="95"` | `-95`              | Darkest shade (95%)      |

### Semantic Shades

**Text Color Shades:**

| Property                 | Bulma Class Suffix | Description                  |
| ------------------------ | ------------------ | ---------------------------- |
| `colorShade="invert"`    | `-invert`          | Inverted color               |
| `colorShade="light"`     | `-light`           | Light variant                |
| `colorShade="dark"`      | `-dark`            | Dark variant                 |
| `colorShade="soft"`      | `-soft`            | Soft variant                 |
| `colorShade="bold"`      | `-bold`            | Bold variant                 |
| `colorShade="on-scheme"` | `-on-scheme`       | Contrasting color for scheme |

**Background Color Shades:**

| Property                           | Bulma Class Suffix | Description                  |
| ---------------------------------- | ------------------ | ---------------------------- |
| `backgroundColorShade="invert"`    | `-invert`          | Inverted color               |
| `backgroundColorShade="light"`     | `-light`           | Light variant                |
| `backgroundColorShade="dark"`      | `-dark`            | Dark variant                 |
| `backgroundColorShade="soft"`      | `-soft`            | Soft variant                 |
| `backgroundColorShade="bold"`      | `-bold`            | Bold variant                 |
| `backgroundColorShade="on-scheme"` | `-on-scheme`       | Contrasting color for scheme |

### Basic Shade Usage Example

```tsx live
import { Button, Box, Tag, Title } from '@allxsmith/bestax-bulma';

function ColorShadeExamples() {
  return (
    <Box p="4">
      {/* Text color shades */}
      <Title textColor="primary" colorShade="30" mb="3">
        Primary 30% shade title
      </Title>

      {/* Background color shades */}
      <Box
        bgColor="info"
        backgroundColorShade="10"
        textColor="dark"
        p="3"
        mb="3"
      >
        Light info background (10%)
      </Box>

      <Box
        bgColor="success"
        backgroundColorShade="70"
        textColor="white"
        p="3"
        mb="3"
      >
        Dark success background (70%)
      </Box>

      {/* Button variations */}
      <div>
        <Button bgColor="danger" backgroundColorShade="light" mr="2">
          Light danger
        </Button>
        <Button bgColor="warning" backgroundColorShade="dark" mr="2">
          Dark warning
        </Button>
        <Button bgColor="primary" backgroundColorShade="invert">
          Inverted primary
        </Button>
      </div>

      {/* Tag variations */}
      <div className="mt-4">
        <Tag backgroundColor="info" backgroundColorShade="25" mr="2">
          25% Info
        </Tag>
        <Tag backgroundColor="success" backgroundColorShade="50" mr="2">
          50% Success
        </Tag>
        <Tag backgroundColor="warning" backgroundColorShade="75">
          75% Warning
        </Tag>
      </div>
    </Box>
  );
}
```

## Bulma Primary Colors

The primary color palette includes all the main Bulma colors with their full range of variations. Each color has multiple shades available through the palette system.

### Applying Numeric Shades to Primary Colors

You can apply any numeric shade (00-95) to any primary color by combining the `color` or `bgColor` prop with the appropriate shade prop:

- For text colors: use `color` + `colorShade`
- For background colors: use `bgColor` + `backgroundColorShade`

```tsx live
import { Box, Button, Title } from '@allxsmith/bestax-bulma';

function PrimaryColorShades() {
  return (
    <Box p="4">
      {/* Primary text color with numeric shades */}
      <Title textColor="primary" colorShade="20" size="4" mb="3">
        Primary 20% - Very Light
      </Title>
      <Title textColor="primary" colorShade="50" size="4" mb="3">
        Primary 50% - Medium
      </Title>
      <Title textColor="primary" colorShade="80" size="4" mb="3">
        Primary 80% - Dark
      </Title>

      {/* Background variations */}
      <Box
        bgColor="primary"
        backgroundColorShade="10"
        textColor="dark"
        p="3"
        mb="2"
      >
        Primary 10% Background
      </Box>
      <Box
        bgColor="primary"
        backgroundColorShade="30"
        p="3"
        mb="2"
        textColor="white"
      >
        Primary 30% Background
      </Box>
      <Box
        bgColor="primary"
        backgroundColorShade="60"
        p="3"
        mb="2"
        textColor="white"
      >
        Primary 60% Background
      </Box>
      <Box
        bgColor="primary"
        backgroundColorShade="90"
        p="3"
        mb="4"
        textColor="white"
      >
        Primary 90% Background
      </Box>

      {/* Button progression */}
      <div>
        <Button
          bgColor="primary"
          backgroundColorShade="15"
          color="primary"
          mr="2"
        >
          15%
        </Button>
        <Button
          bgColor="primary"
          backgroundColorShade="35"
          color="white"
          mr="2"
        >
          35%
        </Button>
        <Button
          bgColor="primary"
          backgroundColorShade="55"
          color="white"
          mr="2"
        >
          55%
        </Button>
        <Button
          bgColor="primary"
          backgroundColorShade="75"
          color="white"
          mr="2"
        >
          75%
        </Button>
        <Button bgColor="primary" backgroundColorShade="95" color="white">
          95%
        </Button>
      </div>
    </Box>
  );
}
```

### All Colors Support Numeric Shades

Every Bulma color supports the full range of numeric shades:

```tsx live
import { Box, Tag } from '@allxsmith/bestax-bulma';

function AllColorShades() {
  return (
    <Box p="4">
      {/* Success shades */}
      <div className="mb-4">
        <Tag
          backgroundColor="success"
          backgroundColorShade="20"
          color="success"
          mr="2"
        >
          Success 20%
        </Tag>
        <Tag
          backgroundColor="success"
          backgroundColorShade="40"
          color="white"
          mr="2"
        >
          Success 40%
        </Tag>
        <Tag
          backgroundColor="success"
          backgroundColorShade="60"
          color="white"
          mr="2"
        >
          Success 60%
        </Tag>
        <Tag backgroundColor="success" backgroundColorShade="80" color="white">
          Success 80%
        </Tag>
      </div>

      {/* Info shades */}
      <div className="mb-4">
        <Tag
          backgroundColor="info"
          backgroundColorShade="25"
          color="info"
          mr="2"
        >
          Info 25%
        </Tag>
        <Tag
          backgroundColor="info"
          backgroundColorShade="45"
          color="white"
          mr="2"
        >
          Info 45%
        </Tag>
        <Tag
          backgroundColor="info"
          backgroundColorShade="65"
          color="white"
          mr="2"
        >
          Info 65%
        </Tag>
        <Tag backgroundColor="info" backgroundColorShade="85" color="white">
          Info 85%
        </Tag>
      </div>

      {/* Warning shades */}
      <div className="mb-4">
        <Tag
          backgroundColor="warning"
          backgroundColorShade="30"
          color="warning"
          mr="2"
        >
          Warning 30%
        </Tag>
        <Tag
          backgroundColor="warning"
          backgroundColorShade="50"
          color="white"
          mr="2"
        >
          Warning 50%
        </Tag>
        <Tag
          backgroundColor="warning"
          backgroundColorShade="70"
          color="white"
          mr="2"
        >
          Warning 70%
        </Tag>
        <Tag backgroundColor="warning" backgroundColorShade="90" color="white">
          Warning 90%
        </Tag>
      </div>

      {/* Danger shades */}
      <div>
        <Tag
          backgroundColor="danger"
          backgroundColorShade="35"
          color="danger"
          mr="2"
        >
          Danger 35%
        </Tag>
        <Tag
          backgroundColor="danger"
          backgroundColorShade="55"
          color="white"
          mr="2"
        >
          Danger 55%
        </Tag>
        <Tag
          backgroundColor="danger"
          backgroundColorShade="75"
          color="white"
          mr="2"
        >
          Danger 75%
        </Tag>
        <Tag backgroundColor="danger" backgroundColorShade="95" color="white">
          Danger 95%
        </Tag>
      </div>
    </Box>
  );
}
```

### Primary Color Variations

| Property                                 | Bulma Class                  | Description                                    |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------- |
| `color="primary"`                        | `has-text-primary`           | Base primary color                             |
| `color="primary" colorShade="light"`     | `has-text-primary-light`     | Light primary variant                          |
| `color="primary" colorShade="dark"`      | `has-text-primary-dark`      | Dark primary variant                           |
| `color="primary" colorShade="soft"`      | `has-text-primary-soft`      | Soft primary variant                           |
| `color="primary" colorShade="bold"`      | `has-text-primary-bold`      | Bold primary variant                           |
| `color="primary" colorShade="on-scheme"` | `has-text-primary-on-scheme` | Primary color optimized for scheme backgrounds |
| `color="primary" colorShade="00"`        | `has-text-primary-00`        | Primary 0% shade (lightest)                    |
| `color="primary" colorShade="25"`        | `has-text-primary-25`        | Primary 25% shade                              |
| `color="primary" colorShade="50"`        | `has-text-primary-50`        | Primary 50% shade                              |
| `color="primary" colorShade="75"`        | `has-text-primary-75`        | Primary 75% shade                              |
| `color="primary" colorShade="95"`        | `has-text-primary-95`        | Primary 95% shade (darkest)                    |

### Link Color Variations

| Property                          | Bulma Class           | Description        |
| --------------------------------- | --------------------- | ------------------ |
| `color="link"`                    | `has-text-link`       | Base link color    |
| `color="link" colorShade="light"` | `has-text-link-light` | Light link variant |
| `color="link" colorShade="dark"`  | `has-text-link-dark`  | Dark link variant  |
| `color="link" colorShade="soft"`  | `has-text-link-soft`  | Soft link variant  |
| `color="link" colorShade="bold"`  | `has-text-link-bold`  | Bold link variant  |

### Info Color Variations

| Property                          | Bulma Class           | Description        |
| --------------------------------- | --------------------- | ------------------ |
| `color="info"`                    | `has-text-info`       | Base info color    |
| `color="info" colorShade="light"` | `has-text-info-light` | Light info variant |
| `color="info" colorShade="dark"`  | `has-text-info-dark`  | Dark info variant  |
| `color="info" colorShade="soft"`  | `has-text-info-soft`  | Soft info variant  |
| `color="info" colorShade="bold"`  | `has-text-info-bold`  | Bold info variant  |

### Success Color Variations

| Property                             | Bulma Class              | Description           |
| ------------------------------------ | ------------------------ | --------------------- |
| `color="success"`                    | `has-text-success`       | Base success color    |
| `color="success" colorShade="light"` | `has-text-success-light` | Light success variant |
| `color="success" colorShade="dark"`  | `has-text-success-dark`  | Dark success variant  |
| `color="success" colorShade="soft"`  | `has-text-success-soft`  | Soft success variant  |
| `color="success" colorShade="bold"`  | `has-text-success-bold`  | Bold success variant  |

### Warning Color Variations

| Property                             | Bulma Class              | Description           |
| ------------------------------------ | ------------------------ | --------------------- |
| `color="warning"`                    | `has-text-warning`       | Base warning color    |
| `color="warning" colorShade="light"` | `has-text-warning-light` | Light warning variant |
| `color="warning" colorShade="dark"`  | `has-text-warning-dark`  | Dark warning variant  |
| `color="warning" colorShade="soft"`  | `has-text-warning-soft`  | Soft warning variant  |
| `color="warning" colorShade="bold"`  | `has-text-warning-bold`  | Bold warning variant  |

### Danger Color Variations

| Property                            | Bulma Class             | Description          |
| ----------------------------------- | ----------------------- | -------------------- |
| `color="danger"`                    | `has-text-danger`       | Base danger color    |
| `color="danger" colorShade="light"` | `has-text-danger-light` | Light danger variant |
| `color="danger" colorShade="dark"`  | `has-text-danger-dark`  | Dark danger variant  |
| `color="danger" colorShade="soft"`  | `has-text-danger-soft`  | Soft danger variant  |
| `color="danger" colorShade="bold"`  | `has-text-danger-bold`  | Bold danger variant  |

## Text Color

Apply palette text colors using the `textColor` and `colorShade` props together. This provides semantic meaning while maintaining visual consistency.

### Example Usage

```tsx live
import { Box, Content, Span, SubTitle, Title } from '@allxsmith/bestax-bulma';

function PaletteTextExample() {
  return (
    <Box p="4">
      <Title textColor="primary" colorShade="bold" size="2" mb="3">
        Bold Primary Heading
      </Title>

      <SubTitle textColor="info" colorShade="soft" size="4" mb="4">
        Soft Info Subheading
      </SubTitle>

      <Content>
        <p>
          <Span textColor="success" colorShade="dark">
            Success message
          </Span>{' '}
          - Operation completed successfully.
        </p>
        <p>
          <Span textColor="warning" colorShade="bold">
            Warning notice
          </Span>{' '}
          - Please review before proceeding.
        </p>
        <p>
          <Span textColor="danger" colorShade="light">
            Error message
          </Span>{' '}
          - Something went wrong.
        </p>
      </Content>
    </Box>
  );
}
```

## Background Color

Apply palette background colors using the `bgColor` and `backgroundColorShade` props together. This creates sophisticated color schemes with semantic meaning.

### Primary Background Variations

| Property                                         | Bulma Class                    | Description              |
| ------------------------------------------------ | ------------------------------ | ------------------------ |
| `bgColor="primary"`                              | `has-background-primary`       | Base primary background  |
| `bgColor="primary" backgroundColorShade="light"` | `has-background-primary-light` | Light primary background |
| `bgColor="primary" backgroundColorShade="dark"`  | `has-background-primary-dark`  | Dark primary background  |
| `bgColor="primary" backgroundColorShade="soft"`  | `has-background-primary-soft`  | Soft primary background  |
| `bgColor="primary" backgroundColorShade="bold"`  | `has-background-primary-bold`  | Bold primary background  |

### Status Background Variations

| Property                                         | Bulma Class                    | Description              |
| ------------------------------------------------ | ------------------------------ | ------------------------ |
| `bgColor="success" backgroundColorShade="light"` | `has-background-success-light` | Light success background |
| `bgColor="info" backgroundColorShade="soft"`     | `has-background-info-soft`     | Soft info background     |
| `bgColor="warning" backgroundColorShade="light"` | `has-background-warning-light` | Light warning background |
| `bgColor="danger" backgroundColorShade="soft"`   | `has-background-danger-soft`   | Soft danger background   |

### Example Usage

```tsx live
import { Box, Card, Content, Message, Title } from '@allxsmith/bestax-bulma';

function PaletteBackgroundExample() {
  return (
    <div>
      <Box
        bgColor="success"
        backgroundColorShade="light"
        textColor="success"
        className="mb-4"
      >
        <strong>Success!</strong> Your changes have been saved.
      </Box>

      <Box
        bgColor="info"
        backgroundColorShade="soft"
        textColor="info"
        colorShade="dark"
        className="mb-4"
      >
        <strong>Info:</strong> System maintenance scheduled.
      </Box>

      <Card bgColor="warning" backgroundColorShade="light" className="mb-4">
        <Card.Content>
          <Title textColor="warning" colorShade="dark" size="5">
            Warning Notice
          </Title>
          <Content color="warning" colorShade="bold">
            Please backup your data before proceeding.
          </Content>
        </Card.Content>
      </Card>

      <Message bgColor="danger" backgroundColorShade="soft">
        <Message.Header>Example Error Message</Message.Header>
        <Message.Body>
          This is an example of how error messages would appear using danger
          color shades.
        </Message.Body>
      </Message>
    </div>
  );
}
```

## Numeric Shade Variations

:::tip

In addition to semantic shade names (light, dark, soft, bold), you can use numeric shades from 00 to 95 for precise color control.

:::

### Numeric Shade Examples

```tsx live
import { Box, Button, Tag } from '@allxsmith/bestax-bulma';

function NumericShadeExample() {
  return (
    <Box p="4">
      {/* Primary color progression */}
      <div className="mb-4">
        <Title size="5" mb="3">
          Primary Color Progression
        </Title>
        <Box bgColor="primary" backgroundColorShade="10" p="2" mb="2">
          Primary 10% - Very light
        </Box>
        <Box bgColor="primary" backgroundColorShade="25" p="2" mb="2">
          Primary 25% - Light
        </Box>
        <Box
          bgColor="primary"
          backgroundColorShade="50"
          p="2"
          mb="2"
          textColor="dark"
        >
          Primary 50% - Medium
        </Box>
        <Box
          bgColor="primary"
          backgroundColorShade="75"
          p="2"
          mb="2"
          textColor="dark"
        >
          Primary 75% - Dark
        </Box>
        <Box bgColor="primary" backgroundColorShade="90" p="2" textColor="dark">
          Primary 90% - Very dark
        </Box>
      </div>

      {/* Button variations */}
      <div className="mb-4">
        <Title size="5" mb="3">
          Button Variations
        </Title>
        <Button bgColor="info" backgroundColorShade="20" color="info" mr="2">
          20% Info
        </Button>
        <Button
          bgColor="success"
          backgroundColorShade="40"
          color="white"
          mr="2"
        >
          40% Success
        </Button>
        <Button
          bgColor="warning"
          backgroundColorShade="60"
          color="white"
          mr="2"
        >
          60% Warning
        </Button>
        <Button bgColor="danger" backgroundColorShade="80" color="white">
          80% Danger
        </Button>
      </div>

      {/* Tag variations */}
      <div>
        <Title size="5" mb="3">
          Tag Variations
        </Title>
        <Tag backgroundColor="primary" backgroundColorShade="30" mr="2">
          30%
        </Tag>
        <Tag backgroundColor="info" backgroundColorShade="45" mr="2">
          45%
        </Tag>
        <Tag backgroundColor="success" backgroundColorShade="65" mr="2">
          65%
        </Tag>
        <Tag backgroundColor="warning" backgroundColorShade="85">
          85%
        </Tag>
      </div>
    </Box>
  );
}
```

## Advanced Palette Combinations

Create sophisticated designs by combining different aspects of the color palette:

```tsx live
import { Card, Title, Content, Button, Box } from '@allxsmith/bestax-bulma';

function AdvancedPaletteExample() {
  return (
    <Box p="4">
      {/* Status cards with coordinated colors */}
      <Box display="flex" flexDirection="column">
        {/* Success Card */}
        <Card bgColor="success" backgroundColorShade="05">
          <Card.Content>
            <Title textColor="success" colorShade="dark" size="5">
              Task Completed
            </Title>
            <Content color="success" colorShade="70">
              Your deployment was successful. All services are running normally.
            </Content>
            <Button
              bgColor="success"
              backgroundColorShade="bold"
              color="white"
              size="small"
            >
              View Details
            </Button>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card bgColor="info" backgroundColorShade="10">
          <Card.Content>
            <Title textColor="info" colorShade="dark" size="5">
              System Update
            </Title>
            <Content color="info" colorShade="75">
              A new version is available. Update recommended for improved
              performance.
            </Content>
            <Button
              bgColor="info"
              backgroundColorShade="80"
              color="white"
              size="small"
            >
              Update Now
            </Button>
          </Card.Content>
        </Card>

        {/* Warning Card */}
        <Card bgColor="warning" backgroundColorShade="15">
          <Card.Content>
            <Title textColor="warning" colorShade="dark" size="5">
              Action Required
            </Title>
            <Content color="warning" colorShade="80">
              Your subscription will expire in 7 days. Please renew to continue
              service.
            </Content>
            <Button
              bgColor="warning"
              backgroundColorShade="bold"
              color="white"
              size="small"
            >
              Renew Now
            </Button>
          </Card.Content>
        </Card>
      </Box>
    </Box>
  );
}
```

## Theme Integration

:::info

Palette colors work seamlessly with the [Theme component](/docs/api/helpers/theme) for dynamic color schemes. You can override palette colors at runtime using CSS variables.

:::

```tsx live
import { Theme, Box, Button, Content, Title } from '@allxsmith/bestax-bulma';

function ThemedPaletteExample() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%" isRoot>
      <Box p="4">
        <Title textColor="primary" colorShade="bold" mb="3">
          Custom Purple Theme
        </Title>

        <Box bgColor="primary" backgroundColorShade="10" p="3" mb="3">
          <Content color="primary" colorShade="dark">
            This uses the custom purple primary color with palette variations.
          </Content>
        </Box>

        <Button bgColor="primary" backgroundColorShade="60" color="white">
          Custom Primary Button
        </Button>
      </Box>
    </Theme>
  );
}
```

:::tip Learn More

For comprehensive information about color properties and shades, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [Color Helpers](/docs/guides/helpers/color) - Basic color system
- [CSS Variables](/docs/guides/features/css-variables) - Runtime color customization
- [Theme Component](/docs/api/helpers/theme) - Dynamic theming system
- [Configuration](/docs/guides/features/configuration) - Theme and color configuration
- [Bulma Palette Documentation](https://bulma.io/documentation/helpers/palette-helpers/) - Official Bulma palette helpers
