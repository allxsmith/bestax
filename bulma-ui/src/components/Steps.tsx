import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/** Available size modifiers for the Steps component. */
export type StepsSize = 'small' | 'medium' | 'large';
/** Available color variants for the Steps component. */
export type StepsColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Props for individual Step items.
 *
 * @property {React.ReactNode} [label] - Step label/title.
 * @property {React.ReactNode} [icon] - Icon for the step marker.
 * @property {React.ReactNode} [completedIcon] - Custom icon for completed state. Set to null to show step number instead of checkmark.
 * @property {boolean} [clickable] - Whether this step is clickable.
 * @property {string} [className] - Additional class for this step.
 */
export interface StepItemProps {
  /** Step label/title */
  label?: React.ReactNode;
  /** Icon for the step marker */
  icon?: React.ReactNode;
  /** Custom icon for completed state. Set to null to show step number instead of checkmark. */
  completedIcon?: React.ReactNode;
  /** Whether this step is clickable */
  clickable?: boolean;
  /** Additional class for this step */
  className?: string;
}

/**
 * Props for the Steps component.
 *
 * @property {number} [value] - Current active step (0-indexed).
 * @property {StepItemProps[]} [items] - Array of step items.
 * @property {StepsSize} [size] - Size of the steps.
 * @property {StepsColor} [color] - Color variant.
 * @property {boolean} [hasMarker] - Show step markers. Default: true.
 * @property {boolean} [animated] - Enable animations. Default: true.
 * @property {boolean} [rounded] - Use rounded markers. Default: true.
 * @property {boolean} [vertical] - Vertical layout.
 * @property {'bottom' | 'right' | 'left'} [labelPosition] - Position of labels.
 * @property {boolean} [showStepNumbers] - Show step numbers in markers. Default: true.
 * @property {boolean} [hasNavigation] - Render built-in prev/next buttons.
 * @property {string} [prevLabel] - Custom prev button text (default 'Previous').
 * @property {string} [nextLabel] - Custom next button text (default 'Next').
 * @property {() => void} [onPrev] - Custom prev button callback.
 * @property {() => void} [onNext] - Custom next button callback.
 * @property {(step: number) => void} [onStepClick] - Callback when a step is clicked.
 * @property {'minimal' | 'compact' | 'right'} [mobileMode] - Mobile display mode.
 * @property {React.ReactNode} [children] - Step children (alternative to items).
 */
export interface StepsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  value?: number;
  items?: StepItemProps[];
  size?: StepsSize;
  color?: StepsColor;
  hasMarker?: boolean;
  animated?: boolean;
  rounded?: boolean;
  vertical?: boolean;
  labelPosition?: 'bottom' | 'right' | 'left';
  mobileMode?: 'minimal' | 'compact' | 'right';
  showStepNumbers?: boolean;
  hasNavigation?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onStepClick?: (step: number) => void;
}

/**
 * Props for the Step subcomponent.
 *
 * @property {boolean} [isActive] - Whether this step is active.
 * @property {boolean} [isCompleted] - Whether this step is completed.
 * @property {React.ReactNode} [label] - Step label/title.
 * @property {React.ReactNode} [icon] - Icon for the step marker.
 * @property {boolean} [clickable] - Whether this step is clickable.
 * @property {() => void} [onClick] - Click handler.
 * @property {number} [stepNumber] - Step number to display in marker (1-indexed).
 * @property {React.ReactNode} [completedIcon] - Custom icon for completed state.
 */
export interface StepProps
  extends
    Omit<React.LiHTMLAttributes<HTMLLIElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Whether this step is active */
  isActive?: boolean;
  /** Whether this step is completed */
  isCompleted?: boolean;
  /** Step label/title */
  label?: React.ReactNode;
  /** Icon for the step marker */
  icon?: React.ReactNode;
  /** Whether this step is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Step number to display in marker (1-indexed) */
  stepNumber?: number;
  /** Custom icon for completed state. Set to null to show step number instead of checkmark. */
  completedIcon?: React.ReactNode;
}

/**
 * Individual Step component for use inside Steps.
 *
 * @function
 * @param {StepProps} props - Props for the Step component.
 * @returns {JSX.Element} The rendered step segment.
 */
