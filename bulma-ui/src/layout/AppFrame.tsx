import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { flattenChildren } from '../helpers/flattenChildren';
import { useLatestRef } from '../helpers/useLatestRef';
import { useOverlayEscape, useOverlayStack } from '../helpers/overlayStack';
import { useScrollLock } from '../helpers/scrollLock';
import { useInertSiblings } from '../helpers/useInertSiblings';
import { trapTab } from '../helpers/useFocusTrap';
import { useOverlayFocus } from '../helpers/useOverlayFocus';
import { useOutsidePress } from '../helpers/useOutsidePress';
import { getActiveElementInTree } from '../helpers/shadowDom';
import { useBulmaBreakpoint } from '../helpers/useBulmaViewport';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { warnOnce } from '../helpers/devWarnings';
import { MenuRailContext } from '../helpers/menuRail';
import { useLocale } from '../helpers/LocaleProvider';
import type { MenuRail } from '../helpers/menuRail';
import { NavbarBurger } from '../components/Navbar';
import type { NavbarBurgerProps } from '../components/Navbar';
import { Tooltip } from '../components/Tooltip';
import { Delete } from '../elements/Delete';
import type { ContainerBreakpoint } from './Container';

/**
 * The strings AppFrame renders, each with an English default. A key left
 * out, or set to an empty string, keeps its default.
 */
export interface AppFrameLabels {
  /**
   * The skip link's text.
   * @defaultValue 'Skip to main content'
   */
  skipLink?: string;
  /**
   * The nav's accessible name, when `AppFrame.Nav` has no `aria-label` or
   * `aria-labelledby`. Leave the word "navigation" out: the role says it.
   * @defaultValue 'Sections'
   */
  nav?: string;
  /**
   * The name of the close button at the top of the drawer.
   * @defaultValue 'Close navigation'
   */
  closeNav?: string;
  /**
   * The burger's name, when `AppFrame.Burger` has no `aria-label`.
   * @defaultValue 'menu', Navbar.Burger's
   */
  burger?: string;
}

/**
 * Props for the AppFrame component. The helper props, the other attributes
 * and the `ref` land on the root `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root `<div>`.
 */
