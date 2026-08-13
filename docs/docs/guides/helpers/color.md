---
title: Color
sidebar_label: Color
sidebar_position: 1
---

# Color

Bulma provides a comprehensive set of color helpers for text and background colors. These helpers allow you to quickly apply consistent coloring throughout your application without writing custom CSS.

:::tip Composable hook

These props are also available standalone via the `useColorClasses` hook — see [Composable Mini-Hooks](/docs/api/helpers/usebulmaclasses#composable-mini-hooks).

:::

:::info Reference

This page documents the bestax-bulma prop API for Bulma's color helpers. For the underlying CSS utilities, see the [official Bulma color helpers](https://bulma.io/documentation/helpers/color-helpers/).

:::

:::tip

All components in bestax-bulma have access to these standard color properties through the `useBulmaClasses` hook. This means you can apply color properties to any component in the library.

:::

## Text Color

Use the `textColor` prop to apply text colors. Most components re-expose Bulma's `has-text-*` helper under this name, because on components with a filled variant (`Button`, `Notification`, `Hero`, `Progress`, and others) `color` renders the `is-<color>` variant instead of a text color. Some components (`Box`, `Card`, `Block`, and friends) also accept `color` as a text-color alias, but `textColor` is the consistent name and takes precedence when both are set. `Tag`, `Input`, and table cells have no text-color prop; wrap their content in `<Span textColor="...">` instead. The prop accepts Bulma's standard color palette.

### Standard Colors

| Property              | Bulma Class        | Color Value         |
| --------------------- | ------------------ | ------------------- |
| `textColor="primary"` | `has-text-primary` | Primary theme color |
| `textColor="link"`    | `has-text-link`    | Link color          |
| `textColor="info"`    | `has-text-info`    | Info blue           |
| `textColor="success"` | `has-text-success` | Success green       |
| `textColor="warning"` | `has-text-warning` | Warning yellow      |
| `textColor="danger"`  | `has-text-danger`  | Danger red          |

### Monochrome Colors

| Property                   | Bulma Class             | Color Value   |
| -------------------------- | ----------------------- | ------------- |
| `textColor="black"`        | `has-text-black`        | Pure black    |
| `textColor="black-bis"`    | `has-text-black-bis`    | Almost black  |
| `textColor="black-ter"`    | `has-text-black-ter`    | Dark grey     |
| `textColor="grey-darker"`  | `has-text-grey-darker`  | Darker grey   |
| `textColor="grey-dark"`    | `has-text-grey-dark`    | Dark grey     |
| `textColor="grey"`         | `has-text-grey`         | Standard grey |
| `textColor="grey-light"`   | `has-text-grey-light`   | Light grey    |
| `textColor="grey-lighter"` | `has-text-grey-lighter` | Lighter grey  |
| `textColor="white"`        | `has-text-white`        | Pure white    |

### Theme Colors

| Property            | Bulma Class      | Color Value       |
| ------------------- | ---------------- | ----------------- |
| `textColor="light"` | `has-text-light` | Light theme color |
| `textColor="dark"`  | `has-text-dark`  | Dark theme color  |

### Special Colors

| Property              | Bulma Class        | Color Value         |
| --------------------- | ------------------ | ------------------- |
| `textColor="inherit"` | `has-text-inherit` | Inherit from parent |
| `textColor="current"` | `has-text-current` | Current color value |

### Example Usage

```tsx live
import {
  Title,
  SubTitle,
  Button,
  Buttons,
  Box,
  Span,
} from '@allxsmith/bestax-bulma';

function ColorExamples() {
  return (
    <Box p="4">
      <Title textColor="primary">Primary colored title</Title>
      <SubTitle textColor="info">Info colored subtitle</SubTitle>

      <Buttons>
        <Button textColor="success">Success text button</Button>
        <Button textColor="warning">Warning text button</Button>
        <Button textColor="danger">Danger text button</Button>
      </Buttons>

      <p>
        <Span textColor="grey">Grey text </Span>
        <Span textColor="black">Black text </Span>
        <Span textColor="white">White text</Span>
      </p>
    </Box>
  );
}
```

## Background Color

Use the `bgColor` prop to apply background colors. It accepts the same color values as `textColor` and renders Bulma's `has-background-*` helpers — plus, on six surface components, the `scheme-*` values below, which render as a dark-mode-safe inline style instead of a class. A few components accept the raw `backgroundColor` helper name instead, and `Notification` has no background prop at all: its `color` variant fills the background, so pair it with `textColor`. Each component's Props table lists the names it takes.

### Standard Background Colors

| Property            | Bulma Class              | Background Value          |
| ------------------- | ------------------------ | ------------------------- |
| `bgColor="primary"` | `has-background-primary` | Primary theme background  |
| `bgColor="link"`    | `has-background-link`    | Link background           |
| `bgColor="info"`    | `has-background-info`    | Info blue background      |
| `bgColor="success"` | `has-background-success` | Success green background  |
| `bgColor="warning"` | `has-background-warning` | Warning yellow background |
| `bgColor="danger"`  | `has-background-danger`  | Danger red background     |

### Monochrome Backgrounds

| Property                 | Bulma Class                   | Background Value         |
| ------------------------ | ----------------------------- | ------------------------ |
| `bgColor="black"`        | `has-background-black`        | Black background         |
| `bgColor="black-bis"`    | `has-background-black-bis`    | Almost black background  |
| `bgColor="black-ter"`    | `has-background-black-ter`    | Dark grey background     |
| `bgColor="grey-darker"`  | `has-background-grey-darker`  | Darker grey background   |
| `bgColor="grey-dark"`    | `has-background-grey-dark`    | Dark grey background     |
| `bgColor="grey"`         | `has-background-grey`         | Standard grey background |
| `bgColor="grey-light"`   | `has-background-grey-light`   | Light grey background    |
| `bgColor="grey-lighter"` | `has-background-grey-lighter` | Lighter grey background  |
| `bgColor="white"`        | `has-background-white`        | White background         |

### Theme Backgrounds

| Property          | Bulma Class            | Background Value       |
| ----------------- | ---------------------- | ---------------------- |
| `bgColor="light"` | `has-background-light` | Light theme background |
| `bgColor="dark"`  | `has-background-dark`  | Dark theme background  |

### Special Backgrounds

| Property            | Bulma Class              | Background Value    |
| ------------------- | ------------------------ | ------------------- |
| `bgColor="inherit"` | `has-background-inherit` | Inherit from parent |
| `bgColor="current"` | `has-background-current` | Current color value |

### Scheme Backgrounds (adapt to dark mode)

Bulma ships no `has-background-scheme-*` classes, so these values emit **no class at all** — the component renders a dark-mode-safe inline style that tracks Bulma's scheme CSS variables. They are supported on six surface components: `Section`, `Hero` (and `Hero.Head`/`Hero.Body`/`Hero.Foot`), `Container`, `Footer`, `Box`, and `Card` (the parent, not its subcomponents). `backgroundColorShade` is ignored for scheme values — no shaded scheme variables exist.

| Property                      | Emitted Inline Style                               | Background Value                   |
| ----------------------------- | -------------------------------------------------- | ---------------------------------- |
| `bgColor="scheme-main"`       | `background-color: var(--bulma-scheme-main)`       | The page's base surface            |
| `bgColor="scheme-main-bis"`   | `background-color: var(--bulma-scheme-main-bis)`   | One step off the base surface      |
| `bgColor="scheme-main-ter"`   | `background-color: var(--bulma-scheme-main-ter)`   | Two steps off the base surface     |
| `bgColor="scheme-invert"`     | `background-color: var(--bulma-scheme-invert)`     | The inverted (opposite) surface    |
| `bgColor="scheme-invert-bis"` | `background-color: var(--bulma-scheme-invert-bis)` | One step off the inverted surface  |
| `bgColor="scheme-invert-ter"` | `background-color: var(--bulma-scheme-invert-ter)` | Two steps off the inverted surface |

:::warning Invert backgrounds don't invert your text
The `scheme-invert*` values set only the background — text keeps the page's default color, which is low-contrast on an inverted surface. Pair them with a matching foreground: a named class with `color: var(--bulma-scheme-main)` for designs that serve both modes, or an explicit `textColor` when the design is single-mode and pinned with `<Theme isRoot colorMode="…">`. The `scheme-main*` values need no pairing — they stay close to the page background.
:::

This is the zero-CSS way to build alternating page bands that stay correct in dark mode:

```tsx live
import { Section, Title, SubTitle } from '@allxsmith/bestax-bulma';

function AlternatingBands() {
  return (
    <>
      <Section>
        <Title>First Band</Title>
        <SubTitle>Default scheme-main background.</SubTitle>
      </Section>
      <Section bgColor="scheme-main-bis">
        <Title>Second Band</Title>
        <SubTitle>Subtly offset, and it adapts to dark mode.</SubTitle>
      </Section>
      <Section bgColor="scheme-main-ter">
        <Title>Third Band</Title>
        <SubTitle>One step further, still zero custom CSS.</SubTitle>
      </Section>
    </>
  );
}
```

### Example Usage

```tsx live
import { Box, Notification, Card } from '@allxsmith/bestax-bulma';

function BackgroundColorExamples() {
  return (
    <div>
      <Box bgColor="primary" textColor="white" p="4" mb="3">
        Primary background with white text
      </Box>

      <Box bgColor="info" textColor="white" p="4" mb="3">
        Info background with white text
      </Box>

      <Notification color="success" textColor="white">
        Success notification via its color variant
      </Notification>

      <Card bgColor="light" p="4">
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
