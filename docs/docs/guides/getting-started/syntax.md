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

```tsx live
<div class="buttons">
  <button class="button is-small">Button</button>

  <button class="button is-primary">Primary</button>

  <button class="button is-info">
    <span class="icon">
      <i class="fab fa-github"></i>
    </span>
    <span>GitHub</span>
  </button>

  <button class="button is-danger">
    <span class="icon">
      <i class="fas fa-bold"></i>
    </span>
    <span>Bold</span>
  </button>

  <button class="button is-link is-medium">Medium Button</button>

  {/* Rounded loading button */}
  <button class="button is-warning is-large is-rounded is-loading">
    Loading
  </button>
</div>
```

### Form Field Example (Testing Dark/Light Mode)

Here's a test example to verify our dark/light mode works with Field labels:

:::tip Test Dark/Light Mode Toggle

Try toggling between light and dark mode using the theme switcher in the top navigation bar. Notice how the field labels change color to maintain proper contrast and readability in both modes.

:::

```tsx live
<>
  <Field label="Name">
    <Control>
      <Input placeholder="Enter your name" />
    </Control>
  </Field>

  <Field label="Email">
    <Control>
      <Input placeholder="Enter your email" />
    </Control>
  </Field>

  <Field label="Message">
    <Control>
      <TextArea placeholder="Enter your message" rows={3} />
    </Control>
  </Field>
</>
```

### Modifier Classes

Bulma uses modifier classes that follow consistent patterns:

- **Color modifiers**: `is-primary`, `is-info`, `is-success`, `is-warning`, `is-danger`
- **Size modifiers**: `is-small`, `is-normal`, `is-medium`, `is-large`
- **State modifiers**: `is-loading`, `is-disabled`, `is-active`
- **Style modifiers**: `is-rounded`, `is-outlined`, `is-inverted`

### Combining Modifiers

Modifiers can be combined to create complex styling:

```html live
<button class="button is-primary is-large is-outlined is-rounded">
  Fancy Button
</button>
```

## React Component Mapping

This React library maps properties to Bulma classes, making it easier and more type-safe to work with Bulma in React applications.

### Property to Class Conversion

Instead of writing class names manually, you use React props:

```tsx live
<>
  <Block>
    <p>Instead of this HTML:</p>
    <button class="button is-primary is-large is-rounded is-loading">
      Loading
    </button>
  </Block>
  <Block>
    <p>You write this React:</p>
    <Button color="primary" size="large" rounded loading>
      Loading
    </Button>
  </Block>
</>
```

### Helper Classes Integration

The library integrates with Bulma's helper classes through the `useBulmaClasses` hook. You can apply spacing, colors, typography, and other utilities directly as props:

```tsx live
<>
  <Block>
    <p>Typography and spacing helpers</p>
    <Button color="primary" textSize="5" textWeight="bold" m="4" p="2">
      Styled Button
    </Button>
  </Block>

  <Block>
    <p>Flexbox helpers</p>
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      backgroundColor="dark"
      p="5"
    >
      <Button color="primary">Centered Button</Button>
    </Box>
  </Block>
</>
```

### Property Types and Mappings

#### Color and Background Color

Color properties map to Bulma's text and background color classes:

```tsx live
<>
  <Block>
    <Title>Text colors</Title>
    <Box>
      <Title color="primary">Primary text → has-text-primary</Title>
      <Title color="grey-dark">Dark grey text → has-text-grey-dark</Title>
    </Box>
  </Block>

  <Block>
    <Title>Background colors</Title>
    <Box backgroundColor="info" color="dark">
      Info background → has-background-info
    </Box>
    <Box backgroundColor="light" color="dark">
      Light background → has-background-light
    </Box>
  </Block>
</>
```

#### Spacing

Spacing properties use Bulma's spacing scale (0-6):

```tsx live
<>
  <Box m="4">All margins → m-4</Box>
  <Box mt="2" mb="3">
    Top/bottom → mt-2 mb-3
  </Box>{' '}
  <Box mx="auto">Centered → mx-auto </Box>
  <Box p="5">All padding → p-5</Box>
  <Box px="3" py="2">
    Horizontal/vertical → px-3 py-2
  </Box>
</>
```

#### Typography

Typography properties control text appearance:

```tsx live
<>
  <Box>
    <Title textSize="1" textAlign="centered" textWeight="bold">
      Large Centered Title
    </Title>
    <p>→ is-size-1 has-text-centered has-text-weight-bold</p>

    <Content textTransform="uppercase" fontFamily="monospace">
      <p>Uppercase monospace content → is-uppercase is-family-monospace</p>
    </Content>
  </Box>
</>
```

#### Visibility and Display

Control element visibility and display behavior:

```tsx live
<>
  <Block>
    <Title>Display utilities</Title>
    <Box display="flex">Flexbox container → is-flex</Box>
    <Box display="inline-block">Inline block → is-inline-block</Box>
  </Block>

  <Block>
    <Title>Visibility utilities</Title>
    <p>The box below does not appear, it is hidden</p>
    <Box visibility="hidden">Hidden content → is-hidden</Box>
    <p>The box below does not appear, it is present for screen readers</p>
    <Box visibility="sr-only">Screen reader only → is-sr-only</Box>
  </Block>
</>
```

#### Flexbox

Flexbox properties provide layout control:

```tsx live
<>
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
    alignItems="center"
  >
    <Content>
      → is-flex is-flex-direction-column is-justify-content-space-between
      is-align-items-center
    </Content>
    <Buttons>
      <Button>Top</Button>
      <Button>Bottom</Button>
    </Buttons>
  </Box>
</>
```

