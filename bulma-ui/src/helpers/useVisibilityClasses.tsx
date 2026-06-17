import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  validDisplays,
  validVisibilities,
  validViewports,
  BulmaViewportProps,
  BulmaDisplayProps,
} from './bulmaClassHelpers';

/**
 * Props for applying Bulma visibility and display helper classes.
 */
export interface BulmaVisibilityProps
  extends BulmaViewportProps, BulmaDisplayProps {
  /** Visibility (e.g., 'hidden', 'sr-only'). */
  visibility?: (typeof validVisibilities)[number];
  /** Visibility for mobile viewport (up to 768px). */
  visibilityMobile?: (typeof validVisibilities)[number];
  /** Visibility for tablet viewport (769px - 1023px). */
  visibilityTablet?: (typeof validVisibilities)[number];
  /** Visibility for desktop viewport (1024px - 1215px). */
  visibilityDesktop?: (typeof validVisibilities)[number];
  /** Visibility for widescreen viewport (1216px - 1407px). */
  visibilityWidescreen?: (typeof validVisibilities)[number];
  /** Visibility for fullhd viewport (1408px and above). */
  visibilityFullhd?: (typeof validVisibilities)[number];
}

/**
 * A hook that generates Bulma visibility and display helper classes. This hook
 * owns all display class emission, including viewport-specific display props,
 * the legacy display/viewport combination, and `display: 'none'` mapping to
 * `is-hidden`.
 *
 * @function useVisibilityClasses
 * @param props - Visibility- and display-related Bulma helper props.
 * @returns A space-separated string of visibility and display helper classes.
 * @example
 * const visibilityClasses = useVisibilityClasses({
 *   display: 'flex',
 *   visibilityMobile: 'hidden',
 * });
 * // visibilityClasses: 'is-hidden-mobile is-flex'
 */
export const useVisibilityClasses = (props: BulmaVisibilityProps): string => {
  const { classPrefix } = useConfig();

  const {
    visibility,
    visibilityMobile,
    visibilityTablet,
    visibilityDesktop,
    visibilityWidescreen,
    visibilityFullhd,
    display,
    displayMobile,
    displayTablet,
    displayDesktop,
    displayWidescreen,
    displayFullhd,
    viewport,
  } = props;

  return useMemo(() => {
    const { classes, addPrefixedClass, addClass } = createBulmaClassHelpers(
      classPrefix,
      viewport
    );

    // Viewport-specific visibility
    const addViewportSpecificVisibilityClass = (
      value: string | undefined,
      viewportSuffix: string
    ) => {
      if (value === 'hidden') {
        addPrefixedClass(`is-hidden${viewportSuffix}`);
      } else if (value === 'sr-only') {
        addPrefixedClass(`is-sr-only${viewportSuffix}`);
      } else if (value === 'invisible') {
        addPrefixedClass(`is-invisible${viewportSuffix}`);
      }
    };

    addViewportSpecificVisibilityClass(visibilityMobile, '-mobile');
    addViewportSpecificVisibilityClass(visibilityTablet, '-tablet');
    addViewportSpecificVisibilityClass(visibilityDesktop, '-desktop');
    addViewportSpecificVisibilityClass(visibilityWidescreen, '-widescreen');
    addViewportSpecificVisibilityClass(visibilityFullhd, '-fullhd');

    // Visibility and Display
    // Handle viewport-specific display properties first (they take precedence)
    const addDisplayClass = (
      displayValue: string | undefined,
      viewportSuffix: string
    ) => {
      if (displayValue) {
        if (displayValue === 'none') {
          addPrefixedClass(`is-hidden${viewportSuffix}`);
        } else if (
          (validDisplays as readonly string[]).includes(displayValue)
        ) {
          addPrefixedClass(`is-${displayValue}${viewportSuffix}`);
        }
      }
    };

    // Apply viewport-specific display classes
    addDisplayClass(displayMobile, '-mobile');
    addDisplayClass(displayTablet, '-tablet');
    addDisplayClass(displayDesktop, '-desktop');
    addDisplayClass(displayWidescreen, '-widescreen');
    addDisplayClass(displayFullhd, '-fullhd');

    // Apply legacy display/viewport combination if no viewport-specific display props are set
    const hasViewportSpecificDisplay = !!(
      displayMobile ||
      displayTablet ||
      displayDesktop ||
      displayWidescreen ||
      displayFullhd
    );

    if (!hasViewportSpecificDisplay) {
      // Legacy display handling
      if (display === 'none') {
        if (viewport && validViewports.includes(viewport)) {
          addPrefixedClass(`is-hidden-${viewport}`);
        } else {
          addPrefixedClass('is-hidden');
        }
      } else {
        addClass('is', display, [...validDisplays], true); // display supports viewport
      }
    }

    // Visibility (always applied regardless of display settings)
    if (visibility) {
      if (
        (visibility === 'hidden' || visibility === 'invisible') &&
        viewport &&
        validViewports.includes(viewport)
      ) {
        addPrefixedClass(`is-${visibility}-${viewport}`);
      } else if (validVisibilities.includes(visibility)) {
        addPrefixedClass(`is-${visibility}`);
      }
    }

    return classNames(classes);
  }, [
    classPrefix,
    visibility,
    visibilityMobile,
    visibilityTablet,
    visibilityDesktop,
    visibilityWidescreen,
    visibilityFullhd,
    display,
    displayMobile,
    displayTablet,
    displayDesktop,
    displayWidescreen,
    displayFullhd,
    viewport,
  ]);
};
