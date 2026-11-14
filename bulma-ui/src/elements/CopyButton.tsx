import React, { forwardRef, useRef, useState } from 'react';
import { Button, type ButtonOwnProps } from './Button';
import { Icon } from './Icon';
import { IconButton, type IconButtonProps } from './IconButton';
import { buttonType } from '../helpers/buttonType';
import { CheckIcon } from '../helpers/checkIcon';
import { Portal } from '../helpers/portal';
import { StatusRegion } from '../helpers/statusRegion';
import { useClipboard } from '../helpers/useClipboard';

/**
 * The strings CopyButton shows and announces, each with an English default. A
 * key left out, or set to an empty string, keeps its default.
 */
export interface CopyButtonLabels {
  /**
   * The button's label, and so its name, until a copy. With `showLabel` off
   * it's the name in both states, given as `aria-label`.
   * @defaultValue 'Copy'
   */
  copy?: string;
  /**
   * The label shown for `duration` after a copy, and so the name meanwhile.
   * Not used with `showLabel` off, where only the glyph changes.
   * @defaultValue 'Copied'
   */
  copied?: string;
  /**
   * Announced after a copy.
   * @defaultValue 'Copied to the clipboard'
   */
  copiedStatus?: string;
  /**
   * Announced when the copy fails.
   * @defaultValue "Couldn't copy to the clipboard"
   */
  failedStatus?: string;
}

/**
 * Props for the CopyButton component. The helper props, the other button
 * attributes and the `ref` land on the `<button>`.
 *
 * @extraProp {'button' | 'submit' | 'reset'} [type=button] - `button` unless you pass `submit` or `reset`.
 * @extraProp {React.MouseEventHandler<HTMLButtonElement>} [onClick] - Runs before the copy. An `onClick` that calls `preventDefault()` stops the copy, and neither `onCopiedChange` nor `onCopyError` fires.
 * @extraProp {React.Ref<HTMLButtonElement>} [ref] - Ref forwarded to the `<button>`.
 */
export interface CopyButtonProps
  extends
    Omit<ButtonOwnProps, 'children'>,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      keyof ButtonOwnProps | 'value'
    > {
  /**
   * The text it copies. This is not the `<button>`'s form value, which it
   * doesn't render.
   */
  value: string;
  /**
   * How long the "Copied" label stays, in milliseconds. Another copy
   * restarts it. `0` turns the reset off, as Toast's `0` turns off its
   * auto-close, so "Copied" stays until a later copy fails. A missing or `NaN`
   * value uses the default, a negative one ends it at once, and `Infinity`,
   * or anything longer than the longest delay `setTimeout` takes (about 24.8
   * days), is that longest delay.
   * @defaultValue 2000
   */
  duration?: number;
  /**
   * Shows the label beside the icon, which is then the button's name: it
   * carries no `aria-label`, so the name reads "Copy" and then "Copied" as
   * the words on it do. Turned off, it's a square icon-only button named by
   * `labels.copy` through `aria-label` in both states, and only the glyph
   * changes. An `aria-label` you pass yourself names it in either form.
   * @defaultValue true
   */
  showLabel?: boolean;
  /** Translations for the label and the announcements. */
  labels?: CopyButtonLabels;
  /**
   * Called with `true` after each copy that worked, a repeat included, and
   * with `false` when `duration` runs out or a later copy fails.
   */
  onCopiedChange?: (copied: boolean) => void;
  /**
   * Called when neither the Clipboard API nor the fallback could write. A
   * copy field can select its text from here, so the reader can copy it
   * themselves.
   */
  onCopyError?: (error: Error) => void;
}

/** Two sheets, one over the other. */
const CopyGlyph = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
    width="1em"
    height="1em"
    focusable="false"
  >
    <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1" />
    <rect x="5.5" y="5.5" width="8" height="9" rx="1" />
  </svg>
);

/** One copy's outcome, as the status region announces it. */
interface Announcement {
  id: string;
  text: string;
}

const describeAnnouncement = (announcement: Announcement) => announcement.text;
const noAnnouncements: Announcement[] = [];

/** What marks an open modal dialog in ARIA. */
const modalDialog = '[aria-modal="true"]';

/**
 * The open modal dialog an element is in: one marked `aria-modal="true"`, or
 * a `<dialog>` opened with `showModal()`, which makes the rest of the page
 * inert. An engine without the `:modal` selector throws on the whole list,
 * so it then looks for the ARIA alone.
 *
 * @param element - Where to look up from.
 * @returns The nearest open modal dialog around it, or `null`.
 */
function closestModalDialog(element: Element): HTMLElement | null {
  try {
    return element.closest<HTMLElement>(`${modalDialog}, dialog:modal`);
  } catch {
    return element.closest<HTMLElement>(modalDialog);
  }
}

