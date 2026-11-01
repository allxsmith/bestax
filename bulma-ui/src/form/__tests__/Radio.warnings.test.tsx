import { fireEvent, render, screen } from '@testing-library/react';
import Radio from '../Radio';
import Radios from '../Radios';

// React warns about an input going from uncontrolled to controlled once per
// file, and each test file loads its own copy of React, so this one renders
// nothing before the test that needs the warning unspent.
describe('Radio in a Radios group with only onChange', () => {
  it('logs no React warning on the first change', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <Radios onChange={() => {}}>
          <Radio value="s">Small</Radio>
          <Radio value="m" defaultChecked>
            Medium
          </Radio>
        </Radios>
      );
      fireEvent.click(screen.getByLabelText('Small'));
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
