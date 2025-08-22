---
title: Color Shades
sidebar_label: Color Shades
sidebar_position: 2
---

# Color Shades

Bulma v1 introduces an extended color palette system that provides semantic color variations beyond the basic color helpers. These palette helpers give you access to a comprehensive range of color shades and semantic meanings for each color.

Bestax-bulma refers to the color palette as **Color Shades** `colorShades`.

:::info

The color palette system is built on CSS variables, allowing for runtime customization and dynamic theming. All palette colors work seamlessly with the [Theme component](/docs/api/helpers/theme) for advanced theming scenarios.

:::

## Bulma Primary Colors

The primary color palette includes all the main Bulma colors with their full range of variations. Each color has multiple shades available through the palette system.

### Primary Color Variations

| Property                                 | Bulma Class                  | Description                                    |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------- |
| `color="primary"`                        | `has-text-primary`           | Base primary color                             |
| `color="primary" colorShade="light"`     | `has-text-primary-light`     | Light primary variant                          |
| `color="primary" colorShade="dark"`      | `has-text-primary-dark`      | Dark primary variant                           |
| `color="primary" colorShade="soft"`      | `has-text-primary-soft`      | Soft primary variant                           |
| `color="primary" colorShade="bold"`      | `has-text-primary-bold`      | Bold primary variant                           |
| `color="primary" colorShade="on-scheme"` | `has-text-primary-on-scheme` | Primary color optimized for scheme backgrounds |

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

Apply palette text colors using the `color` and `colorShade` props together. This provides semantic meaning while maintaining visual consistency.

### Example Usage

```tsx
import { Title, SubTitle, Content, Box } from '@allxsmith/bestax-bulma';

function PaletteTextExample() {
  return (
    <Box p="4">
      <Title color="primary" colorShade="bold" size="2" mb="3">
        Bold Primary Heading
      </Title>

      <SubTitle color="info" colorShade="soft" size="4" mb="4">
        Soft Info Subheading
      </SubTitle>

      <Content>
        <p>
          <span color="success" colorShade="dark">
            Success message
          </span>{' '}
          - Operation completed successfully.
        </p>
        <p>
          <span color="warning" colorShade="bold">
            Warning notice
          </span>{' '}
          - Please review before proceeding.
        </p>
        <p>
          <span color="danger" colorShade="light">
            Error message
          </span>{' '}
          - Something went wrong.
        </p>
      </Content>
    </Box>
  );
}
```

## Background Color

Apply palette background colors using the `backgroundColor` and `colorShade` props together. This creates sophisticated color schemes with semantic meaning.

### Primary Background Variations

| Property                                       | Bulma Class                    | Description              |
| ---------------------------------------------- | ------------------------------ | ------------------------ |
| `backgroundColor="primary"`                    | `has-background-primary`       | Base primary background  |
| `backgroundColor="primary" colorShade="light"` | `has-background-primary-light` | Light primary background |
| `backgroundColor="primary" colorShade="dark"`  | `has-background-primary-dark`  | Dark primary background  |
| `backgroundColor="primary" colorShade="soft"`  | `has-background-primary-soft`  | Soft primary background  |
| `backgroundColor="primary" colorShade="bold"`  | `has-background-primary-bold`  | Bold primary background  |

### Status Background Variations

| Property                                       | Bulma Class                    | Description              |
| ---------------------------------------------- | ------------------------------ | ------------------------ |
| `backgroundColor="success" colorShade="light"` | `has-background-success-light` | Light success background |
| `backgroundColor="info" colorShade="soft"`     | `has-background-info-soft`     | Soft info background     |
| `backgroundColor="warning" colorShade="light"` | `has-background-warning-light` | Light warning background |
| `backgroundColor="danger" colorShade="soft"`   | `has-background-danger-soft`   | Soft danger background   |

### Example Usage

```tsx
import { Notification, Card, Box, Message } from '@allxsmith/bestax-bulma';

function PaletteBackgroundExample() {
  return (
    <div>
      <Notification
        backgroundColor="success"
        colorShade="light"
        color="success"
        className="mb-4"
      >
        <strong>Success!</strong> Your changes have been saved.
      </Notification>

      <Notification
        backgroundColor="info"
        colorShade="soft"
        color="info"
        colorShade="dark"
        className="mb-4"
      >
        <strong>Info:</strong> System maintenance scheduled.
      </Notification>

      <Card backgroundColor="warning" colorShade="light" className="mb-4">
        <Card.Content>
          <Title color="warning" colorShade="dark" size="5">
            Warning Notice
          </Title>
          <Content color="warning" colorShade="bold">
            Please backup your data before proceeding.
          </Content>
        </Card.Content>
      </Card>

      <Message backgroundColor="danger" colorShade="soft">
        <Message.Header backgroundColor="danger" color="white">
          Error
        </Message.Header>
        <Message.Body color="danger" colorShade="dark">
          Unable to connect to the server. Please try again.
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

```tsx
import { Box, Button, Tag } from '@allxsmith/bestax-bulma';

