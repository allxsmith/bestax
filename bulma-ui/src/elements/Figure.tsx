import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the FigureCaption component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the figcaption.
 */
export interface FigureCaptionProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
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
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the figure.
 */
export interface FigureProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Figure component for rendering a styled figure element.
 *
 * A Figure wraps the HTML `<figure>` element with Bulma helper class integration.
 * Use it to group self-contained content like images, illustrations, diagrams, or code snippets
 * with an optional caption via Figure.Caption.
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
export const Figure = Object.assign(FigureComponent, {
  Caption: FigureCaption,
});
