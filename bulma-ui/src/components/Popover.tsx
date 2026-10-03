import React, {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { Portal } from '../helpers/portal';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { firstTabStop, useFocusTrap } from '../helpers/useFocusTrap';
import { useAnchoredPosition } from '../helpers/useAnchoredPosition';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { getDeepestActiveElement, isEventInside } from '../helpers/shadowDom';
import { buttonType } from '../helpers/buttonType';
import { warnOnce } from '../helpers/devWarnings';
import { Button, ButtonOwnProps } from '../elements/Button';
import type { PickerPosition } from '../form/_pickerInternals/pickerTypes';

/**
 * Where the panel opens against its trigger: below (`bottom-*`) or above
 * (`top-*`), lined up with the trigger's left or right edge. `auto` picks the
 * one that keeps the panel in the viewport, preferring below and lined up on
 * the left. The same union the date and time pickers take.
 */
export type PopoverPosition = PickerPosition;

/**
 * Props for the Popover component. `className`, `id`, the other HTML
 * attributes and the helper props land on the wrapper around the trigger,
 * not on the panel; `contentClassName` reaches the panel.
 * @extraProp {string} [className] - Additional classes for the wrapper around the trigger. The panel takes `contentClassName`.
 */
export interface PopoverProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'children'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The element that opens and closes the popover, such as a `Button`.
   * Popover gives it `aria-haspopup="dialog"`, `aria-expanded`,
   * `aria-controls` while the panel is open, and click and key handlers that
   * run after its own (call `preventDefault()` in yours to keep the popover
   * from toggling). It has to be a single element that passes `onClick` and
   * `onKeyDown` to its DOM node. Enter and Space toggle a trigger the browser
   * doesn't click on its own, and an intrinsic element that isn't already a
   * control (a `<span>`) also gets `role="button"` and `tabIndex={0}` unless
   * it sets them; a component that renders one has to take those itself.
   */
  trigger: React.ReactElement;
  /** The panel's content, usually `Popover.Header`, `Popover.Body` and `Popover.Footer`. */
  children?: React.ReactNode;
  /**
   * Controlled open state. When set, the trigger and every dismissal only
   * report through `onOpenChange`.
   */
  open?: boolean;
  /**
   * Initial open state when uncontrolled. Opening moves focus into the
   * panel, so a popover that starts open takes focus once the page loads.
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /**
   * Called with the state asked for: `true` from the trigger opening it,
   * `false` from the trigger, `Popover.Close`, Escape or an outside
   * `pointerdown`. Fires in both controlled and uncontrolled use.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Where the panel opens against the trigger.
   * @defaultValue 'bottom-left'
   */
  position?: PopoverPosition;
  /**
   * Render the panel at the end of `document.body` through `Portal`, fixed to
   * the viewport, so an ancestor's `overflow`, `transform` or stacking context
   * can't clip it. The panel then shows from the commit after hydration,
   * never in server markup. It is measured against the trigger when it opens
   * and on resize and scroll, so it doesn't follow content that changes size
   * while it is open. Theming variables set on an ancestor of the trigger
   * don't reach it there.
   * @defaultValue false
   */
  appendToBody?: boolean;
  /**
   * Keep Tab and Shift+Tab inside the panel while it is open, as the ARIA
   * dialog pattern does for a non-modal dialog. Pointer focus leaves freely
   * and the page stays usable. With `false`, Tab moves past the panel and
   * the popover stays open. Focus moves into the panel on open and back to
   * the trigger on close either way.
   * @defaultValue true
   */
  trapFocus?: boolean;
  /**
   * Close on a `pointerdown` outside the trigger and the panel. Content the
   * panel renders through a portal (a nested `Popover`, a portaled picker)
   * still counts as inside.
   * @defaultValue true
   */
  closeOnClickOutside?: boolean;
  /**
   * Close on Escape while focus is in the panel or on the trigger. A dialog
   * nested in the panel, such as a date picker's calendar, takes its own
   * Escape first, and so does content that calls `preventDefault()` on it.
   * @defaultValue true
   */
  closeOnEscape?: boolean;
  /**
   * The panel's accessible name. Without it the panel is named by its
   * `Popover.Header`, and a development build warns when it has neither.
   */
  ariaLabel?: string;
  /** Additional classes for the panel (`.popover-content`). */
  contentClassName?: string;
}

