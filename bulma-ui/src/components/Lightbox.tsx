import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { buttonType } from '../helpers/buttonType';
import { isDev, warnOnce } from '../helpers/devWarnings';
import { useLatestRef } from '../helpers/useLatestRef';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useNumberFormat } from '../helpers/localeFormat';
import { visuallyHidden } from '../helpers/statusRegion';
import { usePrefersReducedMotion } from '../helpers/usePrefersReducedMotion';
import { useSwipe } from '../helpers/useSwipe';
import { ChevronNextIcon, ChevronPrevIcon } from '../helpers/chevronIcons';
import { Modal } from './Modal';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Figure } from '../elements/Figure';
import { Loader } from '../elements/Loader';

/** One image a Lightbox shows. */
export interface LightboxItem {
  /** The full-size image's URL. */
  src: string;
  /**
   * The image's text alternative, which the status line reads after each
   * move. In a viewer the image is the content, so `''` is almost never
   * right; a development build warns once for an item without one.
   */
  alt: string;
  /** Shown under the image as its `<figcaption>`. */
  caption?: React.ReactNode;
  /** The `<img>`'s `srcSet`, so the browser picks a size for the screen. Preloading uses it too. */
  srcSet?: string;
  /** The `<img>`'s `sizes`, read with `srcSet`. */
  sizes?: string;
}

/**
 * The words a Lightbox writes. Each is English unless you give your own,
 * and the numbers in the default progress line are written in the
 * `LocaleProvider`'s locale.
 */
export interface LightboxLabels {
  /** The close button's name. "Close". */
  close?: string;
  /** The previous button's name. "Previous image". */
  previous?: string;
  /** The next button's name. "Next image". */
  next?: string;
  /** The zoom-in button's name. "Zoom in". */
  zoomIn?: string;
  /** The zoom-out button's name. "Zoom out". */
  zoomOut?: string;
  /** The button that fits the image again. "Reset zoom". */
  resetZoom?: string;
  /** The `Loader`'s name while an image loads. "Loading image". */
  loading?: string;
  /**
   * Shown, above the alt text, when an image fails to load. The status line
   * for a failed image starts with it, then a space and the line a loaded
   * image gets, so write it as a whole sentence, punctuated as your language
   * does. "This image didn't load."
   */
  loadError?: string;
  /** The button that tries a failed image again. "Retry". */
  retry?: string;
  /**
   * The start of the status line read after each move, which goes on with
   * a colon and the image's alt: "Image 3 of 10: Harbour at dusk". For a
   * failed image, `loadError` and a space come first.
   * `(current, total) => 'Image 3 of 10'`, counting from 1.
   */
  progress?: (current: number, total: number) => string;
}

/**
 * Props for the Lightbox component. Its children render where it stands,
 * with no wrapper. The helper props, the other attributes and the `ref`
 * land on the viewer's `.modal` element while it's open.
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the viewer's `.modal` element, `null` while it's closed.
 */
export interface LightboxProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onChange' | 'defaultValue' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** **Required.** The images, in order. */
  items: LightboxItem[];
  /** Rendered in place: usually `Lightbox.Trigger`s, in whatever layout you like. */
  children?: React.ReactNode;
  /** Whether the viewer is open (controlled). With no `items` it shows nothing. */
  open?: boolean;
  /**
   * Whether the viewer starts open (uncontrolled).
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /**
   * Called when a trigger, the close button, Escape, a click on the
   * background or a swipe down opens or closes the viewer, and with `false`
   * when `items` goes from some to none while it's open.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The index of the image shown (controlled). A value past either end is
   * shown as the last or the first image, or wrapped round with `repeat`,
   * without calling `onChange`.
   */
  value?: number;
  /**
   * The image an uncontrolled viewer shows when something other than a
   * trigger opens it. A trigger opens at its own `index`.
   * @defaultValue 0
   */
  defaultValue?: number;
  /**
   * Called with the new index when an arrow, a key or a swipe changes the
   * image, and when a trigger opens the viewer, with the trigger's `index`
   * even when that's the image already shown, before `onOpenChange(true)`.
   * A parent that opens the viewer from `value` hears the trigger that way.
   */
  onChange?: (value: number) => void;
  /**
   * Go from the last image to the first and back. Off, the previous and
   * next buttons are `aria-disabled` at the ends.
   * @defaultValue false
   */
  repeat?: boolean;
  /**
   * Zoom with the buttons, the wheel, a double click or tap, pinch and the
   * `+`, `-` and `0` keys, and pan a zoomed image by dragging or with the
   * arrow keys. Zoom waits for the image to load. `false` drops the zoom
   * buttons and all of it.
   * @defaultValue true
   */
  zoomable?: boolean;
  /**
   * How far an image zooms, as a multiple of its fitted size. The smallest
   * zoom is always the fitted size.
   * @defaultValue 3
   */
  maxZoom?: number;
  /**
   * Close on Escape. Only the topmost open overlay answers, as with Modal.
   * @defaultValue true
   */
  closeOnEscape?: boolean;
  /**
   * Close on a click on the dark background around the image. The space
   * around the image, beside the toolbar's buttons and under the caption is
   * all background.
   * @defaultValue true
   */
  closeOnClickOutside?: boolean;
  /**
   * Renders the viewer into a portal, as Modal's `portal` does: `true` for
   * the `ConfigProvider`'s `portalContainer` (`document.body` by default),
   * a selector string, or an element. `false` renders it in place, where a
   * transformed ancestor can trap it.
   * @defaultValue true
   */
  portal?: boolean | string | HTMLElement;
  /**
   * The dialog's accessible name. It stays the same from image to image;
   * the status line says which image is shown.
   * @defaultValue 'Image viewer'
   */
  ariaLabel?: string;
  /** The words it writes, for another language. */
  labels?: LightboxLabels;
}

