---
title: Loading
sidebar_label: Loading
---

# Loading

## Overview

The `Loading` component provides a loading overlay with a spinner animation. It can be used as a full-page overlay or a container overlay to indicate loading states. Supports different sizes, color variants, optional cancel functionality, and custom loading messages.

:::info
The Loading component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Loading } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/extras.css';
```

---

## Props

| Prop               | Type                                                                      | Default | Description                                      |
| ------------------ | ------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `active`           | `boolean`                                                                 | `false` | Whether the loading overlay is visible.          |
| `isFullPage`       | `boolean`                                                                 | `false` | Cover the entire viewport.                       |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                      | —       | Size of the loading spinner.                     |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color variant for the spinner. Default is light grey. |
| `canCancel`        | `boolean`                                                                 | `false` | Show a cancel button and allow closing.          |
| `onCancel`         | `() => void`                                                              | —       | Callback when cancel is triggered.               |
| `children`         | `React.ReactNode`                                                         | —       | Content to display below the spinner.            |
| `className`        | `string`                                                                  | —       | Additional CSS classes.                          |
| `overlayClassName` | `string`                                                                  | —       | Additional classes for the overlay.              |
| `iconClassName`    | `string`                                                                  | —       | Additional classes for the spinner icon.         |
| ...                | All standard HTML and Bulma helper props                                  |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Loading

A simple loading overlay within a container.

```tsx live
function example() {
  return (
    <div
      style={{
        position: 'relative',
        height: '200px',
        border: '1px solid #dbdbdb',
        borderRadius: '4px',
      }}
    >
      <Loading active>Loading...</Loading>
      <div style={{ padding: '1rem' }}>
        <p>This content is behind the loading overlay.</p>
      </div>
    </div>
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
    <div
      style={{
        position: 'relative',
        height: '150px',
        border: '1px solid #dbdbdb',
        borderRadius: '4px',
      }}
    >
      <Loading active />
    </div>
  );
}
```

---

### Spinner Sizes

Loading with different spinner sizes.

```tsx live
function example() {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active size="small">
          Small
        </Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active>Default</Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active size="medium">
          Medium
        </Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active size="large">
          Large
        </Loading>
      </div>
    </div>
  );
}
```

---

### Spinner Colors

The spinner supports Bulma color variants. When no color is specified, the spinner defaults to a light grey matching the Buefy style.

```tsx live
function example() {
  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active>Default</Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active color="primary">Primary</Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active color="info">Info</Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active color="success">Success</Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active color="warning">Warning</Loading>
      </div>
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading active color="danger">Danger</Loading>
      </div>
    </div>
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
    <div>
      <div
        style={{
          position: 'relative',
          height: '200px',
          border: '1px solid #dbdbdb',
          borderRadius: '4px',
        }}
      >
        <Loading
          active={isLoading}
          canCancel
          onCancel={() => setIsLoading(false)}
        >
          Click cancel or press Escape
        </Loading>
        <div style={{ padding: '1rem' }}>
          <p>Content behind the overlay.</p>
        </div>
      </div>
      {!isLoading && (
        <Button
          color="primary"
          className="mt-4"
          onClick={() => setIsLoading(true)}
        >
          Show Loading
        </Button>
      )}
    </div>
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
    <div>
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
    </div>
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
    <div
      style={{
        position: 'relative',
        height: '150px',
        border: '1px solid #dbdbdb',
        borderRadius: '4px',
        padding: '1rem',
      }}
    >
      <Loading active={isLoading}>Loading data...</Loading>
      <p>Click the button to see the loading overlay.</p>
      <Button
        color="primary"
        onClick={handleClick}
        disabled={isLoading}
        className="mt-3"
      >
        Load Data
      </Button>
    </div>
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
