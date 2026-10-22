import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  Children,
  isValidElement,
  cloneElement,
} from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useClassPrefix } from '../helpers/Config';
import { getActiveElementInTree } from '../helpers/shadowDom';
import { useLatestRef } from '../helpers/useLatestRef';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { inertProps } from '../helpers/inertProps';
import { Icon } from '../elements/Icon';
import { Button } from '../elements/Button';

/**
 * Props for the CarouselItem component.
 */
export interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether this item is in view. `Carousel` sets it on every item in view,
   * so with several in view several are active.
   */
  active?: boolean;
}

/**
 * Individual carousel item/slide.
 *
 * @function
 * @param {CarouselItemProps} props - Props for the CarouselItem component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the carousel item element.
 * @returns {JSX.Element} The rendered carousel item.
 */
export const CarouselItem = forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ active, className, children, ...props }, ref) => {
    const itemClasses = classNames(
      usePrefixedClassNames('carousel-item', { 'is-active': active }),
      className
    );

    return (
      <div ref={ref} className={itemClasses} {...props}>
        {children}
      </div>
    );
  }
);

CarouselItem.displayName = 'CarouselItem';

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

/**
 * Default SVG icon for the previous arrow button.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG chevron-left icon.
 */
const DefaultPrevIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/**
 * Default SVG icon for the next arrow button.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG chevron-right icon.
 */
const DefaultNextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * The media queries Bulma's `fullhd`, `widescreen`, `desktop` and `tablet`
 * mixins open with, widest first, at Bulma's default breakpoints. The
 * stylesheet picks the count in view with those mixins; these tell the
 * script which count that is. Narrower than the last one is `mobile`.
 */
const VIEWPORT_QUERIES = [
  'screen and (min-width: 1408px)',
  'screen and (min-width: 1216px)',
  'screen and (min-width: 1024px)',
  'screen and (min-width: 769px), print',
];

/** `useBulmaViewport`'s answer below the tablet breakpoint. */
const MOBILE = VIEWPORT_QUERIES.length;

/**
 * The `--bulma-carousel-items-to-show*` variable each count prop writes, in
 * the order the component lists them: the viewports as above, mobile, and
 * last `itemsToShow` itself.
 */
const COUNT_SUFFIXES = [
  '-fullhd',
  '-widescreen',
  '-desktop',
  '-tablet',
  '-mobile',
  '',
];

/**
 * Which of Bulma's viewports the window is in: the index of the widest
 * `VIEWPORT_QUERIES` entry that matches, `MOBILE` below them all, or `-1`
 * when that isn't known (on the server, before the first layout effect, and
 * whenever `enabled` is off, so a carousel with one count everywhere
 * subscribes to nothing).
 *
 * @function
 * @param {boolean} enabled - Whether any viewport-specific count is set.
 * @returns {number} The viewport, as described above.
 */
function useBulmaViewport(enabled: boolean): number {
  const [viewport, setViewport] = useState(-1);

  useClientLayoutEffect(() => {
    if (!enabled || typeof window.matchMedia !== 'function') return undefined;
    const lists = VIEWPORT_QUERIES.map(query => window.matchMedia(query));
    const update = () => {
      const index = lists.findIndex(list => list.matches);
      setViewport(index < 0 ? MOBILE : index);
    };
    update();
    lists.forEach(list => list.addEventListener('change', update));
    return () =>
      lists.forEach(list => list.removeEventListener('change', update));
  }, [enabled]);

  return enabled ? viewport : -1;
}

/**
 * A count prop as the whole number the carousel works with: rounded down,
 * and never below 1, so a zero or a stray `NaN` can't divide by nothing.
 *
 * @function
 * @param {number | undefined} count - The prop as given.
 * @returns {number | undefined} The count, or `undefined` when unset.
 */
const wholeCount = (count: number | undefined) =>
  count === undefined ? undefined : Math.max(1, Math.floor(count) || 1);

/**
 * Props for the Carousel component.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the carousel element.
 */
