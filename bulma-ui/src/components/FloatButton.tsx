import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Affix, type AffixPosition } from './Affix';
import { Tooltip } from './Tooltip';
import {
  FloatButtonContext,
  type FloatButtonPlacement,
  tooltipSide,
} from './floatButtonContext';
import {
  Button,
  type ButtonOwnProps,
  type ButtonProps,
} from '../elements/Button';
import {
  IconButton,
  type IconButtonName,
  type IconButtonOwnProps,
  type IconButtonProps,
} from '../elements/IconButton';
import { buttonType } from '../helpers/buttonType';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { warnOnce } from '../helpers/devWarnings';
import { hasText, iconFromProp, iconOf } from '../helpers/iconGlyph';
import type { PolymorphicComponent } from '../helpers/polymorphic';
import { getActiveElementInTree, isEventInside } from '../helpers/shadowDom';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { chain, useHoverOpen } from '../helpers/useHoverOpen';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { useLatestRef } from '../helpers/useLatestRef';
import {
  enabledMenuItems,
  isEnabledMenuItem,
  MENU_ITEM_SELECTOR,
  useMenuKeys,
} from '../helpers/useMenuKeys';
import { withSubComponents } from '../helpers/withSubComponents';

/** A FloatButton's size; unset, it's Bulma's normal button, 40px across. */
export type FloatButtonSize = 'small' | 'normal' | 'medium' | 'large';

/** The way a speed dial's actions run from its trigger, on the screen. */
export type FloatButtonSpeedDialDirection = 'up' | 'down' | 'left' | 'right';

/**
 * FloatButton's own props, on top of the `IconButton` props it passes on:
 * `icon` (an Icon name or a node), `isLoading`, `as` and the rest, and the
 * name, `aria-label` or `aria-labelledby`, which the types require.
 */
