import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useIconLibrary } from '../helpers/Config';

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

// React 19 moved the global `JSX` namespace under the `react` module, so the
// `<ion-icon>` web-component augmentation must target `React.JSX` to take effect.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': IonIconProps;
    }
  }
}

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols'; // 'fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons Web Components, 'material-icons' = Google Material Icons, 'material-symbols' = Google Material Symbols

/**
 * Shared props for the Icon component, independent of whether a class-based `name` or a
 * custom `children` node supplies the glyph.
 */
interface IconBaseProps
  extends React.HTMLAttributes<HTMLSpanElement>, BulmaClassesProps {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the icon. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** DEPRECATED: Legacy prop, use `name` instead. */
  icon?: string; // DEPRECATED: legacy prop that should not be used
  /**
   * The icon library to use ('fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons Web Components, 'material-icons' = Google Material Icons, 'material-symbols' = Google Material Symbols). Defaults to the value set in ConfigProvider or 'fa' if not configured. Ignored when `children` supplies the glyph instead of `name`.
   * @defaultValue 'fa'
   */
  library?: IconLibrary; // defaults to ConfigProvider iconLibrary or 'fa'
  /** Icon style variant (e.g. `'solid'`, `'outlined'`, `'rounded'`). Ignored when `children` supplies the glyph instead of `name`. */
  variant?: string; // e.g., 'solid', 'outlined', 'rounded', 'sharp'
  /** Additional modifiers (e.g. `'fa-lg'`, `'fa-spin'`, `'is-size-1'`). Ignored when `children` supplies the glyph instead of `name`. */
  features?: string | string[]; // e.g., 'fa-lg', 'fa-spin', 'is-size-1'
  /** **DEPRECATED:** Use `variant` and `features` instead. */
  libraryFeatures?: string | string[]; // DEPRECATED: backward compatibility
  /** Size modifier for the icon container. */
  size?: 'small' | 'medium' | 'large';
  /**
   * ARIA label for accessibility. Applied unconditionally to the container span, so an
   * icon that never sets it still renders `aria-label="icon"`. For an icon-only control,
   * put the real `aria-label` on the control (e.g. `Button`) and set `aria-hidden` here
   * instead — otherwise the control's accessible name is announced as just "icon". For a
   * decorative icon beside visible text, set `aria-hidden` here rather than leaving the
   * default, so it doesn't add "icon" to the text's accessible name.
   * @defaultValue 'icon'
   */
  ariaLabel?: string;
  /** Inline style object. */
  style?: React.CSSProperties;
  /** Override the default `'icon'` container class (e.g., `'panel-icon'`). */
  containerClassName?: string; // Override the default 'icon' container class (e.g., 'panel-icon')
}

/**
 * Props for `Icon` rendering a class-based glyph from an icon library.
 */
export interface IconNameProps extends IconBaseProps {
  /** The icon name, with or without its library prefix (e.g. `'star'` or `'fa-star'`). Mutually exclusive with `children`. */
  name: string; // e.g., 'star', 'account', 'home-outline'
  /** A custom node (an inline SVG, a `react-icons` component, …) rendered inside the icon container in place of a class-based glyph. Mutually exclusive with `name`. */
  children?: never;
}

/**
 * Props for `Icon` rendering a custom node (an inline SVG, a `react-icons` component, a Font
 * Awesome React `<FontAwesomeIcon>`, …) in place of a class-based glyph.
 */
export interface IconChildrenProps extends IconBaseProps {
  /** The icon name, with or without its library prefix (e.g. `'star'` or `'fa-star'`). Mutually exclusive with `children`. */
  name?: undefined;
  /** A custom node (an inline SVG, a `react-icons` component, …) rendered inside the icon container in place of a class-based glyph. Mutually exclusive with `name`. */
  // `undefined` is excluded deliberately: the renderer discriminates on `children !== undefined`,
  // so `children={undefined}` would satisfy the type but fall through to the `name` path with no
  // name and render an `fa-undefined` glyph. Excluding it keeps the advertised
  // exactly-one-of-`name`-or-`children` constraint matching what actually renders.
  children: Exclude<React.ReactNode, undefined>;
}

/**
 * Props for the Icon component — a discriminated union of a class-based `name` and a custom
 * `children` node.
 */
export type IconProps = IconNameProps | IconChildrenProps;

/**
 * Strips a redundant leading library prefix from an icon name (e.g. `fa-check` -> `check`
 * for the `fa` library, `mdi-account` -> `account` for `mdi`), so `name` behaves the same
 * whether or not the caller includes the prefix. Font Awesome and Material Design Icons docs
 * conventionally refer to icons with their class prefix (`fa-check`), which otherwise gets
 * doubled by `getIconClasses` (producing `fa-fa-check`, matching no glyph).
 *
 * @param {string} name - The icon name, possibly including a redundant library prefix.
 * @param {IconLibrary} library - The icon library the name will be rendered with.
 * @returns {string} The icon name with any redundant leading library prefix removed.
 */
