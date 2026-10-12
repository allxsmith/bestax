/**
 * @jest-environment node
 *
 * SSR coverage for Tooltip, where `document` is genuinely undefined: a
 * regression that measured or listened during a server render fails here
 * instead of passing by accident under jsdom. Hydrating that markup is
 * covered in `Tooltip.test.tsx`.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tooltip } from '../Tooltip';

const ui = (props: Partial<React.ComponentProps<typeof Tooltip>> = {}) => (
  <Tooltip label="Delete item" {...props}>
    <button>Delete</button>
  </Tooltip>
);

describe('Tooltip on the server (node environment)', () => {
  it('renders a hidden tooltip after its trigger, which it describes', () => {
    const html = renderToStaticMarkup(ui());
    const id = html.match(/<span id="([^"]+)"[^>]* role="tooltip"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`<button aria-describedby="${id}">Delete</button>`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('is-active');
  });

  it('renders an active tooltip shown', () => {
    const html = renderToStaticMarkup(ui({ active: true }));
    expect(html).toContain('is-active');
    expect(html).toContain('aria-hidden="false"');
  });
});