export interface CarouselProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'color'>,
    BulmaClassesProps {
  /**
   * Index of the first item in view (controlled); with one item in view, the
   * slide shown. A value between two of the positions a step lands on (see
   * `itemsToScroll`) is shown as given, and the next step goes on from it.
   * With `repeat`, a value past either end wraps around; without it, one
   * that would leave empty space after the last item shows the last full
   * view. Neither correction calls `onChange`. A value that takes the item
   * holding focus out of view moves focus to the first item in view, as a
   * swipe or a change of width does.
   * @defaultValue 0
   */
  value?: number;
  /**
   * Enable auto-play: one step (`itemsToScroll` items) per `interval`.
   * Without `repeat` it stops at the last position. It waits while the
   * pointer is over the carousel (see `pauseOnHover`) and while focus is
   * inside one of its items, so an item being read or used never moves out
   * of view.
   */
  autoplay?: boolean;
  /** Auto-play interval in milliseconds. Default: 5000. */
  interval?: number;
  /** Pause auto-play on hover. Default: true. */
  pauseOnHover?: boolean;
  /**
   * Loop back to the first position after the last. Default: true. With
   * several items in view, the view runs on past the last item into the
   * first ones, so it can show the end and the start side by side. Only
   * loops when some item is out of view.
   */
  repeat?: boolean;
  /**
   * Enable drag/swipe navigation. Default: true. A swipe moves one step,
   * however far it travels.
   */
  hasDrag?: boolean;
  /**
   * How many items are in view at once, at every width no
   * `itemsToShow<Viewport>` prop covers. Those props read the way a
   * `Column`'s `size<Viewport>` props do: `itemsToShowMobile` applies below
   * Bulma's tablet breakpoint, each of the others from its own breakpoint
   * up, and where several apply the widest one wins. A whole number, rounded
   * down and at least 1. The widths come from the stylesheet, so they are
   * right on the first paint; the arrows, indicators and steps use the
   * count for the window's width once the page has hydrated, and this one
   * until then. With this many children or fewer, every item keeps its
   * share of the width, nothing moves, and no arrows or indicators render.
   * @defaultValue 1
   */
  itemsToShow?: number;
  /**
   * Items in view at any width below Bulma's tablet breakpoint (769px),
   * fractional ones included. Falls back to `itemsToShow`.
   */
  itemsToShowMobile?: number;
  /**
   * Items in view from Bulma's tablet breakpoint (769px) up, until a wider
   * viewport's prop takes over. Falls back to `itemsToShow`.
   */
  itemsToShowTablet?: number;
  /**
   * Items in view from Bulma's desktop breakpoint (1024px) up, until a wider
   * viewport's prop takes over. Falls back to `itemsToShowTablet`, then
   * `itemsToShow`.
   */
  itemsToShowDesktop?: number;
  /**
   * Items in view from Bulma's widescreen breakpoint (1216px) up, until
   * `itemsToShowFullhd` takes over. Falls back to `itemsToShowDesktop`, and
   * on down to `itemsToShow`.
   */
  itemsToShowWidescreen?: number;
  /**
   * Items in view from Bulma's fullhd breakpoint (1408px) up. Falls back to
   * `itemsToShowWidescreen`, and on down to `itemsToShow`.
   */
  itemsToShowFullhd?: number;
  /**
   * How many items one step moves, for an arrow, an arrow key, a swipe or an
   * autoplay tick. A whole number, capped at the count in view so a step
   * never skips an item. Without `repeat`, the last step stops at the last
   * full view, so it can be shorter; with `repeat`, the step after the last
   * position goes on to the first one. The indicators mark these positions,
   * one per step rather than one per item. When the count in view changes
   * with the window's width, the first item in view stays in view.
   * @defaultValue 1
   */
  itemsToScroll?: number;
  /**
   * Show navigation arrows. Default: true. They render `type="button"`, so a
   * carousel inside a form is not submitted by moving between slides.
   */
  arrow?: boolean;
  /** Only show arrows on hover. */
  arrowHover?: boolean;
  /**
   * Show slide indicators. Default: true. There is one for each position a
   * step can land on (see `itemsToScroll`). They render `type="button"`, so
   * a carousel inside a form is not submitted by picking a slide.
   */
  indicator?: boolean;
  /** Position indicators inside carousel. */
  indicatorInside?: boolean;
  /** Indicator position. Default: 'bottom'. */
  indicatorPosition?: 'bottom' | 'top';
  /** Indicator style. Default: 'dots'. */
  indicatorStyle?: 'circles' | 'dots' | 'lines' | 'bars';
  /** Icon name for the previous arrow button. */
  iconPrev?: string;
  /** Icon name for the next arrow button. */
  iconNext?: string;
  /** Icon library to use. */
  iconLibrary?: IconLibrary;
  /** Icon style variant (e.g., 'solid', 'outlined'). */
  iconVariant?: string;
  /** Icon size modifier. */
  iconSize?: 'small' | 'medium' | 'large';
  /** Additional icon modifiers. */
  iconFeatures?: string | string[];
  /** Show semi-transparent background on arrow buttons. Set to `false` for icon-only arrows. */
  arrowBackground?: boolean;
  /** Color theme for navigation arrows. */
  arrowColor?: 'light' | 'dark';
  /** Accessible label for the carousel region. Default: 'Image carousel'. */
  ariaLabel?: string;
  /**
   * Called with the index of the first item in view when an arrow, an arrow
   * key, an indicator, a swipe or autoplay moves the carousel.
   */
  onChange?: (value: number) => void;
  /** CarouselItem children. */
  children?: React.ReactNode;
}

