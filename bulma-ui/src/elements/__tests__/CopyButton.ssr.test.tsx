/**
 * @vitest-environment node
 *
 * SSR coverage for CopyButton and useClipboard, where `document` is genuinely
 * undefined: a regression that read the clipboard or the DOM during a server
 * render fails here instead of passing by accident under jsdom.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { CopyButton } from '../CopyButton';
import { useClipboard } from '../../helpers/useClipboard';

describe('CopyButton on the server (node environment)', () => {
  it('renders the button with "Copy", and no status region', () => {
    const html = renderToStaticMarkup(<CopyButton value="https://bestax.io" />);
    expect(html).toMatch(/^<button class="button" type="button">/);
    expect(html).toContain('<span class="icon" aria-hidden="true"><svg');
    expect(html).toContain('<span>Copy</span>');
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('bestax.io');
  });

  it('renders the icon-only form named "Copy"', () => {
    const html = renderToStaticMarkup(
      <CopyButton value="x" showLabel={false} />
    );
    expect(html).toContain('aria-label="Copy"');
    expect(html).toContain('class="button icon-button"');
  });

  it('renders a component using the hook, not copied', () => {
    const Probe = () => {
      const { copied, error } = useClipboard();
      return <span>{`${copied} ${error}`}</span>;
    };
    expect(renderToStaticMarkup(<Probe />)).toBe('<span>false null</span>');
  });
});
