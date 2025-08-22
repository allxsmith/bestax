---
title: Visibility
sidebar_label: Visibility
sidebar_position: 5
---

# Visibility

Bulma provides comprehensive visibility helpers to control how elements are displayed and hidden across different screen sizes and contexts. These utilities are essential for responsive design and accessibility.

:::tip

All components in bestax-bulma have access to these visibility properties through the `useBulmaClasses` hook. You can apply visibility properties to any component in the library.

:::

## Display

Control the CSS display property using the `display` prop or viewport-specific display properties. This determines how an element is displayed in the document flow.

### Basic Display Properties

| Property                 | Bulma Class       | Description                                |
| ------------------------ | ----------------- | ------------------------------------------ |
| `display="block"`        | `is-block`        | Block-level element (full width, new line) |
| `display="flex"`         | `is-flex`         | Flexbox container                          |
| `display="inline"`       | `is-inline`       | Inline element (flows with text)           |
| `display="inline-block"` | `is-inline-block` | Inline element that can have width/height  |
| `display="inline-flex"`  | `is-inline-flex`  | Inline flexbox container                   |
| `display="none"`         | `is-hidden`       | Element is completely hidden               |

### Viewport-Specific Display Properties

For responsive layouts requiring different display types across viewports, use the viewport-specific display properties:

| Property            | Bulma Class Pattern       | Target Viewport  | Description                     |
| ------------------- | ------------------------- | ---------------- | ------------------------------- |
| `displayMobile`     | `is-{display}-mobile`     | Up to 768px      | Display type on mobile devices  |
| `displayTablet`     | `is-{display}-tablet`     | 769px - 1023px   | Display type on tablet devices  |
| `displayDesktop`    | `is-{display}-desktop`    | 1024px - 1215px  | Display type on desktop screens |
| `displayWidescreen` | `is-{display}-widescreen` | 1216px - 1407px  | Display type on widescreen      |
| `displayFullhd`     | `is-{display}-fullhd`     | 1408px and above | Display type on fullHD+         |

**Example:** `displayMobile="flex"` generates `is-flex-mobile`, `displayDesktop="none"` generates `is-hidden-desktop`

:::tip

Use viewport-specific display properties when you need different display behaviors across multiple screen sizes. The generic `display` + `viewport` pattern only supports one viewport combination at a time.

:::

### Display Examples

```tsx
import { Box, Button, Content } from '@allxsmith/bestax-bulma';

function DisplayExamples() {
  return (
    <Box p="4">
      <Content mb="4">
        <strong>Block Display:</strong> Takes full width and starts on a new
        line
      </Content>
      <Box display="block" backgroundColor="primary" color="white" p="2" mb="3">
        Block element
      </Box>

      <Content mb="4">
        <strong>Inline Display:</strong> Flows with the text content
      </Content>
      <p>
        Here is some text with an
        <Box display="inline" backgroundColor="info" color="white" px="2">
          inline element
        </Box>
        in the middle of the sentence.
      </p>

      <Content mb="4" mt="4">
        <strong>Inline-block Display:</strong> Inline but can have dimensions
      </Content>
      <p>
        Text with
        <Box
          display="inline-block"
          backgroundColor="success"
          color="white"
          p="2"
          mr="1"
        >
          inline-block
        </Box>
        elements that can have padding and margins.
      </p>

      <Content mb="4" mt="4">
        <strong>Flex Display:</strong> Creates a flex container
      </Content>
      <Box display="flex" gap="3" mb="3">
        <Button color="primary">Flex Item 1</Button>
        <Button color="info">Flex Item 2</Button>
        <Button color="success">Flex Item 3</Button>
      </Box>

      <Content mb="4">
        <strong>Inline-flex Display:</strong> Inline flex container
      </Content>
      <p>
        Text with
        <Box display="inline-flex" gap="2">
          <Button size="small" color="warning">
            A
          </Button>
          <Button size="small" color="danger">
            B
          </Button>
        </Box>
        inline flex elements.
      </p>
    </Box>
  );
}
```

### Viewport-Specific Display Examples

