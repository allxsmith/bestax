import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { Buttons, ButtonsProps } from '../elements/Buttons';
import { Icon } from '../elements/Icon';
import { Paragraph, ParagraphProps } from '../elements/Paragraph';
import { Title, TitleProps } from '../elements/Title';

const validEmptyStateColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;
/** The Bulma colors the indicator takes. */
export type EmptyStateColor = (typeof validEmptyStateColors)[number];

const validEmptyStateHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
/** A title's heading level. It's always a heading, so there's no `p`. */
export type EmptyStateHeading = (typeof validEmptyStateHeadings)[number];

const validEmptyStateSizes = ['small', 'medium', 'large'] as const;

/**
 * Props for the EmptyState component. The helper props, the other attributes
 * and the `ref` land on the root `<div>`. The native `title` attribute isn't
 * one of them, since `title` here is the heading.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root `<div>`.
 */
export interface EmptyStateProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The picture in the indicator's circle. A string is an `Icon` name, drawn
   * from the icon library `ConfigProvider` sets. Anything else (an `<Icon>`
   * with its own `variant` or `library`, an SVG, an `<img>`) renders as it is.
   * It's decorative and hidden from assistive tech, so the title says what
   * it means.
   */
  icon?: React.ReactNode;
  /**
   * The heading, rendered as `EmptyState.Title`. It's always a real heading,
   * at the level `titleAs` sets.
   */
  title?: React.ReactNode;
  /**
   * The heading level for `title`: the level under the heading of the list
   * it stands in for, such as `h3` for a list under an `h2`. Only this sets
   * the level, and the size comes from `size`.
   */
  titleAs?: EmptyStateHeading;
  /** A sentence or two under the title, rendered as `EmptyState.Description`. */
  description?: React.ReactNode;
  /**
   * Rendered as written, after whatever `icon`, `title` and `description`
   * render. One button can go straight in, and it sits centered under the
   * text. Group two or more in `EmptyState.Actions`, or they stack. Without
   * the props, write the parts here in the order they're shown:
   * `EmptyState.Indicator`, `.Title`, `.Description`, then the actions.
   */
  children?: React.ReactNode;
  /**
   * The indicator's color. It colors the circle and its icon, not the text.
   * Without it the circle is neutral, since an empty list isn't a status.
   */
  color?: EmptyStateColor;
  /**
   * `light` is a soft tint of `color` behind the icon in the color. `filled`
   * is the color itself, with the icon in its invert.
   */
  variant?: 'light' | 'filled';
  /** Sizes the indicator, the title, the description and the spacing together. */
  size?: 'small' | 'normal' | 'medium' | 'large';
  /**
   * `center` stacks everything in a centered column. `left` puts the
   * indicator beside the text, at the start of the line, so on the right in
   * a right-to-left page. In `left`, the padding at the start of the line is
   * what makes room for the indicator, so pad it with `py` rather than `p`
   * or `px`.
   */
  align?: 'center' | 'left';
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/** Props for EmptyState.Indicator, the circle the picture sits in. */
export interface EmptyStateIndicatorProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The picture: an `Icon`, an SVG or an `<img>`. The indicator is hidden
   * from assistive tech, an `Icon` with an `ariaLabel` included, so anything
   * it means goes in the title or the description.
   */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for EmptyState.Title. It renders `Title` with `as` and never `size`,
 * so the level is `as` alone and the size comes from the EmptyState.
 */
export interface EmptyStateTitleProps extends Omit<
  TitleProps,
  'as' | 'size' | 'isSpaced'
> {
  /**
   * The heading level: the level under the heading of the list the empty
   * state stands in for.
   */
  as?: EmptyStateHeading;
}

/** Props for EmptyState.Description, a `<p>` under the title. */
export type EmptyStateDescriptionProps = ParagraphProps;

/**
 * Props for EmptyState.Actions, the row of buttons. It renders `Buttons`,
 * and the EmptyState aligns it, so `isCentered` and `isRight` are left out.
 */
export type EmptyStateActionsProps = Omit<
  ButtonsProps,
  'isCentered' | 'isRight'
>;

/**
 * The circle the picture sits in, hidden from assistive tech whatever is in it.
 *
 * @function
 * @param {EmptyStateIndicatorProps} props - Props for EmptyState.Indicator.
 * @returns {JSX.Element} The rendered indicator.
 */
export const EmptyStateIndicator: React.FC<EmptyStateIndicatorProps> = ({
  className,
  textColor,
  bgColor,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });
  const indicatorClass = usePrefixedClassNames('empty-state-indicator');

  // Hidden after the rest of the props, so nothing passed in can expose the
  // picture: the title says what it means.
  return (
    <div
      className={classNames(indicatorClass, bulmaHelperClasses, className)}
      {...rest}
      aria-hidden="true"
    >
      {children}
    </div>
  );
};

