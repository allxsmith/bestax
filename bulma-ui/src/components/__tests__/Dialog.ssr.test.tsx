/**
 * @jest-environment node
 *
 * SSR coverage for DialogContainer: the server renders no dialog, whatever
 * `dialog` holds, because the server's copy of that store is shared by every
 * request. The client half (hydrating that empty markup, then opening what
 * was raised) is covered in `Dialog.test.tsx`.
 *
 * This runs in a Node environment, where `document` is genuinely undefined, so
 * a regression that reached for the DOM during server render fails here
 * instead of passing by accident under jsdom.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DialogContainer, dialog } from '../Dialog';

describe('DialogContainer SSR (node environment)', () => {
  it('renders nothing, even with a dialog raised', () => {
    dialog.confirm('Raised on the server');
    try {
      const html = renderToStaticMarkup(React.createElement(DialogContainer));
      expect(html).toBe('');
    } finally {
      dialog.close();
    }
  });
});
