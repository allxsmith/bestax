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
import { useScopedNumberFormat } from '../helpers/localeFormat';
import { spokenText, visuallyHidden } from '../helpers/statusRegion';
import {
  flatParent,
  getActiveElementInTree,
  listenInShadowRoots,
} from '../helpers/shadowDom';
import { warnOnce } from '../helpers/devWarnings';
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
   * Next on the last step, which finishes the tour.
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
   * changes ("Step 2 of 5: Filters"). `step` counts from 1.
   * @defaultValue (step, total) => `Step ${step} of ${total}`, the numbers in
   * the LocaleProvider's locale
   */
  progress?: (step: number, total: number) => string;
}

/**
 * Props for the Tour component. The helper props, the other attributes and
 * the `ref` land on the `.tour` element in the portal, which holds the
 * overlay and the current step.
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
  open?: boolean;
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
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The current step's index (controlled). An index past either end shows
   * the nearest step, and a fraction is rounded down.
   */
  value?: number;
  /**
   * The step it starts on (uncontrolled), and goes back to each time it
   * opens.
   * @defaultValue 0
   */
  defaultValue?: number;
  /** Called with the new index when Back, Next or an arrow key changes the step. */
  onChange?: (value: number) => void;
  /**
   * Called when Done on the last step finishes the tour, before
   * `onOpenChange(false)`. Skip, the close button, Escape and a click
   * outside don't call it.
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
   * Ends the tour on Escape. With the overlay, from anywhere, while no
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
   * and Escape still end it.
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
  target?: TourTarget;
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
  /** Goes to the next step, and finishes the tour on the last. */
  next: () => void;
  /** Goes to the step before. Does nothing on the first. */
  back: () => void;
  /** Ends the tour without finishing it, as Skip does. */
  skip: () => void;
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
    const doc = root.ownerDocument;
    const scope = scopeOf(root);
    const view = doc.defaultView as Window;
    let frame = 0;
    // The element watched for size as the target, box or no box, so one
    // that gets a box is noticed.
    let watched: HTMLElement | null = null;
    // The body is watched as well: on a page that scrolls as a whole, it
    // grows when something above the target does, such as an image loading.
    const sizes =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => schedule());
    // A scroll inside a shadow root doesn't reach the window, so the shadow
    // roots the target is rendered in are listened on too, as each
    // measurement finds them.
    const shadowScrolls = listenInShadowRoots('scroll', () => schedule(), {
      passive: true,
      capture: true,
    });
    const update = () => {
      frame = 0;
      const candidate = findTarget(target, scope);
      shadowScrolls.follow(candidate);
      if (candidate !== watched) {
        if (watched) sizes?.unobserve(watched);
        if (candidate) sizes?.observe(candidate);
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
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(update);
    };
    sizes?.observe(doc.body);
    update();
    // Any attribute can bring a target in or move one (`hidden`, `open`,
    // `style`, a `data-` one a selector names), and the frame bounds the
    // cost. The tour's own changes can't, so they're left out. A tour in a
    // shadow root watches that root too, which the body's subtree doesn't
    // reach.
    const observer = new MutationObserver(records => {
      if (records.some(record => !root.contains(record.target))) schedule();
    });
    const changes = { childList: true, subtree: true, attributes: true };
    observer.observe(doc.body, changes);
    if (scope !== doc) observer.observe(scope, changes);
    view.addEventListener('scroll', schedule, { passive: true, capture: true });
    view.addEventListener('resize', schedule, { passive: true });
    return () => {
      view.cancelAnimationFrame(frame);
      sizes?.disconnect();
      observer.disconnect();
      view.removeEventListener('scroll', schedule, { capture: true });
      view.removeEventListener('resize', schedule);
      shadowScrolls.stop();
    };
  }, [active, target, stepId, rootRef]);

  return active && found.stepId === stepId ? found : nothingFound;
}

/**
 * Whether all of `element` is in view: inside the viewport, and inside each
 * ancestor that clips what overflows it.
 */
