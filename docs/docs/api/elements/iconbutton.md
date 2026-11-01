---
title: IconButton
sidebar_label: IconButton
description: The `IconButton` component renders a button that shows only an icon, and requires a name for it.
keywords:
  - icon button
  - action icon
  - ActionIcon
  - icon-only button
  - toolbar button
---

# IconButton

## Overview

<!-- bestax:generated overview -->

The `IconButton` component renders a button that shows only an icon, and requires a name for it.

<!-- /bestax:generated overview -->

Reach for it where a button has room for a picture and no words: the edit, delete and share actions
in a table row or on a card, a toolbar of view actions, a search or clear button beside an input,
the menu or settings button in a navbar. Mantine calls it `ActionIcon`.

It's a [`Button`](./button.md) underneath, so it takes every prop `Button` takes. What it adds is
the icon and a name: the types require `aria-label`, or `aria-labelledby` in its place, since an icon
gives a screen reader nothing to announce. Bulma keeps a button whose only child is an icon square
at every size, and `isRounded` makes it a circle.

:::info
Bulma draws everything but the circle. `IconButton` brings the one rule that makes a rounded icon
button round, in `bestax.css` and its variants, or in `extras.css` next to your own Bulma. Without it,
`isRounded` gives Bulma's pill.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { IconButton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Pass the icon's name as `icon` and name the button for what it does.

```tsx live
<IconButton icon="trash" aria-label="Delete" />
```

### Naming It

`aria-label` is the name a screen reader announces and the word a voice control user says to press
it. Name the action ("Delete"), not the picture ("Trash"). Where the name is already on the page,
point `aria-labelledby` at it instead. The types take one or the other, never both, and a button
with neither doesn't compile:

```tsx
<IconButton icon="trash" />
// Property 'aria-label' is missing in type '{ icon: string; }' ...
```

An empty or blank `aria-label` still compiles, so a development build warns about it.

```tsx live
<>
  <Paragraph id="archive-label" textSize="7">
    Archive this conversation
  </Paragraph>
  <IconButton icon="box-archive" aria-labelledby="archive-label" />
</>
```

### The Icon

`icon` takes an icon name, drawn from the library a [`ConfigProvider`](../helpers/config.md) sets,
or an [`Icon`](./icon.md) of your own, which renders as given, so it can carry its own `variant` or
`library`. Any other node, such as an inline SVG or a component from an icon package, goes inside an
`Icon`, which gives it the `.icon` wrapper Bulma keeps square. You can also pass the glyph as
children, an `<Icon>` inside the button, the way Mantine, MUI and Chakra write it.

```tsx live
<Buttons>
  <IconButton icon="heart" aria-label="Favorite" />
  <IconButton
    icon={<Icon name="heart" variant="regular" />}
    aria-label="Add to favorites"
  />
  <IconButton
    icon={
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
        <path d="M18 16a3 3 0 0 0-2.4 1.2L8.9 13.7a3 3 0 0 0 0-3.4l6.7-3.5A3 3 0 1 0 15 5l-6.7 3.5a3 3 0 1 0 0 7L15 19a3 3 0 1 0 3-3Z" />
      </svg>
    }
    aria-label="Share"
  />
  <IconButton aria-label="Settings">
    <Icon name="gear" />
  </IconButton>
</Buttons>
```

Draw an SVG with `fill="currentColor"`, as above, so it takes the button's text color, in every
theme and in forced colors. A bare `<svg>` passed as children isn't wrapped, so it loses Bulma's
square: pass it as `icon`.

Children render after the icon, as given, so a badge can sit on top of it. Text in children warns in
development, since `aria-label` replaces it as the name: a button with words is a `Button`.

### Colors

`color` takes every color `Button` takes, and `isLight`, `isOutlined` and `isInverted` work as
they do on `Button`.