/**
 * Props for Lightbox.Trigger, a `<button type="button"
 * aria-haspopup="dialog">` that opens the viewer. Its content names it, so
 * give the thumbnail inside a real `alt`. A ratio `Image` renders a
 * `<figure>`, and an image inside a figure doesn't name the button around
 * it, so give that `Image` `as="div"`. A development build warns for a
 * trigger outside a `Lightbox` or with no name.
 * @extraProp {React.Ref<HTMLButtonElement>} [ref] - Ref forwarded to the `<button>`.
 */
export interface LightboxTriggerProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** **Required.** The index in `items` the viewer opens at. */
  index: number;
  /**
   * What the button shows: a thumbnail, or text such as "View all photos".
   * A ratio `Image` here takes `as="div"`, since its `<figure>` would keep
   * the image's alt from naming the button.
   */
  children?: React.ReactNode;
}

/** What a trigger asks of the Lightbox around it. */
interface LightboxContextValue {
  openAt: (index: number) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

/** Each zoom button or key multiplies or divides the zoom by this. */
const ZOOM_STEP = 1.5;
/** Where a double click or a double tap zooms to. */
const DOUBLE_ZOOM = 2;
/** How far an arrow key pans a zoomed image, in CSS pixels. */
const PAN_STEP = 50;
/** How long an image can take before the Loader shows, in milliseconds. */
const LOADER_DELAY = 300;
/** How long the status line waits after a change, so a quick run of moves is read once. */
const STATUS_DELAY = 500;
/** How far a finger can move and still tap, in CSS pixels. */
const TAP_SLOP = 10;
/** The longest gap between the two taps of a double tap, in milliseconds. */
const DOUBLE_TAP_TIME = 300;
/** How far apart the two taps of a double tap can land, in CSS pixels. */
const DOUBLE_TAP_SLOP = 30;
/** A pinch that ends this close to the fitted size snaps back to it. */
const SNAP_ZOOM = 1.01;

/**
 * The zoom and pan of the image shown: `zoom` as a multiple of its fitted
 * size, and `x` and `y` how far its centre has moved from where it rests.
 * `animate` is off while a gesture drives it, so the image follows the
 * pointer rather than easing after it.
 */
interface View {
  zoom: number;
  x: number;
  y: number;
  animate: boolean;
}

const FITTED: View = { zoom: 1, x: 0, y: 0, animate: true };

/**
 * Where the image rests and how much room the viewer has, in the viewer's
 * own coordinates. Read from the layout, which a transform doesn't change,
 * so it holds while the image is zoomed or easing.
 */
interface Geometry {
  /** The image's centre at rest. */
  cx: number;
  cy: number;
  /** Its fitted size. */
  width: number;
  height: number;
  /** The viewer's size. */
  viewWidth: number;
  viewHeight: number;
  /** Where the viewer sits on screen, to turn a pointer into its coordinates. */
  left: number;
  top: number;
}

/**
 * Reads the image's resting box and the viewer's size.
 *
 * @function
 * @param {HTMLElement} image - The image shown.
 * @param {HTMLElement} root - The viewer, its `.modal` element.
 * @returns {Geometry} The geometry the zoom and pan are kept within.
 */
function measure(image: HTMLElement, root: HTMLElement): Geometry {
  let x = 0;
  let y = 0;
  for (
    let node: HTMLElement | null = image;
    node && node !== root;
    node = node.offsetParent as HTMLElement | null
  ) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  const box = root.getBoundingClientRect();
  return {
    cx: x + image.offsetWidth / 2,
    cy: y + image.offsetHeight / 2,
    width: image.offsetWidth,
    height: image.offsetHeight,
    viewWidth: root.clientWidth,
    viewHeight: root.clientHeight,
    left: box.left,
    top: box.top,
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * An offset along one axis, kept to the image's edges: a zoomed image wider
 * than the viewer can't leave a gap at either side, and one that still fits
 * stays where it rests, moved only as far as it takes to keep it in view.
 */
function fitAxis(
  offset: number,
  centre: number,
  size: number,
  room: number,
  zoom: number
): number {
  const half = (size * zoom) / 2;
  // The offsets that put the image's start edge on the viewer's, and its end edge.
  const start = half - centre;
  const end = room - centre - half;
  return half * 2 > room ? clamp(offset, end, start) : clamp(0, start, end);
}

/** The view, with its offsets kept to the image's edges. */
function fitView(view: View, geometry: Geometry): View {
  return {
    ...view,
    x: fitAxis(
      view.x,
      geometry.cx,
      geometry.width,
      geometry.viewWidth,
      view.zoom
    ),
    y: fitAxis(
      view.y,
      geometry.cy,
      geometry.height,
      geometry.viewHeight,
      view.zoom
    ),
  };
}

/**
 * The view at another zoom, with the point under `(px, py)`, in the
 * viewer's coordinates, still there.
 */
function zoomView(
  view: View,
  zoom: number,
  px: number,
  py: number,
  geometry: Geometry,
  animate: boolean
): View {
  if (zoom <= 1) return { ...FITTED, animate };
  const ratio = zoom / view.zoom;
  const dx = px - geometry.cx;
  const dy = py - geometry.cy;
  return fitView(
    {
      zoom,
      x: dx - (dx - view.x) * ratio,
      y: dy - (dy - view.y) * ratio,
      animate,
    },
    geometry
  );
}

/**
 * Whether a button has an accessible name from what it holds: its own
 * label, text, an image's alt or a label on an element inside, leaving out
 * what's hidden from assistive technology and what's inside a `<figure>`,
 * whose content doesn't name the button around it. A development check, so
 * it reads the common sources rather than the whole name computation.
 */
function hasName(element: Element): boolean {
  if (
    (element.getAttribute('aria-label') || '').trim() ||
    (element.getAttribute('aria-labelledby') || '').trim() ||
    (element.getAttribute('title') || '').trim()
  ) {
    return true;
  }
  return Array.from(element.childNodes).some(node =>
    node instanceof Element
      ? node.getAttribute('aria-hidden') !== 'true' &&
        node.tagName !== 'FIGURE' &&
        ((node instanceof HTMLImageElement && !!node.alt.trim()) ||
          hasName(node))
      : !!(node.textContent as string).trim()
  );
}

/** Text a key typed into a field is that field's, not the viewer's. */
const isTextEntry = (target: EventTarget) =>
  (target as Element).matches(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
  );

const ZoomInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-5-5M11 8v6M8 11h6" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-5-5M8 11h6" />
  </svg>
);

const ResetZoomIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
);

/**
 * A button around a thumbnail, or a line of text, that opens the viewer at its `index`.
 *
 * @function
 * @param {LightboxTriggerProps} props - Props for the trigger.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the `<button>`.
 * @returns {JSX.Element} The rendered button.
 */
export const LightboxTrigger = forwardRef<
  HTMLButtonElement,
  LightboxTriggerProps
>(({ index, className, children, onClick, ...props }, ref) => {
  const lightbox = useContext(LightboxContext);
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const triggerClass = usePrefixedClassNames('lightbox-trigger');
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current =
          node;
      }
      return undefined;
    },
    [ref]
  );

  if (!lightbox) {
    warnOnce(
      'Lightbox.Trigger:outside',
      '[bestax-bulma] <Lightbox.Trigger> is outside a <Lightbox>, so it ' +
        'opens nothing. Put it inside the Lightbox whose items it opens.'
    );
  }

  // Its content is its name, and a thumbnail with `alt=""` leaves it
  // nameless. Checked after each commit, since the content can change.
  useEffect(() => {
    if (isDev() && !hasName(buttonRef.current as HTMLButtonElement)) {
      warnOnce(
        'Lightbox.Trigger:no-name',
        '[bestax-bulma] <Lightbox.Trigger> has no accessible name. Give ' +
          'the image inside it an alt, or the button some text or an ' +
          'aria-label. An image inside a <figure>, which a ratio Image ' +
          'renders, doesn\'t name a button, so give that Image as="div".'
      );
    }
  });

  return (
    <button
      ref={setRefs}
      className={classNames(triggerClass, bulmaHelperClasses, className)}
      aria-haspopup="dialog"
      {...rest}
      type={buttonType(rest.type)}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented || !lightbox) return;
        // Safari doesn't focus a button that's clicked, and the viewer hands
        // focus back to whatever had it when it opened.
        event.currentTarget.focus({ preventScroll: true });
        lightbox.openAt(index);
      }}
    >
      {children}
    </button>
  );
});

