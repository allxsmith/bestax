import React, {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import {
  clippingAncestors,
  scrollsOverflow,
} from '../helpers/clippingAncestors';
import type { Clipper } from '../helpers/clippingAncestors';
import { useClassPrefix } from '../helpers/Config';
import type { PolymorphicComponentWithoutRef } from '../helpers/polymorphic';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { usePrefersReducedMotion } from '../helpers/usePrefersReducedMotion';

/**
 * Animation styles available for the Reveal component.
 */
export type RevealAnimation =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'flip';

/**
 * The Reveal component's own props — everything it adds on top of the
 * attributes of whatever element `as` renders.
 */
export interface RevealOwnProps extends BulmaClassesProps {
  /** Animation style applied when the element enters the viewport. */
  animation?: RevealAnimation;
  /** Delay in milliseconds before the animation starts. Default: 0. */
  delay?: number;
  /** Animation duration in milliseconds. Default: 600. */
  duration?: number;
  /**
   * Fraction (0-1) of the element that must be visible to trigger the
   * reveal. Clamped to the 0-1 range; non-finite values fall back to `0.15`.
   * An element that can never show that fraction of it where it is reveals
   * as soon as any of it is in view: one too big for the viewport, such as a
   * long section on a phone or at a high browser zoom, or for the scrolling
   * container it's in, one kept partly out of view sideways, and one that
   * grows that big, or whose viewport or container shrinks that small, after
   * it comes into view.
   */
  threshold?: number;
  /** Animate only the first time the element enters the viewport. If `false`, it re-animates on every entry/exit. */
  once?: boolean;
  /** Stagger direct children with an incrementing delay instead of animating this element as a single block. */
  cascade?: boolean;
  /** Milliseconds added to each successive child's delay when `cascade` is set. Default: 80. */
  cascadeInterval?: number;
  /** Content to reveal. */
  children?: React.ReactNode;
  /** Additional CSS classes. Applied to the observed element (the wrapper `div` when `as` is a component). */
  className?: string | undefined;
  /** Inline styles, merged after the animation's own. Applied to the observed element. */
  style?: React.CSSProperties | undefined;
}

/**
 * Props for the Reveal component. The DOM attributes follow `as`.
 *
 * Reveal forwards no `ref`: it owns the node it observes for scroll
 * intersection, and when `as` is a component that node is a wrapper `div`
 * rather than the element `as` names — so a ref derived from `as` would point
 * at the wrong thing.
 */
export type RevealProps<T extends React.ElementType = 'div'> = RevealOwnProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof RevealOwnProps | 'as'> & {
    /** Element or component to render as. Default: 'div'. When `as` is a plain intrinsic tag (e.g. `'section'`), your `className`, `style`, and Bulma helper classes plus everything in `...rest` all land on that single element. When `as` is a component (e.g. `Section`, `Card`), scroll detection needs a real DOM node with a ref, so `Reveal` wraps it in an observed `div`: `className`/`style`/helper classes go on that wrapper `div`, while `...rest` (`id`, `aria-*`, `data-*`, event handlers) is forwarded to the inner component. */
    as?: T | undefined;
  };

/** A width and a height. */
interface Size {
  width: number;
  height: number;
}

/**
 * The viewport's size: the entry's root's, or the window's where the browser
 * gives no root, as in a cross-origin frame.
 */
const viewportOf = ({ rootBounds }: IntersectionObserverEntry): Size =>
  rootBounds ?? { width: window.innerWidth, height: window.innerHeight };

/**
 * The largest view of an element, and the nearest container that clips it
 * sideways, where that one scrolls that way.
 */
interface View extends Size {
  sideways: Clipper | null;
}

/** How much of `element`'s laid-out size it's drawn at, sideways. */
const scaleOf = (element: Element, drawn: DOMRect) => {
  const { offsetWidth } = element as Partial<HTMLElement>;
  // An SVG element has no layout size apart from how it's drawn.
  return offsetWidth ? drawn.width / offsetWidth : 1;
};

/**
 * The largest the area the element can be seen through gets: the viewport,
 * or, in each direction, the inside of an ancestor that clips what overflows
 * it that way, such as a scrolling container, when that's smaller. Sizes, not
 * positions, since a container partly off the screen can still scroll into
 * view whole. Measured as drawn, so a transform that scales the container
 * counts. Only the nearest container that clips it sideways can scroll it
 * that way, since scrolling one further out moves that one with it. The page
 * doesn't count, which Bulma doesn't let scroll sideways.
 */
function viewOf(viewport: Size, clippers: Clipper[]): View {
  let { width, height } = viewport;
  let sideways: Clipper | null | undefined;
  for (const clipper of clippers) {
    const { element, style, clipsX, clipsY } = clipper;
    const drawn = element.getBoundingClientRect();
    // An inline element, which overflow doesn't apply to, has no inside.
    if (clipsX && element.clientWidth > 0) {
      width = Math.min(width, element.clientWidth * scaleOf(element, drawn));
      sideways ??= scrollsOverflow(style.overflowX) ? clipper : null;
    }
    if (clipsY && element.clientHeight > 0) {
      const { offsetHeight } = element as Partial<HTMLElement>;
      const scale = offsetHeight ? drawn.height / offsetHeight : 1;
      height = Math.min(height, element.clientHeight * scale);
    }
  }
  return { width, height, sideways: sideways ?? null };
}

/**
 * The share of an element's width that can show once `scroller` scrolls as
 * far as it can toward the parts of it the scroller cuts off: what's in view
 * now, and on each side what's cut off, as far as the scroller has room to
 * scroll that way. Nothing scrolls past the start, so an offset off that edge
 * stays off.
 */
function acrossReach(
  { element, style }: Clipper,
  box: DOMRectReadOnly,
  seen: DOMRectReadOnly
) {
  const drawn = element.getBoundingClientRect();
  const scale = scaleOf(element, drawn);
  const left = drawn.left + element.clientLeft * scale;
  const right = left + element.clientWidth * scale;
  const range = element.scrollWidth - element.clientWidth;
  // Right to left, `scrollLeft` runs from -range, at the far left, up to 0.
  const fromLeft =
    style.direction === 'rtl' ? element.scrollLeft + range : element.scrollLeft;
  const more =
    Math.min(Math.max(0, left - box.left), fromLeft * scale) +
    Math.min(Math.max(0, box.right - right), (range - fromLeft) * scale);
  return shareOf(seen.width + more, box.width);
}

/** `part` of `whole`, from 0 to 1. */
const shareOf = (part: number, whole: number) =>
  Math.min(1, Math.max(0, part / whole));

/**
 * Whether an observer entry shows enough of the element to reveal it:
 * `threshold` of it, or any of it for an element that can never show that
 * much where it is, which would otherwise never reveal. That's judged by the
 * most of it that can show at once as it scrolls down, the share of it across
 * in view now staying as it is, or sideways, the share of it down in view now
 * staying as it is, as far as the nearest container that clips it sideways
 * can scroll toward the part of it cut off. So a part a sideways offset keeps
 * out of the viewport, or out of a container that can't scroll to it, stays
 * out. An element coming in at a corner, partly off the side of a horizontal
 * scroller as the scroller comes up into view, shows little either way, and
 * reveals early: this errs toward showing it, never toward keeping it hidden.
 * `watch` hears of each container measured, so a change in its size can ask
 * again.
 */
function showsEnough(
  entry: IntersectionObserverEntry,
  threshold: number,
  node: Element,
  watch: (clippers: Clipper[]) => void
) {
  if (!entry.isIntersecting) return false;
  if (entry.intersectionRatio >= threshold) return true;
  // An element with no area reports a ratio of 1 once it's in view, so it
  // never gets here.
  const { boundingClientRect: box, intersectionRect: seen } = entry;
  const acrossNow = shareOf(seen.width, box.width);
  const downNow = shareOf(seen.height, box.height);
  const most = (view: Size, across: number) => {
    const tall = shareOf(view.height, box.height);
    const wide = shareOf(view.width, box.width);
    return Math.max(
      Math.min(acrossNow, wide) * tall,
      Math.min(downNow, tall) * Math.min(across, wide)
    );
  };
  // A container can only make the view smaller, and only it lets the element
  // scroll sideways, so the viewport alone, scrolling all of it into view
  // sideways, may settle it without measuring any.
  const viewport = viewportOf(entry);
  if (most(viewport, 1) < threshold) return true;
  const clippers = [...clippingAncestors(node, { throughBody: true })];
  watch(clippers);
  const view = viewOf(viewport, clippers);
  const across = view.sideways ? acrossReach(view.sideways, box, seen) : 0;
  return most(view, across) < threshold;
}

/**
 * The shape the implementation destructures. The public contract is the generic
 * `RevealProps<T>` above — the body cannot see through `T`.
 */
type RevealImplProps = RevealOwnProps & { as?: React.ElementType };

/**
 * The `Reveal` component animates its content into view as it scrolls into the viewport, backed by `IntersectionObserver`.
 *
 * @function
 * @param {RevealProps} props - Props for the Reveal component.
 * @returns {JSX.Element} The rendered reveal wrapper.
 *
 * @example
 * // Fade a section up into view
 * <Reveal animation="fade-up" as={Section}>
 *   <Title>Why Grass Doctor</Title>
 * </Reveal>
 *
 * @example
 * // Stagger a set of cards as they enter the viewport
 * <Reveal animation="fade-up" cascade cascadeInterval={80}>
 *   {services.map(service => (
 *     <Card key={service.name}>{service.name}</Card>
 *   ))}
 * </Reveal>
 */
function RevealImpl(revealProps: RevealProps) {
  const {
    animation = 'fade-up',
    delay = 0,
    duration = 600,
    threshold = 0.15,
    once = true,
    as: Component = 'div',
    cascade = false,
    cascadeInterval = 80,
    className,
    style,
    children,
    ...props
  } = revealProps as RevealImplProps;
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const classPrefix = useClassPrefix();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // IntersectionObserver throws a RangeError for NaN or thresholds outside
  // 0-1, so clamp valid numbers and fall back to the default for anything else.
  const observerThreshold = Number.isFinite(threshold)
    ? Math.min(Math.max(threshold, 0), 1)
    : 0.15;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flips to true once mounted on the client so SSR/first-paint markup matches the server
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion skips straight to the revealed state
      setIsRevealed(true);
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return undefined;
    }

    // The ref callback attaches after this effect's first pass; it re-runs
    // once `node` becomes available since it's a dependency.
    if (!node) return undefined;

    // An element that grows after it comes into view, as one whose images
    // load does, or a viewport or container that shrinks, as a phone turned
    // on its side or a resized pane does, can leave it unable to reach
    // `threshold` with no entry to say so, since none comes until it crosses
    // one. So can its own
    // transition into the place it's hidden in, as `slide-left` and
    // `slide-right` move it sideways, since the browser reports where it is
    // partway through. Each asks for a fresh entry by observing it again.
    const askAgain = () => {
      observer.unobserve(node);
      observer.observe(node);
    };
    const settled = (event: Event) => {
      if (event.target === node) askAgain();
    };
    // A ResizeObserver reports the size each element starts with too, which
    // isn't a change.
    const sizes = new WeakMap<Element, Size>();
    const resize =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(entries => {
            let changed = false;
            for (const { target, contentRect: now } of entries) {
              const was = sizes.get(target);
              if (
                was &&
                (was.width !== now.width || was.height !== now.height)
              ) {
                changed = true;
              }
              sizes.set(target, now);
            }
            if (changed) askAgain();
          });
    // The containers it's measured against, watched from when it's first
    // measured against them.
    const watched = new WeakSet<Element>();
    const watch = (clippers: Clipper[]) => {
      for (const { element } of clippers) {
        if (watched.has(element)) continue;
        watched.add(element);
        resize?.observe(element);
      }
    };
    const view = node.ownerDocument.defaultView ?? window;
    // Revealed before it showed `threshold` of itself, with `once` off, it
    // stays revealed until it leaves the viewport: hiding it can bring back
    // the sideways offset that kept it from reaching `threshold`, and no
    // entry would come to reveal it again.
    let early = false;
    const stopWatching = () => {
      resize?.disconnect();
      view.removeEventListener('resize', askAgain);
      node.removeEventListener('transitionend', settled);
      node.removeEventListener('transitioncancel', settled);
    };

    const observer = new IntersectionObserver(
      entries => {
        // Several can arrive at once, oldest first, and the newest is where
        // the element is now.
        const entry = entries[entries.length - 1];
        if (showsEnough(entry, observerThreshold, node, watch)) {
          if (entry.intersectionRatio < observerThreshold) early = true;
          setIsRevealed(true);
          if (once) {
            observer.unobserve(node);
            stopWatching();
          }
        } else if (!once && !(early && entry.isIntersecting)) {
          early = false;
          setIsRevealed(false);
        }
      },
      // At 0 too, so an element that can't reach `threshold` hears when it
      // comes into view: the browser reports nothing between thresholds.
      {
        threshold:
          observerThreshold > 0 ? [0, observerThreshold] : observerThreshold,
      }
    );

    observer.observe(node);
    resize?.observe(node);
    view.addEventListener('resize', askAgain);
    node.addEventListener('transitionend', settled);
    node.addEventListener('transitioncancel', settled);
    return () => {
      observer.disconnect();
      stopWatching();
    };
  }, [node, prefersReducedMotion, once, observerThreshold]);

  // Only apply the hidden/animating state once mounted on the client with
  // motion allowed; otherwise render the final, visible state (SSR-safe).
  const isAnimated = isMounted && !prefersReducedMotion;
  const revealed = !isAnimated || isRevealed;

  const itemAnimationClasses = prefixedClassNames(classPrefix, {
    [`reveal-${animation}`]: isAnimated,
    'is-revealed': revealed,
  });

  const combinedClasses = classNames(
    usePrefixedClassNames('reveal', { 'is-cascade': cascade }),
    !cascade && itemAnimationClasses,
    bulmaHelperClasses,
    className
  );

  const wrapperStyle: React.CSSProperties = cascade
    ? { ...style }
    : {
        ...style,
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      };

  const content = cascade
    ? Children.toArray(children).map((child, index) => {
        const itemStyle: React.CSSProperties = {
          transitionDelay: `${delay + index * cascadeInterval}ms`,
          transitionDuration: `${duration}ms`,
        };

        if (
          isValidElement<{ className?: string; style?: React.CSSProperties }>(
            child
          )
        ) {
          return cloneElement(child, {
            // Children.toArray always assigns a key, generating one from
            // the position when the element doesn't already have one.
            key: child.key,
            className: classNames(itemAnimationClasses, child.props.className),
            style: { ...itemStyle, ...child.props.style },
          });
        }

        return (
          <span key={index} className={itemAnimationClasses} style={itemStyle}>
            {child}
          </span>
        );
      })
    : children;

  // Scroll observation needs a DOM node this component OWNS — the observer and
  // the animation classes both key off it. An intrinsic tag is that node, so
  // the ref goes straight on it. A component passed via `as` is not: whatever
  // it renders is its own business, and it may render several elements or
  // none. So it gets wrapped in an observed `div`.
  //
  // Not a statement about ref forwarding. Several components in this library
  // forward refs (#641 added four more), and that changes nothing here — a
  // forwarded ref would still point at the target's node rather than at one
  // this component controls.
  if (typeof Component === 'string') {
    // A plain createElement call sidesteps the combinatorial JSX prop types
    // for `ref` across every possible intrinsic tag `as` could be.
    return React.createElement(
      Component,
      {
        ...rest,
        ref: setNode,
        className: combinedClasses,
        style: wrapperStyle,
      },
      content
    );
  }

  return (
    <div ref={setNode} className={combinedClasses} style={wrapperStyle}>
      <Component {...rest}>{content}</Component>
    </div>
  );
}

export const Reveal = RevealImpl as PolymorphicComponentWithoutRef<
  RevealOwnProps,
  'div'
>;

Reveal.displayName = 'Reveal';

export default Reveal;
