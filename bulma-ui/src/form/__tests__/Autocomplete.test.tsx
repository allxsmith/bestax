import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Autocomplete } from '../Autocomplete';

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
];

describe('Autocomplete', () => {
  describe('Rendering', () => {
    it('renders an input element', () => {
      render(<Autocomplete data={fruits} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Autocomplete data={fruits} placeholder="Search..." />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with autocomplete class', () => {
      const { container } = render(<Autocomplete data={fruits} />);
      expect(container.firstChild).toHaveClass('autocomplete');
    });

    it('does not show dropdown initially', () => {
      render(<Autocomplete data={fruits} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('shows dropdown when typing', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('filters options based on input', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'ban' } });

      expect(
        screen.getByRole('option', { name: 'Banana' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: 'Apple' })
      ).not.toBeInTheDocument();
    });

    it('filters case-insensitively', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'APPLE' } });

      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });

    it('shows empty content when no matches', () => {
      render(<Autocomplete data={fruits} empty="No results" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'xyz' } });

      expect(screen.getByText('No results')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('calls onSelect when item is clicked', () => {
      const onSelect = jest.fn();
      render(<Autocomplete data={fruits} onSelect={onSelect} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'app' } });
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(onSelect).toHaveBeenCalledWith('Apple');
    });

    it('updates input value on selection', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'app' } });
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(input).toHaveValue('Apple');
    });

    it('closes dropdown on selection by default', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'app' } });
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('keeps dropdown open when keepOpen is true', () => {
      render(<Autocomplete data={fruits} keepOpen />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Object Data', () => {
    it('displays label from object data', () => {
      render(<Autocomplete data={countries} field="label" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'can' } });

      expect(
        screen.getByRole('option', { name: 'Canada' })
      ).toBeInTheDocument();
    });

    it('returns object on selection', () => {
      const onSelect = jest.fn();
      render(
        <Autocomplete data={countries} field="label" onSelect={onSelect} />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'can' } });
      fireEvent.click(screen.getByRole('option', { name: 'Canada' }));

      expect(onSelect).toHaveBeenCalledWith(countries[1]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown on ArrowDown', () => {
      render(<Autocomplete data={fruits} openOnFocus />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('highlights next item on ArrowDown', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('highlights previous item on ArrowUp', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('selects highlighted item on Enter', () => {
      const onSelect = jest.fn();
      render(<Autocomplete data={fruits} onSelect={onSelect} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalled();
    });

    it('closes dropdown on Escape', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects on Tab when item is highlighted', () => {
      const onSelect = jest.fn();
      render(<Autocomplete data={fruits} onSelect={onSelect} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Keep First', () => {
    it('highlights first item when keepFirst is true', () => {
      render(<Autocomplete data={fruits} keepFirst />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });
  });

  describe('Open On Focus', () => {
    it('opens dropdown when focused with openOnFocus', () => {
      render(<Autocomplete data={fruits} openOnFocus />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('does not open when disabled', () => {
      render(<Autocomplete data={fruits} openOnFocus disabled />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Clearable', () => {
    it('shows clear button when clearable and has value', () => {
      render(<Autocomplete data={fruits} clearable />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('does not show clear button when empty', () => {
      render(<Autocomplete data={fruits} clearable />);
      expect(
        screen.queryByRole('button', { name: 'Clear' })
      ).not.toBeInTheDocument();
    });

    it('clears input when clear button is clicked', () => {
      const onInput = jest.fn();
      const onSelect = jest.fn();
      render(
        <Autocomplete
          data={fruits}
          clearable
          onInput={onInput}
          onSelect={onSelect}
        />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

      expect(onInput).toHaveBeenLastCalledWith('');
      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('does not show clear button when disabled', () => {
      render(<Autocomplete data={fruits} clearable disabled />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(
        screen.queryByRole('button', { name: 'Clear' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading', () => {
    it('shows loading state', () => {
      const { container } = render(<Autocomplete data={fruits} loading />);
      expect(container.querySelector('.is-loading')).toBeInTheDocument();
    });
  });

  describe('Disabled', () => {
    it('disables the input', () => {
      render(<Autocomplete data={fruits} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('does not respond to keyboard when disabled', () => {
      render(<Autocomplete data={fruits} disabled />);
      const input = screen.getByRole('combobox');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Colors', () => {
    it('applies color class to input', () => {
      render(<Autocomplete data={fruits} color="primary" />);
      expect(screen.getByRole('combobox')).toHaveClass('is-primary');
    });

    it('applies danger color', () => {
      render(<Autocomplete data={fruits} color="danger" />);
      expect(screen.getByRole('combobox')).toHaveClass('is-danger');
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      const { container } = render(<Autocomplete data={fruits} size="small" />);
      expect(container.firstChild).toHaveClass('is-small');
      expect(screen.getByRole('combobox')).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(
        <Autocomplete data={fruits} size="medium" />
      );
      expect(container.firstChild).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(<Autocomplete data={fruits} size="large" />);
      expect(container.firstChild).toHaveClass('is-large');
    });
  });

  describe('Custom Template', () => {
    it('renders custom item template', () => {
      render(
        <Autocomplete
          data={countries}
          field="label"
          itemTemplate={item => (
            <span data-testid="custom">{(item as any).label}</span>
          )}
        />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'can' } });

      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });
  });

  describe('Header and Footer', () => {
    it('renders header in dropdown', () => {
      render(
        <Autocomplete data={fruits} openOnFocus header={<span>Header</span>} />
      );
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('renders footer in dropdown', () => {
      render(
        <Autocomplete data={fruits} openOnFocus footer={<span>Footer</span>} />
      );
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Disabled Items', () => {
    it('does not select disabled items', () => {
      const dataWithDisabled = [
        { value: 'a', label: 'Apple', disabled: true },
        { value: 'b', label: 'Banana' },
      ];
      const onSelect = jest.fn();
      render(
        <Autocomplete
          data={dataWithDisabled}
          field="label"
          onSelect={onSelect}
        />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('applies disabled class to disabled items', () => {
      const dataWithDisabled = [{ value: 'a', label: 'Apple', disabled: true }];
      render(<Autocomplete data={dataWithDisabled} field="label" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(screen.getByRole('option', { name: 'Apple' })).toHaveClass(
        'is-disabled'
      );
    });
  });

  describe('Click Outside', () => {
    it('closes dropdown on click outside', () => {
      render(
        <div>
          <Autocomplete data={fruits} />
          <button>Outside</button>
        </div>
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects highlighted on click outside when selectOnClickOutside is true', () => {
      const onSelect = jest.fn();
      render(
        <div>
          <Autocomplete
            data={fruits}
            onSelect={onSelect}
            selectOnClickOutside
          />
          <button>Outside</button>
        </div>
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Controlled Value', () => {
    it('uses controlled value', () => {
      render(<Autocomplete data={fruits} value="Test" />);
      expect(screen.getByRole('combobox')).toHaveValue('Test');
    });

    it('calls onInput when value changes', () => {
      const onInput = jest.fn();
      render(<Autocomplete data={fruits} value="" onInput={onInput} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'new' } });

      expect(onInput).toHaveBeenCalledWith('new');
    });
  });

  describe('Accessibility', () => {
    it('has combobox role', () => {
      render(<Autocomplete data={fruits} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('has aria-expanded attribute', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      expect(input).toHaveAttribute('aria-expanded', 'false');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-haspopup attribute', () => {
      render(<Autocomplete data={fruits} />);
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-haspopup',
        'listbox'
      );
    });

    it('has aria-autocomplete attribute', () => {
      render(<Autocomplete data={fruits} />);
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-autocomplete',
        'list'
      );
    });

    it('has listbox role on dropdown', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('has option role on items', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });

    it('has aria-selected on highlighted item', () => {
      render(<Autocomplete data={fruits} keepFirst />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('has aria-disabled on disabled items', () => {
      const dataWithDisabled = [{ value: 'a', label: 'Apple', disabled: true }];
      render(<Autocomplete data={dataWithDisabled} field="label" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(screen.getByRole('option')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });
  });

  describe('Callbacks', () => {
    it('calls onActiveChange when dropdown opens', () => {
      const onActiveChange = jest.fn();
      render(<Autocomplete data={fruits} onActiveChange={onActiveChange} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('calls onActiveChange when dropdown closes', () => {
      const onActiveChange = jest.fn();
      render(<Autocomplete data={fruits} onActiveChange={onActiveChange} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onActiveChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Autocomplete data={fruits} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
