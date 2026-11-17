import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { flattenChildren } from '../helpers/flattenChildren';
import { isElementOf } from '../helpers/elementType';
import { useControlled } from '../helpers/useControlled';
import { Portal, PortalScope } from '../helpers/portal';
import { useConfig } from '../helpers/Config';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useScrollLock } from '../helpers/scrollLock';
import { useOverlayEscape, useOverlayStack } from '../helpers/overlayStack';
import {
  focusTabStop,
  isRenderedAndEnabled,
  tabLeaves,
  trapTab,
} from '../helpers/useFocusTrap';
import { useOverlayFocus } from '../helpers/useOverlayFocus';
import { useInertSiblings } from '../helpers/useInertSiblings';
import { useOutsidePress } from '../helpers/useOutsidePress';
import {
  sideMarginGap,
  useAnchoredPosition,
} from '../helpers/useAnchoredPosition';
import type { AnchoredSide } from '../helpers/useAnchoredPosition';
import { useLatestRef } from '../helpers/useLatestRef';
import { useScopedNumberFormat } from '../helpers/localeFormat';
import { spokenText, visuallyHidden } from '../helpers/statusRegion';
import {
  getActiveElementInTree,
  listenInShadowRoots,
} from '../helpers/shadowDom';
import { clippingAncestors } from '../helpers/clippingAncestors';
import { isDev, warnOnce } from '../helpers/devWarnings';
import { buttonType } from '../helpers/buttonType';
import { Button, ButtonOwnProps } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Delete } from '../elements/Delete';

/**
 * The side of its target a step's panel sits on: Tooltip's sides. `left`
 * and `right` are the start and the end, so they swap under right-to-left
 * text.
 */
export type TourStepPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * What a step points at: a CSS selector, looked up again until it matches,
 * in the shadow root the tour renders into and then the document, an
 * element, or a ref to one.
 */
export type TourTarget =
  string | HTMLElement | React.RefObject<HTMLElement | null>;

const validTourTitleElements = ['h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const;
/** What each step's title renders as: a heading level, or `p`. Timeline's union. */
export type TourTitleElement = (typeof validTourTitleElements)[number];

/**
 * Whether the tour walks its steps in order, or puts a beacon on each target
 * that opens its step, in any order.
 */
export type TourMode = 'guided' | 'beacon';

const validTourStepPositions: readonly TourStepPosition[] = [
  'top',
  'bottom',
  'left',
  'right',
];

/**
 * The words a Tour writes. Each is English unless you give your own, and
 * the numbers in the default progress line are written in the
 * `LocaleProvider`'s locale.
 */
export interface TourLabels {
  /**
   * The button that ends the tour early.
   * @defaultValue 'Skip'
   */
  skip?: string;
  /**
   * The button to the step before.
   * @defaultValue 'Back'
   */
  back?: string;
  /**
   * The button to the next step.
   * @defaultValue 'Next'
   */
  next?: string;
  /**
   * Next on the last step, which finishes the tour, and on a beacon's step,
   * which closes the step.
   * @defaultValue 'Done'
   */
  done?: string;
  /**
   * The close button's name.
   * @defaultValue 'Close'
   */
  close?: string;
  /**
   * The progress line, which also starts the announcement after the step
   * changes ("Step 2 of 5: Filters"). `step` counts from 1. It isn't called
   * with `mode="beacon"`, whose steps show no progress.
   * @defaultValue (step, total) => `Step ${step} of ${total}`, the numbers in
   * the LocaleProvider's locale
   */
  progress?: (step: number, total: number) => string;
  /**
   * A beacon's name, read before its step's title, or its `aria-label`.
   * A step named only by `aria-labelledby` gives its beacon this alone,
   * since what that points at isn't on the page while the beacons show.
   * @defaultValue 'Show tip'
   */
  beacon?: string;
  /**
   * The name of the group the beacons sit in.
   * @defaultValue 'Tips'
   */
  beacons?: string;
}

/**
 * Props for the Tour component. The helper props, the other attributes and
 * the `ref` land on the `.tour` element in the portal, which holds the
 * overlay, the current step and the beacons.
 */
export interface TourProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'defaultValue' | 'onChange'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * `Tour.Step`s, in the order the tour visits them. Fragments are opened
   * up, and anything that isn't a `Tour.Step`, a component that renders one
   * included, is left out.
   */
  children?: React.ReactNode;
  /** Whether the tour is showing (controlled). */
  open?: boolean | undefined;
  /**
   * Whether it shows from the start (uncontrolled). A tour has to measure
   * its targets, so it shows from the commit after hydration, never in
   * server markup.
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /**
   * Called with `false` when the tour ends: Skip, the close button, Escape,
   * a click outside with `closeOnClickOutside`, or Done after `onFinish`.
   * With `mode="beacon"` it never fires: those close only the open step,
   * and the app owns `open`.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The current step's index (controlled). In guided mode an index past
   * either end shows the nearest step, and a fraction is rounded down. With
   * `mode="beacon"`, the open step's index, or `-1` while only the beacons
   * show, as Timeline's `active` takes `-1` for none.
   */
  value?: number | undefined;
  /**
   * The step it starts on (uncontrolled), and goes back to each time it
   * opens.
   * @defaultValue 0, or -1 with mode="beacon"
   */
  defaultValue?: number | undefined;
  /**
   * Called with the new index when Back, Next, an arrow key or a beacon
   * changes the step, and with `-1` when a beacon's step closes: Done,
   * Escape, the close button, a press outside with `closeOnClickOutside`,
   * or its step being removed, or moved by a step added or removed before
   * it. So keep a beacon tour's list of steps fixed while a tip shows, and
   * drop read ones the next time the tips open.
   */
  onChange?: ((value: number) => void) | undefined;
  /**
   * Called when Done on the last step finishes the tour, before
   * `onOpenChange(false)`. Skip, the close button, Escape and a click
   * outside don't call it, and with `mode="beacon"`, where Done closes only
   * the step, it never fires.
   */
  onFinish?: () => void;
  /**
   * Dims the page and makes each step modal: `aria-modal`, the rest of the
   * page inert and still, and Tab held in the step. With `false`, a step is
   * a non-modal dialog, as a `Popover` is, and the page and its target stay
   * usable, from the keyboard too: focus moves in and back, Tab from the
   * step's last control, Next in the default footer, goes on to the target
   * (its first control, or the target itself when it takes focus), Shift+Tab
   * goes where the browser
   * sends it, and Escape ends the tour while focus is in the step. A
   * `Tour.Step` can set its own, and a step that turns modal while focus is
   * out on the page takes focus.
   * @defaultValue true
   */
  overlay?: boolean;
  /**
   * Ends the tour on Escape, or with `mode="beacon"` closes the open step.
   * With the overlay, from anywhere, while no
   * overlay opened over it, such as a Modal opened from a step, is on top.
   * Without it, only while focus is in the step, so an Escape meant for the
   * page stays with the page. A popup inside the step, and content that
   * calls `preventDefault()` on the key, take it first.
   * @defaultValue true
   */
  closeOnEscape?: boolean;
  /**
   * Ends the tour on a press outside the step, the overlay included.
   * Content the step renders through a portal counts as inside. Off by
   * default, unlike Popover's: a tour is a sequence someone means to finish,
   * and a stray click on the dimmed page, or on the page around a step
   * without the overlay, shouldn't end it partway. Skip, the close button
   * and Escape still end it. With `mode="beacon"`, a press outside closes
   * the open step, as Escape does, and never ends the tour, and it's off
   * there by default too, so with the default it does nothing.
   * @defaultValue false
   */
  closeOnClickOutside?: boolean;
  /**
   * Where the tour renders: `true` for the `ConfigProvider` portal container
   * or `<body>`, a selector or an element for another container, `false` for
   * where it's written. Modal's shape, with a different default. The step
   * and the overlay are fixed to the viewport wherever they render, so a
   * `transform` on an ancestor of an in-place tour moves them with it.
   * @defaultValue true
   */
  portal?: boolean | string | HTMLElement;
  /**
   * What every step's title renders as: a heading one level under the
   * heading the tour's page sits beneath, or `p`.
   * @defaultValue 'h2'
   */
  titleAs?: TourTitleElement;
  /** The words the tour writes. */
  labels?: TourLabels;
  /**
   * Every step's footer, in place of the default: Skip and the progress line
   * at the start, Back and Next at the end. Build it from `Tour.Skip`,
   * `Tour.Back`, `Tour.Next` and `Tour.Progress`, which act on the tour from
   * wherever they sit in the step. ArrowRight and ArrowLeft press the step's
   * `Tour.Next` and `Tour.Back`, swapped under right-to-left text, so one
   * that's disabled, loading or `aria-disabled`, or whose `onClick`
   * prevents, holds for the keys too, and a step without one ignores its
   * key. A step's own `footer` wins, and
   * `null` leaves the steps without one.
   */
  footer?: React.ReactNode;
  /**
   * `guided` walks the steps in order. `beacon` puts a button on each
   * target that opens its step, in any order, and keeps the buttons there
   * until `open` turns `false`. The beacons sit in one group named by
   * `labels.beacons`, in step order, after the page's own content in the Tab
   * order, so order the steps as the page reads; a development build warns
   * once when they aren't. A beacon sits over its target's top end corner
   * and shows while its target is on the page, has a box and is in view,
   * that corner included.
   * Opening one hides them all and opens its step, modal or not by
   * `overlay`, and closing the step brings them back, with focus on its
   * beacon while the step held it. A beacon's step has no Skip, Back or
   * progress line, its Next reads Done and closes the step, and the arrow
   * keys do nothing in it. Closing the tour while its step holds focus sends
   * focus to the step's target. Removing a step removes its beacon, so an
   * app can drop the tips a user has read; a tip whose step is removed or
   * moved while it's open closes, with `onChange(-1)`. While only the
   * beacons show, the tour sits under the app's navbar, sidebars, modals and
   * dropdown menus; raise `--bulma-tour-beacon-z-index` for targets inside
   * one.
   * @defaultValue 'guided'
   */
  mode?: TourMode;
}