export interface AppFrameProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The parts, each a direct child: `Header`, `Nav`, `Main`, `Aside` and
   * `Footer`, in that order, since it's the Tab order. The frame reads the
   * `id` of `Main` and `Nav` off its children for the skip link and the
   * burger, so a part wrapped in a component of your own takes no `id` of
   * its own. Put the frame at the top of the page, outside any `main` or
   * sectioning element.
   */
  children?: React.ReactNode;
  /**
   * The width from which the nav is a column beside the page. Below it, the
   * nav is a drawer the burger opens. The stylesheet switches the layout at
   * Bulma's breakpoint, and the script reads the width at Bulma's default
   * breakpoints, so a theme that moves Bulma's breakpoints moves the layout
   * but not which state the burger toggles.
   * @defaultValue 'desktop'
   */
  breakpoint?: ContainerBreakpoint;
  /**
   * Whether the drawer is open, below the breakpoint. With it, the state is
   * yours: update it from `onNavOpenChange`. It has no effect from the
   * breakpoint up, where the frame asks to close it.
   */
  navOpen?: boolean;
  /** Whether the drawer starts open. */
  defaultNavOpen?: boolean;
  /**
   * Called with the state asked for: by the burger, `useAppFrame()`, Escape,
   * a press outside, the close button, a followed link (see
   * `AppFrame.Nav`'s `closeOnNavigate`), or the window being at or past the
   * breakpoint while it's open, which closes it.
   */
  onNavOpenChange?: (open: boolean) => void;
  /**
   * Whether the column is collapsed, from the breakpoint up: out of view, or
   * down to its icons with `AppFrame.Nav rail`. With it, the state is yours:
   * update it from `onNavCollapsedChange`. It has no effect below the
   * breakpoint, where the drawer always shows the whole nav.
   */
  navCollapsed?: boolean;
  /** Whether the column starts collapsed. */
  defaultNavCollapsed?: boolean;
  /**
   * Called with the state asked for: by the burger, `useAppFrame()`, or a
   * `Menu.Section`'s button in the collapsed rail, which expands it.
   */
  onNavCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Renders a skip link first, visible when it has focus, that moves focus
   * to `AppFrame.Main`. Turn it off only for a page that has its own.
   */
  skipLink?: boolean;
  /** The strings the frame renders. Each one left out keeps its English default. */
  labels?: AppFrameLabels;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for AppFrame.Header, on its `<header>`, which sticks to the top.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<header>`.
 */
export interface AppFrameHeaderProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * Usually a `Navbar`, not `fixed`, with `AppFrame.Burger` in its
   * `Navbar.Brand`. A header taller than Bulma's navbar sets
   * `--bulma-app-frame-header-height` on `:root`, so the nav column, an
   * in-page link and focus clear it.
   */
  children?: React.ReactNode;
}

/**
 * Props for AppFrame.Nav, on its `<nav>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<nav>`.
 * @extraProp {string} [id] - The nav's id, which the burger's `aria-controls` points at. The frame makes one when there's none.
 * @extraProp {string} [aria-label] - The nav's name. Without it or `aria-labelledby`, it's the frame's `labels.nav`, "Sections".
 */
export interface AppFrameNavProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * Usually a `Menu`. A nav taller than the window scrolls on its own,
   * except a column collapsed to a rail, which doesn't (see `rail`). With
   * `overlay`, the rest of the frame is inert while the drawer is open, so an
   * overlay opened from the drawer, such as a `Modal`, goes inside the nav or
   * renders outside the frame (Modal's `portal`).
   */
  children?: React.ReactNode;
  /**
   * The column's width, and the drawer's up to the window's width less a
   * strip of backdrop. A number is pixels, and a string any CSS length. It
   * writes `--bulma-app-frame-nav-width`, 16rem by default.
   */
  width?: number | string;
  /**
   * Shows a backdrop behind the drawer and makes it modal: Tab stays inside,
   * the page scroll locks, and the rest of the frame is inert, while what
   * renders outside it, such as a Modal opened from the drawer or a toast,
   * stays live. Without it the drawer covers the page without holding Tab,
   * and focus can move to the page beside it. Either way focus moves in as
   * it opens. Sidebar's `overlay`.
   */
  overlay?: boolean;
  /**
   * Closes the drawer on Escape, while it's the topmost overlay, so Escape
   * closes one layer at a time.
   */
  closeOnEscape?: boolean;
  /**
   * Closes the drawer on a press outside it while it's the topmost overlay:
   * a click on the backdrop, or without `overlay` a press anywhere outside
   * it. Focus goes back to the burger as it closes. Without `overlay`, the
   * press's own mousedown then moves it, as on any page: to what was pressed
   * if that takes focus, and otherwise off the burger to the page. A touch
   * that scrolls leaves it on the burger. A press on a control whose
   * `aria-controls` names the nav, such as the burger, is left to that
   * control. Popover's `closeOnClickOutside`.
   */
  closeOnClickOutside?: boolean;
  /**
   * Closes the drawer when a link inside it is followed with a plain click:
   * not with a modifier key held, and not on a link with a `target` other
   * than `_self` or a `download`. Only a link the nav holds in the page
   * counts, not one in a Modal or a popup it portals elsewhere. Focus goes
   * back to the burger, and the navigation takes it from there: a router
   * that moves focus on navigation moves it, and an in-page `#` link leaves
   * it at its target, as it does anywhere on the page. Turn it off for a
   * drawer of filters rather than links.
   */
  closeOnNavigate?: boolean;
  /**
   * From the breakpoint up, a collapsed column shrinks to a rail of icons
   * instead of leaving the page. The rail needs a `Menu` inside the nav: a
   * Menu portaled out of it, such as one in a Popover or a Modal opened from
   * it, isn't in the rail, nor is a `Menu.List` with no Menu around it, and a
   * development build warns when a collapsed rail holds no Menu. Every
   * top-level `Menu.Item` and
   * `Menu.Section` needs an `icon`: in the rail, an item without one has
   * nothing to show and its label spills over the page, and a section's
   * button is blank, so a development build warns about one without. In the
   * rail their labels are visually hidden,
   * so each stays its link's or button's name, and shows in a `Tooltip`
   * beside the rail on hover and keyboard focus. Nested lists and
   * `Menu.Label` headings hide there, and a section's button expands the
   * column and opens the section. Collapsed to the rail, the column
   * doesn't scroll on its own, so a tooltip isn't clipped. It sticks under
   * the header while it fits there. A rail taller than the window under the
   * header scrolls with the page instead, so its lower icons come into view
   * as the page scrolls and as Tab reaches them. That takes a measurement in
   * the browser, so before the page hydrates such a rail sticks.
   */
  rail?: boolean;
}

