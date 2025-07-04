import React from 'react';
import classNames from '../helpers/classNames';
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
 * @property {'figure' | 'div' | 'p'} [as] - The tag to render. Defaults to 'figure', but can be 'p', 'div', etc.
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
  as?: 'figure' | 'div' | 'p';
}

/**
 * Image component for rendering a styled Bulma image element.
 *
 * Supports fixed-size containers, aspect ratios, rounded images, retina images, and arbitrary children (e.g., iframe).
 *
 * The "as" prop allows rendering as "figure", "p", or "div" tags etc.
 *
 * @function
 * @param {ImageProps} props - Props for the Image component.
 * @returns {JSX.Element} The rendered image element.
 * @see {@link https://bulma.io/documentation/elements/image/ | Bulma Image documentation}
 */
export const Image: React.FC<ImageProps> = ({
  as,
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
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const imageClasses = classNames('image', className, bulmaHelperClasses, {
    [`is-${size}`]: size,
    'has-ratio': size && typeof size === 'string' && size.includes('by'),
  });

  // Default tag logic: if "as" is provided, use it.
  // If not, use <figure> for aspect ratios or children, <div> otherwise.
  let Tag: 'figure' | 'div' | 'p';
  if (as) {
    Tag = as;
  } else if (size && typeof size === 'string' && size.includes('by')) {
    Tag = 'figure';
  } else {
    Tag = 'div';
  }

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

  return (
    <Tag className={imageClasses} {...rest}>
      {content}
    </Tag>
  );
};

export default Image;
