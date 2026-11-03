---
title: useClipboard
sidebar_label: useClipboard
description: useClipboard copies text to the clipboard through the Clipboard API, falling back to the copy command, and keeps a copied flag for a moment after.
keywords:
  - clipboard
  - copy to clipboard
  - useClipboard
---

# useClipboard

## Overview

`useClipboard` copies text to the clipboard through the Clipboard API, falling back to the copy command where that's missing or refused, and keeps a `copied` flag for a moment after a copy.

It's what [`CopyButton`](../elements/copybutton.md) is built on. Use it for a trigger of your own:
a link, a code block that copies when clicked, or a menu item. It announces nothing, so a trigger of
your own says "Copied" itself, as the examples below do. For a button, `CopyButton` does all of that
already.

---

## Import

```tsx
import { useClipboard } from '@allxsmith/bestax-bulma';
```

---

## Usage

### A Trigger of Your Own

Call `copy` from the click with the text, and read `copied` for the moment after. The status region
is in the page from the start, empty, and says "Copied" while `copied` is `true`, since a screen
reader reliably announces a live region whose text changes and not always one that appears with its
text. The button's name, "Copy commit 4a1986a", holds the words on it.

```tsx live
function CommitId() {
  const sha = '4a1986aa2c7f3e1b9d05e6a8f2c4b7d1e3f5a9c8';
  const short = sha.slice(0, 7);
  const { copy, copied } = useClipboard({ duration: 1500 });

  return (
    <>
      <LinkButton
        type="button"
        aria-label={`Copy commit ${short}`}
        onClick={() => copy(sha)}
      >
        <Code>{short}</Code>
      </LinkButton>
      <Span role="status" visibility="sr-only">
        {copied ? `Copied commit ${short}` : ''}
      </Span>
      <Span ml="2" textColor="grey" aria-hidden="true">
        {copied ? 'Copied' : ''}
      </Span>
    </>
  );
}
```

### Handling a Failure

When nothing could write, `copy` resolves `false` and `error` holds the reason. Say so, and give the
reader a way to copy the text themselves. The status line below reports either outcome, since a
screen reader doesn't always announce a focused button's new label.

```tsx live
function InviteCode() {
  const code = 'BESTAX-2026';
  const { copy, copied, error } = useClipboard();

  return (
    <>
      <Button type="button" onClick={() => copy(code)}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <Paragraph role="status" mt="2" textColor={error ? 'danger' : undefined}>
        {copied && 'Invite code copied.'}
        {error && `Couldn't copy it, so copy ${code} by hand.`}
      </Paragraph>
    </>
  );
}
```

### Text You Have to Fetch

Browsers allow a write only shortly after a click or a key press, and in Firefox and Safari a fetch
that takes a few seconds can outlast that. Fetch the text before the click where you can, and call
`copy` as soon as you have it where you can't. A copy that has run out of time fails like any
other.

```tsx
const { copy } = useClipboard();

async function copyShareLink() {
  const { url } = await fetch('/api/share-link').then(r => r.json());
  if (!(await copy(url))) showTheLink(url);
}
```

---

## How It Writes

`copy` calls `navigator.clipboard.writeText`. Where `navigator.clipboard` is missing, as it is on
any page served over plain `http://` other than `localhost`, or where `writeText` refuses, as
Chromium does in a cross-origin frame without `allow="clipboard-write"`, it falls back to
`document.execCommand('copy')` with a `copy` listener that puts the text on the clipboard. Where
`navigator.clipboard` is missing, that runs straight away, before `copy` awaits anything, so it's
still inside the click. The fallback counts as a success only if the `copy` event fired, since
WebKit's `execCommand` returns `false` from a copy that happened.

`execCommand` is deprecated, and the hook keeps the call in one function, so it can go when the
browsers drop it. It writes plain text only, and never reads the clipboard.

---

## API

```ts
function useClipboard(options?: UseClipboardOptions): UseClipboardResult;

interface UseClipboardOptions {
  duration?: number;
  onCopiedChange?: (copied: boolean) => void;
  onCopyError?: (error: Error) => void;
}

interface UseClipboardResult {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
}
```

### Options

| Option                   | Type                        | Default | Description                                                                                                                                                                                   |
| ------------------------ | --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.duration`       | `number`                    | `2000`  | How long `copied` stays `true` after a copy, in milliseconds. Another copy restarts it.                                                                                                       |
| `options.onCopiedChange` | `(copied: boolean) => void` | —       | Called with `true` after each copy that worked, a repeat included, and with `false` when `duration` runs out or a later copy fails.                                                           |
| `options.onCopyError`    | `(error: Error) => void`    | —       | Called when neither the Clipboard API nor the copy command could write, with the Clipboard API's own error when it refused (such as a `NotAllowedError`), or an `Error` saying neither could. |

The callbacks are read when they fire, so an inline function is fine.

### Returns

| Value    | Type                                 | Description                                                                                                                                             |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copy`   | `(text: string) => Promise<boolean>` | Writes `text`, and resolves `true` once it's written or `false` when it couldn't be. It never rejects, and it keeps its identity from render to render. |
| `copied` | `boolean`                            | `true` for `duration` after a copy that worked.                                                                                                         |
| `error`  | `Error \| null`                      | Why the last copy failed, or `null` after one that worked. A failed copy also ends `copied`, so the two are never set together.                         |

On the server it does nothing: `copied` is `false`, `error` is `null`, and nothing reads the
clipboard or the page while rendering. Once the component calling it has unmounted, nothing changes
and no callback fires. The timer that ends `copied` is cleared, and a write already under way
finishes without reporting back, though `copy`'s promise still resolves.

---

## Accessibility

- Announce the result. A "Copied" message is a status message
  ([WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)): put it in a
  `role="status"` region that's in the page, empty, before the click, and write into it after.
- Don't count on a changed label alone. A change to a focused button's text isn't read out by every
  screen reader and browser pairing.
- Keep the trigger's name holding the words on it, so a voice control user can say what they see.
- When a copy fails, say so, and leave the text where the reader can select and copy it.

---

## Related Components

- [`CopyButton`](../elements/copybutton.md): A button built on this hook, with the label, the
  icon and the announcement.
- [`LinkButton`](../elements/linkbutton.md): A button that looks like a link, for a trigger in
  running text.

---

## Additional Resources

- [Storybook: useClipboard Stories](https://bestax.io/storybook/?path=/story/helpers-useclipboard--default)
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [MDN: document.execCommand()](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)