/**
 * Props for AppFrame.Main, on the page's one `<main>`. Don't put another
 * `<main>` inside it. It takes your `id`, or a generated one, for the skip
 * link, and `tabIndex={-1}` so the link can move focus to it.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<main>`.
 * @extraProp {string} [id] - Its id, which the skip link points at. The frame makes one when there's none.
 */
export interface AppFrameMainProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** The page. A `Container` or a `Section` inside it gives Bulma's widths and padding. */
  children?: React.ReactNode;
}

/**
 * Props for AppFrame.Aside, on its `<aside>`, a complementary landmark.
 * Give it an `aria-label` when the page has more than one.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<aside>`.
 */
export interface AppFrameAsideProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** What sits beside the page: an outline, details, filters. */
  children?: React.ReactNode;
  /**
   * Its width from the breakpoint up; below it, the aside moves under the
   * page. A number is pixels, and a string any CSS length. It writes
   * `--bulma-app-frame-aside-width`, 20rem by default.
   */
  width?: number | string;
}

/**
 * Props for AppFrame.Footer, on its `<footer>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<footer>`.
 */
export interface AppFrameFooterProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Plain content, or bestax's `Footer` with `as="div"` for Bulma's footer look. */
  children?: React.ReactNode;
}

/**
 * Props for AppFrame.Burger: Navbar.Burger's, less the state the frame
 * fills in. Its `<button>` opens and closes the drawer below the breakpoint
 * and collapses and expands the column from it up, with `aria-expanded` and
 * `aria-controls` following the nav. It shows at every width. Hide it from
 * the breakpoint up with the visibility helpers when the column never
 * collapses. Outside an AppFrame it controls nothing.
 */
export type AppFrameBurgerProps = Omit<
  NavbarBurgerProps,
  'active' | 'aria-expanded' | 'aria-controls'
>;

/** What `useAppFrame()` returns. */
export interface AppFrameState {
  /** Whether the drawer is open. */
  navOpen: boolean;
  /** Asks to open or close the drawer, through `onNavOpenChange`. */
  setNavOpen: (open: boolean) => void;
  /** Whether the column is collapsed. */
  navCollapsed: boolean;
  /** Asks to collapse or expand the column, through `onNavCollapsedChange`. */
  setNavCollapsed: (collapsed: boolean) => void;
  /**
   * Whether the nav is a drawer at the current width. `false` on the server
   * and until the first layout effect has read the width.
   */
  isDrawer: boolean;
  /** Toggles whichever state applies at the current width, as the burger does. */
  toggleNav: () => void;
  /** The nav's `id`, for a custom toggle's `aria-controls`. */
  navId: string;
}

/** What the frame tells its parts. */
interface FrameContextValue {
  state: AppFrameState;
  labels: Required<Omit<AppFrameLabels, 'burger'>> &
    Pick<AppFrameLabels, 'burger'>;
  mainId: string;
  /**
   * Whether the frame has read the width, so it knows whether the nav is a
   * drawer. Not on the server, nor in the render that hydrates.
   */
  modeKnown: boolean;
}

const FrameContext = createContext<FrameContextValue | null>(null);

/** A width prop as CSS: a number is pixels. */
const cssLength = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

/**
 * Hands `node` to a part's own ref and to the one forwarded to it. A
 * forwarded callback that returns a cleanup, as React 19 allows, has it held
 * in `cleanup` and run on detach in place of a call with `null`, on React 18
 * as well.
 */
function setRefs<T>(
  node: T | null,
  own: React.MutableRefObject<T | null>,
  forwarded: React.ForwardedRef<T>,
  cleanup: React.MutableRefObject<(() => void) | null>
) {
  own.current = node;
  if (typeof forwarded === 'function') {
    if (node === null) {
      const detach = cleanup.current;
      cleanup.current = null;
      if (detach) detach();
      else forwarded(null);
      return;
    }
    const returned: unknown = forwarded(node);
    cleanup.current =
      typeof returned === 'function' ? (returned as () => void) : null;
  } else if (forwarded) {
    forwarded.current = node;
  }
}

/**
 * Warns when a part has an `id` the frame couldn't read, because it isn't a
 * direct child, so the skip link or the burger points at the wrong one.
 */