```tsx
import { Box, Notification, Button } from '@allxsmith/bestax-bulma';

function ViewportDisplayExamples() {
  return (
    <Box p="4">
      <Notification color="info" mb="4">
        Resize your browser window to see elements change their display type at
        different screen sizes.
      </Notification>

      <Content mb="4">
        <strong>Progressive Display Changes:</strong> Different display types
        across viewports
      </Content>
      <Box
        displayMobile="block"
        displayTablet="inline-block"
        displayDesktop="flex"
        backgroundColor="primary"
        color="white"
        p="3"
        mb="3"
        gap="2"
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '0.5rem',
            flex: 1,
          }}
        >
          Mobile: block | Tablet: inline-block | Desktop+: flex
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '0.5rem',
            flex: 1,
          }}
        >
          Item 2 (flex layout on desktop+)
        </div>
      </Box>

      <Content mb="4">
        <strong>Mobile Hidden, Desktop Visible:</strong> Show/hide across
        viewports
      </Content>
      <Box
        displayMobile="none"
        displayDesktop="block"
        backgroundColor="success"
        color="white"
        p="3"
        mb="3"
      >
        📱 Hidden on mobile/tablet, visible on desktop and larger
      </Box>

      <Content mb="4">
        <strong>Responsive Flex Layout:</strong> Block on mobile, flex on larger
        screens
      </Content>
      <Box
        displayMobile="block"
        displayTablet="flex"
        backgroundColor="warning"
        color="black"
        p="3"
        mb="3"
        gap="2"
      >
        <div
          style={{ background: 'rgba(0,0,0,0.1)', padding: '0.5rem', flex: 1 }}
        >
          Stacked on mobile
        </div>
        <div
          style={{ background: 'rgba(0,0,0,0.1)', padding: '0.5rem', flex: 1 }}
        >
          Side-by-side on tablet+
        </div>
        <div
          style={{ background: 'rgba(0,0,0,0.1)', padding: '0.5rem', flex: 1 }}
        >
          Responsive layout
        </div>
      </Box>
    </Box>
  );
}
```

## Show/Hide Elements

Control element visibility across different screen sizes using responsive display helpers. You can show or hide elements on specific viewports using either the generic pattern or viewport-specific properties.

### Generic Display + Viewport Pattern

For simple show/hide scenarios affecting a single viewport, use the `display` + `viewport` combination:

```tsx
// Show only on desktop and larger
<Box display="block" viewport="desktop">Desktop+ only content</Box>

// Hide only on mobile
<Box display="none" viewport="mobile">Hidden on mobile</Box>
```

:::warning Limitation

The generic `display` + `viewport` pattern only supports **one viewport combination** at a time. You cannot chain multiple display/viewport pairs on the same element.

:::

### Viewport-Specific Properties (Recommended)

For complex responsive behavior requiring different display types across multiple viewports, use the viewport-specific display properties:

```tsx
// Hide on mobile, show as block on tablet, flex on desktop+
<Box displayMobile="none" displayTablet="block" displayDesktop="flex">
  Complex responsive element
</Box>
```

## Choosing the Right Approach

### When to Use Generic Display + Viewport

✅ **Use when you need simple single-viewport control:**

```tsx
// Simple: Hide only on mobile
<Box display="none" viewport="mobile">Hidden on mobile only</Box>

// Simple: Show only on desktop+
<Box display="block" viewport="desktop">Desktop and up only</Box>
```

### When to Use Viewport-Specific Properties

✅ **Use when you need multiple viewport behaviors:**

```tsx
// Complex: Different displays across multiple viewports
<Box
  displayMobile="none"        // Hidden on mobile
  displayTablet="block"       // Block on tablet
  displayDesktop="flex"       // Flex on desktop
  displayWidescreen="grid"    // Grid on widescreen (if supported)
>
  Multi-viewport responsive element
</Box>

// Complex: Progressive enhancement
<Box
  displayMobile="block"       // Stacked on mobile
  displayTablet="inline-block" // Inline blocks on tablet
  displayDesktop="flex"       // Flex layout on desktop+
>
  Progressive layout enhancement
</Box>
```

