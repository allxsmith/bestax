/**
 * @jest-environment node
 *
 * SSR coverage for NotificationContainer: it portals into `document.body`,
 * which the server does not have, so it renders nothing there whatever
 * `notification` holds. The client half (hydrating that empty markup, then
 * showing what was raised) is covered in `Notification.test.tsx`.
 *
 * This runs in a Node environment, where `document` is genuinely undefined, so
 * a regression that reached for the DOM during server render fails here
 * instead of passing by accident under jsdom.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotificationContainer, notification } from '../Notification';

describe('NotificationContainer SSR (node environment)', () => {
  it('renders nothing with nothing raised, status region included', () => {
    const html = renderToStaticMarkup(
      React.createElement(NotificationContainer)
    );
    expect(html).toBe('');
  });

  it('renders nothing, even with notifications raised', () => {
    notification.show({ message: 'Raised on the server', duration: 0 });
    try {
      const html = renderToStaticMarkup(
        React.createElement(NotificationContainer)
      );
      expect(html).toBe('');
    } finally {
      notification.closeAll();
    }
  });

  it('renders nothing with notifications at several positions', () => {
    notification.show({ message: 'Default', duration: 0 });
    notification.show({ message: 'Placed', position: 'bottom', duration: 0 });
    try {
      const html = renderToStaticMarkup(
        React.createElement(NotificationContainer)
      );
      expect(html).toBe('');
    } finally {
      notification.closeAll();
    }
  });
});
