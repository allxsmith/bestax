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
import { useClassPrefix } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
 * Props for the Reveal component.
 *
 * @property {RevealAnimation} [animation] - Animation style used when the element enters the viewport. Default: 'fade-up'.
 * @property {number} [delay] - Delay in milliseconds before the animation starts. Default: 0.
 * @property {number} [duration] - Animation duration in milliseconds. Default: 600.
 * @property {number} [threshold] - Fraction (0-1) of the element that must be visible to trigger the reveal. Default: 0.15.
 * @property {boolean} [once] - Animate only the first time the element enters the viewport; if `false`, it re-animates on every entry/exit. Default: true.
 * @property {React.ElementType} [as] - Element or component to render as. Default: 'div'.
 * @property {boolean} [cascade] - Stagger direct children with an incrementing delay instead of animating this element as a single block.
 * @property {number} [cascadeInterval] - Milliseconds added to each successive child's delay when `cascade` is set. Default: 80.
 * @property {React.ReactNode} [children] - Content to reveal.
 */
export interface RevealProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>, BulmaClassesProps {
  animation?: RevealAnimation;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  as?: React.ElementType;
  cascade?: boolean;
  cascadeInterval?: number;
  children?: React.ReactNode;
}

/**
 * Detects the user's `prefers-reduced-motion` preference. Always `false` on
 * the server and on the very first client render, so SSR output and the
 * initial hydration pass always agree.
 *
 * @function
 * @returns {boolean} Whether the user has requested reduced motion.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the live media query on mount
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Reveal component that animates its content into view as it scrolls into
 * the viewport, backed by `IntersectionObserver`.
 *
 * Renders in its final, visible state during SSR and on the first client
 * render, so content is never hidden if JavaScript never runs (crawlers,
 * disabled JS). Automatically skips the animation (renders the final state
 * immediately) when the user prefers reduced motion.
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
export const Reveal: React.FC<RevealProps> = ({
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
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const classPrefix = useClassPrefix();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, prefersReducedMotion, once, threshold]);

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

  // Scroll observation needs a real DOM node. Intrinsic tags ('div',
  // 'section', ...) always accept a ref directly. A custom component passed
  // via `as` (Section, Card, ...) is rendered by this library as a plain
  // React.FC with no ref forwarding, so the ref (and the animation classes
  // that depend on it) go on a plain wrapper `div` instead, with `Component`
  // rendered inside it.
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
};

export default Reveal;
