/**
 * @jest-environment node
 *
 * SSR coverage for ClientOnly, where `window` and `document` are genuinely
 * undefined: a regression that ran the children (or anything browser-only)
 * during a server render fails here instead of passing by accident under
 * jsdom.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientOnly } from '../ClientOnly';
import { useIsHydrated } from '../useIsHydrated';

describe('ClientOnly on the server (node environment)', () => {
  it('renders its fallback and never calls a function child', () => {
    expect(
      renderToStaticMarkup(
        <ClientOnly fallback={<span>Loading</span>}>
          {() => <span>{window.innerWidth}</span>}
        </ClientOnly>
      )
    ).toBe('<span>Loading</span>');
  });

  it('renders nothing without a fallback', () => {
    expect(renderToStaticMarkup(<ClientOnly>Client content</ClientOnly>)).toBe(
      ''
    );
  });

  it('reports false from useIsHydrated', () => {
    const Probe: React.FC = () => <>{String(useIsHydrated())}</>;
    expect(renderToStaticMarkup(<Probe />)).toBe('false');
  });
});
