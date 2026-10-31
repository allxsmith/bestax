/**
 * One Escape closes one layer (#1077). A popup inside a `Modal` or a
 * `Sidebar` closes on the first Escape and marks it used with
 * `preventDefault()`. The overlay around it listens on `window`, so it hears
 * the key after the popup has, React handler or `document` listener, and it
 * leaves a used Escape alone. The next Escape, with nothing open inside,
 * closes the overlay. Escape with nothing open closes the overlay at once.
 * A `Dropdown` menu around a popup, and a `Toast` on the page, leave a used
 * Escape alone the same way. A picker claims only an Escape pressed in it.
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Modal } from '../components/Modal';
import { Sidebar } from '../components/Sidebar';
import { Toast } from '../components/Toast';
import { Dropdown, DropdownItem } from '../components/Dropdown';
import { Popover } from '../components/Popover';
import { Autocomplete } from '../form/Autocomplete';
import { Taginput } from '../form/Taginput';
import { Combobox } from '../form/Combobox';
import { DateInput } from '../form/DateInput';
import { TimeInput } from '../form/TimeInput';
import { DateTimeInput } from '../form/DateTimeInput';
import { DateRangeInput } from '../form/DateRangeInput';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  }
});

const fruits = ['Apple', 'Banana', 'Cherry'];

/** Escape where focus is, as the keyboard sends it. */
const pressEscape = () => {
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
  });
};

/**
 * Opens a Modal holding `content` after a button of its own, so the Modal's
 * first focus lands on the button rather than on a field that opens on
 * focus. Returns its `onClose`.
 */
const renderInModal = (content: React.ReactNode) => {
  const onClose = vi.fn();
  render(
    <Modal active onClose={onClose} aria-label="Edit">
      <button type="button">Save</button>
      {content}
    </Modal>
  );
  return onClose;
};

/** Types into the field with focus on it, as a user would. */
const typeInto = (input: HTMLElement, value: string) => {
  act(() => input.focus());
  fireEvent.change(input, { target: { value } });
};

/**
 * A Combobox the way an app writes one: it holds the text, filters the
 * fruits, and renders no list when nothing matches.
 */
const FruitCombobox = ({ inline = false }: { inline?: boolean }) => {
  const [query, setQuery] = React.useState('');
  const matches = fruits.filter(fruit =>
    fruit.toLowerCase().includes(query.toLowerCase())
  );
  const options = matches.length > 0 && (
    <Combobox.List>
      {matches.map(fruit => (
        <Combobox.Item key={fruit} value={fruit}>
          {fruit}
        </Combobox.Item>
      ))}
    </Combobox.List>
  );
  return (
    <Combobox label="Fruit" inline={inline} onSelect={setQuery}>
      <Combobox.Input value={query} onChange={e => setQuery(e.target.value)} />
      {inline ? options : <Combobox.Menu>{options}</Combobox.Menu>}
    </Combobox>
  );
};

