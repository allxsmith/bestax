---
title: Typography
sidebar_label: Typography
sidebar_position: 4
---

# Typography

Bulma provides comprehensive typography helpers to control text size, alignment, transformation, weight, and font family. These utilities ensure consistent typography throughout your application.

:::tip

All components in bestax-bulma have access to these typography properties through the `useBulmaClasses` hook. You can apply typography properties to any component in the library.

:::

## Size

Control text size using the `textSize` prop. Bulma provides 7 size levels with size 1 being the largest and size 7 being the smallest.

| Property       | Bulma Class | Value          |
| -------------- | ----------- | -------------- |
| `textSize="1"` | `is-size-1` | 3rem (48px)    |
| `textSize="2"` | `is-size-2` | 2.5rem (40px)  |
| `textSize="3"` | `is-size-3` | 2rem (32px)    |
| `textSize="4"` | `is-size-4` | 1.5rem (24px)  |
| `textSize="5"` | `is-size-5` | 1.25rem (20px) |
| `textSize="6"` | `is-size-6` | 1rem (16px)    |
| `textSize="7"` | `is-size-7` | 0.75rem (12px) |

### Size Examples

```tsx live
import { Content, Box } from '@allxsmith/bestax-bulma';

function SizeExamples() {
  return (
    <Box p="4">
      <Content textSize="1" mb="3">
        Size 1 - Largest (3rem)
      </Content>
      <Content textSize="2" mb="3">
        Size 2 - Very Large (2.5rem)
      </Content>
      <Content textSize="3" mb="3">
        Size 3 - Large (2rem)
      </Content>
      <Content textSize="4" mb="3">
        Size 4 - Medium Large (1.5rem)
      </Content>
      <Content textSize="5" mb="3">
        Size 5 - Medium (1.25rem)
      </Content>
      <Content textSize="6" mb="3">
        Size 6 - Normal (1rem)
      </Content>
      <Content textSize="7" mb="3">
        Size 7 - Small (0.75rem)
      </Content>
    </Box>
  );
}
```

## Responsive Size

You can apply responsive text sizes that change based on screen size using the `viewport` prop combined with `textSize`.

### Responsive Breakpoints

| Viewport                | Screen Size               | Description         |
| ----------------------- | ------------------------- | ------------------- |
| `viewport="mobile"`     | Up to 768px               | Mobile devices      |
| `viewport="tablet"`     | Between 769px and 1023px  | Tablet devices      |
| `viewport="desktop"`    | Between 1024px and 1215px | Desktop screens     |
| `viewport="widescreen"` | Between 1216px and 1407px | Widescreen displays |
| `viewport="fullhd"`     | 1408px and above          | Full HD and larger  |

### Responsive Size Examples

```tsx live
import { Title, Content, Box } from '@allxsmith/bestax-bulma';

function ResponsiveSizeExample() {
  return (
    <Box p="4">
      <Title textSizeMobile="2" textSizeDesktop="1" mb="4">
        Responsive Heading
      </Title>

      <Content textSizeMobile="5" textSizeTablet="4" textSizeDesktop="3">
        This text gets larger on bigger screens: size 5 on mobile, size 4 on
        tablet, and size 3 on desktop.
      </Content>
    </Box>
  );
}
```

## Alignment

Control text alignment using the `textAlign` prop.

| Property                | Bulma Class          | Value          |
| ----------------------- | -------------------- | -------------- |
| `textAlign="left"`      | `has-text-left`      | Left aligned   |
| `textAlign="centered"`  | `has-text-centered`  | Center aligned |
| `textAlign="right"`     | `has-text-right`     | Right aligned  |
| `textAlign="justified"` | `has-text-justified` | Justified      |

### Alignment Examples

```tsx live
import { Content, Box } from '@allxsmith/bestax-bulma';

function AlignmentExamples() {
  return (
    <Box p="4">
      <Content
        textAlign="left"
        mb="3"
        backgroundColor="light"
        color="dark"
        p="3"
      >
        Left aligned text - This text is aligned to the left side of the
        container.
      </Content>

      <Content
        textAlign="centered"
        mb="3"
        backgroundColor="light"
        color="dark"
        p="3"
      >
        Centered text - This text is centered within the container.
      </Content>

      <Content
        textAlign="right"
        mb="3"
        backgroundColor="light"
        color="dark"
        p="3"
      >
        Right aligned text - This text is aligned to the right side of the
        container.
      </Content>

      <Content textAlign="justified" backgroundColor="light" color="dark" p="3">
        Justified text - This longer text is justified, which means it spreads
        out to fill the entire width of the container, creating straight edges
        on both sides by adjusting the spacing between words.
      </Content>
    </Box>
  );
}
```

