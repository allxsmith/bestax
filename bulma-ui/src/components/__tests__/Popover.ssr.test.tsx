/**
 * @jest-environment node
 *
 * SSR coverage for Popover, where `document` is genuinely undefined: a
 * regression that measured, focused or portaled during a server render fails
 * here instead of passing by accident under jsdom. Hydrating that markup is
 * covered in `Popover.test.tsx`.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Popover } from '../Popover';

const ui = (props: Partial<React.ComponentProps<typeof Popover>> = {}) => (
  <Popover trigger={<button>Filters</button>} {...props}>
    <Popover.Header>Filter rows</Popover.Header>
    <Popover.Body>Body</Popover.Body>
  </Popover>
);

describe('Popover on the server (node environment)', () => {
  it('renders a closed popover as its trigger', () => {
    const html = renderToStaticMarkup(ui());
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('aria-controls');
    expect(html).not.toContain('role="dialog"');
  });

  it('renders an open inline panel, named by its header', () => {
    const html = renderToStaticMarkup(ui({ defaultOpen: true }));
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-expanded="true"');
    const labelledBy = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
  });

  it('leaves a portaled panel for the client', () => {
    const html = renderToStaticMarkup(
      ui({ defaultOpen: true, appendToBody: true })
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('aria-controls');
  });
});