/**
 * The `CopyButton` component renders a button that copies a piece of text to the clipboard, says "Copied" for a moment, and announces the result.
 *
 * It's a `Button` with a copy icon and "Copy", and takes everything `Button`
 * takes. A click writes `value` through the Clipboard API, or through the
 * older copy command where that's missing or refused, and reports a failure
 * rather than showing "Copied". Each outcome is announced through a polite
 * status region portaled out of the button's place, so it stays the last
 * child of a `Control` or `Buttons`: into the open modal dialog the button is
 * in, otherwise where `Portal` puts portaled content (the `ConfigProvider`'s
 * `portalContainer`, or the end of the page). With `showLabel={false}` it's an
 * `IconButton`. For a trigger of your own, use `useClipboard`, which it's
 * built on.
 *
 * @function
 * @param {CopyButtonProps} props - Props for the CopyButton component.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the `<button>`.
 * @returns {JSX.Element} The rendered button.
 * @see {@link https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | WCAG 4.1.3 Status Messages}
 *
 * @example
 * <CopyButton value="https://bestax.io" />
 *
 * @example
 * <CopyButton value={apiKey} showLabel={false} size="small" />
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  function CopyButton(
    {
      value,
      duration = 2000,
      showLabel = true,
      labels,
      onCopiedChange,
      onCopyError,
      onClick,
      onFocus,
      ...props
    },
    ref
  ) {
    const copyLabel = labels?.copy || 'Copy';
    const copiedLabel = labels?.copied || 'Copied';
    const copiedStatus = labels?.copiedStatus || 'Copied to the clipboard';
    const failedStatus =
      labels?.failedStatus || "Couldn't copy to the clipboard";

    // The latest outcome. Each gets a new id, so the region announces a
    // repeat too.
    const [announcements, setAnnouncements] = useState(noAnnouncements);
    const countRef = useRef(0);
    const announce = (text: string) => {
      countRef.current += 1;
      setAnnouncements([{ id: String(countRef.current), text }]);
    };

    // The open modal dialog the button is in, which the region goes inside:
    // a screen reader ignores a live region behind one. It's looked up when
    // the button takes focus or a click, rather than once as it mounts,
    // since Modal and Sidebar keep their content mounted while closed, and
    // only an open one is `aria-modal`. A region that moves starts empty, so
    // it doesn't say the last outcome again. The popups inside a Modal,
    // Dialog or Command.Dialog portal into it on their own, but this lookup
    // stays: it finds a modal dialog the library didn't render too, such as
    // a `<dialog>` opened with `showModal()`, and unlike theirs, it wins over
    // a `portalContainer`, since a live region outside the dialog says
    // nothing.
    const [dialog, setDialog] = useState<HTMLElement | null>(null);
    const placeRegion = (button: HTMLElement) => {
      const next = closestModalDialog(button);
      if (next === dialog) return;
      setDialog(next);
      setAnnouncements(noAnnouncements);
    };

    // The hook fires nothing once this has unmounted, so neither does the
    // announcement.
    const { copy, copied } = useClipboard({
      duration,
      onCopiedChange: next => {
        if (next) announce(copiedStatus);
        onCopiedChange?.(next);
      },
      onCopyError: error => {
        announce(failedStatus);
        onCopyError?.(error);
      },
    });

    // The caller's onClick runs first, so a `preventDefault()` there stops
    // the copy, as it stops ToggleButton's toggle.
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      placeRegion(event.currentTarget);
      void copy(value);
    };

    const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
      onFocus?.(event);
      placeRegion(event.currentTarget);
    };

    const glyph = <Icon>{copied ? <CheckIcon /> : <CopyGlyph />}</Icon>;

    // The props are spread first, so it stays a `<button>` that doesn't
    // submit by accident, whatever a JavaScript caller or a spread object
    // passes along.
    const button = showLabel ? (
      <Button
        {...props}
        ref={ref}
        as="button"
        type={buttonType(props.type)}
        onClick={handleClick}
        onFocus={handleFocus}
      >
        {glyph}
        <span>{copied ? copiedLabel : copyLabel}</span>
      </Button>
    ) : (
      // IconButton resolves `type` itself, from the same `buttonType`. Its
      // types refuse `aria-label` beside `aria-labelledby`, which a caller
      // here may pass, and the browser then names it by `aria-labelledby`.
      <IconButton
        {...({
          ...props,
          'aria-label': props['aria-label'] || copyLabel,
        } as IconButtonProps)}
        ref={ref}
        as="button"
        onClick={handleClick}
        onFocus={handleFocus}
      >
        {glyph}
      </IconButton>
    );

    return (
      <>
        {button}
        <Portal container={dialog || undefined}>
          <StatusRegion items={announcements} describe={describeAnnouncement} />
        </Portal>
      </>
    );
  }
);

CopyButton.displayName = 'CopyButton';

export default CopyButton;
