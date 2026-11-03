---
title: CopyButton
sidebar_label: CopyButton
description: The `CopyButton` component renders a button that copies a piece of text to the clipboard, says "Copied" for a moment, and announces the result.
keywords:
  - copy button
  - copy to clipboard
  - clipboard
  - Clipboard
  - CopyButton
---

# CopyButton

## Overview

<!-- bestax:generated overview -->

The `CopyButton` component renders a button that copies a piece of text to the clipboard, says "Copied" for a moment, and announces the result.

<!-- /bestax:generated overview -->

Reach for it beside a share link, an invite code or an API key, on a code block or an install
command, or in a table cell holding an id. Mantine calls it `CopyButton` and Chakra calls it
`Clipboard`.

It's a [`Button`](./button.md) with a copy icon and "Copy", so it takes every prop `Button` takes.
After a copy it shows a check and "Copied" for two seconds, and a status region that screen readers
announce says "Copied to the clipboard". It writes through the browser's Clipboard API, falls back to
the older copy command where that's missing or refused, and says so when neither works rather than
showing "Copied" anyway.

For a trigger of your own, such as a link or a whole row, use [`useClipboard`](../helpers/useclipboard.md),
the hook it's built on.

---

## Import

<!-- bestax:generated import -->

```tsx
import { CopyButton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Pass the text to copy as `value`. Click it, then paste somewhere.

```tsx live
<CopyButton value="https://bestax.io" />
```

### Icon-Only

`showLabel={false}` makes it a square [`IconButton`](./iconbutton.md) with no words, for a code
block or a table cell. It's named "Copy" through `aria-label` in both states, and only the glyph
changes.

```tsx live
<Buttons>
  <CopyButton value="key_8f3a2c1e9b" showLabel={false} />
  <CopyButton value="key_8f3a2c1e9b" showLabel={false} isRounded />
  <CopyButton value="key_8f3a2c1e9b" showLabel={false} size="small" />
</Buttons>
```

### Your Own Words

`labels` holds the label in each state and the two announcements, for a more specific action or
another language. Both labels are also the button's name, so "Copy code" reads "Code copied" after a
copy. A label left out, or left empty, keeps its English default.

| Label          | Default                            | Used for                                                     |
| -------------- | ---------------------------------- | ------------------------------------------------------------ |
| `copy`         | `'Copy'`                           | The label until a copy, and the name of an icon-only button. |
| `copied`       | `'Copied'`                         | The label for `duration` after a copy.                       |
| `copiedStatus` | `'Copied to the clipboard'`        | Announced after each copy.                                   |
| `failedStatus` | `"Couldn't copy to the clipboard"` | Announced when the copy fails.                               |

```tsx live
<Buttons>
  <CopyButton
    value="BESTAX-2026"
    color="primary"
    labels={{
      copy: 'Copy code',
      copied: 'Code copied',
      copiedStatus: 'Invite code copied',
    }}
  />
  <CopyButton
    value="https://bestax.io"
    labels={{
      copy: 'Copier',
      copied: 'Copié',
      copiedStatus: 'Copié dans le presse-papiers',
      failedStatus: 'Impossible de copier dans le presse-papiers',
    }}
  />
</Buttons>
```

### Colors and Sizes

Every `Button` color, size and shape works, with the label or without it. In a `Buttons` row it's
also `Buttons.CopyButton`, so the row can come from the one `Buttons` import.

```tsx live
<>
  <Buttons>
    <CopyButton value="primary" color="primary" />
    <CopyButton value="link" color="link" isLight />
    <CopyButton value="dark" color="dark" isOutlined />
    <CopyButton value="text" color="text" />
  </Buttons>
  <Buttons>
    <CopyButton value="small" size="small" />
    <CopyButton value="medium" size="medium" />
    <CopyButton value="medium" size="medium" showLabel={false} />
    <CopyButton value="large" size="large" showLabel={false} isRounded />
  </Buttons>
</>
```

### How Long "Copied" Stays

`duration` sets how long the check and "Copied" stay, in milliseconds, 2000 by default. Another copy
in the meantime starts it again. `0` turns the reset off, as a [`Toast`](../components/toast.md)'s
`duration={0}` turns off its auto-close: "Copied" stays until a later copy fails.

```tsx live
<Buttons>
  <CopyButton value="https://bestax.io" duration={4000} />
  <CopyButton value="https://bestax.io" duration={0} />
