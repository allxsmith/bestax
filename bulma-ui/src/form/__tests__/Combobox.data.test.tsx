/**
 * The Combobox given `data`: it renders its own parts, filters the items by
 * label, and keeps the value. The keys, the ARIA, the portal and the styles
 * are the parts' own, which `Combobox.test.tsx` covers, so these are about
 * what `data` adds.
 */
import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Combobox, type ComboboxItemData } from '../Combobox';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import { announceDelay } from '../../helpers/statusRegion';

const COUNTRIES = ['Canada', 'France', 'Germany', 'Japan', 'Mexico'];

const DRINKS: ComboboxItemData[] = [
  { value: 'coffee', label: 'Coffee', group: 'Hot' },
  { value: 'water', label: 'Water' },
  { value: 'lemonade', label: 'Lemonade', group: 'Cold' },
  { value: 'tea', label: 'Tea', group: 'Hot' },
  { value: 'smoothie', label: 'Smoothie', group: 'Cold', disabled: true },
  { value: 'milk', label: 'Milk' },
];

const field = () => screen.getByRole('combobox') as HTMLInputElement;
const option = (name: string) => screen.getByRole('option', { name });
const options = () => screen.queryAllByRole('option').map(o => o.textContent);
const key = (k: string) => fireEvent.keyDown(field(), { key: k });
const type = (value: string) => {
  act(() => field().focus());
  fireEvent.change(field(), { target: { value } });
};
/** Opens the list the way a click in the field does. */
const open = () => {
  act(() => field().focus());
  fireEvent.click(field());
};
const pick = (name: string) => fireEvent.click(option(name));

beforeEach(() => {
  resetDevWarnings();
});

