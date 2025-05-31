import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Image component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the image container.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {string} [size] - Size or aspect ratio modifier (e.g., '128x128', '16by9', etc.).
 * @property {boolean} [isRounded] - Whether the image should have rounded corners.
 * @property {boolean} [isRetina] - Whether to use retina (2x) image source.
 * @property {string} [src] - Image source URL.
 * @property {string} [alt] - Alternate text for the image.
 * @property {React.ReactNode} [children] - Arbitrary children (e.g., iframe or custom content).
 */
export interface ImageProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  size?:
    | '16x16'
    | '24x24'
    | '32x32'
    | '48x48'
    | '64x64'
    | '96x96'
    | '128x128'
    | 'square'
    | '1by1'
    | '5by4'
    | '4by3'
    | '3by2'
    | '5by3'
    | '16by9'
    | '2by1'
    | '3by1'
    | '4by5'
    | '3by4'
    | '2by3'
    | '3by5'
    | '9by16'
    | '1by2'
    | '1by3';
  isRounded?: boolean;
  isRetina?: boolean;
  src?: string;
  alt?: string;
  children?: React.ReactNode;
}

/**
 * Image component for rendering a styled Bulma image element.
 *
 * Supports fixed-size containers, aspect ratios, rounded images, retina images, and arbitrary children (e.g., iframe).
 *
 * @function
 * @param {ImageProps} props - Props for the Image component.
 * @returns {JSX.Element} The rendered image element.
 */
export const Image: React.FC<ImageProps> = ({
  className,
  textColor,
  bgColor,
  size,
  isRounded,
  isRetina,
  src,
  alt,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const imageClasses = classNames('image', className, bulmaHelperClasses, {
    [`is-${size}`]: size,
    'has-ratio': size && size.includes('by'), // Aspect ratio needs has-ratio
  });

  // Use figure for aspect ratio sizes or when children are provided
  const useFigure = size && size.includes('by');

  const content = children ? (
    children
  ) : (
    <img
      className={classNames({ 'is-rounded': isRounded })}
      src={src}
      alt={alt}
      {...(isRetina && src ? { srcSet: `${src} 2x` } : {})}
    />
  );

  if (useFigure) {
    return (
      <figure className={imageClasses} {...rest}>
        {content}
      </figure>
    );
  }

  return (
    <div className={imageClasses} {...rest}>
      {content}
    </div>
  );
};
