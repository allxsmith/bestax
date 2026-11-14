/**
 * @vitest-environment node
 *
 * SSR coverage for Toast, where `document` is undefined. A portal has no
 * server-rendered counterpart, so a Toast renders in place on the server, and
 * the client's hydrating render matches it before moving it into its portal.
 * ToastContainer renders nothing whatever `toast` holds on the server.
 *
 * jsdom's `document` is a non-configurable getter on Window which cannot be
 * shadowed at runtime, so this has to run in a Node test environment.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Toast, ToastContainer, toast } from '../Toast';

describe('Toast SSR (node environment)', () => {
  it('renders a toast in place, in its position box', () => {
    const html = renderToStaticMarkup(
      React.createElement(Toast, { message: 'SSR test', duration: 0 })
    );
    expect(html).toContain('toast-container');
    expect(html).toContain('SSR test');
  });

  it('renders inline when inline=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Toast, {
        message: 'Inline SSR',
        duration: 0,
        inline: true,
      })
    );
    expect(html).toContain('Inline SSR');
  });

  it('renders ToastContainer as nothing, even with toasts raised', () => {
    toast.show({ message: 'Raised on the server', duration: 0 });
    try {
      const html = renderToStaticMarkup(React.createElement(ToastContainer));
      expect(html).toBe('');
    } finally {
      toast.closeAll();
    }
  });

  it('renders ToastContainer as nothing with toasts at several positions', () => {
    toast.show({ message: 'Default', duration: 0 });
    toast.show({ message: 'Placed', position: 'bottom-left', duration: 0 });
    toast.show({ message: 'Inline', position: 'top-left', inline: true });
    try {
      const html = renderToStaticMarkup(React.createElement(ToastContainer));
      expect(html).toBe('');
    } finally {
      toast.closeAll();
    }
  });
});