/**
 * Props for Tour.Step. It renders nothing where it's written; while it's
 * the current step, its attributes, helper props and `ref` land on the
 * step's panel, the `role="dialog"` element.
 */
export interface TourStepProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The element the step points at. Without one, or while it isn't on the
   * page or has no box (in a closed Collapse or a hidden tab panel), the
   * step is centered. A target that turns up later, or gets a box, is found
   * then. A development build warns about a missing target, once for each
   * selector.
   */
  target?: TourTarget | undefined;
  /**
   * The title, which names the step's dialog. A step without one needs an
   * `aria-label`, and a development build warns when it has neither.
   */
  title?: React.ReactNode;
  /**
   * The body, which describes the step's dialog. Say what the target is: a
   * modal step leaves it out of reach, and the spotlight says nothing to a
   * screen reader.
   */
  children?: React.ReactNode;
  /**
   * The side of the target the panel sits on. It flips to the opposite side
   * when it doesn't fit, or to a side across when neither does, as beside a
   * target on a phone, and stays inside the viewport.
   * @defaultValue 'bottom'
   */
  position?: TourStepPosition;
  /**
   * This step's own `overlay`, in place of the tour's.
   * @defaultValue the tour's
   */
  overlay?: boolean;
  /**
   * Media above the header, such as an image or a short clip, which fills
   * the step's width. Give an image the `alt` it needs, which is `""` when
   * the body already says what it shows, and don't autoplay motion when the
   * user asks for less of it.
   */
  cover?: React.ReactNode;
  /**
   * This step's footer, in place of the tour's `footer` or the default one.
   * `null` leaves the step without one.
   */
  footer?: React.ReactNode;
}

/**
 * Props for Tour.Skip, Tour.Back and Tour.Next: the props of a `Button`
 * rendered as a `<button>`.
 * @extraProp {'button' | 'submit' | 'reset'} [type='button'] - Button type. Defaults to `'button'`, so a part inside a form doesn't submit it. The arrow keys press Next and Back as a click does, so one given `'submit'` submits its form on an arrow key too.
 * @extraProp {React.MouseEventHandler<HTMLButtonElement>} [onClick] - Runs before the part acts on the tour. Call `preventDefault()` to keep it from acting.
 */
export interface TourButtonProps
  extends
    ButtonOwnProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> {}

/**
 * Props for Tour.Progress, the progress line, on its `<span>`.
 */
export interface TourProgressProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** What the line says, in place of `labels.progress`. */
  children?: React.ReactNode;
}

/** What `useTour()` hands a part of a custom step. */
export interface TourState {
  /** The current step's index. */
  value: number;
  /** How many steps the tour has. */
  total: number;
  /**
   * Goes to the next step, finishes the tour on the last, and closes a
   * beacon's step.
   */
  next: () => void;
  /** Goes to the step before. Does nothing on the first, or on a beacon's step. */
  back: () => void;
  /** Ends the tour without finishing it, as Skip does, or closes a beacon's step. */
  skip: () => void;
  /** The tour's `mode`: `beacon` when this step came from a beacon. */
  mode: TourMode;
}

/** Where a step's target is on the screen. */
interface TargetBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The edges of a box on the screen. */
interface Edges {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/** A step's target as last found, and its box then. */
interface FoundTarget {
  element: HTMLElement | null;
  box: TargetBox | null;
  /**
   * The step it was looked up for, so what was found for the step before
   * isn't used for the next one, at another index or the same.
   */
  stepId?: string;
}

const nothingFound: FoundTarget = { element: null, box: null };

const sameBox = (a: TargetBox | null, b: TargetBox | null): boolean =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height);

/**
 * The element a target names, while it's on the page, box or no box. A
 * selector is looked up in `scope`, and then in the document when `scope`
 * is a shadow root. One that isn't valid matches nothing, and nor does no
 * target.
 */
function findTarget(
  target: TourTarget | undefined,
  scope: Document | ShadowRoot
): HTMLElement | null {
  let element: HTMLElement | null;
  if (target == null) {
    element = null;
  } else if (typeof target === 'string') {
    try {
      const doc = scope.ownerDocument ?? (scope as Document);
      element =
        scope.querySelector<HTMLElement>(target) ??
        (scope === doc ? null : doc.querySelector<HTMLElement>(target));
    } catch {
      element = null;
    }
  } else {
    element = 'current' in target ? target.current : target;
  }
  return element?.isConnected ? element : null;
}

/** The document or shadow root `node` is in, where a selector is looked up. */
const scopeOf = (node: Node): Document | ShadowRoot =>
  node.getRootNode() as Document | ShadowRoot;

/** What watching the page hands back. */
interface PageWatch {
  /** Asks for a measurement, in the next frame unless one is coming. */
  schedule: () => void;
  /** Watches more elements' sizes; `null` where there's no ResizeObserver. */
  sizes: ResizeObserver | null;
  /**
   * Listens for a scroll, and watches for changes, in the shadow roots the
   * targets found now are rendered in, which neither a window listener nor
   * the body's subtree reaches.
   */
  follow: (...targets: Array<HTMLElement | null>) => void;
  stop: () => void;
}

/**
 * Calls `update` once a frame at most, on a scroll, a resize of the window, a
 * change in the size of the body or of an element given to `sizes`, or any
 * change to the page outside `root`: an element added or removed, or an
 * attribute changed. The body is watched because, on a page that scrolls as
 * a whole, it grows when something above a target does, such as an image
 * loading. Any attribute can bring a target in or move one (`hidden`, `open`,
 * `style`, a `data-` one a selector names), and the frame bounds the cost.
 * The tour's own changes can't, so they're left out. A tour in a shadow root
 * watches that root too, and so does a target in one, as `follow` finds
 * them, since the body's subtree reaches neither. A step's target and the
 * beacons' targets are both watched this way.
 */
