import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, type ButtonOwnProps } from '../elements/Button';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { warnOnce } from '../helpers/devWarnings';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';

// Spelled out so the API page can list the values. The tests hold it to
// ToggleButton's, since the checked segment fills the way a pressed toggle
// does and for the same reasons.
/**
 * The fills the checked segment takes: `Button`'s colors, minus `text` and
 * `ghost`, which don't fill, and `white`, `light`, `dark` and `black`, which in
 * one theme or the other fill about as light or dark as an unchecked segment
 * already is. The same set `ToggleButton` takes.
 */
export type SegmentedControlColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** A mounted segment, as the group needs to know it for the tab stop. */
interface SegmentRecord {
  value: string;
  disabled: boolean;
  node: HTMLButtonElement;
}

interface SegmentedControlContextValue {
  /** The checked segment's value, or `undefined` while none is. */
  checked: string | undefined;
  /** The segment that holds `tabIndex={0}`, or `undefined` for none. */
  tabStop: string | undefined;
  /** The fill the checked segment takes. */
  color: SegmentedControlColor;
  /** Checks a segment, unless it's checked already. */
  select: (value: string) => void;
  /** Records which segment has focus, so the tab stop can follow it. */
  setFocused: (value: string | undefined) => void;
  register: (record: SegmentRecord) => () => void;
}

// Not exported, so it stays out of the public API that `index.ts` re-exports.
const SegmentedControlContext =
  createContext<SegmentedControlContextValue | null>(null);

/** Sorts mounted segments into the order they sit in the page. */
const inDocumentOrder = (a: SegmentRecord, b: SegmentRecord) =>
  a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;

/** How far each arrow key moves along the row. */
const STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * The segment a key moves to, found among the segments of the same group in
 * DOM order, skipping disabled ones and wrapping at either end. `undefined`
 * for a key the group leaves alone, when no enabled segment is left, or when
 * the segment isn't inside its row in the page, as a portaled one isn't.
 */
