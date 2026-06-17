import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useFlexboxClasses, BulmaFlexboxProps } from '../useFlexboxClasses';
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
