/**
 * @jest-environment node
 *
 * SSR coverage for Modal: a portal has no server-rendered counterpart, so on
 * the server `portal` must be ignored and the modal rendered inline. That is
 * driven by the server snapshot of a `useSyncExternalStore` "are we on the
 * client" flag — the client half of the contract (hydrating that inline markup
 * without a mismatch) is covered in `Modal.test.tsx`.
 *
 * This runs in a Node environment, where `document` is genuinely undefined, so
 * a regression that reached for the DOM during server render fails here
 * instead of passing by accident under jsdom.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Modal } from '../Modal';

describe('Modal SSR (node environment)', () => {
  it('renders inline when portal is true and document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { active: true, portal: true }, 'SSR modal')
    );
    expect(html).toContain('SSR modal');
  });

  it('renders inline when portal is a selector and document is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Modal,
        { active: true, portal: '#somewhere' },
        'SSR modal selector'
      )
    );
    expect(html).toContain('SSR modal selector');
  });
});
