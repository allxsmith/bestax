/**
 * @jest-environment node
 *
 * SSR coverage for Modal: when `typeof document === 'undefined'`, `portal`
 * must be ignored and the modal rendered inline instead of via
 * `createPortal` (which requires a DOM).
 *
 * jsdom's `document` is a non-configurable getter on Window which cannot be
 * shadowed at runtime, so this branch must be exercised in a Node test
 * environment where `document` is naturally undefined.
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
