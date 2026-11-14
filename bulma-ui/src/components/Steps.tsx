import React, { createContext, useContext, useId } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useScopedNumberFormat } from '../helpers/localeFormat';
import { visuallyHidden } from '../helpers/statusRegion';

/**
 * The words a step inside Steps says after itself when it's completed or not
 * reached yet. A step outside Steps says none.
 */
interface StepsContextValue {
  completedLabel?: string;
  upcomingLabel?: string;
}

const StepsContext = createContext<StepsContextValue>({});

/** Available size modifiers for the Steps component. */
export type StepsSize = 'small' | 'medium' | 'large';
/** Available color variants for the Steps component. */
export type StepsColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Props for individual Step items.
 */
export interface StepItemProps {
  /**
   * Step label/title. On a `clickable` step it's rendered inside the step's
   * `<button>`, so it has to be phrasing content, like text, a `<span>` or an
   * icon, with no link, button or other control in it.
   */
  label?: React.ReactNode;
  /** Icon for the step marker */
  icon?: React.ReactNode;
  /**
   * Icon shown when the step is completed.
   * @defaultValue '✓'
   */
  completedIcon?: React.ReactNode;
  /**
   * Whether this step is clickable. A clickable step puts its marker and
   * label in a `<button type="button">` inside its list item, which calls
   * `onStepClick`, and the current step's `aria-current` goes on that button.
   */
  clickable?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for the Steps component.
 * @extraProp {React.ReactNode} [children] - Step children (alternative to items).
 * @extraProp {string} [className] - Additional CSS classes.
 */
export interface StepsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /** Current active step (0-indexed). */
  value?: number;
  /** Array of step items. */
  items?: StepItemProps[];
  /** Size of the steps. */
  size?: StepsSize;
  /**
   * Color variant. The current and completed steps take the color's
   * `-on-scheme` variant, the shade Bulma adjusts to read on the page in
   * either scheme, so a pale color such as `warning` is drawn darker on a
   * light page.
   */
  color?: StepsColor;
  /** Show step markers. Default: true. */
  hasMarker?: boolean;
  /** Enable animations. Default: true. */
  animated?: boolean;
  /** Use rounded markers. Default: true. */
  rounded?: boolean;
  /** Vertical layout. */
  vertical?: boolean;
  /**
   * Position of labels. `right` and `left` mean the end and the start of the
   * line, so in a right-to-left page `right` puts each label to the left of
   * its marker, and `left` to the right.
   */
  labelPosition?: 'bottom' | 'right' | 'left';
  /** Mobile display mode. */
  mobileMode?: 'minimal' | 'compact' | 'right';
  /** Displays step numbers in the markers. */
  showStepNumbers?: boolean;
  /**
   * Shows previous/next navigation buttons. They render `type="button"`, so a
   * multi-step form wrapped around the steps is not submitted by moving
   * between them.
   */
  hasNavigation?: boolean;
  /** Label for the previous button. */
  prevLabel?: string;
  /** Label for the next button. */
  nextLabel?: string;
  /**
   * Read after a completed step, visually hidden, and as a clickable step's
   * description. In your app's language. An empty string says nothing.
   */
  completedLabel?: string;
  /**
   * Read after a step not reached yet, visually hidden, and as a clickable
   * step's description. In your app's language. An empty string says nothing.
   */
  upcomingLabel?: string;
  /** Callback when previous button is clicked. */
  onPrev?: () => void;
  /** Callback when next button is clicked. */
  onNext?: () => void;
  /** Callback when a step is clicked. */
  onStepClick?: (step: number) => void;
}

/**
 * Props for the Step subcomponent.
 */
