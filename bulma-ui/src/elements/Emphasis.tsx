import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Emphasis component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the em element.
 */
export interface EmphasisProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Emphasis component for rendering semantically emphasized italic text.
 *
 * An Emphasis wraps the HTML `<em>` element with Bulma helper class integration.
 * Use it for text that has stress emphasis, affecting the meaning of the sentence.
 * For visual-only italic styling without semantic meaning, use CSS font-style: italic.
 *
 * @function
 * @param {EmphasisProps} props - Props for the Emphasis component.
 * @returns {JSX.Element} The rendered em element.
 */
export const Emphasis: React.FC<EmphasisProps> = ({
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
  const emphasisClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <em className={emphasisClasses || undefined} {...rest}>
      {children}
    </em>
  );
};