LightboxTrigger.displayName = 'Lightbox.Trigger';

/** What the viewer takes from the Lightbox around it. */
interface LightboxViewerProps extends Omit<
  LightboxProps,
  | 'items'
  | 'children'
  | 'open'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'value'
  | 'defaultValue'
  | 'onChange'
> {
  items: LightboxItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * The open viewer: a modal dialog showing one image, mounted only while the
 * Lightbox is open, so each opening starts fitted.
 *
 * @function
 * @param {LightboxViewerProps} props - The Lightbox's props and its state.
 * @returns {JSX.Element} The rendered dialog.
 */
const LightboxViewer = forwardRef<HTMLDivElement, LightboxViewerProps>(
  function LightboxViewer(
    {
      items,
      index,
      onIndexChange,
      onClose,
      repeat = false,
      zoomable = true,
      maxZoom = 3,
      closeOnEscape = true,
      closeOnClickOutside = true,
      portal = true,
      ariaLabel = 'Image viewer',
      labels,
      className,
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref
  ) {
    const count = items.length;
    const item = items[index];
    const limit = Math.max(1, Number.isFinite(maxZoom) ? maxZoom : 3);
    const formatNumber = useNumberFormat();
    const number = (value: number) =>
      formatNumber ? formatNumber(value) : String(value);
    const words = {
      close: labels?.close || 'Close',
      previous: labels?.previous || 'Previous image',
      next: labels?.next || 'Next image',
      zoomIn: labels?.zoomIn || 'Zoom in',
      zoomOut: labels?.zoomOut || 'Zoom out',
      resetZoom: labels?.resetZoom || 'Reset zoom',
      loading: labels?.loading || 'Loading image',
      loadError: labels?.loadError || "This image didn't load.",
      retry: labels?.retry || 'Retry',
      progress:
        labels?.progress ??
        ((current: number, total: number) =>
          `Image ${number(current)} of ${number(total)}`),
    };

    const reducedMotion = usePrefersReducedMotion();
    const hydrated = useIsHydrated();

    const rootRef = useRef<HTMLDivElement | null>(null);
    const setRoot = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
        return undefined;
      },
      [ref]
    );
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    // The image shown and how it's doing. `leaving` is the image before it,
    // kept on screen while the new one loads and then faded out over it. The
    // fades are CSS animations, which start when the stylesheet's selector
    // first matches, even for an image that was already loaded, where a
    // transition wouldn't run.
    const [shown, setShown] = useState(index);
    const [status, setStatus] = useState<
      'loading' | 'slow' | 'loaded' | 'error'
    >('loading');
    const [attempt, setAttempt] = useState(0);
    const [leaving, setLeaving] = useState<LightboxItem>();
    const [view, setView] = useState<View>(FITTED);
    const zoomed = view.zoom > 1;
    // The view as last set, for a gesture to go on from: pointer events can
    // arrive faster than React renders.
    const viewRef = useRef(view);
    useClientLayoutEffect(() => {
      viewRef.current = view;
    });
    const updateView = (next: (current: View) => View) => {
      viewRef.current = next(viewRef.current);
      setView(viewRef.current);
    };

    // A move starts the new image fitted. Adjusted while rendering, React's
    // pattern for state that follows a prop, so the old zoom never paints on
    // the new image.
    if (shown !== index) {
      setShown(index);
      setLeaving(
        reducedMotion ? undefined : status === 'loaded' ? items[shown] : leaving
      );
      setStatus('loading');
      setAttempt(0);
      setView(FITTED);
    }

    // An image already there when it mounts, as one the server rendered and
    // the browser loaded before hydration, fires no load event.
    useClientLayoutEffect(() => {
      if (image?.complete && image.naturalWidth > 0) setStatus('loaded');
    }, [image]);

    // The Loader shows only for an image that takes a while.
    useEffect(() => {
      if (status !== 'loading') return undefined;
      // Cleared by any change of status, so it only fires on a load still
      // under way.
      const timer = setTimeout(() => {
        setStatus('slow');
        setLeaving(undefined);
      }, LOADER_DELAY);
      return () => clearTimeout(timer);
    }, [status, index, attempt]);

    // The images either side, fetched ahead so a move shows them at once.
    // With `repeat` and two images, both sides are the one other image, so
    // the indexes are deduplicated and it's fetched once.
    const neighbours = Array.from(
      new Set(
        [index - 1, index + 1].map(i => (repeat ? (i + count) % count : i))
      )
    )
      .filter(i => i >= 0 && i < count && i !== index)
      .map(i => items[i]);
    // None, one or two of them, in no particular order.
    const [firstNeighbour, secondNeighbour] = neighbours;
    const firstSrc = firstNeighbour?.src;
    const firstSrcSet = firstNeighbour?.srcSet;
    const firstSizes = firstNeighbour?.sizes;
    const secondSrc = secondNeighbour?.src;
    const secondSrcSet = secondNeighbour?.srcSet;
    const secondSizes = secondNeighbour?.sizes;
    useEffect(() => {
      const fetchAhead = (src?: string, srcSet?: string, sizes?: string) => {
        if (!src) return;
        const img = document.createElement('img');
        if (sizes) img.sizes = sizes;
        if (srcSet) img.srcset = srcSet;
        img.src = src;
      };
      fetchAhead(firstSrc, firstSrcSet, firstSizes);
      fetchAhead(secondSrc, secondSrcSet, secondSizes);
    }, [
      firstSrc,
      firstSrcSet,
      firstSizes,
      secondSrc,
      secondSrcSet,
      secondSizes,
    ]);

    // The status line, written a moment after it changes, so a quick run of
    // moves is read once. It's written on opening too, which says which image
    // the viewer opened at.
    const progress = words.progress(index + 1, count);
    const position = item.alt ? `${progress}: ${item.alt}` : progress;
    // A failed image's line says which image failed too, so a move from one
    // failed image to another still changes it.
    const message =
      status === 'error' ? `${words.loadError} ${position}` : position;
    const [said, setSaid] = useState('');
    useEffect(() => {
      const timer = setTimeout(() => setSaid(message), STATUS_DELAY);
      return () => clearTimeout(timer);
    }, [message]);

    // ---- Moving -------------------------------------------------------------

    const canPrev = repeat ? count > 1 : index > 0;
    const canNext = repeat ? count > 1 : index < count - 1;
    const go = (next: number) => {
      if (next !== index) onIndexChange(next);
    };
    const step = (delta: 1 | -1) => {
      if (delta < 0 ? !canPrev : !canNext) return;
      go((index + delta + count) % count);
    };
    const isRtl = (element: Element) =>
      getComputedStyle(element).direction === 'rtl';

    const swipe = useSwipe<HTMLElement>({
      enabled: !zoomed,
      vertical: true,
      onSwipe: direction => {
        if (direction === 'down') {
          onClose();
        } else if (direction !== 'up') {
          // A swipe left brings the next image in from the right, and right
          // to left the other way round.
          const forward = isRtl(rootRef.current as HTMLDivElement)
            ? 'right'
            : 'left';
          step(direction === forward ? 1 : -1);
        }
      },
    });

    // ---- Zooming and panning --------------------------------------------------

    // Zoom waits for the image: a loading one has no size to zoom, and a
    // failed one isn't there.
    const canZoom = zoomable && status === 'loaded';

    // Only called with an image on screen: every way to zoom or pan checks
    // `canZoom` first, and a pan needs a zoom.
    const geometry = () =>
      measure(image as HTMLImageElement, rootRef.current as HTMLDivElement);

    /** Zooms to `zoom`, kept within the limits, about the viewer's centre. */
    const zoomTo = (next: (zoom: number) => number) => {
      if (!canZoom) return;
      const g = geometry();
      updateView(v =>
        zoomView(
          v,
          clamp(next(v.zoom), 1, limit),
          g.viewWidth / 2,
          g.viewHeight / 2,
          g,
          true
        )
      );
    };
    const zoomIn = () => zoomTo(zoom => zoom * ZOOM_STEP);
    const zoomOut = () => zoomTo(zoom => zoom / ZOOM_STEP);
    const resetZoom = () => updateView(() => FITTED);

    /** A double click or tap: fitted to 2x at the pointer, and back. */
    const toggleZoomAt = (clientX: number, clientY: number) => {
      const g = geometry();
      updateView(v =>
        v.zoom > 1
          ? FITTED
          : zoomView(
              v,
              Math.min(DOUBLE_ZOOM, limit),
              clientX - g.left,
              clientY - g.top,
              g,
              true
            )
      );
    };

    const pan = (dx: number, dy: number) => {
      const g = geometry();
      updateView(v =>
        fitView({ ...v, x: v.x + dx, y: v.y + dy, animate: true }, g)
      );
    };

    // The wheel zooms at the pointer. A listener of its own, since React's
    // wheel handlers are passive and can't stop the page from zooming too.
    const handleWheel = useLatestRef((event: WheelEvent) => {
      const g = geometry();
      const lines = event.deltaMode === 1 ? 16 : 1;
      const delta = clamp(event.deltaY * lines, -100, 100);
      updateView(v =>
        zoomView(
          v,
          clamp(v.zoom * Math.exp(-delta / 300), 1, limit),
          event.clientX - g.left,
          event.clientY - g.top,
          g,
          false
        )
      );
    });
    useEffect(() => {
      if (!canZoom) return undefined;
      const target = image as HTMLImageElement;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        handleWheel.current(event);
      };
      target.addEventListener('wheel', onWheel, { passive: false });
      return () => target.removeEventListener('wheel', onWheel);
    }, [image, canZoom, handleWheel]);

    // Pointers on the image: one pans a zoomed image, two pinch. The first
    // has to land on the image; the second can land anywhere in the viewer.
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const gestureRef = useRef<
      | {
          kind: 'pan';
          x: number;
          y: number;
          from: View;
          geometry: Geometry;
        }
      | {
          kind: 'pinch';
          distance: number;
          x: number;
          y: number;
          from: View;
          geometry: Geometry;
        }
      | null
    >(null);
    const tapRef = useRef<{ x: number; y: number } | null>(null);
    const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(
      null
    );
    const lastPointerTypeRef = useRef('');

    const startPan = (x: number, y: number) => {
      gestureRef.current = {
        kind: 'pan',
        x,
        y,
        from: viewRef.current,
        geometry: geometry(),
      };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);
      lastPointerTypeRef.current = event.pointerType;
      // A second finger is a pinch, never a swipe, whether or not anything
      // zooms, and wherever in the viewer it lands.
      if (!event.isPrimary) swipe.cancel();
      if (!canZoom || event.defaultPrevented) return;
      const onImage = event.target === image;
      if (!onImage && pointersRef.current.size === 0) return;
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      // Two or more is a pinch, between the first two.
      if (pointersRef.current.size > 1) {
        const g = geometry();
        const [a, b] = Array.from(pointersRef.current.values());
        tapRef.current = null;
        swipe.cancel();
        gestureRef.current = {
          kind: 'pinch',
          distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          x: (a.x + b.x) / 2 - g.left,
          y: (a.y + b.y) / 2 - g.top,
          from: viewRef.current,
          geometry: g,
        };
      } else {
        tapRef.current = { x: event.clientX, y: event.clientY };
        if (zoomed) {
          // So the pan follows a mouse that leaves the image.
          (event.target as Element).setPointerCapture(event.pointerId);
          startPan(event.clientX, event.clientY);
        }
      }
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      const point = pointersRef.current.get(event.pointerId);
      if (!point) return;
      point.x = event.clientX;
      point.y = event.clientY;
      if (
        tapRef.current &&
        Math.hypot(
          event.clientX - tapRef.current.x,
          event.clientY - tapRef.current.y
        ) > TAP_SLOP
      ) {
        tapRef.current = null;
      }

      const current = gestureRef.current;
      if (current?.kind === 'pinch') {
        const [a, b] = Array.from(pointersRef.current.values());
        const g = current.geometry;
        const zoom = clamp(
          (current.from.zoom * Math.hypot(a.x - b.x, a.y - b.y)) /
            current.distance,
          1,
          limit
        );
        // The point of the image under the pinch's start stays between the
        // fingers, so they can pan as they pinch.
        const midX = (a.x + b.x) / 2 - g.left;
        const midY = (a.y + b.y) / 2 - g.top;
        const imageX = (current.x - g.cx - current.from.x) / current.from.zoom;
        const imageY = (current.y - g.cy - current.from.y) / current.from.zoom;
        updateView(() =>
          fitView(
            {
              zoom,
              x: midX - g.cx - imageX * zoom,
              y: midY - g.cy - imageY * zoom,
              animate: false,
            },
            g
          )
        );
      } else if (current) {
        updateView(() =>
          fitView(
            {
              ...current.from,
              x: current.from.x + event.clientX - current.x,
              y: current.from.y + event.clientY - current.y,
              animate: false,
            },
            current.geometry
          )
        );
      }
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.delete(event.pointerId)) return;
      const wasPinch = gestureRef.current?.kind === 'pinch';
      gestureRef.current = null;
      if (wasPinch) {
        if (viewRef.current.zoom < SNAP_ZOOM) {
          updateView(() => FITTED);
        } else {
          // A finger left down after a pinch carries on as a pan.
          const [point] = Array.from(pointersRef.current.values());
          startPan(point.x, point.y);
        }
      }

      // Two quick taps in the same place zoom, the touch screen's double click.
      if (
        event.type === 'pointerup' &&
        event.pointerType === 'touch' &&
        tapRef.current
      ) {
        const previous = lastTapRef.current;
        if (
          previous &&
          event.timeStamp - previous.time < DOUBLE_TAP_TIME &&
          Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <
            DOUBLE_TAP_SLOP
        ) {
          lastTapRef.current = null;
          toggleZoomAt(event.clientX, event.clientY);
        } else {
          lastTapRef.current = {
            x: event.clientX,
            y: event.clientY,
            time: event.timeStamp,
          };
        }
      }
      tapRef.current = null;
    };

    // ---- Keys -----------------------------------------------------------------

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        // A key from content React portals elsewhere, such as a popover's,
        // is that content's.
        !event.currentTarget.contains(event.target as Node) ||
        isTextEntry(event.target)
      ) {
        return;
      }
      const forward = isRtl(event.currentTarget) ? -1 : 1;
      switch (event.key) {
        case 'ArrowLeft':
          if (zoomed) pan(PAN_STEP, 0);
          else step(forward === 1 ? -1 : 1);
          break;
        case 'ArrowRight':
          if (zoomed) pan(-PAN_STEP, 0);
          else step(forward === 1 ? 1 : -1);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          if (!zoomed) return;
          pan(0, event.key === 'ArrowUp' ? PAN_STEP : -PAN_STEP);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(count - 1);
          break;
        case '+':
        case '=':
        case '-':
        case '0':
          if (!canZoom) return;
          if (event.key === '0') resetZoom();
          else if (event.key === '-') zoomOut();
          else zoomIn();
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    // ---- Loading ----------------------------------------------------------------

    const retry = () => {
      setAttempt(n => n + 1);
      setStatus('loading');
      // Cleared, so a Retry that fails again is announced again.
      setSaid('');
      // The Retry button goes with the error, so focus waits on the dialog.
      (rootRef.current as HTMLDivElement).focus();
    };

    // ---- Rendering --------------------------------------------------------------

    const rootClass = usePrefixedClassNames('lightbox', {
      'is-zoomed': zoomed,
    });
    const toolbarClass = usePrefixedClassNames('lightbox-toolbar');
    const progressClass = usePrefixedClassNames('lightbox-progress');
    const figureClass = usePrefixedClassNames('lightbox-figure');
    const imageClass = usePrefixedClassNames('lightbox-image');
    const loadingClass = usePrefixedClassNames('is-loading');
    const leavingClass = usePrefixedClassNames('lightbox-image', 'is-leaving');
    const captionClass = usePrefixedClassNames('lightbox-caption');
    const startsSwipe = (target: EventTarget) =>
      !(target as Element).closest(
        `button, a, input, select, textarea, .${captionClass}`
      );
    const errorClass = usePrefixedClassNames('lightbox-error');
    const previousClass = usePrefixedClassNames(
      'lightbox-arrow',
      'is-previous'
    );
    const nextClass = usePrefixedClassNames('lightbox-arrow', 'is-next');

    const imageStyle: React.CSSProperties | undefined = zoomed
      ? {
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transition: view.animate ? undefined : 'none',
        }
      : view.animate
        ? undefined
        : { transition: 'none' };
    const figureStyle: React.CSSProperties | undefined = swipe.isSwiping
      ? {
          // A swipe up doesn't go anywhere, so the image doesn't follow it.
          transform: `translate(${swipe.offsetX}px, ${Math.max(0, swipe.offsetY)}px)`,
          transition: 'none',
        }
      : undefined;

    return (
      <Modal
        ref={setRoot}
        isActive
        onClose={onClose}
        closeOnEscape={closeOnEscape}
        portal={portal}
        className={classNames(rootClass, className)}
        aria-label={ariaLabel}
        {...props}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={event => {
          onPointerUp?.(event);
          handlePointerEnd(event);
        }}
        onPointerCancel={event => {
          onPointerCancel?.(event);
          handlePointerEnd(event);
        }}
      >
        <Modal.Background onClick={closeOnClickOutside ? onClose : undefined} />
        <Modal.Close variant="floating" size="large" aria-label={words.close} />
        <div className={toolbarClass}>
          {count > 1 && (
            <bdi className={progressClass} aria-hidden="true">
              {`${number(index + 1)} / ${number(count)}`}
            </bdi>
          )}
          {zoomable && (
            <Buttons>
              <Button
                type="button"
                aria-label={words.zoomOut}
                aria-disabled={!zoomed || undefined}
                onClick={zoomOut}
              >
                <ZoomOutIcon />
              </Button>
              <Button
                type="button"
                aria-label={words.zoomIn}
                aria-disabled={!canZoom || view.zoom >= limit || undefined}
                onClick={zoomIn}
              >
                <ZoomInIcon />
              </Button>
              <Button
                type="button"
                aria-label={words.resetZoom}
                aria-disabled={!zoomed || undefined}
                onClick={resetZoom}
              >
                <ResetZoomIcon />
              </Button>
            </Buttons>
          )}
        </div>
        <Modal.Content>
          <Figure
            className={figureClass}
            style={figureStyle}
            // A swipe starts on the image or a failed image's message, so
            // the caption keeps its text selection and Retry and links
            // their focus.
            {...swipe.handlers}
            onMouseDown={event => {
              if (startsSwipe(event.target)) swipe.handlers.onMouseDown(event);
            }}
            onTouchStart={event => {
              // A second finger is a pinch, not a swipe.
              if (event.touches.length > 1) swipe.cancel();
              else if (startsSwipe(event.target)) {
                swipe.handlers.onTouchStart(event);
              }
            }}
          >
            {status !== 'error' && (
              <img
                key={`${index}-${attempt}`}
                ref={setImage}
                className={classNames(
                  imageClass,
                  hydrated && status !== 'loaded' && loadingClass
                )}
                src={item.src}
                srcSet={item.srcSet}
                sizes={item.sizes}
                alt={item.alt}
                draggable={false}
                style={imageStyle}
                onLoad={() => setStatus('loaded')}
                onError={() => {
                  setStatus('error');
                  setLeaving(undefined);
                }}
                onDoubleClick={event => {
                  // A touch screen's double tap is handled as it lands.
                  if (canZoom && lastPointerTypeRef.current !== 'touch') {
                    toggleZoomAt(event.clientX, event.clientY);
                  }
                }}
              />
            )}
            {/* Over the new image, so it fades out as that one fades in. The
                stylesheet starts both once the new image has loaded. */}
            {leaving && (
              <img
                className={leavingClass}
                src={leaving.src}
                srcSet={leaving.srcSet}
                sizes={leaving.sizes}
                alt=""
                aria-hidden="true"
                draggable={false}
                onAnimationEnd={() => setLeaving(undefined)}
              />
            )}
            {status === 'slow' && <Loader ariaLabel={words.loading} />}
            {status === 'error' && (
              <div className={errorClass}>
                <p>{words.loadError}</p>
                {item.alt && <p>{item.alt}</p>}
                <Button type="button" onClick={retry}>
                  {words.retry}
                </Button>
              </div>
            )}
            {item.caption ? (
              <Figure.Caption className={captionClass}>
                {item.caption}
              </Figure.Caption>
            ) : null}
          </Figure>
        </Modal.Content>
        {count > 1 && (
          <>
            <Button
              type="button"
              className={previousClass}
              aria-label={words.previous}
              aria-disabled={!canPrev || undefined}
              onClick={() => step(-1)}
            >
              <ChevronPrevIcon />
            </Button>
            <Button
              type="button"
              className={nextClass}
              aria-label={words.next}
              aria-disabled={!canNext || undefined}
              onClick={() => step(1)}
            >
              <ChevronNextIcon />
            </Button>
          </>
        )}
        <div role="status" aria-live="polite" style={visuallyHidden}>
          {said}
        </div>
      </Modal>
    );
  }
);

