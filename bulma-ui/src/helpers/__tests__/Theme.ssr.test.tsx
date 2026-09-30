/**
 * @jest-environment node
 *
 * SSR coverage for Theme. Root Themes share a `<style>` element through a
 * module-level registry (#736), and the element is only ever touched from an
 * effect, which a server render never runs. This runs where `document` is
 * genuinely undefined, so a regression that reached for the DOM during render
 * fails here instead of passing by accident under jsdom.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { Theme } from '../Theme';

describe('Theme SSR (node environment)', () => {
  it('renders nested root Themes without touching the document', () => {
    const html = renderToStaticMarkup(
      <Theme isRoot primaryH="1">
        <Theme isRoot primaryH="2">
          <span>content</span>
        </Theme>
      </Theme>
    );
    expect(html).toBe('<span>content</span>');
  });

  it('still renders a scoped Theme with its variables inline', () => {
    const html = renderToStaticMarkup(<Theme primaryH="3">content</Theme>);
    expect(html).toBe('<div style="--bulma-primary-h:3">content</div>');
  });
});
