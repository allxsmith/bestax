---
title: Loading
sidebar_label: Loading
description: The `Loading` component provides a loading overlay with a spinner animation.
---

# Loading

## Overview

<!-- bestax:generated overview -->

The `Loading` component provides a loading overlay with a spinner animation.

<!-- /bestax:generated overview -->

It can be used as a full-page overlay or a container overlay to indicate loading states. Supports different sizes, color variants, optional cancel functionality, and custom loading messages.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Loading } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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

## Related

- [Skeleton](../elements/skeleton.md) - Placeholder loading states
- [Progress](../elements/progress.md) - Progress bar component

---

## Accessibility

- Uses `role="alert"` to announce loading state to screen readers
- Has `aria-busy="true"` to indicate loading status
- Has `aria-label="Loading"` for the loading container
- Cancel button has proper `aria-label` for accessibility
- Escape key support for cancelling (when `canCancel` is true)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                            | Default | Description                                           |
| ------------------ | ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| `active`           | `boolean`                                                                       | `false` | Whether the loading overlay is visible.               |
| `isFullPage`       | `boolean`                                                                       | `false` | Cover the entire viewport.                            |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —       | Size of the loading spinner.                          |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color variant for the spinner. Default is light grey. |
| `canCancel`        | `boolean`                                                                       | `false` | Show a cancel button and allow closing.               |
| `onCancel`         | `() => void`                                                                    | —       | Callback when cancel is triggered.                    |
| `overlayClassName` | `string`                                                                        | —       | Additional classes for the overlay.                   |
| `iconClassName`    | `string`                                                                        | —       | Additional classes for the spinner icon.              |
| `indicator`        | `React.ReactNode`                                                               | —       | Custom loading indicator element.                     |
| `overlay`          | `'light'` \| `'dark'` \| `'opaque'`                                             | —       | Style of the loading overlay.                         |
| `children`         | `React.ReactNode`                                                               | —       | Content to display below the spinner.                 |
| `className`        | `string`                                                                        | —       | Additional CSS classes.                               |
| `...`              | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)     |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Loading` registers these variables on its own `.loading` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                | Sass Variable                        | Default                    |
| ------------------------------------------- | ------------------------------------ | -------------------------- |
| `--bulma-loading-overlay-background`        | `$loading-overlay-background`        | `var(--bulma-scheme-main)` |
| `--bulma-loading-overlay-opacity`           | `$loading-overlay-opacity`           | `0.7`                      |
| `--bulma-loading-overlay-fullpage-opacity`  | `$loading-overlay-fullpage-opacity`  | `0.8`                      |
| `--bulma-loading-overlay-opacity-light`     | `$loading-overlay-opacity-light`     | `0.4`                      |
| `--bulma-loading-overlay-opacity-dark`      | `$loading-overlay-opacity-dark`      | `0.85`                     |
| `--bulma-loading-overlay-opacity-opaque`    | `$loading-overlay-opacity-opaque`    | `1`                        |
| `--bulma-loading-icon-size`                 | `$loading-icon-size`                 | `4.5em`                    |
| `--bulma-loading-icon-size-small`           | `$loading-icon-size-small`           | `3em`                      |
| `--bulma-loading-icon-size-medium`          | `$loading-icon-size-medium`          | `6em`                      |
| `--bulma-loading-icon-size-large`           | `$loading-icon-size-large`           | `7.5em`                    |
| `--bulma-loading-icon-border-width`         | `$loading-icon-border-width`         | `0.25em`                   |
| `--bulma-loading-icon-border-width-small`   | `$loading-icon-border-width-small`   | `0.2em`                    |
| `--bulma-loading-icon-border-width-medium`  | `$loading-icon-border-width-medium`  | `0.3em`                    |
| `--bulma-loading-icon-border-width-large`   | `$loading-icon-border-width-large`   | `0.375em`                  |
| `--bulma-loading-icon-spin-color`           | `$loading-icon-spin-color`           | `var(--bulma-grey-light)`  |
| `--bulma-loading-text-color`                | `$loading-text-color`                | `var(--bulma-text)`        |
| `--bulma-loading-text-size`                 | `$loading-text-size`                 | `var(--bulma-size-normal)` |
| `--bulma-loading-content-gap`               | `$loading-content-gap`               | `1rem`                     |
| `--bulma-loading-cancel-color`              | `$loading-cancel-color`              | `var(--bulma-text-light)`  |
| `--bulma-loading-cancel-border-color`       | `$loading-cancel-border-color`       | `var(--bulma-border)`      |
| `--bulma-loading-cancel-background`         | `$loading-cancel-background`         | `var(--bulma-scheme-main)` |
| `--bulma-loading-cancel-hover-color`        | `$loading-cancel-hover-color`        | `var(--bulma-text)`        |
| `--bulma-loading-cancel-hover-border-color` | `$loading-cancel-hover-border-color` | `var(--bulma-text-light)`  |
| `--bulma-loading-cancel-radius`             | `$loading-cancel-radius`             | `var(--bulma-radius)`      |
| `--bulma-loading-cancel-size`               | `$loading-cancel-size`               | `var(--bulma-size-small)`  |
| `--bulma-loading-animation-duration`        | `$loading-animation-duration`        | `0.75s`                    |

<!-- /bestax:generated cssvars -->