/**
 * The `Lightbox` component shows a set of images one at a time in a modal viewer, with previous and next, a counter, captions and zoom, opened from the `Lightbox.Trigger` buttons you place.
 *
 * It renders its children where it stands, with no wrapper, and the
 * viewer only while it's open, into a portal by default. The viewer is a
 * `Modal`: focus moves to its close button, Tab stays inside, Escape and a
 * click on the background close it, and focus goes back to the trigger.
 *
 * @function
 * @param {LightboxProps} props - Props for the Lightbox component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the viewer's `.modal` element, `null` while it's closed.
 * @returns {JSX.Element} The children, and the viewer while it's open.
 *
 * @example
 * <Lightbox items={photos}>
 *   {photos.map((photo, i) => (
 *     <Lightbox.Trigger key={photo.src} index={i}>
 *       <Image as="div" src={photo.src} alt={photo.alt} size="4by3" />
 *     </Lightbox.Trigger>
 *   ))}
 * </Lightbox>
 */
const LightboxRoot = forwardRef<HTMLDivElement, LightboxProps>(
  (
    {
      items,
      children,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      value: controlledValue,
      defaultValue = 0,
      onChange,
      ...props
    },
    ref
  ) => {
    const [ownOpen, setOwnOpen] = useState(defaultOpen);
    const open = controlledOpen ?? ownOpen;
    const [ownValue, setOwnValue] = useState(defaultValue);
    const count = items.length;

    if (items.some(item => typeof item.alt !== 'string')) {
      warnOnce(
        'Lightbox:no-alt',
        '[bestax-bulma] <Lightbox> has an item with no alt. In a viewer the ' +
          'image is the content, so give each one a text alternative.'
      );
    }

    /** An index as one of the images: rounded, then held to the ends or wrapped. */
    const fit = (value: number) => {
      const whole = Number.isFinite(value) ? Math.trunc(value) : 0;
      return props.repeat
        ? ((whole % count) + count) % count
        : clamp(whole, 0, count - 1);
    };
    const index = fit(controlledValue ?? ownValue);

    const setOpen = (next: boolean) => {
      if (controlledOpen === undefined) setOwnOpen(next);
      onOpenChange?.(next);
    };
    const setValue = (next: number) => {
      if (controlledValue === undefined) setOwnValue(next);
      onChange?.(next);
    };

    // Read when a trigger is pressed, so the context stays the same object
    // and the triggers don't re-render with every change here.
    const openAt = useLatestRef((at: number) => {
      if (!count) return;
      setValue(fit(at));
      if (!open) setOpen(true);
    });

    // When the images run out while it's open, it closes the way a user's
    // close does, so an uncontrolled viewer doesn't open again by itself when
    // they return. Only on the drop to none, so a viewer that opens before its
    // images arrive (a deep link, or `defaultOpen` over data still loading)
    // stays open for them.
    const closeEmpty = useLatestRef(() => setOpen(false));
    const countRef = useRef(count);
    useEffect(() => {
      const had = countRef.current;
      countRef.current = count;
      if (open && had > 0 && count === 0) closeEmpty.current();
    }, [open, count, closeEmpty]);
    const context = useMemo<LightboxContextValue>(
      () => ({ openAt: at => openAt.current(at) }),
      [openAt]
    );

    return (
      <LightboxContext.Provider value={context}>
        {children}
        {open && count > 0 && (
          <LightboxViewer
            {...props}
            ref={ref}
            items={items}
            index={index}
            onIndexChange={setValue}
            onClose={() => setOpen(false)}
          />
        )}
      </LightboxContext.Provider>
    );
  }
);

LightboxRoot.displayName = 'Lightbox';

export const Lightbox = withSubComponents(
  LightboxRoot,
  { Trigger: LightboxTrigger },
  'Lightbox'
);

export default Lightbox;