:::info Precedence Rule

When both patterns are used together, **viewport-specific properties take precedence** over the generic `display` + `viewport` combination.

```tsx
<Box
  display="block"
  viewport="mobile"
  displayMobile="flex" // This wins!
>
  Will be flex on mobile, not block
</Box>
```

:::

### Responsive Show/Hide Examples

```tsx
import { Box, Notification, Button } from '@allxsmith/bestax-bulma';

function ResponsiveShowHideExamples() {
  return (
    <Box p="4">
      <Notification color="info" mb="4">
        Resize your browser window to see elements appear and disappear at
        different screen sizes.
      </Notification>

      <Content mb="4">
        <strong>Mobile Only:</strong> Visible only on mobile devices
      </Content>
      <Box
        displayMobile="block"
        displayTablet="none"
        backgroundColor="primary"
        color="white"
        p="3"
        mb="3"
      >
        📱 Visible only on mobile (up to 768px)
      </Box>

      <Content mb="4">
        <strong>Tablet Only:</strong> Visible only on tablet devices
      </Content>
      <Box
        displayMobile="none"
        displayTablet="block"
        displayDesktop="none"
        backgroundColor="info"
        color="white"
        p="3"
        mb="3"
      >
        📱 Visible only on tablet (769px - 1023px)
      </Box>

      <Content mb="4">
        <strong>Desktop Only:</strong> Visible only on desktop screens
      </Content>
      <Box
        displayMobile="none"
        displayTablet="none"
        displayDesktop="block"
        displayWidescreen="none"
        backgroundColor="success"
        color="white"
        p="3"
        mb="3"
      >
        💻 Visible only on desktop (1024px - 1215px)
      </Box>

      <Content mb="4">
        <strong>Widescreen Only:</strong> Visible only on widescreen displays
      </Content>
      <Box
        displayDesktop="none"
        displayWidescreen="block"
        displayFullhd="none"
        backgroundColor="warning"
        color="black"
        p="3"
        mb="3"
      >
        🖥️ Visible only on widescreen (1216px - 1407px)
      </Box>

      <Content mb="4">
        <strong>FullHD Only:</strong> Visible only on fullHD displays
      </Content>
      <Box
        displayWidescreen="none"
        displayFullhd="block"
        backgroundColor="danger"
        color="white"
        p="3"
        mb="3"
      >
        🖥️ Visible only on fullHD (1408px and above)
      </Box>

      <Content mb="4">
        <strong>Show from Breakpoint Up:</strong> Hidden on mobile, visible from
        tablet and up
      </Content>
      <Box
        displayMobile="none"
        displayTablet="block"
        backgroundColor="grey"
        color="white"
        p="3"
        mb="3"
      >
        📱→🖥️ Hidden on mobile, visible from tablet and up
      </Box>

      <Content mb="4">
        <strong>Show up to Breakpoint:</strong> Visible on mobile and tablet,
        hidden from desktop up
      </Content>
      <Box
        displayMobile="block"
        displayTablet="block"
        displayDesktop="none"
        backgroundColor="black"
        color="white"
        p="3"
      >
        📱📱 Visible on mobile and tablet, hidden from desktop up
      </Box>
    </Box>
  );
}
```

## Hide

Control element hiding across different screen sizes using the `visibility` prop or viewport-specific display properties. This is useful for responsive design where you want to hide content on specific screen sizes.

### Hide Examples