function watchPage(root: HTMLElement, update: () => void): PageWatch {
  const doc = root.ownerDocument;
  const scope = scopeOf(root);
  const view = doc.defaultView as Window;
  let frame = 0;
  const run = () => {
    frame = 0;
    update();
  };
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(run);
  };
  const sizes =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => schedule());
  sizes?.observe(doc.body);
  // The tour's own changes can't move a target.
  const outside = (records: MutationRecord[]) =>
    records.some(record => !root.contains(record.target));
  const observer = new MutationObserver(records => {
    if (outside(records)) schedule();
  });
  const changes = { childList: true, subtree: true, attributes: true };
  // The body, the tour's own shadow root, and the shadow roots the targets
  // are in, which neither one's subtree reaches.
  const observe = (roots: readonly ShadowRoot[]) => {
    observer.observe(doc.body, changes);
    if (scope !== doc) observer.observe(scope, changes);
    for (const shadow of roots) {
      if (shadow !== scope) observer.observe(shadow, changes);
    }
  };
  observe([]);
  view.addEventListener('scroll', schedule, { passive: true, capture: true });
  view.addEventListener('resize', schedule, { passive: true });
  const shadowScrolls = listenInShadowRoots('scroll', schedule, {
    passive: true,
    capture: true,
  });
  // The helper's own list, none yet, which stays the same array until the
  // roots change.
  let followed = shadowScrolls.follow();
  return {
    schedule,
    sizes,
    follow: (...targets) => {
      const roots = shadowScrolls.follow(...targets);
      if (roots === followed) return;
      followed = roots;
      // Changes not yet delivered would go with the old registrations.
      const pending = observer.takeRecords();
      observer.disconnect();
      observe(roots);
      if (outside(pending)) schedule();
    },
    stop: () => {
      view.cancelAnimationFrame(frame);
      sizes?.disconnect();
      observer.disconnect();
      view.removeEventListener('scroll', schedule, { capture: true });
      view.removeEventListener('resize', schedule);
      shadowScrolls.stop();
    },
  };
}

/**
 * Finds the current step's target and its box while the step shows, and
 * measures it again, once a frame at most, on a scroll, a resize of the
 * window, a change in the target's size, or any change to the page outside
 * the tour: an element added or removed, or an attribute changed. A target
 * moved by something else, as a transform or a transition slides one along,
 * or by content above it that grows inside a scrolling element, is followed
 * at the next of those. What's returned is only ever what was found for this
 * step.
 */
function useTourTarget(
  rootRef: React.RefObject<HTMLDivElement | null>,
  target: TourTarget | undefined,
  stepId: string,
  active: boolean
): FoundTarget {
  const [found, setFound] = useState(nothingFound);

  useClientLayoutEffect(() => {
    if (!active) return undefined;
    // The root renders whenever the tour shows, so it's on the page here.
    const root = rootRef.current as HTMLDivElement;
    const scope = scopeOf(root);
    // The element watched for size as the target, box or no box, so one
    // that gets a box is noticed.
    let watched: HTMLElement | null = null;
    const update = () => {
      const candidate = findTarget(target, scope);
      watch.follow(candidate);
      if (candidate !== watched) {
        if (watched) watch.sizes?.unobserve(watched);
        if (candidate) watch.sizes?.observe(candidate);
        watched = candidate;
      }
      const element =
        candidate && candidate.getClientRects().length > 0 ? candidate : null;
      const rect = element?.getBoundingClientRect();
      const box = rect
        ? {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }
        : null;
      // What matters is what was found, not the target's identity, which
      // an inline ref object changes on every render.
      setFound(prev =>
        prev.element === element &&
        sameBox(prev.box, box) &&
        prev.stepId === stepId
          ? prev
          : { element, box, stepId }
      );
      if (target != null && !element) {
        warnOnce(
          `Tour:missing-target:${typeof target === 'string' ? target : ''}`,
          '[bestax-bulma] A Tour.Step showed without its target on the page, ' +
            'or with a target that has no box, so it is centered until the ' +
            'target turns up.' +
            (typeof target === 'string' ? ` Target: "${target}".` : '')
        );
      }
    };
    const watch = watchPage(root, update);
    update();
    return watch.stop;
  }, [active, target, stepId, rootRef]);

  return active && found.stepId === stepId ? found : nothingFound;
}

/** Where a beacon sits: its target's top end corner, on the screen. */
interface BeaconPlace {
  element: HTMLElement;
  top: number;
  left: number;
}

/** Each step's beacon place, by the step's key. */
type BeaconPlaces = ReadonlyMap<React.Key | null, BeaconPlace | null>;

const samePlaces = (a: BeaconPlaces, b: BeaconPlaces): boolean =>
  a.size === b.size &&
  [...a].every(([key, place]) => {
    const other = b.get(key);
    return place === null || !other
      ? place === (other ?? null) && b.has(key)
      : place.element === other.element &&
          place.top === other.top &&
          place.left === other.left;
  });

/**
 * Where each step's beacon sits: over its target's top end corner, the right
 * one or, under right-to-left text, the left, or `null` for a step with no
 * target on the page with a box, or one that isn't in view, or whose top end
 * corner isn't. It runs for the whole of a beacon tour, a step's
 * open time included, so the beacons come back where their targets are now,
 * at once, for focus to go to one. The places are kept by each step's key, so
 * a render that adds, removes or reorders steps keeps each beacon at its own
 * target, and such a render, or one that points a step elsewhere, measures
 * again at once. Otherwise they're measured once a frame at most on a
 * scroll, a resize of the window, a change in a target's size or the body's,
 * or any change to the page outside the tour, as a step's target is. Whether
 * a target is in view comes from one IntersectionObserver on the viewport,
 * which counts clipping by a scrolling ancestor too.
 */
