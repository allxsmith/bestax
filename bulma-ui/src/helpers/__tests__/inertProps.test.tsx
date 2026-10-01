import { render } from '@testing-library/react';
import { inertProps } from '../inertProps';

describe('inertProps', () => {
  it('spells inert as a boolean for React 19 and later', () => {
    expect(inertProps(true, 19)).toEqual({ inert: true });
    expect(inertProps(true, 20)).toEqual({ inert: true });
  });

  it('spells inert as an empty string for React 18', () => {
    expect(inertProps(true, 18)).toEqual({ inert: '' });
  });

  it('adds nothing when the element is not inert', () => {
    expect(inertProps(false, 18)).toEqual({});
    expect(inertProps(false, 19)).toEqual({});
  });

  it('renders the attribute without a warning on the React in use', () => {
    // CI runs this on both majors; each one warns on the other's spelling.
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const { container } = render(<div {...inertProps(true)} />);
    expect(container.firstChild).toHaveAttribute('inert');
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