function warnOnUnreadId(part: string, id: unknown, expected: string) {
  if (id && id !== expected) {
    warnOnce(
      `AppFrame:${part}-id`,
      `[bestax-bulma] <AppFrame.${part}> has an id <AppFrame> can't read, ` +
        `so ${part === 'Main' ? 'the skip link' : "the burger's aria-controls"} ` +
        `misses it. Put AppFrame.${part} directly inside AppFrame.`
    );
  }
}

/**
 * The top bar of an AppFrame, which sticks while the page scrolls.
 *
 * @function
 * @param {AppFrameHeaderProps} props - Props for AppFrame.Header.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<header>`.
 * @returns {JSX.Element} The rendered header.
 */
export const AppFrameHeader = forwardRef<HTMLElement, AppFrameHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const headerClass = usePrefixedClassNames('app-frame-header');
    return (
      <header
        ref={ref}
        className={classNames(headerClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </header>
    );
  }
);

AppFrameHeader.displayName = 'AppFrame.Header';

/**
 * The navigation of an AppFrame: a column beside the page from the breakpoint up, and a drawer below it.
 *
 * @function
 * @param {AppFrameNavProps} props - Props for AppFrame.Nav.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<nav>`.
 * @returns {JSX.Element} The rendered nav, and the drawer's backdrop.
 */
