import React, {
  cloneElement,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Portal } from '../helpers/portal';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { marginGap, useAnchoredPosition } from '../helpers/useAnchoredPosition';
import { useHoverOpen } from '../helpers/useHoverOpen';
import type { PickerPosition } from '../form/_pickerInternals/pickerTypes';

/**
 * Where the card opens against its trigger: below (`bottom-*`) or above
 * (`top-*`), lined up with the trigger's left or right edge. `auto` picks the
 * one that keeps the card in the viewport, preferring below and lined up on
 * the left. The same union `Popover` and the date and time pickers take.
 */
export type HoverCardPosition = PickerPosition;

/**
 * Props for the HoverCard component. `className`, `id`, the other HTML
 * attributes and the helper props land on the `span` around the trigger, not
 * on the card; `contentClassName` reaches the card.
 * @extraProp {string} [className] - Additional classes for the `span` around the trigger. The card takes `contentClassName`.
 */
export interface HoverCardProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'children'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The element the card previews, such as a link or a `Button`. It has to
   * take focus, so keyboard users can open the card too: HoverCard gives it
   * no role and no tab stop. HoverCard adds `aria-expanded`, and
   * `aria-controls` naming the card while the card is on the page, so it has
   * to be a single element that passes those to its DOM node. Its own click
   * and keys stay its own; the card doesn't toggle on them.
   */
  trigger: React.ReactElement;
  /**
   * The card's content: a preview whose links and buttons are fine, but not a
   * form, which belongs in a `Popover`. The card pads itself, so content goes
   * straight in.
   */
  children?: React.ReactNode;
  /**
   * Controlled open state. When set, hover, focus and Escape only report
   * through `onOpenChange`, so an action inside the card can close it.
   */
  open?: boolean;
  /**
   * Initial open state when uncontrolled. A card that starts open stays open
   * until the pointer or focus has been and gone, or Escape closes it.
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /**
   * Called with the state asked for: when `openDelay` or `closeDelay` runs
   * out, and right away on Escape. Fires in both controlled and uncontrolled
   * use.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * How long the pointer or keyboard focus waits on the trigger before the
   * card opens, in milliseconds.
   * @defaultValue 600
   */
  openDelay?: number;
  /**
   * How long the card stays after the pointer and focus have left the trigger
   * and the card, in milliseconds. It is the time the pointer has to cross
   * the gap between the trigger and the card: with `0` the card closes as the
   * pointer leaves the trigger, before the pointer can reach it.
   * @defaultValue 300
   */
  closeDelay?: number;
  /**
   * Where the card opens against the trigger.
   * @defaultValue 'bottom-left'
   */
  position?: HoverCardPosition;
  /**
   * Render the card at the end of `document.body` through `Portal`, fixed to
   * the viewport, so an ancestor's `overflow`, `transform` or stacking
   * context can't clip it. A trigger in running text needs it too, since the
   * card's block content can't sit inside a `<p>`. The card then shows from
   * the commit after hydration, never in server markup, and it is out of the
   * Tab order: keyboard users can open it, read it and close it with Escape,
   * but can't Tab into it, so whatever it links to has to be reachable from
   * the page as well. It is measured against the trigger when it opens and on
   * resize and scroll, so it doesn't follow content that changes size while
   * it is open. Theming variables set on an ancestor of the trigger don't
   * reach it there.
   * @defaultValue false
   */
  appendToBody?: boolean;
  /** Additional classes for the card (`.hover-card-content`). */
  contentClassName?: string;
}

/** Runs the caller's handler on the wrapper, then the hover card's. */
function chain<E>(
  own: ((event: E) => void) | undefined,
  ours: (event: E) => void
): (event: E) => void {
  return event => {
    own?.(event);
    ours(event);
  };
}

