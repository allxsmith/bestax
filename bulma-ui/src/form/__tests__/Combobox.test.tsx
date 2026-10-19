import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Combobox,
  ComboboxMenu,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  type ComboboxInputProps,
  type ComboboxPartsProps,
} from '../Combobox';
import { Field } from '../Field';
import { Control } from '../Control';
import { Popover } from '../../components/Popover';
import { Modal } from '../../components/Modal';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import {
  announceDelay,
  announcementLifetime,
} from '../../helpers/statusRegion';

const COUNTRIES = ['Canada', 'France', 'Germany', 'Japan', 'Mexico'];

interface CountryProps extends Partial<ComboboxPartsProps> {
  items?: string[];
  disabledItems?: string[];
  initialValue?: string | null;
  inputProps?: ComboboxInputProps;
}

/**
 * The filterable select from the docs: the value has to be one of the
 * countries, and the field shows it.
 */
function CountrySelect({
  items = COUNTRIES,
  disabledItems = [],
  initialValue = null,
  inputProps,
  onSelect,
  ...props
}: CountryProps) {
  const [value, setValue] = useState<string | null>(initialValue);
  const [query, setQuery] = useState(initialValue ?? '');
  const term = query === value ? '' : query.trim().toLowerCase();
  const matches = items.filter(c => c.toLowerCase().includes(term));
  return (
    <Combobox
      label="Country"
      onSelect={picked => {
        setValue(picked);
        setQuery(picked);
        onSelect?.(picked);
      }}
      {...props}
    >
      <Combobox.Input
        placeholder="Pick a country"
        value={query}
        onChange={e => setQuery(e.target.value)}
        {...inputProps}
      />
      <Combobox.Menu>
        {matches.length > 0 ? (
          <Combobox.List>
            {matches.map(c => (
              <Combobox.Item
                key={c}
                value={c}
                checked={c === value}
                disabled={disabledItems.includes(c)}
              >
                {c}
              </Combobox.Item>
            ))}
          </Combobox.List>
        ) : (
          <Combobox.Empty>No countries match</Combobox.Empty>
        )}
      </Combobox.Menu>
    </Combobox>
  );
}

/** A list that's always on screen, as in a Popover. */
function PeopleList({
  items = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson'],
  disabledItems = [],
  initialValue = null,
  onSelect,
  ...props
}: CountryProps) {
  const [value, setValue] = useState<string | null>(initialValue);
  const [query, setQuery] = useState('');
  const matches = items.filter(p =>
    p.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <Combobox
      inline
      onSelect={picked => {
        setValue(picked);
        onSelect?.(picked);
      }}
      {...props}
    >
      <Combobox.Input
        aria-label="Search people"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {matches.length > 0 ? (
        <Combobox.List aria-label="People">
          {matches.map(p => (
            <Combobox.Item
              key={p}
              value={p}
              checked={p === value}
              disabled={disabledItems.includes(p)}
            >
              {p}
            </Combobox.Item>
          ))}
        </Combobox.List>
      ) : (
        <Combobox.Empty>Nobody matches</Combobox.Empty>
      )}
    </Combobox>
  );
}

