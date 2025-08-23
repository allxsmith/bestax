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
        colorShade: '25',
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
  it('applies viewport-specific classes for valid viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      m: '2',
      viewport: 'tablet',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-tablet m-2-tablet');
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

  it('applies text color with shade and viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
      viewport: 'mobile',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05-mobile');
  });

  it('applies background color with shade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'info',
      colorShade: '10',
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

  it('applies text color with shade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05');
  });

  it('applies text color with shade and viewport', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '05',
      viewport: 'mobile',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-05-mobile');
  });

  it('applies text color with shade without viewport when viewport is invalid', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      color: 'primary',
      colorShade: '50',
      viewport: 'invalid',
    });
    expect(bulmaHelperClasses).toBe('has-text-primary-50');
  });

  it('applies background color with shade', () => {
    const { bulmaHelperClasses } = renderUseBulmaClasses({
      backgroundColor: 'info',
      colorShade: '10',
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

  // Background color with shade and viewport
  describe('Background color with shade and viewport', () => {
    it('applies background color with shade and not applicable viewport', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        colorShade: '50',
        viewport: 'mobile',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });

    it('applies background color with shade without viewport when viewport is invalid', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        colorShade: '50',
        viewport: 'invalid',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });

    it('applies background color with shade without viewport when viewport is undefined', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        colorShade: '50',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });
  });

  // Background color with shade and viewport (duplicated block in original)
  describe('Background color with shade and viewport', () => {
    it('applies background color with shade and not applicable viewport', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        colorShade: '50',
        viewport: 'mobile',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });

    it('applies background color with shade without viewport when viewport is invalid', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        colorShade: '50',
        viewport: 'invalid',
      });
      expect(bulmaHelperClasses).toBe('has-background-primary-50');
    });

    it('applies background color with shade without viewport when viewport is undefined', () => {
      const { bulmaHelperClasses } = renderUseBulmaClasses({
        backgroundColor: 'primary',
        colorShade: '50',
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
});