interface PopoverContextValue {
  /** The id `Popover.Header` takes, which names the panel. */
  titleId: string;
  /** Records a mounted `Popover.Header`; the returned function forgets it. */
  registerTitle: () => () => void;
  /** Asks the popover to close. */
  close: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

/** The trigger props Popover reads before replacing them. */
interface TriggerProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  role?: string;
  tabIndex?: number;
  href?: unknown;
}

/** Intrinsic elements that are controls already, and keep their own role. */
const NATIVE_CONTROLS = new Set([
  'button',
  'input',
  'select',
  'textarea',
  'summary',
]);

/**
 * Whether the browser answers this key on `el` itself, by clicking it or by
 * using the key as input, so the trigger's click handler covers it.
 */
function handlesKeyItself(el: Element, key: string): boolean {
  if (NATIVE_CONTROLS.has(el.localName)) return true;
  return el.localName === 'a' && key === 'Enter' && el.hasAttribute('href');
}

/** The innermost dialog the event passed through, which is the one its Escape belongs to. */
function nearestDialog(event: Event): EventTarget | null {
  return (
    event.composedPath().find(node => {
      const role = (node as Element).getAttribute?.('role');
      return role === 'dialog' || role === 'alertdialog';
    }) ?? null
  );
}

/**
 * The gap the stylesheet puts between the panel and the trigger, in pixels.
 * It is a margin on whichever side faces the trigger, and a negative one on
 * a portaled panel above it, so the larger magnitude is the gap.
 */
function styledGap(panel: HTMLElement): number {
  const { marginTop, marginBottom } = getComputedStyle(panel);
  return Math.max(
    Math.abs(parseFloat(marginTop)) || 0,
    Math.abs(parseFloat(marginBottom)) || 0
  );
}

/**
 * The `Popover` component opens a panel of interactive content, such as a filter form or a set of share options, anchored to the element that toggles it.
 *
 * The panel is a non-modal `role="dialog"`: focus moves into it on open
 * and returns to the trigger on close, while the rest of the page stays
 * reachable by pointer and assistive technology. For hover-only hints use
 * `Tooltip`, and for a list of actions use `Dropdown`.
 *
 * @function
 * @param {PopoverProps} props - Props for the Popover component.
 * @returns {JSX.Element} The trigger in its wrapper, and the panel while open.
 *
 * @example
 * <Popover trigger={<Button>Filters</Button>}>
 *   <Popover.Header>Filter rows</Popover.Header>
 *   <Popover.Body>…</Popover.Body>
 *   <Popover.Footer>
 *     <Popover.Close>Done</Popover.Close>
 *   </Popover.Footer>
 * </Popover>
 */
