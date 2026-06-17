---
title: Loading
sidebar_label: Loading
---

# Loading

## Overview

The `Loading` component provides a loading overlay with a spinner animation. It can be used as a full-page overlay or a container overlay to indicate loading states. Supports different sizes, color variants, optional cancel functionality, and custom loading messages.

---

## Import

```tsx
import { Loading } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop               | Type                                                                            | Default | Description                                           |
| ------------------ | ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| `active`           | `boolean`                                                                       | `false` | Whether the loading overlay is visible.               |
| `isFullPage`       | `boolean`                                                                       | `false` | Cover the entire viewport.                            |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —       | Size of the loading spinner.                          |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color variant for the spinner. Default is light grey. |
| `canCancel`        | `boolean`                                                                       | `false` | Show a cancel button and allow closing.               |
| `onCancel`         | `() => void`                                                                    | —       | Callback when cancel is triggered.                    |
| `children`         | `React.ReactNode`                                                               | —       | Content to display below the spinner.                 |
| `className`        | `string`                                                                        | —       | Additional CSS classes.                               |
| `overlayClassName` | `string`                                                                        | —       | Additional classes for the overlay.                   |
| `iconClassName`    | `string`                                                                        | —       | Additional classes for the spinner icon.              |
| `indicator`        | `React.ReactNode`                                                               | —       | Custom loading indicator element.                     |
| `overlay`          | `'light'` \| `'dark'` \| `'opaque'`                                             | —       | Style of the loading overlay.                         |
| ...                | All standard HTML and Bulma helper props                                        |         | (See [Helper Props](../helpers/usebulmaclasses))      |

---

## Usage

### Basic Loading

A simple loading overlay within a container.

```tsx live
function example() {
  return (
    <Box relative style={{ minHeight: '300px' }}>
      <Loading active>Loading...</Loading>
      <Paragraph>This content is behind the loading overlay.</Paragraph>
    </Box>
  );
}
```

:::caution
The container must have `position: relative` for the loading overlay to position correctly within it.
:::

---

### Without Message

Loading overlay without a text message.

```tsx live
function example() {
  return (
    <Box relative style={{ height: '200px' }}>
      <Loading active />
    </Box>
  );
}
```

---

### Spinner Sizes

Loading with different spinner sizes.

```tsx live
function example() {
  return (
    <Columns>
      <Column>
        <Box relative style={{ height: '200px' }}>
          <Loading active size="small">
            Small
          </Loading>
        </Box>
      </Column>
      <Column>
        <Box relative style={{ height: '200px' }}>
          <Loading active>Default</Loading>
        </Box>
      </Column>
      <Column>
        <Box relative style={{ height: '200px' }}>
          <Loading active size="medium">
            Medium
          </Loading>
        </Box>
      </Column>
      <Column>
        <Box relative style={{ height: '200px' }}>
          <Loading active size="large">
            Large
          </Loading>
        </Box>
      </Column>
    </Columns>
  );
}
```

---

### Spinner Colors

The spinner supports Bulma color variants. When no color is specified, the spinner defaults to a light grey matching the Buefy style.

```tsx live
function example() {
  return (
    <Columns isMultiline>
      <Column size="4">
        <Box relative style={{ height: '150px' }}>
          <Loading active>Default</Loading>
        </Box>
      </Column>
      <Column size="4">
        <Box relative style={{ height: '150px' }}>
          <Loading active color="primary">
            Primary
          </Loading>
        </Box>
      </Column>
      <Column size="4">
        <Box relative style={{ height: '150px' }}>
          <Loading active color="info">
            Info
          </Loading>
        </Box>
      </Column>
      <Column size="4">
        <Box relative style={{ height: '150px' }}>
          <Loading active color="success">
            Success
          </Loading>
        </Box>
      </Column>
      <Column size="4">
        <Box relative style={{ height: '150px' }}>
          <Loading active color="warning">
            Warning
          </Loading>
        </Box>
      </Column>
      <Column size="4">
        <Box relative style={{ height: '150px' }}>
          <Loading active color="danger">
            Danger
          </Loading>
        </Box>
      </Column>
    </Columns>
  );
}
```

---

### With Cancel Button

Loading overlay that can be cancelled.

```tsx live
function example() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <Box relative style={{ height: '200px' }}>
        <Loading
          active={isLoading}
          canCancel
          onCancel={() => setIsLoading(false)}
        >
          Click cancel or press Escape
        </Loading>
        <Paragraph p="4">Content behind the overlay.</Paragraph>
      </Box>
      {!isLoading && (
        <Button color="primary" mt="4" onClick={() => setIsLoading(true)}>
          Show Loading
        </Button>
      )}
    </>
  );
}
```

---

### Full Page Loading

A full-page loading overlay that covers the entire viewport.

```tsx live
function example() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Button color="primary" onClick={() => setIsLoading(true)}>
        Show Full Page Loading
      </Button>
      <Loading
        active={isLoading}
        isFullPage
        canCancel
        onCancel={() => setIsLoading(false)}
      >
        Full page loading... Click cancel or press Escape
      </Loading>
    </>
  );
}
```

:::tip
When `isFullPage` is true and the loading is active, body scroll is automatically disabled.
:::

---

### Triggered by Button

Common pattern where loading is triggered by a button action.

```tsx live
function example() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Simulate async operation
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <Box relative p="5" style={{ height: '150px' }}>
      <Loading active={isLoading}>Loading data...</Loading>
      <Paragraph>Click the button to see the loading overlay.</Paragraph>
      <Button color="primary" onClick={handleClick} disabled={isLoading} mt="3">
        Load Data
      </Button>
    </Box>
  );
}
```

---

## Cancel Methods

When `canCancel` is true, the loading can be cancelled by:

1. **Clicking the Cancel button** - A button appears below the spinner
2. **Pressing the Escape key** - Keyboard shortcut for accessibility
3. **Clicking the overlay** - Clicking the semi-transparent background

---

## Accessibility

- Uses `role="alert"` to announce loading state to screen readers
- Has `aria-busy="true"` to indicate loading status
- Has `aria-label="Loading"` for the loading container
- Cancel button has proper `aria-label` for accessibility
- Escape key support for cancelling (when `canCancel` is true)

---

## Related

- [Skeleton](../elements/skeleton.md) - Placeholder loading states
- [Progress](../elements/progress.md) - Progress bar component
