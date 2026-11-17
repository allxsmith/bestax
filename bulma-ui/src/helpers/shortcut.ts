// INTERNAL: deliberately not exported from src/index.ts.
/**
 * Key combinations: reading one from a `shortcut` string such as `"mod+k"`,
 * telling whether a keydown is it, and whether the keydown happened while
 * someone was typing. Command.Dialog's `shortcut` and ToastContainer's
 * `hotkey` share them.
 */

/** A key combination, read from a `shortcut` string. */
export interface ParsedShortcut {
  /** The key, lowercased, as `KeyboardEvent.key` names it. */
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

/** Other names a key goes by in a `shortcut`, for the ones `key` spells otherwise. */
const keyAliases: Record<string, string> = {
  space: ' ',
  esc: 'escape',
};

/**
 * Reads a `shortcut` such as `"mod+k"` or `"ctrl + shift + p"`.
 *
 * @param shortcut - Modifiers and a key, joined by `+`.
 * @returns The combination, or `null` when it doesn't read as one.
 */
export const parseShortcut = (shortcut: string): ParsedShortcut | null => {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map(part => part.trim());
  const key = parts.pop() as string;
  if (key === '') return null;
  const parsed: ParsedShortcut = {
    key: keyAliases[key] ?? key,
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
  };
  for (const part of parts) {
    if (part === 'mod') parsed.mod = true;
    else if (part === 'ctrl' || part === 'control') parsed.ctrl = true;
    else if (part === 'meta' || part === 'cmd' || part === 'command')
      parsed.meta = true;
    else if (part === 'alt' || part === 'option') parsed.alt = true;
    else if (part === 'shift') parsed.shift = true;
    else return null;
  }
  return parsed;
};

/**
 * Whether a keydown is the combination. `mod` takes Ctrl or ⌘, and any other
 * modifier has to be as the combination says, so `mod+k` isn't
 * `mod+shift+k`. A letter or digit is matched by its key, and by where it
 * sits on the keyboard only when the key isn't a Latin letter or digit at
 * all, as on a Cyrillic layout or with Option held on a Mac, so another
 * Latin layout's own letters keep their own shortcuts.
 */
export const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: ParsedShortcut
): boolean => {
  if (event.altKey !== shortcut.alt) return false;
  // A symbol such as `?` already says whether Shift was down, and which key
  // takes Shift to type it depends on the layout, so Shift is only checked
  // for a letter, a digit or a named key, unless the combination names it.
  const shiftMatters =
    shortcut.shift ||
    shortcut.key.length > 1 ||
    /^[a-z0-9]$/.test(shortcut.key);
  if (shiftMatters && event.shiftKey !== shortcut.shift) return false;
  if (shortcut.mod) {
    if (!event.ctrlKey && !event.metaKey) return false;
  } else if (
    event.ctrlKey !== shortcut.ctrl ||
    event.metaKey !== shortcut.meta
  ) {
    return false;
  }
  const key = (event.key ?? '').toLowerCase();
  if (key === shortcut.key) return true;
  if (/^[a-z0-9]$/.test(key)) return false;
  if (/^[a-z]$/.test(shortcut.key)) {
    return event.code === `Key${shortcut.key.toUpperCase()}`;
  }
  if (/^[0-9]$/.test(shortcut.key)) {
    return event.code === `Digit${shortcut.key}`;
  }
  return false;
};

/** Input types that take no typing, so a shortcut pressed in one still counts. */
const untypedInputs = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/**
 * Whether a keydown happened while the user was typing: in a text field, a
 * text area, a select, or editable content. The composed path's first entry
 * is the element itself, even inside a shadow root.
 */
export const isTyping = (event: KeyboardEvent): boolean => {
  const target = event.composedPath()[0] as Partial<Element> | undefined;
  if (typeof target?.closest !== 'function') return false;
  const element = target as Element;
  const editable = element.closest('[contenteditable]');
  if (editable && editable.getAttribute('contenteditable') !== 'false') {
    return true;
  }
  const tag = element.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (
    tag === 'INPUT' &&
    !untypedInputs.has((element as HTMLInputElement).type.toLowerCase())
  );
};