const field = () => screen.getByRole('combobox') as HTMLInputElement;
const listbox = () => screen.getByRole('listbox');
const option = (name: string) => screen.getByRole('option', { name });
const options = () => screen.queryAllByRole('option');
/** The highlighted option's text, or null. */
const highlighted = () => {
  const id = field().getAttribute('aria-activedescendant');
  return id ? (document.getElementById(id)?.textContent ?? 'MISSING') : null;
};
/** Fires a key on the field; false when the Combobox called `preventDefault`. */
const key = (k: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(field(), { key: k, ...init });
const type = (value: string) =>
  fireEvent.change(field(), { target: { value } });

/**
 * Each id reference under `root` that names no element in the document, as
 * `attribute=id`, so a reference left pointing at nothing shows up by name.
 */
const danglingIdRefs = (root: HTMLElement): string[] => {
  const attributes = [
    'aria-labelledby',
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

beforeEach(() => {
  resetDevWarnings();
});

describe('Combobox', () => {
  describe('Rendering', () => {
    it('renders the label, the field and nothing else while closed', () => {
      const { container } = render(<CountrySelect />);
      const fieldEl = container.firstElementChild as HTMLElement;
      expect(fieldEl).toHaveClass('field');
      const root = fieldEl.querySelector('.combobox') as HTMLElement;
      expect(root).not.toBeNull();
      expect(root.querySelector('.control > input.input')).toBe(field());
      expect(container.querySelector('.dropdown-menu')).toBeNull();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(screen.getByLabelText('Country')).toBe(field());
    });

    it('wires the field as a closed combobox', () => {
      render(<CountrySelect />);
      const input = field();
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).not.toHaveAttribute('aria-controls');
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('keeps an aria-autocomplete the caller passed', () => {
      render(<CountrySelect inputProps={{ 'aria-autocomplete': 'none' }} />);
      expect(field()).toHaveAttribute('aria-autocomplete', 'none');
    });

    it("never lets a caller's aria-expanded, aria-controls or aria-activedescendant win", () => {
      render(
        <CountrySelect
          inputProps={{
            'aria-expanded': true,
            'aria-controls': 'elsewhere',
            'aria-activedescendant': 'elsewhere',
          }}
        />
      );
      expect(field()).toHaveAttribute('aria-expanded', 'false');
      expect(field()).not.toHaveAttribute('aria-controls');
      expect(field()).not.toHaveAttribute('aria-activedescendant');
    });

    it('puts the helper props, the class, the attributes and the ref on div.combobox', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <Combobox
          label="Country"
          ref={ref}
          className="custom"
          id="country-root"
          data-testid="root"
          mt="2"
        >
          <Combobox.Input />
        </Combobox>
      );
      const root = screen.getByTestId('root');
      expect(root).toBe(ref.current);
      expect(root).toHaveClass('combobox', 'custom', 'mt-2');
      expect(root).toHaveAttribute('id', 'country-root');
      expect(container.querySelector('.field')).not.toHaveClass('custom');
    });

    it('forwards the field ref to the <input>', () => {
      const ref = createRef<HTMLInputElement>();
      render(<CountrySelect inputProps={{ ref } as ComboboxInputProps} />);
      expect(ref.current).toBe(field());
    });

    it('forwards a function ref on both', () => {
      let root: HTMLDivElement | null = null;
      let input: HTMLInputElement | null = null;
      render(
        <Combobox
          ref={node => {
            root = node;
          }}
        >
          <Combobox.Input
            aria-label="Search"
            ref={node => {
              input = node;
            }}
          />
        </Combobox>
      );
      expect(root).toHaveClass('combobox');
      expect(input).toBe(field());
    });

    it('renders the message as help text after the Combobox', () => {
      const { container } = render(
        <CountrySelect message="Where you live" messageColor="info" />
      );
      const help = container.querySelector('p.help') as HTMLElement;
      expect(help).toHaveTextContent('Where you live');
      expect(help).toHaveClass('is-info');
      expect(help.previousElementSibling).toHaveClass('combobox');
    });

    it('passes the Field props to its Field', () => {
      const { container } = render(
        <CountrySelect
          horizontal
          labelSize="small"
          fieldClassName="custom-field"
          labelProps={{ className: 'custom-label' }}
        />
      );
      const fieldEl = container.querySelector('.field') as HTMLElement;
      expect(fieldEl).toHaveClass('is-horizontal', 'custom-field');
      expect(container.querySelector('.field-label')).toHaveClass('is-small');
      expect(container.querySelector('label')).toHaveClass(
        'label',
        'custom-label'
      );
      expect(screen.getByLabelText('Country')).toBe(field());
    });

    it.each(['small', 'medium', 'large'] as const)(
      'sizes the field and the options together at %s',
      size => {
        const { container } = render(<CountrySelect size={size} />);
        expect(container.querySelector('.combobox')).toHaveClass(`is-${size}`);
        expect(field()).toHaveClass(`is-${size}`);
        expect(field().parentElement).toHaveClass('control', `is-${size}`);
        key('ArrowDown');
        expect(container.querySelector('.dropdown-menu')).toHaveClass(
          `is-${size}`
        );
      }
    );

    it('ignores a size it does not know', () => {
      const { container } = render(
        <CountrySelect size={'huge' as ComboboxPartsProps['size']} />
      );
      expect(container.querySelector('.combobox')?.className).toBe('combobox');
    });

    it('keeps a controlSize the caller set on the field', () => {
      render(
        <CountrySelect size="small" inputProps={{ controlSize: 'large' }} />
      );
      expect(field().parentElement).toHaveClass('is-large');
    });

    it('takes the field props Input takes: icons, color and loading', () => {
      render(
        <CountrySelect
          inputProps={{
            iconLeftName: 'search',
            color: 'danger',
            isLoading: true,
          }}
        />
      );
      const control = field().parentElement as HTMLElement;
      expect(control).toHaveClass('has-icons-left', 'is-loading');
      expect(field()).toHaveClass('is-danger');
    });
  });

  describe('Labels and names', () => {
    it('names the list after the label that names the field', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      const label = screen.getByText('Country');
      expect(label).toHaveAttribute('for', field().id);
      expect(listbox()).toHaveAttribute('aria-labelledby', label.id);
      expect(listbox()).not.toHaveAttribute('aria-label');
      expect(screen.getByRole('listbox', { name: 'Country' })).toBe(listbox());
    });

    it('uses a labelProps id for the label it points the list at', () => {
      render(<CountrySelect labelProps={{ id: 'my-label' }} />);
      key('ArrowDown');
      expect(listbox()).toHaveAttribute('aria-labelledby', 'my-label');
    });

    it('is named by an outer Field, and renders no Field of its own there', () => {
      const { container } = render(
        <Field label="Outer">
          <CountrySelect label="Dropped" />
        </Field>
      );
      expect(container.querySelectorAll('.field')).toHaveLength(1);
      expect(screen.queryByText('Dropped')).toBeNull();
      expect(screen.getByLabelText('Outer')).toBe(field());
      key('ArrowDown');
      expect(screen.getByRole('listbox', { name: 'Outer' })).toBe(listbox());
    });

    it('falls back to "Suggestions" with no label to point at', () => {
      render(
        <Combobox defaultOpen>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="a">A</Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      expect(listbox()).toHaveAttribute('aria-label', 'Suggestions');
      expect(listbox()).not.toHaveAttribute('aria-labelledby');
    });

    it("lets the caller's aria-label or aria-labelledby on the list win", () => {
      const { rerender } = render(<PeopleList />);
      expect(listbox()).toHaveAttribute('aria-label', 'People');
      expect(listbox()).not.toHaveAttribute('aria-labelledby');

      rerender(
        <Combobox label="Label" inline>
          <Combobox.Input />
          <Combobox.List aria-labelledby="elsewhere">
            <Combobox.Item value="a">A</Combobox.Item>
          </Combobox.List>
        </Combobox>
      );
      expect(listbox()).toHaveAttribute('aria-labelledby', 'elsewhere');
      expect(listbox()).not.toHaveAttribute('aria-label');
    });

    it('keeps an aria-labelledby the caller put on the field', () => {
      render(
        <CountrySelect
          inputProps={{ id: 'country', 'aria-labelledby': 'elsewhere' }}
        />
      );
      expect(field()).toHaveAttribute('aria-labelledby', 'elsewhere');
    });

    it('follows an id given to the field', () => {
      render(<CountrySelect inputProps={{ id: 'country' }} />);
      expect(field()).toHaveAttribute('id', 'country');
      expect(screen.getByText('Country')).toHaveAttribute('for', 'country');
      expect(screen.getByLabelText('Country')).toBe(field());
      key('ArrowDown');
      expect(screen.getByRole('listbox', { name: 'Country' })).toBe(listbox());
    });

    it('lets a label wired by hand name the field with the same id', () => {
      render(
        <CountrySelect
          labelProps={{ htmlFor: 'country' }}
          inputProps={{ id: 'country' }}
        />
      );
      expect(screen.getByLabelText('Country')).toBe(field());
      key('ArrowDown');
      expect(screen.getByRole('listbox', { name: 'Country' })).toBe(listbox());
    });

    describe("an outer Field's label wired by hand", () => {
      const Parts = () => (
        <Combobox defaultOpen>
          <Combobox.Input id="country" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="ca">Canada</Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );

      it('names the field through its for, and leaves the list its fallback name without an id', () => {
        render(
          <Field label="Country" labelProps={{ htmlFor: 'country' }}>
            <Parts />
          </Field>
        );
        expect(screen.getByRole('combobox', { name: 'Country' })).toBe(field());
        expect(listbox()).toHaveAttribute('aria-label', 'Suggestions');
      });

      it.each([
        ['a plain Field', {}],
        ['a grouped Field', { grouped: true }],
      ])('names the list too with an id, in %s', (_, fieldProps) => {
        render(
          <Field
            label="Country"
            labelProps={{ htmlFor: 'country', id: 'country-label' }}
            {...fieldProps}
          >
            <Parts />
          </Field>
        );
        expect(screen.getByRole('combobox', { name: 'Country' })).toBe(field());
        expect(listbox()).toHaveAttribute('aria-labelledby', 'country-label');
      });

      it('names the list with an id given data, whose id is the field', () => {
        render(
          <Field
            label="Country"
            labelProps={{ htmlFor: 'country', id: 'country-label' }}
          >
            <Combobox data={['Canada']} id="country" defaultOpen />
          </Field>
        );
        expect(screen.getByRole('combobox', { name: 'Country' })).toBe(field());
        expect(listbox()).toHaveAttribute('aria-labelledby', 'country-label');
      });

      it('names only the field from a label of your own in Field.Label', () => {
        render(
          <Field horizontal>
            <Field.Label>
              <label htmlFor="country" id="country-label">
                Country
              </label>
            </Field.Label>
            <Field.Body>
              <Parts />
            </Field.Body>
          </Field>
        );
        expect(screen.getByRole('combobox', { name: 'Country' })).toBe(field());
        expect(listbox()).toHaveAttribute('aria-label', 'Suggestions');
      });
    });

    it('is named by an outer Field given data, and names its list after it', () => {
      render(
        <Field label="Country">
          <Combobox data={['Canada']} defaultOpen />
        </Field>
      );
      expect(screen.getByRole('combobox', { name: 'Country' })).toBe(field());
      expect(screen.getByRole('listbox', { name: 'Country' })).toBe(listbox());
    });

    it('leaves no reference dangling, open or closed', () => {
      const { container } = render(<CountrySelect initialValue="France" />);
      expect(danglingIdRefs(container)).toEqual([]);
      key('ArrowDown');
      expect(danglingIdRefs(container)).toEqual([]);
    });
  });

  describe('ARIA while open', () => {
    it('points aria-controls at the listbox only while options show', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      expect(field()).toHaveAttribute('aria-expanded', 'true');
      expect(field()).toHaveAttribute('aria-controls', listbox().id);
      expect(listbox()).toHaveClass('combobox-list');
      expect(listbox().closest('.dropdown-content')).not.toBeNull();
    });

    it('gives each option an id, the option role and the classes', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      const ids = options().map(o => o.id);
      expect(new Set(ids).size).toBe(COUNTRIES.length);
      ids.forEach(id => expect(id).toMatch(/\S/));
      options().forEach(o =>
        expect(o).toHaveClass('dropdown-item', 'combobox-item')
      );
    });

    it('makes a value with a space in it one id', () => {
      render(<CountrySelect items={['New Zealand', 'South Korea']} />);
      key('ArrowDown');
      expect(option('New Zealand').id).not.toMatch(/\s/);
      expect(field().getAttribute('aria-activedescendant')).toBe(
        option('New Zealand').id
      );
    });

    it('puts aria-selected on the highlighted option alone, with one value', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      key('ArrowDown');
      expect(option('France')).toHaveAttribute('aria-selected', 'true');
      expect(option('France')).toHaveClass('is-active');
      for (const name of ['Canada', 'Germany', 'Japan', 'Mexico']) {
        expect(option(name)).not.toHaveAttribute('aria-selected');
        expect(option(name)).not.toHaveClass('is-active');
      }
      expect(listbox()).not.toHaveAttribute('aria-multiselectable');
    });

    it('shows the chosen value with a hidden check mark, not aria-selected', () => {
      render(<CountrySelect initialValue="Japan" />);
      fireEvent.click(field());
      const japan = option('Japan');
      expect(japan).toHaveClass('is-checked');
      const check = japan.querySelector('.combobox-check') as HTMLElement;
      expect(check).toHaveAttribute('aria-hidden', 'true');
      expect(check.querySelector('svg')).not.toBeNull();
      expect(option('Canada').querySelector('.combobox-check')).toBeNull();
      // It took the highlight as the list opened.
      expect(japan).toHaveAttribute('aria-selected', 'true');
      key('ArrowDown');
      expect(japan).not.toHaveAttribute('aria-selected');
      expect(japan).toHaveClass('is-checked');
    });

    it('makes aria-expanded false while only the empty message shows', () => {
      render(<CountrySelect />);
      type('zzz');
      expect(screen.getByText('No countries match')).toHaveClass(
        'combobox-empty'
      );
      expect(screen.getByText('No countries match').closest('[role]')).toBe(
        null
      );
      expect(field()).toHaveAttribute('aria-expanded', 'false');
      expect(field()).not.toHaveAttribute('aria-controls');
      expect(field()).not.toHaveAttribute('aria-activedescendant');
    });
  });

  describe('Opening', () => {
    it('opens on typing, with nothing highlighted', () => {
      const onOpenChange = jest.fn();
      render(<CountrySelect onOpenChange={onOpenChange} />);
      type('a');
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(listbox()).toBeInTheDocument();
      expect(highlighted()).toBeNull();
    });

    it('opens on Down Arrow with the first option highlighted', () => {
      render(<CountrySelect />);
      expect(key('ArrowDown')).toBe(false);
      expect(highlighted()).toBe('Canada');
    });

    it('opens on Up Arrow with the last option highlighted', () => {
      render(<CountrySelect />);
      expect(key('ArrowUp')).toBe(false);
      expect(highlighted()).toBe('Mexico');
    });

    it('opens on either arrow with the checked option highlighted', () => {
      const { unmount } = render(<CountrySelect initialValue="Germany" />);
      key('ArrowDown');
      expect(highlighted()).toBe('Germany');
      unmount();
      render(<CountrySelect initialValue="Germany" />);
      key('ArrowUp');
      expect(highlighted()).toBe('Germany');
    });

    it('passes over disabled options when it opens', () => {
      const { unmount } = render(
        <CountrySelect disabledItems={['Canada', 'Mexico']} />
      );
      key('ArrowDown');
      expect(highlighted()).toBe('France');
      unmount();
      render(
        <CountrySelect
          initialValue="Japan"
          disabledItems={['Japan', 'Mexico']}
        />
      );
      key('ArrowUp');
      expect(highlighted()).toBe('Germany');
    });

    it('opens on Alt+Down Arrow without a highlight', () => {
      render(<CountrySelect />);
      expect(key('ArrowDown', { altKey: true })).toBe(false);
      expect(listbox()).toBeInTheDocument();
      expect(highlighted()).toBeNull();
    });

    it('leaves Alt+Up Arrow alone while closed', () => {
      render(<CountrySelect />);
      expect(key('ArrowUp', { altKey: true })).toBe(true);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('opens on a click, with the checked option highlighted', () => {
      render(<CountrySelect initialValue="France" />);
      fireEvent.click(field());
      expect(highlighted()).toBe('France');
    });

    it('opens on a click with nothing highlighted when nothing is checked', () => {
      render(<CountrySelect />);
      fireEvent.click(field());
      expect(listbox()).toBeInTheDocument();
      expect(highlighted()).toBeNull();
    });

    it('stays shut on a click whose handler prevents it', () => {
      render(
        <CountrySelect inputProps={{ onClick: e => e.preventDefault() }} />
      );
      fireEvent.click(field());
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('stays shut on focus alone', () => {
      render(<CountrySelect />);
      act(() => field().focus());
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('starts open with defaultOpen', () => {
      render(<CountrySelect defaultOpen />);
      expect(listbox()).toBeInTheDocument();
      expect(field()).toHaveAttribute('aria-expanded', 'true');
    });

    it('only reports through onOpenChange when open is controlled', () => {
      const onOpenChange = jest.fn();
      const { rerender } = render(
        <CountrySelect open={false} onOpenChange={onOpenChange} />
      );
      key('ArrowDown');
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('listbox')).toBeNull();

      rerender(<CountrySelect open onOpenChange={onOpenChange} />);
      expect(listbox()).toBeInTheDocument();
      onOpenChange.mockClear();
      key('Escape');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(listbox()).toBeInTheDocument();
    });

    it("doesn't report a state it's already in", () => {
      const onOpenChange = jest.fn();
      render(<CountrySelect onOpenChange={onOpenChange} />);
      type('a');
      type('an');
      fireEvent.click(field());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keys while open', () => {
    it('moves down and up through the options, wrapping at the ends', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      expect(highlighted()).toBe('Canada');
      expect(key('ArrowDown')).toBe(false);
      expect(highlighted()).toBe('France');
      key('ArrowUp');
      key('ArrowUp');
      expect(highlighted()).toBe('Mexico');
      key('ArrowDown');
      expect(highlighted()).toBe('Canada');
    });

    it('starts from the ends when nothing is highlighted', () => {
      render(<CountrySelect />);
      type('a');
      key('ArrowDown');
      expect(highlighted()).toBe('Canada');
      type('an');
      key('ArrowUp');
      expect(highlighted()).toBe('Japan');
    });

    it('reaches disabled options, which are never aria-selected', () => {
      render(<CountrySelect disabledItems={['France']} />);
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('France');
      expect(option('France')).toHaveAttribute('aria-disabled', 'true');
      expect(option('France')).toHaveClass('is-disabled', 'is-active');
      expect(option('France')).not.toHaveAttribute('aria-selected');
    });

    it('picks the highlighted option with Enter, and closes', () => {
      const onSelect = jest.fn();
      render(<CountrySelect onSelect={onSelect} />);
      key('ArrowDown');
      key('ArrowDown');
      expect(key('Enter')).toBe(false);
      expect(onSelect).toHaveBeenCalledWith('France');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(field()).toHaveValue('France');
    });

    it('does nothing on Enter over a disabled option, and keeps the key', () => {
      const onSelect = jest.fn();
      render(
        <CountrySelect
          disabledItems={['Canada']}
          onSelect={onSelect}
          onOpenChange={jest.fn()}
        />
      );
      key('ArrowDown', { altKey: true });
      key('ArrowDown');
      expect(highlighted()).toBe('Canada');
      expect(key('Enter')).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();
      expect(listbox()).toBeInTheDocument();
    });

    it('closes on Enter with nothing highlighted, and lets the key through', () => {
      const onSelect = jest.fn();
      render(<CountrySelect onSelect={onSelect} />);
      type('a');
      expect(key('Enter')).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('leaves Enter alone while closed', () => {
      render(<CountrySelect />);
      expect(key('Enter')).toBe(true);
    });

    it('closes on Escape and keeps the key from going further', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      expect(key('Escape')).toBe(false);
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(field()).toHaveAttribute('aria-expanded', 'false');
    });

    it('leaves Escape alone while closed', () => {
      render(<CountrySelect />);
      expect(key('Escape')).toBe(true);
    });

    it("leaves Escape's default alone when the open list shows nothing", () => {
      const onOpenChange = jest.fn();
      render(
        <Combobox defaultOpen onOpenChange={onOpenChange}>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>{null}</Combobox.Menu>
        </Combobox>
      );
      expect(document.querySelector('.dropdown-menu')).toBeNull();
      expect(key('Escape')).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('never stops Escape propagating', () => {
      const outer = jest.fn();
      render(
        <div onKeyDown={e => outer(e.defaultPrevented)}>
          <CountrySelect />
        </div>
      );
      key('ArrowDown');
      key('Escape');
      expect(outer).toHaveBeenCalledWith(true);
    });

    it('closes on Alt+Up Arrow, and does nothing on Alt+Down Arrow', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      expect(key('ArrowDown', { altKey: true })).toBe(true);
      expect(highlighted()).toBe('Canada');
      expect(key('ArrowUp', { altKey: true })).toBe(false);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('closes on Tab and picks nothing', () => {
      const onSelect = jest.fn();
      render(<CountrySelect onSelect={onSelect} />);
      key('ArrowDown');
      expect(key('Tab')).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it.each(['Home', 'End', 'ArrowLeft', 'ArrowRight'])(
      'leaves %s to the field and clears the highlight',
      k => {
        render(<CountrySelect />);
        key('ArrowDown');
        expect(key(k)).toBe(true);
        expect(highlighted()).toBeNull();
        expect(listbox()).toBeInTheDocument();
      }
    );

    it('leaves other keys alone', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      expect(key('a')).toBe(true);
      expect(key('PageDown')).toBe(true);
      expect(highlighted()).toBe('Canada');
    });

    it('clears the highlight when the user types', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      type('a');
      expect(highlighted()).toBeNull();
      expect(listbox()).toBeInTheDocument();
    });

    it('does nothing on the arrows while the list has no options', () => {
      render(<CountrySelect />);
      type('zzz');
      expect(key('ArrowDown')).toBe(false);
      expect(highlighted()).toBeNull();
    });

    it("runs the field's own onKeyDown first, which can keep the key", () => {
      const order: string[] = [];
      render(
        <CountrySelect
          inputProps={{
            onKeyDown: e => {
              order.push(`field ${e.key}`);
              if (e.key === 'ArrowDown') e.preventDefault();
            },
          }}
        />
      );
      key('ArrowDown');
      expect(order).toEqual(['field ArrowDown']);
      expect(screen.queryByRole('listbox')).toBeNull();
      key('ArrowUp');
      expect(listbox()).toBeInTheDocument();
    });

    it('runs none of it while an IME is composing', () => {
      const onSelect = jest.fn();
      render(<CountrySelect onSelect={onSelect} />);
      expect(key('ArrowDown', { isComposing: true })).toBe(true);
      expect(screen.queryByRole('listbox')).toBeNull();
      key('ArrowDown');
      expect(key('Enter', { isComposing: true })).toBe(true);
      expect(key('Enter', { keyCode: 229 })).toBe(true);
      expect(key('Escape', { keyCode: 229 })).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
      expect(listbox()).toBeInTheDocument();
      key('Enter');
      expect(onSelect).toHaveBeenCalledWith('Canada');
    });
  });

  describe('StrictMode', () => {
    // StrictMode runs each layout effect twice on mount, and a list that's
    // open on its first commit lands its highlight in that mount.
    it('keeps the opening highlight on the checked option, inline', () => {
      render(
        <React.StrictMode>
          <PeopleList initialValue="Grace Hopper" />
        </React.StrictMode>
      );
      expect(highlighted()).toBe('Grace Hopper');
    });

    it('keeps the opening highlight with defaultOpen', () => {
      render(
        <React.StrictMode>
          <CountrySelect defaultOpen initialValue="Japan" />
        </React.StrictMode>
      );
      expect(highlighted()).toBe('Japan');
    });

    it('keeps the opening highlight when open is set from the start', () => {
      render(
        <React.StrictMode>
          <CountrySelect open onOpenChange={() => {}} initialValue="France" />
        </React.StrictMode>
      );
      expect(highlighted()).toBe('France');
    });

    it('keeps keepFirst on the first enabled option, inline', () => {
      render(
        <React.StrictMode>
          <PeopleList keepFirst disabledItems={['Ada Lovelace']} />
        </React.StrictMode>
      );
      expect(highlighted()).toBe('Grace Hopper');
    });

    it('still moves the highlight with the keys after mounting', () => {
      render(
        <React.StrictMode>
          <PeopleList initialValue="Grace Hopper" />
        </React.StrictMode>
      );
      key('ArrowDown');
      expect(highlighted()).toBe('Katherine Johnson');
    });
  });

  describe('keepFirst', () => {
    it('highlights the first enabled option as the list opens', () => {
      render(<CountrySelect keepFirst disabledItems={['Canada']} />);
      type('a');
      expect(highlighted()).toBe('France');
    });

    it('highlights the checked option first as the list opens', () => {
      render(<CountrySelect keepFirst initialValue="Japan" />);
      fireEvent.click(field());
      expect(highlighted()).toBe('Japan');
    });

    it('moves to the first enabled option when the options change', () => {
      render(<CountrySelect keepFirst />);
      type('a');
      key('ArrowDown');
      expect(highlighted()).toBe('France');
      type('an');
      expect(highlighted()).toBe('Canada');
      type('ja');
      expect(highlighted()).toBe('Japan');
    });

    it('goes back to the first after typing that leaves the options as they were', () => {
      render(<CountrySelect keepFirst items={['Apple', 'Grape']} />);
      type('a');
      key('ArrowDown');
      expect(highlighted()).toBe('Grape');
      type('ap');
      expect(highlighted()).toBe('Apple');
    });

    it('keeps a highlight the arrows moved while the options stay', () => {
      const { rerender } = render(<CountrySelect keepFirst defaultOpen />);
      key('ArrowDown');
      key('ArrowDown');
      rerender(<CountrySelect keepFirst defaultOpen />);
      expect(highlighted()).toBe('Germany');
    });

    it('only highlights: Tab still picks nothing', () => {
      const onSelect = jest.fn();
      render(<CountrySelect keepFirst onSelect={onSelect} />);
      type('fr');
      expect(highlighted()).toBe('France');
      key('Tab');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('highlights nothing when every option is disabled', () => {
      render(<CountrySelect keepFirst items={['A']} disabledItems={['A']} />);
      type('a');
      expect(highlighted()).toBeNull();
    });
  });

  describe('Options that come and go', () => {
    it('drops a highlight whose option the app takes away', () => {
      function Shrinking({ items }: { items: string[] }) {
        return (
          <Combobox defaultOpen>
            <Combobox.Input aria-label="Search" />
            <Combobox.Menu>
              <Combobox.List>
                {items.map(i => (
                  <Combobox.Item key={i} value={i}>
                    {i}
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Menu>
          </Combobox>
        );
      }
      const { rerender } = render(<Shrinking items={['a', 'b', 'c']} />);
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('b');
      rerender(<Shrinking items={['a', 'c']} />);
      expect(highlighted()).toBeNull();
      key('ArrowDown');
      rerender(<Shrinking items={['c']} />);
      expect(highlighted()).toBeNull();
    });

    it('hands it to the first enabled option under keepFirst', () => {
      function Shrinking({ items }: { items: string[] }) {
        return (
          <Combobox defaultOpen keepFirst>
            <Combobox.Input aria-label="Search" />
            <Combobox.Menu>
              <Combobox.List>
                {items.map(i => (
                  <Combobox.Item key={i} value={i} disabled={i === 'a'}>
                    {i}
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Menu>
          </Combobox>
        );
      }
      const { rerender } = render(<Shrinking items={['a', 'b', 'c']} />);
      expect(highlighted()).toBe('b');
      key('ArrowDown');
      expect(highlighted()).toBe('c');
      rerender(<Shrinking items={['a', 'b']} />);
      expect(highlighted()).toBe('b');
    });

    it('finds options a child component renders on its own', () => {
      function Later() {
        const [shown, setShown] = useState(false);
        return (
          <>
            <button onClick={() => setShown(true)}>More</button>
            {shown && <Combobox.Item value="late">Late</Combobox.Item>}
          </>
        );
      }
      render(
        <Combobox defaultOpen>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="early">Early</Combobox.Item>
              <Later />
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      fireEvent.click(screen.getByText('More'));
      key('ArrowUp');
      expect(highlighted()).toBe('Late');
    });

    it('passes over an element given the option role by hand', () => {
      const onSelect = jest.fn();
      render(
        <Combobox defaultOpen onSelect={onSelect}>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="a">A</Combobox.Item>
              <div role="option" aria-selected="false">
                Not one
              </div>
              <Combobox.Item value="b">B</Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('B');
      key('Enter');
      expect(onSelect).toHaveBeenCalledWith('b');
    });

    it('brings the highlighted option into view', () => {
      const scrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      try {
        render(<CountrySelect />);
        key('ArrowUp');
        expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
        const { contexts } = scrollIntoView.mock;
        expect(contexts[contexts.length - 1]).toBe(option('Mexico'));
      } finally {
        delete (Element.prototype as Partial<Element>).scrollIntoView;
      }
    });

    it('leaves the list where it is when the pointer moves the highlight', () => {
      const scrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      try {
        render(<CountrySelect />);
        key('ArrowDown');
        scrollIntoView.mockClear();
        // The pointer is already on the option, so the list stays put under it.
        fireEvent.pointerMove(option('Germany'));
        expect(highlighted()).toBe('Germany');
        expect(scrollIntoView).not.toHaveBeenCalled();
        // A key that moves it on still scrolls, from where the pointer left it.
        key('ArrowDown');
        expect(highlighted()).toBe('Japan');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(option('Japan'));
      } finally {
        delete (Element.prototype as Partial<Element>).scrollIntoView;
      }
    });

    it('scrolls to where a landing puts the highlight', () => {
      const scrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      try {
        render(<CountrySelect keepFirst />);
        type('n');
        const { contexts } = scrollIntoView.mock;
        expect(contexts[contexts.length - 1]).toBe(option('Canada'));
        scrollIntoView.mockClear();
        fireEvent.pointerMove(option('France'));
        // Typing hands the pointer's highlight to keepFirst, which moves
        // it to the first match, and that scrolls.
        type('na');
        expect(highlighted()).toBe('Canada');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
      } finally {
        delete (Element.prototype as Partial<Element>).scrollIntoView;
      }
    });
  });

  describe('Picking with the pointer', () => {
    it('picks an option on a click, closes, and keeps focus in the field', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(<CountrySelect onSelect={onSelect} />);
      await user.click(field());
      await user.click(option('Japan'));
      expect(onSelect).toHaveBeenCalledWith('Japan');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(field()).toHaveFocus();
      expect(field()).toHaveValue('Japan');
    });

    it('puts focus back in the field when a click took it away', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      expect(field()).not.toHaveFocus();
      fireEvent.click(option('France'));
      expect(field()).toHaveFocus();
    });

    it('never picks a disabled option', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(<CountrySelect disabledItems={['Japan']} onSelect={onSelect} />);
      await user.click(field());
      await user.click(option('Japan'));
      expect(onSelect).not.toHaveBeenCalled();
      expect(listbox()).toBeInTheDocument();
    });

    it("lets an option's own onClick keep the pick", () => {
      const onSelect = jest.fn();
      render(
        <Combobox defaultOpen onSelect={onSelect}>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="a" onClick={e => e.preventDefault()}>
                A
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      fireEvent.click(option('A'));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('highlights an enabled option the pointer moves over, and not a disabled one', () => {
      const onPointerMove = jest.fn();
      render(<CountrySelect disabledItems={['Japan']} />);
      key('ArrowDown');
      fireEvent.pointerMove(option('Germany'));
      expect(highlighted()).toBe('Germany');
      fireEvent.pointerMove(option('Germany'));
      fireEvent.pointerMove(option('Japan'));
      expect(highlighted()).toBe('Germany');
      expect(onPointerMove).not.toHaveBeenCalled();
    });

    it("runs an option's own onPointerMove", () => {
      const onPointerMove = jest.fn();
      render(
        <Combobox defaultOpen>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="a" onPointerMove={onPointerMove}>
                A
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      fireEvent.pointerMove(option('A'));
      expect(onPointerMove).toHaveBeenCalled();
      expect(highlighted()).toBe('A');
    });

    it('cancels a mousedown anywhere in the dropdown, so the field keeps focus', () => {
      const onMouseDown = jest.fn();
      render(
        <Combobox defaultOpen>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu onMouseDown={onMouseDown}>
            <Combobox.List onMouseDown={onMouseDown}>
              <Combobox.Group label="Group">
                <Combobox.Item value="a">A</Combobox.Item>
              </Combobox.Group>
            </Combobox.List>
            <Combobox.Empty onMouseDown={onMouseDown}>Nothing</Combobox.Empty>
          </Combobox.Menu>
        </Combobox>
      );
      expect(fireEvent.mouseDown(option('A'))).toBe(false);
      expect(fireEvent.mouseDown(screen.getByText('Group'))).toBe(false);
      expect(fireEvent.mouseDown(screen.getByText('Nothing'))).toBe(false);
      expect(
        fireEvent.mouseDown(document.querySelector('.dropdown-content')!)
      ).toBe(false);
      expect(onMouseDown).toHaveBeenCalled();
    });
  });

  describe('multiple', () => {
    function Labels({ onSelect }: { onSelect?: jest.Mock }) {
      const [picked, setPicked] = useState<string[]>(['docs']);
      return (
        <Combobox
          label="Labels"
          multiple
          onSelect={value => {
            onSelect?.(value);
            setPicked(prev =>
              prev.includes(value)
                ? prev.filter(l => l !== value)
                : [...prev, value]
            );
          }}
        >
          <Combobox.Input />
          <Combobox.Menu>
            <Combobox.List>
              {['bug', 'docs', 'feature', 'locked'].map(l => (
                <Combobox.Item
                  key={l}
                  value={l}
                  checked={picked.includes(l) || l === 'locked'}
                  disabled={l === 'locked'}
                >
                  {l}
                </Combobox.Item>
              ))}
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
    }

    it('makes the list aria-multiselectable, with checked as aria-selected', () => {
      render(<Labels />);
      key('ArrowDown');
      expect(listbox()).toHaveAttribute('aria-multiselectable', 'true');
      expect(option('docs')).toHaveAttribute('aria-selected', 'true');
      expect(option('bug')).toHaveAttribute('aria-selected', 'false');
      expect(option('feature')).toHaveAttribute('aria-selected', 'false');
      // Never a disabled one, checked or not.
      expect(option('locked')).not.toHaveAttribute('aria-selected');
    });

    it('opens with the highlight on the first checked option', () => {
      render(<Labels />);
      key('ArrowDown');
      expect(highlighted()).toBe('docs');
    });

    it('keeps the list open and its highlight after a pick', () => {
      const onSelect = jest.fn();
      render(<Labels onSelect={onSelect} />);
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('feature');
      key('Enter');
      expect(onSelect).toHaveBeenCalledWith('feature');
      expect(listbox()).toBeInTheDocument();
      expect(highlighted()).toBe('feature');
      expect(option('feature')).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(option('docs'));
      expect(option('docs')).toHaveAttribute('aria-selected', 'false');
      expect(listbox()).toBeInTheDocument();
    });
  });

  describe('Groups', () => {
    function Produce() {
      return (
        <Combobox label="Produce" defaultOpen>
          <Combobox.Input />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Group label="Fruit" className="custom">
                <Combobox.Item value="apple">Apple</Combobox.Item>
                <Combobox.Item value="banana">Banana</Combobox.Item>
              </Combobox.Group>
              <Combobox.Group label="Vegetables">
                <Combobox.Item value="carrot">Carrot</Combobox.Item>
              </Combobox.Group>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
    }

    it('renders each group named by its heading', () => {
      render(<Produce />);
      const fruit = screen.getByRole('group', { name: 'Fruit' });
      expect(fruit).toHaveClass('combobox-group', 'custom');
      expect(screen.getByText('Fruit')).toHaveClass('combobox-group-label');
      expect(within(fruit).getAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('group', { name: 'Vegetables' })).toBeVisible();
    });

    it("lets a name the caller gave a group win over its heading's", () => {
      render(
        <Combobox label="Produce" defaultOpen>
          <Combobox.Input />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Group label="Fruit" aria-label="Fresh fruit (2)">
                <Combobox.Item value="apple">Apple</Combobox.Item>
                <Combobox.Item value="pear">Pear</Combobox.Item>
              </Combobox.Group>
              <Combobox.Group label="Vegetables" aria-labelledby="veg-name">
                <Combobox.Item value="leek">Leek</Combobox.Item>
              </Combobox.Group>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      const fruit = screen.getByRole('group', { name: 'Fresh fruit (2)' });
      expect(fruit).not.toHaveAttribute('aria-labelledby');
      // The heading still shows, and keeps its id.
      expect(within(fruit).getByText('Fruit')).toHaveAttribute('id');
      expect(
        screen.getByText('Vegetables').closest('[role="group"]')
      ).toHaveAttribute('aria-labelledby', 'veg-name');
    });

    it('moves through the options across groups, in document order', () => {
      render(<Produce />);
      key('ArrowDown');
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('Carrot');
      key('ArrowDown');
      expect(highlighted()).toBe('Apple');
    });
  });

  describe('Closing', () => {
    it('closes on a pointerdown outside', () => {
      render(
        <>
          <button>Elsewhere</button>
          <CountrySelect />
        </>
      );
      key('ArrowDown');
      fireEvent.pointerDown(screen.getByText('Elsewhere'));
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('stays open on a pointerdown on the field or in the list', () => {
      render(<CountrySelect />);
      key('ArrowDown');
      fireEvent.pointerDown(field());
      fireEvent.pointerDown(option('France'));
      expect(listbox()).toBeInTheDocument();
    });

    it('closes when focus leaves the Combobox, and not when it moves inside', () => {
      render(
        <>
          <button>Next</button>
          <CountrySelect />
        </>
      );
      key('ArrowDown');
      fireEvent.blur(field(), { relatedTarget: option('France') });
      expect(listbox()).toBeInTheDocument();
      fireEvent.blur(field(), { relatedTarget: screen.getByText('Next') });
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('closes when focus leaves for nowhere', () => {
      const onBlur = jest.fn();
      render(<CountrySelect inputProps={{ onBlur }} />);
      key('ArrowDown');
      fireEvent.blur(field());
      expect(onBlur).toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('stops listening outside once closed or unmounted', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(<CountrySelect />);
      key('ArrowDown');
      unmount();
      expect(removeSpy).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function)
      );
      removeSpy.mockRestore();
    });

    it('tells a press inside apart from one outside in a shadow root', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });
      const mount = document.createElement('div');
      shadow.appendChild(mount);
      const outside = document.createElement('button');
      shadow.appendChild(outside);
      render(<CountrySelect />, { container: mount });
      const input = shadow.querySelector('input') as HTMLInputElement;
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const first = shadow.querySelector('[role="option"]') as HTMLElement;
      fireEvent.pointerDown(first, { composed: true });
      expect(shadow.querySelector('[role="listbox"]')).not.toBeNull();
      fireEvent.pointerDown(outside, { composed: true });
      expect(shadow.querySelector('[role="listbox"]')).toBeNull();
      host.remove();
    });
  });

  describe('Combobox.Menu', () => {
    it("doesn't show with nothing in it, whatever open says", () => {
      const { container } = render(
        <Combobox open onOpenChange={() => {}}>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            {false}
            {''}
            <></>
          </Combobox.Menu>
        </Combobox>
      );
      expect(container.querySelector('.dropdown-menu')).toBeNull();
      expect(field()).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders Bulma dropdown markup at the corner asked for', () => {
      const { container } = render(
        <CountrySelect defaultOpen position="top-right" />
      );
      const menu = container.querySelector('.dropdown-menu') as HTMLElement;
      expect(menu).toHaveClass('combobox-menu', 'is-top-right');
      expect(menu).not.toHaveClass('is-portal');
      expect(menu.firstElementChild).toHaveClass('dropdown-content');
      expect(menu.closest('.combobox')).not.toBeNull();
    });

    it('opens below on the left by default, and resolves auto to a corner', () => {
      const { container, rerender } = render(<CountrySelect defaultOpen />);
      expect(container.querySelector('.dropdown-menu')).toHaveClass(
        'is-bottom-left'
      );
      rerender(<CountrySelect defaultOpen position="auto" />);
      expect(container.querySelector('.dropdown-menu')).toHaveClass(
        'is-bottom-left'
      );
    });

    it('passes its attributes, class and style to the panel', () => {
      render(
        <Combobox defaultOpen>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu
            className="custom"
            data-testid="panel"
            style={{ maxWidth: '20rem' }}
          >
            <Combobox.List>
              <Combobox.Item value="a">A</Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      const panel = screen.getByTestId('panel');
      expect(panel).toHaveClass('dropdown-menu', 'custom');
      expect(panel.style.maxWidth).toBe('20rem');
    });

    describe('appendToBody', () => {
      let rects: jest.SpyInstance;
      beforeEach(() => {
        rects = jest
          .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
          .mockImplementation(function (this: HTMLElement) {
            const root = this.classList.contains('combobox');
            return {
              top: root ? 100 : 0,
              bottom: root ? 136 : 200,
              left: root ? 40 : 0,
              right: root ? 340 : 120,
              width: root ? 300 : 120,
              height: root ? 36 : 200,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            } as DOMRect;
          });
      });
      afterEach(() => rects.mockRestore());

      it('portals the panel into the page, fixed at the field and as wide', () => {
        const { container } = render(
          <CountrySelect defaultOpen appendToBody data-testid="root" />
        );
        expect(container.querySelector('.dropdown-menu')).toBeNull();
        const menu = document.body.querySelector(
          '.dropdown-menu'
        ) as HTMLElement;
        expect(menu).toHaveClass('combobox-menu', 'is-portal');
        expect(menu.style.position).toBe('fixed');
        expect(menu.style.top).toBe('136px');
        expect(menu.style.left).toBe('40px');
        expect(menu.style.minWidth).toBe('300px');
        expect(field()).toHaveAttribute('aria-controls', listbox().id);
      });

      it('lines a right corner up with the field at its own width', () => {
        render(
          <CountrySelect defaultOpen appendToBody position="bottom-right" />
        );
        const menu = document.body.querySelector(
          '.dropdown-menu'
        ) as HTMLElement;
        // The field is wider than the panel measured, so the panel takes
        // the field's width and starts where the field does.
        expect(menu.style.left).toBe('40px');
      });

      it('places a portaled menu above the field again as filtering changes its height', () => {
        // The field at 400 to 436px, and the menu 30px for each item in it.
        rects.mockImplementation(function (this: HTMLElement) {
          const root = this.classList.contains('combobox');
          const height = root
            ? 36
            : this.querySelectorAll('[role="option"]').length * 30;
          return {
            top: root ? 400 : 0,
            bottom: root ? 436 : height,
            left: 40,
            right: 340,
            width: 300,
            height,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          } as DOMRect;
        });
        render(<CountrySelect defaultOpen appendToBody position="top-left" />);
        const menu = () =>
          document.body.querySelector('.combobox-menu') as HTMLElement;
        expect(options()).toHaveLength(COUNTRIES.length);
        expect(menu().style.top).toBe(`${400 - COUNTRIES.length * 30}px`);
        type('an');
        expect(options()).toHaveLength(4);
        // Its bottom stays at the field's top.
        expect(menu().style.top).toBe(`${400 - 4 * 30}px`);
      });

      it('counts a press in the portaled list as inside', () => {
        render(<CountrySelect defaultOpen appendToBody />);
        fireEvent.pointerDown(option('France'));
        expect(listbox()).toBeInTheDocument();
        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole('listbox')).toBeNull();
      });

      it('runs the caller handlers on the portaled panel', () => {
        const onPointerDownCapture = jest.fn();
        render(
          <Combobox defaultOpen appendToBody>
            <Combobox.Input aria-label="Search" />
            <Combobox.Menu onPointerDownCapture={onPointerDownCapture}>
              <Combobox.List>
                <Combobox.Item value="a">A</Combobox.Item>
              </Combobox.List>
            </Combobox.Menu>
          </Combobox>
        );
        fireEvent.pointerDown(option('A'));
        expect(onPointerDownCapture).toHaveBeenCalled();
      });

      it('keeps focus in the field when focus would move into the portaled list', () => {
        render(<CountrySelect defaultOpen appendToBody />);
        fireEvent.blur(field(), { relatedTarget: option('France') });
        expect(listbox()).toBeInTheDocument();
      });
    });
  });

  describe('inline', () => {
    it('shows the list in the flow, always, with no dropdown', () => {
      const { container } = render(<PeopleList />);
      expect(container.querySelector('.combobox')).toHaveClass('is-inline');
      expect(container.querySelector('.dropdown-menu')).toBeNull();
      expect(listbox().parentElement).toHaveClass('combobox');
      expect(field()).toHaveAttribute('aria-expanded', 'true');
      expect(field()).toHaveAttribute('aria-controls', listbox().id);
    });

    it('opens with the checked option highlighted', () => {
      render(<PeopleList initialValue="Grace Hopper" />);
      expect(highlighted()).toBe('Grace Hopper');
    });

    it('takes the arrows and Enter as an open list does', () => {
      const onSelect = jest.fn();
      render(<PeopleList onSelect={onSelect} />);
      expect(key('ArrowDown')).toBe(false);
      expect(highlighted()).toBe('Ada Lovelace');
      key('ArrowUp');
      expect(highlighted()).toBe('Katherine Johnson');
      key('Enter');
      expect(onSelect).toHaveBeenCalledWith('Katherine Johnson');
      // Nothing closes it.
      expect(listbox()).toBeInTheDocument();
      expect(option('Katherine Johnson')).toHaveClass('is-checked');
    });

    it('leaves Escape and Alt+Up Arrow to whatever is around it', () => {
      const onOpenChange = jest.fn();
      render(<PeopleList onOpenChange={onOpenChange} />);
      key('ArrowDown');
      expect(key('Escape')).toBe(true);
      expect(key('ArrowUp', { altKey: true })).toBe(true);
      expect(listbox()).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('stays on screen through Tab, Enter with nothing highlighted and blur', () => {
      render(<PeopleList />);
      expect(key('Enter')).toBe(true);
      key('Tab');
      fireEvent.blur(field());
      fireEvent.pointerDown(document.body);
      expect(listbox()).toBeInTheDocument();
    });

    it('renders a Dropdown it is given in the flow', () => {
      const { container } = render(
        <Combobox inline>
          <Combobox.Input aria-label="Search" />
          <Combobox.Menu>
            <Combobox.List>
              <Combobox.Item value="a">A</Combobox.Item>
            </Combobox.List>
          </Combobox.Menu>
        </Combobox>
      );
      expect(container.querySelector('.dropdown-menu')).toBeNull();
      expect(listbox().parentElement).toHaveClass('combobox');
    });
  });

  describe('Forms', () => {
    it('submits the form on Enter while closed', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <CountrySelect />
          <button type="submit">Save</button>
        </form>
      );
      await user.click(field());
      await user.keyboard('{Escape}');
      await user.keyboard('{Enter}');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('closes the list and submits the form on Enter with nothing highlighted', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <CountrySelect />
          <button type="submit">Save</button>
        </form>
      );
      await user.type(field(), 'a');
      expect(listbox()).toBeInTheDocument();
      await user.keyboard('{Enter}');
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it("doesn't submit while Enter picks an option", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <CountrySelect />
          <button type="submit">Save</button>
        </form>
      );
      await user.click(field());
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
      expect(field()).toHaveValue('France');
    });
  });

  describe('Escape inside other layers', () => {
    it('closes the list, not a Popover around it, then the Popover', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(
        <Popover
          defaultOpen
          onOpenChange={onOpenChange}
          ariaLabel="Filters"
          trigger={<button>Filters</button>}
        >
          <Popover.Body>
            <CountrySelect />
          </Popover.Body>
        </Popover>
      );
      await user.click(field());
      expect(listbox()).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('lets an inline list hand Escape to the Popover around it', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(
        <Popover
          defaultOpen
          onOpenChange={onOpenChange}
          ariaLabel="Assign to"
          trigger={<button>Assign</button>}
        >
          <Popover.Body>
            <PeopleList />
          </Popover.Body>
        </Popover>
      );
      expect(field()).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes the list, not a Modal around it, then the Modal', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          <CountrySelect />
        </Modal>
      );
      key('ArrowDown');
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Inside a Control or a Field', () => {
    it('renders no Field in a bare Control, and keeps the field there', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(
        <Control>
          <Combobox size="small">
            <Combobox.Input aria-label="Search" />
          </Combobox>
        </Control>
      );
      expect(container.querySelector('.field')).toBeNull();
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(container.querySelector('.control > .combobox')).not.toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Class prefix', () => {
    it('prefixes every class the parts render', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Combobox label="Produce" size="small" defaultOpen>
            <Combobox.Input />
            <Combobox.Menu>
              <Combobox.List>
                <Combobox.Group label="Fruit">
                  <Combobox.Item value="apple" checked>
                    Apple
                  </Combobox.Item>
                  <Combobox.Item value="pear" disabled>
                    Pear
                  </Combobox.Item>
                </Combobox.Group>
              </Combobox.List>
              <Combobox.Empty>Nothing</Combobox.Empty>
            </Combobox.Menu>
          </Combobox>
          <Combobox inline>
            <Combobox.Input aria-label="Inline" />
          </Combobox>
        </ConfigProvider>
      );
      expect(container.querySelector('.bestax-combobox')).toHaveClass(
        'bestax-is-small'
      );
      expect(
        container.querySelector('.bestax-combobox.bestax-is-inline')
      ).not.toBeNull();
      expect(
        container.querySelector(
          '.bestax-dropdown-menu.bestax-combobox-menu.bestax-is-bottom-left.bestax-is-small > .bestax-dropdown-content'
        )
      ).not.toBeNull();
      expect(container.querySelector('.bestax-combobox-list')).not.toBeNull();
      expect(
        container.querySelector(
          '.bestax-dropdown-item.bestax-combobox-item.bestax-is-checked.bestax-is-active'
        )
      ).not.toBeNull();
      expect(
        container.querySelector('.bestax-combobox-item.bestax-is-disabled')
      ).not.toBeNull();
      expect(container.querySelector('.bestax-combobox-check')).not.toBeNull();
      expect(container.querySelector('.bestax-combobox-group')).not.toBeNull();
      expect(
        container.querySelector('.bestax-combobox-group-label')
      ).not.toBeNull();
      expect(container.querySelector('.bestax-combobox-empty')).not.toBeNull();
      const unprefixed = Array.from(container.querySelectorAll('[class]'))
        .flatMap(el => Array.from(el.classList))
        .filter(c => !c.startsWith('bestax-'));
      expect(unprefixed).toEqual([]);
    });
  });

  describe('Compound components', () => {
    it('attaches each part as a static, the same component as the named export', () => {
      expect(Combobox.Input).toBe(ComboboxInput);
      expect(Combobox.Menu).toBe(ComboboxMenu);
      expect(Combobox.List).toBe(ComboboxList);
      expect(Combobox.Item).toBe(ComboboxItem);
      expect(Combobox.Group).toBe(ComboboxGroup);
      expect(Combobox.Empty).toBe(ComboboxEmpty);
      expect(Combobox.displayName).toBe('Combobox');
    });

    it('renders each part outside a Combobox as inert markup', () => {
      const { container } = render(
        <>
          <ComboboxInput aria-label="Alone" />
          <ComboboxMenu>Nothing shows</ComboboxMenu>
          <ComboboxList>
            <ComboboxItem value="a" checked>
              A
            </ComboboxItem>
          </ComboboxList>
          <ComboboxGroup label="G" />
          <ComboboxEmpty>Empty</ComboboxEmpty>
        </>
      );
      expect(field()).toHaveAttribute('aria-expanded', 'false');
      expect(container.querySelector('.dropdown-menu')).toBeNull();
      expect(listbox()).not.toHaveAttribute('id');
      expect(option('A')).not.toHaveAttribute('id');
      fireEvent.keyDown(field(), { key: 'ArrowDown' });
      fireEvent.change(field(), { target: { value: 'x' } });
      fireEvent.click(field());
      fireEvent.blur(field());
      fireEvent.click(option('A'));
      fireEvent.pointerMove(option('A'));
      fireEvent.mouseDown(option('A'));
      expect(screen.getByText('Empty')).toHaveClass('combobox-empty');
    });
  });
});

describe('Combobox announces its empty message (#1066)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const advance = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });

  // What the status region says, one entry per announcement.
  const said = () =>
    Array.from(screen.getByRole('status').children, el => el.textContent);

  it('has its polite status region in the page, empty, from the start', () => {
    render(<CountrySelect />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();
    expect(status.parentElement).toHaveClass('combobox');

    type('zz');
    advance(announceDelay);
    expect(screen.getByRole('status')).toBe(status);
    expect(said()).toEqual(['No countries match']);
  });

  it('announces it once while typing keeps it on screen, and again after matches come back', () => {
    render(<CountrySelect />);
    type('z');
    advance(announceDelay);
    expect(said()).toEqual(['No countries match']);
    type('zz');
    advance(announceDelay);
    expect(said()).toEqual(['No countries match']);
    advance(announcementLifetime);
    type('zzz');
    advance(announceDelay);
    expect(said()).toEqual([]);

    type('a');
    advance(announceDelay);
    type('aq');
    advance(announceDelay);
    expect(said()).toEqual(['No countries match']);
  });

  it("doesn't announce it when the list opens with it already showing", () => {
    function AlwaysEmpty() {
      return (
        <Combobox label="Nothing">
          <Combobox.Input defaultValue="abc" />
          <Combobox.Menu>
            <Combobox.Empty>Nothing here</Combobox.Empty>
          </Combobox.Menu>
        </Combobox>
      );
    }
    render(<AlwaysEmpty />);
    key('ArrowDown');
    advance(announceDelay);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(said()).toEqual([]);
  });

  it("doesn't announce it when the field is emptied", () => {
    function EmptyWhenBlank() {
      const [query, setQuery] = useState('');
      return (
        <Combobox label="Search">
          <Combobox.Input
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Combobox.Menu>
            <Combobox.Empty>Type to search</Combobox.Empty>
          </Combobox.Menu>
        </Combobox>
      );
    }
    render(<EmptyWhenBlank />);
    type('a');
    type('');
    advance(announceDelay);
    expect(said()).toEqual([]);
  });

  it('waits for the field to stop loading, and then announces it', () => {
    function Server({ loading }: { loading: boolean }) {
      const [query, setQuery] = useState('');
      return (
        <Combobox label="City">
          <Combobox.Input
            isLoading={loading}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Combobox.Menu>
            {query && !loading ? (
              <Combobox.Empty>No cities match</Combobox.Empty>
            ) : null}
          </Combobox.Menu>
        </Combobox>
      );
    }
    const { rerender } = render(<Server loading />);
    type('xq');
    advance(announceDelay);
    expect(said()).toEqual([]);
    rerender(<Server loading={false} />);
    advance(announceDelay);
    expect(said()).toEqual(['No cities match']);
  });

  it('waits while the empty message shows under a loading field', () => {
    function Loading({ loading }: { loading: boolean }) {
      return (
        <Combobox label="City">
          <Combobox.Input isLoading={loading} />
          <Combobox.Menu>
            <Combobox.Empty>No cities match</Combobox.Empty>
          </Combobox.Menu>
        </Combobox>
      );
    }
    const { rerender } = render(<Loading loading />);
    type('xq');
    advance(announceDelay);
    expect(said()).toEqual([]);
    rerender(<Loading loading={false} />);
    advance(announceDelay);
    expect(said()).toEqual(['No cities match']);
  });

  it('waits while a Control around it is loading', () => {
    function Wrapped({ loading }: { loading: boolean }) {
      return (
        <Field label="City">
          <Control isLoading={loading}>
            <Combobox>
              <Combobox.Input />
              <Combobox.Menu>
                <Combobox.Empty>No cities match</Combobox.Empty>
              </Combobox.Menu>
            </Combobox>
          </Control>
        </Field>
      );
    }
    const { rerender } = render(<Wrapped loading />);
    type('xq');
    advance(announceDelay);
    expect(said()).toEqual([]);
    rerender(<Wrapped loading={false} />);
    advance(announceDelay);
    expect(said()).toEqual(['No cities match']);
  });

  it('announces the empty message inline once typing brings it on screen', () => {
    render(<PeopleList />);
    type('zz');
    advance(announceDelay);
    expect(said()).toEqual(['Nobody matches']);
  });

  it('starts quiet again once the list closes', () => {
    render(<CountrySelect />);
    type('zz');
    advance(announceDelay + announcementLifetime);
    key('Escape');
    fireEvent.click(field());
    advance(announceDelay);
    expect(said()).toEqual([]);
  });

  it('announces no count', () => {
    render(<CountrySelect />);
    type('a');
    advance(announceDelay);
    expect(said()).toEqual([]);
  });
});

describe('Combobox on the server', () => {
  it('renders a closed Combobox with aria-expanded="false" and no list', () => {
    const html = renderToString(<CountrySelect />);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="listbox"');
    expect(html).toContain('role="status"');
  });

  it('renders an inline list, expanded', () => {
    const html = renderToString(<PeopleList />);
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Grace Hopper');
  });

  it('renders no portaled panel, even open, and points at none', () => {
    const html = renderToString(<CountrySelect defaultOpen appendToBody />);
    expect(html).not.toContain('role="listbox"');
    // Collapsed until the panel is on the page, so nothing names a list the
    // markup doesn't have.
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('aria-controls');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      expect(danglingIdRefs(container)).toEqual([]);
    } finally {
      container.remove();
    }
  });

  it('names a field with an id of its own in server markup', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <CountrySelect inputProps={{ id: 'country' }} />
    );
    document.body.appendChild(container);
    try {
      const input = container.querySelector('input') as HTMLInputElement;
      const label = container.querySelector('label') as HTMLLabelElement;
      expect(input).toHaveAttribute('id', 'country');
      // The label's `for` hasn't caught up with the field's id yet, so the
      // field points at the label itself.
      expect(input).toHaveAttribute('aria-labelledby', label.id);
      expect(within(container).getByRole('combobox', { name: 'Country' })).toBe(
        input
      );
    } finally {
      container.remove();
    }
  });

  it('hands the name back to the label once the field has hydrated', async () => {
    const ui = <CountrySelect inputProps={{ id: 'country' }} />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      expect(errorSpy).not.toHaveBeenCalled();
      const input = container.querySelector('input') as HTMLInputElement;
      expect(container.querySelector('label')).toHaveAttribute(
        'for',
        'country'
      );
      expect(input).not.toHaveAttribute('aria-labelledby');
      expect(within(container).getByRole('combobox', { name: 'Country' })).toBe(
        input
      );
      expect(danglingIdRefs(container)).toEqual([]);
    } finally {
      errorSpy.mockRestore();
      await act(async () => root!.unmount());
      container.remove();
    }
  });

  it('keeps a name the caller gave the field, in server markup too', () => {
    const html = renderToString(
      <CountrySelect
        inputProps={{ id: 'country', 'aria-label': 'Destination country' }}
      />
    );
    expect(html).toContain('aria-label="Destination country"');
    expect(html).not.toContain('aria-labelledby');
  });

  it('points at no label a surrounding Field renders', () => {
    // That label doesn't name a field with an id of its own once the page
    // hydrates, so it isn't borrowed before then either.
    const html = renderToString(
      <Field label="Outer">
        <Combobox>
          <Combobox.Input id="own" />
        </Combobox>
      </Field>
    );
    expect(html).not.toContain('aria-labelledby');
  });

  it('expands a portaled list once it shows after hydrating', async () => {
    const ui = <CountrySelect defaultOpen appendToBody />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      const input = container.querySelector('input') as HTMLInputElement;
      const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
      expect(listbox).not.toBeNull();
      expect(container.contains(listbox)).toBe(false);
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
    } finally {
      await act(async () => root!.unmount());
      container.remove();
    }
  });

  it.each([
    ['a closed Combobox', <CountrySelect key="c" />],
    ['an inline one', <PeopleList key="i" initialValue="Ada Lovelace" />],
    ['an open one', <CountrySelect key="o" defaultOpen />],
    ['a portaled one', <CountrySelect key="p" defaultOpen appendToBody />],
  ])('hydrates %s without a mismatch', async (_name, ui) => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      expect(errorSpy).not.toHaveBeenCalled();
      expect(danglingIdRefs(container)).toEqual([]);
    } finally {
      errorSpy.mockRestore();
      await act(async () => root!.unmount());
      container.remove();
    }
  });

  it('keys the arrows after hydrating', async () => {
    const ui = <CountrySelect />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      const input = container.querySelector('input') as HTMLInputElement;
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const id = input.getAttribute('aria-activedescendant') as string;
      expect(document.getElementById(id)).toHaveTextContent('Canada');
    } finally {
      await act(async () => root!.unmount());
      container.remove();
    }
  });
});
