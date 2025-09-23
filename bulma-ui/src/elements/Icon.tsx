import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

// TypeScript declaration for Ionicons web component
interface IonIconProps extends React.HTMLAttributes<HTMLElement> {
  name?: string;
  src?: string;
  icon?: unknown;
  size?: string;
  lazy?: boolean;
  sanitize?: boolean;
  color?: string;
  flipRtl?: boolean;
  ariaLabel?: string;
  ariaHidden?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': IonIconProps;
    }
  }
}

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols'; // 'fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons Web Components, 'material-icons' = Google Material Icons, 'material-symbols' = Google Material Symbols

/**
 * Props for the Icon component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the icon.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {string} name - The icon name (without library prefix).
 * @property {IconLibrary} [library='fa'] - The icon library to use ('fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons Web Components, 'material-icons' = Google Material Icons, 'material-symbols' = Google Material Symbols).
 * @property {string} [variant] - Icon style variant. For Font Awesome: 'solid', 'regular', 'brands', etc. For Material Icons: 'filled', 'outlined', 'round', 'sharp'. For Material Symbols: 'outlined', 'rounded', 'sharp'. For Ionicons: 'outline', 'sharp'.
 * @property {string | string[]} [features] - Additional library-specific modifiers. For Font Awesome: 'fa-lg', 'fa-spin', etc. For others: size classes like 'is-size-1', etc.
 * @property {string | string[]} [libraryFeatures] - DEPRECATED: Use 'variant' and 'features' instead. Additional library-specific classes.
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
  variant?: string; // e.g., 'solid', 'outlined', 'rounded', 'sharp'
  features?: string | string[]; // e.g., 'fa-lg', 'fa-spin', 'is-size-1'
  libraryFeatures?: string | string[]; // DEPRECATED: backward compatibility
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  style?: React.CSSProperties;
}

/**
 * Gets the correct classes for the icon element based on the library and features.
 *
 * @param {IconLibrary} library - The icon library.
 * @param {string} name - The icon name.
 * @param {string} [variant] - Icon style variant (e.g., 'solid', 'outlined', 'rounded').
 * @param {string | string[]} [features] - Additional library-specific modifiers.
 * @returns {string} The combined class string for the icon.
 */
function getIconClasses(
  library: IconLibrary,
  name: string,
  variant?: string,
  features?: string | string[]
): string {
  let baseClass = '';
  let iconClass = '';
  let featureList = Array.isArray(features)
    ? features
    : features
      ? [features]
      : [];

  switch (library) {
    case 'fa': {
      // Font Awesome: use variant as style ('solid' -> 'fas', 'regular' -> 'far', etc.)
      const styleMap: Record<string, string> = {
        solid: 'fas',
        regular: 'far',
        brands: 'fab',
        light: 'fal',
        duotone: 'fad',
        thin: 'fat',
      };
      const faStyle = variant ? styleMap[variant] || variant : 'fas';
      baseClass = faStyle;
      iconClass = `fa-${name}`;
      return [baseClass, iconClass, ...featureList].join(' ');
    }
    case 'mdi':
      // Material Design Icons: no variants, just features
      baseClass = 'mdi';
      iconClass = `mdi-${name}`;
      return [baseClass, iconClass, ...featureList].join(' ');
    case 'material-icons': {
      // Google Material Icons: map variants to full class names
      const styleVariants: Record<string, string> = {
        filled: 'material-icons',
        outlined: 'material-icons-outlined',
        round: 'material-icons-round',
        sharp: 'material-icons-sharp',
      };
      baseClass = variant
        ? styleVariants[variant] || `material-icons-${variant}`
        : 'material-icons';
      return [baseClass, ...featureList].join(' ');
    }
    case 'material-symbols': {
      // Google Material Symbols: map variants to full class names
      const styleVariants: Record<string, string> = {
        outlined: 'material-symbols-outlined',
        rounded: 'material-symbols-rounded',
        sharp: 'material-symbols-sharp',
      };
      baseClass = variant
        ? styleVariants[variant] || `material-symbols-${variant}`
        : 'material-symbols-outlined';
      return [baseClass, ...featureList].join(' ');
    }
    default:
      // fallback: just icon name and features
      return [name, ...featureList].join(' ');
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
  variant,
  features,
  libraryFeatures, // Deprecated but maintained for backward compatibility
  size,
  ariaLabel = 'icon',
  style,
  ...restProps
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   * Note: variant, features, and libraryFeatures are excluded from props spread
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...restProps,
  });

  const bulmaClasses = usePrefixedClassNames('icon', {
    [`is-${size}`]: size,
  });

  const iconContainerClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  // Backward compatibility: if libraryFeatures is provided, parse it for variant and features
  let finalVariant = variant;
  let finalFeatures = features;

  if (libraryFeatures && !variant && !features) {
    const legacyFeatures = Array.isArray(libraryFeatures)
      ? libraryFeatures
      : [libraryFeatures];

    // For Font Awesome, extract style from features
    if (library === 'fa') {
      const faStyle = legacyFeatures.find(f =>
        [
          'fas',
          'far',
          'fab',
          'fal',
          'fad',
          'fat',
          'solid',
          'regular',
          'brands',
          'light',
          'duotone',
          'thin',
        ].includes(f)
      );
      if (faStyle) {
        finalVariant = faStyle;
        finalFeatures = legacyFeatures.filter(f => f !== faStyle);
      } else {
        finalFeatures = legacyFeatures;
      }
    }
    // For Material Icons/Symbols, extract style variant
    else if (library === 'material-icons' || library === 'material-symbols') {
      const styleVariants =
        library === 'material-icons'
          ? ['filled', 'outlined', 'round', 'sharp']
          : ['outlined', 'rounded', 'sharp'];

      const styleVariant = legacyFeatures.find(f => styleVariants.includes(f));
      if (styleVariant) {
        finalVariant = styleVariant;
        finalFeatures = legacyFeatures.filter(f => f !== styleVariant);
      } else {
        finalFeatures = legacyFeatures;
      }
    }
    // For others, all features go to finalFeatures
    else {
      finalFeatures = legacyFeatures;
    }
  }

  // Handle web components vs CSS-based icons
  if (library === 'ion') {
    // For Ionicons, handle variant in the name
    let ionName = name;
    if (finalVariant === 'outline') {
      ionName = `${name}-outline`;
    } else if (finalVariant === 'sharp') {
      ionName = `${name}-sharp`;
    }

    return (
      <span
        className={iconContainerClasses}
        aria-label={ariaLabel}
        style={style}
        {...rest}
      >
        <ion-icon name={ionName} />
      </span>
    );
  }

  // Legacy CSS-based icons
  const iClasses = getIconClasses(library, name, finalVariant, finalFeatures);

  // Material Icons and Material Symbols use text content, not CSS classes for the icon name
  if (library === 'material-icons' || library === 'material-symbols') {
    return (
      <span
        className={iconContainerClasses}
        aria-label={ariaLabel}
        style={style}
        {...rest}
      >
        <i className={iClasses}>{name}</i>
      </span>
    );
  }

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