```tsx live
<>
  <Buttons>
    <IconButton color="primary" icon="plus" aria-label="Add" />
    <IconButton color="link" icon="pen" aria-label="Edit" />
    <IconButton color="info" icon="circle-info" aria-label="Details" />
    <IconButton color="success" icon="check" aria-label="Approve" />
    <IconButton color="warning" icon="flag" aria-label="Report" />
    <IconButton color="danger" icon="trash" aria-label="Delete" />
  </Buttons>
  <Buttons>
    <IconButton color="danger" isLight icon="trash" aria-label="Delete" />
    <IconButton color="link" isOutlined icon="download" aria-label="Download" />
  </Buttons>
</>
```

### Sizes and Circles

`size` takes Button's sizes. With Bulma's defaults the buttons are 30, 40, 50 and 60 pixels square
from `small` to `large`, the height of an input of the same size. `isRounded` makes each a circle
of the same size.

```tsx live
<>
  <Buttons>
    <IconButton size="small" icon="pen" aria-label="Edit, small" />
    <IconButton icon="pen" aria-label="Edit" />
    <IconButton size="medium" icon="pen" aria-label="Edit, medium" />
    <IconButton size="large" icon="pen" aria-label="Edit, large" />
  </Buttons>
  <Buttons>
    <IconButton
      size="small"
      isRounded
      color="primary"
      icon="plus"
      aria-label="Add, small"
    />
    <IconButton isRounded color="primary" icon="plus" aria-label="Add" />
    <IconButton
      size="medium"
      isRounded
      color="primary"
      icon="plus"
      aria-label="Add, medium"
    />
    <IconButton
      size="large"
      isRounded
      color="primary"
      icon="plus"
      aria-label="Add, large"
    />
  </Buttons>
</>
```

### With a Tooltip

`IconButton` has no tooltip of its own. Wrap it in a [`Tooltip`](../components/tooltip.md) to add a
description. A tooltip describes its trigger and doesn't name it, so give it something to add to the
name ("Delete", described as "Moves it to the trash"), not the name again, which a screen reader
would read twice.

```tsx live
<Buttons p="6">
  <Tooltip label="Moves it to the trash" position="bottom">
    <IconButton icon="trash" aria-label="Delete" />
  </Tooltip>
  <Tooltip label="Opens it for editing" position="bottom">
    <IconButton icon="pen" aria-label="Edit" />
  </Tooltip>
  <Tooltip label="Saves a copy as a PDF" position="bottom">
    <IconButton icon="download" aria-label="Download" />
  </Tooltip>
</Buttons>
```

`Tooltip` wraps its trigger in a `<span>`, so keep tooltips out of a joined row: Bulma squares off
the corners between buttons by where each sits among its siblings, and a wrapped button is always
the first of one.

### A Row of Actions

Several go in [`Buttons`](./buttons.md), and `hasAddons` joins them into one row. Give a joined row
`role="group"` and an `aria-label`, so a screen reader names the set. An action that turns something
on and off, like Bold, is a [`ToggleButton`](./togglebutton.md), which reports whether it's pressed.

```tsx live
<Buttons hasAddons role="group" aria-label="Zoom">
  <IconButton icon="minus" aria-label="Zoom out" />
  <IconButton icon="expand" aria-label="Fit to window" />
  <IconButton icon="plus" aria-label="Zoom in" />
</Buttons>
```

### Beside an Input

In a [`Field`](../form/field.md) with `hasAddons`, it's the input's height at each size. `type`
is `button` unless you say otherwise, so it never submits the form around it by accident. Pass
`type="submit"` for a search button.

```tsx live
function example() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        setSearched(query);
      }}
    >
      <Field hasAddons>
        <Control isExpanded>
          <Input
            type="search"
            aria-label="Search the docs"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </Control>
        <Control>
          <IconButton
            icon="xmark"
            aria-label="Clear"
            onClick={() => setQuery('')}
          />
        </Control>
        <Control>
          <IconButton
            type="submit"
            color="primary"
            icon="magnifying-glass"
            aria-label="Search"
          />
        </Control>
      </Field>
      <Paragraph>
        {searched ? `Searched for ${searched}.` : 'No search yet.'}
      </Paragraph>
    </form>
  );
}
```

