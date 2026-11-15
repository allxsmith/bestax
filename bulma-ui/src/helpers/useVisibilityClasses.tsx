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
  /**
   * Hides the element. `'hidden'` takes it off the page, `'invisible'` hides it
   * and keeps its space, and `'sr-only'` (screen reader only) hides it visually
   * while screen readers still read it. `'hidden'` writes Bulma's
   * `is-hidden`, which comes before the display classes in Bulma's
   * stylesheet, so beside a display prop such as `display="flex"` or
   * `displayTablet="flex"` the element shows wherever that display applies.
   * To hide it there, set the display prop to `'none'` instead.
   */
  visibility?: (typeof validVisibilities)[number];
  /** Visibility on mobile, up to 768px. */
  visibilityMobile?: (typeof validVisibilities)[number];
  /**
   * Visibility from 769px up: on tablets and every larger screen. `'hidden'`
   * here wins over any display prop for a larger screen. Use
   * `visibilityTabletOnly` in its place for tablets alone.
   */
  visibilityTablet?: (typeof validVisibilities)[number];
  /** Visibility on tablets alone, 769px to 1023px. */
  visibilityTabletOnly?: (typeof validVisibilities)[number];
  /** Visibility up to 1023px, on mobile and tablets. */
  visibilityTouch?: (typeof validVisibilities)[number];
  /**
   * Visibility from 1024px up. Use `visibilityDesktopOnly` in its place for
   * 1024px to 1215px alone.
   */
  visibilityDesktop?: (typeof validVisibilities)[number];
  /** Visibility from 1024px to 1215px alone. */
  visibilityDesktopOnly?: (typeof validVisibilities)[number];
  /**
   * Visibility from 1216px up. Use `visibilityWidescreenOnly` in its place for
   * 1216px to 1407px alone.
   */
  visibilityWidescreen?: (typeof validVisibilities)[number];
  /** Visibility from 1216px to 1407px alone. */
  visibilityWidescreenOnly?: (typeof validVisibilities)[number];
  /** Visibility from 1408px up. */
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
    visibilityTabletOnly,
    visibilityTouch,
    visibilityDesktop,
    visibilityDesktopOnly,
    visibilityWidescreen,
    visibilityWidescreenOnly,
    visibilityFullhd,
    display,
    displayMobile,
    displayTablet,
    displayTabletOnly,
    displayTouch,
    displayDesktop,
    displayDesktopOnly,
    displayWidescreen,
    displayWidescreenOnly,
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
    addViewportSpecificVisibilityClass(visibilityTabletOnly, '-tablet-only');
    addViewportSpecificVisibilityClass(visibilityTouch, '-touch');
    addViewportSpecificVisibilityClass(visibilityDesktop, '-desktop');
    addViewportSpecificVisibilityClass(visibilityDesktopOnly, '-desktop-only');
    addViewportSpecificVisibilityClass(visibilityWidescreen, '-widescreen');
    addViewportSpecificVisibilityClass(
      visibilityWidescreenOnly,
      '-widescreen-only'
    );
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
    addDisplayClass(displayTabletOnly, '-tablet-only');
    addDisplayClass(displayTouch, '-touch');
    addDisplayClass(displayDesktop, '-desktop');
    addDisplayClass(displayDesktopOnly, '-desktop-only');
    addDisplayClass(displayWidescreen, '-widescreen');
    addDisplayClass(displayWidescreenOnly, '-widescreen-only');
    addDisplayClass(displayFullhd, '-fullhd');

    // Apply legacy display/viewport combination if no viewport-specific display props are set
    const hasViewportSpecificDisplay = !!(
      displayMobile ||
      displayTablet ||
      displayTabletOnly ||
      displayTouch ||
      displayDesktop ||
      displayDesktopOnly ||
      displayWidescreen ||
      displayWidescreenOnly ||
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
    visibilityTabletOnly,
    visibilityTouch,
    visibilityDesktop,
    visibilityDesktopOnly,
    visibilityWidescreen,
    visibilityWidescreenOnly,
    visibilityFullhd,
    display,
    displayMobile,
    displayTablet,
    displayTabletOnly,
    displayTouch,
    displayDesktop,
    displayDesktopOnly,
    displayWidescreen,
    displayWidescreenOnly,
    displayFullhd,
    viewport,
  ]);
};