export const Step: React.FC<StepProps> = ({
  isActive = false,
  isCompleted = false,
  label,
  icon,
  clickable = false,
  onClick,
  stepNumber,
  completedIcon,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  const stepClasses = classNames(
    usePrefixedClassNames('steps-segment', {
      'is-active': isActive,
      'is-completed': isCompleted,
    }),
    bulmaHelperClasses,
    className
  );
  const stepsLinkClass = usePrefixedClassNames('steps-link');
  const stepsMarkerClass = usePrefixedClassNames('steps-marker');
  const stepsContentClass = usePrefixedClassNames('steps-content');
  const stepsTitleClass = usePrefixedClassNames('steps-title');

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const resolvedCompletedIcon =
    completedIcon === undefined ? '\u2713' : completedIcon;
  const markerContent =
    icon ||
    (isCompleted && resolvedCompletedIcon
      ? resolvedCompletedIcon
      : (stepNumber ?? null));

  return (
    <li
      className={stepClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      aria-current={isActive ? 'step' : undefined}
      {...rest}
    >
      <div className={stepsLinkClass}>
        <span className={stepsMarkerClass}>{markerContent}</span>
        {(label || children) && (
          <div className={stepsContentClass}>
            <p className={stepsTitleClass}>{label || children}</p>
          </div>
        )}
      </div>
    </li>
  );
};

/**
 * Steps component for multi-step progress indication.
 *
 * Use for wizard flows, checkout processes, or any multi-step workflow.
 * Supports horizontal and vertical layouts with customizable markers.
 *
 * @function
 * @param {StepsProps} props - Props for the Steps component.
 * @returns {JSX.Element} The rendered steps component.
 *
 * @example
 * // Basic steps with items
 * <Steps
 *   value={1}
 *   items={[
 *     { label: 'Account' },
 *     { label: 'Profile' },
 *     { label: 'Complete' },
 *   ]}
 * />
 *
 * @example
 * // Clickable steps with navigation
 * <Steps
 *   value={currentStep}
 *   onStepClick={(step) => setCurrentStep(step)}
 *   hasNavigation
 *   items={[
 *     { label: 'Step 1', clickable: true },
 *     { label: 'Step 2', clickable: true },
 *     { label: 'Step 3', clickable: true },
 *   ]}
 * />
 */
export const Steps: React.FC<StepsProps> & { Step: typeof Step } = ({
  value = 0,
  items,
  size,
  color,
  hasMarker = true,
  animated = true,
  rounded = true,
  vertical = false,
  labelPosition = 'bottom',
  mobileMode,
  showStepNumbers = true,
  hasNavigation = false,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  onStepClick,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  // Generate classes for the wrapper div
  const stepsClasses = usePrefixedClassNames('steps', {
    [`is-${size}`]: size,
    [`is-${color}`]: color,
    'has-marker': hasMarker,
    'is-animated': animated,
    'is-rounded': rounded,
    'is-vertical': vertical,
    [`has-label-${labelPosition}`]:
      labelPosition && (labelPosition !== 'bottom' || vertical),
    [`is-${mobileMode}`]: mobileMode,
  });

  const combinedClasses = classNames(
    stepsClasses,
    bulmaHelperClasses,
    className
  );

  // Generate classes for the ul (list)
  const listClasses = usePrefixedClassNames('steps-list', {
    'is-vertical': vertical,
  });
  const stepsNavigationClass = usePrefixedClassNames('steps-navigation');
  const prevButtonClass = usePrefixedClassNames('button');
  const nextButtonClass = usePrefixedClassNames('button', {
    'is-primary': true,
  });

  // Count total steps for navigation
  const totalSteps = items ? items.length : React.Children.count(children);

  // Render items if provided
  const renderSteps = () => {
    if (items && items.length > 0) {
      return items.map((item, index) => (
        <Step
          key={index}
          isActive={index === value}
          isCompleted={index < value}
          label={item.label}
          icon={item.icon}
          completedIcon={item.completedIcon}
          clickable={item.clickable}
          stepNumber={showStepNumbers ? index + 1 : undefined}
          onClick={
            item.clickable && onStepClick ? () => onStepClick(index) : undefined
          }
          className={item.className}
        />
      ));
    }

    // If children are provided, clone them with active/completed states
    if (children) {
      return React.Children.map(children, (child, index) => {
        if (React.isValidElement<StepProps>(child)) {
          return React.cloneElement(child, {
            isActive: index === value,
            isCompleted: index < value,
            stepNumber: showStepNumbers ? index + 1 : undefined,
            onClick:
              child.props.clickable && onStepClick
                ? () => onStepClick(index)
                : child.props.onClick,
          });
        }
        return child;
      });
    }

    return null;
  };

  return (
    <div className={combinedClasses} {...rest}>
      <ul className={listClasses}>{renderSteps()}</ul>
      {hasNavigation && (
        <div className={stepsNavigationClass}>
          <button
            className={prevButtonClass}
            disabled={value === 0}
            onClick={onPrev ?? (() => onStepClick?.(value - 1))}
          >
            {prevLabel ?? 'Previous'}
          </button>
          <button
            className={nextButtonClass}
            disabled={value === totalSteps - 1}
            onClick={onNext ?? (() => onStepClick?.(value + 1))}
          >
            {nextLabel ?? 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

// Attach Step as static property
Steps.Step = Step;

export default Steps;
