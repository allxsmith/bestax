---
title: Other Helpers
sidebar_label: Other Helpers
sidebar_position: 7
---

# Other Helpers

Bulma provides a collection of additional utility helpers that solve common CSS challenges and provide convenient styling shortcuts. These miscellaneous helpers are essential for fine-tuning layouts and addressing specific design requirements.

:::tip

Many of these helpers are available as direct props through the `useBulmaClasses` hook in bestax-bulma, providing a clean and type-safe way to apply these utility styles to any component in the library.

:::

## Float

The float helpers allow you to move elements to the left or right of their container. These are useful for creating simple layouts and aligning content within containers.

| Property        | Bulma Class       | CSS Property   |
| --------------- | ----------------- | -------------- |
| `float="left"`  | `is-pulled-left`  | `float: left`  |
| `float="right"` | `is-pulled-right` | `float: right` |

Float helpers are particularly useful for aligning elements within text content or creating simple two-column layouts.

### Float Examples

```tsx
import { Box, Button, Content, Card, Image } from '@allxsmith/bestax-bulma';

function FloatExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Float Left</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content>
            <Box
              float="left"
              backgroundColor="primary"
              color="white"
              p="3"
              mr="3"
              mb="2"
              style={{ width: '150px' }}
            >
              Floated Left
            </Box>
            This text flows around the floated element on the left. Lorem ipsum
            dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris.
          </Content>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Float Right</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content>
            <Box
              float="right"
              backgroundColor="info"
              color="white"
              p="3"
              ml="3"
              mb="2"
              style={{ width: '150px' }}
            >
              Floated Right
            </Box>
            This text flows around the floated element on the right. Lorem ipsum
            dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris.
          </Content>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>
            Practical Example: Article with Image
          </Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content>
            <Image
              src="https://bulma.io/assets/images/placeholders/256x256.png"
              alt="Article image"
              float="left"
              mr="3"
              mb="3"
              style={{ width: '128px', height: '128px' }}
            />
            <strong>Article Title:</strong> This is how you can create an
            article layout with a floating image. The image floats to the left
            while the text content flows around it naturally. This is a common
            pattern in blog posts, news articles, and content-heavy websites.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Content>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Clearfix

The clearfix helper fixes an element's floating children by clearing floats. This is essential when you have floating elements inside a container and need the container to properly wrap around them.

| Property          | Bulma Class   | CSS Property             |
| ----------------- | ------------- | ------------------------ |
| `clearfix={true}` | `is-clearfix` | Clears floating children |

The clearfix helper fixes an element's floating children by clearing floats. This is essential when you have floating elements inside a container and need the container to properly wrap around them.

### Clearfix Examples

```tsx
import { Box, Button, Content, Card } from '@allxsmith/bestax-bulma';

function ClearfixExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Without Clearfix</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            This container doesn't clear its floating children, so it collapses:
          </Content>
          <Box backgroundColor="danger" p="3" color="white">
            <Box float="left" backgroundColor="white" color="dark" p="2" mr="2">
              Float Left
            </Box>
            <Box float="right" backgroundColor="white" color="dark" p="2">
              Float Right
            </Box>
            {/* Container collapses because it doesn't clear floats */}
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>With Clearfix</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            This container properly contains its floating children:
          </Content>
          <Box backgroundColor="success" p="3" color="white" clearfix>
            <Box float="left" backgroundColor="white" color="dark" p="2" mr="2">
              Float Left
            </Box>
            <Box float="right" backgroundColor="white" color="dark" p="2">
              Float Right
            </Box>
            {/* Container properly wraps around floating children */}
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Overlay

The overlay helper completely covers the first positioned parent element. This is useful for creating modal backdrops, loading overlays, or image overlays.

| Property         | Bulma Class  | CSS Property                        |
| ---------------- | ------------ | ----------------------------------- |
| `overlay={true}` | `is-overlay` | Absolutely positioned full coverage |

:::warning Positioning Requirement

The overlay helper requires the parent element to have `position: relative`, `position: absolute`, or `position: fixed` to work correctly.

:::

### Overlay Examples

```tsx
import { Box, Button, Content, Card, Title } from '@allxsmith/bestax-bulma';

function OverlayExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Image Overlay</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box position="relative" style={{ height: '200px' }}>
            <Box
              style={{
                backgroundImage:
                  'url(https://bulma.io/assets/images/placeholders/640x480.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100%',
              }}
            />
            <Box
              overlay={true}
              backgroundColor="dark"
              style={{ opacity: 0.7 }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Title color="white" size="4" textAlign="centered">
                Overlay Content
              </Title>
            </Box>
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Loading Overlay</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box
            position="relative"
            backgroundColor="light"
            p="4"
            style={{ height: '150px' }}
          >
            <Content>
              <p>
                This is the main content that gets covered by the loading
                overlay.
              </p>
              <Button color="primary">Action Button</Button>
            </Content>

            <Box
              overlay={true}
              backgroundColor="white"
              style={{ opacity: 0.9 }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Content textAlign="centered">
                <Title size="5" mb="2">
                  Loading...
                </Title>
                <Content>Please wait while we process your request.</Content>
              </Content>
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Overflow

The overflow helper adds `overflow: hidden` to an element, which clips any content that extends beyond the element's boundaries.

| Property             | Bulma Class  | CSS Property       |
| -------------------- | ------------ | ------------------ |
| `overflow="clipped"` | `is-clipped` | `overflow: hidden` |

This is useful for preventing content from overflowing its container and creating clean, contained layouts.

### Overflow Examples

```tsx
import { Box, Content, Card } from '@allxsmith/bestax-bulma';

function OverflowExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Without Overflow Control</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box
            backgroundColor="danger"
            color="white"
            p="3"
            style={{ height: '100px', width: '200px' }}
          >
            This content is much longer than the container and will overflow
            beyond the boundaries, creating a messy layout that extends outside
            the defined area.
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>With Overflow Clipped</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box
            backgroundColor="success"
            color="white"
            p="3"
            overflow="clipped"
            style={{ height: '100px', width: '200px' }}
          >
            This content is much longer than the container but gets clipped
            cleanly at the boundaries, creating a neat and contained layout that
            doesn't extend outside the defined area.
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Border Radius

The radius helper removes any border radius from an element, making it completely square regardless of default styling.

| Property              | Bulma Class     | CSS Property       |
| --------------------- | --------------- | ------------------ |
| `radius="radiusless"` | `is-radiusless` | `border-radius: 0` |

This is particularly useful when you want to override default rounded corners on components like buttons, cards, or images.

### Border Radius Examples

```tsx
import { Box, Button, Card, Image } from '@allxsmith/bestax-bulma';

function BorderRadiusExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Default Rounded Elements</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <Button color="primary" mr="2" mb="2">
              Rounded Button
            </Button>
            <Box
              backgroundColor="info"
              color="white"
              p="3"
              mr="2"
              mb="2"
              style={{ borderRadius: '6px' }}
            >
              Rounded Box
            </Box>
            <Image
              src="https://bulma.io/assets/images/placeholders/128x128.png"
              alt="Rounded image"
              style={{ width: '64px', height: '64px', borderRadius: '8px' }}
            />
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Radiusless Elements</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <Button color="primary" radius="radiusless" mr="2" mb="2">
              Square Button
            </Button>
            <Box
              backgroundColor="info"
              color="white"
              p="3"
              mr="2"
              mb="2"
              radius="radiusless"
            >
              Square Box
            </Box>
            <Image
              src="https://bulma.io/assets/images/placeholders/128x128.png"
              alt="Square image"
              radius="radiusless"
              style={{ width: '64px', height: '64px' }}
            />
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Shadow

The shadow helper removes any box shadow from an element, creating a flat appearance.

| Property              | Bulma Class     | CSS Property       |
| --------------------- | --------------- | ------------------ |
| `shadow="shadowless"` | `is-shadowless` | `box-shadow: none` |

This is useful when you want to remove default shadows from components like cards, buttons, or other elevated elements.

### Shadow Examples

```tsx
import { Box, Button, Card } from '@allxsmith/bestax-bulma';

function ShadowExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Default Shadow Elements</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <Card mr="3" mb="3" style={{ width: '200px' }}>
              <Card.Content>
                <Content>Card with shadow</Content>
              </Card.Content>
            </Card>

            <Box
              backgroundColor="white"
              p="3"
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
              }}
            >
              Box with shadow
            </Box>
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Shadowless Elements</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <Card
              shadow="shadowless"
              mr="3"
              mb="3"
              style={{
                width: '200px',
                border: '1px solid #e8e8e8',
              }}
            >
              <Card.Content>
                <Content>Card without shadow</Content>
              </Card.Content>
            </Card>

            <Box
              backgroundColor="white"
              p="3"
              shadow="shadowless"
              style={{ border: '1px solid #e8e8e8' }}
            >
              Box without shadow
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Interaction

The interaction helpers control user interaction behavior with elements, particularly text selection and cursor appearance.

| Property                     | Bulma Class       | CSS Property                 |
| ---------------------------- | ----------------- | ---------------------------- |
| `interaction="unselectable"` | `is-unselectable` | `user-select: none`          |
| `interaction="clickable"`    | `is-clickable`    | `cursor: pointer !important` |

These helpers are useful for improving user experience by preventing unwanted text selection or indicating clickable elements.

### Interaction Examples