describe('Escape in a popup inside a Modal', () => {
  describe('Autocomplete', () => {
    it('closes the open list first, and the Modal on the next Escape', () => {
      const onClose = renderInModal(
        <Autocomplete label="Fruit" data={fruits} />
      );
      typeInto(screen.getByRole('combobox'), 'a');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      pressEscape();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes the empty message first, as it does the list', () => {
      const onClose = renderInModal(
        <Autocomplete label="Fruit" data={fruits} empty="No fruit" />
      );
      typeInto(screen.getByRole('combobox'), 'zzz');
      expect(screen.getByText('No fruit')).toBeInTheDocument();

      pressEscape();
      expect(screen.queryByText('No fruit')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();
    });

    it.each([
      ['never opened', ''],
      ['typed to no matches, with no empty message', 'zzz'],
    ])(
      'leaves the first Escape to the Modal when nothing shows: %s',
      (_, typed) => {
        const onClose = renderInModal(
          <Autocomplete label="Fruit" data={fruits} />
        );
        typeInto(screen.getByRole('combobox'), typed);
        expect(screen.queryByRole('listbox')).toBeNull();

        pressEscape();
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe('Taginput', () => {
    it('closes the open suggestions first, and the Modal on the next Escape', () => {
      const onClose = renderInModal(<Taginput label="Tags" data={fruits} />);
      typeInto(screen.getByLabelText('Tags'), 'a');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      pressEscape();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['never opened', ''],
      ['typed to no matches', 'zzz'],
    ])(
      'leaves the first Escape to the Modal when no suggestions show: %s',
      (_, typed) => {
        const onClose = renderInModal(<Taginput label="Tags" data={fruits} />);
        typeInto(screen.getByLabelText('Tags'), typed);
        expect(screen.queryByRole('listbox')).toBeNull();

        pressEscape();
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe('Combobox', () => {
    it('closes the open list first, and the Modal on the next Escape', () => {
      const onClose = renderInModal(<FruitCombobox />);
      typeInto(screen.getByRole('combobox'), 'a');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      pressEscape();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['never opened', ''],
      ['typed to no matches', 'zzz'],
    ])(
      'leaves the first Escape to the Modal when no list shows: %s',
      (_, typed) => {
        const onClose = renderInModal(<FruitCombobox />);
        typeInto(screen.getByRole('combobox'), typed);
        expect(screen.queryByRole('listbox')).toBeNull();

        pressEscape();
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    );

    it('hands Escape straight to the Modal when inline', () => {
      const onClose = renderInModal(<FruitCombobox inline />);
      act(() => screen.getByRole('combobox').focus());
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dropdown', () => {
    const renderDropdown = () =>
      renderInModal(
        <Dropdown label="Actions">
          <DropdownItem>Rename</DropdownItem>
          <DropdownItem>Delete</DropdownItem>
        </Dropdown>
      );
    const trigger = () => screen.getByRole('button', { name: /actions/i });
    const root = () => screen.getByTestId('dropdown-root');

    it('closes the open menu first from an item, and the Modal on the next Escape', () => {
      const onClose = renderDropdown();
      act(() => trigger().focus());
      fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
      expect(screen.getByText('Rename')).toHaveFocus();

      pressEscape();
      expect(root()).not.toHaveClass('is-active');
      expect(trigger()).toHaveFocus();
      expect(onClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes the open menu first from its trigger, and the Modal on the next Escape', () => {
      const onClose = renderDropdown();
      act(() => trigger().focus());
      fireEvent.click(trigger());
      expect(root()).toHaveClass('is-active');

      pressEscape();
      expect(root()).not.toHaveClass('is-active');
      expect(onClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('closes a Popover first, and the Modal on the next Escape', () => {
    const onClose = renderInModal(
      <Popover trigger={<button type="button">Filters</button>}>
        <Popover.Header>Filter rows</Popover.Header>
        <Popover.Body>
          <button type="button">Apply</button>
        </Popover.Body>
      </Popover>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();

    pressEscape();
    expect(screen.queryByRole('dialog', { name: 'Filter rows' })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // The picker hears Escape on `document`, through a listener it adds as it
  // opens, which is after the Modal's. The Modal hears it on `window`, after
  // every `document` listener, so the order they were added doesn't matter.
  it.each([
    ['DateInput', <DateInput label="Due" key="d" />, 'Choose date'],
    ['TimeInput', <TimeInput label="At" key="t" />, 'Choose time'],
    [
      'DateTimeInput',
      <DateTimeInput label="When" key="dt" />,
      'Choose date and time',
    ],
    [
      'DateRangeInput',
      <DateRangeInput label="Stay" key="dr" />,
      'Choose date range',
    ],
  ])(
    'closes the %s picker first, and the Modal on the next Escape',
    (_, picker, name) => {
      const onClose = renderInModal(picker);
      fireEvent.click(screen.getByRole('button', { name }));
      const panel = screen.getByRole('dialog', { name });
      expect(panel).toContainElement(document.activeElement as HTMLElement);

      pressEscape();
      expect(screen.queryByRole('dialog', { name })).toBeNull();
      expect(onClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  );

  it('closes the DateInput picker first with focus back on its input', () => {
    const onClose = renderInModal(<DateInput label="Due" />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    act(() => screen.getByRole('combobox').focus());
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();

    pressEscape();
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Escape in a popup inside a Sidebar', () => {
  const renderInSidebar = (content: React.ReactNode) => {
    const onClose = vi.fn();
    render(
      <Sidebar isOpen onClose={onClose} aria-label="Filters">
        <button type="button">Reset</button>
        {content}
      </Sidebar>
    );
    return onClose;
  };

  it('closes a Dropdown menu first, and the Sidebar on the next Escape', () => {
    const onClose = renderInSidebar(
      <Dropdown label="Sort">
        <DropdownItem>Newest</DropdownItem>
      </Dropdown>
    );
    const trigger = screen.getByRole('button', { name: /sort/i });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByText('Newest')).toHaveFocus();

    pressEscape();
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes a DateInput picker first, and the Sidebar on the next Escape', () => {
    const onClose = renderInSidebar(<DateInput label="From" />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();

    pressEscape();
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes a Combobox list first, and the Sidebar on the next Escape', () => {
    const onClose = renderInSidebar(<FruitCombobox />);
    typeInto(screen.getByRole('combobox'), 'a');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    pressEscape();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Escape in a popup inside the top one of two overlays', () => {
  // Only the topmost overlay answers Escape (#1085), and a popup inside it
  // still takes the first one.
  it('closes a Dropdown menu in a Sidebar over a Modal, then the Sidebar, then the Modal', () => {
    const closed: string[] = [];
    const Page = ({ sidebar }: { sidebar: boolean }) => {
      const [modal, setModal] = useState(true);
      const [open, setOpen] = useState(true);
      return (
        <>
          <Modal
            active={modal}
            onClose={() => {
              closed.push('modal');
              setModal(false);
            }}
            aria-label="Edit"
          >
            <button type="button">Save</button>
          </Modal>
          <Sidebar
            isOpen={sidebar && open}
            onClose={() => {
              closed.push('sidebar');
              setOpen(false);
            }}
            aria-label="Filters"
          >
            <Dropdown label="Sort">
              <DropdownItem>Newest</DropdownItem>
            </Dropdown>
          </Sidebar>
        </>
      );
    };
    const { rerender } = render(<Page sidebar={false} />);
    rerender(<Page sidebar />);
    const trigger = screen.getByRole('button', { name: /sort/i });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByText('Newest')).toHaveFocus();

    pressEscape();
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
    expect(closed).toEqual([]);

    pressEscape();
    expect(closed).toEqual(['sidebar']);

    pressEscape();
    expect(closed).toEqual(['sidebar', 'modal']);
  });

  it('closes a DateInput picker in a Modal over a Sidebar, then the Modal, then the Sidebar', () => {
    const closed: string[] = [];
    const Page = ({ modal }: { modal: boolean }) => {
      const [sidebar, setSidebar] = useState(true);
      const [open, setOpen] = useState(true);
      return (
        <>
          <Sidebar
            isOpen={sidebar}
            onClose={() => {
              closed.push('sidebar');
              setSidebar(false);
            }}
            aria-label="Filters"
          >
            <button type="button">Reset</button>
          </Sidebar>
          <Modal
            active={modal && open}
            onClose={() => {
              closed.push('modal');
              setOpen(false);
            }}
            aria-label="Edit"
          >
            <button type="button">Save</button>
            <DateInput label="Due" />
          </Modal>
        </>
      );
    };
    const { rerender } = render(<Page modal={false} />);
    rerender(<Page modal />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();

    pressEscape();
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
    expect(closed).toEqual([]);

    pressEscape();
    expect(closed).toEqual(['modal']);

    pressEscape();
    expect(closed).toEqual(['modal', 'sidebar']);
  });
});

describe('Escape in a Modal opened over an open picker', () => {
  // A dialog that opens on its own, such as a session timeout, or from a
  // button pressed with the keyboard, which closes nothing on the way.
  it('closes the Modal, since the key was not pressed in the picker', () => {
    const onClose = vi.fn();
    const Page = ({ modal }: { modal: boolean }) => (
      <>
        <DateInput label="Due" />
        <Modal active={modal} onClose={onClose} aria-label="Session">
          <button type="button">Stay signed in</button>
        </Modal>
      </>
    );
    const { rerender } = render(<Page modal={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();

    rerender(<Page modal />);
    expect(
      screen.getByRole('button', { name: 'Stay signed in' })
    ).toHaveFocus();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Escape in a popup inside a Dropdown menu', () => {
  it('closes an Autocomplete list first, and the menu on the next Escape', () => {
    render(
      <Dropdown label="Filter" closeOnClick={false}>
        <Autocomplete label="Fruit" data={fruits} />
      </Dropdown>
    );
    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    const root = screen.getByTestId('dropdown-root');
    expect(root).toHaveClass('is-active');
    typeInto(screen.getByRole('combobox'), 'a');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    pressEscape();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(root).toHaveClass('is-active');

    pressEscape();
    expect(root).not.toHaveClass('is-active');
  });

  it('closes a Combobox list first, and the menu on the next Escape', () => {
    render(
      <Dropdown label="Filter" closeOnClick={false}>
        <FruitCombobox />
      </Dropdown>
    );
    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    const root = screen.getByTestId('dropdown-root');
    expect(root).toHaveClass('is-active');
    typeInto(screen.getByRole('combobox'), 'a');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    pressEscape();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(root).toHaveClass('is-active');

    pressEscape();
    expect(root).not.toHaveClass('is-active');
  });

  // The menu hears Escape in a React handler, which runs before the picker's
  // `document` listener, so the picker claims the key in its panel's own
  // React handler too.
  it.each([
    ['with focus in its calendar', false],
    ['with focus back on its input', true],
  ])(
    'closes a DateInput picker first %s, and the menu on the next Escape',
    (_, onInput) => {
      render(
        <Dropdown label="Filter" closeOnClick={false}>
          <DateInput label="From" />
        </Dropdown>
      );
      fireEvent.click(screen.getByRole('button', { name: /filter/i }));
      const root = screen.getByTestId('dropdown-root');
      fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
      const panel = screen.getByRole('dialog', { name: 'Choose date' });
      expect(panel).toContainElement(document.activeElement as HTMLElement);
      if (onInput) {
        act(() => screen.getByRole('combobox').focus());
      }

      pressEscape();
      expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
      expect(root).toHaveClass('is-active');

      pressEscape();
      expect(root).not.toHaveClass('is-active');
    }
  );
});

describe('Escape with a Toast up', () => {
  it('leaves the Toast up when the Escape closed a Dropdown menu in a Modal', () => {
    const onToastClose = vi.fn();
    const onClose = renderInModal(
      <>
        <Toast
          message="Saved"
          duration={0}
          dismissible={false}
          onClose={onToastClose}
        />
        <Dropdown label="Actions">
          <DropdownItem>Rename</DropdownItem>
        </Dropdown>
      </>
    );
    const trigger = screen.getByRole('button', { name: /actions/i });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByText('Rename')).toHaveFocus();

    pressEscape();
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
    expect(onClose).not.toHaveBeenCalled();
    expect(onToastClose).not.toHaveBeenCalled();
  });

  it('leaves the Toast up when the Escape closed a picker opened after it', () => {
    const onToastClose = vi.fn();
    render(
      <>
        <Toast
          message="Saved"
          duration={0}
          dismissible={false}
          onClose={onToastClose}
        />
        <DateInput label="Due" />
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));

    pressEscape();
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
    expect(onToastClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onToastClose).toHaveBeenCalledTimes(1);
  });
});
