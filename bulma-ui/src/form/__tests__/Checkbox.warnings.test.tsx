import { render } from '@testing-library/react';
import Checkbox from '../Checkbox';

// React warns about an unknown attribute once per name, so a render earlier
// in the same file could use the warning up. Each test file loads its own
// copy of React, so this one renders nothing before the test that needs the
// warning unspent.
describe('Checkbox indeterminate', () => {
  it('logs no React warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { rerender } = render(<Checkbox indeterminate>Mixed</Checkbox>);
      rerender(<Checkbox indeterminate={false}>Mixed</Checkbox>);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