/**
 * The `Carousel` component provides an image/content slider with navigation arrows and indicators.
 *
 * @function
 * @param {CarouselProps} props - Props for the Carousel component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the carousel element.
 * @returns {JSX.Element} The rendered carousel component.
 *
 * @example
 * // Basic carousel
 * <Carousel>
 *   <CarouselItem>Slide 1</CarouselItem>
 *   <CarouselItem>Slide 2</CarouselItem>
 *   <CarouselItem>Slide 3</CarouselItem>
 * </Carousel>
 *
 * @example
 * // Auto-playing carousel
 * <Carousel autoplay interval={3000}>
 *   <CarouselItem>
 *     <img src="image1.jpg" alt="Slide 1" />
 *   </CarouselItem>
 *   <CarouselItem>
 *     <img src="image2.jpg" alt="Slide 2" />
 *   </CarouselItem>
 * </Carousel>
 *
 * @example
 * // Three cards in view on desktop, two on tablet, one on mobile
 * <Carousel itemsToShow={1} itemsToShowTablet={2} itemsToShowDesktop={3}>
 *   {cards.map(card => (
 *     <CarouselItem key={card.id}>{card.body}</CarouselItem>
 *   ))}
 * </Carousel>
 */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      value: controlledValue,
      autoplay = false,
      interval = 5000,
      pauseOnHover = true,
      repeat = true,
      hasDrag = true,
      itemsToShow,
      itemsToShowMobile,
      itemsToShowTablet,
      itemsToShowDesktop,
      itemsToShowWidescreen,
      itemsToShowFullhd,
      itemsToScroll,
      arrow = true,
      arrowHover = false,
      indicator = true,
      indicatorInside = false,
      indicatorPosition = 'bottom',
      indicatorStyle = 'dots',
      iconPrev,
      iconNext,
      iconLibrary,
      iconVariant,
      iconSize,
      iconFeatures,
      arrowBackground = true,
      arrowColor,
      ariaLabel = 'Image carousel',
      onChange,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const carouselRef = useRef<HTMLDivElement>(null);
    // Cleanup returned by a consumer's callback ref on attach, held until detach.
    const consumerCleanupRef = useRef<(() => void) | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const slidesRef = useRef<HTMLDivElement>(null);
    // The item (a child of the track) that holds focus, until focus leaves
    // the items for somewhere else
    const focusedItemRef = useRef<Element | undefined>(undefined);

    const [internalValue, setInternalValue] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isFocusInside, setIsFocusInside] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isWrapping, setIsWrapping] = useState(false);
    const [displayIndex, setDisplayIndex] = useState(0);
    const [skipTransition, setSkipTransition] = useState(false);

    // Get valid children
    const items = Children.toArray(children).filter(
      isValidElement
    ) as React.ReactElement<CarouselItemProps>[];
    const itemCount = items.length;

    // The count in view. The viewport props come widest first, in the order
    // of VIEWPORT_QUERIES, then mobile; each min-width viewport falls back to
    // the narrower ones, and every viewport to `itemsToShow`, the cascade the
    // stylesheet's `--bulma-carousel-items-to-show-*` defaults spell out.
    const counts = [
      itemsToShowFullhd,
      itemsToShowWidescreen,
      itemsToShowDesktop,
      itemsToShowTablet,
      itemsToShowMobile,
    ].map(wholeCount);
    const baseCount = wholeCount(itemsToShow);
    const viewport = useBulmaViewport(counts.some(c => c !== undefined));
    const inView =
      (viewport === MOBILE
        ? counts[MOBILE]
        : viewport >= 0
          ? counts.slice(viewport, MOBILE).find(c => c !== undefined)
          : undefined) ??
      baseCount ??
      1;
    // The props as the stylesheet reads them, so the widths are right from
    // the first paint, on the server too.
    const countStyle: Record<string, number> = {};
    [...counts, baseCount].forEach((count, i) => {
      if (count !== undefined) {
        countStyle[`--bulma-carousel-items-to-show${COUNT_SUFFIXES[i]}`] =
          count;
      }
    });

    const scroll = Math.min(wholeCount(itemsToScroll) ?? 1, inView);
    const looping = repeat && itemCount > inView;
    const lastStart = Math.max(0, itemCount - inView);
    // Where the view can start: every `scroll` items from the first, and
    // without a loop the last full view as well, which is what keeps the
    // end of the track from showing empty space.
    const positions: number[] = [];
    for (let p = 0; p < (looping ? itemCount : lastStart); p += scroll) {
      positions.push(p);
    }
    if (!looping) positions.push(lastStart);
    const lastPosition = positions[positions.length - 1];
    const canMove = positions.length > 1;

    const wrap = (index: number) =>
      ((index % itemCount) + itemCount) % itemCount;
    const fit = (index: number) =>
      looping ? wrap(index) : Math.min(Math.max(index, 0), lastStart);

    // Use controlled or internal value, as a start the view can show
    const activeIndex = fit(controlledValue ?? internalValue);
    // The indicator for the last position at or before the first item in view
    const activePosition = positions.reduce(
      (found, position, index) => (position <= activeIndex ? index : found),
      0
    );
    const nextIndex = positions[activePosition + 1];
    // From between two positions, the previous step is the one just behind
    const prevIndex =
      activeIndex > positions[activePosition]
        ? positions[activePosition]
        : positions[activePosition - 1];

    // Sync displayIndex when the value changes externally, or when the count
    // in view moves the start it fits to. Intentional external-prop sync that
    // must not run mid-wrap animation; covered by tests and certified
    // in-browser. Uncontrolled, the fitted start becomes the value too, so a
    // later change of count keeps what was first in view in view.
    useEffect(() => {
      if (!isWrapping) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to controlled prop
        setDisplayIndex(activeIndex);
        if (controlledValue === undefined) setInternalValue(activeIndex);
      }
    }, [activeIndex, isWrapping, controlledValue]);

    // Update active index
    const setActiveIndex = useCallback(
      (index: number) => {
        if (controlledValue === undefined) {
          setInternalValue(index);
        }
        setDisplayIndex(index);
        setIsWrapping(false);
        onChange?.(index);
      },
      [controlledValue, onChange]
    );

    // Navigation handlers
    const goToPrev = useCallback(() => {
      if (prevIndex !== undefined) {
        setActiveIndex(prevIndex);
      } else if (looping) {
        // Animate to the clones before the first item, which show the last
        // position, and snap to the real one when the transition ends
        setDisplayIndex(lastPosition - itemCount);
        setIsWrapping(true);
      }
    }, [prevIndex, looping, lastPosition, itemCount, setActiveIndex]);

    const goToNext = useCallback(() => {
      if (nextIndex !== undefined) {
        setActiveIndex(nextIndex);
      } else if (looping) {
        // Animate to the clones after the last item, which show the first
        // position, and snap to the real one when the transition ends
        setDisplayIndex(itemCount);
        setIsWrapping(true);
      }
    }, [nextIndex, looping, itemCount, setActiveIndex]);

    // Read when the timer fires or an arrow key arrives, so neither the
    // timer nor the key listener starts over while `onChange` changes
    // identity, as an inline one does on every render of the parent.
    const goToPrevRef = useLatestRef(goToPrev);
    const goToNextRef = useLatestRef(goToNext);

    // Auto-play. Each slide gets the whole interval, so a slide change,
    // autoplay's own or the user's, starts the timer over. A render that
    // leaves the slide where it is doesn't. It waits while focus is inside
    // an item, so what someone is reading or using doesn't move away. The
    // timer reads where focus is when it fires, rather than trusting the
    // last focus event alone: a browser moving focus off an element that
    // went inert need not fire one, and the pause would never end. A focus
    // change still starts the timer over, so an item gets the whole
    // interval once focus leaves it.
    const isPlaying =
      autoplay && (looping || nextIndex !== undefined) && !isPaused;
    const isRotating = isPlaying && !isFocusInside;

    useEffect(() => {
      if (!isPlaying) return undefined;

      const timer = setInterval(() => {
        const track = slidesRef.current;
        if (track?.contains(getActiveElementInTree(track))) return;
        if (isFocusInside) setIsFocusInside(false);
        goToNextRef.current();
      }, interval);

      return () => clearInterval(timer);
    }, [isPlaying, isFocusInside, interval, activeIndex, goToNextRef]);

    // Pause on hover
    const handleMouseEnter = useCallback(() => {
      if (pauseOnHover) {
        setIsPaused(true);
      }
    }, [pauseOnHover]);

    const handleMouseLeave = useCallback(() => {
      if (pauseOnHover) {
        setIsPaused(false);
      }
    }, [pauseOnHover]);

    // Drag handlers
    const handleDragStart = useCallback(
      (clientX: number) => {
        if (!hasDrag) return;
        setIsDragging(true);
        setDragStart(clientX);
        setDragOffset(0);
      },
      [hasDrag]
    );

    const handleDragMove = useCallback(
      (clientX: number) => {
        if (!isDragging) return;
        setDragOffset(clientX - dragStart);
      },
      [isDragging, dragStart]
    );

    const handleDragEnd = useCallback(() => {
      if (!isDragging) return;
      setIsDragging(false);

      const threshold = 50;
      if (dragOffset < -threshold) {
        goToNext();
      } else if (dragOffset > threshold) {
        goToPrev();
      }

      setDragOffset(0);
    }, [isDragging, dragOffset, goToNext, goToPrev]);

    // Mouse events
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX);
      },
      [handleDragStart]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        handleDragMove(e.clientX);
      },
      [handleDragMove]
    );

    const handleMouseUp = useCallback(() => {
      handleDragEnd();
    }, [handleDragEnd]);

    // Touch events
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX);
      },
      [handleDragStart]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        handleDragMove(e.touches[0].clientX);
      },
      [handleDragMove]
    );

    const handleTouchEnd = useCallback(() => {
      handleDragEnd();
    }, [handleDragEnd]);

    // Keyboard navigation, from the carousel's own controls. Inside an item
    // the keys are its content's (a field's caret, a slider), and a step
    // from there could take the focused item out of view.
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const node = carouselRef.current;
        const active = getActiveElementInTree(node);
        if (!node?.contains(active) || slidesRef.current?.contains(active)) {
          return;
        }

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            goToPrevRef.current();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goToNextRef.current();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [goToPrevRef, goToNextRef]);

    // Handle wrap-around transition end: the track's own, since an item's
    // content can end a transition of its own that bubbles up to here
    const handleTransitionEnd = useCallback(
      (e: React.TransitionEvent<HTMLDivElement>) => {
        if (isWrapping && e.target === e.currentTarget) {
          // Skip transition for the instant snap from the clones to the
          // real items they copy
          setSkipTransition(true);
          setActiveIndex(((displayIndex % itemCount) + itemCount) % itemCount);

          // Re-enable transition after the snap
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setSkipTransition(false);
            });
          });
        }
      },
      [isWrapping, displayIndex, itemCount, setActiveIndex]
    );

    // Combined ref
    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        (carouselRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === 'function') {
          // React 19 lets a callback ref return a cleanup function and detaches by
          // running it instead of calling the ref with `null`; React 18 discards the
          // return value entirely. Returning it from here would be a React-19-only
          // contract, so we hold the cleanup and run it ourselves on detach — the
          // same shape as `Dropdown`, `Modal`, `Dialog`, `Sidebar` and `Toast`.
          // The form controls that merge a forwarded ref still discard the cleanup
          // and detach with `ref(null)`, so this is not yet library-wide — grep
          // `typeof ref === 'function'` for the current split.
          if (node === null) {
            const consumerCleanup = consumerCleanupRef.current;
            consumerCleanupRef.current = null;
            if (consumerCleanup) {
              consumerCleanup();
            } else {
              ref(null);
            }
            return;
          }
          const cleanup: unknown = ref(node);
          consumerCleanupRef.current =
            typeof cleanup === 'function' ? (cleanup as () => void) : null;
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    // Can navigate
    const canGoPrev = looping || prevIndex !== undefined;
    const canGoNext = looping || nextIndex !== undefined;

    // Generate classes
    const carouselClasses = usePrefixedClassNames('carousel', {
      'is-overlay': indicatorInside,
      'has-arrow-hover': arrowHover,
      [`is-indicator-${indicatorStyle}`]: indicatorStyle !== 'dots',
      [`is-arrow-${arrowColor}`]: !!arrowColor,
    });
    const classPrefix = useClassPrefix();
    const carouselContainerClass = usePrefixedClassNames('carousel-container');
    const carouselSlidesClass = usePrefixedClassNames('carousel-slides');
    const carouselArrowPrevClass = usePrefixedClassNames(
      'carousel-arrow',
      'is-prev',
      { 'is-transparent': !arrowBackground }
    );
    const carouselArrowNextClass = usePrefixedClassNames(
      'carousel-arrow',
      'is-next',
      { 'is-transparent': !arrowBackground }
    );
    const carouselIndicatorClass = usePrefixedClassNames('carousel-indicator', {
      'is-inside': indicatorInside,
      'is-top': indicatorPosition === 'top',
    });

    const combinedClasses = classNames(
      carouselClasses,
      bulmaHelperClasses,
      className
    );

    // Where the track is drawn from: mid-wrap the clones, otherwise a start
    // the view can show, so a change in the count in view never paints
    // empty space while the sync above catches up.
    const shownIndex = isWrapping ? displayIndex : fit(displayIndex);
    // Enough clones on each side to fill the widest view any viewport sets,
    // since the stylesheet, not this count, sizes what's on screen
    const cloneCount = looping
      ? Math.min(
          itemCount,
          Math.max(baseCount ?? 1, ...counts.map(c => c ?? 1))
        )
      : 0;
    // The track: a full view's worth of clones of the last items, the items,
    // and clones of the first ones, for a seamless loop. Each entry is the
    // item it shows and its key.
    const slots: [number, React.Key][] = items.map((_, index) => [
      index,
      index,
    ]);
    for (let k = 0; k < cloneCount; k++) {
      slots.splice(k, 0, [itemCount - cloneCount + k, `clone-before-${k}`]);
      slots.push([k, `clone-after-${k}`]);
    }

    // Render slides with active state (includes clones for infinite loop).
    // What's in view is a run of slots, so where a looping view runs past
    // the last item, the clones on screen are the live copies and the items
    // they copy, off screen, are the hidden ones: no item is exposed twice,
    // and the copy exposed is the one in view.
    const renderSlides = () =>
      slots.map(([index, key], slot) => {
        const item = items[index];
        const own = item.props;
        const isShown =
          slot >= shownIndex + cloneCount &&
          slot < shownIndex + cloneCount + inView;
        return cloneElement(item, {
          key,
          active: isShown,
          role: own.role ?? 'group',
          'aria-roledescription': own['aria-roledescription'] ?? 'slide',
          ...(own['aria-label'] || own['aria-labelledby']
            ? {}
            : { 'aria-label': `${index + 1} of ${itemCount}` }),
          // Out of view: hidden from assistive tech, and inert, so nothing
          // in it takes focus or a click
          ...(isShown ? {} : { 'aria-hidden': true, ...inertProps(true) }),
        });
      });

    // Hand focus on when the item holding it leaves the view. An item out
    // of view is inert, and a browser drops focus from an inert element to
    // the page, so a swipe, a change of count with the window's width, a new
    // controlled value or the item's removal would leave a keyboard or
    // screen reader user nowhere. Focus goes to the first item in view,
    // given `tabindex="-1"` for it unless it has a tabindex of its own. A
    // layout effect runs before the browser gets to drop the focus; the
    // focused item's removal drops it at once, so focus on the page itself
    // still counts as the item's.
    useClientLayoutEffect(() => {
      const held = focusedItemRef.current;
      if (!held) return;
      const track = slidesRef.current as HTMLDivElement;
      const start = shownIndex + cloneCount;
      const slot = Array.prototype.indexOf.call(track.children, held);
      if (slot >= start && slot < start + inView) return;
      const active = getActiveElementInTree(track);
      if (active !== held.ownerDocument.body && !held.contains(active)) {
        return;
      }
      focusedItemRef.current = undefined;
      const first = track.children[start] as HTMLElement | undefined;
      if (!first) return;
      if (!first.hasAttribute('tabindex')) first.tabIndex = -1;
      first.focus({ preventScroll: true });
    }, [shownIndex, cloneCount, inView, itemCount]);

    return (
      <div
        ref={combinedRef}
        className={combinedClasses}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        style={{ ...countStyle, ...style }}
        {...rest}
      >
        <div
          ref={containerRef}
          className={carouselContainerClass}
          onMouseDown={hasDrag ? handleMouseDown : undefined}
          onMouseMove={hasDrag && isDragging ? handleMouseMove : undefined}
          onMouseUp={hasDrag ? handleMouseUp : undefined}
          onMouseLeave={hasDrag ? handleMouseUp : undefined}
          onTouchStart={hasDrag ? handleTouchStart : undefined}
          onTouchMove={hasDrag ? handleTouchMove : undefined}
          onTouchEnd={hasDrag ? handleTouchEnd : undefined}
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
            cursor: hasDrag ? (isDragging ? 'grabbing' : 'grab') : undefined,
          }}
        >
          <div
            ref={slidesRef}
            className={carouselSlidesClass}
            style={{
              // One item is the track's width plus a gap, over the count the
              // stylesheet has in view; account for the prepended clones
              transform: `translateX(calc(${-(shownIndex + cloneCount)} * (100% + var(--bulma-carousel-item-gap, 0px)) / var(--bulma-carousel-items-in-view, 1)))`,
              // Disable transition during drag or instant snap after wrap-around
              transition:
                isDragging || skipTransition
                  ? 'none'
                  : 'transform 0.3s ease-in-out',
            }}
            // Announce what comes into view, except while autoplay turns it
            aria-live={isRotating ? 'off' : 'polite'}
            onFocus={e => {
              setIsFocusInside(true);
              focusedItemRef.current = Array.from(
                e.currentTarget.children
              ).find(item => item.contains(e.target));
            }}
            onBlur={e => {
              const inside = e.currentTarget.contains(e.relatedTarget);
              setIsFocusInside(inside);
              if (!inside) focusedItemRef.current = undefined;
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {renderSlides()}
          </div>
          {arrow && canMove && (
            <>
              <Button
                type="button"
                className={carouselArrowPrevClass}
                onClick={goToPrev}
                isDisabled={!canGoPrev}
                aria-label="Previous slide"
              >
                {iconPrev ? (
                  <Icon
                    name={iconPrev}
                    library={iconLibrary}
                    variant={iconVariant}
                    size={iconSize}
                    features={iconFeatures}
                  />
                ) : (
                  <DefaultPrevIcon />
                )}
              </Button>
              <Button
                type="button"
                className={carouselArrowNextClass}
                onClick={goToNext}
                isDisabled={!canGoNext}
                aria-label="Next slide"
              >
                {iconNext ? (
                  <Icon
                    name={iconNext}
                    library={iconLibrary}
                    variant={iconVariant}
                    size={iconSize}
                    features={iconFeatures}
                  />
                ) : (
                  <DefaultNextIcon />
                )}
              </Button>
            </>
          )}
        </div>

        {indicator && canMove && (
          <div className={carouselIndicatorClass} role="tablist">
            {positions.map((position, index) => (
              <Button
                key={position}
                type="button"
                className={prefixedClassNames(classPrefix, 'indicator-item', {
                  'is-active': index === activePosition,
                })}
                onClick={() => setActiveIndex(position)}
                role="tab"
                aria-selected={index === activePosition}
                aria-label={`Go to slide ${position + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

Carousel.displayName = 'Carousel';

export default Carousel;
