import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Collapse component.
 * @extraProp {React.ReactNode} [children] - The collapsible content.
 * @extraProp {string} [className] - Additional CSS classes.
 */
export interface CollapseProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Controlled open state. If provided, component is controlled. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Callback when collapse opens. */
  onOpen?: () => void;
  /** Callback when collapse closes. */
  onClose?: () => void;
  /** The clickable trigger element (header/button). */
  trigger?: React.ReactNode;
  /** Animation style, or `false` to disable. */
  animation?: 'fade' | 'slide' | false;
  /** Position of the trigger relative to content. */
  position?: 'top' | 'bottom';
  /**
   * Custom aria id for accessibility.
   * @defaultValue auto
   */
  ariaId?: string;
  /** Adds a border around the collapse. */
  bordered?: boolean;
  /** Additional classes for the trigger wrapper. */
  triggerClassName?: string;
  /** Additional classes for the content wrapper. */
  contentClassName?: string;
}

/**
 * The `Collapse` component provides an expandable/collapsible content panel.
 *
 * @function
 * @param {CollapseProps} props - Props for the Collapse component.
 * @returns {JSX.Element} The rendered collapse component.
 *
 * @example
 * // Basic uncontrolled collapse
 * <Collapse trigger={<button>Click to toggle</button>}>
 *   <p>Collapsible content here</p>
 * </Collapse>
 *
 * @example
 * // Controlled collapse
 * const [isOpen, setIsOpen] = useState(false);
 * <Collapse
 *   open={isOpen}
 *   trigger={<button onClick={() => setIsOpen(!isOpen)}>Toggle</button>}
 * >
 *   <p>Content</p>
 * </Collapse>
 *
 * @example
 * // With callbacks
 * <Collapse
 *   trigger={<button>Toggle</button>}
 *   onOpen={() => console.log('Opened!')}
 *   onClose={() => console.log('Closed!')}
 * >
 *   <p>Content</p>
 * </Collapse>
 */
export const Collapse: React.FC<CollapseProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpen,
  onClose,
  trigger,
  animation = 'fade',
  position = 'top',
  ariaId,
  bordered,
  children,
  className,
  triggerClassName,
  contentClassName,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(
    defaultOpen ? 'auto' : 0
  );

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Generate unique ID for accessibility (useId is SSR-safe and stable across
  // renders; works in React 18 and 19).
  const generatedId = useId();
  const uniqueId = ariaId || generatedId;

  // Update height when open state changes (for 'slide' animation)
  useEffect(() => {
    if (!contentRef.current) return undefined;
    if (animation !== 'slide') return undefined;

    if (isOpen) {
      // Opening: set height to content's scrollHeight
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);

      // After animation completes, set to auto for dynamic content
      const timer = setTimeout(() => {
        setHeight('auto');
      }, 300); // Match CSS transition duration
      return () => clearTimeout(timer);
    } else {
      // Closing: first set to current height, then to 0
      if (height === 'auto') {
        // Read scrollHeight and offsetHeight to capture the current size and
        // force a layout flush, then schedule the height transition to 0.
        // (Reading offsetHeight after assignment is the standard reflow trick;
        // assigning into a state setter avoids a bare expression statement.)
        const currentHeight = contentRef.current.scrollHeight;
        const reflowHeight = contentRef.current.offsetHeight;
        setHeight(Math.max(currentHeight, reflowHeight));
        requestAnimationFrame(() => {
          setHeight(0);
        });
      } else {
        setHeight(0);
      }
    }
    return undefined;
    // `height` is read here but is an output of this effect; re-running when it
    // changes would re-trigger the open/close animation, so it's intentionally
    // excluded from the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, animation]);

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (!isControlled) {
      const newOpen = !internalOpen;
      setInternalOpen(newOpen);
      if (newOpen) {
        onOpen?.();
      } else {
        onClose?.();
      }
    }
  }, [isControlled, internalOpen, onOpen, onClose]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Generate Bulma classes
  const collapseClasses = usePrefixedClassNames('collapse', {
    'is-active': isOpen,
    'is-bordered': bordered,
  });

  const combinedClasses = classNames(
    collapseClasses,
    bulmaHelperClasses,
    className
  );
  const combinedTriggerClasses = classNames(
    usePrefixedClassNames('collapse-trigger'),
    triggerClassName
  );
  const combinedContentClasses = classNames(
    usePrefixedClassNames('collapse-content', {
      'is-active': isOpen,
    }),
    contentClassName
  );

  // Content wrapper styles based on animation type
  let contentWrapperStyle: React.CSSProperties;

  if (animation === 'slide') {
    contentWrapperStyle = {
      height: height === 'auto' ? 'auto' : `${height}px`,
      overflow: 'hidden',
      transition: 'height 0.3s ease-in-out',
    };
  } else if (animation === 'fade') {
    contentWrapperStyle = {
      opacity: isOpen ? 1 : 0,
      overflow: 'hidden',
      height: isOpen ? 'auto' : 0,
      transition: 'opacity 0.3s ease-in-out',
    };
  } else {
    contentWrapperStyle = {
      display: isOpen ? 'block' : 'none',
    };
  }

  const triggerElement = (
    <div
      className={combinedTriggerClasses}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-controls={uniqueId}
    >
      {trigger}
    </div>
  );

  const contentElement = (
    <div style={contentWrapperStyle}>
      <div
        ref={contentRef}
        id={uniqueId}
        className={combinedContentClasses}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className={combinedClasses} {...rest}>
      {position === 'bottom' ? (
        <>
          {contentElement}
          {triggerElement}
        </>
      ) : (
        <>
          {triggerElement}
          {contentElement}
        </>
      )}
    </div>
  );
};

export default Collapse;
