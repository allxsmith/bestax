import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the FigureCaption component.
 */
export interface FigureCaptionProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color (Bulma color, 'inherit', or 'current'). */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color (Bulma color, 'inherit', or 'current'). */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to be rendered inside the figcaption. */
  children?: React.ReactNode;
}

/**
 * FigureCaption component for rendering a styled figcaption element.
 *
 * A FigureCaption wraps the HTML `<figcaption>` element with Bulma helper class integration.
 * Use it inside Figure components to provide captions for images or other media.
 *
 * @function
 * @param {FigureCaptionProps} props - Props for the FigureCaption component.
 * @returns {JSX.Element} The rendered figcaption element.
 */
const FigureCaption: React.FC<FigureCaptionProps> = ({
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
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames();
  const captionClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <figcaption className={captionClasses || undefined} {...rest}>
      {children}
    </figcaption>
  );
};

/**
 * Props for the Figure component.
 */
export interface FigureProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to render inside the figure. */
  children?: React.ReactNode;
}

/**
 * The `Figure` component renders a styled `<figure>` element with Bulma helper class integration.
 *
 * @function
 * @param {FigureProps} props - Props for the Figure component.
 * @returns {JSX.Element} The rendered figure element.
 */
const FigureComponent: React.FC<FigureProps> = ({
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
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames();
  const figureClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <figure className={figureClasses || undefined} {...rest}>
      {children}
    </figure>
  );
};

/**
 * Figure component with Caption subcomponent.
 *
 * @example
 * <Figure>
 *   <img src="image.jpg" alt="Description" />
 *   <Figure.Caption>Image caption text</Figure.Caption>
 * </Figure>
 */
export const Figure = withSubComponents(
  FigureComponent,
  {
    Caption: FigureCaption,
  },
  'Figure'
);