function segmentFor(
  current: HTMLButtonElement,
  key: string
): HTMLButtonElement | undefined {
  const group = current.closest('[role="radiogroup"]');
  if (!group) return undefined;
  const segments = Array.from(
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]')
  );
  const enabled = segments.filter(segment => !segment.disabled);

  if (key === 'Home') return enabled[0];
  if (key === 'End') return enabled[enabled.length - 1];

  const step = STEPS[key];
  if (!step) return undefined;
  const at = segments.indexOf(current);
  for (let i = 1; i <= segments.length; i += 1) {
    const candidate =
      segments[(at + step * i + segments.length) % segments.length];
    if (!candidate.disabled) return candidate;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// SegmentedControl (root)
// ---------------------------------------------------------------------------

/**
 * Props for the SegmentedControl component. The helper props, the other `<div>`
 * attributes and the `ref` all land on the row.
 *
 * @extraProp {string} [aria-label] - Names the group for a screen reader, such as "Text alignment". A radio group needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither.
 * @extraProp {string} [aria-labelledby] - The id of a visible heading or label that names the group, in place of `aria-label`.
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the row's `<div>`.
 */
export interface SegmentedControlProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onChange' | 'defaultValue' | 'color' | 'role'
    >,
    Omit<
      BulmaClassesProps,
      'color' | 'colorShade' | 'backgroundColor' | 'backgroundColorShade'
    > {
  /**
   * The checked segment's `value`, when you hold the state. Setting it makes
   * the group controlled: picking a segment only calls `onChange`, and nothing
   * changes until you pass the new value. `null` checks nothing. Pick this or
   * `defaultValue` for the group's lifetime.
   */
  value?: string | null;
  /**
   * The segment checked to begin with, when the group holds its own state.
   * Leave it out and nothing is checked until someone picks one, and Tab
   * lands on the first enabled segment meanwhile.
   */
  defaultValue?: string;
  /**
   * Called with the newly checked segment's `value`, whether or not `value`
   * is set. The arrow keys, Home and End check the segment they move to, so
   * each of those calls it too: the check follows focus, as in a native radio
   * group. Pressing the checked segment again doesn't call it, since a
   * segmented control can't be cleared: one stays checked once one is.
   */
  onChange?: (value: string) => void;
  /**
   * The checked segment's fill. The others are plain buttons, so the fill is
   * the difference people see. Takes the same colors as `ToggleButton`, for
   * the same reason: `white`, `light`, `dark` and `black` fill about as light
   * or dark as a plain button already is in one theme or the other.
   */
  color?: SegmentedControlColor;
  /** Size of every segment, through Bulma's `are-<size>` on the row. */
  size?: 'small' | 'medium' | 'large';
  /**
   * Joins the segments into one row with no gap between them, Bulma's
   * `has-addons`. Set it to `false` for separate buttons.
   */
  hasAddons?: boolean;
  /** Centers the row. */
  isCentered?: boolean;
  /** Aligns the row to the right. */
  isRight?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** The `SegmentedControl.Segment`s, each with a `value` of its own. */
  children?: React.ReactNode;
}

/**
 * The `SegmentedControl` component renders a row of buttons where only one can be on, and tells a screen reader it's a radio group.
 *
 * It's Bulma's `.buttons.has-addons` row, with the checked segment filled and
 * marked `is-selected`, the way Bulma's button docs show it. To a screen
 * reader it's `role="radiogroup"`, with `role="radio"` and `aria-checked` on
 * each segment, which is how the APG toolbar example marks its alignment
 * buttons. The keys follow the APG radio group: the row is one tab stop, the
 * arrow keys move to the next or previous enabled segment and check it,
 * wrapping at either end, Home and End go to the first and last, and Space
 * checks the focused segment. Once a segment is checked, one always is.
 *
 * It carries no form value. A choice that's sent with a form is `Radios`.
 *
 * @function
 * @param {SegmentedControlProps} props - Props for the SegmentedControl component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the row's `<div>`.
 * @returns {JSX.Element} The rendered segmented control.
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/radio/ | APG radio group pattern}
 * @see {@link https://bulma.io/documentation/elements/button/#list-of-buttons | Bulma list of buttons}
 *
 * @example
 * <SegmentedControl aria-label="Text alignment" defaultValue="left">
 *   <SegmentedControl.Segment value="left">Left</SegmentedControl.Segment>
 *   <SegmentedControl.Segment value="center">Center</SegmentedControl.Segment>
 *   <SegmentedControl.Segment value="right">Right</SegmentedControl.Segment>
 * </SegmentedControl>
 */
const SegmentedControlRoot = forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl(
    {
      value,
      defaultValue,
      onChange,
      color = 'link',
      size,
      hasAddons = true,
      isCentered,
      isRight,
      className,
      children,
      ...props
    },
    ref
  ) {
    const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

    // Controlled vs uncontrolled, as in Tabs and Collapses.
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const checked = isControlled ? (value ?? undefined) : internalValue;

    const select = (next: string) => {
      if (next === checked) return;
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    };

    // The segments mount and register from an effect, so the group knows
    // which can hold the tab stop wherever in the tree they sit.
    const [segments, setSegments] = useState<SegmentRecord[]>([]);
    const register = useCallback((record: SegmentRecord) => {
      setSegments(prev => [...prev, record]);
      return () => setSegments(prev => prev.filter(r => r !== record));
    }, []);
    const [focused, setFocused] = useState<string | undefined>();

    // The first enabled segment in the page, sorted when it's read rather
    // than when a segment registers, so reordered segments are seen too. It's
    // read after the commit: a render runs before React moves the nodes, so
    // sorting there would find the old order.
    const [firstEnabled, setFirstEnabled] = useState<string | undefined>();
    useClientLayoutEffect(() => {
      const inPage = segments.filter(s => !s.disabled).sort(inDocumentOrder);
      setFirstEnabled(inPage[0]?.value);
    }, [segments, children]);

    // One tab stop for the row (roving tabindex). While focus is in the row
    // the stop follows it, so Tab leaves from wherever focus is even when a
    // controlled group hasn't taken the new value. Otherwise it's the checked
    // segment, or the first enabled one when none is checked or the checked
    // one is disabled. Before the segments register (the server render and
    // the first client render) the checked one holds it, so a row with
    // nothing checked has no stop until the client has rendered.
    const canHoldStop = (candidate: string | undefined) =>
      segments.some(s => !s.disabled && s.value === candidate);
    let tabStop: string | undefined;
    if (canHoldStop(focused)) tabStop = focused;
    else if (segments.length === 0 || canHoldStop(checked)) tabStop = checked;
    else tabStop = firstEnabled;

    const named = Boolean(rest['aria-label'] || rest['aria-labelledby']);
    useEffect(() => {
      if (!named) {
        warnOnce(
          'SegmentedControl:unnamed',
          '[bestax-bulma] <SegmentedControl> has no accessible name. Pass ' +
            'aria-label or aria-labelledby, so a screen reader can say what ' +
            'the choice is.'
        );
      }
    }, [named]);

    const rowClasses = usePrefixedClassNames('buttons', {
      'has-addons': hasAddons,
      'is-centered': isCentered,
      'is-right': isRight,
      [`are-${size}`]: size,
    });

    // The props are spread first, so the role a screen reader relies on wins
    // over anything a JavaScript caller or a spread object passes along.
    return (
      <SegmentedControlContext.Provider
        value={{ checked, tabStop, color, select, setFocused, register }}
      >
        <div
          {...rest}
          ref={ref}
          role="radiogroup"
          className={classNames(rowClasses, bulmaHelperClasses, className)}
        >
          {children}
        </div>
      </SegmentedControlContext.Provider>
    );
  }
);

// ---------------------------------------------------------------------------
// SegmentedControl.Segment
// ---------------------------------------------------------------------------

