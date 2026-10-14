---
title: Kbd
sidebar_label: Kbd
description: The `Kbd` component renders a `<kbd>` drawn as a keycap, for a key the reader presses.
---

# Kbd

## Overview

<!-- bestax:generated overview -->

The `Kbd` component renders a `<kbd>` drawn as a keycap, for a key the reader presses.

<!-- /bestax:generated overview -->

Reach for it wherever a page tells someone which key to press: "Press Esc to close" in a dialog's
footer, a ⌘K hint at the end of a search field, Ctrl + S next to Save in a menu or a tooltip, or
the table in a keyboard shortcuts help dialog. It only shows the key. It doesn't listen for it.

A key takes its colors from the text it sits in and its size in `em`, so the same `Kbd` fits a
paragraph, a title, a filled button or a dark tooltip with no props, in light mode and in dark.
For a combination or a sequence, put the keys in a `Kbd.Group`.

:::info
Bulma doesn't style `<kbd>`, so `Kbd` brings its own styles, in `bestax.css` and its variants, or
in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Kbd } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### A Key

A key in a sentence sits on the text's baseline, and its border and padding don't push its line
away from the lines around it.

```tsx live
<Paragraph>
  Press <Kbd>Esc</Kbd> to close the dialog.
</Paragraph>
```

### Combinations

Keys pressed together go in a `Kbd.Group`. It renders the outer `<kbd>` HTML gives a combination,
puts a `+` between the keys as text with a space either side, and doesn't break across two lines.
Don't type a `+` of your own, since the group already adds one.

```tsx live
<Paragraph>
  Open the command palette with{' '}
  <Kbd.Group>
    <Kbd>Ctrl</Kbd>
    <Kbd>Shift</Kbd>
    <Kbd>P</Kbd>
  </Kbd.Group>
  .
</Paragraph>
```

### Sequences

Keys pressed one after another take a `separator`, such as `"then"`. It's text, so a screen reader
reads it too.

```tsx live
<Paragraph>
  Go to your inbox with{' '}
  <Kbd.Group separator="then">
    <Kbd>G</Kbd>
    <Kbd>I</Kbd>
  </Kbd.Group>
  .
</Paragraph>
```

### Symbol Keys

A screen reader reads a key's text, and what it says for a symbol like ⌘ or ⇧ depends on the
screen reader and its settings, when it says anything at all. Give a symbol a `label` in your app's
language. The symbol is hidden from assistive tech and the label is read in its place, so this
group reads as "Command plus K".

```tsx live
<Paragraph>
  Search with{' '}
  <Kbd.Group>
    <Kbd label="Command">⌘</Kbd>
    <Kbd>K</Kbd>
  </Kbd.Group>
  .
</Paragraph>
```

Leave `label` off a key written as a word, like `Ctrl` or `Esc`, since the word is already what a
screen reader says.

### Keyboard Shortcuts

Each shortcut is a group of its own.

```tsx live
<Paragraph>
  Press{' '}
  <Kbd.Group>
    <Kbd>Ctrl</Kbd>
    <Kbd>C</Kbd>
  </Kbd.Group>{' '}
  to copy and{' '}
  <Kbd.Group>
    <Kbd>Ctrl</Kbd>
    <Kbd>V</Kbd>
  </Kbd.Group>{' '}
  to paste.
</Paragraph>
```

### A Shortcuts Table

A help dialog's list of shortcuts is a table, with a group in each cell.

```tsx live
<Table>
  <Thead>
    <Tr>
      <Th>Action</Th>
      <Th>Shortcut</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Command palette</Td>
      <Td>
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </Kbd.Group>
      </Td>
    </Tr>
    <Tr>
      <Td>Go to inbox</Td>
      <Td>
        <Kbd.Group separator="then">
          <Kbd>G</Kbd>
          <Kbd>I</Kbd>
        </Kbd.Group>
      </Td>
    </Tr>
    <Tr>
      <Td>Close</Td>
      <Td>
        <Kbd>Esc</Kbd>
      </Td>
    </Tr>
  </Tbody>
</Table>
```

### Sizes

A key is sized in `em`, so it follows the text it's in, a title included. `textSize` sets it
outright (`1` is the largest, `7` the smallest), and its padding and edges scale with it.

```tsx live
<>
  <Title size="4">
    Press{' '}
    <Kbd.Group>
      <Kbd>Ctrl</Kbd>
      <Kbd>K</Kbd>
    </Kbd.Group>{' '}
    to search
  </Title>
  <Block display="flex" alignItems="baseline">
    <Kbd textSize="7" mr="4">
      Esc
    </Kbd>
    <Kbd textSize="5" mr="4">
      Esc
    </Kbd>
    <Kbd textSize="3" mr="4">
      Esc
    </Kbd>
    <Kbd textSize="1">Esc</Kbd>
  </Block>
</>
```