```tsx
import { Box, Card, Title, Content, Button } from '@allxsmith/bestax-bulma';

function HideExamples() {
  return (
    <Box p="4">
      <Title size="4" mb="4">
        Responsive Hide Examples
      </Title>

      <Card mb="4">
        <Card.Content>
          <Title size="5" mb="3">
            Navigation Menu
          </Title>

          {/* Desktop navigation - hidden on mobile */}
          <Box displayMobile="none" displayTablet="flex" gap="3" mb="3">
            <Button variant="text">Home</Button>
            <Button variant="text">About</Button>
            <Button variant="text">Services</Button>
            <Button variant="text">Contact</Button>
          </Box>

          {/* Mobile menu button - hidden on tablet+ */}
          <Button displayMobile="block" displayTablet="none" color="primary">
            ☰ Menu
          </Button>

          <Content>
            This demonstrates a responsive navigation where full menu links are
            shown on larger screens, but only a menu button is shown on mobile.
          </Content>
        </Card.Content>
      </Card>

      <Card mb="4">
        <Card.Content>
          <Title size="5" mb="3">
            Content Layout
          </Title>

          <Box display="flex" gap="4">
            <Box style={{ flex: 1 }}>
              <Content>
                This is the main content area that's always visible.
              </Content>
            </Box>

            {/* Sidebar hidden on mobile */}
            <Box
              displayMobile="none"
              displayTablet="block"
              backgroundColor="light"
              p="3"
              style={{ width: '200px' }}
            >
              <Title size="6" mb="2">
                Sidebar
              </Title>
              <Content textSize="7">
                This sidebar is hidden on mobile devices but visible on tablet
                and larger screens.
              </Content>
            </Box>
          </Box>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <Title size="5" mb="3">
            Progressive Content Reveal
          </Title>

          <Content mb="3">
            Basic information visible on all screen sizes.
          </Content>

          {/* Additional details hidden on mobile */}
          <Box
            displayMobile="none"
            displayTablet="block"
            backgroundColor="info"
            color="white"
            p="3"
            mb="3"
          >
            Additional details visible on tablet and larger screens.
          </Box>

          {/* Extended content hidden on mobile and tablet */}
          <Box
            displayMobile="none"
            displayTablet="none"
            displayDesktop="block"
            backgroundColor="success"
            color="white"
            p="3"
          >
            Extended content only visible on desktop and larger screens.
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Other Visibility Properties

Additional visibility utilities for specific use cases.

| Property                 | Bulma Class    | Description                               |
| ------------------------ | -------------- | ----------------------------------------- |
| `visibility="hidden"`    | `is-hidden`    | Element is not visible but takes up space |
| `visibility="sr-only"`   | `is-sr-only`   | Only visible to screen readers            |
| `visibility="invisible"` | `is-invisible` | Element is invisible but takes up space   |

### Other Visibility Examples

```tsx
import { Box, Button, Content, Icon } from '@allxsmith/bestax-bulma';

function OtherVisibilityExamples() {
  return (
    <Box p="4">
      <Title size="4" mb="4">
        Other Visibility Properties
      </Title>

      <Content mb="4">
        <strong>Hidden vs Invisible:</strong> Both make elements not visible,
        but they still take up space in the layout.
      </Content>

      <Box display="flex" gap="3" mb="4">
        <Button color="primary">Visible Button</Button>
        <Button visibility="hidden" color="info">
          Hidden Button
        </Button>
        <Button color="success">Another Visible Button</Button>
      </Box>

      <Box display="flex" gap="3" mb="4">
        <Button color="primary">Visible Button</Button>
        <Button visibility="invisible" color="warning">
          Invisible Button
        </Button>
        <Button color="danger">Another Visible Button</Button>
      </Box>

      <Content mb="4">
        <strong>Screen Reader Only:</strong> Content that's only accessible to
        screen readers for better accessibility.
      </Content>

      <Box>
        <Icon name="star" ariaLabel="Star rating" />
        <span visibility="sr-only">This product has a 5-star rating</span>
        <Icon name="star" ariaLabel="Star rating" />
        <span visibility="sr-only">out of 5 stars</span>
        <Icon name="star" ariaLabel="Star rating" />
      </Box>

      <Content mt="4" textSize="7" color="grey">
        The text between the stars is only visible to screen readers, providing
        context for users with visual impairments.
      </Content>
    </Box>
  );
}
```

## Accessibility Considerations

:::info

When hiding content, consider the accessibility implications:

- **`visibility="hidden"`**: Content is not visible and not accessible to screen readers
- **`visibility="sr-only"`**: Content is only accessible to screen readers - use this for important context
- **`display="none"`**: Content is completely removed from the document flow and accessibility tree

:::

### Accessible Hide/Show Example

```tsx
import { Box, Button, Card, Content } from '@allxsmith/bestax-bulma';
import { useState } from 'react';