const PopoverComponent: React.FC<PopoverProps> = ({
  trigger,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  position = 'bottom-left',
  appendToBody = false,
  trapFocus = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  ariaLabel,
  className,
  contentClassName,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // The last pointerdown React saw inside the panel. React's tree includes
  // content the panel portals elsewhere, which the DOM path doesn't.
  const insidePointerRef = useRef<Event | null>(null);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const titleId = `${baseId}-title`;

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;

  const requestOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!isControlled) setInternalOpen(next);
    },
    [isControlled, onOpenChange]
  );
  const close = useCallback(() => requestOpen(false), [requestOpen]);

  // A portaled panel has no server markup, so it only exists from the commit
  // after hydration. Everything that measures or focuses it waits for that.
  const hydrated = useIsHydrated();
  const panelMounted = isOpen && (hydrated || !appendToBody);

  const resolved = useAnchoredPosition(rootRef, panelRef, {
    active: panelMounted,
    position,
    fixed: appendToBody,
    // The gap comes from `--bulma-popover-offset` in the stylesheet, so the
    // coordinates leave it out and `auto` reads it off the panel.
    offset: 0,
    styledGap,
  });

  // The trigger renders first inside the wrapper. Read when needed rather
  // than held, so a trigger that remounted is still the one found.
  const triggerNode = useCallback((): HTMLElement | null => {
    const first = rootRef.current?.firstElementChild;
    return first && first !== panelRef.current ? (first as HTMLElement) : null;
  }, []);
  const restoreFocusRef = useMemo(
    () => ({
      get current() {
        return triggerNode();
      },
    }),
    [triggerNode]
  );

  useFocusTrap(panelRef, {
    active: panelMounted && trapFocus,
    restoreFocus: restoreFocusRef,
  });

  // Without the trap, focus still arrives in the panel and goes back to the
  // trigger, on the trap's terms: only while the panel still holds it.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panelMounted || trapFocus || !panel) return undefined;
    (firstTabStop(panel) ?? panel).focus();
    return () => {
      const doc = panel.ownerDocument;
      const now = getDeepestActiveElement(doc);
      if (!now || now === doc.body || panel.contains(now)) {
        triggerNode()?.focus();
      }
    };
  }, [panelMounted, trapFocus, triggerNode]);

  useEffect(() => {
    if (!panelMounted || !closeOnClickOutside) return undefined;
    const handlePointerDown = (e: PointerEvent) => {
      if (e === insidePointerRef.current || isEventInside(e, rootRef.current)) {
        return;
      }
      close();
    };
    // The wrapper is on the page whenever the panel is. Its document, an
    // iframe's when the tree renders into one, is where presses land.
    const doc = (rootRef.current as HTMLDivElement).ownerDocument;
    doc.addEventListener('pointerdown', handlePointerDown);
    return () => doc.removeEventListener('pointerdown', handlePointerDown);
  }, [panelMounted, closeOnClickOutside, close]);

  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !closeOnEscape || e.defaultPrevented) return;
    // React bubbles the key here from portaled content as well, so a dialog
    // of its own on the way (a nested popover, a picker's calendar) owns it.
    const owner = nearestDialog(e.nativeEvent);
    if (owner && owner !== panelRef.current) return;
    e.preventDefault();
    close();
  };

  const triggerProps = trigger.props as TriggerProps;

  const handleTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
    triggerProps.onClick?.(e);
    if (!e.defaultPrevented) requestOpen(!isOpen);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    triggerProps.onKeyDown?.(e);
    // A key on something inside the trigger is that element's to answer.
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    if (e.key === 'Escape') {
      if (isOpen && closeOnEscape) {
        e.preventDefault();
        close();
      }
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (handlesKeyItself(e.currentTarget, e.key)) return;
    // Space would scroll the page; a held key repeats.
    e.preventDefault();
    if (!e.repeat) requestOpen(!isOpen);
  };

  const needsButtonRole =
    typeof trigger.type === 'string' &&
    !NATIVE_CONTROLS.has(trigger.type) &&
    !(trigger.type === 'a' && triggerProps.href != null);

  const clonedTrigger = cloneElement(
    trigger as React.ReactElement<Record<string, unknown>>,
    {
      ...(needsButtonRole
        ? {
            role: triggerProps.role ?? 'button',
            tabIndex: triggerProps.tabIndex ?? 0,
          }
        : {}),
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpen,
      'aria-controls': panelMounted ? panelId : undefined,
      onClick: handleTriggerClick,
      onKeyDown: handleTriggerKeyDown,
    }
  );

  const rootClasses = classNames(
    usePrefixedClassNames('popover', { 'is-active': isOpen }),
    bulmaHelperClasses,
    className
  );
  const panelClasses = classNames(
    usePrefixedClassNames('popover-content', {
      [`is-${resolved.position}`]: true,
      'is-portal': appendToBody,
    }),
    contentClassName
  );

  return (
    // The ref after the spread: React 19 hands a function component a `ref`
    // prop like any other, and the wrapper has to stay ours.
    <div className={rootClasses} {...rest} ref={rootRef}>
      {clonedTrigger}
      {isOpen && (
        <Portal disabled={!appendToBody}>
          <PopoverPanel
            panelRef={panelRef}
            titleId={titleId}
            ariaLabel={ariaLabel}
            close={close}
            id={panelId}
            className={panelClasses}
            style={
              appendToBody
                ? {
                    position: 'fixed',
                    top: resolved.top,
                    left: resolved.left,
                  }
                : undefined
            }
            onKeyDown={handlePanelKeyDown}
            onPointerDownCapture={e => {
              insidePointerRef.current = e.nativeEvent;
            }}
          >
            {children}
          </PopoverPanel>
        </Portal>
      )}
    </div>
  );
};

interface PopoverPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  panelRef: React.RefObject<HTMLDivElement | null>;
  titleId: string;
  ariaLabel?: string;
  close: () => void;
}

/**
 * The open panel. It mounts with each opening, so it counts the
 * `Popover.Header`s inside it afresh every time.
 */
