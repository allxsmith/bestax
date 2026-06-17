/**
 * @jest-environment node
 *
 * SSR coverage for Toast: when `typeof document === 'undefined'` and the
 * toast is not inline, the component should return null (no portal).
 *
 * jsdom's `document` is a non-configurable getter on Window which cannot be
 * shadowed at runtime, so this branch must be exercised in a Node test
 * environment where `document` is naturally undefined.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Toast } from '../Toast';

describe('Toast SSR (node environment)', () => {
  it('returns null (empty markup) when document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Toast, { message: 'SSR test', duration: 0 })
    );
    expect(html).toBe('');
  });

  it('still renders inline when inline=true and document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Toast, {
        message: 'Inline SSR',
        duration: 0,
        inline: true,
      })
    );
    expect(html).toContain('Inline SSR');
  });
});
