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
import { Icon } from '../elements/Icon';
import { Button } from '../elements/Button';

/**
 * Props for the CarouselItem component.
 */
export interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether this item is active (set automatically). */
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
 * Props for the Carousel component.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the carousel element.
 * @extraProp {boolean} [active] - Whether this item is active (set automatically).
 */
export interface CarouselProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'color'>,
    BulmaClassesProps {
  /**
   * Current active slide index (controlled).
   * @defaultValue 0
   */
  value?: number;
  /** Enable auto-play. */
  autoplay?: boolean;
  /** Auto-play interval in milliseconds. Default: 5000. */
  interval?: number;
  /** Pause auto-play on hover. Default: true. */
  pauseOnHover?: boolean;
  /** Loop back to first slide after last. Default: true. */
  repeat?: boolean;
  /** Enable drag/swipe navigation. Default: true. */
  hasDrag?: boolean;
  /** Show navigation arrows. Default: true. */
  arrow?: boolean;
  /** Only show arrows on hover. */
  arrowHover?: boolean;
  /** Show slide indicators. Default: true. */
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
  /** Callback when slide changes. */
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
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const carouselRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [internalValue, setInternalValue] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isWrapping, setIsWrapping] = useState(false);
    const [displayIndex, setDisplayIndex] = useState(0);
    const [skipTransition, setSkipTransition] = useState(false);

    // Get valid children
    const items = Children.toArray(children).filter(isValidElement);
    const itemCount = items.length;

    // Use controlled or internal value
    const activeIndex =
      controlledValue !== undefined ? controlledValue : internalValue;

    // Sync displayIndex when controlled value changes externally. Intentional
    // external-prop sync that must not run mid-wrap animation; covered by tests
    // and certified in-browser.
    useEffect(() => {
      if (controlledValue !== undefined && !isWrapping) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to controlled prop
        setDisplayIndex(controlledValue);
      }
    }, [controlledValue, isWrapping]);

    // Update active index
    const setActiveIndex = useCallback(
      (index: number, syncDisplay = true) => {
        let newIndex = index;

        if (repeat) {
          if (index < 0) {
            newIndex = itemCount - 1;
          } else if (index >= itemCount) {
            newIndex = 0;
          }
        } else {
          newIndex = Math.max(0, Math.min(index, itemCount - 1));
        }

        if (controlledValue === undefined) {
          setInternalValue(newIndex);
        }
        if (syncDisplay) {
          setDisplayIndex(newIndex);
        }
        onChange?.(newIndex);
      },
      [controlledValue, itemCount, repeat, onChange]
    );

    // Navigation handlers
    const goToPrev = useCallback(() => {
      if (activeIndex === 0 && repeat && itemCount > 1) {
        // Animate to clone of last slide (position -1)
        setDisplayIndex(-1);
        setIsWrapping(true);
      } else {
        setActiveIndex(activeIndex - 1);
      }
    }, [activeIndex, repeat, itemCount, setActiveIndex]);

    const goToNext = useCallback(() => {
      if (activeIndex === itemCount - 1 && repeat && itemCount > 1) {
        // Animate to clone of first slide (position itemCount)
        setDisplayIndex(itemCount);
        setIsWrapping(true);
      } else {
        setActiveIndex(activeIndex + 1);
      }
    }, [activeIndex, itemCount, repeat, setActiveIndex]);

    const goToSlide = useCallback(
      (index: number) => {
        setIsWrapping(false);
        setActiveIndex(index);
      },
      [setActiveIndex]
    );

    // Auto-play
    useEffect(() => {
      if (!autoplay || isPaused || itemCount <= 1) return undefined;

      const timer = setInterval(() => {
        goToNext();
      }, interval);

      return () => clearInterval(timer);
    }, [autoplay, isPaused, interval, goToNext, itemCount]);

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

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!carouselRef.current?.contains(document.activeElement)) return;

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            goToPrev();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goToNext();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [goToPrev, goToNext]);

    // Handle wrap-around transition end
    const handleTransitionEnd = useCallback(() => {
      if (isWrapping) {
        // Skip transition for the instant snap
        setSkipTransition(true);
        setIsWrapping(false);

        if (displayIndex === itemCount) {
          // Was at clone of first slide, snap to real first slide
          setActiveIndex(0, false);
          setDisplayIndex(0);
        } else if (displayIndex === -1) {
          // Was at clone of last slide, snap to real last slide
          setActiveIndex(itemCount - 1, false);
          setDisplayIndex(itemCount - 1);
        }

        // Re-enable transition after the snap
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSkipTransition(false);
          });
        });
      }
    }, [isWrapping, displayIndex, itemCount, setActiveIndex]);

    // Combined ref
    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        (carouselRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    // Can navigate
    const canGoPrev = repeat || activeIndex > 0;
    const canGoNext = repeat || activeIndex < itemCount - 1;

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

    // Render slides with active state (includes clones for infinite loop)
    const renderSlides = () => {
      const slides = items.map((item, index) => {
        if (isValidElement<CarouselItemProps>(item)) {
          return cloneElement(item, {
            key: index,
            active: index === activeIndex,
          });
        }
        return item;
      });

      // Add clones for seamless infinite loop when repeat is enabled
      if (repeat && itemCount > 1) {
        const lastItem = items[itemCount - 1];
        const firstItem = items[0];

        const lastClone = isValidElement<CarouselItemProps>(lastItem)
          ? cloneElement(lastItem as React.ReactElement<CarouselItemProps>, {
              key: 'clone-last',
              active: false,
            })
          : null;

        const firstClone = isValidElement<CarouselItemProps>(firstItem)
          ? cloneElement(firstItem as React.ReactElement<CarouselItemProps>, {
              key: 'clone-first',
              active: false,
            })
          : null;

        return [lastClone, ...slides, firstClone];
      }

      return slides;
    };

    return (
      <div
        ref={combinedRef}
        className={combinedClasses}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
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
            className={carouselSlidesClass}
            style={{
              // When repeat is enabled, account for the prepended clone (+1 offset)
              transform: `translateX(-${(repeat && itemCount > 1 ? displayIndex + 1 : displayIndex) * 100}%)`,
              // Disable transition during drag or instant snap after wrap-around
              transition:
                isDragging || skipTransition
                  ? 'none'
                  : 'transform 0.3s ease-in-out',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {renderSlides()}
          </div>
          {arrow && itemCount > 1 && (
            <>
              <Button
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

        {indicator && itemCount > 1 && (
          <div className={carouselIndicatorClass} role="tablist">
            {items.map((_, index) => (
              <Button
                key={index}
                className={prefixedClassNames(classPrefix, 'indicator-item', {
                  'is-active': index === activeIndex,
                })}
                onClick={() => goToSlide(index)}
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to slide ${index + 1}`}
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
