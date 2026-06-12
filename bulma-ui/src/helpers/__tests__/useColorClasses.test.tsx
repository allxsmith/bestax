import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useColorClasses, BulmaColorProps } from '../useColorClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useColorClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseColorClasses = (
    props: BulmaColorProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useColorClasses(props), { wrapper }).result.current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseColorClasses({})).toBe('');
  });

  it('applies text color class', () => {
    expect(renderUseColorClasses({ color: 'primary' })).toBe(
      'has-text-primary'
    );
  });

  it('applies text color before background color', () => {
    expect(
      renderUseColorClasses({ color: 'primary', backgroundColor: 'light' })
    ).toBe('has-text-primary has-background-light');
  });

  it('applies color with shade', () => {
    expect(renderUseColorClasses({ color: 'primary', colorShade: '50' })).toBe(
      'has-text-primary-50'
    );
  });

  it('applies background color with shade', () => {
    expect(
      renderUseColorClasses({
        backgroundColor: 'info',
        backgroundColorShade: '25',
      })
    ).toBe('has-background-info-25');
  });

  it('ignores colorShade without color', () => {
    expect(renderUseColorClasses({ colorShade: '25' })).toBe('');
  });

  it('ignores backgroundColorShade without backgroundColor', () => {
    expect(renderUseColorClasses({ backgroundColorShade: '25' })).toBe('');
  });

  it('ignores invalid color', () => {
    expect(renderUseColorClasses({ color: 'invalid' as any })).toBe('');
  });

  it('falls back to plain color class for invalid shade', () => {
    expect(
      renderUseColorClasses({
        color: 'primary',
        colorShade: 'invalid' as any,
      })
    ).toBe('has-text-primary');
  });

  it('handles special color value inherit', () => {
    expect(renderUseColorClasses({ color: 'inherit' })).toBe(
      'has-text-inherit'
    );
  });

  it('handles special color value current', () => {
    expect(renderUseColorClasses({ color: 'current' })).toBe(
      'has-text-current'
    );
  });

  it('handles special background color values', () => {
    expect(renderUseColorClasses({ backgroundColor: 'inherit' })).toBe(
      'has-background-inherit'
    );
  });

  it('applies class prefix to color classes', () => {
    expect(renderUseColorClasses({ color: 'primary' }, 'bulma-')).toBe(
      'bulma-has-text-primary'
    );
  });

  it('applies class prefix to shaded color classes', () => {
    expect(
      renderUseColorClasses({ color: 'primary', colorShade: '50' }, 'bulma-')
    ).toBe('bulma-has-text-primary-50');
  });

  it('returns the same string across rerenders with the same props', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider>{children}</ConfigProvider>
    );
    const { result, rerender } = renderHook(
      (props: BulmaColorProps) => useColorClasses(props),
      { wrapper, initialProps: { color: 'primary' } }
    );
    const first = result.current;
    rerender({ color: 'primary' });
    expect(result.current).toBe(first);
    expect(result.current).toBe('has-text-primary');
  });

  it('returns a new string when a prop changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider>{children}</ConfigProvider>
    );
    const { result, rerender } = renderHook(
      (props: BulmaColorProps) => useColorClasses(props),
      { wrapper, initialProps: { color: 'primary' } as BulmaColorProps }
    );
    expect(result.current).toBe('has-text-primary');
    rerender({ color: 'danger' });
    expect(result.current).toBe('has-text-danger');
  });
});
