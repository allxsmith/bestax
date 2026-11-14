/**
 * @vitest-environment node
 *
 * SSR coverage for Sidebar, where `document` is undefined. A portal has no
 * server-rendered counterpart, so the sidebar renders in place on the server,
 * and the client's hydrating render matches it before moving it into its
 * portal.
 *
 * jsdom's `document` is a non-configurable getter on Window which cannot be
 * shadowed at runtime, so this has to run in a Node test environment.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from '../Sidebar';

describe('Sidebar SSR (node environment)', () => {
  it('renders an open sidebar in place', () => {
    const html = renderToStaticMarkup(
      React.createElement(Sidebar, { isOpen: true }, 'SSR sidebar content')
    );
    expect(html).toContain('<aside');
    expect(html).toContain('SSR sidebar content');
  });

  it('renders inline when inline=true', () => {
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
