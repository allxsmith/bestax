import React, {
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  useRef,
  useLayoutEffect,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { chain, useHoverOpen } from '../helpers/useHoverOpen';
import { isTabbableKind } from '../helpers/useFocusTrap';
import { isDev, warnOnce } from '../helpers/devWarnings';

/** Screen positions for the tooltip. */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
/** Color variants for the tooltip. */
export type TooltipColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'dark'
  | 'light';
/** Size variants for the tooltip. */
export type TooltipSize = 'small' | 'medium' | 'large';

/** An id list with `id` added at the end, unless it's in there already. */
const withId = (ids: string | undefined, id: string) =>
  [...new Set([...(ids ?? '').split(/\s+/), id])].filter(Boolean).join(' ');

/**
 * The first element in the trigger that Tab lands on, judged by what it is
 * rather than by its styles, which can hide it for now. The trigger is all
 * of the wrapper that comes before the tooltip.
 */
const triggerTabStop = (wrapper: Element, tooltip: Element) => {
  const elements = Array.from(wrapper.querySelectorAll('*'));
  return elements
    .slice(0, elements.indexOf(tooltip))
    .find(el => isTabbableKind(el) && !el.matches(':disabled'));
};

/**
 * Props for the Tooltip component.
 * @extraProp {React.ReactNode} [children] - The element that triggers the
 * tooltip. Its `aria-describedby` points at the tooltip, after any ids it
 * already had, so a screen reader reads the tooltip as its description when
 * it takes focus, even while the tooltip is hidden. That takes a single
 * element which passes `aria-describedby` on to its DOM node, as native
 * elements and bestax components do, and takes focus itself, such as a
 * button, a link or a `Span` with `tabIndex={0}`: something focusable inside
 * it doesn't get the link, and text, a fragment or several elements get none.
 * A development build warns when the first element Tab reaches in the
 * trigger doesn't carry the link, or there isn't one.
 * @extraProp {string} [className] - Additional CSS classes.
 */
export interface TooltipProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'content'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** The tooltip text content. */
  label?: string;
  /**
   * Rich tooltip content (alternative to `label`), to read rather than use.
   * Nothing in it should take focus or a click: it isn't in the Tab order
   * while hidden, focus there isn't counted as being in the tooltip, and
   * Escape hiding it would drop that focus. For links or buttons, use
   * `HoverCard` or `Popover`. A screen reader reads it as plain text, since
   * it's the trigger's description.
   */
  content?: React.ReactNode;
  /** Position of the tooltip. Default: 'top'. */
  position?: TooltipPosition;
  /** Color variant for the tooltip. */
  color?: TooltipColor;
  /** Size of the tooltip. */
  size?: TooltipSize;
  /**
   * Force tooltip to be always visible. Hover, focus and Escape leave it
   * shown, so Escape goes on to whatever has focus, or to a `Modal` or
   * `Popover` around it.
   */
  active?: boolean;
  /** Allow tooltip to wrap to multiple lines. */
  multiline?: boolean;
  /** Enable fade animation. Default: true. */
  animated?: boolean;
  /** Use square corners instead of rounded. */
  square?: boolean;
  /** Show dashed underline on trigger. */
  dashed?: boolean;
  /**
   * How long the pointer or keyboard focus waits on the trigger before the
   * tooltip shows, in milliseconds.
   */
  delay?: number;
  /**
   * How long the tooltip stays after the pointer and focus have left the
   * trigger and the tooltip, in milliseconds. The pointer can move from the
   * trigger onto a shown tooltip without one, across the default gap. A
   * theme that raises `--bulma-tooltip-arrow-size` or
   * `--bulma-tooltip-arrow-margin` widens the gap past what the pointer can
   * cross on its own, so give it a `closeDelay` long enough to cross the
   * rest.
   */
  closeDelay?: number;
  /**
   * Show the tooltip with a tap on a touch screen. Touch has no hover, so
   * without this a phone or tablet never shows it. With it, a tap on the
   * trigger shows it at once, and it stays until another tap on the trigger
   * or the tooltip, a tap anywhere else, or Escape. The tap still does
   * whatever the trigger does, so turn this on only for a trigger with no
   * tap action of its own. Mouse and pen work the same either way.
   * @defaultValue false
   */
  openOnTap?: boolean;
  /** Additional classes for the tooltip element. */
  tooltipClassName?: string;
}