function PopoverPanel({
  panelRef,
  titleId,
  ariaLabel,
  close,
  children,
  ...attrs
}: PopoverPanelProps) {
  // Headers register in a layout effect, after this first render, and this
  // panel's own layout effect runs after theirs. Until then the panel assumes
  // it has one, so a panel that does is named from its first commit, before
  // focus moves in, and one that doesn't drops the reference before it paints.
  const [titlesCounted, setTitlesCounted] = useState(false);
  const [titleCount, setTitleCount] = useState(0);
  const registerTitle = useCallback(() => {
    setTitleCount(n => n + 1);
    return () => setTitleCount(n => n - 1);
  }, []);
  useClientLayoutEffect(() => {
    setTitlesCounted(true);
  }, []);
  const named = Boolean(ariaLabel) || titleCount > 0;

  useEffect(() => {
    if (titlesCounted && !named) {
      warnOnce(
        'Popover:unnamed',
        '[bestax-bulma] <Popover> opened a panel with no accessible name. ' +
          'Pass ariaLabel, or render a Popover.Header inside it.'
      );
    }
  }, [titlesCounted, named]);

  const context = useMemo(
    () => ({ titleId, registerTitle, close }),
    [titleId, registerTitle, close]
  );

  return (
    <PopoverContext.Provider value={context}>
      <div
        {...attrs}
        ref={panelRef}
        role="dialog"
        aria-label={ariaLabel}
        aria-labelledby={
          !ariaLabel && (!titlesCounted || titleCount > 0) ? titleId : undefined
        }
        tabIndex={-1}
      >
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

/**
 * Props for the Popover.Header component. Its `id` is the one the panel's
 * `aria-labelledby` names, so it isn't yours to set.
 */
export interface PopoverHeaderProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'id'>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * The popover's title, which names the panel for assistive technology.
 *
 * @function
 * @param {PopoverHeaderProps} props - Props for the Popover.Header component.
 * @returns {JSX.Element} The header element.
 */
export const PopoverHeader: React.FC<PopoverHeaderProps> = ({
  className,
  ...props
}) => {
  const context = useContext(PopoverContext);
  const registerTitle = context?.registerTitle;
  // Before paint, so the panel is named by the time it shows.
  useClientLayoutEffect(() => registerTitle?.(), [registerTitle]);
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames(
        usePrefixedClassNames('popover-header'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
      id={context?.titleId}
    />
  );
};

/**
 * Props for the Popover.Body component.
 */
export interface PopoverBodyProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * The popover's main content area.
 *
 * @function
 * @param {PopoverBodyProps} props - Props for the Popover.Body component.
 * @returns {JSX.Element} The body element.
 */
export const PopoverBody: React.FC<PopoverBodyProps> = ({
  className,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames(
        usePrefixedClassNames('popover-body'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    />
  );
};

/**
 * Props for the Popover.Footer component.
 */
export interface PopoverFooterProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * A row of actions along the bottom of the popover, aligned to the end.
 *
 * @function
 * @param {PopoverFooterProps} props - Props for the Popover.Footer component.
 * @returns {JSX.Element} The footer element.
 */
export const PopoverFooter: React.FC<PopoverFooterProps> = ({
  className,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames(
        usePrefixedClassNames('popover-footer'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    />
  );
};

/**
 * Props for the Popover.Close component: the props of a `Button` rendered as
 * a `<button>`.
 * @extraProp {'button' | 'submit' | 'reset'} [type='button'] - Button type. Defaults to `'button'`, so a close button inside a form doesn't submit it.
 * @extraProp {React.MouseEventHandler<HTMLButtonElement>} [onClick] - Runs before the popover closes. Call `preventDefault()` to keep it open.
 */
export interface PopoverCloseProps
  extends
    ButtonOwnProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> {}

/**
 * A `Button` that closes the popover, handing focus back to the trigger.
 *
 * @function
 * @param {PopoverCloseProps} props - Props for the Popover.Close component.
 * @returns {JSX.Element} The close button.
 */
export const PopoverClose: React.FC<PopoverCloseProps> = ({
  onClick,
  ...props
}) => {
  const context = useContext(PopoverContext);
  return (
    <Button
      {...props}
      type={buttonType(props.type)}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) context?.close();
      }}
    />
  );
};

/** Popover with Header, Body, Footer and Close sub-components. */
export const Popover = withSubComponents(
  PopoverComponent,
  {
    Header: PopoverHeader,
    Body: PopoverBody,
    Footer: PopoverFooter,
    Close: PopoverClose,
  },
  'Popover'
);

export default Popover;