function useBeaconPlaces(
  rootRef: React.RefObject<HTMLDivElement | null>,
  steps: ReadonlyArray<React.ReactElement<TourStepProps>>,
  active: boolean
): ReadonlyArray<BeaconPlace | null> {
  const [places, setPlaces] = useState<BeaconPlaces>(() => new Map());
  const [outOfView, setOutOfView] = useState<ReadonlySet<Element>>(
    () => new Set()
  );
  const stepsRef = useLatestRef(steps);
  const updateRef = useRef<(() => void) | null>(null);
  // The steps' keys and targets as last measured, so a render that changes
  // them measures at once rather than a frame later, and each beacon is
  // drawn at its own step's target.
  const measuredRef = useRef<{ keys: unknown[]; targets: unknown[] } | null>(
    null
  );

  useClientLayoutEffect(() => {
    if (!active) return undefined;
    // The root renders for the whole of an open beacon tour.
    const root = rootRef.current as HTMLDivElement;
    const scope = scopeOf(root);
    // Each target found, box or no box, so one that gets a box is noticed.
    const watched = new Set<HTMLElement>();
    const inView =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(entries => {
            setOutOfView(prev => {
              const next = new Set(prev);
              for (const entry of entries) {
                if (entry.isIntersecting) next.delete(entry.target);
                else next.add(entry.target);
              }
              return next.size === prev.size &&
                [...next].every(element => prev.has(element))
                ? prev
                : next;
            });
          });
    const update = () => {
      const targets = stepsRef.current.map(step => step.props.target);
      const found = targets.map(target => findTarget(target, scope));
      watch.follow(...found);
      const now = new Set(found.filter(element => element !== null));
      const gone: HTMLElement[] = [];
      for (const element of watched) {
        if (now.has(element)) continue;
        watch.sizes?.unobserve(element);
        inView?.unobserve(element);
        watched.delete(element);
        gone.push(element);
      }
      // A target no longer watched has nothing more to say about being in
      // view, and isn't held on to.
      if (gone.length > 0) {
        setOutOfView(prev =>
          gone.some(element => prev.has(element))
            ? new Set(
                [...prev].filter(
                  element => !gone.includes(element as HTMLElement)
                )
              )
            : prev
        );
      }
      for (const element of now) {
        if (watched.has(element)) continue;
        watch.sizes?.observe(element);
        inView?.observe(element);
        watched.add(element);
      }
      measuredRef.current = {
        keys: stepsRef.current.map(step => step.key),
        targets,
      };
      // A beacon sits on its target's top end corner, so that corner has to
      // be in view as well as some of the target: a tall target scrolled
      // partway past the top of the screen, or of a panel that scrolls,
      // would put its beacon where the target doesn't show.
      const next = found.map(element => {
        if (!element || element.getClientRects().length === 0) return null;
        const rect = element.getBoundingClientRect();
        const rtl = getComputedStyle(element).direction === 'rtl';
        const top = rect.top;
        const left = rtl ? rect.left : rect.right;
        // The target's pixel at that corner, so a target that only touches
        // an edge shows no beacon on it.
        const corner = rtl
          ? { top, left, bottom: top + 1, right: left + 1 }
          : { top, left: left - 1, bottom: top + 1, right: left };
        return isInView(element, corner) ? { element, top, left } : null;
      });
      const byKey: BeaconPlaces = new Map(
        stepsRef.current.map((step, i) => [step.key, next[i]])
      );
      setPlaces(prev => (samePlaces(prev, byKey) ? prev : byKey));
      // The warnings cost a walk of the steps, so a production build, which
      // drops them, skips it.
      if (!isDev()) return;
      targets.forEach((target, i) => {
        if (target == null) {
          warnOnce(
            'Tour:beacon-no-target',
            '[bestax-bulma] A Tour.Step in beacon mode has no target, so it ' +
              'has no beacon.'
          );
          return;
        }
        if (found[i] && found[i].getClientRects().length > 0) return;
        warnOnce(
          `Tour:beacon-missing-target:${typeof target === 'string' ? target : ''}`,
          '[bestax-bulma] A Tour.Step in beacon mode has no target on the ' +
            'page with a box, so it has no beacon until one turns up.' +
            (typeof target === 'string' ? ` Target: "${target}".` : '')
        );
      });
      // Tab reaches the beacons in step order, which should be the order
      // the page reads in.
      // Elements in separate trees, as in two shadow roots, have no order to
      // compare.
      const placed = next.filter(place => place !== null);
      if (
        placed.some((place, i) => {
          if (i === 0) return false;
          const order = placed[i - 1].element.compareDocumentPosition(
            place.element
          );
          return (
            (order & Node.DOCUMENT_POSITION_PRECEDING) !== 0 &&
            (order & Node.DOCUMENT_POSITION_DISCONNECTED) === 0
          );
        })
      ) {
        warnOnce(
          'Tour:beacon-order',
          '[bestax-bulma] A beacon tour has its targets out of document ' +
            'order, so Tab reaches the beacons in an order the page does ' +
            'not read in. Order the Tour.Steps as the page reads.'
        );
      }
    };
    const watch = watchPage(root, update);
    updateRef.current = update;
    update();
    return () => {
      updateRef.current = null;
      measuredRef.current = null;
      watch.stop();
      inView?.disconnect();
      // Nothing held on to while the tour is closed, and nothing stale when
      // it opens again.
      setPlaces(new Map());
      setOutOfView(new Set());
    };
  }, [active, rootRef, stepsRef]);

  // A render can add, remove or reorder steps, or point one elsewhere, and
  // is measured at once when it does.
  useClientLayoutEffect(() => {
    const measured = measuredRef.current;
    if (
      measured &&
      sameItems(
        measured.keys,
        steps.map(step => step.key)
      ) &&
      sameItems(
        measured.targets,
        steps.map(step => step.props.target)
      )
    ) {
      return;
    }
    updateRef.current?.();
  });

  return steps.map(step => {
    const place = places.get(step.key) ?? null;
    return place && !outOfView.has(place.element) ? place : null;
  });
}

/** Whether two lists hold the same items, in the same order. */
const sameItems = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a.length === b.length && a.every((item, i) => item === b[i]);

/** Whether all of `element` is in view. */
const isFullyVisible = (element: HTMLElement): boolean =>
  isInView(element, element.getBoundingClientRect());

/**
 * Whether `rect`, a box on the screen that `element` draws in, is all in
 * view: inside the viewport, and inside each ancestor that clips it, as
 * `clippingAncestors` finds them.
 */
function isInView(element: HTMLElement, rect: Edges): boolean {
  const doc = element.ownerDocument;
  const inside = (box: Edges) =>
    rect.top >= box.top &&
    rect.left >= box.left &&
    rect.bottom <= box.bottom &&
    rect.right <= box.right;
  // The root element's client area, which leaves out a classic scrollbar.
  const { clientWidth, clientHeight } = doc.documentElement;
  if (!inside({ top: 0, left: 0, bottom: clientHeight, right: clientWidth })) {
    return false;
  }
  for (const { element: node, clipsX, clipsY } of clippingAncestors(element)) {
    const box = node.getBoundingClientRect();
    const clip = {
      top: clipsY ? box.top : -Infinity,
      bottom: clipsY ? box.bottom : Infinity,
      left: clipsX ? box.left : -Infinity,
      right: clipsX ? box.right : Infinity,
    };
    if (!inside(clip)) return false;
  }
  return true;
}

/**
 * Whether a title or a body has something to show: any child but `null`,
 * `undefined`, a boolean or an empty string, in an array too, which the
 * shared `isGiven` doesn't open.
 */
const showsSomething = (node: React.ReactNode): boolean =>
  React.Children.toArray(node).some(child => child !== '');

/**
 * Whether the element uses the arrow keys itself, as a text field, a
 * select, a slider or a tab does, so they don't change the step from it.
 */
const usesArrows = (element: Element): boolean =>
  element.matches(
    'input, select, textarea, audio[controls], video[controls], ' +
      '[contenteditable]:not([contenteditable="false"])'
  ) ||
  !['', 'button', 'link', 'dialog'].includes(
    element.getAttribute('role') ?? ''
  );

/**
 * Sets `ownRef` and the ref a consumer forwarded to `node`, for a callback
 * ref. A consumer's callback that returns a cleanup, as React 19 allows, has
 * it held in `cleanupRef` and run on detach in place of a call with `null`,
 * on React 18 as well.
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

/** The words a tour writes once its labels are filled in. */
interface TourWords {
  skip: string;
  back: string;
  next: string;
  done: string;
  close: string;
  beacon: string;
  beacons: string;
}

interface TourContextValue {
  index: number;
  /**
   * Which step shows: its index and its key, so a different step at the
   * same index, after the steps change, counts as a change too.
   */
  stepId: string;
  total: number;
  /** Whether the step came from a beacon, so it stands alone. */
  beacon: boolean;
  modal: boolean;
  /** Whether Escape from inside a non-modal step ends the tour. */
  closeOnEscape: boolean;
  /** The side of its target the panel sits on, or `center`, and where. */
  placement: { side: AnchoredSide | 'center'; top?: number; left?: number };
  titleAs: TourTitleElement;
  words: TourWords;
  /** The progress line for the current step, empty on a beacon's step. */
  progress: string;
  stepRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Whether the step held focus as it last went from the page. */
  focusHeldRef: React.MutableRefObject<boolean>;
  /** The target the step points at, on the page with a box, or `null`. */
  target: HTMLElement | null;
  markInsidePress: (event: React.PointerEvent) => void;
  /**
   * Next's action: the next step, the end of the tour on the last, or the
   * close of a beacon's step.
   */
  next: () => void;
  /** Back's action: the step before, or nothing on the first. */
  back: () => void;
  /** Ends the tour without finishing it, or closes a beacon's step. */
  skip: () => void;
  /** The tour's own `footer`, in place of the default one. */
  footer: React.ReactNode;
  /** What `useTour()` returns, kept while the step and total stay. */
  state: TourState;
}

const TourContext = createContext<TourContextValue | null>(null);

/** A part of a step the tour finds in its panel when it needs it. */
type TourPart =
  'step' | 'skip' | 'back' | 'next' | 'header' | 'body' | 'footer';