export const AppFrameNav = forwardRef<HTMLElement, AppFrameNavProps>(
  (
    {
      className,
      style,
      width,
      overlay = true,
      closeOnEscape = true,
      closeOnClickOutside = true,
      closeOnNavigate = true,
      rail = false,
      onClick,
      onPointerDownCapture,
      children,
      ...props
    },
    ref
  ) => {
    const frame = useContext(FrameContext);
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const navCollapsed = !!frame?.state.navCollapsed;
    const navClass = usePrefixedClassNames('app-frame-nav', {
      'is-rail': rail && navCollapsed,
    });
    const tipClass = usePrefixedClassNames('app-frame-rail-tooltip');
    const closeClass = usePrefixedClassNames('app-frame-close');
    const backdropClass = usePrefixedClassNames('app-frame-backdrop');
    const activeClass = usePrefixedClassNames('is-active');
    const navRef = useRef<HTMLElement | null>(null);
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const navCleanupRef = useRef<(() => void) | null>(null);
    const navRefs = useCallback(
      (node: HTMLElement | null) => setRefs(node, navRef, ref, navCleanupRef),
      [ref]
    );

    const navId = rest.id || frame?.state.navId;
    if (frame) warnOnUnreadId('Nav', rest.id, frame.state.navId);
    // The drawer is open only below the breakpoint. Above it the nav is a
    // column, and none of what follows applies.
    const isDrawer = !!frame?.state.isDrawer;
    const open = isDrawer && !!frame?.state.navOpen;
    // The open drawer is Bulma's active state, on the nav as on a navbar's
    // menu, and on its backdrop.
    const shown = { [activeClass]: !!frame?.state.navOpen };
    const modal = open && overlay;
    const close = () => frame?.state.setNavOpen(false);

    // The rest of the frame goes inert: the header, the page, the aside and
    // the footer, but not the backdrop, which takes the presses outside the
    // drawer rather than let them through to what's under it. Not the whole
    // page, since a Modal or a toast renders beside the frame, often into an
    // element that's there before the drawer opens, and a Modal opened from
    // the drawer has to stay usable. First, so that as the drawer closes it
    // lets go before focus goes back to the burger: an inert element can't
    // take focus.
    useInertSiblings(navRef, modal, false, backdropRef);
    const isTopmost = useOverlayStack(open, overlay);
    useScrollLock(modal);

    // Tab stays inside while the drawer is the topmost modal overlay, as in
    // Sidebar, so a Modal opened from the drawer holds Tab until it closes.
    useEffect(() => {
      if (!modal) return undefined;
      return trapTab(
        () => navRef.current,
        window,
        () => isTopmost('modal')
      );
    }, [modal, isTopmost]);

    useOverlayEscape(open && closeOnEscape, isTopmost, close);

    // Without an overlay there's no backdrop: a press outside the drawer
    // closes it, as Popover's does, while it's the topmost overlay, so a
    // press in a Modal opened over it is the Modal's. A press on a control
    // that names the nav in its `aria-controls`, such as the burger, is left
    // to that control, which toggles it.
    const markInsidePress = useOutsidePress(
      navRef,
      open && !overlay && closeOnClickOutside,
      e => {
        const id = navRef.current?.id;
        const controlsNav = (node: EventTarget) =>
          !!(node as Element)
            .getAttribute?.('aria-controls')
            ?.split(/\s+/)
            .includes(id as string);
        if (!isTopmost() || e.composedPath().some(controlsNav)) return;
        close();
      }
    );

    // Focus moves to the drawer's first tab stop, the close button, as it
    // opens, and back to whatever had it as it closes, unless it has left
    // the drawer. After a press outside, the press's own mousedown then takes
    // it wherever the press goes. When the window widened, the drawer is the
    // column again, and focus on its links stays; the close button hides
    // there, so focus on it, or dropped from it to <body>, goes back too.
    const isDrawerRef = useLatestRef(isDrawer);
    useOverlayFocus(navRef, open, {
      modal: overlay,
      restore: () => {
        if (isDrawerRef.current) return true;
        const nav = navRef.current as HTMLElement;
        const active = getActiveElementInTree(nav);
        return (
          !nav.contains(active) || !!active?.classList.contains(closeClass)
        );
      },
    });

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      onClick?.(e);
      if (
        !open ||
        !closeOnNavigate ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      // Not skipped for a click whose default was prevented: a router's
      // link prevents it to navigate without a page load. Only a link the nav
      // holds: one in a Modal portaled from it is the Modal's.
      const link = (e.target as Element).closest('a[href]');
      if (!link || !navRef.current?.contains(link)) return;
      if (link.hasAttribute('download')) return;
      const target = link.getAttribute('target');
      if (target && target !== '_self') return;
      close();
    };

    // The rail's context, which tells the Menu inside to put each item's
    // label in a tooltip, on the column's inline-end side. That's on the
    // right unless the nav is laid out right to left, which only the page
    // knows: read as the rail appears, each time it collapses, and when a
    // LocaleProvider around it switches direction.
    const [side, setSide] = useState<'left' | 'right'>('right');
    const { dir } = useLocale();
    const modeKnown = !!frame?.modeKnown;
    const railCollapsed = rail && modeKnown && !isDrawer && navCollapsed;
    useClientLayoutEffect(() => {
      if (!rail) return;
      const rtl = getComputedStyle(navRef.current!).direction === 'rtl';
      setSide(rtl ? 'left' : 'right');
    }, [rail, railCollapsed, dir]);

    // The collapsed rail sticks under the header only while it fits there.
    // It can't scroll on its own, which would clip its tooltips, so one
    // taller than the window under the header scrolls with the page instead,
    // and its lower icons come into view as the page scrolls and as Tab
    // reaches them. The stylesheet makes it at least its room tall, the small
    // viewport (svh) less the header, so it's taller than that only when its
    // icons are. The small viewport doesn't change as a touch browser's
    // toolbar slides in and out, so a rail near the edge doesn't flip between
    // sticking and scrolling as the page scrolls. Measured as it collapses,
    // before paint, then each time its size changes; expanded, it's no rail,
    // so the next collapse starts afresh.
    const [railTall, setRailTall] = useState(false);
    const tallClass = usePrefixedClassNames('is-tall');
    useClientLayoutEffect(() => {
      if (!railCollapsed) return undefined;
      const nav = navRef.current!;
      const measure = () => {
        const room = parseFloat(
          getComputedStyle(nav).getPropertyValue('min-block-size')
        );
        setRailTall(nav.getBoundingClientRect().height > room + 1);
      };
      measure();
      const observer =
        typeof ResizeObserver === 'undefined'
          ? undefined
          : new ResizeObserver(measure);
      observer?.observe(nav);
      return () => {
        observer?.disconnect();
        setRailTall(false);
      };
    }, [railCollapsed]);

    const state = frame?.state;
    const railValue = useMemo<MenuRail | null>(() => {
      if (!rail || !state) return null;
      return {
        collapsed: railCollapsed,
        pending: !modeKnown && navCollapsed,
        navId: navId as string,
        nav: () => navRef.current,
        expand: () => state.setNavCollapsed(false),
        wrap: (trigger, label) => (
          <Tooltip
            className={tipClass}
            content={label}
            position={side}
            describesTrigger={false}
            // Only the collapsed rail shows it, so it doesn't open, or
            // measure itself, in the wide column or the drawer.
            disabled={!railCollapsed}
          >
            {trigger}
          </Tooltip>
        ),
      };
    }, [
      rail,
      state,
      railCollapsed,
      modeKnown,
      navCollapsed,
      navId,
      side,
      tipClass,
    ]);

    // The rail is the Menu's inside the nav. One portaled out of it, or a
    // Menu.List with no Menu around it, doesn't take it.
    const menuClass = usePrefixedClassNames('menu');
    useEffect(() => {
      if (railCollapsed && !navRef.current!.querySelector(`.${menuClass}`)) {
        warnOnce(
          'AppFrame:rail-menu',
          '[bestax-bulma] <AppFrame.Nav rail> is collapsed to its rail but ' +
            'holds no <Menu>, so nothing in it shows as an icon with its ' +
            'label in a tooltip. Put a Menu inside the nav, with an icon on ' +
            'each top-level Menu.Item and Menu.Section.'
        );
      }
    }, [railCollapsed, menuClass]);

    const navStyle =
      width === undefined
        ? style
        : ({
            ...style,
            '--bulma-app-frame-nav-width': cssLength(width),
          } as React.CSSProperties);

    return (
      <>
        <nav
          ref={navRefs}
          className={classNames(
            navClass,
            shown,
            { [tallClass]: railCollapsed && railTall },
            bulmaHelperClasses,
            className
          )}
          style={navStyle}
          onClick={handleClick}
          onPointerDownCapture={e => {
            onPointerDownCapture?.(e);
            markInsidePress(e);
          }}
          {...rest}
          id={navId}
          aria-label={
            rest['aria-label'] ||
            (rest['aria-labelledby'] ? undefined : frame?.labels.nav)
          }
        >
          {frame && (
            <Delete
              className={closeClass}
              size="medium"
              ariaLabel={frame.labels.closeNav}
              onClick={close}
            />
          )}
          <MenuRailContext.Provider value={railValue}>
            {children}
          </MenuRailContext.Provider>
        </nav>
        {frame && overlay && (
          <div
            ref={backdropRef}
            className={classNames(backdropClass, shown)}
            aria-hidden="true"
            onClick={
              closeOnClickOutside
                ? () => {
                    // Not under an overlay opened over the drawer.
                    if (isTopmost()) close();
                  }
                : undefined
            }
          />
        )}
      </>
    );
  }
);

