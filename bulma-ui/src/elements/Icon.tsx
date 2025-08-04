import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

type IconLibrary = 'fa' | 'mdi' | 'ion'; // 'fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons

/**
 * Props for the Icon component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the icon.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {string} name - The icon name (without library prefix).
 * @property {IconLibrary} [library='fa'] - The icon library to use ('fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons).
 * @property {string | string[]} [libraryFeatures] - Additional library-specific classes, e.g. 'fa-lg', 'fa-spin', or ['fa-lg', 'fa-fw'].
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier for the icon.
 * @property {string} [ariaLabel='icon'] - ARIA label for accessibility (default: 'icon').
 * @property {object} [style] - Inline style object.
 */
export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  name: string; // e.g., 'star', 'account', 'home-outline'
  library?: IconLibrary; // default: 'fa'
  libraryFeatures?: string | string[]; // e.g., 'fa-lg', 'fa-spin', or ['fa-lg', 'fa-fw']
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  style?: React.CSSProperties;
}

/**
 * Gets the correct classes for the icon element based on the library and features.
 *
 * @param {IconLibrary} library - The icon library.
 * @param {string} name - The icon name.
 * @param {string | string[]} [libraryFeatures] - Additional library-specific classes.
 * @returns {string} The combined class string for the icon.
 */
function getIconClasses(
  library: IconLibrary,
  name: string,
  libraryFeatures?: string | string[]
): string {
  let baseClass = '';
  let iconClass = '';
  let features = Array.isArray(libraryFeatures)
    ? libraryFeatures
    : libraryFeatures
      ? [libraryFeatures]
      : [];

  switch (library) {
    case 'fa': {
      // Font Awesome 5/6: use 'fas', 'far', 'fab', etc. as feature, icon is 'fa-<icon>'
      // If features contains a FA style ('fas', 'far', 'fab'), use it, otherwise default to 'fas'
      const faStyle =
        features.find(f =>
          ['fas', 'far', 'fab', 'fal', 'fad', 'fat'].includes(f)
        ) || 'fas';
      baseClass = faStyle;
      iconClass = `fa-${name}`;
      features = features.filter(f => f !== faStyle);
      return [baseClass, iconClass, ...features].join(' ');
    }
    case 'mdi':
      // Material Design Icons: always 'mdi mdi-<icon>'
      baseClass = 'mdi';
      iconClass = `mdi-${name}`;
      return [baseClass, iconClass, ...features].join(' ');
    case 'ion':
      // Ionicons (v4+): 'ion' and 'ion-<icon>'
      baseClass = 'ion';
      iconClass = `ion-${name}`;
      return [baseClass, iconClass, ...features].join(' ');
    default:
      // fallback: just icon name and features
      return [name, ...features].join(' ');
  }
}

/**
 * Icon component for rendering a Bulma-styled icon container.
 *
 * Supports Bulma helper classes for styling, color, and size, and renders an <i></i> element for the icon itself.
 *
 * @function
 * @param {IconProps} props - Props for the Icon component.
 * @returns {JSX.Element} The rendered icon element.
 * @see {@link https://bulma.io/documentation/elements/icon/ | Bulma Icon documentation}
 */
export const Icon: React.FC<IconProps> = ({
  className,
  textColor,
  bgColor,
  name,
  library = 'fa', // Font Awesome is default
  libraryFeatures,
  size,
  ariaLabel = 'icon',
  style,
  ...props
}) => {
  const { classPrefix } = useConfig();

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = classPrefix ? `${classPrefix}icon` : 'icon';
  const iconContainerClasses = classNames(
    mainClass,
    {
      [`is-${size}`]: size,
    },
    bulmaHelperClasses,
    className
  );

  const iClasses = getIconClasses(library, name, libraryFeatures);

  return (
    <span
      className={iconContainerClasses}
      aria-label={ariaLabel}
      style={style}
      {...rest}
    >
      <i className={iClasses} />
    </span>
  );
};