/**
 * The `HoverCard` component shows a card previewing what's behind a link or a button while the pointer rests on it or keyboard focus is on it.
 *
 * Nothing moves focus when the card opens, and nothing traps it. In place,
 * the card comes right after the trigger, so Tab goes from the trigger into
 * its links and tabbing past them closes it. The pointer can move onto the
 * card, Escape closes it from anywhere, and touch doesn't open it, so tapping
 * the trigger just does what the trigger does. For hints with nothing to
 * click use `Tooltip`, and for content opened on purpose, such as a form,
 * use `Popover`.
 *
 * @function
 * @param {HoverCardProps} props - Props for the HoverCard component.
 * @returns {JSX.Element} The trigger in its wrapper, and the card while open.
 *
 * @example
 * <HoverCard trigger={<a href="/people/ada">Ada Lovelace</a>}>
 *   <Title as="p" size="6">Ada Lovelace</Title>
 *   <SubTitle as="p" size="7">Analytical Engine team</SubTitle>
 * </HoverCard>
 */
export const HoverCard: React.FC<HoverCardProps> = ({
  trigger,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  openDelay = 600,
  closeDelay = 300,
  position = 'bottom-left',
  appendToBody = false,
  className,
  contentClassName,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const { onPointerEnter, onPointerLeave, onFocus, onBlur, ...attrs } = rest;
  const rootRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardId = `${useId()}-card`;

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

  // A portaled card has no server markup, so it only exists from the commit
  // after hydration, and nothing measures it before then.
  const hydrated = useIsHydrated();
  const cardMounted = isOpen && (hydrated || !appendToBody);

  const resolved = useAnchoredPosition(rootRef, cardRef, {
    active: cardMounted,
    position,
    fixed: appendToBody,
    // The gap comes from `--bulma-hover-card-offset` in the stylesheet, so
    // the coordinates leave it out and `auto` reads it off the card.
    offset: 0,
    styledGap: marginGap,
  });

  // The trigger renders first inside the wrapper. Read when needed rather
  // than held, so a trigger that remounted is still the one found.
  const triggerRef = useMemo(
    () => ({
      get current() {
        const first = (rootRef.current as HTMLSpanElement).firstElementChild;
        return first && first !== cardRef.current
          ? (first as HTMLElement)
          : null;
      },
    }),
    []
  );

  const hover = useHoverOpen({
    open: isOpen,
    onOpenChange: requestOpen,
    openDelay,
    closeDelay,
    triggerRef,
    floatingRef: cardRef,
  });

  const clonedTrigger = cloneElement(
    trigger as React.ReactElement<Record<string, unknown>>,
    {
      'aria-expanded': isOpen,
      'aria-controls': cardMounted ? cardId : undefined,
    }
  );

  const rootClasses = classNames(
    usePrefixedClassNames('hover-card', { 'is-active': isOpen }),
    bulmaHelperClasses,
    className
  );
  const cardClasses = classNames(
    usePrefixedClassNames('hover-card-content', {
      [`is-${resolved.position}`]: true,
      'is-portal': appendToBody,
    }),
    contentClassName
  );

  return (
    // The ref after the spread: React 19 hands a function component a `ref`
    // prop like any other, and the wrapper has to stay ours. The card is in
    // the wrapper's React tree even when portaled, so the hover and focus
    // handlers here hear from both.
    <span
      className={rootClasses}
      {...attrs}
      onPointerEnter={chain(onPointerEnter, hover.onPointerEnter)}
      onPointerLeave={chain(onPointerLeave, hover.onPointerLeave)}
      onFocus={chain(onFocus, hover.onFocus)}
      onBlur={chain(onBlur, hover.onBlur)}
      ref={rootRef}
    >
      {clonedTrigger}
      {isOpen && (
        <Portal disabled={!appendToBody}>
          <div
            ref={cardRef}
            id={cardId}
            className={cardClasses}
            style={
              appendToBody
                ? {
                    position: 'fixed',
                    top: resolved.top,
                    left: resolved.left,
                  }
                : undefined
            }
          >
            {children}
          </div>
        </Portal>
      )}
    </span>
  );
};

export default HoverCard;
