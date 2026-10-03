/**
 * @jest-environment node
 *
 * SSR coverage for useFocusTrap, where `document` is genuinely undefined: a
 * regression that read focus or the DOM during a server render fails here
 * instead of passing by accident under jsdom.
 */
import React, { useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap on the server (node environment)', () => {
  it('renders the container as written and does nothing else', () => {
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