### Loading

`isLoading` shows Bulma's spinner with the icon hidden behind it. The button keeps its size, its
name and its focus, since it isn't `disabled`.

```tsx live
<Buttons>
  <IconButton isLoading icon="floppy-disk" aria-label="Save" />
  <IconButton
    isLoading
    isRounded
    color="primary"
    icon="floppy-disk"
    aria-label="Save"
  />
</Buttons>
```

### Disabled

`isDisabled` (or `disabled`) disables it, as on `Button`.

```tsx live
<IconButton isDisabled icon="trash" aria-label="Delete" />
```

### As a Link

`as` renders it as an `<a>` or a router's link component, as on `Button`, and the attributes and the
`ref` follow. On an anchor, `type` passes through as the link's MIME type hint.

```tsx live
<IconButton
  as="a"
  href="https://bulma.io/documentation/elements/button/"
  target="_blank"
  rel="noreferrer"
  icon="arrow-up-right-from-square"
  aria-label="Bulma's button docs, in a new tab"
/>
```

---

## Accessibility

- **A name every time:** an icon-only button's name is its text alternative
  ([WCAG 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) and
  [4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)), so the types require
  `aria-label` or `aria-labelledby`, and a development build warns about an empty or blank one. Name
  the action, not the picture.
- **The icon is decorative:** it renders `aria-hidden="true"`, so it adds nothing to the name. Don't
  name the `Icon` too, or the name is read twice.
- **Tooltips describe:** a [`Tooltip`](../components/tooltip.md) around it points the button's
  `aria-describedby` at itself, so the name and the description stay separate. Give the tooltip
  something to add, not the name again.
- **Keyboard and focus:** it's a native `<button>`, so <kbd>Enter</kbd> and <kbd>Space</kbd> press
  it, with Bulma's focus style. `isLoading` leaves it focusable.
- **Target size:** Bulma's smallest is 30 by 30 pixels, above the 24 by 24
  [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) asks for.
- **Toggles** are [`ToggleButton`](./togglebutton.md), which reports `aria-pressed`. Give an
  icon-only one an `aria-label` the same way.
- **Forced colors:** a font icon, or an SVG drawn in `currentColor`, takes the system's text
  color, as a button's text does.

---

## Related Components

- [`Button`](./button.md): The button it renders through, for a button with words.
- [`ToggleButton`](./togglebutton.md): A button that stays pressed, for an action that turns
  something on and off.
- [`Buttons`](./buttons.md): Lays out several, and `hasAddons` joins them into one row.
- [`Tooltip`](../components/tooltip.md): Adds a description to it.
- [`Icon`](./icon.md): The glyph inside it.
- [`Delete`](./delete.md): Bulma's small round close button, for dismissing a notification, a tag or
  a modal.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, display, etc.

---

## Additional Resources

