import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useOtherClasses, BulmaOtherProps } from '../useOtherClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useOtherClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseOtherClasses = (
    props: BulmaOtherProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useOtherClasses(props), { wrapper }).result.current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseOtherClasses({})).toBe('');
  });

  it('applies a multi-prop combo in declaration order', () => {
    expect(
      renderUseOtherClasses({
        float: 'left',
        overflow: 'clipped',
        overlay: true,
        interaction: 'unselectable',
        radius: 'radiusless',
        shadow: 'shadowless',
        responsive: 'mobile',
      })
    ).toBe(
      'is-pulled-left is-clipped is-overlay is-unselectable is-radiusless is-shadowless is-mobile'
    );
  });

  it('applies boolean helper classes when true', () => {
    expect(renderUseOtherClasses({ skeleton: true })).toBe('is-skeleton');
    expect(renderUseOtherClasses({ clearfix: true })).toBe('is-clearfix');
    expect(renderUseOtherClasses({ relative: true })).toBe('is-relative');
    expect(renderUseOtherClasses({ fullHeight: true })).toBe('is-full-height');
  });

  it('skips boolean helper classes when false or undefined', () => {
    expect(
      renderUseOtherClasses({
        skeleton: false,
        clearfix: false,
        relative: false,
        fullHeight: false,
      })
    ).toBe('');
    expect(renderUseOtherClasses({ skeleton: undefined })).toBe('');
  });

  it('maps cursor pointer to is-clickable', () => {
    expect(renderUseOtherClasses({ cursor: 'pointer' })).toBe('is-clickable');
  });

  it('maps cursor help to is-cursor-help', () => {
    expect(renderUseOtherClasses({ cursor: 'help' })).toBe('is-cursor-help');
  });

  it('ignores invalid cursor and float values', () => {
    expect(
      renderUseOtherClasses({ cursor: 'grab' as any, float: 'up' as any })
    ).toBe('');
  });

  it('applies class prefix to other helper classes', () => {
    expect(
      renderUseOtherClasses(
        { float: 'right', cursor: 'pointer', skeleton: true },
        'bulma-'
      )
    ).toBe('bulma-is-pulled-right bulma-is-clickable bulma-is-skeleton');
  });
});