export interface StepProps
  extends
    Omit<React.LiHTMLAttributes<HTMLLIElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Whether this step is active */
  isActive?: boolean;
  /**
   * Whether this step is completed. Inside `Steps` it's set from `value`, and
   * a completed step ends in the words `completedLabel` sets, for assistive
   * tech. A `Step` on its own says no words.
   */
  isCompleted?: boolean;
  /**
   * Step label/title, or pass it as `children`. On a `clickable` step it's
   * rendered inside the step's `<button>`, so it has to be phrasing content,
   * like text, a `<span>` or an icon, with no link, button or other control
   * in it.
   */
  label?: React.ReactNode;
  /** Icon for the step marker */
  icon?: React.ReactNode;
  /**
   * Whether this step is clickable. A clickable step puts its marker and
   * label in a `<button type="button">` inside the `<li>`, which calls
   * `onClick`, and `aria-current` goes on that button. The `<li>` keeps the
   * rest of the props.
   */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
  /**
   * Step number to display in marker (1-indexed), written the way the
   * `locale` of a `LocaleProvider` around it writes numbers.
   */
  stepNumber?: number;
  /**
   * Icon shown when the step is completed.
   * @defaultValue '✓'
   */
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
  const formatNumber = useScopedNumberFormat();

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

  const resolvedCompletedIcon =
    completedIcon === undefined ? '\u2713' : completedIcon;
  const markerContent =
    icon ||
    (isCompleted && resolvedCompletedIcon
      ? resolvedCompletedIcon
      : stepNumber == null || !formatNumber
        ? (stepNumber ?? null)
        : formatNumber(stepNumber));
  const title = label || children;
  const current = isActive ? 'step' : undefined;

  // The state in words, read after the step: "completed" or "upcoming". The
  // current step has none, since aria-current says it. They sit in the list
  // item after the step, outside a clickable step's button, which names them
  // as its description, so a step's accessible name stays its marker and its
  // label. They stay in the tree there too, so a reader that skips
  // descriptions still reaches them. The styles are inline, so the words stay
  // hidden in a modular build that leaves out Bulma's helper classes.
  const { completedLabel, upcomingLabel } = useContext(StepsContext);
  const stateWords = isCompleted
    ? completedLabel
    : isActive
      ? undefined
      : upcomingLabel;
  const wordsId = useId();
  const words = stateWords ? (
    <span id={wordsId} style={visuallyHidden}>{` ${stateWords}`}</span>
  ) : null;

  // The step stays a list item, and a real button inside it does the
  // clicking, so the list keeps its items and the button brings Enter, Space
  // and focus with it. A button holds only phrasing content, so its parts
  // are spans.
  if (clickable) {
    return (
      <li className={stepClasses} {...rest}>
        <button
          type="button"
          className={stepsLinkClass}
          onClick={() => onClick?.()}
          aria-current={current}
          aria-describedby={words ? wordsId : undefined}
        >
          <span className={stepsMarkerClass}>{markerContent}</span>
          {title && (
            <span className={stepsContentClass}>
              <span className={stepsTitleClass}>{title}</span>
            </span>
          )}
        </button>
        {words}
      </li>
    );
  }

  return (
    <li className={stepClasses} aria-current={current} {...rest}>
      <div className={stepsLinkClass}>
        <span className={stepsMarkerClass}>{markerContent}</span>
        {title && (
          <div className={stepsContentClass}>
            <p className={stepsTitleClass}>{title}</p>
          </div>
        )}
      </div>
      {words}
    </li>
  );
};

/**
 * The `Steps` component provides a multi-step progress indicator for wizard flows, checkout processes, or any multi-step workflow.
 *
 * Each step is a list item. The current one has `aria-current="step"`, and a
 * completed one, and one not reached yet, ends in a visually hidden
 * "completed" or "upcoming", in the language `completedLabel` and
 * `upcomingLabel` set. A clickable step's button takes those words as its
 * description, so its accessible name stays its marker and its label.
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
const StepsComponent: React.FC<StepsProps> = ({
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
  completedLabel = 'completed',
  upcomingLabel = 'upcoming',
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

  // role="list" restates the <ul>'s own role, for Safari: WebKit stops
  // exposing a list as one once its markers are hidden, as they are here,
  // unless the role is set explicitly.
  return (
    <div className={combinedClasses} {...rest}>
      <StepsContext.Provider value={{ completedLabel, upcomingLabel }}>
        <ul className={listClasses} role="list">
          {renderSteps()}
        </ul>
      </StepsContext.Provider>
      {hasNavigation && (
        <div className={stepsNavigationClass}>
          <button
            type="button"
            className={prevButtonClass}
            disabled={value === 0}
            onClick={onPrev ?? (() => onStepClick?.(value - 1))}
          >
            {prevLabel ?? 'Previous'}
          </button>
          <button
            type="button"
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
export const Steps = withSubComponents(StepsComponent, { Step }, 'Steps');

export default Steps;
