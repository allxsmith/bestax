import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useSpacingClasses, BulmaSpacingProps } from '../useSpacingClasses';
import { ConfigProvider } from '../Config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useSpacingClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseSpacingClasses = (
    props: BulmaSpacingProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useSpacingClasses(props), { wrapper }).result
      .current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseSpacingClasses({})).toBe('');
  });

  it('applies a single margin class', () => {
    expect(renderUseSpacingClasses({ m: '2' })).toBe('m-2');
  });

  it('applies combined margins and paddings in declaration order', () => {
    expect(
      renderUseSpacingClasses({
        m: '1',
        mt: '2',
        mr: '3',
        mb: '4',
        ml: '5',
        mx: '6',
        my: '0',
        p: '1',
        pt: '2',
        pr: '3',
        pb: '4',
        pl: '5',
        px: '6',
        py: 'auto',
      })
    ).toBe(
      'm-1 mt-2 mr-3 mb-4 ml-5 mx-6 my-0 p-1 pt-2 pr-3 pb-4 pl-5 px-6 py-auto'
    );
  });

  it('ignores invalid spacing values', () => {
    expect(renderUseSpacingClasses({ m: '7' as any, p: 'big' as any })).toBe(
      ''
    );
  });

  it('applies class prefix to spacing classes', () => {
    expect(renderUseSpacingClasses({ m: '2', px: '4' }, 'bulma-')).toBe(
      'bulma-m-2 bulma-px-4'
    );
  });
});