- [Bulma Button Documentation](https://bulma.io/documentation/elements/button/)
- [WAI-ARIA APG: Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [WCAG Technique ARIA14: Using aria-label](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14)
- [Storybook: IconButton Stories](https://bestax.io/storybook/?path=/story/elements-iconbutton--default)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                                                                                                        | Default    | Description                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`              | `React.ElementType`                                                                                                                                         | `'button'` | Render as a `<button>`, an `<a>`, or a custom component such as a router `Link`, as on `Button`.                                                                                                                                                                                                                                                                                |
| `icon`            | `React.ReactNode`                                                                                                                                           | —          | The glyph. A string is an `Icon` name, drawn from the icon library `ConfigProvider` sets. An `<Icon>` renders as given, so it can carry its own `variant` or `library`. Any other node, such as an SVG or a component from an icon package, goes inside an `Icon`, which gives it the `.icon` wrapper Bulma keeps square. It's decorative: the button's name says what it does. |
| `children`        | `React.ReactNode`                                                                                                                                           | —          | The glyph as children, rendered as given after `icon`: an `<Icon>`, or a node inside one. A bare `<svg>` here isn't wrapped and loses Bulma's square, so pass it as `icon` instead. Text warns in development, since `aria-label` replaces it as the name: a button with text is a `Button`.                                                                                    |
| `aria-labelledby` | `string`                                                                                                                                                    | —          | The id of the element whose text names the button, in place of `aria-label`.                                                                                                                                                                                                                                                                                                    |
| `aria-label`      | `string`                                                                                                                                                    | —          | The button's name: what a screen reader announces and what a voice control user says to press it. Required, or `aria-labelledby` in its place, since an icon has no text to name it by. Name the action ("Delete"), not the picture ("Trash"). An empty or blank one warns in development.                                                                                      |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —          | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.                                                                                                                                                                                                                                                              |
| `size`            | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —          | Size of the button.                                                                                                                                                                                                                                                                                                                                                             |
| `isLight`         | `boolean`                                                                                                                                                   | `false`    | Applies a lighter color variant.                                                                                                                                                                                                                                                                                                                                                |
| `isRounded`       | `boolean`                                                                                                                                                   | `false`    | Makes the button rounded.                                                                                                                                                                                                                                                                                                                                                       |
| `isLoading`       | `boolean`                                                                                                                                                   | `false`    | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded.                                                                                             |
| `isStatic`        | `boolean`                                                                                                                                                   | `false`    | Makes the button non-interactive.                                                                                                                                                                                                                                                                                                                                               |
| `isFullwidth`     | `boolean`                                                                                                                                                   | `false`    | Makes the button full-width.                                                                                                                                                                                                                                                                                                                                                    |
| `isFullWidth`     | `boolean`                                                                                                                                                   | `false`    | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                                                                                                                                    |
| `isOutlined`      | `boolean`                                                                                                                                                   | `false`    | Applies outlined styling (requires color).                                                                                                                                                                                                                                                                                                                                      |
| `isInverted`      | `boolean`                                                                                                                                                   | `false`    | Applies inverted styling (requires color).                                                                                                                                                                                                                                                                                                                                      |
| `isFocused`       | `boolean`                                                                                                                                                   | `false`    | Applies focused styling (visual only).                                                                                                                                                                                                                                                                                                                                          |
| `isActive`        | `boolean`                                                                                                                                                   | `false`    | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                                                                                                              |
| `isHovered`       | `boolean`                                                                                                                                                   | `false`    | Applies hovered styling (visual only).                                                                                                                                                                                                                                                                                                                                          |
| `isDisabled`      | `boolean`                                                                                                                                                   | `false`    | Applies disabled styling.                                                                                                                                                                                                                                                                                                                                                       |
| `className`       | `string`                                                                                                                                                    | —          | Custom class name.                                                                                                                                                                                                                                                                                                                                                              |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Text color helper.                                                                                                                                                                                                                                                                                                                                                              |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Background color helper.                                                                                                                                                                                                                                                                                                                                                        |
| `type`            | `'button'` \| `'submit'` \| `'reset'`                                                                                                                       | `button`   | On a `<button>`, `button` unless you pass `submit` or `reset`, so it never submits a form by accident. With another `as`, it passes through as given.                                                                                                                                                                                                                           |
| `ref`             | `PolymorphicRef<React.ElementType>`                                                                                                                         | —          | Ref forwarded to the element `as` renders, typed from `as`.                                                                                                                                                                                                                                                                                                                     |
| `...`             | Remaining props of the element or component selected by `as` (default `<button>`) and Bulma helper props                                                    | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                               |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

`IconButton` has no variables of its own. It's a `Button` underneath, so
[Button's variables](./button.md#css--sass-variables) style it, set the same way: on the button
itself or through `className`. The rule that makes a rounded one a circle reads two of them,
`--bulma-button-padding-horizontal` and `--bulma-button-border-width`, so a theme that changes those
keeps it round.
