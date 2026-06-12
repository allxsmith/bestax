import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  useTypographyClasses,
  BulmaTypographyProps,
} from '../useTypographyClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useTypographyClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseTypographyClasses = (
    props: BulmaTypographyProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useTypographyClasses(props), { wrapper }).result
      .current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseTypographyClasses({})).toBe('');
  });

  it('applies base typography combo in declaration order', () => {
    expect(
      renderUseTypographyClasses({
        textSize: '3',
        textAlign: 'centered',
        textTransform: 'uppercase',
        textWeight: 'bold',
        fontFamily: 'monospace',
      })
    ).toBe(
      'is-size-3 has-text-centered is-uppercase has-text-weight-bold is-family-monospace'
    );
  });

  it('suffixes only textSize and textAlign with the viewport', () => {
    expect(
      renderUseTypographyClasses({
        textSize: '3',
        textAlign: 'centered',
        textTransform: 'uppercase',
        viewport: 'tablet',
      })
    ).toBe('is-size-3-tablet has-text-centered-tablet is-uppercase');
  });

  it('ignores an invalid viewport (no suffix applied)', () => {
    expect(
      renderUseTypographyClasses({
        textSize: '3',
        textAlign: 'centered',
        viewport: 'invalid' as any,
      })
    ).toBe('is-size-3 has-text-centered');
  });

  it('emits viewport-specific text sizes before viewport-specific alignments', () => {
    expect(
      renderUseTypographyClasses({
        textSizeMobile: '1',
        textSizeTablet: '2',
        textSizeDesktop: '3',
        textSizeWidescreen: '4',
        textSizeFullhd: '5',
        textAlignMobile: 'centered',
        textAlignTablet: 'left',
        textAlignDesktop: 'right',
        textAlignWidescreen: 'justified',
        textAlignFullhd: 'centered',
      })
    ).toBe(
      'is-size-1-mobile is-size-2-tablet is-size-3-desktop is-size-4-widescreen is-size-5-fullhd ' +
        'has-text-centered-mobile has-text-left-tablet has-text-right-desktop has-text-justified-widescreen has-text-centered-fullhd'
    );
  });

  it('ignores invalid viewport-specific values', () => {
    expect(
      renderUseTypographyClasses({
        textSizeMobile: '9' as any,
        textAlignTablet: 'middle' as any,
      })
    ).toBe('');
  });

  it('applies class prefix to typography classes', () => {
    expect(
      renderUseTypographyClasses(
        { textSize: '3', textWeight: 'bold', textAlignMobile: 'centered' },
        'bulma-'
      )
    ).toBe(
      'bulma-is-size-3 bulma-has-text-weight-bold bulma-has-text-centered-mobile'
    );
  });

  it('returns the same string across rerenders with the same props', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider>{children}</ConfigProvider>
    );
    const { result, rerender } = renderHook(
      (props: BulmaTypographyProps) => useTypographyClasses(props),
      { wrapper, initialProps: { textSize: '3' } as BulmaTypographyProps }
    );
    const first = result.current;
    rerender({ textSize: '3' });
    expect(result.current).toBe(first);
    expect(result.current).toBe('is-size-3');
  });

  it('returns a new string when a prop changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider>{children}</ConfigProvider>
    );
    const { result, rerender } = renderHook(
      (props: BulmaTypographyProps) => useTypographyClasses(props),
      { wrapper, initialProps: { textSize: '3' } as BulmaTypographyProps }
    );
    expect(result.current).toBe('is-size-3');
    rerender({ textSize: '5' });
    expect(result.current).toBe('is-size-5');
  });
});