:::info

display="flex" → is-flex

flexDirection="column" → is-flex-direction-column

justifyContent="space-between" → is-justify-content-space-between

alignItems="center" → is-align-items-center

:::

#### Other Utilities

Additional helper properties for common use cases:

```tsx live
<>
  <Block>
    <p>Float utilities</p>
    <Box float="left">Float left → is-pulled-left</Box>
    <Box float="right">Float right → is-pulled-right</Box>
  </Block>

  <Block>
    <p>Overflow control</p>
    <Box overflow="clipped">Clipped overflow → is-clipped</Box>
  </Block>

  <Block>
    <p>Radius and Shadow</p>
    <Box radius="radiusless">No radius → is-radiusless</Box>
    <Box shadow="shadowless">No shadow → is-shadowless</Box>
  </Block>

  <Block>
    <p>Interactive states </p>
    <Box interaction="unselectable">No select → is-unselectable</Box>
    <Box interaction="clickable">Clickable → is-clickable</Box>
  </Block>
</>
```

### Responsive Properties

The `useBulmaClasses` hook provides **two ways** to apply responsive styles:

#### 1. Global Viewport Property (Legacy)

Use the `viewport` prop to apply a single viewport modifier to ALL properties that support it:

:::tip Test Responsive Behavior

Try resizing your browser window or using the responsive design mode in your browser's developer tools. The text alignment in the example below should be **right-aligned on mobile** (up to 768px width) but **left-aligned on tablet and larger** viewports.

:::

```tsx live
<Box textAlign="right" viewport="mobile" m="2">
  Mobile-specific styling → has-text-right-mobile
</Box>
```

#### 2. Viewport-Specific Properties (Recommended)

Use individual viewport properties to set **different values for each viewport**:

:::tip Test Viewport-Specific Properties

To see the responsive behavior in the example below, resize your browser window or use your browser's responsive design mode (F12 → Device Toolbar). Try these specific viewport widths:

- **Mobile**: 320px - 768px (text will be size 6, right-aligned)
- **Tablet**: 769px - 1023px (text will be size 3, left-aligned, and hidden on desktop!)
- **Desktop**: 1024px+ (element will be hidden)

:::

```tsx live
<>
  <Block>
    <Box
      textSizeMobile="6"
      textSizeTablet="3"
      textAlignMobile="right"
      textAlignTablet="left"
      visibilityDesktop="hidden"
      p="3"
    >
      This box demonstrates viewport-specific properties: different text sizes,
      alignment, and visibility per viewport. (Hidden on tablet!)
    </Box>
  </Block>
</>
```

Available breakpoints:

- `mobile`: up to 768px
- `tablet`: from 769px
- `desktop`: from 1024px
- `widescreen`: from 1216px
- `fullhd`: from 1408px

:::info Responsive Support

**Global Viewport Property** works with these properties:

- **Typography**: `textSize`, `textAlign`
- **Display**: `display`
- **Visibility**: `visibility` (only for `hidden`, not `sr-only`)

**Viewport-Specific Properties** available:

- **Text Size**: `textSizeMobile`, `textSizeTablet`, `textSizeDesktop`, `textSizeWidescreen`, `textSizeFullhd`
- **Text Alignment**: `textAlignMobile`, `textAlignTablet`, `textAlignDesktop`, `textAlignWidescreen`, `textAlignFullhd`
- **Visibility**: `visibilityMobile`, `visibilityTablet`, `visibilityDesktop`, `visibilityWidescreen`, `visibilityFullhd`
- **Display**: `displayMobile`, `displayTablet`, `displayDesktop`, `displayWidescreen`, `displayFullhd`

**Note**: The following properties do **not** support responsive variants in Bulma:

- **Text and Background Colors** (`color`, `backgroundColor`) - These classes do not exist in Bulma
- Spacing (`m`, `p`, `mt`, `mb`, etc.)
- Color shades (when `colorShade` is specified)
- Flexbox properties
- Most other helper classes

:::

### Component-Specific Properties

In addition to helper classes, each component has its own specific properties that map to Bulma modifiers:

```tsx live
<>
  <Block>
    <p>Button-specific properties</p>
    <Button color="primary" size="large" outlined rounded loading>
      Button Text
    </Button>
  </Block>

  <Block>
    <Field label="Input-specific properties">
      <Control>
        <Input
          type="email"
          placeholder="Email"
          color="success"
          size="medium"
          rounded
        />
      </Control>
    </Field>
  </Block>

  <Block>
    <p>Column-specific properties</p>
    <Column size="half" offset="one-quarter">
      <Notification color="primary">Column Content</Notification>
    </Column>
  </Block>
</>
```

**Component-Specific Properties in the examples above:**

- **Button**: `size`, `outlined`, `rounded`, `loading` (these are not available in `useBulmaClasses`)
- **Input**: `type`, `placeholder`, `size`, `rounded` (form-specific properties)
- **Column**: `size`, `offset` (grid layout properties)
- **Field**: `label` (form field property)

These properties are unique to each component and directly map to Bulma's component-specific modifier classes. For example, `<Button size="large" />` generates `class="button is-large"`.

:::info Component API Documentation

Each component has many additional specific properties beyond what's shown here. For a complete list of all available properties for any component, refer to the **API Documentation** section where each component's props, examples, and Bulma class mappings are thoroughly documented.

:::

## Advanced Usage

For more complex scenarios, you can combine the helper classes with custom CSS classes:

```tsx live
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