/**
 * Props for SegmentedControl.Segment. The helper props, the other button
 * attributes and the `ref` all land on the `<button>`.
 *
 * Some of `Button`'s props are left out on purpose. `as`, `type`, `role` and
 * `tabIndex`, since a segment is always a `<button type="button" role="radio">`
 * and the group decides which segment Tab reaches. `color`, which the group
 * sets for the checked segment, and the props that change the fill
 * (`isActive`, `isLight`, `isOutlined`, `isInverted`, `textColor`, `bgColor`
 * and their shades), since each would color it whether checked or not. `size`
 * and the width and shape props, which the row sets for every segment. And
 * `isStatic` and `isLoading`, a segment you couldn't pick.
 *
 * @extraProp {React.Ref<HTMLButtonElement>} [ref] - Ref forwarded to the `<button>`.
 */
export interface SegmentedControlSegmentProps
  extends
    Omit<
      ButtonOwnProps,
      | 'color'
      | 'size'
      | 'isActive'
      | 'isStatic'
      | 'isLoading'
      | 'isLight'
      | 'isOutlined'
      | 'isInverted'
      | 'isRounded'
      | 'isFullwidth'
      | 'isFullWidth'
      | 'textColor'
      | 'bgColor'
      | 'colorShade'
      | 'backgroundColorShade'
    >,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      | keyof ButtonOwnProps
      | 'type'
      | 'value'
      | 'role'
      | 'tabIndex'
      | 'aria-checked'
      | 'aria-pressed'
    > {
  /**
   * **Required.** What `onChange` reports when this segment is checked, and
   * what the group's `value` and `defaultValue` name it by. Unique within the
   * group.
   */
  value: string;
  /**
   * The label. An icon on its own needs an `aria-label`, so a screen reader
   * has something to say.
   */
  children?: React.ReactNode;
  /**
   * Disables the segment, the same as `disabled`: it can't be clicked, the
   * arrow keys, Home and End skip it, and it never holds the row's tab stop.
   * A checked one keeps its fill under Bulma's disabled look.
   */
  isDisabled?: boolean;
  /**
   * Not accepted: `aria-checked` follows the group's value. Declared because
   * JSX lets a hyphenated attribute through when the props don't name it.
   * @internal
   */
  'aria-checked'?: never;
  /**
   * Not accepted: a segment is a radio, which says checked, not pressed.
   * @internal
   */
  'aria-pressed'?: never;
}

/**
 * One option in the row: a `<button role="radio">` that's checked while the group's value is its `value`, filled with the group's `color` and marked `is-selected`.
 *
 * @function
 * @param {SegmentedControlSegmentProps} props - Props for the segment.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the `<button>`.
 * @returns {JSX.Element} The rendered segment.
 */
const Segment = forwardRef<HTMLButtonElement, SegmentedControlSegmentProps>(
  function Segment(
    {
      value,
      isDisabled,
      disabled,
      className,
      onClick,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const ctx = useContext(SegmentedControlContext);
    const checked = ctx !== null && ctx.checked === value;
    const off = Boolean(isDisabled || disabled);

    // Prefixed like Button's own classes, which a hand-written
    // `className="is-selected"` could not be under ConfigProvider classPrefix.
    // Bulma lifts `is-selected` above its neighbours in `.buttons.has-addons`.
    const selectedClass = usePrefixedClassNames({ 'is-selected': checked });

    const nodeRef = useRef<HTMLButtonElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        nodeRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const register = ctx?.register;
    useEffect(() => {
      if (!register) {
        warnOnce(
          'SegmentedControl.Segment:outside',
          '[bestax-bulma] <SegmentedControl.Segment> is outside a ' +
            '<SegmentedControl>, so nothing can check it. Put it inside one.'
        );
        return undefined;
      }
      return register({
        value,
        disabled: off,
        node: nodeRef.current as HTMLButtonElement,
      });
    }, [register, value, off]);

    // The caller's onClick runs first, so a `preventDefault()` there keeps
    // the segment from being checked. A disabled button gets no click.
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      ctx?.select(value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (
        !ctx ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const target = segmentFor(event.currentTarget, event.key);
      if (!target) return;
      event.preventDefault();
      target.focus();
      // The check follows focus, APG's rule for a radio group outside a
      // toolbar. It goes through a click on the segment, as a native radio's
      // does, so its onClick sees it. Inside a toolbar the arrows would move
      // focus alone; that is the line a toolbar would change.
      target.click();
    };

    const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
      onFocus?.(event);
      ctx?.setFocused(value);
    };

    // The segment focus moves to, if any, records itself straight after.
    const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
      onBlur?.(event);
      ctx?.setFocused(undefined);
    };

    // The props are spread first, so what a radio depends on wins over
    // anything a JavaScript caller or a spread object passes along: it stays
    // a button, never submits, reports whether it's checked, and the group
    // decides whether Tab reaches it.
    return (
      <Button
        {...props}
        ref={setRefs}
        as="button"
        type="button"
        role="radio"
        aria-checked={checked}
        tabIndex={ctx ? (ctx.tabStop === value ? 0 : -1) : undefined}
        isDisabled={off}
        color={checked ? ctx.color : undefined}
        className={classNames(selectedClass, className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }
);

Segment.displayName = 'SegmentedControl.Segment';

export const SegmentedControl = withSubComponents(
  SegmentedControlRoot,
  { Segment },
  'SegmentedControl'
);

export default SegmentedControl;
