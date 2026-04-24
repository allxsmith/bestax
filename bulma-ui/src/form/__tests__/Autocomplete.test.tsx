import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Autocomplete } from '../Autocomplete';
import { Field } from '../Field';

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
      expect(container.querySelector('.autocomplete')).toHaveClass(
        'autocomplete'
      );
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
      expect(container.querySelector('.autocomplete')).toHaveClass('is-small');
      expect(screen.getByRole('combobox')).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(
        <Autocomplete data={fruits} size="medium" />
      );
      expect(container.querySelector('.autocomplete')).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(<Autocomplete data={fruits} size="large" />);
      expect(container.querySelector('.autocomplete')).toHaveClass('is-large');
    });
  });

  describe('Custom Template', () => {
    it('renders custom item template', () => {
      render(
        <Autocomplete
          data={countries}
          field="label"
          itemTemplate={item => (
            <span data-testid="custom">
              {(item as { label: string }).label}
            </span>
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

    it('supports callback refs', () => {
      const refCallback = jest.fn();
      render(<Autocomplete data={fruits} ref={refCallback} />);
      expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });

  describe('ArrowDown opens closed dropdown', () => {
    it('opens dropdown on ArrowDown when closed (without openOnFocus)', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      // Dropdown is closed initially (no openOnFocus, no input value)
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Infinite Scroll', () => {
    it('calls onInfiniteScroll when scrolled near bottom', () => {
      const onInfiniteScroll = jest.fn();
      render(
        <Autocomplete
          data={fruits}
          checkInfiniteScroll
          infiniteScrollDistance={50}
          onInfiniteScroll={onInfiniteScroll}
        />
      );
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'a' } });

      const listbox = screen.getByRole('listbox');

      // Force the dropdown div's scroll metrics so the threshold triggers.
      Object.defineProperty(listbox, 'scrollHeight', {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(listbox, 'clientHeight', {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(listbox, 'scrollTop', {
        configurable: true,
        writable: true,
        value: 260, // 500 - 260 - 200 = 40 <= 50 -> triggers
      });

      fireEvent.scroll(listbox);

      expect(onInfiniteScroll).toHaveBeenCalled();
    });

    it('does not call onInfiniteScroll when far from bottom', () => {
      const onInfiniteScroll = jest.fn();
      render(
        <Autocomplete
          data={fruits}
          checkInfiniteScroll
          infiniteScrollDistance={50}
          onInfiniteScroll={onInfiniteScroll}
        />
      );
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'a' } });

      const listbox = screen.getByRole('listbox');
      Object.defineProperty(listbox, 'scrollHeight', {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(listbox, 'clientHeight', {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(listbox, 'scrollTop', {
        configurable: true,
        writable: true,
        value: 0, // 500 - 0 - 200 = 300 > 50 -> no trigger
      });

      fireEvent.scroll(listbox);

      expect(onInfiniteScroll).not.toHaveBeenCalled();
    });

    it('does nothing when checkInfiniteScroll is disabled', () => {
      const onInfiniteScroll = jest.fn();
      render(
        <Autocomplete data={fruits} onInfiniteScroll={onInfiniteScroll} />
      );
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'a' } });

      const listbox = screen.getByRole('listbox');
      fireEvent.scroll(listbox);

      expect(onInfiniteScroll).not.toHaveBeenCalled();
    });
  });

  describe('ScrollIntoView', () => {
    it('calls scrollIntoView when highlight changes', () => {
      const scrollIntoViewMock = jest.fn();
      // Stub scrollIntoView on the prototype so JSDOM picks it up for all anchors.
      const original = (
        HTMLElement.prototype as unknown as { scrollIntoView: () => void }
      ).scrollIntoView;
      (
        HTMLElement.prototype as unknown as { scrollIntoView: () => void }
      ).scrollIntoView = scrollIntoViewMock;

      try {
        render(<Autocomplete data={fruits} />);
        const input = screen.getByRole('combobox');

        fireEvent.change(input, { target: { value: 'a' } });
        fireEvent.keyDown(input, { key: 'ArrowDown' });

        expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'nearest' });
      } finally {
        (
          HTMLElement.prototype as unknown as { scrollIntoView: () => void }
        ).scrollIntoView = original;
      }
    });
  });

  describe('Disabled item interactions', () => {
    it('does not change highlight on mouse-enter of disabled item', () => {
      const dataWithDisabled = [
        { value: 'a', label: 'Apple', disabled: true },
        { value: 'b', label: 'Banana' },
      ];
      render(<Autocomplete data={dataWithDisabled} field="label" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      const apple = screen.getByRole('option', { name: 'Apple' });

      // Mouse enter on disabled item should be a no-op
      fireEvent.mouseEnter(apple);

      expect(apple).not.toHaveClass('is-active');
    });

    it('changes highlight on mouse-enter of enabled item', () => {
      const dataWithDisabled = [
        { value: 'a', label: 'Apple', disabled: true },
        { value: 'b', label: 'Banana' },
      ];
      render(<Autocomplete data={dataWithDisabled} field="label" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'b' } });

      const banana = screen.getByRole('option', { name: 'Banana' });
      fireEvent.mouseEnter(banana);

      expect(banana).toHaveClass('is-active');
    });
  });

  describe('Inside Field', () => {
    it('renders without inner Field when wrapped in Field', () => {
      const { container } = render(
        <Field label="Wrapper">
          <Autocomplete data={fruits} message="A message" />
        </Field>
      );

      // Should only have one .field (the outer Field), not a nested one.
      expect(container.querySelectorAll('.field').length).toBe(1);
      expect(screen.getByText('A message')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Branch coverage', () => {
    it('renders with no data prop (default empty array)', () => {
      // Cast to bypass required-prop type check since we're testing the default.
      const Comp = Autocomplete as unknown as React.ComponentType<
        Record<string, unknown>
      >;
      render(<Comp />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('falls back to value when field key is missing', () => {
      const data = [{ value: 'fallback-value' }];
      render(<Autocomplete data={data} field="label" />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'fall' } });

      expect(
        screen.getByRole('option', { name: 'fallback-value' })
      ).toBeInTheDocument();
    });

    it('returns empty string when field and value are both missing', () => {
      const data = [{ foo: 'bar' } as unknown as { label: string }];
      render(<Autocomplete data={data} field="label" />);
      const input = screen.getByRole('combobox');

      // Open dropdown via keyboard so we don't filter anything out
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Empty string display value -> option exists with empty name
      expect(screen.getAllByRole('option').length).toBe(1);
    });

    it('does not open dropdown when input change has empty newValue', () => {
      const onInput = jest.fn();
      // Controlled with current value 'x', dispatch a change to '' -> branch !isActive && !newValue is false-side
      render(<Autocomplete data={fruits} value="x" onInput={onInput} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: '' } });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onInput).toHaveBeenCalledWith('');
    });

    it('does not update internal value on selection when controlled', () => {
      const onSelect = jest.fn();
      const onInput = jest.fn();
      render(
        <Autocomplete
          data={fruits}
          value="a"
          onSelect={onSelect}
          onInput={onInput}
        />
      );
      const input = screen.getByRole('combobox');

      // Open dropdown via keyboard since value is already 'a' (no change event would fire)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(onSelect).toHaveBeenCalledWith('Apple');
      // Controlled value remains 'a' — internal state did not override it.
      expect(input).toHaveValue('a');
    });

    it('does not update internal value on clear when controlled', () => {
      const onInput = jest.fn();
      const onSelect = jest.fn();
      render(
        <Autocomplete
          data={fruits}
          value="something"
          clearable
          onInput={onInput}
          onSelect={onSelect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

      expect(onInput).toHaveBeenCalledWith('');
      expect(onSelect).toHaveBeenCalledWith(null);
      // Value stays 'something' because parent controls it.
      expect(screen.getByRole('combobox')).toHaveValue('something');
    });

    it('closes on click outside without selecting when no item is highlighted (selectOnClickOutside)', () => {
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
      // No ArrowDown -> highlightedIndex stays at -1
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('caps ArrowDown at last item', () => {
      render(<Autocomplete data={['One', 'Two']} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // should stay at last

      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveClass('is-active');
    });

    it('does not move on ArrowUp when no item is highlighted', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // highlight stays at -1

      const options = screen.getAllByRole('option');
      options.forEach(opt => expect(opt).not.toHaveClass('is-active'));
    });

    it('does nothing on Enter when no item is highlighted', () => {
      const onSelect = jest.fn();
      render(<Autocomplete data={fruits} onSelect={onSelect} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('closes on Tab without selecting when no item is highlighted', () => {
      const onSelect = jest.fn();
      render(<Autocomplete data={fruits} onSelect={onSelect} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not throw when onInfiniteScroll callback is omitted', () => {
      render(<Autocomplete data={fruits} checkInfiniteScroll />);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'a' } });

      const listbox = screen.getByRole('listbox');
      Object.defineProperty(listbox, 'scrollHeight', {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(listbox, 'clientHeight', {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(listbox, 'scrollTop', {
        configurable: true,
        writable: true,
        value: 260,
      });

      expect(() => fireEvent.scroll(listbox)).not.toThrow();
    });

    it('returns early in handleSelect when item is disabled (via Enter w/ keepFirst)', () => {
      const onSelect = jest.fn();
      const data = [
        { value: 'a', label: 'Apple', disabled: true },
        { value: 'b', label: 'Banana' },
      ];
      // keepFirst highlights index 0 even though it's disabled.
      // Pressing Enter calls handleSelect with the disabled item.
      render(
        <Autocomplete data={data} field="label" keepFirst onSelect={onSelect} />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      // First item (disabled) is highlighted via keepFirst. Press Enter.
      fireEvent.keyDown(input, { key: 'Enter' });

      // handleSelect returned early -> onSelect not called
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('handles clear without onInput / onSelect callbacks (optional chains)', () => {
      // No onInput, no onSelect -> exercises the falsy side of `onInput?.` and `onSelect?.`
      render(<Autocomplete data={fruits} clearable />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'test' } });
      expect(() =>
        fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
      ).not.toThrow();
    });

    it('handles click outside but inside autocomplete container does not close', () => {
      render(
        <div>
          <Autocomplete data={fruits} />
        </div>
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Click on an element INSIDE the autocomplete (the input itself).
      // This exercises the `if (!isInside)` falsy branch of click-outside listener.
      fireEvent.mouseDown(input);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('caps ArrowDown at last item (final cap branch)', () => {
      render(<Autocomplete data={['One', 'Two']} openOnFocus />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);
      // From -1 -> 0 -> 1 -> 1 (cap)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // cap branch

      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveClass('is-active');
    });
  });
});