</Buttons>
```

### A Copy Field

A read-only input holding the text and the button go in a `Field hasAddons`, each in its own
`Control`. The button's status region is portaled out of its `Control`, so the button stays the
last child and Bulma joins the two.

When a copy fails, the line under the field explains, and the input takes focus with its text
selected, so the reader can copy it themselves. The line is the input's description
(`aria-describedby`), so a screen reader reads it with the field as focus arrives, and the field
takes focus only once the line is in the page. That's why it isn't a live region of its own: the
button's short `failedStatus` is the only announcement, and the instruction comes with the field.
`onCopiedChange` clears it after a copy that works.

```tsx live
function ShareLink() {
  const id = React.useId();
  const helpId = `${id}-help`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Counts the failed copies in a row, so each one moves focus.
  const [failures, setFailures] = useState(0);
  const link = 'https://bestax.io/docs/api/elements/copybutton';

  // Focus the field once its description is in the page, so a screen
  // reader reads the instruction with the field.
  useEffect(() => {
    if (failures === 0) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [failures]);

  return (
    <Field label="Share link" labelProps={{ htmlFor: id }}>
      <Field hasAddons>
        <Control isExpanded>
          <Input
            ref={inputRef}
            id={id}
            value={link}
            readOnly
            aria-describedby={failures > 0 ? helpId : undefined}
          />
        </Control>
        <Control>
          <CopyButton
            value={link}
            labels={{ failedStatus: "Couldn't copy the link" }}
            onCopiedChange={() => setFailures(0)}
            onCopyError={() => setFailures(count => count + 1)}
          />
        </Control>
      </Field>
      {failures > 0 && (
        <p id={helpId} className="help is-danger">
          Couldn't copy automatically. The link is selected, so copy it from the
          field.
        </p>
      )}
    </Field>
  );
}
```

### Beside a Command

Icon-only beside a command, with a more specific name in `labels.copy` and a
[`Tooltip`](../components/tooltip.md) that describes it.

```tsx live
<Paragraph p="5">
  <Code mr="2">pnpm create bestax@latest</Code>
  <Tooltip label="Copies the install command" position="bottom">
    <CopyButton
      value="pnpm create bestax@latest"
      showLabel={false}
      size="small"
      labels={{ copy: 'Copy the command' }}
    />
  </Tooltip>
</Paragraph>
```

### In a Table

One per row, named for what it copies, so a screen reader user moving through the buttons can tell
them apart.

```tsx live
function Keys() {
  const keys = [
    { name: 'Production', key: 'prod_4f8a1c' },
    { name: 'Staging', key: 'test_9b2e7d' },
  ];

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Key</Th>
          <Th>
            <Span visibility="sr-only">Copy</Span>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {keys.map(row => (
          <Tr key={row.key}>
            <Td>{row.name}</Td>
            <Td>
              <Code>{row.key}</Code>
            </Td>
            <Td>
              <CopyButton
                value={row.key}
                showLabel={false}
                size="small"
                labels={{
                  copy: `Copy the ${row.name} key`,
                  copiedStatus: `${row.name} key copied`,
                }}
              />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
```

### Knowing When It Copied

`onCopiedChange` is called with `true` after each copy that works and with `false` when `duration`
runs out or a later copy fails, and `onCopyError` with an `Error` when neither way of writing
worked. Neither is called once the button has unmounted. They're named after what they report
rather than `onCopy` and `onError`, which a button already takes as DOM events.

```tsx live
function example() {
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog(lines => [line, ...lines].slice(0, 4));

  return (
    <>
      <CopyButton
        value="https://bestax.io"
        onCopiedChange={copied => add(`onCopiedChange(${copied})`)}
        onCopyError={error => add(`onCopyError: ${error.message}`)}
      />
      <Paragraph mt="3">{log.join(', ') || 'Nothing copied yet.'}</Paragraph>
    </>
  );
}
```

### Stopping a Copy

Your `onClick` runs first, and calling `preventDefault()` in it stops the copy. Neither
`onCopiedChange` nor `onCopyError` is called then.

```tsx live
function example() {
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)}>
        I'll keep this key secret
      </Checkbox>
      <CopyButton
        ml="3"
        value="key_8f3a2c1e9b"
        labels={{ copy: 'Copy key', copied: 'Key copied' }}
        onClick={event => {
          if (!agreed) event.preventDefault();
        }}
      />
    </>
  );
}
```

### Disabled

A disabled one copies nothing.

```tsx live
<CopyButton value="https://bestax.io" isDisabled />
```

---

## When It Can't Copy

It writes through [`useClipboard`](../helpers/useclipboard.md), whose
[How It Writes](../helpers/useclipboard.md#how-it-writes) says how, and when a browser won't let it.
When nothing writes, the button keeps "Copy", announces "Couldn't copy to the clipboard" and calls
`onCopyError`. It never shows "Copied" for a copy that didn't happen.

It copies plain text you already have, so fetch the text before the click, as
[Text You Have to Fetch](../helpers/useclipboard.md#text-you-have-to-fetch) explains.

---

## Accessibility

- **The name follows the words:** with its label shown, the button has no `aria-label`, so its name
  is the text on it, "Copy" and then "Copied", and a voice control user can say what they see
  ([WCAG 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)).
- **The result is announced:** a change to a focused button's label isn't read out by every screen
  reader and browser pairing, so each copy, and each failure, is also a polite `role="status"`
  message
  ([WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), technique
  [ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)). The region is in the page from
  hydration, well before any click, and is visually hidden. It's portaled to the end of the page,
  or to a `ConfigProvider`'s `portalContainer`, so it isn't a child of the button's `Control` or
  `Buttons` row. Inside an open modal dialog (`aria-modal="true"`), such as a `Modal`, a `Dialog`
  or a `Sidebar` with an overlay, it goes inside the dialog instead, since a screen reader ignores
  a live region behind one. It moves there when the button takes focus or a click. A copy repeated
  while the button still reads "Copied" is announced again.
- **Icon-only, it's still named:** `labels.copy` is its `aria-label` in both states, since there are
  no words to follow, and only the glyph swaps. Give it a name that says what it copies when there
  are several on a page ("Copy the Production key").
- **The glyphs are decorative:** both render `aria-hidden="true"`; the label and the status carry the
  meaning.
- **Failures aren't hidden:** a copy that didn't happen never shows "Copied".
- **Keyboard and focus:** it's a native `<button type="button">`, so <kbd>Enter</kbd> and
  <kbd>Space</kbd> copy, focus stays on it, and it never submits the form it sits in.
- **Forced colors:** the glyphs are drawn in `currentColor`, so they take the system's button text
  color.

---

## Related Components

- [`useClipboard`](../helpers/useclipboard.md): The hook it's built on, for a trigger of your own.
- [`Button`](./button.md): The button it renders through.
- [`IconButton`](./iconbutton.md): What it renders with `showLabel={false}`.
- [`Field`](../form/field.md) and [`Control`](../form/control.md): Put it beside a read-only
  `Input` for a copy field.
- [`Tooltip`](../components/tooltip.md): Adds a description to it.
- [`Code`](./code.md): The text it often sits beside.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, display, etc.

---

## Additional Resources

- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [MDN: Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
- [W3C: Clipboard API and events](https://w3c.github.io/clipboard-apis/)
- [WCAG 4.1.3: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [Bulma Button Documentation](https://bulma.io/documentation/elements/button/)
- [Storybook: CopyButton Stories](https://bestax.io/storybook/?path=/story/elements-copybutton--default)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                                                                                                        | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `string`                                                                                                                                                    | —        | The text it copies. This is not the `<button>`'s form value, which it doesn't render.                                                                                                                                                                                                                                                                                                         |
| `duration`       | `number`                                                                                                                                                    | `2000`   | How long the "Copied" label stays, in milliseconds. Another copy restarts it. `0` turns the reset off, as Toast's `0` turns off its auto-close, so "Copied" stays until a later copy fails. A missing or `NaN` value uses the default, a negative one ends it at once, and `Infinity`, or anything longer than the longest delay `setTimeout` takes (about 24.8 days), is that longest delay. |
| `showLabel`      | `boolean`                                                                                                                                                   | `true`   | Shows the label beside the icon, which is then the button's name: it carries no `aria-label`, so the name reads "Copy" and then "Copied" as the words on it do. Turned off, it's a square icon-only button named by `labels.copy` through `aria-label` in both states, and only the glyph changes. An `aria-label` you pass yourself names it in either form.                                 |
| `labels`         | `{ copy?: string; copied?: string; copiedStatus?: string; failedStatus?: string }`                                                                          | —        | Translations for the label and the announcements.                                                                                                                                                                                                                                                                                                                                             |
| `onCopiedChange` | `(copied: boolean) => void`                                                                                                                                 | —        | Called with `true` after each copy that worked, a repeat included, and with `false` when `duration` runs out or a later copy fails.                                                                                                                                                                                                                                                           |
| `onCopyError`    | `(error: Error) => void`                                                                                                                                    | —        | Called when neither the Clipboard API nor the fallback could write. A copy field can select its text from here, so the reader can copy it themselves.                                                                                                                                                                                                                                         |
| `color`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —        | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.                                                                                                                                                                                                                                                                            |
| `size`           | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —        | Size of the button.                                                                                                                                                                                                                                                                                                                                                                           |
| `isLight`        | `boolean`                                                                                                                                                   | `false`  | Applies a lighter color variant.                                                                                                                                                                                                                                                                                                                                                              |
| `isRounded`      | `boolean`                                                                                                                                                   | `false`  | Makes the button rounded.                                                                                                                                                                                                                                                                                                                                                                     |
| `isLoading`      | `boolean`                                                                                                                                                   | `false`  | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded.                                                                                                           |
| `isStatic`       | `boolean`                                                                                                                                                   | `false`  | Makes the button non-interactive.                                                                                                                                                                                                                                                                                                                                                             |
| `isFullwidth`    | `boolean`                                                                                                                                                   | `false`  | Makes the button full-width.                                                                                                                                                                                                                                                                                                                                                                  |
| `isFullWidth`    | `boolean`                                                                                                                                                   | `false`  | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                                                                                                                                                  |
| `isOutlined`     | `boolean`                                                                                                                                                   | `false`  | Applies outlined styling (requires color).                                                                                                                                                                                                                                                                                                                                                    |
| `isInverted`     | `boolean`                                                                                                                                                   | `false`  | Applies inverted styling (requires color).                                                                                                                                                                                                                                                                                                                                                    |
| `isFocused`      | `boolean`                                                                                                                                                   | `false`  | Applies focused styling (visual only).                                                                                                                                                                                                                                                                                                                                                        |
| `isActive`       | `boolean`                                                                                                                                                   | `false`  | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                                                                                                                            |
| `isHovered`      | `boolean`                                                                                                                                                   | `false`  | Applies hovered styling (visual only).                                                                                                                                                                                                                                                                                                                                                        |
| `isDisabled`     | `boolean`                                                                                                                                                   | `false`  | Applies disabled styling.                                                                                                                                                                                                                                                                                                                                                                     |
| `className`      | `string`                                                                                                                                                    | —        | Custom class name.                                                                                                                                                                                                                                                                                                                                                                            |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —        | Text color helper.                                                                                                                                                                                                                                                                                                                                                                            |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —        | Background color helper.                                                                                                                                                                                                                                                                                                                                                                      |
| `type`           | `'button'` \| `'submit'` \| `'reset'`                                                                                                                       | `button` | `button` unless you pass `submit` or `reset`.                                                                                                                                                                                                                                                                                                                                                 |
| `onClick`        | `React.MouseEventHandler<HTMLButtonElement>`                                                                                                                | —        | Runs before the copy. An `onClick` that calls `preventDefault()` stops the copy, and neither `onCopiedChange` nor `onCopyError` fires.                                                                                                                                                                                                                                                        |
| `ref`            | `React.Ref<HTMLButtonElement>`                                                                                                                              | —        | Ref forwarded to the `<button>`.                                                                                                                                                                                                                                                                                                                                                              |
| `...`            | All standard `<button>` attributes and Bulma helper props                                                                                                   | —        | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

`CopyButton` has no variables of its own. It's a `Button` underneath, so
[Button's variables](./button.md#css--sass-variables) style it, set the same way: on the button
itself or through `className`. Icon-only, it's an `IconButton`, which brings the rule that makes a
rounded one a circle, in `bestax.css` and its variants or in `extras.css` next to your own Bulma.