```tsx
import { Box, Content, Card, Button } from '@allxsmith/bestax-bulma';

function InteractionExamples() {
  return (
    <Box p="4">
      <Card mb="4">
        <Card.Header>
          <Card.Header.Title>Unselectable Text</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Try to select the text below - the first paragraph is unselectable:
          </Content>

          <Box
            backgroundColor="info"
            color="white"
            p="3"
            mb="3"
            interaction="unselectable"
          >
            This text cannot be selected by the user. This is useful for UI
            elements, labels, or decorative text that shouldn't be copyable.
          </Box>

          <Box backgroundColor="light" p="3">
            This text can be selected normally. Users can highlight and copy
            this content as they would expect with regular text.
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title>Clickable Elements</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            Hover over the elements below to see cursor changes:
          </Content>

          <Box display="flex" flexDirection="column" style={{ gap: '1rem' }}>
            <Box
              backgroundColor="primary"
              color="white"
              p="3"
              interaction="clickable"
              onClick={() => alert('Clicked!')}
            >
              This box shows a pointer cursor and is clickable
            </Box>

            <Box
              backgroundColor="success"
              color="white"
              p="3"
              interaction="clickable"
              interaction="unselectable"
              onClick={() => alert('Also clicked!')}
            >
              This box is both clickable and unselectable
            </Box>

            <Box backgroundColor="light" p="3">
              This box shows the default cursor (not clickable)
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Position Relative

The position relative helper applies `position: relative` to an element, which is essential for creating positioning contexts for absolutely positioned children.

| Property          | Bulma Class   | CSS Property         |
| ----------------- | ------------- | -------------------- |
| `relative={true}` | `is-relative` | `position: relative` |

The position relative helper applies `position: relative` to an element, which is essential for creating positioning contexts for absolutely positioned children.

### Position Relative Examples

````tsx
import { Box, Content, Card, Title } from '@allxsmith/bestax-bulma';

function PositionRelativeExamples() {
  return (
    <Box p="4">
      <Card>
        <Card.Header>
          <Card.Header.Title>Relative Positioning Context</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Content mb="3">
            The relative positioned container provides a context for absolutely
            positioned children:
          </Content>

          <Box
            relative
            backgroundColor="light"
            p="4"
            style={{ height: '200px', border: '2px dashed #ccc' }}
          >
            <Content>
              This container has position: relative
            </Content>
            <Box
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#ff5722',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '4px',
              }}
            >
              Absolutely positioned
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}

## Combined Usage Example

Here's a practical example showing how multiple other helpers can work together to create a sophisticated component:

```tsx
import {
  Box,
  Card,
  Title,
  Content,
  Button,
  Image,
} from '@allxsmith/bestax-bulma';

function CombinedHelpersExample() {
  return (
    <Box p="4">
      <Card>
        <Card.Header>
          <Card.Header.Title>
            Product Card with Multiple Helpers
          </Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <Box relative style={{ height: '300px' }}>
            {/* Product image */}
            <Image
              src="https://bulma.io/assets/images/placeholders/400x300.png"
              alt="Product"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
              }}
              radius="radiusless"
            />

            {/* Sale badge overlay */}
            <Box
              backgroundColor="danger"
              color="white"
              p="2"
              interaction="unselectable"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                borderRadius: '4px',
              }}
            >
              SALE
            </Box>

            {/* Product info */}
            <Box p="3" clearfix>
              <Title size="5" mb="2" interaction="unselectable">
                Premium Product
              </Title>

              <Content float="left" style={{ width: '60%' }} overflow="clipped">
                This is a detailed product description that might be quite long
                but will be clipped if it exceeds the container width.
              </Content>

              <Box float="right" textAlign="right">
                <Content mb="2" interaction="unselectable">
                  <strong>$99.99</strong>
                </Content>
                <Button
                  color="primary"
                  interaction="clickable"
                  shadow="shadowless"
                  radius="radiusless"
                >
                  Add to Cart
                </Button>
              </Box>
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
````

## Best Practices

:::tip Other Helpers Guidelines

1. **Use sparingly**: These helpers solve specific problems - don't overuse them
2. **Combine thoughtfully**: Many helpers work well together but consider the overall design
3. **Consider accessibility**: Some helpers like `unselectable` can impact accessibility
4. **Test interactions**: Always test clickable elements and overlays across different devices
5. **Use semantic markup**: Combine helpers with appropriate semantic HTML elements

:::

### Common Patterns

```tsx
// Modal backdrop
<Box overlay={true} backgroundColor="dark" style={{ opacity: 0.5 }} />

// Clickable card
<Card interaction="clickable" onClick={handleClick}>
  <Card.Content interaction="unselectable">
    Non-selectable content
  </Card.Content>
</Card>

// Image gallery item with positioning
<Box relative>
  <Image src="..." radius="radiusless" />
  <Box overlay={true} interaction="clickable" onClick={openLightbox} />
</Box>

// Floating action button
<Button
  color="primary"
  radius="radiusless"
  shadow="shadowless"
  style={{ position: 'fixed', bottom: '20px', right: '20px' }}
>
  +
</Button>

// Layout with floated sidebar and clearfix
<Box clearfix>
  <Box float="left" style={{ width: '200px' }}>
    Sidebar content
  </Box>
  <Box style={{ marginLeft: '220px' }}>
    Main content area
  </Box>
</Box>
```

:::tip Learn More

For detailed API information about available helper properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) - Complete helper property reference
- [Flexbox Helpers](/docs/guides/helpers/flex) - Flexbox layout utilities
- [Visibility Helpers](/docs/guides/helpers/visibility) - Display and visibility utilities
- [Typography Helpers](/docs/guides/helpers/typography) - Text styling utilities
- [Bulma Other Helpers Documentation](https://bulma.io/documentation/helpers/other-helpers/) - Official Bulma other helpers
