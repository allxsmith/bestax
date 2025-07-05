import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useBulmaClasses, BulmaClassesProps } from '../useBulmaClasses';

describe('useBulmaClasses', () => {
  // Helper function to render the hook with props
  const renderUseBulmaClasses = (props: BulmaClassesProps) =>
    renderHook(() => useBulmaClasses(props)).result.current;

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
      ({ props }) => useBulmaClasses(props),
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

  // ... (previous imports and tests remain unchanged)

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

  // ... (rest of the tests remain unchanged)

  // New test cases for lines 250–253 (background color with shade and viewport)
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
});