### In a Button

A hint inside a button follows the button's text, so it's light on a filled button. A button lays
out what's inside it in a row, which drops the space between the label and the hint, so give the
hint a margin. Put `aria-keyshortcuts` on the button itself: that's what tells assistive tech the
button has a shortcut, and the `Kbd` is the hint people see.

```tsx live
<Buttons>
  <Button color="primary" aria-keyshortcuts="Control+S">
    Save
    <Kbd.Group ml="2">
      <Kbd>Ctrl</Kbd>
      <Kbd>S</Kbd>
    </Kbd.Group>
  </Button>
  <Button aria-keyshortcuts="Escape">
    Cancel
    <Kbd ml="2">Esc</Kbd>
  </Button>
</Buttons>
```

### In a Tooltip

A key in a tooltip follows the tooltip's light text on its dark fill.

```tsx live
<Block pt="6">
  <Tooltip
    active
    content={
      <>
        Bold{' '}
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>B</Kbd>
        </Kbd.Group>
      </>
    }
  >
    <Button aria-keyshortcuts="Control+B">Bold</Button>
  </Tooltip>
</Block>
```

### Colors

There's no `color` prop, since a key isn't a status. The key's edge and fill are mixed from its
text color, so `textColor` tints all three, and `bgColor` replaces the fill. A key in a colored
notification follows the notification's text the same way.

```tsx live
<>
  <Paragraph>
    <Kbd textColor="link" mr="2">
      Enter
    </Kbd>
    <Kbd textColor="danger" mr="2">
      Del
    </Kbd>
    <Kbd bgColor="warning" textColor="black">
      Tab
    </Kbd>
  </Paragraph>
  <Notification color="info">
    Press <Kbd>Esc</Kbd> to close.
  </Notification>
</>
```

### Mac and Windows

Ctrl on Windows is ⌘ on a Mac, and nothing can know which during a server render, so `Kbd`
doesn't guess. Render Ctrl on the server, and switch to ⌘ on a Mac once the page has hydrated,
with `useIsHydrated`. The server and the hydrating render then show the same key, so there's no
hydration mismatch. Switch the button's `aria-keyshortcuts` with it, to `Meta` for ⌘.

```tsx live
function example() {
  const hydrated = useIsHydrated();
  const isMac = hydrated && /Mac|iPhone|iPad/.test(navigator.userAgent);
  return (
    <Button aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}>
      Search
      <Kbd.Group ml="2">
        {isMac ? <Kbd label="Command">⌘</Kbd> : <Kbd>Ctrl</Kbd>}
        <Kbd>K</Kbd>
      </Kbd.Group>
    </Button>
  );
}
```

### Compound (dot-notation) usage

`Kbd.Group` is also exported as `KbdGroup`, for code that imports each part by name.

```tsx live
<Paragraph>
  Press{' '}
  <Kbd.Group>
    <Kbd label="Command">⌘</Kbd>
    <Kbd>Shift</Kbd>
    <Kbd>P</Kbd>
  </Kbd.Group>{' '}
  on a Mac, then{' '}
  <Kbd.Group separator="then">
    <Kbd>G</Kbd>
    <Kbd>I</Kbd>
  </Kbd.Group>
  .
</Paragraph>
```

---

## Accessibility

- **Markup:** a key is a `<kbd>`, and a combination is an outer `<kbd>` around one `<kbd>` per key,
  the form the [HTML standard](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-kbd-element)
  gives for keys pressed together. Neither adds a role or any `aria-*`, and neither takes focus.
- **What a screen reader hears:** nothing marks a `<kbd>` as a key, so a screen reader reads the
  text inside it like the rest of the sentence. The separator is text with a space either side,
  so `Ctrl`, `Shift` and `P` read as "Ctrl plus Shift plus P" and never run together into one word.
- **Symbols:** a glyph like ⌘, ⌥, ⇧, ⌃ or ⏎ needs a `label`. It goes in visually hidden text,
  with the glyph hidden from assistive tech. Copying the key copies the label along with the glyph.
- **Never `aria-label` on a key:** ARIA in HTML prohibits naming a `<kbd>`, so nothing obliges a
  screen reader to read one. That's why `label` renders text instead.
- **The shortcut lives on the control:** put
  [`aria-keyshortcuts`](https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts) on the button or
  link the shortcut triggers, in UI Events key names: `Control+Shift+P`, with `Meta` for ⌘ and
  `Alt` for Option. `Kbd` is only the hint people see.
