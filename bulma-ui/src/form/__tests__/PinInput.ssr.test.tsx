/**
 * @vitest-environment node
 *
 * A server render of a PinInput, where `document` is genuinely undefined. The
 * markup carries the whole field, the input with the code and a box for each
 * character, so it works before the script loads, and the effects that follow
 * the selection must not run or warn here.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { PinInput } from '../PinInput';

describe('PinInput on the server (node environment)', () => {
  it('renders the input and its boxes as plain markup, without a warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        <PinInput label="Code" name="otp" length={4} defaultValue="12" />
      );
      expect(html).toMatch(/<label[^>]*class="label"[^>]*>Code<\/label>/);
      expect(html).toContain('name="otp"');
      expect(html).toContain('value="12"');
      expect(html).toContain('maxLength="4"');
      expect(html).toContain('inputMode="numeric"');
      expect(html).toContain('autoComplete="one-time-code"');
      expect(html).toContain('dir="ltr"');
      const boxes = html.match(/<div aria-hidden="true" class="[^"]*">/g);
      expect(boxes).toHaveLength(4);
      expect(boxes![0]).toContain('class="input pin-input-box"');
      expect(html).not.toContain('is-focused');
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