EmptyStateIndicator.displayName = 'EmptyState.Indicator';

/**
 * The heading, a Bulma `Title` at the level `as` sets, `h2` by default, and at the EmptyState's size.
 *
 * @function
 * @param {EmptyStateTitleProps} props - Props for EmptyState.Title.
 * @returns {JSX.Element} The rendered heading.
 */
export const EmptyStateTitle: React.FC<EmptyStateTitleProps> = ({
  as = 'h2',
  className,
  ...props
}) => {
  // `size` isn't in the type, but on `Title` it picks the tag, so it's kept
  // off even when it's passed anyway. The level is `as` alone.
  const { size: _size, ...rest } = props as typeof props & { size?: unknown };
  const titleClass = usePrefixedClassNames('empty-state-title');
  const level = validEmptyStateHeadings.includes(as) ? as : 'h2';

  return (
    <Title as={level} className={classNames(titleClass, className)} {...rest} />
  );
};

EmptyStateTitle.displayName = 'EmptyState.Title';

/**
 * A sentence or two under the title, in the color of the text around it.
 *
 * @function
 * @param {EmptyStateDescriptionProps} props - Props for EmptyState.Description.
 * @returns {JSX.Element} The rendered description.
 */
export const EmptyStateDescription: React.FC<EmptyStateDescriptionProps> = ({
  className,
  ...props
}) => {
  const descriptionClass = usePrefixedClassNames('empty-state-description');
  return (
    <Paragraph className={classNames(descriptionClass, className)} {...props} />
  );
};

EmptyStateDescription.displayName = 'EmptyState.Description';

/**
 * A row of buttons, centered under the text or at the start of the line beside the indicator.
 *
 * @function
 * @param {EmptyStateActionsProps} props - Props for EmptyState.Actions.
 * @returns {JSX.Element} The rendered row of buttons.
 */
export const EmptyStateActions: React.FC<EmptyStateActionsProps> = ({
  className,
  ...props
}) => {
  const actionsClass = usePrefixedClassNames('empty-state-actions');
  return <Buttons className={classNames(actionsClass, className)} {...props} />;
};

EmptyStateActions.displayName = 'EmptyState.Actions';

/** Whether a shorthand prop was given something to render. */
const isGiven = (node: React.ReactNode) =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';

/**
 * The `EmptyState` component renders the block an app shows where content would be: an empty list, a search with no results, or a first-run screen.
 *
 * It's a column of a picture in a circle, a heading, a line of text and the
 * actions, with one layout whether it's written with the `icon`, `title` and
 * `description` props or with the parts. The children always render as
 * written, after the parts the props render.
 *
 * It has no role and no live region. It arrives already filled and goes away
 * when results come back, so it can't announce a search that matched
 * nothing: keep a `role="status"` region beside the search field for that,
 * in the page the whole time. While the data loads, show a `Skeleton` or a
 * `Loader` instead, so "No projects yet" doesn't flash first, and show a
 * load that failed in a `Message` or a `Notification`.
 *
 * @function
 * @param {EmptyStateProps} props - Props for the EmptyState component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the root `<div>`.
 * @returns {JSX.Element} The rendered empty state.
 *
 * @example
 * <EmptyState
 *   icon="folder-open"
 *   title="No projects yet"
 *   description="Projects you create or join show up here."
 * >
 *   <Button color="primary">New project</Button>
 * </EmptyState>
 */
const EmptyStateRoot = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      titleAs = 'h2',
      description,
      children,
      color,
      variant = 'light',
      size = 'normal',
      align = 'center',
      textColor,
      bgColor,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const rootClass = usePrefixedClassNames('empty-state', {
      [`is-${size}`]: (validEmptyStateSizes as readonly string[]).includes(
        size
      ),
      'is-left': align === 'left',
      [`is-${color}`]:
        !!color && (validEmptyStateColors as readonly string[]).includes(color),
      'is-filled': variant === 'filled',
    });

    // The props' parts first, each only when it's given, then the children
    // exactly as they were written: nothing here looks at them.
    return (
      <div
        ref={ref}
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {isGiven(icon) && (
          <EmptyStateIndicator>
            {typeof icon === 'string' ? <Icon name={icon} /> : icon}
          </EmptyStateIndicator>
        )}
        {isGiven(title) && (
          <EmptyStateTitle as={titleAs}>{title}</EmptyStateTitle>
        )}
        {isGiven(description) && (
          <EmptyStateDescription>{description}</EmptyStateDescription>
        )}
        {children}
      </div>
    );
  }
);

export const EmptyState = withSubComponents(
  EmptyStateRoot,
  {
    Indicator: EmptyStateIndicator,
    Title: EmptyStateTitle,
    Description: EmptyStateDescription,
    Actions: EmptyStateActions,
  },
  'EmptyState'
);

export default EmptyState;