function AccessibleToggleExample() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box p="4">
      <Card>
        <Card.Content>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="3"
          >
            <Title size="5">Expandable Content</Title>
            <Button
              color="primary"
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              ariaExpanded={isExpanded}
              ariaControls="expandable-content"
            >
              {isExpanded ? 'Hide' : 'Show'} Details
            </Button>
          </Box>

          <Content>
            This is always visible content that provides context.
          </Content>

          {/* Screen reader announcement */}
          <span visibility="sr-only">
            {isExpanded
              ? 'Additional details are now visible'
              : 'Additional details are hidden'}
          </span>

          {/* Expandable content */}
          <Box
            id="expandable-content"
            display={isExpanded ? 'block' : 'none'}
            mt="3"
            backgroundColor="light"
            p="3"
          >
            <Content>
              This additional content can be toggled on and off. The
              implementation ensures that screen readers are properly informed
              about the state changes.
            </Content>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

## Mobile-First Responsive Design

:::tip Best Practice

Use a mobile-first approach where you design for mobile by default, then progressively enhance for larger screens using viewport-specific display helpers.

:::

```tsx
import { Box, Card, Title, Content, Button } from '@allxsmith/bestax-bulma';

function MobileFirstExample() {
  return (
    <Box p="4">
      <Card>
        <Card.Content>
          {/* Mobile layout by default */}
          <Title size="4" textAlign="centered" mb="4">
            Mobile-First Design
          </Title>

          {/* Stack vertically on mobile, horizontal on tablet+ */}
          <Box displayMobile="block" displayTablet="flex" gap="4">
            <Box style={{ flex: 1 }}>
              <Content>
                This content stacks vertically on mobile and displays
                horizontally on tablet and larger screens.
              </Content>
            </Box>

            <Box style={{ flex: 1 }}>
              <Content>
                The spacing and layout automatically adapts to different screen
                sizes using viewport-specific display utilities.
              </Content>
            </Box>
          </Box>

          {/* Simple mobile menu, complex desktop menu */}
          <Box mt="4">
            {/* Mobile: Simple button */}
            <Button
              displayMobile="block"
              displayTablet="none"
              color="primary"
              fullWidth
            >
              Mobile Actions
            </Button>

            {/* Desktop: Multiple buttons */}
            <Box
              displayMobile="none"
              displayTablet="flex"
              gap="2"
              justifyContent="center"
            >
              <Button color="primary">Save</Button>
              <Button color="info">Edit</Button>
              <Button color="warning">Share</Button>
              <Button variant="outlined">Cancel</Button>
            </Box>
          </Box>

          {/* Progressive content enhancement */}
          <Box mt="4">
            <Content>Basic content visible on all devices.</Content>

            <Box
              displayMobile="none"
              displayTablet="block"
              backgroundColor="light"
              p="3"
              mt="2"
            >
              <Content textSize="7">
                Enhanced content for tablet and larger screens with additional
                context and details.
              </Content>
            </Box>

            <Box
              displayMobile="none"
              displayDesktop="block"
              backgroundColor="primary"
              color="white"
              p="3"
              mt="2"
            >
              <Content textSize="7">
                Premium content only shown on desktop and larger screens where
                there's ample space.
              </Content>
            </Box>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );
}
```

:::tip Learn More

For detailed API information about visibility properties, see the [useBulmaClasses API documentation](/docs/api/helpers/usebulmaclasses).

:::

## See Also

- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) - Complete visibility property reference
- [Responsive Design](/docs/guides/getting-started/responsiveness) - Responsive design principles

<!--
- [Flexbox Helpers](/docs/guides/helpers/flex) - Flex display and layout utilities
- [Display Utilities](/docs/api/helpers/display) - Additional display helper utilities
-->

- [Bulma Visibility Documentation](https://bulma.io/documentation/helpers/visibility-helpers/) - Official Bulma visibility helpers
