import React, { useState, useRef, useEffect, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Collapse component.
 *
 * @property {boolean} [open] - Controlled open state. If provided, component is controlled.
 * @property {boolean} [defaultOpen] - Initial open state for uncontrolled usage.
 * @property {() => void} [onOpen] - Callback when collapse opens.
 * @property {() => void} [onClose] - Callback when collapse closes.
 * @property {React.ReactNode} [trigger] - The clickable trigger element (usually a header/button).
 * @property {'fade'|'slide'|false} [animation] - Animation type. 'fade' for opacity transition, 'slide' for height transition, false to disable. Default: 'fade'.
 * @property {'top'|'bottom'} [position] - Position of trigger relative to content. Default: 'top'.
 * @property {string} [ariaId] - Custom aria id for accessibility.
 * @property {boolean} [bordered] - Whether to show a border around the collapse.
 * @property {React.ReactNode} [children] - The collapsible content.
 * @property {string} [className] - Additional CSS classes.
 * @property {string} [triggerClassName] - Additional classes for the trigger wrapper.
 * @property {string} [contentClassName] - Additional classes for the content wrapper.
 */
export interface CollapseProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  trigger?: React.ReactNode;
  animation?: 'fade' | 'slide' | false;
  position?: 'top' | 'bottom';
  ariaId?: string;
  bordered?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
}

/**
 * Collapse component for expandable/collapsible content panels.
 *
 * Can be used in controlled or uncontrolled mode. Supports animation
 * and accessibility features for screen readers.
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

  // Generate unique ID for accessibility
  const uniqueId = useRef(
    ariaId || `collapse-${Math.random().toString(36).slice(2, 9)}`
  );

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
    'collapse-trigger',
    triggerClassName
  );
  const combinedContentClasses = classNames(
    'collapse-content',
    contentClassName,
    {
      'is-active': isOpen,
    }
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
      aria-controls={uniqueId.current}
    >
      {trigger}
    </div>
  );

  const contentElement = (
    <div style={contentWrapperStyle}>
      <div
        ref={contentRef}
        id={uniqueId.current}
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
