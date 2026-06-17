/**
 * @jest-environment node
 *
 * SSR coverage for Sidebar: when `typeof document === 'undefined'` and the
 * sidebar is not inline, the component should return null (no portal).
 *
 * jsdom's `document` is a non-configurable getter on Window which cannot be
 * shadowed at runtime, so this branch must be exercised in a Node test
 * environment where `document` is naturally undefined.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from '../Sidebar';

describe('Sidebar SSR (node environment)', () => {
  it('returns null (empty markup) when document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Sidebar, { isOpen: true }, 'SSR sidebar content')
    );
    expect(html).toBe('');
  });

  it('still renders inline when inline=true and document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Sidebar,
        { isOpen: true, inline: true },
        'Inline SSR sidebar'
      )
    );
    expect(html).toContain('Inline SSR sidebar');
  });
});
