import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectBase from '../SelectBase';
import { ConfigProvider } from '../../helpers/Config';

describe('SelectBase', () => {
  it('renders options as children', () => {
    render(
      <SelectBase>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </SelectBase>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    render(
      <SelectBase color="primary" size="large" className="custom-select">
        <option>Option</option>
      </SelectBase>
    );
    // Should have wrapper div with Bulma and custom classes
    const wrapper = screen.getByRole('combobox').closest('.select');
    expect(wrapper).toHaveClass('is-primary');
    expect(wrapper).toHaveClass('is-large');
    expect(wrapper).toHaveClass('custom-select');
  });

  it('applies is-rounded, is-loading, and is-active modifiers', () => {
    render(
      <SelectBase isRounded isLoading isActive>
        <option>Option</option>
      </SelectBase>
    );
    const wrapper = screen.getByRole('combobox').closest('.select');
    expect(wrapper).toHaveClass('is-rounded');
    expect(wrapper).toHaveClass('is-loading');
    expect(wrapper).toHaveClass('is-active');
  });

  it('sets disabled prop on select', () => {
    render(
      <SelectBase disabled>
        <option>Option</option>
      </SelectBase>
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('sets multiple and size when multipleSize is provided', () => {
    render(
      <SelectBase multiple multipleSize={4}>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </SelectBase>
    );
    const select = screen.getByRole('listbox') as HTMLSelectElement;
    expect(select.multiple).toBe(true);
    expect(select.size).toBe(4);
  });

  it('selects the correct value (uncontrolled)', () => {
    render(
      <SelectBase defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </SelectBase>
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('b');
  });

  it('calls onChange when changed', () => {
    const handleChange = jest.fn();
    render(
      <SelectBase onChange={handleChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </SelectBase>
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to select element', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <SelectBase ref={ref}>
        <option>test</option>
      </SelectBase>
    );
    // The ref should point to the <select> element directly
    expect(ref.current?.tagName.toLowerCase()).toBe('select');
  });

  it('passes other props to select', () => {
    render(
      <SelectBase data-testid="my-select">
        <option>test</option>
      </SelectBase>
    );
    expect(screen.getByTestId('my-select')).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <SelectBase>
          <option>test</option>
        </SelectBase>
      </ConfigProvider>
    );
    const select = screen.getByRole('combobox').closest('.bulma-select');
    expect(select).toBeInTheDocument();
    expect(select).not.toHaveClass('select');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <SelectBase data-testid="select">
            <option>Test</option>
          </SelectBase>
        </ConfigProvider>
      );
      const selectWrapper = screen
        .getByTestId('select')
        .closest('.bulma-select');
      expect(selectWrapper).toBeInTheDocument();
      expect(selectWrapper).toHaveClass('bulma-select');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <SelectBase data-testid="select">
          <option>Test</option>
        </SelectBase>
      );
      const selectWrapper = screen.getByTestId('select').closest('.select');
      expect(selectWrapper).toBeInTheDocument();
      expect(selectWrapper).toHaveClass('select');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <SelectBase data-testid="select">
            <option>Test</option>
          </SelectBase>
        </ConfigProvider>
      );
      const selectWrapper = screen.getByTestId('select').closest('.select');
      expect(selectWrapper).toBeInTheDocument();
      expect(selectWrapper).toHaveClass('select');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <SelectBase color="primary" isRounded m="2" data-testid="select">
            <option>Test</option>
          </SelectBase>
        </ConfigProvider>
      );
      const selectWrapper = screen
        .getByTestId('select')
        .closest('.bulma-select');
      expect(selectWrapper).toHaveClass('bulma-select');
      expect(selectWrapper).toHaveClass('bulma-is-primary');
      expect(selectWrapper).toHaveClass('bulma-is-rounded');
      expect(selectWrapper).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <SelectBase color="danger" isLoading p="3" data-testid="select">
          <option>Test</option>
        </SelectBase>
      );
      const selectWrapper = screen.getByTestId('select').closest('.select');
      expect(selectWrapper).toHaveClass('select');
      expect(selectWrapper).toHaveClass('is-danger');
      expect(selectWrapper).toHaveClass('is-loading');
      expect(selectWrapper).toHaveClass('p-3');
    });
  });
});
