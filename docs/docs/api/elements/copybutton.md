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

Every `Button` color, size and shape works, with the label or without it.

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
in the meantime starts it again.

```tsx live
<CopyButton value="https://bestax.io" duration={4000} />
```

### A Copy Field

A read-only input holding the text and the button go in a `Field hasAddons`, each in its own
`Control`. The button's status region is portaled out of its `Control`, so the button stays the
last child and Bulma joins the two.

When a copy fails, `onCopyError` focuses the input and selects its text, so the reader can copy it
themselves, and a line under the field says so. That line is an alert rather than a status, because
focus moves to the input at the same moment and a screen reader announcing the focused field can
drop a polite message. It's in the page from the start, empty, since a live region that appears
together with its text isn't reliably announced. `onCopiedChange` clears it after a copy that
works.

```tsx live
function ShareLink() {
  const id = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);
  const link = 'https://bestax.io/docs/api/elements/copybutton';

  return (
    <Field label="Share link" labelProps={{ htmlFor: id }}>
      <Field hasAddons>
        <Control isExpanded>
          <Input ref={inputRef} id={id} value={link} readOnly />
        </Control>
        <Control>
          <CopyButton
            value={link}
            onCopiedChange={() => setFailed(false)}
            onCopyError={() => {
              inputRef.current?.focus();
              inputRef.current?.select();
              setFailed(true);
            }}
          />
        </Control>
      </Field>
      <p role="alert" className="help is-danger">
        {failed &&
          "Couldn't copy automatically. The link is selected, so copy it from the field."}
      </p>
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
runs out, and `onCopyError` with an `Error` when neither way of writing worked. Neither is called
once the button has unmounted. They're named after what they report rather than `onCopy` and
`onError`, which a button already takes as DOM events.

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

Your `onClick` runs first, and calling `preventDefault()` in it stops the copy.

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

## How It Writes

A click writes `value` with `navigator.clipboard.writeText`. That can't always work:

- The Clipboard API exists only in secure contexts, so a page served over plain `http://` from
  anywhere but `localhost` (a dev server reached by its network address, an intranet tool) has no
  `navigator.clipboard` at all.
- Chromium refuses it in a cross-origin frame that wasn't given `allow="clipboard-write"`.
- Browsers allow a write only shortly after a click or a key press.

Where it's missing or refuses, the button falls back to `document.execCommand('copy')`, the way
pages copied before the Clipboard API, with a `copy` listener that puts the text on the clipboard.
Where `navigator.clipboard` is missing, that runs straight away, inside the click. The copy counts
as a success only if that `copy` event fired, since WebKit's `execCommand` returns `false` from a
copy that happened. `execCommand` is deprecated, and the call lives in one function, so it can go
when the browsers drop it.

When both fail, the button keeps "Copy", announces "Couldn't copy to the clipboard" and calls
`onCopyError`. It never shows "Copied" for a copy that didn't happen.

It copies plain text only, and only a string you already have: browsers allow the write only
shortly after the click, so text that has to be fetched first can run out of that time. Fetch it
first, or call `useClipboard`'s `copy` once you have it.

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
  `Buttons` row. A copy repeated while the button still reads "Copied" is announced again.
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
<!-- /bestax:generated props -->

---

## CSS & Sass Variables

`CopyButton` has no variables of its own. It's a `Button` underneath, so
[Button's variables](./button.md#css--sass-variables) style it, set the same way: on the button
itself or through `className`. Icon-only, it's an `IconButton`, which brings the rule that makes a
rounded one a circle, in `bestax.css` and its variants or in `extras.css` next to your own Bulma.