export interface FloatButtonOwnProps {
  /**
   * Prints the `aria-label` beside the icon as the button's text, a pill
   * (MUI's extended FAB), in place of the tooltip, for touch screens, where
   * a tooltip never shows. It renders through `Button` then, with no
   * `aria-label` attribute, since the text names it. A development build
   * warns when there's no `aria-label` to print, as with `aria-labelledby`,
   * and the button stays an icon.
   */
  showLabel?: boolean;
  /** Bulma color, as `Button`'s. Unset, it's Bulma's default button. */
  color?: ButtonOwnProps['color'];
  /**
   * `'small'` (30px), `'normal'` (40px, the same as unset), `'medium'`
   * (50px) or `'large'` (60px), as `Button`'s.
   */
  size?: FloatButtonSize;
  /**
   * The corner it's fixed to, as `Affix`'s. Inside `FloatButtons` or a
   * `FloatButton.SpeedDial`, which place it, it's ignored.
   * @defaultValue 'bottom-right'
   */
  position?: AffixPosition;
  /**
   * Renders it into another container, as `Affix`'s `portal` does. Inside
   * `FloatButtons` or a `FloatButton.SpeedDial` it's ignored.
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/**
 * Props for the FloatButton component. The other `IconButton` props, the
 * attributes and the `ref` land on the button, which follows `as` as
 * `IconButton` does. The `aria-label` is also the tooltip's text. Inside a
 * `FloatButton.SpeedDial` it renders `role="menuitem"` and `tabIndex={-1}`.
 *
 * @extraProp {string} [type='button'] - On a `<button>`, `'button'`, `'submit'` or `'reset'`, and `'button'` unless you pass one of the other two, as on `IconButton`.
 * @extraProp {PolymorphicRef<React.ElementType>} [ref] - Ref forwarded to the element `as` renders, typed from `as`.
 */
export type FloatButtonProps<T extends React.ElementType = 'button'> =
  FloatButtonOwnProps &
    Omit<
      IconButtonOwnProps,
      keyof FloatButtonOwnProps | 'isRounded' | 'isFullwidth' | 'isFullWidth'
    > &
    IconButtonName &
    Omit<
      React.ComponentPropsWithoutRef<T>,
      | keyof IconButtonOwnProps
      | keyof FloatButtonOwnProps
      | 'aria-label'
      | 'aria-labelledby'
      | 'as'
    > & {
      /**
       * Render as a `<button>`, an `<a>`, or a custom component such as a
       * router `Link`, as on `IconButton`.
       * @defaultValue 'button'
       */
      as?: T;
    };

/**
 * The shape the implementation destructures. The public contract is the
 * generic `FloatButtonProps<T>` above, and the body can't see through `T`, so
 * it reads the widest form of the props it touches.
 */
type FloatButtonImplProps = FloatButtonOwnProps &
  IconButtonOwnProps & {
    as?: React.ElementType;
    type?: unknown;
    'aria-label'?: string;
    'aria-labelledby'?: string;
  };

/**
 * Sets `ownRef` and the ref a consumer forwarded to `node`. A callback ref
 * that returns a cleanup, as React 19 allows, has it held in `cleanupRef`
 * and run when the node goes, in place of a call with `null`, on React 18
 * as well; a callback that returns none gets `null`, as React gives it.
 */
function attachRefs<T>(
  node: T | null,
  ownRef: React.MutableRefObject<T | null>,
  forwardedRef: React.ForwardedRef<T>,
  cleanupRef: React.MutableRefObject<(() => void) | null>
): void {
  ownRef.current = node;
  if (typeof forwardedRef === 'function') {
    if (node === null) {
      const cleanup = cleanupRef.current;
      cleanupRef.current = null;
      if (cleanup) cleanup();
      else forwardedRef(null);
      return;
    }
    const cleanup: unknown = forwardedRef(node);
    cleanupRef.current =
      typeof cleanup === 'function' ? (cleanup as () => void) : null;
  } else if (forwardedRef) {
    forwardedRef.current = node;
  }
}

/** What a float button takes inside a speed dial's menu, after its own props. */
const MENU_ITEM = { role: 'menuitem', tabIndex: -1 } as const;

/**
 * The `FloatButton` component renders a round icon button that floats in a corner of the screen, with its name as a tooltip.
 *
 * It's an `IconButton` with `isRounded`, which is a circle at every size,
 * inside an `Affix` in its corner, and it takes what `IconButton` takes. Its
 * name, `aria-label` or `aria-labelledby`, is required, and the `aria-label`
 * shows as a tooltip on hover and keyboard focus that a screen reader
 * doesn't read a second time. Several in one corner go in `FloatButtons`,
 * a trigger that opens a few related actions is `FloatButton.SpeedDial`, and
 * `FloatButton.BackToTop` scrolls back to the top of the page.
 *
 * @function
 * @param {FloatButtonProps} props - Props for the FloatButton component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The button, in its Affix unless something places it.
 *
 * @example
 * <FloatButton aria-label="New message" icon="pen" color="primary" />
 */
const FloatButtonBase = forwardRef(function FloatButton(
  props: FloatButtonProps,
  ref: React.Ref<HTMLElement>
) {
  const {
    showLabel,
    position = 'bottom-right',
    portal = false,
    className,
    ...rest
  } = props as FloatButtonImplProps;
  const placement = useContext(FloatButtonContext);
  const floatButtonClass = usePrefixedClassNames('float-button');
  const label = rest['aria-label'];
  const wantsLabel = Boolean(showLabel || placement?.showLabels);
  const printed = wantsLabel && hasText(label);

  useEffect(() => {
    if (wantsLabel && !printed) {
      warnOnce(
        'FloatButton:show-label-without-text',
        '[bestax-bulma] <FloatButton> was asked to show its label, but it ' +
          'has no aria-label to print, as when aria-labelledby names it, so ' +
          'it shows the icon alone. Name it with aria-label to print it.'
      );
    }
  }, [wantsLabel, printed]);

  const classes = classNames(floatButtonClass, className);
  const itemProps = placement?.inMenu ? MENU_ITEM : undefined;
  let button: React.ReactNode;

  if (printed) {
    // The text names it, so the button takes no aria-label and no tooltip,
    // and it's a Button, since an IconButton warns on text.
    const {
      icon,
      children,
      'aria-label': _name,
      'aria-labelledby': _labelledBy,
      ...buttonProps
    } = rest;
    const tag = rest.as ?? 'button';
    button = (
      <Button
        // Polymorphic through to Button, as IconButton is, so the props and
        // the ref are read at Button's default element.
        {...(buttonProps as ButtonProps)}
        {...(tag === 'button' ? { type: buttonType(rest.type) } : undefined)}
        {...itemProps}
        ref={ref as React.Ref<HTMLButtonElement>}
        isRounded
        className={classes}
      >
        {iconFromProp(icon) ?? iconOf(children)}
        <span>{label}</span>
      </Button>
    );
  } else {
    button = (
      <IconButton
        {...(rest as IconButtonProps)}
        {...itemProps}
        ref={ref as React.Ref<HTMLButtonElement>}
        isRounded
        className={classes}
      />
    );
    // A name from aria-labelledby is on the page already, so it gets none.
    if (hasText(label)) {
      button = (
        <Tooltip
          label={label}
          describesTrigger={false}
          position={placement?.tooltipPosition ?? tooltipSide(position)}
        >
          {button}
        </Tooltip>
      );
    }
  }

  if (placement) return button;
  return (
    <Affix position={position} portal={portal}>
      {button}
    </Affix>
  );
}) as PolymorphicComponent<
  FloatButtonOwnProps &
    Omit<
      IconButtonOwnProps,
      keyof FloatButtonOwnProps | 'isRounded' | 'isFullwidth' | 'isFullWidth'
    > &
    IconButtonName,
  'button'
>;

FloatButtonBase.displayName = 'FloatButton';

/** FloatButton.SpeedDial's own props. */
export interface FloatButtonSpeedDialOwnProps extends Omit<
  BulmaClassesProps,
  'color' | 'backgroundColor' | 'size'
> {
  /**
   * The trigger's icon, as IconButton's `icon`: an Icon name or a node.
   * Decorative, since the name says what it does. To swap it while the dial
   * is open, pass a different one from a controlled `open`.
   */
  icon?: React.ReactNode;
  /** The trigger's Bulma color, as `Button`'s. */
  color?: ButtonOwnProps['color'];
  /** The trigger's size; the actions take their own. */
  size?: FloatButtonSize;
  /** `FloatButton`s, the actions, nearest the trigger first. */
  children?: React.ReactNode;
  /** Whether the actions are shown. Controlled; pair it with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the actions are shown at first, uncontrolled.
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /** Called with the new state when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Also opens when the pointer rests on it, after a short delay, through
   * the hook under HoverCard and Tooltip, and closes once the pointer and
   * focus have left the trigger and the actions. The pointer only: keyboard
   * focus on the trigger never opens it, and a touch pointer doesn't either.
   * Activation still toggles it, which is how the keyboard opens it, so a
   * click on a dial the pointer opened closes it. It isn't Dropdown's
   * `hoverable`, which opens on hover in place of a click, through CSS
   * alone: this opens on hover as well as a click, and the open state,
   * `aria-expanded` and `onOpenChange` follow it.
   * @defaultValue false
   */
  openOnHover?: boolean;
  /**
   * Closes the dial when an action is clicked, or activated with Enter or
   * Space, and hands focus back to the trigger, as Dropdown's does. Off,
   * the dial stays open and focus stays on the action.
   * @defaultValue true
   */
  closeOnClick?: boolean;
  /**
   * The way the actions run from the trigger, on the screen, in
   * right-to-left text too. The arrow key that points that way moves away
   * from the trigger. Unset, it's `'up'` from a bottom corner and `'down'`
   * from a top one.
   */
  direction?: FloatButtonSpeedDialDirection;
  /**
   * Prints every action's `aria-label` beside it, as each one's `showLabel`
   * does, for touch screens, where a tooltip never shows. Unset inside
   * `FloatButtons`, it's the stack's `showLabels`.
   * @defaultValue false
   */
  showLabels?: boolean;
  /**
   * The corner, as `Affix`'s. Inside `FloatButtons`, which places it, it's
   * ignored.
   * @defaultValue 'bottom-right'
   */
  position?: AffixPosition;
  /**
   * As `Affix`'s `portal`. Inside `FloatButtons` it's ignored.
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/**
 * Props for FloatButton.SpeedDial: a trigger that opens a menu of actions.
 * Its name, `aria-label` or `aria-labelledby` (IconButton's `IconButtonName`,
 * required the same way), goes on the trigger and names the menu too. The
 * helper props, the other attributes and the `ref` land on its root `<div>`,
 * as Dropdown's do.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root `<div>`.
 */
export type FloatButtonSpeedDialProps = FloatButtonSpeedDialOwnProps &
  IconButtonName &
  Omit<
    React.HTMLAttributes<HTMLDivElement>,
    | keyof FloatButtonSpeedDialOwnProps
    | 'color'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** The arrow key that points from the trigger along each direction. */
const ALONG = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
} as const;

/** The arrow key that points back at the trigger from each direction. */
const AGAINST = {
  up: 'ArrowDown',
  down: 'ArrowUp',
  left: 'ArrowRight',
  right: 'ArrowLeft',
} as const;

/** Focuses the nearest action (`'first'`) or the farthest (`'last'`). */
function focusEdgeAction(menu: HTMLElement, edge: 'first' | 'last') {
  const items = enabledMenuItems(menu);
  items[edge === 'first' ? 0 : items.length - 1]?.focus();
}

/** How long the pointer rests on the trigger before `openOnHover` opens it, in milliseconds. */
const HOVER_OPEN_DELAY = 100;
/** How long the dial waits once the pointer and focus have left before closing, in milliseconds. */
const HOVER_CLOSE_DELAY = 300;

/**
 * The `FloatButton.SpeedDial` component is a float button that opens a menu of related actions, which are FloatButtons.
 *
 * It's an APG menu button, on Dropdown's model. Activation opens it: Enter
 * and Space toggle it and open it on the nearest action, the arrow that
 * points along the dial opens it on the nearest action, and the opposite
 * arrow on the farthest. In the menu, the arrow pointing away from the
 * trigger moves away from it and the other moves back, Home and End go to
 * the nearest and farthest actions, and typing a letter moves to the next
 * action whose visible text starts with it, which an icon alone has none
 * of, so it finds actions with `showLabels`. Escape closes it and focuses the
 * trigger, Tab closes it and lets focus move on, and a press outside closes
 * it. Activating an action runs its `onClick`, closes the dial and hands
 * focus back to the trigger. Closed, the actions aren't rendered.
 *
 * @function
 * @param {FloatButtonSpeedDialProps} props - Props for FloatButton.SpeedDial.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the root `<div>`.
 * @returns {JSX.Element} The dial, in its Affix unless `FloatButtons` places it.
 *
 * @example
 * <FloatButton.SpeedDial aria-label="Create" icon="plus" color="primary">
 *   <FloatButton aria-label="Note" icon="note-sticky" onClick={newNote} />
 *   <FloatButton aria-label="Task" icon="check" onClick={newTask} />
 * </FloatButton.SpeedDial>
 */
export const FloatButtonSpeedDial = forwardRef<
  HTMLDivElement,
  FloatButtonSpeedDialProps
>(function FloatButtonSpeedDial(
  {
    icon,
    color,
    size,
    children,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    openOnHover = false,
    closeOnClick = true,
    direction: directionProp,
    showLabels: showLabelsProp,
    position: positionProp = 'bottom-right',
    portal = false,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
  },
  ref
) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const outer = useContext(FloatButtonContext);
  const position = outer?.position ?? positionProp;
  const showLabels = showLabelsProp ?? outer?.showLabels ?? false;
  const direction =
    directionProp ?? (position.startsWith('top') ? 'down' : 'up');
  const sideways = direction === 'left' || direction === 'right';

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const requestOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!isControlled) setInternalOpen(next);
    },
    [isControlled, onOpenChange]
  );

  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // The action to focus once the menu has mounted, after a key opened it.
  const pendingFocusRef = useRef<'first' | 'last' | null>(null);
  // Tab was the last key pressed in the menu, which closes it once focus
  // has left.
  const tabbedRef = useRef(false);

  const refCleanupRef = useRef<(() => void) | null>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) =>
      attachRefs(node, rootRef, ref, refCleanupRef),
    [ref]
  );

  // A sideways dial lays its actions out by the writing direction the browser
  // computes, read here when it opens, so the stylesheet and the page agree
  // on which way is left, a `dir` attribute or a CSS `direction` alike.
  const [rtl, setRtl] = useState(false);
  useClientLayoutEffect(() => {
    if (!open || !sideways) return;
    const root = rootRef.current as HTMLDivElement;
    setRtl(getComputedStyle(root).direction === 'rtl');
  }, [open, sideways]);

  // The actions run in DOM order away from the trigger, so the arrow pointing
  // along the dial moves to the next and the one pointing back to the
  // previous, and the arrows across it do nothing. Up runs against the DOM
  // order, so it's reversed. Sideways, the hook reads Right as the next in
  // left-to-right text and Left in right-to-left, so a dial whose actions run
  // the other way on the screen is reversed.
  const menuKeys = useMenuKeys({
    orientation: sideways ? 'horizontal' : 'vertical',
    reverse: sideways ? (direction === 'left') !== rtl : direction === 'up',
  });

  const focusEdge = (edge: 'first' | 'last') =>
    focusEdgeAction(menuRef.current as HTMLElement, edge);

  // Once the menu has mounted, forget a search typed before it last closed,
  // and focus the action a key asked for.
  useEffect(() => {
    if (!open) return;
    menuKeys.reset();
    const edge = pendingFocusRef.current;
    pendingFocusRef.current = null;
    if (edge) focusEdgeAction(menuRef.current as HTMLElement, edge);
  }, [open, menuKeys]);

  // A key asks to open it on an edge, which the menu focuses once it has
  // mounted. A controlled parent can turn the ask down, and then the edge is
  // dropped once the event that asked is over, so a later open some other
  // way doesn't move focus into the menu.
  const openRef = useLatestRef(open);
  const openOnEdge = (edge: 'first' | 'last') => {
    pendingFocusRef.current = edge;
    requestOpen(true);
    setTimeout(() => {
      if (!openRef.current) pendingFocusRef.current = null;
    });
  };

  // Read when a press lands outside, so the listener stays put while
  // `requestOpen` changes identity with `onOpenChange`.
  const closeRef = useLatestRef(() => requestOpen(false));
  useEffect(() => {
    if (!open) return undefined;
    const doc = (rootRef.current as HTMLDivElement).ownerDocument;
    const handlePointerDown = (e: PointerEvent) => {
      // A press moves focus its own way, so a Tab before it no longer
      // decides what the next blur does.
      tabbedRef.current = false;
      if (!isEventInside(e, rootRef.current)) closeRef.current();
    };
    doc.addEventListener('pointerdown', handlePointerDown);
    return () => doc.removeEventListener('pointerdown', handlePointerDown);
  }, [open, closeRef]);

  // Hover opens it only with `openOnHover`, and only for the pointer. Off,
  // the hook is told the dial is closed, so it adds no Escape listener of
  // its own and asks for nothing.
  const hover = useHoverOpen({
    open: openOnHover && open,
    onOpenChange: requestOpen,
    openDelay: HOVER_OPEN_DELAY,
    closeDelay: HOVER_CLOSE_DELAY,
    triggerRef,
    floatingRef: menuRef,
    openOnFocus: false,
  });
  const hoverProps = openOnHover
    ? {
        onPointerEnter: chain(rest.onPointerEnter, hover.onPointerEnter),
        onPointerOver: chain(rest.onPointerOver, hover.onPointerOver),
        onPointerLeave: chain(rest.onPointerLeave, hover.onPointerLeave),
        onFocus: chain(rest.onFocus, hover.onFocus),
        onBlur: chain(rest.onBlur, hover.onBlur),
        onPointerDown: chain(rest.onPointerDown, hover.onPointerDown),
        onPointerUp: chain(rest.onPointerUp, hover.onPointerUp),
      }
    : undefined;

  const handleTriggerClick = () => {
    pendingFocusRef.current = null;
    requestOpen(!open);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const edge =
      e.key === ALONG[direction]
        ? 'first'
        : e.key === AGAINST[direction]
          ? 'last'
          : null;
    if (edge) {
      e.preventDefault();
      if (open) focusEdge(edge);
      else openOnEdge(edge);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // A held key sends a keydown per auto-repeat, and running an action
      // hands focus back here, so a held Enter would reopen the menu.
      if (e.repeat) return;
      if (open) requestOpen(false);
      else openOnEdge('first');
      return;
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      requestOpen(false);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Tab closes it once the browser has moved focus on, from the blur
    // below. Taken away first, the action that had focus loses its place,
    // and WebKit then starts the move from the dial rather than from it.
    tabbedRef.current = e.key === 'Tab';
    if (e.key === 'Escape') {
      if (e.defaultPrevented) return;
      e.preventDefault();
      requestOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === 'Tab') return;
    menuKeys.onKeyDown(e);
  };

  const handleMenuBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!tabbedRef.current) return;
    // Still in the menu: a handler kept Tab from moving focus out of it.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    tabbedRef.current = false;
    requestOpen(false);
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnClick) return;
    const menu = e.currentTarget;
    const item = (e.target as Element).closest(MENU_ITEM_SELECTOR);
    if (!item || !menu.contains(item) || !isEnabledMenuItem(item)) return;
    // Closing takes away the action that has focus, and the browser drops
    // focus to the page then, so it goes back to the trigger, as Escape
    // does. An action that moved focus somewhere else keeps it there.
    const hadFocus = menu.contains(getActiveElementInTree(menu));
    requestOpen(false);
    if (hadFocus) triggerRef.current?.focus();
  };

  // The actions' tooltips open off the line they run along. The trigger's
  // opens toward the page, as a lone button's does, which in FloatButtons'
  // column keeps it off the buttons above and below, and it's hidden while
  // the dial is open, since a sideways dial's actions take that side then.
  const actionTooltipPosition = tooltipSide(position, sideways);
  const menuPlacement = useMemo<FloatButtonPlacement>(
    () => ({
      position,
      tooltipPosition: actionTooltipPosition,
      inMenu: true,
      showLabels,
    }),
    [position, actionTooltipPosition, showLabels]
  );

  const dialClasses = usePrefixedClassNames('float-button-speed-dial', {
    [`is-${direction}`]: true,
    'is-active': open,
    'is-rtl': sideways && rtl,
  });
  const actionsClass = usePrefixedClassNames('float-button-actions');
  const floatButtonClass = usePrefixedClassNames('float-button');

  let trigger: React.ReactNode = (
    <IconButton
      ref={triggerRef}
      id={triggerId}
      icon={icon}
      color={color}
      size={size}
      isRounded
      className={floatButtonClass}
      {...({
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
      } as IconButtonName)}
      aria-haspopup="menu"
      aria-expanded={open}
      // Only while the menu is on the page, since closed it isn't rendered.
      aria-controls={open ? menuId : undefined}
      onClick={handleTriggerClick}
      onKeyDown={handleTriggerKeyDown}
    />
  );
  if (hasText(ariaLabel)) {
    trigger = (
      <Tooltip
        label={ariaLabel}
        describesTrigger={false}
        position={tooltipSide(position)}
      >
        {trigger}
      </Tooltip>
    );
  }

  const dial = (
    <div
      ref={setRefs}
      className={classNames(dialClasses, bulmaHelperClasses, className)}
      {...rest}
      {...hoverProps}
    >
      {trigger}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className={actionsClass}
          role="menu"
          // The trigger's name, or the element that names the trigger, since
          // a name from aria-labelledby isn't followed a second step.
          aria-labelledby={ariaLabelledBy || triggerId}
          aria-orientation={sideways ? 'horizontal' : undefined}
          // The menu, not the space between actions, takes focus from a
          // click there, so focus stays in the menu.
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          onBlur={handleMenuBlur}
          onClick={handleMenuClick}
        >
          <FloatButtonContext.Provider value={menuPlacement}>
            {children}
          </FloatButtonContext.Provider>
        </div>
      )}
    </div>
  );

  if (outer) return dial;
  return (
    <Affix position={position} portal={portal}>
      {dial}
    </Affix>
  );
});

