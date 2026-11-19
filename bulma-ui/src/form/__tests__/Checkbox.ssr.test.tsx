/**
 * @vitest-environment node
 *
 * A server render of a mixed Checkbox, where `document` is genuinely
 * undefined. `indeterminate` has no attribute, so the markup can't carry it,
 * and the effect that sets it must not run or warn here. Setting it in the
 * browser is covered in `Checkbox.test.tsx`.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { Checkbox } from '../Checkbox';
import { Checkboxes } from '../Checkboxes';

describe('Checkbox on the server (node environment)', () => {
  it('renders a mixed box as plain markup, without a warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        <Checkbox indeterminate>Select all</Checkbox>
      );
      expect(html).toBe(renderToStaticMarkup(<Checkbox>Select all</Checkbox>));
      expect(html).not.toContain('indeterminate');
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it('renders the defaultChecked boxes of a group with only onChange checked, without a warning', () => {
    // The boxes render controlled before the group holds a value, and they
    // register with it in an effect, which must not run or warn here.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        <Checkboxes name="tags" onChange={() => {}}>
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
        </Checkboxes>
      );
      const [react, vue] = html.match(/<input[^>]*>/g)!;
      expect(react).toContain('value="react"');
      expect(react).toContain('checked=""');
      expect(vue).toContain('value="vue"');
      expect(vue).not.toContain('checked');
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