AppFrameNav.displayName = 'AppFrame.Nav';

/**
 * The page's main content in an AppFrame, which the skip link moves focus to.
 *
 * @function
 * @param {AppFrameMainProps} props - Props for AppFrame.Main.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<main>`.
 * @returns {JSX.Element} The rendered main.
 */
export const AppFrameMain = forwardRef<HTMLElement, AppFrameMainProps>(
  ({ className, children, ...props }, ref) => {
    const frame = useContext(FrameContext);
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const mainClass = usePrefixedClassNames('app-frame-main');
    if (frame) warnOnUnreadId('Main', rest.id, frame.mainId);
    return (
      <main
        ref={ref}
        tabIndex={-1}
        className={classNames(mainClass, bulmaHelperClasses, className)}
        {...rest}
        id={rest.id || frame?.mainId}
      >
        {children}
      </main>
    );
  }
);

AppFrameMain.displayName = 'AppFrame.Main';

/**
 * Content beside the page in an AppFrame, which moves under it below the breakpoint.
 *
 * @function
 * @param {AppFrameAsideProps} props - Props for AppFrame.Aside.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<aside>`.
 * @returns {JSX.Element} The rendered aside.
 */
export const AppFrameAside = forwardRef<HTMLElement, AppFrameAsideProps>(
  ({ className, style, width, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const asideClass = usePrefixedClassNames('app-frame-aside');
    const asideStyle =
      width === undefined
        ? style
        : ({
            ...style,
            '--bulma-app-frame-aside-width': cssLength(width),
          } as React.CSSProperties);
    return (
      <aside
        ref={ref}
        className={classNames(asideClass, bulmaHelperClasses, className)}
        style={asideStyle}
        {...rest}
      >
        {children}
      </aside>
    );
  }
);

AppFrameAside.displayName = 'AppFrame.Aside';

/**
 * The bottom of an AppFrame, under the page.
 *
 * @function
 * @param {AppFrameFooterProps} props - Props for AppFrame.Footer.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<footer>`.
 * @returns {JSX.Element} The rendered footer.
 */
export const AppFrameFooter = forwardRef<HTMLElement, AppFrameFooterProps>(
  ({ className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const footerClass = usePrefixedClassNames('app-frame-footer');
    return (
      <footer
        ref={ref}
        className={classNames(footerClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </footer>
    );
  }
);

AppFrameFooter.displayName = 'AppFrame.Footer';

/**
 * The button that opens the drawer, or collapses the column from the breakpoint up: Navbar.Burger, wired to the frame.
 *
 * @function
 * @param {AppFrameBurgerProps} props - Props for AppFrame.Burger.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the `<button>`.
 * @returns {JSX.Element} The rendered burger.
 */
export const AppFrameBurger = forwardRef<
  HTMLButtonElement,
  AppFrameBurgerProps
>(({ className, onClick, ...props }, ref) => {
  // Outside a frame it's a Navbar.Burger that controls nothing.
  const frame = useContext(FrameContext);
  const burgerClass = usePrefixedClassNames('app-frame-burger');
  const state = frame?.state;
  // Until the frame knows whether the nav is a drawer, the burger says
  // nothing it can't stand behind: no `aria-expanded`, and its bars. It can't
  // act before then anyway, since that's before hydration. Outside a frame
  // it's a plain Navbar.Burger.
  const known = !!frame?.modeKnown;
  const expanded =
    known && !!state && (state.isDrawer ? state.navOpen : !state.navCollapsed);
  return (
    <NavbarBurger
      ref={ref}
      {...props}
      className={classNames(burgerClass, className)}
      aria-label={props['aria-label'] || frame?.labels.burger}
      active={expanded}
      aria-expanded={frame && !known ? null : expanded}
      aria-controls={state?.navId}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || !frame) return;
        // Safari, and Firefox on a Mac, don't focus a button that's pressed.
        // Focused, it's the element the drawer hands focus back to.
        e.currentTarget.focus();
        frame.state.toggleNav();
      }}
    />
  );
});

AppFrameBurger.displayName = 'AppFrame.Burger';

const isMain = (
  child: React.ReactNode
): child is React.ReactElement<AppFrameMainProps> =>
  React.isValidElement(child) && child.type === AppFrameMain;

const isNav = (
  child: React.ReactNode
): child is React.ReactElement<AppFrameNavProps> =>
  React.isValidElement(child) && child.type === AppFrameNav;

/**
 * The `AppFrame` component lays out an app's pages: a header across the top, a navigation column down the side, the page, and an aside and a footer, with the nav a drawer behind a burger on narrow screens.
 *
 * The header and the column stick while the document scrolls, and a skip
 * link comes first. The layout is CSS, so the server renders it as the
 * browser does. It holds two states, each yours to control: whether the
 * drawer is open, and whether the column is collapsed. `AppFrame.Burger`
 * and `useAppFrame()` toggle whichever applies at the current width.
 *
 * @function
 * @param {AppFrameProps} props - Props for the AppFrame component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the root `<div>`.
 * @returns {JSX.Element} The rendered frame.
 *
 * @example
 * <AppFrame>
 *   <AppFrame.Header>
 *     <Navbar aria-label="Site">
 *       <Navbar.Brand>
 *         <Navbar.Item href="/">Acme</Navbar.Item>
 *         <AppFrame.Burger />
 *       </Navbar.Brand>
 *     </Navbar>
 *   </AppFrame.Header>
 *   <AppFrame.Nav>
 *     <Menu>…</Menu>
 *   </AppFrame.Nav>
 *   <AppFrame.Main>…</AppFrame.Main>
 * </AppFrame>
 */
const AppFrameRoot = forwardRef<HTMLDivElement, AppFrameProps>(
  (
    {
      className,
      textColor,
      bgColor,
      breakpoint = 'desktop',
      navOpen: navOpenProp,
      defaultNavOpen = false,
      onNavOpenChange,
      navCollapsed: navCollapsedProp,
      defaultNavCollapsed = false,
      onNavCollapsedChange,
      skipLink = true,
      labels,
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const rootRef = useRef<HTMLDivElement | null>(null);
    const rootCleanupRef = useRef<(() => void) | null>(null);
    const rootRefs = useCallback(
      (node: HTMLDivElement | null) =>
        setRefs(node, rootRef, ref, rootCleanupRef),
      [ref]
    );

    const [openState, setOpenState] = useState(defaultNavOpen);
    const [collapsedState, setCollapsedState] = useState(defaultNavCollapsed);
    const navOpen = navOpenProp ?? openState;
    const navCollapsed = navCollapsedProp ?? collapsedState;
    const openControlled = navOpenProp !== undefined;
    const collapsedControlled = navCollapsedProp !== undefined;
    const onNavOpenChangeRef = useLatestRef(onNavOpenChange);
    const onNavCollapsedChangeRef = useLatestRef(onNavCollapsedChange);

    const setNavOpen = useCallback(
      (open: boolean) => {
        onNavOpenChangeRef.current?.(open);
        if (!openControlled) setOpenState(open);
      },
      [openControlled, onNavOpenChangeRef]
    );
    const setNavCollapsed = useCallback(
      (collapsed: boolean) => {
        onNavCollapsedChangeRef.current?.(collapsed);
        if (!collapsedControlled) setCollapsedState(collapsed);
      },
      [collapsedControlled, onNavCollapsedChangeRef]
    );

    // The layout switches in the stylesheet. The script needs the width
    // only to know which state the burger toggles, and to close the drawer
    // once the window is at or past the breakpoint.
    const wide = useBulmaBreakpoint(breakpoint);
    const isDrawer = wide === false;
    const isWide = wide === true;

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the width is known only in the browser, and the drawer closes in answer to it
      if (isWide && navOpen) setNavOpen(false);
    }, [isWide, navOpen, setNavOpen]);

    const toggleNav = useCallback(() => {
      if (isDrawer) setNavOpen(!navOpen);
      else setNavCollapsed(!navCollapsed);
    }, [isDrawer, navOpen, navCollapsed, setNavOpen, setNavCollapsed]);

    // The ids of the parts the skip link and the burger point at, read off
    // the children so the server renders them too.
    const baseId = useId();
    const parts = flattenChildren(children);
    const mainId = parts.find(isMain)?.props.id || `${baseId}-main`;
    const navId = parts.find(isNav)?.props.id || `${baseId}-nav`;

    const { skipLink: skipText, nav, closeNav, burger } = labels ?? {};
    const value = useMemo<FrameContextValue>(
      () => ({
        state: {
          navOpen,
          setNavOpen,
          navCollapsed,
          setNavCollapsed,
          isDrawer,
          toggleNav,
          navId,
        },
        labels: {
          skipLink: skipText || 'Skip to main content',
          nav: nav || 'Sections',
          closeNav: closeNav || 'Close navigation',
          burger: burger || undefined,
        },
        mainId,
        modeKnown: wide !== null,
      }),
      [
        navOpen,
        setNavOpen,
        navCollapsed,
        setNavCollapsed,
        isDrawer,
        toggleNav,
        navId,
        skipText,
        nav,
        closeNav,
        burger,
        mainId,
        wide,
      ]
    );

    // Its header and footer are the page's banner and contentinfo only
    // outside `main` and sectioning content, as HTML-AAM maps them.
    useEffect(() => {
      const host = rootRef.current?.parentElement?.closest(
        'main, article, aside, nav, section'
      );
      if (host) {
        warnOnce(
          'AppFrame:nested',
          `[bestax-bulma] <AppFrame> sits inside a <${host.localName}>, where ` +
            "its header and footer are no longer the page's banner and " +
            'contentinfo landmarks. Put AppFrame at the top of the page.'
        );
      }
    }, []);

    const rootClass = usePrefixedClassNames('app-frame', {
      [`is-${breakpoint}`]: true,
      'is-nav-collapsed': navCollapsed,
    });
    const skipClass = usePrefixedClassNames('app-frame-skip-link');

    return (
      <div
        ref={rootRefs}
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {skipLink && (
          <a className={skipClass} href={`#${mainId}`}>
            {value.labels.skipLink}
          </a>
        )}
        <FrameContext.Provider value={value}>{children}</FrameContext.Provider>
      </div>
    );
  }
);

/**
 * The frame's state, for a control of your own inside it: whether the
 * drawer is open and the column collapsed, setters that go through the
 * frame's callbacks, and `toggleNav()`, which does what the burger does.
 * Outside an AppFrame it's `null`, as the library's other context hooks
 * are, so a control that can sit outside one renders a fallback or nothing.
 *
 * @function useAppFrame
 * @returns The frame's state, or `null` outside an AppFrame.
 */
export function useAppFrame(): AppFrameState | null {
  return useContext(FrameContext)?.state ?? null;
}

export const AppFrame = withSubComponents(
  AppFrameRoot,
  {
    Header: AppFrameHeader,
    Nav: AppFrameNav,
    Main: AppFrameMain,
    Aside: AppFrameAside,
    Footer: AppFrameFooter,
    Burger: AppFrameBurger,
  },
  'AppFrame'
);

export default AppFrame;
