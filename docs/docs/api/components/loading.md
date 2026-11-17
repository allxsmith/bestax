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
The container must have `position: relative` for the loading overlay to position correctly within it. Render the loading directly inside that container too: while it's active, the container's other children are what it makes inert.
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

The spinner supports Bulma color variants. When no color is specified, the spinner is Bulma's `grey-light`.

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

Loading overlay that can be cancelled. The button says "Cancel" and is named "Cancel loading" for screen readers; `cancelText` gives it words of your own, such as ones in your app's language, and then it's named by them.

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
When `isFullPage` is true and the loading is active, the page doesn't scroll under it. The lock is ref-counted and shared with [`Modal`](./modal.md#accessibility), `Dialog` and `Sidebar`, so dismissing the loader doesn't unlock the page underneath an overlay that is still open.
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

- While it's active, what it covers is inert: Tab, Enter and Space don't reach it and screen readers skip it, just as a click lands on the overlay instead. A loading inside a container makes the container's other children inert, and a full-page one makes the rest of the page inert, as a modal does. Its own content, the cancel button included, stays reachable
- A control under the overlay that had focus when the loading started loses it, since nothing inert can hold focus. It gets focus back when the loading goes away, unless focus has moved on in the meantime. So keep a field someone is typing in, such as the search box whose input starts the load, outside the container the loading covers
- It makes inert what's there when it turns on, so an element that mounts beside it later isn't. Anything that was inert already is still inert once the loading goes away
- Show one loading at a time over the same content. Two that cover each other, such as two in one container or two full-page ones, make each other inert, cancel buttons and all, so only Escape is left to cancel one of them
- Uses `role="alert"` to announce loading state to screen readers
- Has `aria-busy="true"` to indicate loading status
- Has `aria-label="Loading"` for the loading container. An `aria-label` you pass replaces it, such as one in the page's language
- The cancel button shows "Cancel" and is named "Cancel loading". `cancelText` gives it words of your own, such as ones in the page's language, and then it's named by them, so a screen reader says, and voice control answers to, what it shows
- Escape key support for cancelling (when `canCancel` is true). An Escape that closed a popup on the page, such as a Dropdown menu or a date picker's calendar, doesn't cancel
- A full-page loading takes its turn for Escape with [Modal](./modal.md), [Dialog](./dialog.md) and [Sidebar](./sidebar.md), since it covers them: one Escape goes to whichever opened last. Shown over an open Modal, it cancels on the first Escape and the Modal closes on the next. While it's on top, even when it can't be cancelled, the Modal under it doesn't close on Escape or hold Tab
- A loading inside a container covers only that container, so it cancels on Escape once no Modal, Dialog, Sidebar or full-page loading is open
- Loading takes Bulma's colors. The spinner is `grey-light` with no `color`, and the color itself with one. The Cancel button's label is `text-light`, and under the pointer its label is `text` and its border `text-light`. On a light page, against the page's color, which `overlay="opaque"` draws the overlay in, `grey-light` and some of the colors fall short of the 3:1 that WCAG 1.4.11 asks of a graphic, and `text-light` falls well short of the 4.5:1 a label needs. For more, set `--bulma-loading-icon-spin-color`, `--bulma-loading-cancel-color` and `--bulma-loading-cancel-hover-border-color` to colors such as `var(--bulma-text-weak)`, `var(--bulma-text)` and `var(--bulma-border-hover)` on a class you pass through `className`, with the loading's class in the selector (`.loading.my-loading`, `.bestax-loading.my-loading` under the prefixed flavor) so it wins whatever order the stylesheets load in. A `color` sets the spinner's on a rule of the same weight, so for a colored spinner pick a `color` that reads on your page. A see-through overlay lets what it covers show around the spinner, so over content that isn't the page's color, `overlay="opaque"` keeps the spinner on the page's color
- In forced colors (Windows' contrast themes), the spinner is drawn as a ring in the theme's text color with its top side open, since forced colors drops the gradient it's normally drawn with. The overlay turns solid there, whatever `overlay` is set to, so the page beneath doesn't show through behind the ring or the text. A custom `indicator` is your own content, so it's up to you that it shows there too
- A line of its text wraps only once it's wider than the overlay, a word longer than the overlay too, rather than running off its sides, which on a narrow screen or at a high browser zoom a full-page loading can't be scrolled to show

---

## Related

- [Loader](../elements/loader.md) - A small inline spinner, with no overlay
- [Skeleton](../elements/skeleton.md) - Placeholder loading states
- [Progress](../elements/progress.md) - Progress bar component

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `active`           | `boolean`                                                                       | `false` | Whether the loading overlay is visible. While it is, what it covers is inert, out of reach of Tab, Enter, Space and screen readers as well as the mouse: the other children of the element it's rendered in, so render it directly inside the element it covers, or with `isFullPage` the rest of the page. Its own content, the cancel button included, stays reachable. Only what's there when it turns on is made inert, and an element that was inert already is left as it was. A control under it that had focus loses it, and gets it back when the loading goes away, unless focus has moved on in the meantime. Show one at a time over the same content: two that cover each other, such as two in one container or two full-page ones, make each other inert, cancel buttons and all. |
| `isFullPage`       | `boolean`                                                                       | `false` | Cover the entire viewport. While it's active, the rest of the page is inert, as it is under a modal, rather than only the element it's rendered in. A full-page loading also takes its turn with Modal and Sidebar for Escape: while it's the topmost open overlay, the Modal or Sidebar under it doesn't answer Escape or hold Tab, whether or not the loading can be cancelled.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —       | Size of the loading spinner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color variant for the spinner, drawn in the color itself. Without it, the spinner is Bulma's `grey-light`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `canCancel`        | `boolean`                                                                       | `false` | Show a cancel button and allow closing, by a click on the overlay or by Escape. With `isFullPage`, the loading is an overlay like Modal and Sidebar: only the topmost open overlay answers Escape, so a full-page loading shown over a Modal cancels first, and the Modal closes on the next Escape. Without it, Escape cancels once no Modal, Dialog, Sidebar or full-page Loading is open. Either way it marks the Escape it cancels on as used with `preventDefault()`. An Escape a popup on the page closed on, by calling `preventDefault()`, doesn't cancel.                                                                                                                                                                                                                               |
| `cancelText`       | `string`                                                                        | —       | The words of the cancel button `canCancel` shows, such as ones in the page's language. Given, the button shows them and is named by them, so a screen reader says, and voice control answers to, what it shows. Missing, empty or only spaces, it shows "Cancel" and is named "Cancel loading".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `onCancel`         | `() => void`                                                                    | —       | Callback when cancel is triggered.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `overlayClassName` | `string`                                                                        | —       | Additional classes for the overlay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `iconClassName`    | `string`                                                                        | —       | Additional classes for the spinner icon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `indicator`        | `React.ReactNode`                                                               | —       | Custom loading indicator element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `overlay`          | `'light'` \| `'dark'` \| `'opaque'`                                             | —       | Style of the loading overlay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `children`         | `React.ReactNode`                                                               | —       | Content to display below the spinner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `className`        | `string`                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `...`              | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

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
