import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Autocomplete, AutocompleteItem } from '../Autocomplete';
import { Field } from '../Field';
import { Control } from '../Control';

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
];

/**
 * Each id reference under `root` that names no element in the document, as
 * `attribute=id`, so a reference left pointing at nothing shows up by name.
 */
const danglingIdRefs = (root: HTMLElement): string[] => {
  const attributes = [
    'aria-labelledby',
    'aria-describedby',
    'aria-controls',
    'aria-activedescendant',
    'for',
  ];
  return Array.from(root.querySelectorAll('*')).flatMap(el =>
    attributes.flatMap(attribute =>
      (el.getAttribute(attribute) ?? '')
        .split(/\s+/)
        .filter(id => id && !document.getElementById(id))
        .map(id => `${attribute}=${id}`)
    )
  );
};

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

    it('reaches the clear button by keyboard and clears with Enter or Space', async () => {
      const user = userEvent.setup();
      const onInput = jest.fn();
      render(<Autocomplete data={fruits} clearable onInput={onInput} />);
      const input = screen.getByRole('combobox');

      for (const key of ['{Enter}', ' ']) {
        await user.type(input, 'ap');
        await user.tab();
        expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus();
        await user.keyboard(key);
        expect(onInput).toHaveBeenLastCalledWith('');
        expect(input).toHaveValue('');
        expect(input).toHaveFocus();
      }
    });

    it('does not show clear button when disabled', () => {
      render(<Autocomplete data={fruits} clearable disabled />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(
        screen.queryByRole('button', { name: 'Clear' })
      ).not.toBeInTheDocument();
    });

    it('gives way to the loading spinner of a Control it sits in', () => {
      const autocomplete = (
        <Autocomplete data={fruits} value="Apple" clearable />
      );
      const wrappers = {
        'Field > Control': (isLoading: boolean) => (
          <Field>
            <Control isLoading={isLoading}>{autocomplete}</Control>
          </Field>
        ),
        'bare Control': (isLoading: boolean) => (
          <Control isLoading={isLoading}>{autocomplete}</Control>
        ),
      };
      for (const [name, wrap] of Object.entries(wrappers)) {
        const loading = render(wrap(true));
        expect({
          name,
          clear: loading.queryByRole('button', { name: 'Clear' }),
        }).toEqual({ name, clear: null });
        loading.unmount();

        const idle = render(wrap(false));
        expect(idle.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
        idle.unmount();
      }
    });

    it('gives way to its own loading spinner, which sits in the same spot', () => {
      render(<Autocomplete data={fruits} value="Apple" clearable loading />);
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

    it('points the combobox at its listbox with aria-controls', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'a' } });
      const listbox = screen.getByRole('listbox');
      expect(listbox.id).toBeTruthy();
      expect(input).toHaveAttribute('aria-controls', listbox.id);
    });

    it('keeps aria-expanded false while no list is on screen', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'zzz' } });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('leaves aria-controls off while no list is on screen, so it never dangles', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');
      expect(input).not.toHaveAttribute('aria-controls');
      fireEvent.change(input, { target: { value: 'zzz' } });
      expect(input).not.toHaveAttribute('aria-controls');
      fireEvent.change(input, { target: { value: 'a' } });
      expect(input).toHaveAttribute(
        'aria-controls',
        screen.getByRole('listbox').id
      );
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(input).not.toHaveAttribute('aria-controls');
    });

    it('points aria-activedescendant at the highlighted option', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'a' } });
      expect(input).not.toHaveAttribute('aria-activedescendant');

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const second = screen.getAllByRole('option')[1];
      expect(second).toHaveAttribute('aria-selected', 'true');
      expect(input).toHaveAttribute('aria-activedescendant', second.id);

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('drops aria-activedescendant when filtering leaves the highlight behind', () => {
      render(<Autocomplete data={fruits} />);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'e' } });
      for (let i = 0; i < 4; i++) {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      }
      expect(input).toHaveAttribute('aria-activedescendant');
      // "err" leaves two options, so the fourth-place highlight points past them.
      fireEvent.change(input, { target: { value: 'err' } });
      expect(screen.getAllByRole('option')).toHaveLength(2);
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    // The label that names the input names the list too, whichever renders
    // it: the Autocomplete's own `label` or a Field's label around it, so
    // both go through the same cases. Each builds an Autocomplete labelled
    // `name`, passing `labelProps` to whichever renders the label.
    type LabelledUi = (
      name: string,
      labelProps?: { id: string }
    ) => React.ReactElement;
    const labelSources: Array<[string, LabelledUi]> = [
      [
        'its own label prop',
        (name, labelProps) => (
          <Autocomplete data={fruits} label={name} labelProps={labelProps} />
        ),
      ],
      [
        'its own label wired by hand to its own id',
        (name, labelProps) => (
          <Autocomplete
            data={fruits}
            id={`${name}-input`}
            label={name}
            labelProps={{ htmlFor: `${name}-input`, ...labelProps }}
          />
        ),
      ],
      [
        "a surrounding Field's label",
        (name, labelProps) => (
          <Field label={name} labelProps={labelProps}>
            <Autocomplete data={fruits} />
          </Field>
        ),
      ],
      [
        "a Field's label over its own dropped one",
        (name, labelProps) => (
          <Field label={name} labelProps={labelProps}>
            <Autocomplete data={fruits} label="Dropped" />
          </Field>
        ),
      ],
      [
        "a Field's label through a Control",
        (name, labelProps) => (
          <Field label={name} labelProps={labelProps}>
            <Control>
              <Autocomplete data={fruits} />
            </Control>
          </Field>
        ),
      ],
    ];

    const openList = (combobox: HTMLElement) =>
      fireEvent.change(combobox, { target: { value: 'a' } });

    it.each(labelSources)('names the listbox by %s', (_source, ui) => {
      render(ui('Fruit'));
      openList(screen.getByRole('combobox', { name: 'Fruit' }));
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAccessibleName('Fruit');
      expect(listbox).not.toHaveAttribute('aria-label');
      // The id it points at is the rendered label's own.
      const label = document.getElementById(
        listbox.getAttribute('aria-labelledby') ?? ''
      );
      expect(label?.tagName).toBe('LABEL');
      expect(label).toHaveTextContent('Fruit');
    });

    it.each(labelSources)(
      'names the listbox through a labelProps id of your own on %s',
      (_source, ui) => {
        render(ui('Fruit', { id: 'fruit-label' }));
        openList(screen.getByRole('combobox', { name: 'Fruit' }));
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('aria-labelledby', 'fruit-label');
        expect(listbox).toHaveAccessibleName('Fruit');
      }
    );

    it.each(labelSources)('tells two lists apart by %s', (_source, ui) => {
      render(
        <>
          {ui('Country')}
          {ui('City')}
        </>
      );
      const [country, city] = screen.getAllByRole('combobox');
      openList(country);
      openList(city);
      expect(
        screen.getByRole('listbox', { name: 'Country' })
      ).toBeInTheDocument();
      expect(screen.getByRole('listbox', { name: 'City' })).toBeInTheDocument();
    });

    it.each(labelSources)(
      'points at no missing id as the list opens and closes, labelled by %s',
      (_source, ui) => {
        const { container } = render(ui('Fruit'));
        const combobox = screen.getByRole('combobox');
        expect(danglingIdRefs(container)).toEqual([]);
        openList(combobox);
        fireEvent.keyDown(combobox, { key: 'ArrowDown' });
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby');
        expect(combobox).toHaveAttribute('aria-activedescendant');
        expect(danglingIdRefs(container)).toEqual([]);
        fireEvent.keyDown(combobox, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(danglingIdRefs(container)).toEqual([]);
      }
    );

    it.each([
      ['with no label', <Autocomplete key="bare" data={fruits} />],
      [
        'under its own label opted out of the association',
        <Autocomplete
          key="own-opt-out"
          data={fruits}
          label="Fruit"
          labelProps={{ htmlFor: undefined }}
        />,
      ],
      [
        'under its own label wired to another control',
        <Autocomplete
          key="own-elsewhere"
          data={fruits}
          label="Fruit"
          labelProps={{ htmlFor: 'other' }}
        />,
      ],
      [
        "with an id of its own that a Field's label misses",
        <Field key="own-id" label="Fruit">
          <Autocomplete id="mine" data={fruits} />
        </Field>,
      ],
      [
        'in a grouped Field',
        <Field key="grouped" label="Fruit" grouped>
          <Autocomplete data={fruits} />
        </Field>,
      ],
      [
        'in a Field with addons',
        <Field key="addons" label="Fruit" hasAddons>
          <Autocomplete data={fruits} />
        </Field>,
      ],
      [
        'in a Field whose label opts out of the association',
        <Field key="opt-out" label="Fruit" labelProps={{ htmlFor: undefined }}>
          <Autocomplete data={fruits} />
        </Field>,
      ],
      [
        'in an unlabelled Field inside a labelled one',
        <Field key="nested" label="Fruit">
          <Field>
            <Autocomplete data={fruits} />
          </Field>
        </Field>,
      ],
    ])(
      'keeps the fallback name when no label names the input, %s',
      (_name, ui) => {
        render(ui);
        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAccessibleName('');
        openList(combobox);
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAccessibleName('Suggestions');
        expect(listbox).not.toHaveAttribute('aria-labelledby');
      }
    );

    it('keeps the fallback name under a Field label wired by hand, which has no id to point at', () => {
      const { container } = render(
        <Field label="Fruit" labelProps={{ htmlFor: 'fruit' }}>
          <Autocomplete id="fruit" data={fruits} />
        </Field>
      );
      const combobox = screen.getByRole('combobox', { name: 'Fruit' });
      expect(container.querySelector('label')).not.toHaveAttribute('id');
      openList(combobox);
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAccessibleName('Suggestions');
      expect(listbox).not.toHaveAttribute('aria-labelledby');
    });

    it('gives each Autocomplete its own listbox id', () => {
      render(
        <>
          <Autocomplete data={fruits} />
          <Autocomplete data={fruits} />
        </>
      );
      const [a, b] = screen.getAllByRole('combobox');
      fireEvent.change(a, { target: { value: 'a' } });
      fireEvent.change(b, { target: { value: 'a' } });
      const [listA, listB] = screen.getAllByRole('listbox');
      expect(a).toHaveAttribute('aria-controls', listA.id);
      expect(b).toHaveAttribute('aria-controls', listB.id);
      expect(listA.id).not.toBe(listB.id);
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
      // Neither `field` nor `value` is present — which `AutocompleteItem`
      // forbids, and which is exactly the fallback under test.
      const data = [{ foo: 'bar' }] as unknown as AutocompleteItem[];
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

describe('Autocomplete label association (#493)', () => {
  it('associates the label with the inner input via htmlFor/id', () => {
    const { container } = render(
      <Autocomplete label="Fruit" data={['Apple', 'Banana']} />
    );
    const input = screen.getByLabelText('Fruit');
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('applies a user-supplied id to the inner input, not the wrapper', () => {
    const { container } = render(
      <Autocomplete label="Fruit" id="fruit-input" data={['Apple']} />
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('id', 'fruit-input');
    expect(container.querySelector('.autocomplete')).not.toHaveAttribute('id');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'fruit-input'
    );
  });

  it('lets an explicit labelProps.htmlFor override the association', () => {
    const { container } = render(
      <Autocomplete
        label="Fruit"
        labelProps={{ htmlFor: 'other' }}
        data={['Apple']}
      />
    );
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'other'
    );
    expect(screen.getByRole('combobox')).not.toHaveAttribute('id');
  });

  it('injects no id without a label', () => {
    render(<Autocomplete data={['Apple']} />);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('id');
  });

  it("takes the outer Field's label in place of its own, which it drops (#939)", () => {
    const { container } = render(
      <Field label="Outer">
        <Autocomplete label="Dropped" data={['Apple']} />
      </Field>
    );
    expect(container.querySelectorAll('label').length).toBe(1);
    expect(screen.getByRole('combobox', { name: 'Outer' })).toBeInTheDocument();
  });
});