function stripRedundantLibraryPrefix(
  name: string,
  library: IconLibrary
): string {
  if (!name) {
    return name;
  }
  if (library === 'fa' && name.startsWith('fa-')) {
    return name.substring(3);
  }
  if (library === 'mdi' && name.startsWith('mdi-')) {
    return name.substring(4);
  }
  return name;
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
  let baseClass: string;
  let iconClass: string;
  const featureList = Array.isArray(features)
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
 * The `Icon` component is a Bulma-styled wrapper for displaying icons from various libraries (Font Awesome, Material Design Icons, Ionicons, Google Material Icons, Material Symbols, etc.).
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
  library,
  variant,
  features,
  libraryFeatures, // Deprecated but maintained for backward compatibility
  size,
  ariaLabel = 'icon',
  style,
  icon, // Capture and exclude the deprecated 'icon' prop from DOM
  color: _color, // Exclude 'color' prop if passed directly
  containerClassName,
  children,
  ...restProps
}) => {
  // Get the default icon library from context, fallback to 'fa' if not set
  const defaultLibrary = useIconLibrary();

  /**
   * Generates Bulma helper classes and separates out remaining props.
   * Note: variant, features, and libraryFeatures are excluded from props spread
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...restProps,
  });

  // Hoisted unconditionally to respect rules-of-hooks; the branches below
  // pick which result to consume.
  const defaultIconClasses = usePrefixedClassNames('icon', {
    [`is-${size}`]: size,
  });
  const sizeModifierClass = usePrefixedClassNames(
    size ? `is-${size}` : undefined
  );

  const bulmaClasses = containerClassName
    ? containerClassName
    : defaultIconClasses;

  const iconContainerClasses = classNames(
    bulmaClasses,
    containerClassName && size ? sizeModifierClass : undefined,
    bulmaHelperClasses,
    className
  );

  if (children !== undefined) {
    // `IconChildrenProps`: render the caller's node (an inline SVG, a `react-icons`
    // component, …) in place of a class-based glyph. Library/variant/features don't apply.
    return (
      <span
        className={iconContainerClasses}
        aria-label={ariaLabel}
        style={style}
        {...rest}
      >
        {children}
      </span>
    );
  }

  // `name` is guaranteed once `children` is absent (`IconProps` is a discriminated union of
  // the two, and `IconChildrenProps['children']` excludes `undefined` so `children={undefined}`
  // can't slip past into this branch) — the cast only matters for legacy callers that bypass
  // the type and rely solely on the deprecated `icon` prop below.
  let finalName = name as string;
  if (!name && icon) {
    // If icon prop is provided instead of name, try to parse it
    // e.g., "mdi mdi-rocket-launch" -> "rocket-launch"
    if (typeof icon === 'string') {
      const parts = icon.split(' ');
      const lastPart = parts[parts.length - 1];
      if (lastPart.startsWith('mdi-')) {
        finalName = lastPart.substring(4); // Remove "mdi-" prefix
      } else if (lastPart.startsWith('fa-')) {
        finalName = lastPart.substring(3); // Remove "fa-" prefix
      } else {
        finalName = lastPart;
      }
    }
  }

  const finalLibrary = library || defaultLibrary || 'fa';

  // Normalize a redundant leading library prefix (e.g. "fa-check" -> "check" when the
  // library is 'fa'), so `name` behaves identically with or without the prefix.
  finalName = stripRedundantLibraryPrefix(finalName, finalLibrary);

  if (!finalName) {
    // No glyph to name. Unreachable through the public type, but a plain-JS caller (or one
    // that casts) can land here, and building a class off an absent name produced a bogus
    // `fa-undefined` glyph. Render the bare container instead, matching the `children` branch.
    return (
      <span
        className={iconContainerClasses}
        aria-label={ariaLabel}
        style={style}
        {...rest}
      />
    );
  }

  // Backward compatibility: if libraryFeatures is provided, parse it for variant and features
  let finalVariant = variant;
  let finalFeatures = features;

  if (libraryFeatures && !variant && !features) {
    const legacyFeatures = Array.isArray(libraryFeatures)
      ? libraryFeatures
      : [libraryFeatures];

    // For Font Awesome, extract style from features
    if (finalLibrary === 'fa') {
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
    else if (
      finalLibrary === 'material-icons' ||
      finalLibrary === 'material-symbols'
    ) {
      const styleVariants =
        finalLibrary === 'material-icons'
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
  if (finalLibrary === 'ion') {
    // For Ionicons, handle variant in the name
    let ionName = finalName;
    if (finalVariant === 'outline') {
      ionName = `${finalName}-outline`;
    } else if (finalVariant === 'sharp') {
      ionName = `${finalName}-sharp`;
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
  const iClasses = getIconClasses(
    finalLibrary,
    finalName,
    finalVariant,
    finalFeatures
  );

  // Material Icons and Material Symbols use text content, not CSS classes for the icon name
  if (
    finalLibrary === 'material-icons' ||
    finalLibrary === 'material-symbols'
  ) {
    return (
      <span
        className={iconContainerClasses}
        aria-label={ariaLabel}
        style={style}
        {...rest}
      >
        <i className={iClasses}>{finalName}</i>
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
