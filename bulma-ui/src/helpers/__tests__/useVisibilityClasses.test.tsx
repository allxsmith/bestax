import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  useVisibilityClasses,
  BulmaVisibilityProps,
} from '../useVisibilityClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useVisibilityClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseVisibilityClasses = (
    props: BulmaVisibilityProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useVisibilityClasses(props), { wrapper }).result
      .current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseVisibilityClasses({})).toBe('');
  });

  it('applies display block class', () => {
    expect(renderUseVisibilityClasses({ display: 'block' })).toBe('is-block');
  });

  it('maps display none to is-hidden', () => {
    expect(renderUseVisibilityClasses({ display: 'none' })).toBe('is-hidden');
  });

  it('suffixes display with the viewport', () => {
    expect(
      renderUseVisibilityClasses({ display: 'block', viewport: 'tablet' })
    ).toBe('is-block-tablet');
  });

  it('maps display none with viewport to is-hidden-viewport', () => {
    expect(
      renderUseVisibilityClasses({ display: 'none', viewport: 'desktop' })
    ).toBe('is-hidden-desktop');
  });

  it('maps displayMobile none to is-hidden-mobile', () => {
    expect(renderUseVisibilityClasses({ displayMobile: 'none' })).toBe(
      'is-hidden-mobile'
    );
  });

  it('suppresses legacy display/viewport when a viewport-specific display is set', () => {
    expect(
      renderUseVisibilityClasses({
        displayTablet: 'flex',
        display: 'block',
        viewport: 'tablet',
      })
    ).toBe('is-flex-tablet');
  });

  it('suffixes visibility hidden with the viewport', () => {
    expect(
      renderUseVisibilityClasses({ visibility: 'hidden', viewport: 'tablet' })
    ).toBe('is-hidden-tablet');
  });

  it('never suffixes visibility sr-only with the viewport', () => {
    expect(
      renderUseVisibilityClasses({ visibility: 'sr-only', viewport: 'tablet' })
    ).toBe('is-sr-only');
  });

  it('applies visibilityMobile sr-only as is-sr-only-mobile', () => {
    expect(renderUseVisibilityClasses({ visibilityMobile: 'sr-only' })).toBe(
      'is-sr-only-mobile'
    );
  });

  it('emits visibility-viewport classes before display-viewport classes', () => {
    expect(
      renderUseVisibilityClasses({
        visibilityTablet: 'hidden',
        displayMobile: 'flex',
      })
    ).toBe('is-hidden-tablet is-flex-mobile');
  });

  it('applies viewport-specific invisible class', () => {
    expect(renderUseVisibilityClasses({ visibilityDesktop: 'invisible' })).toBe(
      'is-invisible-desktop'
    );
  });

  it('ignores invalid display values', () => {
    expect(renderUseVisibilityClasses({ display: 'grid' as any })).toBe('');
  });

  it('ignores invalid visibility values', () => {
    expect(
      renderUseVisibilityClasses({
        visibility: 'invalid' as any,
        visibilityMobile: 'invalid' as any,
      })
    ).toBe('');
  });

  it('applies class prefix to visibility and display classes', () => {
    expect(
      renderUseVisibilityClasses(
        { visibilityMobile: 'hidden', display: 'flex' },
        'bulma-'
      )
    ).toBe('bulma-is-hidden-mobile bulma-is-flex');
  });
});
