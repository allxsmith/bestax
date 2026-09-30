/**
 * @jest-environment node
 *
 * SSR coverage for the overlay helpers, where `document` is genuinely
 * undefined: a regression that reached for the DOM during render (resolving a
 * portal target, reading focus) fails here instead of passing by accident
 * under jsdom.
 */
import React, { useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Portal } from '../portal';
import { ClientOnly } from '../ClientOnly';
import { useFocusTrap } from '../useFocusTrap';

describe('overlay helpers on the server (node environment)', () => {
  it('Portal renders nothing, or its children in place when disabled', () => {
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

  it('ClientOnly renders its fallback', () => {
    expect(
      renderToStaticMarkup(
        <ClientOnly fallback={<span>Loading</span>}>
          {() => <span>{window.innerWidth}</span>}
        </ClientOnly>
      )
    ).toBe('<span>Loading</span>');
  });

  it('useFocusTrap renders the container and does nothing else', () => {
    const Panel: React.FC = () => {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref);
      return (
        <div ref={ref} tabIndex={-1}>
          <button>Inside</button>
        </div>
      );
    };
    expect(renderToStaticMarkup(<Panel />)).toBe(
      '<div tabindex="-1"><button>Inside</button></div>'
    );
  });
});
