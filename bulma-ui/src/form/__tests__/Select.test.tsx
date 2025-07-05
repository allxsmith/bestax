import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from '../Select';

describe('Select', () => {
  it('renders options as children', () => {
    render(
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <Select color="primary" size="large" className="custom-select">
        <option>Option</option>
      </Select>
    );
    // Should have wrapper div with Bulma and custom classes
    const wrapper = container.querySelector('.select');
    expect(wrapper).toHaveClass('is-primary');
    expect(wrapper).toHaveClass('is-large');
    expect(wrapper).toHaveClass('custom-select');
  });

  it('applies is-rounded, is-loading, and is-active modifiers', () => {
    const { container } = render(
      <Select isRounded isLoading isActive>
        <option>Option</option>
      </Select>
    );
    const wrapper = container.querySelector('.select');
    expect(wrapper).toHaveClass('is-rounded');
    expect(wrapper).toHaveClass('is-loading');
    expect(wrapper).toHaveClass('is-active');
  });

  it('sets disabled prop on select', () => {
    render(
      <Select disabled>
        <option>Option</option>
      </Select>
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('sets multiple and size when multipleSize is provided', () => {
    render(
      <Select multiple multipleSize={4}>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </Select>
    );
    const select = screen.getByRole('listbox') as HTMLSelectElement;
    expect(select.multiple).toBe(true);
    expect(select.size).toBe(4);
  });

  it('selects the correct value (uncontrolled)', () => {
    render(
      <Select defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('b');
  });

  it('calls onChange when changed', () => {
    const handleChange = jest.fn();
    render(
      <Select onChange={handleChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to select element', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select ref={ref}>
        <option>test</option>
      </Select>
    );
    // The ref should point to the <select> element directly
    expect(ref.current?.tagName.toLowerCase()).toBe('select');
  });

  it('passes other props to select', () => {
    render(
      <Select data-testid="my-select">
        <option>test</option>
      </Select>
    );
    expect(screen.getByTestId('my-select')).toBeInTheDocument();
  });
});
