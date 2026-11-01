import { fireEvent, render, screen } from '@testing-library/react';
import Checkbox from '../Checkbox';
import Checkboxes from '../Checkboxes';

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

// React warns about an input going from uncontrolled to controlled once per
// file too, so nothing above changes one.
describe('Checkbox in a Checkboxes group with only onChange', () => {
  it('logs no React warning on the first change', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <Checkboxes name="tags" onChange={() => {}}>
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
        </Checkboxes>
      );
      fireEvent.click(screen.getByLabelText('Vue'));
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
