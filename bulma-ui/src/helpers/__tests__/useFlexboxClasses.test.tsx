import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  useFlexboxClasses,
  BulmaFlexboxProps,
  type UseFlexboxClassesOptions,
} from '../useFlexboxClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useFlexboxClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseFlexboxClasses = (
    props: BulmaFlexboxProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useFlexboxClasses(props), { wrapper }).result
      .current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseFlexboxClasses({})).toBe('');
  });

  it('emits container classes when display is flex, but never is-flex itself', () => {
    const result = renderUseFlexboxClasses({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    });
    expect(result).toBe('is-flex-direction-row is-justify-content-center');
    expect(result.split(' ')).not.toContain('is-flex');
  });

  it('suppresses container classes when display is not flex, items still emit', () => {
    expect(
      renderUseFlexboxClasses({
        display: 'block',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      })
    ).toBe('');
    expect(
      renderUseFlexboxClasses({
        display: 'block',
        flexDirection: 'row',
        alignSelf: 'center',
      })
    ).toBe('is-align-self-center');
  });

  it('opens the container gate via displayTablet inline-flex', () => {
    expect(
      renderUseFlexboxClasses({
        displayTablet: 'inline-flex',
        flexWrap: 'wrap',
      })
    ).toBe('is-flex-wrap-wrap');
  });

  it.each([
    ['displayTouch', 'flex'],
    ['displayTabletOnly', 'inline-flex'],
    ['displayDesktopOnly', 'flex'],
    ['displayWidescreenOnly', 'inline-flex'],
  ] as const)('opens the container gate via %s %s', (prop, value) => {
    expect(
      renderUseFlexboxClasses({
        [prop]: value,
        flexDirection: 'row',
      })
    ).toBe('is-flex-direction-row');
  });

  it('keeps the container gate closed for a non-flex -only/touch display', () => {
    expect(
      renderUseFlexboxClasses({
        displayTouch: 'block',
        displayTabletOnly: 'grid',
        flexDirection: 'row',
      })
    ).toBe('');
  });

  it('emits flex item classes without any display prop', () => {
    expect(
      renderUseFlexboxClasses({
        alignSelf: 'center',
        flexGrow: '1',
        flexShrink: '0',
      })
    ).toBe('is-align-self-center is-flex-grow-1 is-flex-shrink-0');
  });

  it('emits container classes before item classes in declaration order', () => {
    expect(
      renderUseFlexboxClasses({
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignContent: 'stretch',
        alignItems: 'center',
        alignSelf: 'auto',
        flexGrow: '1',
        flexShrink: '0',
      })
    ).toBe(
      'is-flex-direction-column is-flex-wrap-wrap is-justify-content-space-between ' +
        'is-align-content-stretch is-align-items-center is-align-self-auto is-flex-grow-1 is-flex-shrink-0'
    );
  });

  it('ignores invalid values', () => {
    expect(
      renderUseFlexboxClasses({
        display: 'flex',
        flexDirection: 'diagonal' as any,
        justifyContent: 'middle' as any,
        alignSelf: 'invalid' as any,
        flexGrow: '9' as any,
      })
    ).toBe('');
  });

  it('applies class prefix to flexbox classes', () => {
    expect(
      renderUseFlexboxClasses(
        { display: 'flex', justifyContent: 'center', flexGrow: '1' },
        'bulma-'
      )
    ).toBe('bulma-is-justify-content-center bulma-is-flex-grow-1');
  });

  it('returns the same string across rerenders with the same props', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider>{children}</ConfigProvider>
    );
    const { result, rerender } = renderHook(
      (props: BulmaFlexboxProps) => useFlexboxClasses(props),
      { wrapper, initialProps: { flexGrow: '1' } as BulmaFlexboxProps }
    );
    const first = result.current;
    rerender({ flexGrow: '1' });
    expect(result.current).toBe(first);
    expect(result.current).toBe('is-flex-grow-1');
  });

  describe('flexContainer', () => {
    const renderWithOptions = (
      props: BulmaFlexboxProps,
      options?: UseFlexboxClassesOptions,
      classPrefix?: string
    ) => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
      );
      return renderHook(() => useFlexboxClasses(props, options), { wrapper })
        .result.current;
    };

    const container: BulmaFlexboxProps = {
      flexDirection: 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignContent: 'space-between',
      alignItems: 'flex-start',
    };

    it('emits the container classes with no display prop, and no is-flex', () => {
      const result = renderWithOptions(container, { flexContainer: true });
      expect(result).toBe(
        'is-flex-direction-column is-flex-wrap-wrap is-justify-content-center ' +
          'is-align-content-space-between is-align-items-flex-start'
      );
      expect(result.split(' ')).not.toContain('is-flex');
    });

    it('still emits the item classes beside them', () => {
      expect(
        renderWithOptions(
          { alignItems: 'center', alignSelf: 'flex-end', flexGrow: '1' },
          { flexContainer: true }
        )
      ).toBe('is-align-items-center is-align-self-flex-end is-flex-grow-1');
    });

    it('prefixes them', () => {
      expect(
        renderWithOptions(
          { alignItems: 'center' },
          { flexContainer: true },
          'bestax-'
        )
      ).toBe('bestax-is-align-items-center');
    });

    it('ignores invalid values', () => {
      expect(
        renderWithOptions(
          { flexDirection: 'diagonal' as any, alignItems: 'middle' as any },
          { flexContainer: true }
        )
      ).toBe('');
    });

    // What every component that doesn't pass the option gets, which is every
    // component that existed before it: the gate shuts without a flex display
    // and opens with one, exactly as the tests above pin it.
    it.each([
      ['no options', undefined],
      ['empty options', {}],
      ['flexContainer false', { flexContainer: false }],
    ] as const)('leaves the gate as it was with %s', (_label, options) => {
      expect(renderWithOptions(container, options)).toBe('');
      expect(
        renderWithOptions({ ...container, display: 'block' }, options)
      ).toBe('');
      expect(
        renderWithOptions({ ...container, alignSelf: 'center' }, options)
      ).toBe('is-align-self-center');
      expect(
        renderWithOptions({ ...container, display: 'flex' }, options)
      ).toBe(
        'is-flex-direction-column is-flex-wrap-wrap is-justify-content-center ' +
          'is-align-content-space-between is-align-items-flex-start'
      );
      expect(
        renderWithOptions(
          { alignItems: 'center', displayTablet: 'inline-flex' },
          options
        )
      ).toBe('is-align-items-center');
    });

    it('returns a new string when the option changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );
      const { result, rerender } = renderHook(
        (flexContainer: boolean) =>
          useFlexboxClasses({ alignItems: 'center' }, { flexContainer }),
        { wrapper, initialProps: false }
      );
      expect(result.current).toBe('');
      rerender(true);
      expect(result.current).toBe('is-align-items-center');
    });
  });

  it('returns a new string when a prop changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider>{children}</ConfigProvider>
    );
    const { result, rerender } = renderHook(
      (props: BulmaFlexboxProps) => useFlexboxClasses(props),
      { wrapper, initialProps: { flexGrow: '1' } as BulmaFlexboxProps }
    );
    expect(result.current).toBe('is-flex-grow-1');
    rerender({ flexGrow: '2' });
    expect(result.current).toBe('is-flex-grow-2');
  });
});
