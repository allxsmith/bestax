import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Image component.
 */
export interface ImageProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper for the container. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled variant (no `.image.is-<color>` CSS exists). Prefer
   * `textColor`, which takes precedence when both are set; use `bgColor` for
   * a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper for the container. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Fixed size or aspect ratio modifier for the image container. */
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
  /** Renders the image with rounded corners. */
  isRounded?: boolean;
  /** Uses retina (2x) image source. */
  isRetina?: boolean;
  /** Image source URL. */
  src?: string;
  /** Alternate text for the image. */
  alt?: string;
  /** Arbitrary content (e.g., iframe, custom HTML) inside the image container. */
  children?: React.ReactNode;
  /** Container element tag. Defaults to `'figure'` when using aspect-ratio sizes, `'div'` otherwise. */
  as?: 'figure' | 'div' | 'p';
}

/**
 * The `Image` component wraps images, iframes, or custom content in a Bulma-styled container, supporting fixed sizes, aspect ratios, rounded corners, retina images, and all Bulma helper props for color and spacing.
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
  color,
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
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });

  const bulmaClasses = usePrefixedClassNames('image', {
    [`is-${size}`]: size,
    'has-ratio': size && typeof size === 'string' && size.includes('by'),
  });

  const imageClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

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

  const roundedClass = usePrefixedClassNames('is-rounded');

  const content = children ? (
    children
  ) : (
    <img
      className={classNames({ [roundedClass]: isRounded })}
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