/**
 * Props for FloatButton.BackToTop. The other `IconButton` props, the
 * attributes and the `ref` land on its `<button>`. Its name is optional:
 * it has a default, as `Delete`'s does.
 *
 * @extraProp {React.Ref<HTMLButtonElement>} [ref] - Ref forwarded to the `<button>`.
 */
export interface FloatButtonBackToTopProps
  extends
    FloatButtonOwnProps,
    Omit<
      IconButtonOwnProps,
      | keyof FloatButtonOwnProps
      | 'icon'
      | 'children'
      | 'isRounded'
      | 'isFullwidth'
      | 'isFullWidth'
    >,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      keyof IconButtonOwnProps | 'aria-label' | 'aria-labelledby'
    > {
  /**
   * The button's name, and its tooltip's text. Pass your own to translate
   * it. An empty one keeps the default rather than leaving the button
   * unnamed.
   * @defaultValue 'Back to top'
   */
  'aria-label'?: string;
  /** The id of an element whose text names it, in place of `aria-label`. No tooltip then. */
  'aria-labelledby'?: string;
  /** The icon. Unset, an up arrow drawn in `currentColor`, as Carousel's arrows are. */
  icon?: React.ReactNode;
  /**
   * How far the page, or `scrollContainer`, has to scroll before the button
   * shows, in pixels.
   * @defaultValue 400
   */
  visibilityHeight?: number;
  /**
   * The element that scrolls, when it isn't the window: an element, a ref,
   * or a `document.querySelector` selector. The button watches it and
   * scrolls it. It's found when the button mounts and when this prop
   * changes, so a ref whose element changes later isn't followed, and one
   * that finds nothing leaves the button on the window.
   */
  scrollContainer?: string | HTMLElement | React.RefObject<HTMLElement | null>;
  /**
   * Where focus goes after it scrolls, shaped like `useFocusTrap`'s
   * `restoreFocus`. `true` focuses the page's `<main>`, or the
   * `scrollContainer` when there is one, or else `<body>`; a ref focuses
   * that element; `false` moves none, so the button hides with focus on it
   * once the scroll is done, focus drops to the document, and the next Tab
   * starts wherever the browser decides. Focus moves with `preventScroll`,
   * at once, so it doesn't cut the scroll short. An element that can't take
   * focus gets `tabindex="-1"` until it loses it, so the next Tab goes on
   * from there.
   * @defaultValue true
   */
  moveFocus?: boolean | React.RefObject<HTMLElement | null>;
}