describe('Combobox with data', () => {
  describe('Rendering', () => {
    it('renders the label and the field, and the list once it opens', () => {
      const { container } = render(
        <Combobox label="Country" data={COUNTRIES} placeholder="Pick one" />
      );
      expect(screen.getByLabelText('Country')).toBe(field());
      expect(field()).toHaveAttribute('placeholder', 'Pick one');
      expect(field()).toHaveValue('');
      expect(screen.queryByRole('listbox')).toBeNull();

      open();
      const menu = container.querySelector('.dropdown-menu.combobox-menu');
      expect(menu).toContainElement(screen.getByRole('listbox'));
      expect(options()).toEqual(COUNTRIES);
      expect(field()).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows an object item by its label, and by its value without one', () => {
      render(
        <Combobox
          label="Size"
          data={[{ value: 's', label: 'Small' }, { value: 'xl' }]}
        />
      );
      open();
      expect(options()).toEqual(['Small', 'xl']);
    });

    it('puts its ref, its class and the helper props on div.combobox', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <Combobox
          ref={ref}
          label="Country"
          data={COUNTRIES}
          className="extra"
          mt="2"
          data-testid="root"
        />
      );
      const root = container.querySelector('.combobox');
      expect(ref.current).toBe(root);
      expect(root).toHaveClass('extra', 'mt-2');
      expect(screen.getByTestId('root')).toBe(root);
    });

    it('shows the list in place with inline, with no menu', () => {
      const { container } = render(
        <Combobox label="Country" data={COUNTRIES} inline />
      );
      expect(container.querySelector('.dropdown-menu')).toBeNull();
      expect(
        container.querySelector('.combobox.is-inline > .combobox-list')
      ).toBe(screen.getByRole('listbox'));
    });

    it('portals the menu with appendToBody', () => {
      const target = document.createElement('section');
      document.body.appendChild(target);
      try {
        const { container } = render(
          <ConfigProvider portalContainer={target}>
            <Combobox label="Country" data={COUNTRIES} appendToBody />
          </ConfigProvider>
        );
        open();
        expect(target).toContainElement(screen.getByRole('listbox'));
        expect(container).not.toContainElement(screen.getByRole('listbox'));
      } finally {
        target.remove();
      }
    });

    it('sizes the field and the menu', () => {
      const { container } = render(
        <Combobox label="Country" data={COUNTRIES} size="small" />
      );
      open();
      expect(container.querySelector('.combobox')).toHaveClass('is-small');
      expect(field()).toHaveClass('is-small');
      expect(container.querySelector('.combobox-menu')).toHaveClass('is-small');
    });
  });

  describe('Filtering', () => {
    it('filters by label as the user types, ignoring case and spaces', () => {
      render(<Combobox label="Country" data={COUNTRIES} />);
      type(' AN ');
      expect(options()).toEqual(['Canada', 'France', 'Germany', 'Japan']);
      type('mex');
      expect(options()).toEqual(['Mexico']);
    });

    it('matches the label, not the value', () => {
      render(
        <Combobox
          label="Size"
          data={[
            { value: 'sm', label: 'Small' },
            { value: 'lg', label: 'Large' },
          ]}
        />
      );
      type('sm');
      expect(options()).toEqual(['Small']);
      type('lg');
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('closes the menu when nothing matches and there is no empty message', () => {
      const { container } = render(
        <Combobox label="Country" data={COUNTRIES} />
      );
      type('zzz');
      expect(container.querySelector('.combobox-menu')).toBeNull();
      expect(field()).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows and announces the empty message when nothing matches', () => {
      jest.useFakeTimers();
      try {
        render(
          <Combobox
            label="Country"
            data={COUNTRIES}
            empty="No countries match"
          />
        );
        type('zzz');
        const empty = screen.getByText('No countries match');
        expect(empty).toHaveClass('combobox-empty');
        expect(empty.closest('.combobox-menu')).not.toBeNull();
        expect(screen.queryByRole('listbox')).toBeNull();
        act(() => {
          jest.advanceTimersByTime(announceDelay);
        });
        expect(screen.getByRole('status')).toHaveTextContent(
          'No countries match'
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('renders an item through itemTemplate, handing a string over as value and label', () => {
      const template = jest.fn((item: ComboboxItemData) => (
        <strong>{`${item.label} (${item.value})`}</strong>
      ));
      render(
        <Combobox
          label="Size"
          data={['Small', { value: 'lg', label: 'Large', group: 'Big' }]}
          itemTemplate={template}
        />
      );
      open();
      expect(options()).toEqual(['Small (Small)', 'Large (lg)']);
      expect(within(option('Large (lg)')).getByText('Large (lg)').tagName).toBe(
        'STRONG'
      );
      expect(template).toHaveBeenCalledWith({ value: 'Small', label: 'Small' });
      expect(template).toHaveBeenCalledWith({
        value: 'lg',
        label: 'Large',
        group: 'Big',
      });
    });
  });

  describe('Groups and disabled items', () => {
    it('groups items in the order data first names the group, ungrouped ones together', () => {
      render(<Combobox label="Drink" data={DRINKS} />);
      open();
      const list = screen.getByRole('listbox');
      const groups = within(list).getAllByRole('group');
      expect(groups.map(g => g.getAttribute('aria-labelledby'))).toHaveLength(
        2
      );
      expect(screen.getByRole('group', { name: 'Hot' })).toBeInTheDocument();
      expect(
        within(screen.getByRole('group', { name: 'Hot' }))
          .getAllByRole('option')
          .map(o => o.textContent)
      ).toEqual(['Coffee', 'Tea']);
      expect(
        within(screen.getByRole('group', { name: 'Cold' }))
          .getAllByRole('option')
          .map(o => o.textContent)
      ).toEqual(['Lemonade', 'Smoothie']);
      // Hot first, then the ungrouped ones where Water was, then Cold.
      expect(options()).toEqual([
        'Coffee',
        'Tea',
        'Water',
        'Milk',
        'Lemonade',
        'Smoothie',
      ]);
    });

    it('drops a group whose items all filter out', () => {
      render(<Combobox label="Drink" data={DRINKS} />);
      type('co');
      expect(screen.getByRole('group', { name: 'Hot' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Cold' })).toBeNull();
    });

    it('reaches a disabled item and never picks it', () => {
      const onChange = jest.fn();
      const onSelect = jest.fn();
      render(
        <Combobox
          label="Drink"
          data={DRINKS}
          onChange={onChange}
          onSelect={onSelect}
        />
      );
      type('smoo');
      const smoothie = option('Smoothie');
      expect(smoothie).toHaveAttribute('aria-disabled', 'true');
      key('ArrowDown');
      expect(field()).toHaveAttribute('aria-activedescendant', smoothie.id);
      key('Enter');
      fireEvent.click(smoothie);
      expect(onChange).not.toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('One value', () => {
    it('keeps the pick, shows its label and reports it', () => {
      const onChange = jest.fn();
      const onSelect = jest.fn();
      render(
        <Combobox
          label="Drink"
          data={DRINKS}
          onChange={onChange}
          onSelect={onSelect}
        />
      );
      type('tea');
      pick('Tea');
      expect(onSelect).toHaveBeenCalledWith('tea');
      expect(onChange).toHaveBeenCalledWith('tea');
      expect(field()).toHaveValue('Tea');
      expect(screen.queryByRole('listbox')).toBeNull();

      // It opens on the whole list, with the highlight on the pick.
      fireEvent.click(field());
      expect(options()).toHaveLength(DRINKS.length);
      expect(option('Tea')).toHaveClass('is-checked');
      expect(option('Tea')).toHaveAttribute('aria-selected', 'true');
    });

    it('picks with the keys', () => {
      const onChange = jest.fn();
      render(<Combobox label="Country" data={COUNTRIES} onChange={onChange} />);
      act(() => field().focus());
      key('ArrowDown');
      key('ArrowDown');
      key('Enter');
      expect(onChange).toHaveBeenCalledWith('France');
      expect(field()).toHaveValue('France');
    });

    it('picks the top match on Enter with keepFirst', () => {
      const onChange = jest.fn();
      render(
        <Combobox
          label="Country"
          data={COUNTRIES}
          keepFirst
          onChange={onChange}
        />
      );
      type('an');
      key('Enter');
      expect(onChange).toHaveBeenCalledWith('Canada');
    });

    it('reports a pick of the value it already has to onSelect only', () => {
      const onChange = jest.fn();
      const onSelect = jest.fn();
      render(
        <Combobox
          label="Country"
          data={COUNTRIES}
          defaultValue="Japan"
          onChange={onChange}
          onSelect={onSelect}
        />
      );
      open();
      pick('Japan');
      expect(onSelect).toHaveBeenCalledWith('Japan');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('starts from defaultValue', () => {
      render(<Combobox label="Drink" data={DRINKS} defaultValue="lemonade" />);
      expect(field()).toHaveValue('Lemonade');
    });

    it('puts the label back when the field loses focus without a pick', () => {
      const onChange = jest.fn();
      render(
        <Combobox
          label="Country"
          data={COUNTRIES}
          defaultValue="France"
          onChange={onChange}
        />
      );
      type('ger');
      expect(field()).toHaveValue('ger');
      fireEvent.blur(field());
      expect(field()).toHaveValue('France');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('follows a controlled value, and reports a pick without taking it', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <Combobox
          label="Country"
          data={COUNTRIES}
          value="Canada"
          onChange={onChange}
        />
      );
      expect(field()).toHaveValue('Canada');
      open();
      pick('Mexico');
      expect(onChange).toHaveBeenCalledWith('Mexico');
      expect(field()).toHaveValue('Canada');

      rerender(
        <Combobox
          label="Country"
          data={COUNTRIES}
          value={null}
          onChange={onChange}
        />
      );
      expect(field()).toHaveValue('');
    });

    it('shows a value data has no item for as it is', () => {
      render(<Combobox label="Country" data={COUNTRIES} value="Peru" />);
      expect(field()).toHaveValue('Peru');
    });

    it('works with a value held by the app', () => {
      function Picker() {
        const [value, setValue] = useState<string | null>(null);
        return (
          <>
            <Combobox
              label="Country"
              data={COUNTRIES}
              value={value}
              onChange={setValue}
            />
            <output>{value ?? 'none'}</output>
          </>
        );
      }
      render(<Picker />);
      type('jap');
      pick('Japan');
      expect(screen.getByText('Japan', { selector: 'output' })).toBeTruthy();
      expect(field()).toHaveValue('Japan');
    });
  });

  describe('Several values', () => {
    it('toggles picks, keeps the list open and shows them as tags', () => {
      const onChange = jest.fn();
      const onSelect = jest.fn();
      const { container } = render(
        <Combobox
          label="Drinks"
          data={DRINKS}
          multiple
          onChange={onChange}
          onSelect={onSelect}
        />
      );
      open();
      expect(screen.getByRole('listbox')).toHaveAttribute(
        'aria-multiselectable',
        'true'
      );
      pick('Coffee');
      pick('Water');
      expect(onChange).toHaveBeenLastCalledWith(['coffee', 'water']);
      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(option('Coffee')).toHaveAttribute('aria-selected', 'true');
      expect(option('Tea')).toHaveAttribute('aria-selected', 'false');

      const tags = container.querySelector('.field + .tags') as HTMLElement;
      expect(tags).toHaveClass('mt-2');
      expect(
        within(tags)
          .getAllByText(/./, { selector: '.tag' })
          .map(t => t.textContent)
      ).toEqual(['Coffee', 'Water']);

      pick('Coffee');
      expect(onChange).toHaveBeenLastCalledWith(['water']);
      expect(field()).toHaveValue('');
    });

    it('takes a value off with its tag button, and focus goes back to the field', () => {
      const onChange = jest.fn();
      render(
        <Combobox
          label="Drinks"
          data={DRINKS}
          multiple
          defaultValue={['tea', 'milk']}
          onChange={onChange}
        />
      );
      const remove = screen.getByRole('button', { name: 'Remove Tea' });
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(onChange).toHaveBeenCalledWith(['milk']);
      expect(screen.queryByRole('button', { name: 'Remove Tea' })).toBeNull();
      expect(field()).toHaveFocus();
    });

    it('shows no tags while nothing is picked', () => {
      const { container } = render(
        <Combobox label="Drinks" data={DRINKS} multiple />
      );
      expect(container.querySelector('.tags')).toBeNull();
    });

    it('follows a controlled array', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <Combobox
          label="Drinks"
          data={DRINKS}
          multiple
          value={['coffee']}
          onChange={onChange}
        />
      );
      open();
      pick('Tea');
      expect(onChange).toHaveBeenCalledWith(['coffee', 'tea']);
      expect(screen.queryByRole('button', { name: 'Remove Tea' })).toBeNull();
      rerender(
        <Combobox
          label="Drinks"
          data={DRINKS}
          multiple
          value={['coffee', 'tea']}
          onChange={onChange}
        />
      );
      expect(screen.getByRole('button', { name: 'Remove Tea' })).toBeTruthy();
    });

    it('keeps the typing while picking, and clears it when the field loses focus', () => {
      render(<Combobox label="Drinks" data={DRINKS} multiple />);
      type('te');
      pick('Tea');
      expect(field()).toHaveValue('te');
      fireEvent.blur(field());
      expect(field()).toHaveValue('');
    });
  });

  describe('name', () => {
    it('posts one value through a hidden input, empty while there is none', () => {
      const { container, rerender } = render(
        <form>
          <Combobox label="Drink" data={DRINKS} name="drink" />
        </form>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).getAll('drink')).toEqual(['']);
      rerender(
        <form>
          <Combobox label="Drink" data={DRINKS} name="drink" value="tea" />
        </form>
      );
      expect(new FormData(form).getAll('drink')).toEqual(['tea']);
    });

    it('posts each of several values', () => {
      const { container } = render(
        <form>
          <Combobox
            label="Drinks"
            data={DRINKS}
            name="drinks"
            multiple
            defaultValue={['tea', 'milk']}
          />
        </form>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).getAll('drinks')).toEqual(['tea', 'milk']);
    });

    it('posts nothing without a name', () => {
      const { container } = render(
        <Combobox label="Drink" data={DRINKS} value="tea" />
      );
      expect(container.querySelector('input[type="hidden"]')).toBeNull();
    });
  });

  describe('Form basics', () => {
    it('disables the field, the items, the tag buttons and the hidden inputs', () => {
      const onChange = jest.fn();
      const { container } = render(
        <form>
          <Combobox
            label="Drinks"
            data={DRINKS}
            name="drinks"
            multiple
            inline
            disabled
            defaultValue={['tea']}
            onChange={onChange}
          />
        </form>
      );
      expect(field()).toBeDisabled();
      expect(option('Coffee')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(option('Coffee'));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Tea', { selector: '.tag' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Remove Tea' })).toBeNull();
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).getAll('drinks')).toEqual([]);
    });

    it('makes the field required while nothing is picked', () => {
      const { container } = render(
        <form>
          <Combobox label="Country" data={COUNTRIES} name="country" required />
        </form>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(field()).toHaveAttribute('required');
      expect(field()).toHaveAttribute('aria-required', 'true');
      expect(form.checkValidity()).toBe(false);
      open();
      pick('Japan');
      expect(field()).not.toHaveAttribute('required');
      expect(field()).toHaveAttribute('aria-required', 'true');
      expect(form.checkValidity()).toBe(true);
    });

    it('with several values, needs a pick rather than text in the field', () => {
      const { container } = render(
        <form>
          <Combobox
            label="Drinks"
            data={DRINKS}
            multiple
            required
            defaultValue={['tea']}
          />
        </form>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(field()).toHaveValue('');
      expect(field()).not.toHaveAttribute('required');
      expect(form.checkValidity()).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Remove Tea' }));
      expect(field()).toHaveAttribute('required');
      expect(form.checkValidity()).toBe(false);
    });

    it('posts with a form it sits outside, through form', () => {
      const { container } = render(
        <>
          <form id="order" />
          <Combobox
            label="Drinks"
            data={DRINKS}
            name="drinks"
            form="order"
            multiple
            required
            defaultValue={['tea', 'milk']}
          />
        </>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(field()).toHaveAttribute('form', 'order');
      expect(new FormData(form).getAll('drinks')).toEqual(['tea', 'milk']);
      fireEvent.click(screen.getByRole('button', { name: 'Remove Tea' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove Milk' }));
      expect(form.checkValidity()).toBe(false);
    });

    it('puts its id on the field, so a label of your own names it', () => {
      const { container } = render(
        <>
          <label htmlFor="drink">Drink</label>
          <Combobox data={DRINKS} id="drink" />
        </>
      );
      expect(field()).toHaveAttribute('id', 'drink');
      expect(screen.getByLabelText('Drink')).toBe(field());
      expect(container.querySelector('.combobox')).not.toHaveAttribute('id');
    });

    it('takes the id of a field it labels itself', () => {
      render(<Combobox label="Drink" data={DRINKS} id="drink" />);
      expect(field()).toHaveAttribute('id', 'drink');
      expect(screen.getByLabelText('Drink')).toBe(field());
    });

    it('names the field and the list with aria-label, not the wrapper', () => {
      const { container } = render(
        <Combobox data={DRINKS} aria-label="Drink" inline />
      );
      expect(screen.getByRole('combobox', { name: 'Drink' })).toBe(field());
      expect(screen.getByRole('listbox', { name: 'Drink' })).toBeTruthy();
      expect(container.querySelector('.combobox')).not.toHaveAttribute(
        'aria-label'
      );
    });

    it('names the field and the list with aria-labelledby, not the wrapper', () => {
      const { container } = render(
        <>
          <h2 id="drink-heading">Your drink</h2>
          <Combobox data={DRINKS} aria-labelledby="drink-heading" inline />
        </>
      );
      expect(screen.getByRole('combobox', { name: 'Your drink' })).toBe(
        field()
      );
      expect(screen.getByRole('listbox', { name: 'Your drink' })).toBeTruthy();
      expect(container.querySelector('.combobox')).not.toHaveAttribute(
        'aria-labelledby'
      );
    });

    it('keeps the label naming the field when no name is given', () => {
      render(<Combobox label="Drink" data={DRINKS} id="drink" inline />);
      expect(screen.getByRole('combobox', { name: 'Drink' })).toBe(field());
      expect(screen.getByRole('listbox', { name: 'Drink' })).toBeTruthy();
    });
  });

  describe('children', () => {
    it('ignores children given with data, and warns once in development', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const props = {
          label: 'Country',
          data: COUNTRIES,
          children: <span>Ignored</span>,
        } as unknown as React.ComponentProps<typeof Combobox>;
        const { rerender } = render(<Combobox {...props} />);
        rerender(<Combobox {...props} />);
        expect(screen.queryByText('Ignored')).toBeNull();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(
          /<Combobox data> renders its own field, menu and items/
        );
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe('Server rendering', () => {
    it.each([
      [
        'one value',
        <Combobox
          key="1"
          label="Drink"
          data={DRINKS}
          name="drink"
          defaultValue="tea"
        />,
      ],
      [
        'several values with tags',
        <Combobox
          key="2"
          label="Drinks"
          data={DRINKS}
          name="drinks"
          multiple
          defaultValue={['tea', 'milk']}
        />,
      ],
      [
        'an open list with groups',
        <Combobox key="3" label="Drink" data={DRINKS} defaultOpen />,
      ],
      [
        'an inline list',
        <Combobox key="4" label="Drink" data={DRINKS} inline />,
      ],
    ])(
      'renders %s on the server and hydrates without a mismatch',
      async (_name, ui) => {
        const html = renderToString(ui);
        expect(html).toContain('role="combobox"');
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);
        const errorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        let root: ReturnType<typeof hydrateRoot> | undefined;
        try {
          await act(async () => {
            root = hydrateRoot(container, ui);
          });
          expect(errorSpy).not.toHaveBeenCalled();
        } finally {
          errorSpy.mockRestore();
          await act(async () => root!.unmount());
          container.remove();
        }
      }
    );

    it('puts the value, the tags and the hidden inputs in server markup', () => {
      const html = renderToString(
        <Combobox
          label="Drinks"
          data={DRINKS}
          name="drinks"
          multiple
          defaultValue={['tea']}
        />
      );
      expect(html).toContain('name="drinks" value="tea"');
      expect(html).toContain('aria-label="Remove Tea"');
    });
  });
});