- **Contrast:** the key's text is the color of the text around it and its fill is faint, so the
  text keeps the contrast its paragraph, button or tooltip already has. `bgColor` replaces that
  faint fill, so pair it with a `textColor` that holds contrast in both color schemes, such as
  `textColor="black"` on `bgColor="warning"`.
- **Forced colors:** the key is drawn with a border, not a shadow, so it still looks like a key in
  Windows high contrast mode.
- **Selectable:** the text can be selected and copied, so people can copy a shortcut out of a help
  page.

---

## Related Components

- [`Code`](./code.md): For a piece of code, rather than input someone types.
- [`Tag`](./tag.md): For a small colored label, such as a status.
- [`Button`](./button.md): A key someone can click is a button. Put `aria-keyshortcuts` on it and a
  `Kbd` inside it as the hint.
- [`Tooltip`](../components/tooltip.md): Shows a shortcut hint on hover or focus.
- [ClientOnly and `useIsHydrated`](../helpers/clientonly.md): Switching Ctrl to ⌘ after hydration.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for size, color, spacing, etc.

---

## Additional Resources

- [Storybook: Kbd Stories](https://bestax.io/storybook/?path=/story/elements-kbd--default)
- [MDN: the kbd element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/kbd)
- [HTML standard: the kbd element](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-kbd-element)
- [WAI-ARIA: aria-keyshortcuts](https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `children`  | `React.ReactNode`                                                       | —       | The key as it's printed on the keyboard: a word (`Ctrl`, `Esc`), a letter, or a symbol (`⌘`).                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `label`     | `string`                                                                | —       | What a screen reader says in place of a symbol, in your app's language: `label="Command"` on `⌘`. The symbol is hidden from assistive tech with `aria-hidden`, and the label is read in its place, from text that's visually hidden. Use it for a glyph that isn't a word, such as `⌘`, `⌥`, `⇧`, `⌃` or `⏎`, and leave it off a key written as a word. Copying the key copies the label along with the glyph. Don't reach for `aria-label` instead: ARIA in HTML prohibits naming a `<kbd>`, so nothing obliges a screen reader to read it. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper. The key's edge and fill are mixed from its text color, so they follow it.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper. It replaces the key's faint fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the `<kbd>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Subcomponents:**

- `Kbd.Group`: Keys pressed together or one after another, in the outer `<kbd>` HTML gives a combination, with the separator between each pair as text. It doesn't wrap in the middle and isn't drawn as a key itself. It sets no font size, so the keys in it are the size of a key on its own.

### Kbd.Group

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                              |
| `children`  | `React.ReactNode`                                                       | —       | The keys, a `Kbd` each, in the order they're pressed. The group renders the outer `<kbd>` around them, so it doesn't go inside a `Kbd` of its own, and it puts the separator between them, so don't type one: a `+` of your own doubles up. A child that renders nothing (`null`, `false`) gets no separator. |
| `separator` | `string`                                                                | `'+'`   | What goes between the keys, shown and read aloud, with a space either side. Use `'then'` for a sequence pressed one key after another. It's a string because a screen reader has to read it.                                                                                                                  |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper. The keys and separators inside follow it.                                                                                                                                                                                                                                                  |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the outer `<kbd>`.                                                                                                                                                                                                                                                                           |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Kbd` registers these variables on its own `.kbd` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                      | Sass Variable              | Default                                             |
| --------------------------------- | -------------------------- | --------------------------------------------------- |
| `--bulma-kbd-family`              | `$kbd-family`              | `var(--bulma-family-code)`                          |
| `--bulma-kbd-size`                | `$kbd-size`                | `0.875em`                                           |
| `--bulma-kbd-weight`              | `$kbd-weight`              | `var(--bulma-weight-normal)`                        |
| `--bulma-kbd-padding`             | `$kbd-padding`             | `0.125em 0.375em`                                   |
| `--bulma-kbd-radius`              | `$kbd-radius`              | `var(--bulma-radius-small)`                         |
| `--bulma-kbd-border-width`        | `$kbd-border-width`        | `max(1px, 0.0625em)`                                |
| `--bulma-kbd-border-bottom-width` | `$kbd-border-bottom-width` | `max(2px, 0.125em)`                                 |
| `--bulma-kbd-border-color`        | `$kbd-border-color`        | `color-mix(in srgb, currentColor 35%, transparent)` |
| `--bulma-kbd-background`          | `$kbd-background`          | `color-mix(in srgb, currentColor 8%, transparent)`  |
| `--bulma-kbd-color`               | `$kbd-color`               | `currentColor`                                      |

<!-- /bestax:generated cssvars -->
