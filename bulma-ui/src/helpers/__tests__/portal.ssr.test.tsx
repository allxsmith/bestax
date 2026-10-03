/**
 * @jest-environment node
 *
 * SSR coverage for Portal, where `document` is genuinely undefined: a
 * regression that resolved the portal target during a server render fails
 * here instead of passing by accident under jsdom.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { Portal } from '../portal';

describe('Portal on the server (node environment)', () => {
  it('renders nothing, or its children in place when disabled', () => {
    expect(
      renderToStaticMarkup(
        <>
          <Portal container="#overlays">
            <p>Portaled</p>
          </Portal>
          <Portal disabled>
            <p>In place</p>
          </Portal>
        </>
      )
    ).toBe('<p>In place</p>');
  });
});
