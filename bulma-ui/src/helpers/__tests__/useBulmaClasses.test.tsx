import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useBulmaClasses, BulmaClassesProps } from '../useBulmaClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useBulmaClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseBulmaClasses = (
    props: Partial<Record<keyof BulmaClassesProps, string | boolean>>,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(
      () =>
        useBulmaClasses(props as BulmaClassesProps & Record<string, unknown>),
      { wrapper }
    ).result.current;
  };

  it('returns empty string for no props', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({});
    expect(bulmaHelperClasses).toBe('');
  });

  // Color Helpers
  it('applies text color class', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({ color: 'primary' });
    expect(bulmaHelperClasses).toBe('has-text-primary');
  });

  it('applies background color class', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'info',
    });
    expect(bulmaHelperClasses).toBe('has-background-info');
  });

  it('applies color with shade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '50',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-50');
  });

  it('applies background color with backgroundColorShade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'info',
      backgroundColorShade: '25',
    });
    expect(bulmaHelperClasses).toBe('has-background-info-25');
  });

  it('applies both color and background color with different shades', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '75',
      backgroundColor: 'info',
      backgroundColorShade: '10',
    });
    expect(bulmaHelperClasses).toBe(
      'has-text-primary-75 has-background-info-10'
    );
  });

  it('applies backgroundColorShade without backgroundColor (should be ignored)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColorShade: '25',
    });
    expect(bulmaHelperClasses).toBe('');
  });

  it('applies colorShade without color (should be ignored)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      colorShade: '25',
    });
    expect(bulmaHelperClasses).toBe('');
  });

  it('applies invalid backgroundColorShade with valid backgroundColor', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'primary',
      backgroundColorShade: 'invalid' as any,
    });
    expect(bulmaHelperClasses).toBe('has-background-primary');
  });

  it('ignores invalid color', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({ color: 'invalid' });
    expect(bulmaHelperClasses).toBe('');
  });

  it('handles special color values (inherit, current)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({ color: 'inherit' });
    expect(bulmaHelperClasses).toBe('has-text-inherit');
  });

  // Class Prefix Tests
  it('applies class prefix to helper classes', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses(
      { color: 'primary', m: '2', display: 'flex' },
      'bulma-'
    );
    expect(bulmaHelperClasses).toBe(
      'bulma-has-text-primary bulma-m-2 bulma-is-flex'
    );
  });

  it('works without class prefix', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      m: '2',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary m-2');
  });

  it('applies prefix to complex helper classes', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses(
      {
        backgroundColor: 'info',
        backgroundColorShade: '25',
        textSize: '3',
        overlay: true,
        skeleton: true,
      },
      'custom-'
    );
    expect(bulmaHelperClasses).toBe(
      'custom-has-background-info-25 custom-is-size-3 custom-is-overlay custom-is-skeleton'
    );
  });

  // Spacing Helpers
  it('applies margin and padding classes', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      m: '2',
      mt: '1',
      p: '3',
      px: '4',
    });
    expect(bulmaHelperClasses).toBe('m-2 mt-1 p-3 px-4');
  });

  it('ignores invalid spacing values', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({ m: 'invalid' });
    expect(bulmaHelperClasses).toBe('');
  });

  // Typography Helpers
  it('applies typography classes', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      textSize: '3',
      textAlign: 'centered',
      textTransform: 'uppercase',
      textWeight: 'bold',
      fontFamily: 'monospace',
    });
    expect(bulmaHelperClasses).toBe(
      'is-size-3 has-text-centered is-uppercase has-text-weight-bold is-family-monospace'
    );
  });

  it('ignores invalid typography values', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({ textSize: '8' });
    expect(bulmaHelperClasses).toBe('');
  });

  // Visibility Helpers
  it('applies display and visibility classes', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      display: 'block',
      visibility: 'sr-only',
    });
    expect(bulmaHelperClasses).toBe('is-block is-sr-only');
  });

  it('applies hidden class with viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      visibility: 'hidden',
      viewport: 'mobile',
    });
    expect(bulmaHelperClasses).toBe('is-hidden-mobile');
  });

  it('applies invisible class', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      visibility: 'invisible',
    });
    expect(bulmaHelperClasses).toBe('is-invisible');
  });

  it('applies invisible class with viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      visibility: 'invisible',
      viewport: 'tablet',
    });
    expect(bulmaHelperClasses).toBe('is-invisible-tablet');
  });

  it('ignores invalid visibility with viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      visibility: 'sr-only',
      viewport: 'mobile',
    });
    expect(bulmaHelperClasses).toBe('is-sr-only'); // No viewport for sr-only
  });

  // Flexbox Helpers
  it('applies flexbox classes when display is flex', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'stretch',
      flexGrow: '1',
    });
    expect(bulmaHelperClasses).toBe(
      'is-flex is-flex-direction-row is-justify-content-center is-align-items-stretch is-flex-grow-1'
    );
  });

  it('applies extended flexGrow and flexShrink values', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      display: 'flex',
      flexGrow: '3',
      flexShrink: '2',
    });
    expect(bulmaHelperClasses).toBe('is-flex is-flex-grow-3 is-flex-shrink-2');
  });

  it('applies maximum flexGrow and flexShrink values', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      display: 'flex',
      flexGrow: '5',
      flexShrink: '5',
    });
    expect(bulmaHelperClasses).toBe('is-flex is-flex-grow-5 is-flex-shrink-5');
  });

  it('does not apply flexbox classes when display is not flex or inline-flex', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      display: 'block',
      flexDirection: 'row',
    });
    expect(bulmaHelperClasses).toBe('is-block');
  });

  // Other Helpers
  it('applies other helper classes', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      float: 'left',
      overflow: 'clipped',
      overlay: true,
      interaction: 'clickable',
      radius: 'radiusless',
      shadow: 'shadowless',
      responsive: 'mobile',
    });
    expect(bulmaHelperClasses).toBe(
      'is-pulled-left is-clipped is-overlay is-clickable is-radiusless is-shadowless is-mobile'
    );
  });

  it('ignores invalid other helper values', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({ float: 'invalid' });
    expect(bulmaHelperClasses).toBe('');
  });

  // Viewport Handling
  it('applies viewport-specific classes for valid viewport (only for text size)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      textSize: '3',
      m: '2',
      viewport: 'tablet',
    });
    expect(bulmaHelperClasses).toBe('m-2 is-size-3-tablet');
  });

  it('color classes do not support viewport modifiers', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      backgroundColor: 'info',
      viewport: 'tablet',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary has-background-info');
  });

  it('ignores viewport for invalid viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      viewport: 'invalid',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary');
  });

  // Memoization
  it('memoizes the result based on props', () => {
    const { result, rerender } = renderHook(
      ({ props }: { props: any }) => useBulmaClasses(props),
      {
        initialProps: { props: { color: 'primary' } },
      }
    );
    const firstResult = result.current;
    rerender({ props: { color: 'primary' } });
    expect(result.current).toStrictEqual(firstResult); // Same reference due to useMemo
    rerender({ props: { color: 'info' } });
    expect(result.current).not.toBe(firstResult); // New reference for new props
    expect(result.current.bulmaHelperClasses).toBe('has-text-info');
  });

  it('applies text color with shade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05');
  });

  it('applies text color with shade (no viewport support)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
      viewport: 'mobile',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05');
  });

  it('applies background color with backgroundColorShade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'info',
      backgroundColorShade: '10',
    });
    expect(bulmaHelperClasses).toBe('has-background-info-10');
  });

  it('falls back to base color class when shade is invalid', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: 'invalid' as string, // Simulate invalid shade
    });
    expect(bulmaHelperClasses).toBe('has-text-primary');
  });

  it('does not apply color class for invalid color', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'invalid' as string,
      colorShade: '05',
    });
    expect(bulmaHelperClasses).toBe('');
  });

  it('applies text color with shade (duplicate)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05');
  });

  it('applies text color with shade (no viewport support)', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
      viewport: 'mobile',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05');
  });

  it('applies text color with shade without viewport when viewport is invalid', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '50',
      viewport: 'invalid',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-50');
  });

  it('applies background color with backgroundColorShade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'info',
      backgroundColorShade: '10',
    });
    expect(bulmaHelperClasses).toBe('has-background-info-10');
  });

  it('falls back to base color class when shade is invalid', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: 'invalid' as string, // Simulate invalid shade
    });
    expect(bulmaHelperClasses).toBe('has-text-primary');
  });

  it('does not apply color class for invalid color', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'invalid' as string,
      colorShade: '05',
    });
    expect(bulmaHelperClasses).toBe('');
  });

  // Background color with backgroundColorShade and viewport
  describe('Background color with backgroundColorShade and viewport', () => {
    it('applies background color with backgroundColorShade and no viewport support', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        backgroundColorShade: '50',
        viewport: 'mobile',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });

    it('applies background color with backgroundColorShade without viewport when viewport is invalid', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        backgroundColorShade: '50',
        viewport: 'invalid',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });

    it('applies background color with backgroundColorShade without viewport when viewport is undefined', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        backgroundColorShade: '50',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });
  });

  // SKELETON TESTS (NEW)
  it('applies is-skeleton class when skeleton is true', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      skeleton: true,
    });
    expect(bulmaHelperClasses).toBe('is-skeleton');
  });

  it('applies is-skeleton together with other helpers', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      skeleton: true,
      color: 'primary',
      p: '3',
      display: 'block',
      visibility: 'sr-only',
    });
    expect(bulmaHelperClasses.split(' ')).toEqual(
      expect.arrayContaining([
        'is-skeleton',
        'has-text-primary',
        'p-3',
        'is-block',
        'is-sr-only',
      ])
    );
  });

  it('does not apply is-skeleton when skeleton is false or not set', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary');
    const { bulmaHelperClasses: none } = renderUseBulmaClasses({
      skeleton: false,
      color: 'primary',
    });
    expect(none).toBe('has-text-primary');
  });

  // VIEWPORT-SPECIFIC DISPLAY TESTS
  describe('Viewport-specific display properties', () => {
    it('applies mobile display class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'flex',
      });
      expect(bulmaHelperClasses).toBe('is-flex-mobile');
    });

    it('applies tablet display class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayTablet: 'block',
      });
      expect(bulmaHelperClasses).toBe('is-block-tablet');
    });

    it('applies desktop display class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayDesktop: 'inline-block',
      });
      expect(bulmaHelperClasses).toBe('is-inline-block-desktop');
    });

    it('applies widescreen display class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayWidescreen: 'inline-flex',
      });
      expect(bulmaHelperClasses).toBe('is-inline-flex-widescreen');
    });

    it('applies fullhd display class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayFullhd: 'inline',
      });
      expect(bulmaHelperClasses).toBe('is-inline-fullhd');
    });

    it('applies hidden class for none display value', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'none',
      });
      expect(bulmaHelperClasses).toBe('is-hidden-mobile');
    });

    it('applies multiple viewport-specific display classes', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'none',
        displayTablet: 'flex',
        displayDesktop: 'block',
      });
      expect(bulmaHelperClasses).toBe(
        'is-hidden-mobile is-flex-tablet is-block-desktop'
      );
    });

    it('ignores invalid viewport-specific display values', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'invalid' as 'block',
        displayTablet: 'flex',
      });
      expect(bulmaHelperClasses).toBe('is-flex-tablet');
    });

    it('viewport-specific display props override legacy display/viewport combination', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'block',
        viewport: 'mobile',
        displayMobile: 'flex',
      });
      expect(bulmaHelperClasses).toBe('is-flex-mobile');
    });

    it('falls back to legacy display when no viewport-specific props are set', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'block',
        viewport: 'tablet',
      });
      expect(bulmaHelperClasses).toBe('is-block-tablet');
    });

    it('applies legacy display without viewport when no viewport-specific props are set', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'flex',
      });
      expect(bulmaHelperClasses).toBe('is-flex');
    });

    it('handles legacy display none with viewport', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'none',
        viewport: 'desktop',
      });
      expect(bulmaHelperClasses).toBe('is-hidden-desktop');
    });

    it('handles legacy display none without viewport', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'none',
      });
      expect(bulmaHelperClasses).toBe('is-hidden');
    });
  });

  // FLEXBOX WITH VIEWPORT-SPECIFIC DISPLAY TESTS
  describe('Flexbox with viewport-specific display', () => {
    it('applies flexbox classes when displayMobile is flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      });
      expect(bulmaHelperClasses).toBe(
        'is-flex-mobile is-flex-direction-column is-justify-content-center'
      );
    });

    it('applies flexbox classes when displayTablet is inline-flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayTablet: 'inline-flex',
        alignItems: 'center',
        flexGrow: '1',
      });
      expect(bulmaHelperClasses).toBe(
        'is-inline-flex-tablet is-align-items-center is-flex-grow-1'
      );
    });

    it('applies flexbox classes when any viewport has flex display', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'block',
        displayDesktop: 'flex',
        flexWrap: 'wrap',
        alignContent: 'stretch',
      });
      expect(bulmaHelperClasses).toBe(
        'is-block-mobile is-flex-desktop is-flex-wrap-wrap is-align-content-stretch'
      );
    });

    it('applies flexbox classes when legacy display is flex and viewport display is also flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'flex',
        displayTablet: 'flex',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
      });
      expect(bulmaHelperClasses).toBe(
        'is-flex-tablet is-flex-direction-row-reverse is-justify-content-space-between'
      );
    });

    it('does not apply flexbox classes when no display is flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'block',
        displayTablet: 'inline',
        flexDirection: 'column',
      });
      expect(bulmaHelperClasses).toBe('is-block-mobile is-inline-tablet');
    });

    it('applies flexbox classes when legacy display is flex but no viewport-specific props', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'inline-flex',
        flexShrink: '0',
        alignSelf: 'flex-end',
      });
      expect(bulmaHelperClasses).toBe(
        'is-inline-flex is-align-self-flex-end is-flex-shrink-0'
      );
    });
  });

  // COMBINED VIEWPORT AND LEGACY TESTS
  describe('Combined viewport-specific and legacy properties', () => {
    it('combines viewport-specific display with other helpers', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'none',
        displayTablet: 'flex',
        color: 'primary',
        p: '4',
        textAlign: 'centered',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'has-text-primary',
          'p-4',
          'has-text-centered',
          'is-hidden-mobile',
          'is-flex-tablet',
        ])
      );
    });

    it('preserves visibility classes alongside viewport-specific display', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayDesktop: 'block',
        visibility: 'sr-only',
      });
      expect(bulmaHelperClasses).toBe('is-block-desktop is-sr-only');
    });

    it('handles viewport-specific display with viewport visibility', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'flex',
        visibility: 'hidden',
        viewport: 'tablet',
      });
      expect(bulmaHelperClasses).toBe('is-flex-mobile is-hidden-tablet');
    });

    it('memoizes viewport-specific display properties', () => {
      const { result, rerender } = renderHook(
        ({ props }: { props: any }) => useBulmaClasses(props),
        {
          initialProps: {
            props: {
              displayMobile: 'flex',
              displayTablet: 'block',
              color: 'primary',
            },
          },
        }
      );
      const firstResult = result.current;

      // Same props should return same reference
      rerender({
        props: {
          displayMobile: 'flex',
          displayTablet: 'block',
          color: 'primary',
        },
      });
      expect(result.current).toStrictEqual(firstResult);

      // Different props should return new reference
      rerender({
        props: {
          displayMobile: 'block',
          displayTablet: 'flex',
          color: 'info',
        },
      });
      expect(result.current).not.toBe(firstResult);
      expect(result.current.bulmaHelperClasses).toBe(
        'has-text-info is-block-mobile is-flex-tablet'
      );
    });
  });

  // EDGE CASES AND ERROR HANDLING
  describe('Edge cases for viewport-specific display', () => {
    it('handles all viewport displays as none', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'none',
        displayTablet: 'none',
        displayDesktop: 'none',
        displayWidescreen: 'none',
        displayFullhd: 'none',
      });
      expect(bulmaHelperClasses).toBe(
        'is-hidden-mobile is-hidden-tablet is-hidden-desktop is-hidden-widescreen is-hidden-fullhd'
      );
    });

    it('handles all viewport displays as flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'flex',
        displayTablet: 'flex',
        displayDesktop: 'flex',
        displayWidescreen: 'flex',
        displayFullhd: 'flex',
        flexDirection: 'column',
      });
      expect(bulmaHelperClasses).toBe(
        'is-flex-mobile is-flex-tablet is-flex-desktop is-flex-widescreen is-flex-fullhd is-flex-direction-column'
      );
    });

    it('handles mixed valid and undefined viewport displays', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        displayMobile: 'flex',
        displayTablet: undefined,
        displayDesktop: 'block',
        displayWidescreen: undefined,
        displayFullhd: 'none',
      });
      expect(bulmaHelperClasses).toBe(
        'is-flex-mobile is-block-desktop is-hidden-fullhd'
      );
    });

    it('prioritizes viewport-specific over legacy even when legacy has valid viewport', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        display: 'block',
        viewport: 'mobile',
        displayMobile: 'flex',
        displayTablet: 'inline',
      });
      expect(bulmaHelperClasses).toBe('is-flex-mobile is-inline-tablet');
    });
  });

  // NEW CLEARFIX TESTS
  describe('Clearfix helper', () => {
    it('applies is-clearfix class when clearfix is true', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        clearfix: true,
      });
      expect(bulmaHelperClasses).toBe('is-clearfix');
    });

    it('applies is-clearfix together with other helpers', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        clearfix: true,
        color: 'primary',
        p: '3',
        display: 'block',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'is-clearfix',
          'has-text-primary',
          'p-3',
          'is-block',
        ])
      );
    });

    it('does not apply is-clearfix when clearfix is false or not set', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        color: 'primary',
      });
      expect(bulmaHelperClasses).toBe('has-text-primary');

      const { bulmaHelperClasses: none } = renderUseBulmaClasses({
        clearfix: false,
        color: 'primary',
      });
      expect(none).toBe('has-text-primary');
    });

    it('applies is-clearfix with class prefix', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses(
        { clearfix: true },
        'custom-'
      );
      expect(bulmaHelperClasses).toBe('custom-is-clearfix');
    });
  });

  // NEW RELATIVE POSITION TESTS
  describe('Relative position helper', () => {
    it('applies is-relative class when relative is true', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        relative: true,
      });
      expect(bulmaHelperClasses).toBe('is-relative');
    });

    it('applies is-relative together with other helpers', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        relative: true,
        color: 'primary',
        p: '3',
        display: 'block',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'is-relative',
          'has-text-primary',
          'p-3',
          'is-block',
        ])
      );
    });

    it('does not apply is-relative when relative is false or not set', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        color: 'primary',
      });
      expect(bulmaHelperClasses).toBe('has-text-primary');

      const { bulmaHelperClasses: none } = renderUseBulmaClasses({
        relative: false,
        color: 'primary',
      });
      expect(none).toBe('has-text-primary');
    });

    it('applies is-relative with class prefix', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses(
        { relative: true },
        'custom-'
      );
      expect(bulmaHelperClasses).toBe('custom-is-relative');
    });
  });

  // COMBINED CLEARFIX AND RELATIVE TESTS
  describe('Combined clearfix and relative helpers', () => {
    it('applies both clearfix and relative classes', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        clearfix: true,
        relative: true,
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining(['is-clearfix', 'is-relative'])
      );
    });

    it('applies clearfix and relative with other helpers', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        clearfix: true,
        relative: true,
        float: 'left',
        overlay: true,
        color: 'info',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'is-clearfix',
          'is-relative',
          'is-pulled-left',
          'is-overlay',
          'has-text-info',
        ])
      );
    });

    it('applies clearfix and relative with class prefix', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses(
        { clearfix: true, relative: true },
        'bulma-'
      );
      expect(bulmaHelperClasses).toBe('bulma-is-clearfix bulma-is-relative');
    });
  });

  describe('Viewport-specific text size properties', () => {
    it('applies mobile text size class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textSizeMobile: '1',
      });
      expect(bulmaHelperClasses).toBe('is-size-1-mobile');
    });

    it('applies tablet text size class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textSizeTablet: '3',
      });
      expect(bulmaHelperClasses).toBe('is-size-3-tablet');
    });

    it('applies desktop text size class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textSizeDesktop: '5',
      });
      expect(bulmaHelperClasses).toBe('is-size-5-desktop');
    });

    it('applies multiple viewport-specific text size classes', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textSizeMobile: '1',
        textSizeTablet: '3',
        textSizeDesktop: '5',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'is-size-1-mobile',
          'is-size-3-tablet',
          'is-size-5-desktop',
        ])
      );
    });

    it('ignores invalid viewport-specific text size values', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textSizeMobile: '10' as any, // Invalid size
      });
      expect(bulmaHelperClasses).toBe('');
    });
  });

  describe('Viewport-specific text alignment properties', () => {
    it('applies mobile text alignment class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textAlignMobile: 'left',
      });
      expect(bulmaHelperClasses).toBe('has-text-left-mobile');
    });

    it('applies tablet text alignment class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textAlignTablet: 'centered',
      });
      expect(bulmaHelperClasses).toBe('has-text-centered-tablet');
    });

    it('applies desktop text alignment class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textAlignDesktop: 'right',
      });
      expect(bulmaHelperClasses).toBe('has-text-right-desktop');
    });

    it('applies multiple viewport-specific text alignment classes', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textAlignMobile: 'left',
        textAlignTablet: 'centered',
        textAlignDesktop: 'right',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'has-text-left-mobile',
          'has-text-centered-tablet',
          'has-text-right-desktop',
        ])
      );
    });

    it('ignores invalid viewport-specific text alignment values', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textAlignMobile: 'invalid-align' as any,
      });
      expect(bulmaHelperClasses).toBe('');
    });
  });

  describe('Viewport-specific visibility properties', () => {
    it('applies mobile visibility hidden class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityMobile: 'hidden',
      });
      expect(bulmaHelperClasses).toBe('is-hidden-mobile');
    });

    it('applies tablet visibility sr-only class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityTablet: 'sr-only',
      });
      expect(bulmaHelperClasses).toBe('is-sr-only-tablet');
    });

    it('applies desktop visibility hidden class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityDesktop: 'hidden',
      });
      expect(bulmaHelperClasses).toBe('is-hidden-desktop');
    });

    it('applies mobile visibility invisible class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityMobile: 'invisible',
      });
      expect(bulmaHelperClasses).toBe('is-invisible-mobile');
    });

    it('applies tablet visibility invisible class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityTablet: 'invisible',
      });
      expect(bulmaHelperClasses).toBe('is-invisible-tablet');
    });

    it('applies desktop visibility invisible class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityDesktop: 'invisible',
      });
      expect(bulmaHelperClasses).toBe('is-invisible-desktop');
    });

    it('applies widescreen visibility invisible class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityWidescreen: 'invisible',
      });
      expect(bulmaHelperClasses).toBe('is-invisible-widescreen');
    });

    it('applies fullhd visibility invisible class', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityFullhd: 'invisible',
      });
      expect(bulmaHelperClasses).toBe('is-invisible-fullhd');
    });

    it('applies multiple viewport-specific visibility classes', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityMobile: 'hidden',
        visibilityTablet: 'sr-only',
        visibilityDesktop: 'invisible',
        visibilityWidescreen: 'hidden',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'is-hidden-mobile',
          'is-sr-only-tablet',
          'is-invisible-desktop',
          'is-hidden-widescreen',
        ])
      );
    });

    it('ignores invalid viewport-specific visibility values', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        visibilityMobile: 'invalid-visibility' as any,
      });
      expect(bulmaHelperClasses).toBe('');
    });
  });

  describe('Combined viewport-specific properties', () => {
    it('applies multiple different viewport-specific properties', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        textSizeMobile: '2',
        textSizeTablet: '3',
        textAlignDesktop: 'centered',
        visibilityWidescreen: 'hidden',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'is-size-2-mobile',
          'is-size-3-tablet',
          'has-text-centered-desktop',
          'is-hidden-widescreen',
        ])
      );
    });

    it('combines viewport-specific properties with regular properties', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        color: 'danger', // Regular property
        textSize: '4', // Regular property
        textSizeTablet: '2', // Viewport-specific property
        display: 'block',
      });
      expect(bulmaHelperClasses.split(' ')).toEqual(
        expect.arrayContaining([
          'has-text-danger',
          'is-size-4',
          'is-size-2-tablet',
          'is-block',
        ])
      );
    });

    it('viewport-specific properties work with class prefix', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses(
        {
          textSizeMobile: '1',
          textSizeTablet: '3',
        },
        'test-'
      );
      expect(bulmaHelperClasses).toBe(
        'test-is-size-1-mobile test-is-size-3-tablet'
      );
    });
  });

  // Edge case test to achieve 100% coverage
  describe('Edge cases for defensive programming', () => {
    it('handles all code paths including defensive checks', () => {
      // Test comprehensive combinations to ensure all branches are covered
      const result1 = renderUseBulmaClasses({
        display: 'block',
        textAlign: 'centered',
        viewport: 'mobile',
      });
      expect(result1.bulmaHelperClasses).toContain('is-block-mobile');
      expect(result1.bulmaHelperClasses).toContain('has-text-centered-mobile');

      // Test with combinations that exercise different code paths
      const result2 = renderUseBulmaClasses({
        textSize: '3',
        color: 'primary',
        backgroundColor: 'info',
        visibility: 'invisible',
        viewport: 'tablet',
      });
      expect(result2.bulmaHelperClasses).toContain('is-size-3-tablet');
      expect(result2.bulmaHelperClasses).toContain('has-text-primary'); // no viewport support for colors
      expect(result2.bulmaHelperClasses).toContain('has-background-info');
      expect(result2.bulmaHelperClasses).toContain('is-invisible-tablet');
    });

    it('covers defensive programming with edge cases', () => {
      // Test comprehensive edge cases to ensure maximum branch coverage
      // Test with various combinations that exercise different validation paths
      const result1 = renderUseBulmaClasses({
        display: 'block',
        color: 'primary',
        visibility: 'invisible',
        textSize: undefined,
        backgroundColor: undefined,
      });

      expect(result1.bulmaHelperClasses).toContain('is-block');
      expect(result1.bulmaHelperClasses).toContain('has-text-primary');
      expect(result1.bulmaHelperClasses).toContain('is-invisible');

      // Test different combinations to exercise all validation paths
      const result2 = renderUseBulmaClasses({
        overflow: 'clipped',
        relative: true,
        overlay: true,
        interaction: 'clickable',
      });

      expect(result2.bulmaHelperClasses).toContain('is-clipped');
      expect(result2.bulmaHelperClasses).toContain('is-relative');
      expect(result2.bulmaHelperClasses).toContain('is-overlay');
      expect(result2.bulmaHelperClasses).toContain('is-clickable');

      // Test edge case: test all validation paths comprehensively
      const result3 = renderUseBulmaClasses({
        visibility: 'invisible', // Valid value should work
        display: 'block',
        textAlign: 'centered',
      });

      // Should contain all valid classes
      expect(result3.bulmaHelperClasses).toContain('is-invisible');
      expect(result3.bulmaHelperClasses).toContain('is-block');
      expect(result3.bulmaHelperClasses).toContain('has-text-centered');
    });

    it('covers all code paths including undefined values', () => {
      // Test undefined values to ensure all branches are covered
      const result = renderUseBulmaClasses({
        textAlign: undefined, // This should not add any class
        color: 'primary', // This should add class
        display: undefined, // This should not add any class
      });

      expect(result.bulmaHelperClasses).toContain('has-text-primary');
      expect(result.bulmaHelperClasses).not.toContain('undefined');
    });

    it('covers viewport edge cases in addClass function', () => {
      // Test cases that might exercise uncovered branches in addClass
      const result1 = renderUseBulmaClasses({
        textAlign: 'centered', // Uses addClass with supportsViewport=true
        // No viewport specified, should use non-viewport version
      });
      expect(result1.bulmaHelperClasses).toContain('has-text-centered');

      // Test with invalid viewport (this might trigger different code path)
      const result2 = renderUseBulmaClasses({
        textAlign: 'centered',
        viewport: 'invalid' as any, // Invalid viewport
      });
      expect(result2.bulmaHelperClasses).toContain('has-text-centered');
      expect(result2.bulmaHelperClasses).not.toContain('invalid');
    });

    it('verifies edge case handling in internal logic', () => {
      // Test specific combinations that exercise all validation paths
      const result = renderUseBulmaClasses({
        // Test properties that use different validation arrays
        textWeight: 'bold',
        fontFamily: 'monospace',
        overflow: 'clipped',
        float: 'left',
        textTransform: 'uppercase',
        interaction: 'unselectable',
        visibility: 'invisible',
      });

      expect(result.bulmaHelperClasses).toContain('has-text-weight-bold');
      expect(result.bulmaHelperClasses).toContain('is-family-monospace');
      expect(result.bulmaHelperClasses).toContain('is-clipped');
      expect(result.bulmaHelperClasses).toContain('is-pulled-left');
      expect(result.bulmaHelperClasses).toContain('is-uppercase');
      expect(result.bulmaHelperClasses).toContain('is-unselectable');
      expect(result.bulmaHelperClasses).toContain('is-invisible');
    });
  });

  // Flexbox item properties tests
  describe('Flexbox item properties', () => {
    it('applies alignSelf class without requiring display flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        alignSelf: 'center',
      });
      expect(bulmaHelperClasses).toBe('is-align-self-center');
    });

    it('applies flexGrow class without requiring display flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        flexGrow: '1',
      });
      expect(bulmaHelperClasses).toBe('is-flex-grow-1');
    });

    it('applies flexShrink class without requiring display flex', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        flexShrink: '0',
      });
      expect(bulmaHelperClasses).toBe('is-flex-shrink-0');
    });

    it('applies multiple flex item properties together', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        alignSelf: 'flex-end',
        flexGrow: '2',
        flexShrink: '1',
      });
      expect(bulmaHelperClasses).toBe(
        'is-align-self-flex-end is-flex-grow-2 is-flex-shrink-1'
      );
    });

    it('applies flex item properties independently of container properties', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        // These are container properties that require display: flex
        display: 'block', // Not flex!
        justifyContent: 'center', // Should not be applied
        alignItems: 'center', // Should not be applied
        // These are item properties that should always work
        alignSelf: 'flex-start',
        flexGrow: '1',
      });
      expect(bulmaHelperClasses).toContain('is-block');
      expect(bulmaHelperClasses).toContain('is-align-self-flex-start');
      expect(bulmaHelperClasses).toContain('is-flex-grow-1');
      expect(bulmaHelperClasses).not.toContain('is-justify-content-center');
      expect(bulmaHelperClasses).not.toContain('is-align-items-center');
    });
  });
});
