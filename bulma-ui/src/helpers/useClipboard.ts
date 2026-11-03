import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRef } from './useLatestRef';

/** Options for useClipboard. */
export interface UseClipboardOptions {
  /**
   * How long `copied` stays `true` after a copy, in milliseconds. Another
   * copy restarts it.
   * @defaultValue 2000
   */
  duration?: number;
  /**
   * Called with `true` after each copy that worked, a repeat included, and
   * with `false` when `duration` runs out or a later copy fails.
   */
  onCopiedChange?: (copied: boolean) => void;
  /**
   * Called when neither the Clipboard API nor the copy command could write,
   * with the Clipboard API's own error when it refused, or an `Error` saying
   * neither could.
   */
  onCopyError?: (error: Error) => void;
}

/** What useClipboard returns. */
export interface UseClipboardResult {
  /**
   * Writes `text` to the clipboard, and resolves `true` once it's written or
   * `false` when it couldn't be. It never rejects. Call it from a click or a
   * key press: browsers only allow a write shortly after one.
   */
  copy: (text: string) => Promise<boolean>;
  /** `true` for `duration` after a copy that worked. */
  copied: boolean;
  /** Why the last copy failed, or `null` after one that worked. */
  error: Error | null;
}

/** The error a copy reports when nothing could write and nothing said why. */
const cannotCopy =
  'The Clipboard API is missing or refused, and the copy command copied nothing.';

/**
 * Copies `text` the way browsers did before the Clipboard API: it runs the
 * `copy` command and puts the text on the `copy` event that command fires.
 * Success is the event having fired, not the command's return value, which
 * WebKit reports as `false` for a copy that happened.
 *
 * This is the library's only call to the deprecated `document.execCommand`,
 * so it can go when browsers drop it. Until then it's what writes on a page
 * without the Clipboard API (plain `http://`) and in a frame where Chromium
 * refuses it.
 *
 * @param text - The text to copy.
 * @returns Whether the `copy` event fired and took the text.
 */
function copyWithCommand(text: string): boolean {
  let written = false;
  const onCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
    written = true;
  };
  document.addEventListener('copy', onCopy, true);
  try {
    document.execCommand('copy');
  } catch {
    // An engine that refuses, or no longer has the command, can throw, and
    // the event not firing already says so.
  } finally {
    document.removeEventListener('copy', onCopy, true);
  }
  return written;
}

/**
 * Writes `text` through the Clipboard API, and through the copy command when
 * that's missing or refuses. Where it's missing, the copy command runs before
 * the first `await`, so it's still inside the click that called it.
 *
 * @param text - The text to write.
 * @returns `null` once it's written, or why it couldn't be.
 */
async function writeToClipboard(text: string): Promise<Error | null> {
  let refusal: unknown = null;
  // Read at the click, never while rendering, so there's always a navigator.
  const { clipboard } = navigator;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return null;
    } catch (reason) {
      refusal = reason;
    }
  }
  if (copyWithCommand(text)) return null;
  return refusal instanceof Error ? refusal : new Error(cannotCopy);
}

/**
 * Copies text to the clipboard through the Clipboard API, falling back to the copy command where that's missing or refused, and keeps a `copied` flag for `duration` after a copy.
 *
 * It announces nothing. A trigger of your own says "Copied" in a
 * `role="status"` region that's in the page before the click; `CopyButton`
 * is this hook with the button, the label and the announcement built in.
 *
 * A failed copy sets `error`, calls `onCopyError`, and ends `copied` if a
 * copy before it had set it. Nothing changes and no callback fires once the
 * component using it has unmounted, though a write already under way still
 * finishes.
 *
 * @function useClipboard
 * @param options - How long `copied` lasts, and the callbacks.
 * @returns `copy`, which writes, and the `copied` and `error` state.
 *
 * @example
 * const { copy, copied } = useClipboard();
 * <Button onClick={() => copy(url)}>{copied ? 'Copied' : 'Copy link'}</Button>
 */
export function useClipboard(
  options: UseClipboardOptions = {}
): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useLatestRef(options);
  const copiedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      const failure = await writeToClipboard(text);
      if (!mountedRef.current) return failure === null;
      clearTimeout(timerRef.current);
      const {
        duration = 2000,
        onCopiedChange,
        onCopyError,
      } = optionsRef.current;
      const wasCopied = copiedRef.current;
      copiedRef.current = failure === null;
      setCopied(failure === null);
      setError(failure);
      if (failure) {
        if (wasCopied) onCopiedChange?.(false);
        onCopyError?.(failure);
        return false;
      }
      onCopiedChange?.(true);
      timerRef.current = setTimeout(() => {
        copiedRef.current = false;
        setCopied(false);
        optionsRef.current.onCopiedChange?.(false);
      }, duration);
      return true;
    },
    [optionsRef]
  );

  return { copy, copied, error };
}