function NumericShadeExample() {
  return (
    <Box p="4">
      {/* Primary color progression */}
      <div className="mb-4">
        <Title size="5" mb="3">
          Primary Color Progression
        </Title>
        <Box backgroundColor="primary" colorShade="10" p="2" mb="2">
          Primary 10% - Very light
        </Box>
        <Box backgroundColor="primary" colorShade="25" p="2" mb="2">
          Primary 25% - Light
        </Box>
        <Box
          backgroundColor="primary"
          colorShade="50"
          p="2"
          mb="2"
          color="white"
        >
          Primary 50% - Medium
        </Box>
        <Box
          backgroundColor="primary"
          colorShade="75"
          p="2"
          mb="2"
          color="white"
        >
          Primary 75% - Dark
        </Box>
        <Box backgroundColor="primary" colorShade="90" p="2" color="white">
          Primary 90% - Very dark
        </Box>
      </div>

      {/* Button variations */}
      <div className="mb-4">
        <Title size="5" mb="3">
          Button Variations
        </Title>
        <Button backgroundColor="info" colorShade="20" color="info" mr="2">
          20% Info
        </Button>
        <Button backgroundColor="success" colorShade="40" color="white" mr="2">
          40% Success
        </Button>
        <Button backgroundColor="warning" colorShade="60" color="white" mr="2">
          60% Warning
        </Button>
        <Button backgroundColor="danger" colorShade="80" color="white">
          80% Danger
        </Button>
      </div>

      {/* Tag variations */}
      <div>
        <Title size="5" mb="3">
          Tag Variations
        </Title>
        <Tag color="primary" colorShade="30" mr="2">
          30%
        </Tag>
        <Tag color="info" colorShade="45" mr="2">
          45%
        </Tag>
        <Tag color="success" colorShade="65" mr="2">
          65%
        </Tag>
        <Tag color="warning" colorShade="85">
          85%
        </Tag>
      </div>
    </Box>
  );
}
```

## Advanced Palette Combinations

Create sophisticated designs by combining different aspects of the color palette:

```tsx
import { Card, Title, Content, Button, Box } from '@allxsmith/bestax-bulma';

function AdvancedPaletteExample() {
  return (
    <Box p="4">
      {/* Status cards with coordinated colors */}
      <Box display="flex" flexDirection="column" gap="4">
        {/* Success Card */}
        <Card backgroundColor="success" colorShade="05">
          <Card.Content>
            <Title color="success" colorShade="dark" size="5">
              Task Completed
            </Title>
            <Content color="success" colorShade="70">
              Your deployment was successful. All services are running normally.
            </Content>
            <Button
              backgroundColor="success"
              colorShade="bold"
              color="white"
              size="small"
            >
              View Details
            </Button>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card backgroundColor="info" colorShade="10">
          <Card.Content>
            <Title color="info" colorShade="dark" size="5">
              System Update
            </Title>
            <Content color="info" colorShade="75">
              A new version is available. Update recommended for improved
              performance.
            </Content>
            <Button
              backgroundColor="info"
              colorShade="80"
              color="white"
              size="small"
            >
              Update Now
            </Button>
          </Card.Content>
        </Card>

        {/* Warning Card */}
        <Card backgroundColor="warning" colorShade="15">
          <Card.Content>
            <Title color="warning" colorShade="dark" size="5">
              Action Required
            </Title>
            <Content color="warning" colorShade="80">
              Your subscription will expire in 7 days. Please renew to continue
              service.
            </Content>
            <Button
              backgroundColor="warning"
              colorShade="bold"
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

```tsx
import { Theme, Box, Button, Title } from '@allxsmith/bestax-bulma';

function ThemedPaletteExample() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%" isRoot>
      <Box p="4">
        <Title color="primary" colorShade="bold" mb="3">
          Custom Purple Theme
        </Title>

        <Box backgroundColor="primary" colorShade="10" p="3" mb="3">
          <Content color="primary" colorShade="dark">
            This uses the custom purple primary color with palette variations.
          </Content>
        </Box>

        <Button backgroundColor="primary" colorShade="60" color="white">
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
