/**
 * @jest-environment node
 *
 * SSR coverage for HoverCard, where `document` is genuinely undefined: a
 * regression that measured, listened or portaled during a server render fails
 * here instead of passing by accident under jsdom. Hydrating that markup is
 * covered in `HoverCard.test.tsx`.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HoverCard } from '../HoverCard';

const ui = (props: Partial<React.ComponentProps<typeof HoverCard>> = {}) => (
  <HoverCard trigger={<a href="/people/ada">Ada Lovelace</a>} {...props}>
    <a href="/people/ada">View profile</a>
  </HoverCard>
);

describe('HoverCard on the server (node environment)', () => {
  it('renders a closed card as its trigger in the wrapper and nothing else', () => {
    const html = renderToStaticMarkup(ui());
    expect(html).toBe(
      '<span class="hover-card"><a href="/people/ada" aria-expanded="false">Ada Lovelace</a></span>'
    );
  });

  it('renders an open inline card after the trigger, named in aria-controls', () => {
    const html = renderToStaticMarkup(ui({ defaultOpen: true }));
    expect(html).toContain('aria-expanded="true"');
    const controls = html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain(`<div id="${controls}"`);
    expect(html).toContain('hover-card-content');
    expect(html).not.toContain('role=');
    expect(html).not.toContain('aria-haspopup');
  });

  it('leaves a portaled card for the client', () => {
    const html = renderToStaticMarkup(
      ui({ defaultOpen: true, appendToBody: true })
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain('aria-controls');
    expect(html).not.toContain('hover-card-content');
  });
});