/**
 * The step's part, found in its panel now by the `data-tour-part` each sets:
 * the first of its kind that belongs to this step rather than to a tour
 * rendered inside it, has a box, is shown and enabled the way the focus
 * trap reads a tab stop (not `inert`, `visibility: hidden` or disabled), and
 * takes a press: not `aria-disabled` and not `pointer-events: none`, which
 * is how a loading or static Bulma button holds off a pointer. Focus starts
 * on the Next it finds, and the arrows press its Next and Back, so neither
 * reaches one a layout hides or a pointer couldn't press.
 */
const findPart = (panel: HTMLElement, part: TourPart): HTMLElement | null =>
  Array.from(
    panel.querySelectorAll<HTMLElement>(`[data-tour-part="${part}"]`)
  ).find(
    el =>
      el.closest('[data-tour-part="step"]') === panel &&
      el.getClientRects().length > 0 &&
      isRenderedAndEnabled(el, panel) &&
      el.getAttribute('aria-disabled') !== 'true' &&
      getComputedStyle(el).pointerEvents !== 'none'
  ) ?? null;

/**
 * Moves focus to where a step starts: its Next, else the first control in
 * its footer, then in its body, then in its header, which holds the close
 * button, and last anywhere in it. A Next that won't take focus is passed
 * over.
 */
function focusStart(panel: HTMLElement): void {
  const holds = (part: HTMLElement) =>
    part.contains(getActiveElementInTree(panel));
  const next = findPart(panel, 'next');
  next?.focus();
  if (next && holds(next)) return;
  for (const name of ['footer', 'body', 'header'] as const) {
    const region = findPart(panel, name);
    if (!region) continue;
    focusTabStop(region);
    if (holds(region)) return;
  }
  focusTabStop(panel);
}

/**
 * The dimmed page with a hole cut around the target: an SVG mask, which
 * keeps dimming in forced colors where a box-shadow cutout computes to
 * nothing. The hole is grown by the spotlight padding in the stylesheet.
 */
function TourOverlay({ box }: { box: TargetBox | null }) {
  const maskId = `tour-mask-${useId().replace(/[^\w-]/g, '')}`;
  const overlayClass = usePrefixedClassNames('tour-overlay');
  const spotlightClass = usePrefixedClassNames('tour-spotlight');
  const ringClass = usePrefixedClassNames('tour-spotlight-ring');
  const pad = 'var(--bulma-tour-spotlight-padding)';
  const geometry: React.CSSProperties | null = box && {
    x: `calc(${box.left}px - ${pad})`,
    y: `calc(${box.top}px - ${pad})`,
    width: `calc(${box.width}px + 2 * ${pad})`,
    height: `calc(${box.height}px + 2 * ${pad})`,
  };
  return (
    <svg className={overlayClass} aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          {geometry && (
            <rect className={spotlightClass} style={geometry} fill="black" />
          )}
        </mask>
      </defs>
      <rect width="100%" height="100%" mask={`url(#${maskId})`} />
      {geometry && <rect className={ringClass} style={geometry} />}
    </svg>
  );
}

/**
 * A `Button` that ends the tour early, labelled `labels.skip` unless it has children. It renders nothing on a beacon's step.
 *
 * @function
 * @param {TourButtonProps} props - Props for the Tour.Skip component.
 * @returns {JSX.Element | null} The button inside a step, else nothing.
 */
export const TourSkip = forwardRef<HTMLButtonElement, TourButtonProps>(
  ({ onClick, color = 'text', children, ...props }, ref) => {
    const tour = useContext(TourContext);
    if (!tour || tour.beacon) return null;
    return (
      <Button
        {...props}
        ref={ref}
        color={color}
        type={buttonType(props.type)}
        data-tour-part="skip"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          if (!e.defaultPrevented) tour.skip();
        }}
      >
        {showsSomething(children) ? children : tour.words.skip}
      </Button>
    );
  }
);

TourSkip.displayName = 'Tour.Skip';

/**
 * A `Button` to the step before, labelled `labels.back` unless it has children. It renders nothing on the first step or on a beacon's step, and ArrowLeft in the step, ArrowRight under right-to-left text, presses it.
 *
 * @function
 * @param {TourButtonProps} props - Props for the Tour.Back component.
 * @returns {JSX.Element | null} The button inside a step after the first, else nothing.
 */
export const TourBack = forwardRef<HTMLButtonElement, TourButtonProps>(
  ({ onClick, children, ...props }, ref) => {
    const tour = useContext(TourContext);
    if (!tour || tour.beacon || tour.index === 0) return null;
    return (
      <Button
        {...props}
        ref={ref}
        type={buttonType(props.type)}
        data-tour-part="back"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          if (!e.defaultPrevented) tour.back();
        }}
      >
        {showsSomething(children) ? children : tour.words.back}
      </Button>
    );
  }
);

TourBack.displayName = 'Tour.Back';

/**
 * A `Button` to the next step, labelled `labels.next`, or `labels.done` on the last step, where it finishes the tour, unless it has children. On a beacon's step it reads `labels.done` and closes the step. Focus starts on it as a step opens, and ArrowRight in the step, ArrowLeft under right-to-left text, presses it, except on the last step and on a beacon's step.
 *
 * @function
 * @param {TourButtonProps} props - Props for the Tour.Next component.
 * @returns {JSX.Element | null} The button inside a step, else nothing.
 */
export const TourNext = forwardRef<HTMLButtonElement, TourButtonProps>(
  ({ onClick, color = 'primary', children, ...props }, ref) => {
    const tour = useContext(TourContext);
    if (!tour) return null;
    const { next, words } = tour;
    const label =
      tour.beacon || tour.index === tour.total - 1 ? words.done : words.next;
    return (
      <Button
        {...props}
        ref={ref}
        color={color}
        type={buttonType(props.type)}
        data-tour-part="next"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          if (!e.defaultPrevented) next();
        }}
      >
        {showsSomething(children) ? children : label}
      </Button>
    );
  }
);

TourNext.displayName = 'Tour.Next';

/**
 * The progress line, "Step 2 of 5" by default, from `labels.progress`. It renders nothing on a beacon's step.
 *
 * @function
 * @param {TourProgressProps} props - Props for the Tour.Progress component.
 * @returns {JSX.Element | null} The line inside a step, else nothing.
 */