/** The default glyph: an up arrow in `currentColor`, which forced colors keep. */
const ArrowUp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 15 12 9 18 15" />
  </svg>
);

/** The element `scrollContainer` names, or `null` for the window. */
function scrollerOf(
  scrollContainer: FloatButtonBackToTopProps['scrollContainer'],
  doc: Document
): HTMLElement | null {
  if (!scrollContainer) return null;
  if (typeof scrollContainer === 'string') {
    return doc.querySelector<HTMLElement>(scrollContainer);
  }
  if ('current' in scrollContainer) return scrollContainer.current;
  return scrollContainer;
}

/**
 * Focuses `target` without scrolling to it. One that can't take focus, such
 * as a `<main>`, gets `tabindex="-1"` for as long as it has it, as skip-link
 * scripts do, so the next Tab starts from there.
 */
function focusTop(target: HTMLElement) {
  target.focus({ preventScroll: true });
  if (target.matches(':focus')) return;
  target.setAttribute('tabindex', '-1');
  target.addEventListener('blur', () => target.removeAttribute('tabindex'), {
    once: true,
  });
  target.focus({ preventScroll: true });
}

/**
 * The `FloatButton.BackToTop` component is a float button that shows once the page has scrolled down, and takes it back to the top.
 *
 * It renders nothing on the server, and after hydration a scroll listener
 * shows it past `visibilityHeight` and hides it above. Hidden, it keeps its
 * place in a `FloatButtons` stack, out of the Tab order and the
 * accessibility tree. Activated, it scrolls the page, or `scrollContainer`,
 * to the top, smoothly or at once when the user prefers reduced motion,
 * and moves focus to the top of the content (`moveFocus`), so the next Tab
 * starts there rather than back where the page was.
 *
 * @function
 * @param {FloatButtonBackToTopProps} props - Props for FloatButton.BackToTop.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the `<button>`.
 * @returns {JSX.Element | null} The button, or nothing until hydration.
 *
 * @example
 * <FloatButton.BackToTop />
 */