## Responsive Alignment

Apply responsive text alignment that changes based on screen size.

### Responsive Alignment Examples

```tsx live
import { Title, Content, Box } from '@allxsmith/bestax-bulma';

function ResponsiveAlignmentExample() {
  return (
    <Box p="4">
      <Title textAlignMobile="centered" textAlignDesktop="left" mb="4">
        Responsive Alignment
      </Title>

      <Content
        textAlignMobile="centered"
        textAlignTablet="left"
        textAlignDesktop="justified"
      >
        This text is centered on mobile, left-aligned on tablet, and justified
        on desktop screens. Resize your browser to see the changes.
      </Content>
    </Box>
  );
}
```

## Text Transformation

Control text transformation using the `textTransform` prop.

| Property                      | Bulma Class      | Value                                |
| ----------------------------- | ---------------- | ------------------------------------ |
| `textTransform="capitalized"` | `is-capitalized` | Capitalize first letter of each word |
| `textTransform="lowercase"`   | `is-lowercase`   | All lowercase                        |
| `textTransform="uppercase"`   | `is-uppercase`   | ALL UPPERCASE                        |
| `textTransform="italic"`      | `is-italic`      | Italic text                          |

### Text Transformation Examples

```tsx live
import { Content, Box } from '@allxsmith/bestax-bulma';

function TextTransformExamples() {
  return (
    <Box p="4">
      <Content textTransform="capitalized" mb="3">
        capitalized text - Each Word Is Capitalized
      </Content>

      <Content textTransform="lowercase" mb="3">
        LOWERCASE TEXT - all letters become lowercase
      </Content>

      <Content textTransform="uppercase" mb="3">
        uppercase text - ALL LETTERS BECOME UPPERCASE
      </Content>

      <Content textTransform="italic">
        Italic text - This text appears in italics
      </Content>
    </Box>
  );
}
```

## Text Weight

Control font weight using the `textWeight` prop.

| Property                | Bulma Class                | Value                |
| ----------------------- | -------------------------- | -------------------- |
| `textWeight="light"`    | `has-text-weight-light`    | 300 weight           |
| `textWeight="normal"`   | `has-text-weight-normal`   | 400 weight (default) |
| `textWeight="medium"`   | `has-text-weight-medium`   | 500 weight           |
| `textWeight="semibold"` | `has-text-weight-semibold` | 600 weight           |
| `textWeight="bold"`     | `has-text-weight-bold`     | 700 weight           |

### Text Weight Examples

```tsx live
import { Content, Box } from '@allxsmith/bestax-bulma';

function TextWeightExamples() {
  return (
    <Box p="4">
      <Content textWeight="light" textSize="4" mb="3">
        Light weight text (300)
      </Content>

      <Content textWeight="normal" textSize="4" mb="3">
        Normal weight text (400)
      </Content>

      <Content textWeight="medium" textSize="4" mb="3">
        Medium weight text (500)
      </Content>

      <Content textWeight="semibold" textSize="4" mb="3">
        Semibold weight text (600)
      </Content>

      <Content textWeight="bold" textSize="4">
        Bold weight text (700)
      </Content>
    </Box>
  );
}
```

## Font Family

Control font family using the `fontFamily` prop.

| Property                  | Bulma Class            | Value                                |
| ------------------------- | ---------------------- | ------------------------------------ |
| `fontFamily="sans-serif"` | `is-family-sans-serif` | Sans-serif font stack                |
| `fontFamily="monospace"`  | `is-family-monospace`  | Monospace font stack                 |
| `fontFamily="primary"`    | `is-family-primary`    | Primary font family                  |
| `fontFamily="secondary"`  | `is-family-secondary`  | Secondary font family                |
| `fontFamily="code"`       | `is-family-code`       | Code font family (usually monospace) |

### Font Family Examples