export const TourProgress: React.FC<TourProgressProps> = ({
  className,
  children,
  ...props
}) => {
  const tour = useContext(TourContext);
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const progressClass = usePrefixedClassNames('tour-progress');
  if (!tour || tour.beacon) return null;
  return (
    <span
      className={classNames(progressClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {showsSomething(children) ? children : tour.progress}
    </span>
  );
};

TourProgress.displayName = 'Tour.Progress';

/**
 * The tour's state and actions, for a part of a custom step: the step, the
 * total, and Next's, Back's and Skip's actions. The actions keep their
 * identity from render to render and act on the step the tour is on when
 * they're called, and the object itself changes only when the step or the
 * total does, so a dependency list can name it. `null` outside a step.
 *
 * @function useTour
 * @returns {TourState | null} The tour's state inside a step, else `null`.
 *
 * @example
 * function StepCount() {
 *   const tour = useTour();
 *   return tour ? <Tag>{tour.value + 1}/{tour.total}</Tag> : null;
 * }
 */
export function useTour(): TourState | null {
  return useContext(TourContext)?.state ?? null;
}

interface TourPanelProps extends TourStepProps {
  tour: TourContextValue;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
}

/** The current step's panel, which stays mounted from step to step. */
function TourPanel({
  tour,
  forwardedRef,
  target: _target,
  position: _position,
  overlay: _overlay,
  cover,
  footer,
  title,
  children,
  className,
  style,
  onKeyDown,
  onPointerDownCapture,
  ...props
}: TourPanelProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const { index, total, placement, words } = tour;
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;
  const titleRef = useRef<HTMLElement | null>(null);
  const { stepRef, focusHeldRef } = tour;
  const cleanupRef = useRef<(() => void) | null>(null);
  // The panel, as state, for the popups in a modal step to portal into, as
  // Modal's do: outside it, its `aria-modal` hides them from screen readers
  // and the inert page takes them.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      attachRefs(node, stepRef, forwardedRef, cleanupRef);
      setPanel(node);
    },
    [stepRef, forwardedRef]
  );

  // Whether the step holds focus at the moment it goes: a layout effect's
  // cleanup runs while the panel is still on the page, before focus falls
  // out of it, so a click on the page's background before the step closes
  // isn't mistaken for focus in it.
  useClientLayoutEffect(() => {
    const panel = stepRef.current as HTMLDivElement;
    return () => {
      focusHeldRef.current = panel.contains(getActiveElementInTree(panel));
    };
  }, [stepRef, focusHeldRef]);

  const hasTitle = showsSomething(title);
  const named =
    hasTitle || Boolean(rest['aria-label']) || Boolean(rest['aria-labelledby']);
  useEffect(() => {
    if (!named) {
      warnOnce(
        'Tour:unnamed-step',
        '[bestax-bulma] A Tour.Step showed with no accessible name. Give it ' +
          'a title, or an aria-label.'
      );
    }
  }, [named]);

  // After a step change: focus stays on the control used, and goes where
  // the step starts when that control has gone, as Back does on the first
  // step: its Next, else the footer's first control, then the body's, then
  // the close button, as focusStart has it. The status
  // line then says where the tour is, since a dialog whose name changes
  // isn't announced again. A beacon's step stands alone, so it has no
  // progress to say.
  const [said, setSaid] = useState('');
  const { stepId, progress, beacon } = tour;
  const shownStepRef = useRef(stepId);
  const ariaLabel = rest['aria-label'];
  useEffect(() => {
    if (shownStepRef.current === stepId) return;
    shownStepRef.current = stepId;
    const panel = stepRef.current as HTMLDivElement;
    if (panel.ownerDocument.activeElement === panel.ownerDocument.body) {
      focusStart(panel);
    }
    if (beacon) return;
    const name = titleRef.current ? spokenText(titleRef.current) : ariaLabel;
    setSaid(name ? `${progress}: ${name}` : progress);
  }, [stepId, progress, ariaLabel, beacon, stepRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const from = e.target as HTMLElement;
    // A key used already, or from a dialog nested in the step, such as a
    // Popover's, isn't the tour's.
    if (
      e.defaultPrevented ||
      from.closest('[role="dialog"], [role="alertdialog"]') !== e.currentTarget
    ) {
      return;
    }
    // A modal step takes Escape through the overlay stack, on `window`.
    if (e.key === 'Escape') {
      if (!tour.modal && tour.closeOnEscape) {
        e.preventDefault();
        tour.skip();
      }
      return;
    }
    // Without the overlay, a Tab that would leave the step, from its last
    // control, Next in the default footer, goes on to the target rather than
    // past the end of the page, where the step's portal sits. It asks what
    // a focus trap asks before it wraps. A target with nothing that takes
    // focus leaves the key to the browser.
    const { target } = tour;
    if (e.key === 'Tab' && !e.shiftKey && !tour.modal && target) {
      if (tabLeaves(e.currentTarget)) {
        focusTabStop(target);
        if (target.contains(getActiveElementInTree(target))) {
          e.preventDefault();
        }
      }
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    // A control that uses the arrows keeps them.
    if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || usesArrows(from)) {
      return;
    }
    // The arrows press the step's own Next and Back, so one that's disabled,
    // loading or aria-disabled, or whose onClick prevents, holds for the keys
    // too, and a step without one ignores the key. On the last step Next
    // would finish the tour, which a key never does, and a beacon's step has
    // nowhere to move to.
    if (tour.beacon) return;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const forward = (e.key === 'ArrowRight') !== rtl;
    if (forward && index === total - 1) return;
    const part = findPart(e.currentTarget, forward ? 'next' : 'back');
    if (!part) return;
    e.preventDefault();
    part.click();
  };

  const TitleTag = tour.titleAs;
  const panelClass = usePrefixedClassNames('tour-step', {
    'is-centered': placement.side === 'center',
    [`is-${placement.side}`]: placement.side !== 'center',
  });
  const headerClass = usePrefixedClassNames('tour-step-header');
  const titleClass = usePrefixedClassNames('tour-step-title');
  const bodyClass = usePrefixedClassNames('tour-step-body');
  const footerClass = usePrefixedClassNames('tour-step-footer');
  const coverClass = usePrefixedClassNames('tour-step-cover');
  // The step's own footer, else the tour's, else the default, which is built
  // from the same parts a custom one is.
  const footerContent =
    footer !== undefined ? (
      footer
    ) : tour.footer !== undefined ? (
      tour.footer
    ) : (
      <>
        <TourSkip />
        <TourProgress />
        <Buttons>
          <TourBack />
          <TourNext />
        </Buttons>
      </>
    );

  return (
    <div
      {...rest}
      // After the spread, reading through it, so a key it carries with no
      // value doesn't take the title's name or the body's description away.
      aria-labelledby={
        rest['aria-labelledby'] ||
        (hasTitle && !rest['aria-label'] ? titleId : undefined)
      }
      aria-describedby={
        rest['aria-describedby'] ||
        (showsSomething(children) ? bodyId : undefined)
      }
      ref={setRef}
      className={classNames(panelClass, bulmaHelperClasses, className)}
      style={{ ...style, top: placement.top, left: placement.left }}
      role="dialog"
      aria-modal={tour.modal ? 'true' : undefined}
      data-tour-part="step"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onPointerDownCapture={e => {
        onPointerDownCapture?.(e);
        tour.markInsidePress(e);
      }}
    >
      <PortalScope node={tour.modal ? panel : undefined}>
        {showsSomething(cover) && (
          <div key={`cover-${stepId}`} className={coverClass}>
            {cover}
          </div>
        )}
        <div className={headerClass} data-tour-part="header">
          {hasTitle && (
            <TitleTag
              ref={titleRef as React.Ref<HTMLHeadingElement>}
              id={titleId}
              className={titleClass}
            >
              {title}
            </TitleTag>
          )}
          <Delete ariaLabel={words.close} onClick={tour.skip} />
        </div>
        <div
          key={stepId}
          id={bodyId}
          className={bodyClass}
          data-tour-part="body"
        >
          {children}
        </div>
        {showsSomething(footerContent) && (
          <div className={footerClass} data-tour-part="footer">
            {footerContent}
          </div>
        )}
      </PortalScope>
      {/* In the step from the start, so a change to it is announced, and in
          the dialog, where a screen reader that hides the page around a
          modal dialog still hears it. */}
      <div role="status" aria-live="polite" style={visuallyHidden}>
        {said}
      </div>
    </div>
  );
}

interface TourBeaconProps {
  place: BeaconPlace;
  /** `labels.beacon`, read first. */
  label: string;
  /** The step's title, or its `aria-label` when it has none. */
  name: React.ReactNode;
  onOpen: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}

/**
 * A step's beacon: a button over its target's top end corner that opens the
 * step. Its name is `labels.beacon` and then the step's title, two pieces of
 * visually hidden text with a space between them, so a title that's a node
 * names it too and no punctuation has to suit every language.
 */
function TourBeacon({
  place,
  label,
  name,
  onOpen,
  buttonRef,
}: TourBeaconProps) {
  const beaconClass = usePrefixedClassNames('tour-beacon');
  return (
    <button
      ref={buttonRef}
      type="button"
      className={beaconClass}
      aria-haspopup="dialog"
      aria-expanded="false"
      style={{ top: place.top, left: place.left }}
      onClick={onOpen}
    >
      <span style={visuallyHidden}>{label}</span>{' '}
      <span style={visuallyHidden}>{name}</span>
    </button>
  );
}

/**
 * One step of the tour: a title, a body and the element it points at. It renders nothing where it's written.
 *
 * @function
 * @param {TourStepProps} props - Props for the Tour.Step component.
 * @returns {JSX.Element | null} The step's panel while it's the current step, else nothing.
 */
export const TourStep = forwardRef<HTMLDivElement, TourStepProps>(
  (props, ref) => {
    const tour = useContext(TourContext);
    return tour ? (
      <TourPanel {...props} tour={tour} forwardedRef={ref} />
    ) : null;
  }
);

TourStep.displayName = 'Tour.Step';

/**
 * The `Tour` component walks a user through an interface one step at a time, each step a panel pointing at an element with the rest of the page dimmed around it.
 *
 * Each step is a dialog. With the overlay, the default, it's modal: the
 * page under it is inert and still, Tab stays in the step and Escape ends
 * the tour. Without it, the step is a non-modal dialog and the page stays
 * usable.
 *
 * @function
 * @param {TourProps} props - Props for the Tour component.
 * @returns {JSX.Element | null} The tour while it's open, else nothing.
 *
 * @example
 * <Tour open={open} onOpenChange={setOpen} onFinish={saveToured}>
 *   <Tour.Step title="Welcome">A quick look around your dashboard.</Tour.Step>
 *   <Tour.Step target="#filters" title="Filters">
 *     The filters above the list narrow it by status and owner.
 *   </Tour.Step>
 * </Tour>
 */
const TourRoot = forwardRef<HTMLDivElement, TourProps>(
  (
    {
      children,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      value: controlledValue,
      defaultValue: givenDefaultValue,
      onChange,
      onFinish,
      overlay = true,
      closeOnEscape = true,
      closeOnClickOutside = false,
      portal = true,
      titleAs = 'h2',
      labels,
      footer,
      mode = 'guided',
      className,
      ...props
    },
    ref
  ) => {
    const beacon = mode === 'beacon';
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);

    const [isOpen, setOwnOpen] = useControlled(controlledOpen, defaultOpen);
    const requestOpen = (next: boolean) => {
      onOpenChange?.(next);
      setOwnOpen(next);
    };

    // An uncontrolled tour starts again at `defaultValue` each time it
    // opens, set as the render that opens it runs: the first step, or in
    // beacon mode none, only the beacons.
    const defaultValue = givenDefaultValue ?? (beacon ? -1 : 0);
    const [value, setOwnValue] = useControlled(controlledValue, defaultValue);
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (wasOpen !== isOpen) {
      setWasOpen(isOpen);
      if (isOpen) setOwnValue(defaultValue);
    }
    const requestValue = (next: number) => {
      onChange?.(next);
      setOwnValue(next);
    };

    const flat = flattenChildren(children);
    const steps = flat.filter(
      (child): child is React.ReactElement<TourStepProps> =>
        isElementOf(child, TourStep)
    );
    if (steps.length !== flat.length) {
      warnOnce(
        'Tour:not-a-step',
        '[bestax-bulma] <Tour> takes Tour.Step children, directly or in ' +
          'fragments, and leaves anything else out, including a component ' +
          'that renders a Tour.Step itself.'
      );
    }
    const total = steps.length;
    // A fraction is rounded down. In beacon mode, a value that names no
    // step, `-1`, one past the end or NaN, shows only the beacons, until
    // steps arrive that it names. In guided mode NaN counts as the first.
    const requested = Math.floor(value);
    const keyAtValue =
      requested >= 0 && requested < total ? steps[requested].key : null;
    const index = beacon
      ? keyAtValue === null
        ? -1
        : requested
      : Math.max(0, Math.min(requested || 0, total - 1));
    const step = steps[index] as React.ReactElement<TourStepProps> | undefined;
    const stepProps: TourStepProps = step?.props ?? {};
    // Which step shows, so a different one at the same index, after the
    // steps change, counts as a change too.
    const stepId = `${index} ${String(step?.key)}`;

    // Steps have to be measured against their targets, so nothing shows
    // until the page has hydrated.
    const hydrated = useIsHydrated();
    const shown = isOpen && hydrated && step !== undefined;
    const modal = shown && (stepProps.overlay ?? overlay);
    // The beacons show while the tour is open in beacon mode and no step is.
    const beaconsShown = beacon && isOpen && hydrated && !shown;
    const rootClass = classNames(
      usePrefixedClassNames('tour', {
        'is-beacon': beacon,
        'is-active': shown,
      }),
      bulmaHelperClasses,
      className
    );
    const beaconsClass = usePrefixedClassNames('tour-beacons');

    const rootRef = useRef<HTMLDivElement | null>(null);
    const rootCleanupRef = useRef<(() => void) | null>(null);
    const setRootRef = useCallback(
      (node: HTMLDivElement | null) =>
        attachRefs(node, rootRef, ref, rootCleanupRef),
      [ref]
    );
    const stepRef = useRef<HTMLDivElement | null>(null);

    const beaconPlaces = useBeaconPlaces(
      rootRef,
      steps,
      beacon && isOpen && hydrated
    );
    const beaconsRef = useRef(new Map<React.Key, HTMLButtonElement>());
    const focusHeldRef = useRef(false);

    const { element: target, box } = useTourTarget(
      rootRef,
      stepProps.target,
      stepId,
      shown
    );
    // What the step is placed against: the target as found, or, once that's
    // left the page, what the step's target finds now, so the step is never
    // placed against a detached element's empty box. With nothing found,
    // the step keeps its last place until the next measurement. A new object
    // for each, so the placement is measured afresh.
    const stepTarget = stepProps.target;
    const anchorRef = useMemo(
      () => ({
        get current() {
          if (!target || target.isConnected) return target;
          const now = findTarget(
            stepTarget,
            rootRef.current ? scopeOf(rootRef.current) : target.ownerDocument
          );
          return now && now.getClientRects().length > 0 ? now : null;
        },
      }),
      [target, stepTarget]
    );
    const position =
      stepProps.position && validTourStepPositions.includes(stepProps.position)
        ? stepProps.position
        : 'bottom';
    // Without a target, the step sits in the middle of the viewport.
    const placed = useAnchoredPosition(anchorRef, stepRef, {
      active: shown,
      position: target ? position : 'center',
      fixed: true,
      // The gap comes from the spotlight padding and the step offset, as a
      // margin on the side facing the target.
      offset: 0,
      styledGap: sideMarginGap,
      // The step's content changes with each step, and so does its size.
      followContent: true,
    });

    const close = () => requestOpen(false);

    // Next's, Back's and Skip's actions read the step as they're called and
    // keep their identity, so one a part keeps acts on the step the tour is
    // on, and an effect depending on one doesn't run again on every render.
    // What they read is updated in an insertion effect, which runs before
    // any layout effect, so a part's layout effect on the commit that shows
    // a step acts on that step. They do nothing while the tour is closed or
    // gone, so a timer a part left running can't finish or reopen it.
    // In beacon mode, Done, Skip's action and every way of dismissing a
    // step close only that step, and Back has nowhere to go.
    const latestRef = useRef({
      shown,
      beacon,
      index,
      total,
      requestValue,
      onFinish,
      close,
    });
    useInsertionEffect(() => {
      latestRef.current = {
        shown,
        beacon,
        index,
        total,
        requestValue,
        onFinish,
        close,
      };
      return () => {
        latestRef.current = { ...latestRef.current, shown: false };
      };
    });
    const next = useCallback(() => {
      const now = latestRef.current;
      if (!now.shown) return;
      if (now.beacon) {
        now.requestValue(-1);
        return;
      }
      if (now.index < now.total - 1) {
        now.requestValue(now.index + 1);
        return;
      }
      now.onFinish?.();
      now.close();
    }, []);
    const back = useCallback(() => {
      const now = latestRef.current;
      if (now.shown && !now.beacon && now.index > 0) {
        now.requestValue(now.index - 1);
      }
    }, []);
    const skip = useCallback(() => {
      const now = latestRef.current;
      if (!now.shown) return;
      if (now.beacon) now.requestValue(-1);
      else now.close();
    }, []);

    const tourMode: TourMode = beacon ? 'beacon' : 'guided';
    const state = useMemo<TourState>(
      () => ({ value: index, total, next, back, skip, mode: tourMode }),
      [index, total, next, back, skip, tourMode]
    );

    // A modal step joins the stack of open overlays, so Escape and Tab go to
    // whatever is on top: a Modal opened from a step holds both until it
    // closes. A non-modal step stays out of it, as a Popover does, and takes
    // Escape only from inside itself.
    const isTopmost = useOverlayStack(modal);
    useOverlayEscape(modal && closeOnEscape, isTopmost, skip);

    // The page goes inert before focus moves in, and its lock comes off
    // before focus is handed back, so focus can land on the opener again:
    // effects run, and clean up, in the order they're declared.
    useInertSiblings(rootRef, modal, true);
    useScrollLock(modal);
    const { portalContainer } = useConfig();
    const container = portal === true ? portalContainer : portal || undefined;
    useOverlayFocus(stepRef, shown, {
      modal,
      remountKey: container,
      initialFocus: focusStart,
      // A beacon's step hands focus to its beacon, below, once the beacons
      // are back.
      restore: () => !beacon,
    });

    // A tip closes when the steps change under it. The key of the step a
    // beacon or the value opened is kept, with the value it opened at, and
    // while the value
    // still names that index but the step there has another key, as when a
    // step before it is added or removed, or it's removed itself, the tip
    // closes: `-1`, through `onChange` too, once. The ref is cleared as it
    // fires, so a second run of the effect, as StrictMode makes, can't fire
    // it again. A controlled `value` still decides what shows. Any other
    // change of the value, the mode or `open` forgets the key. Otherwise the
    // tip showing is noted, for focus as it goes, below; a render that shows
    // another step at the old index, before the tip closes, isn't.
    const openedRef = useRef<{ key: React.Key; value: number } | null>(null);
    const seenRef = useRef({ beacon, isOpen });
    const shownTipRef = useRef<{
      key: React.Key;
      target: HTMLElement | null;
    } | null>(null);
    const requestValueRef = useLatestRef(requestValue);
    useClientLayoutEffect(() => {
      if (
        seenRef.current.beacon !== beacon ||
        seenRef.current.isOpen !== isOpen
      ) {
        seenRef.current = { beacon, isOpen };
        openedRef.current = null;
      }
      const opened = openedRef.current;
      if (opened && requested !== opened.value) {
        openedRef.current = null;
      } else if (opened && keyAtValue !== opened.key) {
        openedRef.current = null;
        requestValueRef.current(-1);
        return;
      }
      if (beacon && shown) {
        const key = (step as React.ReactElement).key as React.Key;
        // A tip the value opened, as `defaultValue` or a controlled one does,
        // is kept as one a beacon opened is.
        if (!openedRef.current) openedRef.current = { key, value: requested };
        shownTipRef.current = { key, target };
      }
    });

    // As a beacon's step goes, focus goes on only if the step held it at
    // that moment: to the step's beacon, as it would to a disclosure's
    // button, while the beacon is there, else to the step's target, its
    // first control or the target itself when it takes focus, as Tab from a
    // non-modal step does. One rule for a tip closed, a tip whose step went,
    // and the whole tour closed. A step that didn't hold focus moves none,
    // so a close the app makes doesn't pull the caret out of a field the
    // user moved to. It runs after the page's inert is lifted, so a modal
    // step's target can take focus, and after the beacons are back.
    useEffect(() => {
      if (shown) {
        // A guided step that took over from a tip, as a change of `mode`
        // makes, is the tour's own: it has no beacon to go back to.
        if (!beacon) shownTipRef.current = null;
        return;
      }
      const tip = shownTipRef.current;
      shownTipRef.current = null;
      if (!tip || !focusHeldRef.current) return;
      const button = beaconsRef.current.get(tip.key);
      if (button) button.focus();
      else if (tip.target?.isConnected) focusTabStop(tip.target);
    });

    // A modal step holds Tab and Shift+Tab while it's the topmost modal
    // overlay. A non-modal one doesn't, so the page and the target it points
    // at stay reachable from the keyboard.
    useEffect(() => {
      if (!modal) return undefined;
      return trapTab(
        () => stepRef.current,
        window,
        () => isTopmost('modal')
      );
    }, [modal, isTopmost]);

    // A step that turns modal while focus is out of it, as it can be after a
    // non-modal step, takes focus, since the rest of the page is going inert.
    // That includes a popup the step had portaled into <body>, which moves
    // into the modal step and loses focus as it does.
    useEffect(() => {
      if (!modal) return;
      const panel = stepRef.current as HTMLDivElement;
      if (!panel.contains(getActiveElementInTree(panel))) {
        focusStart(panel);
      }
    }, [modal]);

    const markInsidePress = useOutsidePress(
      stepRef,
      shown && closeOnClickOutside,
      skip
    );

    // A target that isn't all in view scrolls to the middle, smoothly unless
    // the user asks for less motion, read as it scrolls.
    useEffect(() => {
      if (!shown || !target || isFullyVisible(target)) return;
      const reduce = target.ownerDocument.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      target.scrollIntoView?.({
        block: 'center',
        inline: 'nearest',
        behavior: reduce ? 'instant' : 'smooth',
      });
    }, [shown, index, target]);

    const formatNumber = useScopedNumberFormat();
    const write = (n: number) => (formatNumber ? formatNumber(n) : String(n));
    // A beacon's step shows no progress, and with no step to show, as a
    // beacon tour with none open or a tour with no steps yet, the index is
    // -1, which `labels.progress` isn't written for.
    const progress =
      beacon || !step
        ? ''
        : labels?.progress
          ? labels.progress(index + 1, total)
          : `Step ${write(index + 1)} of ${write(total)}`;
    const words: TourWords = {
      skip: labels?.skip || 'Skip',
      back: labels?.back || 'Back',
      next: labels?.next || 'Next',
      done: labels?.done || 'Done',
      close: labels?.close || 'Close',
      beacon: labels?.beacon || 'Show tip',
      beacons: labels?.beacons || 'Tips',
    };

    if (!shown && !beaconsShown) return null;

    const beacons = beaconsShown
      ? steps.flatMap((beaconStep, i) => {
          const place = beaconPlaces[i];
          if (!place) return [];
          const { title, 'aria-label': ariaLabel } = beaconStep.props;
          return [
            <TourBeacon
              key={beaconStep.key}
              place={place}
              label={words.beacon}
              name={showsSomething(title) ? title : ariaLabel}
              onOpen={() => {
                openedRef.current = {
                  key: beaconStep.key as React.Key,
                  value: i,
                };
                requestValue(i);
              }}
              buttonRef={node => {
                const key = beaconStep.key as React.Key;
                if (node) beaconsRef.current.set(key, node);
                else beaconsRef.current.delete(key);
              }}
            />,
          ];
        })
      : [];

    const context: TourContextValue | undefined = step && {
      index,
      stepId,
      total,
      beacon,
      modal,
      closeOnEscape,
      placement: {
        side: target ? (placed.position as AnchoredSide) : 'center',
        top: placed.top,
        left: placed.left,
      },
      titleAs: validTourTitleElements.includes(titleAs) ? titleAs : 'h2',
      words,
      progress,
      stepRef,
      focusHeldRef,
      target,
      markInsidePress,
      next,
      back,
      skip,
      footer,
      state,
    };

    return (
      <Portal
        container={typeof portal === 'boolean' ? undefined : portal}
        disabled={portal === false}
      >
        <div className={rootClass} {...rest} ref={setRootRef}>
          {modal && <TourOverlay box={box} />}
          {shown && context && (
            <TourContext.Provider value={context}>
              {/* One key for every step, so the panel and its buttons stay
                  put and focus stays on the one that was used. */}
              {React.cloneElement(step as React.ReactElement, { key: 'step' })}
            </TourContext.Provider>
          )}
          {beacons.length > 0 && (
            <div
              className={beaconsClass}
              role="group"
              aria-label={words.beacons}
            >
              {beacons}
            </div>
          )}
        </div>
      </Portal>
    );
  }
);

TourRoot.displayName = 'Tour';

/** Tour with its Step part and the parts of a step's footer. */
export const Tour = withSubComponents(
  TourRoot,
  {
    Step: TourStep,
    Skip: TourSkip,
    Back: TourBack,
    Next: TourNext,
    Progress: TourProgress,
  },
  'Tour'
);

export default Tour;