export const FloatButtonBackToTop = forwardRef<
  HTMLButtonElement,
  FloatButtonBackToTopProps
>(function FloatButtonBackToTop(
  {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    icon,
    visibilityHeight = 400,
    scrollContainer,
    moveFocus = true,
    onClick,
    className,
    ...props
  },
  ref
) {
  const hydrated = useIsHydrated();
  const [shown, setShown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  // Not `is-active`, which is Bulma's pressed button.
  const backToTopClass = usePrefixedClassNames('float-button-back-to-top', {
    'is-shown': shown,
  });

  const refCleanupRef = useRef<(() => void) | null>(null);
  const setRefs = useCallback(
    (node: HTMLButtonElement | null) =>
      attachRefs(node, buttonRef, ref, refCleanupRef),
    [ref]
  );

  // A passive listener, read once a frame at most, and once at the start.
  useEffect(() => {
    if (!hydrated) return undefined;
    const doc = (buttonRef.current as HTMLButtonElement).ownerDocument;
    const win = doc.defaultView as Window;
    const scroller = scrollerOf(scrollContainer, doc);
    const target: HTMLElement | Window = scroller ?? win;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        const top = scroller ? scroller.scrollTop : win.scrollY;
        setShown(top > visibilityHeight);
      });
    };
    onScroll();
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      win.cancelAnimationFrame(frame);
    };
  }, [hydrated, scrollContainer, visibilityHeight]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    const doc = e.currentTarget.ownerDocument;
    const win = doc.defaultView as Window;
    const scroller = scrollerOf(scrollContainer, doc);
    // Read now, since the browser's smooth scroll animates under reduced
    // motion too.
    const reduce = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    (scroller ?? win).scrollTo({
      top: 0,
      behavior: reduce ? 'instant' : 'smooth',
    });
    const target =
      moveFocus === true
        ? (scroller ?? doc.querySelector<HTMLElement>('main') ?? doc.body)
        : moveFocus
          ? moveFocus.current
          : null;
    if (target) focusTop(target);
  };

  // Nothing on the server or while hydrating: whether it shows depends on
  // a scroll position only the browser has.
  if (!hydrated) return null;

  const name: IconButtonName = hasText(ariaLabelledBy)
    ? { 'aria-labelledby': ariaLabelledBy }
    : { 'aria-label': hasText(ariaLabel) ? ariaLabel : 'Back to top' };

  return (
    <FloatButtonBase
      {...props}
      {...name}
      ref={setRefs}
      icon={icon ?? <ArrowUp />}
      className={classNames(backToTopClass, className)}
      onClick={handleClick}
    />
  );
});

/**
 * Float buttons: a round icon button fixed to a corner, with a speed dial
 * and a back to top button as parts.
 */
export const FloatButton = withSubComponents(
  FloatButtonBase,
  {
    SpeedDial: FloatButtonSpeedDial,
    BackToTop: FloatButtonBackToTop,
  },
  'FloatButton'
);

export default FloatButton;