```tsx live
import { Content, Box } from '@allxsmith/bestax-bulma';

function FontFamilyExamples() {
  return (
    <Box p="4">
      <Content fontFamily="sans-serif" mb="3">
        Sans-serif font family - Clean, modern appearance without serifs
      </Content>

      <Content fontFamily="monospace" mb="3">
        Monospace font family - Each character takes the same width
      </Content>

      <Content fontFamily="primary" mb="3">
        Primary font family - The primary font defined in your theme
      </Content>

      <Content fontFamily="secondary" mb="3">
        Secondary font family - The secondary font defined in your theme
      </Content>

      <Content fontFamily="code">
        Code font family - Optimized for displaying code snippets
      </Content>
    </Box>
  );
}
```

## Combined Typography

Create sophisticated typography by combining multiple typography properties:

```tsx live
import { Title, SubTitle, Content, Box, Card } from '@allxsmith/bestax-bulma';

function CombinedTypographyExample() {
  return (
    <Box p="4">
      <Card p="6">
        <Card.Content>
          <Title
            textSize="1"
            textAlign="centered"
            textWeight="bold"
            color="primary"
            mb="3"
          >
            Main Heading
          </Title>

          <SubTitle
            textSize="4"
            textAlign="centered"
            textWeight="light"
            color="grey"
            textTransform="uppercase"
            mb="5"
          >
            Article Subtitle
          </SubTitle>

          <Content
            textSize="5"
            textAlign="justified"
            textWeight="normal"
            fontFamily="primary"
            mb="4"
          >
            This is the main content paragraph with justified alignment and
            normal weight. It demonstrates how multiple typography properties
            can be combined to create sophisticated text layouts.
          </Content>

          <Content
            textSize="6"
            textAlign="right"
            textWeight="medium"
            textTransform="italic"
            color="grey-dark"
            fontFamily="secondary"
          >
            — Author Name, Publication Date
          </Content>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Article Layout Example

Here's a comprehensive example showing typography in an article layout:

```tsx live
// import {
//   Title,
//   SubTitle,
//   Content,
//   Box,
//   Section,
//   Container,
// } from '@allxsmith/bestax-bulma';

function ArticleExample() {
  return (
    <Section py="6">
      <Container>
        <Box maxWidth="800px" mx="auto">
          {/* Article Header */}
          <Title textSize="1" textWeight="bold" textAlign="centered" mb="3">
            The Future of Web Typography
          </Title>

          <SubTitle
            textSize="5"
            textWeight="normal"
            textAlign="centered"
            color="grey"
            mb="2"
          >
            Exploring modern approaches to web fonts and text layout
          </SubTitle>

          <Content
            textSize="7"
            textAlign="centered"
            textTransform="uppercase"
            color="grey-light"
            textWeight="medium"
            mb="6"
          >
            Published March 15, 2024
          </Content>

          {/* Article Body */}
          <Content textSize="5" textAlign="justified" mb="4">
            Typography is the art and technique of arranging type to make
            written language legible, readable, and appealing when displayed. In
            web development, good typography enhances user experience and
            communicates your brand's personality.
          </Content>

          <Content textSize="5" textAlign="justified" mb="4">
            With the evolution of CSS and web fonts, developers now have
            unprecedented control over typography. From variable fonts to
            advanced CSS features, the possibilities are endless.
          </Content>

          {/* Pull Quote */}
          <Box
            backgroundColor="light"
            p="4"
            my="5"
            borderLeft="4px solid"
            borderColor="primary"
          >
            <Content
              textSize="4"
              textWeight="medium"
              textAlign="centered"
              textTransform="italic"
              color="primary"
            >
              "Typography is the craft of endowing human language with a durable
              visual form."
            </Content>
          </Box>

          <Content textSize="5" textAlign="justified">
            As we continue to push the boundaries of web design, typography
            remains a fundamental pillar of effective communication and
            beautiful user interfaces.
          </Content>
        </Box>
      </Container>
    </Section>
  );
}
```

:::tip Learn More

For detailed API information about typography properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) - Complete typography property reference
- [Responsive Design](/docs/guides/getting-started/responsiveness) - Responsive typography techniques
- [Color Helpers](/docs/guides/helpers/color) - Text color properties
- [Title & SubTitle Components](/docs/api/elements/title) - Dedicated heading components
- [Bulma Typography Documentation](https://bulma.io/documentation/helpers/typography-helpers/) - Official Bulma typography helpers