function isFullyVisible(element: HTMLElement): boolean {
  const doc = element.ownerDocument;
  const rect = element.getBoundingClientRect();
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
  for (
    let node = flatParent(element) as Element | null;
    node && node !== doc.body && node !== doc.documentElement;
    node = flatParent(node) as Element | null
  ) {
    // An ancestor with no box, as a slot is by default, clips nothing.
    if (node.getClientRects().length === 0) continue;
    const { overflowX, overflowY } = getComputedStyle(node);
    const clips = /auto|scroll|hidden|clip/.test(`${overflowX} ${overflowY}`);
    if (clips && !inside(node.getBoundingClientRect())) return false;
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
}

interface TourContextValue {
  index: number;
  /**
   * Which step shows: its index and its key, so a different step at the
   * same index, after the steps change, counts as a change too.
   */
  stepId: string;
  total: number;
  modal: boolean;
  /** Whether Escape from inside a non-modal step ends the tour. */
  closeOnEscape: boolean;
  /** The side of its target the panel sits on, or `center`, and where. */
  placement: { side: AnchoredSide | 'center'; top?: number; left?: number };
  titleAs: TourTitleElement;
  words: TourWords;
  /** The progress line for the current step. */
  progress: string;
  stepRef: React.MutableRefObject<HTMLDivElement | null>;
  /** The target the step points at, on the page with a box, or `null`. */
  target: HTMLElement | null;
  markInsidePress: (event: React.PointerEvent) => void;
  /** Next's action: the next step, or the end of the tour on the last. */
  next: () => void;
  /** Back's action: the step before, or nothing on the first. */
  back: () => void;
  /** Ends the tour without finishing it. */
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
 * A `Button` that ends the tour early, labelled `labels.skip` unless it has children.
 *
 * @function
 * @param {TourButtonProps} props - Props for the Tour.Skip component.
 * @returns {JSX.Element | null} The button inside a step, else nothing.
 */
export const TourSkip = forwardRef<HTMLButtonElement, TourButtonProps>(
  ({ onClick, color = 'text', children, ...props }, ref) => {
    const tour = useContext(TourContext);
    if (!tour) return null;
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
 * A `Button` to the step before, labelled `labels.back` unless it has children. It renders nothing on the first step, and ArrowLeft in the step, ArrowRight under right-to-left text, presses it.
 *
 * @function
 * @param {TourButtonProps} props - Props for the Tour.Back component.
 * @returns {JSX.Element | null} The button inside a step after the first, else nothing.
 */
export const TourBack = forwardRef<HTMLButtonElement, TourButtonProps>(
  ({ onClick, children, ...props }, ref) => {
    const tour = useContext(TourContext);
    if (!tour || tour.index === 0) return null;
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
 * A `Button` to the next step, labelled `labels.next`, or `labels.done` on the last step, where it finishes the tour, unless it has children. Focus starts on it as a step opens, and ArrowRight in the step, ArrowLeft under right-to-left text, presses it, except on the last step.
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
    const label = tour.index === tour.total - 1 ? words.done : words.next;
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
 * The progress line, "Step 2 of 5" by default, from `labels.progress`.
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
  if (!tour) return null;
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
  const { stepRef } = tour;
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
  // isn't announced again.
  const [said, setSaid] = useState('');
  const { stepId, progress } = tour;
  const shownStepRef = useRef(stepId);
  const ariaLabel = rest['aria-label'];
  useEffect(() => {
    if (shownStepRef.current === stepId) return;
    shownStepRef.current = stepId;
    const panel = stepRef.current as HTMLDivElement;
    if (panel.ownerDocument.activeElement === panel.ownerDocument.body) {
      focusStart(panel);
    }
    const name = titleRef.current ? spokenText(titleRef.current) : ariaLabel;
    setSaid(name ? `${progress}: ${name}` : progress);
  }, [stepId, progress, ariaLabel, stepRef]);

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
    // too, and a step without one ignores the key. On the last step Next would finish the tour,
    // which a key never does.
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
      defaultValue = 0,
      onChange,
      onFinish,
      overlay = true,
      closeOnEscape = true,
      closeOnClickOutside = false,
      portal = true,
      titleAs = 'h2',
      labels,
      footer,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const rootClass = classNames(
      usePrefixedClassNames('tour'),
      bulmaHelperClasses,
      className
    );

    const [isOpen, setOwnOpen] = useControlled(controlledOpen, defaultOpen);
    const requestOpen = (next: boolean) => {
      onOpenChange?.(next);
      setOwnOpen(next);
    };

    // An uncontrolled tour starts again at `defaultValue` each time it
    // opens, set as the render that opens it runs.
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
    // NaN, which no step has, counts as the first.
    const index = Math.max(0, Math.min(Math.floor(value) || 0, total - 1));
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

    const rootRef = useRef<HTMLDivElement | null>(null);
    const rootCleanupRef = useRef<(() => void) | null>(null);
    const setRootRef = useCallback(
      (node: HTMLDivElement | null) =>
        attachRefs(node, rootRef, ref, rootCleanupRef),
      [ref]
    );
    const stepRef = useRef<HTMLDivElement | null>(null);

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
    const latestRef = useRef({
      shown,
      index,
      total,
      requestValue,
      onFinish,
      close,
    });
    useInsertionEffect(() => {
      latestRef.current = {
        shown,
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
      if (now.index < now.total - 1) {
        now.requestValue(now.index + 1);
        return;
      }
      now.onFinish?.();
      now.close();
    }, []);
    const back = useCallback(() => {
      const now = latestRef.current;
      if (now.shown && now.index > 0) now.requestValue(now.index - 1);
    }, []);
    const skip = useCallback(() => {
      if (latestRef.current.shown) latestRef.current.close();
    }, []);
    const state = useMemo<TourState>(
      () => ({ value: index, total, next, back, skip }),
      [index, total, next, back, skip]
    );

    // A modal step joins the stack of open overlays, so Escape and Tab go to
    // whatever is on top: a Modal opened from a step holds both until it
    // closes. A non-modal step stays out of it, as a Popover does, and takes
    // Escape only from inside itself.
    const isTopmost = useOverlayStack(modal);
    useOverlayEscape(modal && closeOnEscape, isTopmost, close);

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
      close
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
    const progress = labels?.progress
      ? labels.progress(index + 1, total)
      : `Step ${write(index + 1)} of ${write(total)}`;

    if (!shown || !step) return null;

    const context: TourContextValue = {
      index,
      stepId,
      total,
      modal,
      closeOnEscape,
      placement: {
        side: target ? (placed.position as AnchoredSide) : 'center',
        top: placed.top,
        left: placed.left,
      },
      titleAs: validTourTitleElements.includes(titleAs) ? titleAs : 'h2',
      words: {
        skip: labels?.skip || 'Skip',
        back: labels?.back || 'Back',
        next: labels?.next || 'Next',
        done: labels?.done || 'Done',
        close: labels?.close || 'Close',
      },
      progress,
      stepRef,
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
          <TourContext.Provider value={context}>
            {/* One key for every step, so the panel and its buttons stay put
                and focus stays on the one that was used. */}
            {React.cloneElement(step, { key: 'step' })}
          </TourContext.Provider>
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
