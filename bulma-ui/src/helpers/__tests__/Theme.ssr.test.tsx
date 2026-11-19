/**
 * @vitest-environment node
 *
 * SSR coverage for Theme. Root Themes share a `<style>` element through a
 * module-level registry (#736), and the element and the scheme attribute are
 * only ever touched from an effect, which a server render never runs. This runs where `document` is
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

  it('writes before paint in the browser without a server warning', () => {
    // The root rules and the scheme go in from a layout effect in the
    // browser (#1184). React warns about a layout effect in a server render,
    // so the server must be handed a plain one.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        <Theme
          isRoot
          colorMode="dark"
          bulmaVars={{
            '--bulma-primary-invert-l': '5%',
            '--bulma-primary-on-scheme-l': { light: '21%', dark: '41%' },
          }}
        >
          <span>content</span>
        </Theme>
      );
      expect(html).toBe('<span>content</span>');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it('leaves a value per scheme out of a scoped Theme it renders', () => {
    const html = renderToStaticMarkup(
      <Theme
        bulmaVars={{
          '--bulma-primary-invert-l': '5%',
          '--bulma-primary-on-scheme-l': { dark: '41%' },
        }}
      >
        content
      </Theme>
    );
    expect(html).toBe('<div style="--bulma-primary-invert-l:5%">content</div>');
  });
});