/**
 * The `Tooltip` component displays helpful information when users hover over or focus on an element.
 *
 * Hovering the trigger or giving it keyboard focus shows it. Touch doesn't,
 * unless `openOnTap` is on, and neither does focus a click or a tap brings,
 * so tapping the trigger just does what the trigger does. The pointer can
 * move onto a shown tooltip. Escape hides it wherever focus is, without
 * moving the pointer or focus, and it stays hidden until one of them leaves
 * the trigger and comes back, or, with `openOnTap`, until the next tap on
 * the trigger. The key always goes on too, to whatever has focus or a
 * `Modal` or `Popover` around it, since a tooltip only adds to what's
 * there. The tooltip is its trigger's description, so a screen reader reads
 * it as the trigger takes focus, whether it's showing yet or not.
 *
 * @function
 * @param {TooltipProps} props - Props for the Tooltip component.
 * @returns {JSX.Element} The rendered tooltip wrapper.
 *
 * @example
 * // Basic tooltip
 * <Tooltip label="This is helpful info">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * @example
 * // Positioned tooltip with color, on an icon-only button with a name of its own
 * <Tooltip label="Moves it to the trash" position="right" color="danger">
 *   <Button aria-label="Delete">
 *     <Icon name="fas fa-trash" />
 *   </Button>
 * </Tooltip>
 *
 * @example
 * // Multiline tooltip
 * <Tooltip label="This is a longer tooltip that wraps to multiple lines" multiline>
 *   <button>More info</button>
 * </Tooltip>
 */
