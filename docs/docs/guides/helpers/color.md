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

```tsx live
import { Title, SubTitle, Button, Buttons, Box } from '@allxsmith/bestax-bulma';

function ColorExamples() {
  return (
    <Box p="4">
      <Title color="primary">Primary colored title</Title>
      <SubTitle color="info">Info colored subtitle</SubTitle>

      <Buttons>
        <Button color="success">Success button</Button>
        <Button color="warning">Warning button</Button>
        <Button color="danger">Danger button</Button>
      </Buttons>

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

```tsx live
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

## Advanced Color Features

For more advanced color features including comprehensive shade variations and semantic color meanings, see the [Color Shades documentation](/docs/guides/helpers/color-palette).

:::tip Learn More

For detailed API information about color properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [Color Shades](/docs/guides/helpers/color-palette) - Extended color palette with numeric and semantic shades
- [CSS Variables](/docs/guides/features/css-variables) - Runtime color customization
- [Theme Component](/docs/api/helpers/theme) - Dynamic theming system
- [Bulma Color Documentation](https://bulma.io/documentation/helpers/color-helpers/) - Official Bulma color helpers
