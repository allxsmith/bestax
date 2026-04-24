/**
 * @jest-environment node
 *
 * SSR coverage for Snackbar: when `typeof document === 'undefined'` and the
 * snackbar is not inline, the component should return null (no portal).
 *
 * jsdom's `document` is a non-configurable getter on Window which cannot be
 * shadowed at runtime, so this branch must be exercised in a Node test
 * environment where `document` is naturally undefined.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Snackbar } from '../Snackbar';

describe('Snackbar SSR (node environment)', () => {
  it('returns null (empty markup) when document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Snackbar, {
        message: 'SSR snackbar',
        duration: 0,
        cancelable: false,
      })
    );
    expect(html).toBe('');
  });

  it('still renders inline when inline=true and document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Snackbar, {
        message: 'Inline SSR snackbar',
        duration: 0,
        cancelable: false,
        inline: true,
      })
    );
    expect(html).toContain('Inline SSR snackbar');
  });
});