export const Tooltip: React.FC<TooltipProps> = ({
  label,
  content,
  position = 'top',
  color,
  size,
  active: alwaysActive,
  multiline = false,
  animated = true,
  square = false,
  dashed = false,
  delay = 0,
  closeDelay = 0,
  openOnTap = false,
  children,
  className,
  tooltipClassName,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const {
    onPointerEnter,
    onPointerOver,
    onPointerLeave,
    onPointerDown,
    onPointerUp,
    onFocus,
    onBlur,
    ...attrs
  } = rest;
  const [isVisible, setIsVisible] = useState(false);
  const [resolvedPosition, setResolvedPosition] = useState<
    Exclude<TooltipPosition, 'auto'>
  >(position === 'auto' ? 'top' : position);
  const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const tooltipId = `${useId()}-tooltip`;

  // Only a single element can be given the link, and a fragment takes no
  // props of its own.
  const linkable =
    isValidElement<{ 'aria-describedby'?: string }>(children) &&
    children.type !== Fragment;

  // A screen reader reads the tooltip only when Tab lands on an element that
  // carries the link. Only the page shows whether it does, since a component
  // may not pass the attribute on, or what takes focus may sit inside the
  // element that took it. After every commit, since the children can change,
  // and only in development.
  useEffect(() => {
    if (!isDev()) return;
    const stop = triggerTabStop(
      wrapperRef.current as HTMLSpanElement,
      contentRef.current as HTMLSpanElement
    );
    if (
      stop?.getAttribute('aria-describedby')?.split(/\s+/).includes(tooltipId)
    ) {
      return;
    }
    warnOnce(
      'Tooltip:unlinked-trigger',
      "[bestax-bulma] <Tooltip> can't describe its trigger, so a screen " +
        "reader won't read the tooltip: Tab reaches nothing in the trigger, " +
        "or what it reaches doesn't carry the aria-describedby that points " +
        'at the tooltip. Pass one element that takes focus and passes ' +
        'aria-describedby on to its DOM node, such as a button, a link or a ' +
        'Span with tabIndex={0}.'
    );
  });

  const hover = useHoverOpen({
    // The pointer and focus as they are. `active` shows it on top of that, so
    // dropping `active` leaves it shown while the pointer or focus holds it.
    // An ask to close can come while it's already hidden, which is no change.
    open: isVisible,
    onOpenChange: setIsVisible,
    openDelay: delay,
    closeDelay,
    // The wrapper stands in for the trigger. It holds only the children and
    // the tooltip, and nothing in the tooltip takes focus, so focus anywhere
    // in it is focus on the trigger.
    triggerRef: wrapperRef,
    floatingRef: contentRef,
    // Escape hides it and carries on, so a control in the trigger, or a
    // Modal around it, still gets the key.
    consumeEscape: false,
    openOnTap,
  });

  // Auto-placement and overflow correction
  useLayoutEffect(() => {
    const isAuto = position === 'auto';

    if (!isAuto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- layout measurement effect resolves placement
      setResolvedPosition(position);
    }

    const showing = isVisible || alwaysActive;
    if (!showing) {
      setContentStyle({});
      return;
    }

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const margin = 40;
    const edgePadding = 8; // minimum distance from viewport edge

    // Step 1: determine position (auto mode only)
    if (isAuto) {
      const spaceTop = wrapperRect.top;
      const spaceBottom = window.innerHeight - wrapperRect.bottom;

      if (spaceTop >= margin) {
        setResolvedPosition('top');
      } else if (spaceBottom >= margin) {
        setResolvedPosition('bottom');
      } else if (window.innerWidth - wrapperRect.right >= wrapperRect.left) {
        setResolvedPosition('right');
      } else {
        setResolvedPosition('left');
      }
    }

    // Step 2: measure tooltip content and correct overflow.
    // Use requestAnimationFrame so the resolved position class is applied first.
    requestAnimationFrame(() => {
      const contentEl = contentRef.current;
      if (!contentEl) return;

      const contentRect = contentEl.getBoundingClientRect();
      const style: React.CSSProperties = {};

      // For top/bottom positions, tooltip is centered horizontally via CSS
      // (left: 50%; transform: translateX(-50%)).
      // Check if it overflows left or right and apply a corrective shift.
      const pos = isAuto ? undefined : position; // read from state won't be updated yet in auto
      const effectivePos = pos || 'top'; // fallback, actual is set by state
      const isVertical =
        effectivePos === 'top' ||
        effectivePos === 'bottom' ||
        resolvedPosition === 'top' ||
        resolvedPosition === 'bottom';

      if (isVertical) {
        if (contentRect.left < edgePadding) {
          // Overflows left — shift right
          const shift = edgePadding - contentRect.left;
          style.left = `calc(50% + ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${-shift}px`;
        } else if (contentRect.right > window.innerWidth - edgePadding) {
          // Overflows right — shift left
          const shift = contentRect.right - (window.innerWidth - edgePadding);
          style.left = `calc(50% - ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${shift}px`;
        }
      } else {
        // For left/right positions, tooltip is centered vertically via CSS
        // (top: 50%; transform: translateY(-50%)).
        if (contentRect.top < edgePadding) {
          const shift = edgePadding - contentRect.top;
          style.top = `calc(50% + ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${-shift}px`;
        } else if (contentRect.bottom > window.innerHeight - edgePadding) {
          const shift = contentRect.bottom - (window.innerHeight - edgePadding);
          style.top = `calc(50% - ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${shift}px`;
        }
      }

      setContentStyle(style);
    });
  }, [position, resolvedPosition, isVisible, alwaysActive, label, content]);

  // Generate Bulma classes
  const tooltipClasses = usePrefixedClassNames('tooltip', {
    'is-active': alwaysActive || isVisible,
    // Open by the pointer, focus or a tap, rather than shown by `active`
    // alone: only then does the tooltip, and the gap to it, take the pointer.
    'is-open': isVisible,
    [`is-${resolvedPosition}`]: resolvedPosition,
    [`is-${color}`]: color,
    [`is-${size}`]: size,
    'is-multiline': multiline,
    'is-animated': animated,
    'is-square': square,
    'is-dashed': dashed,
  });

  const combinedClasses = classNames(
    tooltipClasses,
    bulmaHelperClasses,
    className
  );
  const combinedTooltipClasses = usePrefixedClassNames(
    'tooltip-content',
    tooltipClassName
  );

  return (
    // The tooltip is inside the wrapper, so the pointer on it is still on the
    // wrapper, and the stylesheet bridges the gap between them.
    <span
      ref={wrapperRef}
      className={combinedClasses}
      onPointerEnter={chain(onPointerEnter, hover.onPointerEnter)}
      onPointerOver={chain(onPointerOver, hover.onPointerOver)}
      onPointerLeave={chain(onPointerLeave, hover.onPointerLeave)}
      onFocus={chain(onFocus, hover.onFocus)}
      onBlur={chain(onBlur, hover.onBlur)}
      onPointerDown={chain(onPointerDown, hover.onPointerDown)}
      onPointerUp={chain(onPointerUp, hover.onPointerUp)}
      {...(label ? { 'data-tooltip': label } : {})}
      {...attrs}
    >
      {linkable
        ? cloneElement(children, {
            'aria-describedby': withId(
              children.props['aria-describedby'],
              tooltipId
            ),
          })
        : children}
      <span
        ref={contentRef}
        id={tooltipId}
        className={combinedTooltipClasses}
        // Hidden by `visibility: hidden` in the stylesheet, which keeps it out
        // of the accessibility tree and still lets it describe the trigger
        // (accname step 2A), so it takes no aria-hidden.
        role="tooltip"
        style={Object.keys(contentStyle).length > 0 ? contentStyle : undefined}
      >
        {content || label}
      </span>
    </span>
  );
};

export default Tooltip;
