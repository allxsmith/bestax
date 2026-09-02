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

  it('applies display grid class', () => {
    expect(renderUseVisibilityClasses({ display: 'grid' })).toBe('is-grid');
  });

  it('ignores invalid display values', () => {
    expect(renderUseVisibilityClasses({ display: 'flexbox' as any })).toBe('');
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

  it('maps displayTouch none to is-hidden-touch', () => {
    expect(renderUseVisibilityClasses({ displayTouch: 'none' })).toBe(
      'is-hidden-touch'
    );
  });

  it('applies displayTouch class', () => {
    expect(renderUseVisibilityClasses({ displayTouch: 'flex' })).toBe(
      'is-flex-touch'
    );
  });

  it('applies displayTabletOnly class', () => {
    expect(renderUseVisibilityClasses({ displayTabletOnly: 'block' })).toBe(
      'is-block-tablet-only'
    );
  });

  it('applies displayDesktopOnly class', () => {
    expect(renderUseVisibilityClasses({ displayDesktopOnly: 'flex' })).toBe(
      'is-flex-desktop-only'
    );
  });

  it('applies displayWidescreenOnly class', () => {
    expect(
      renderUseVisibilityClasses({ displayWidescreenOnly: 'inline-flex' })
    ).toBe('is-inline-flex-widescreen-only');
  });

  it('applies visibilityTouch hidden as is-hidden-touch', () => {
    expect(renderUseVisibilityClasses({ visibilityTouch: 'hidden' })).toBe(
      'is-hidden-touch'
    );
  });

  it('applies visibilityTabletOnly invisible as is-invisible-tablet-only', () => {
    expect(
      renderUseVisibilityClasses({ visibilityTabletOnly: 'invisible' })
    ).toBe('is-invisible-tablet-only');
  });

  it('applies visibilityDesktopOnly sr-only as is-sr-only-desktop-only', () => {
    expect(
      renderUseVisibilityClasses({ visibilityDesktopOnly: 'sr-only' })
    ).toBe('is-sr-only-desktop-only');
  });

  it('applies visibilityWidescreenOnly hidden as is-hidden-widescreen-only', () => {
    expect(
      renderUseVisibilityClasses({ visibilityWidescreenOnly: 'hidden' })
    ).toBe('is-hidden-widescreen-only');
  });

  it('suffixes display with touch and -only viewports via the legacy viewport prop', () => {
    expect(
      renderUseVisibilityClasses({ display: 'flex', viewport: 'touch' })
    ).toBe('is-flex-touch');
    expect(
      renderUseVisibilityClasses({ display: 'block', viewport: 'tablet-only' })
    ).toBe('is-block-tablet-only');
    expect(
      renderUseVisibilityClasses({ display: 'block', viewport: 'desktop-only' })
    ).toBe('is-block-desktop-only');
    expect(
      renderUseVisibilityClasses({
        display: 'block',
        viewport: 'widescreen-only',
      })
    ).toBe('is-block-widescreen-only');
  });

  it('suffixes visibility with touch and -only viewports via the legacy viewport prop', () => {
    expect(
      renderUseVisibilityClasses({ visibility: 'hidden', viewport: 'touch' })
    ).toBe('is-hidden-touch');
    expect(
      renderUseVisibilityClasses({
        visibility: 'invisible',
        viewport: 'desktop-only',
      })
    ).toBe('is-invisible-desktop-only');
  });
});
