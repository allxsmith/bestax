import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  type CommandAction,
} from '../Command';
import { Modal } from '../Modal';
import { Sidebar } from '../Sidebar';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import {
  announceDelay,
  announcementLifetime,
} from '../../helpers/statusRegion';

const ACTIONS: CommandAction[] = [
  { id: 'dashboard', label: 'Go to dashboard', group: 'Navigation' },
  { id: 'settings', label: 'Go to settings', group: 'Navigation' },
  {
    id: 'issue',
    label: 'New issue',
    group: 'Actions',
    description: 'File a bug',
    keywords: ['create'],
  },
  { id: 'theme', label: 'Dark mode', keywords: ['theme', 'appearance'] },
];

const field = () => screen.getByRole('combobox');
const listbox = () => screen.getByRole('listbox');
const options = () => screen.queryAllByRole('option');
const labels = () =>
  options().map(option =>
    option.getAttribute('aria-labelledby')
      ? document.getElementById(
          option.getAttribute('aria-labelledby') as string
        )?.textContent
      : option.textContent
  );
/** The highlighted option's label, read through the field's active descendant. */
const highlighted = () => {
  const id = field().getAttribute('aria-activedescendant');
  if (!id) return null;
  const option = document.getElementById(id) as HTMLElement;
  return within(option).getByText(
    (_, el) => !!el?.className.includes('command-item-label')
  ).textContent;
};
const key = (name: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(field(), { key: name, ...init });
const type = (text: string) =>
  fireEvent.change(field(), { target: { value: text } });

/** Every id an ARIA reference names that isn't on the page. */
const danglingIdRefs = (root: HTMLElement): string[] => {
  const attributes = [
    'aria-labelledby',
    'aria-describedby',
    'aria-controls',
    'aria-activedescendant',
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

afterEach(() => {
  resetDevWarnings();
});

describe('Command given actions', () => {
  it('renders the field, the list, the groups and the items', () => {
    const { container } = render(<Command actions={ACTIONS} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('command');
    expect(field()).toHaveClass('input');
    expect(listbox()).toHaveClass('command-list');
    expect(labels()).toEqual([
      'Go to dashboard',
      'Go to settings',
      'New issue',
      'Dark mode',
    ]);
    const groups = screen.getAllByRole('group');
    expect(groups.map(g => g.getAttribute('aria-labelledby'))).toEqual(
      groups.map(g => g.firstElementChild?.id)
    );
    expect(screen.getByRole('group', { name: 'Navigation' })).toHaveClass(
      'command-group'
    );
    expect(screen.getByText('Navigation')).toHaveClass('command-group-label');
    expect(danglingIdRefs(container)).toEqual([]);
  });

  it('names the field and the list "Commands" by default, and after its label', () => {
    const { rerender } = render(<Command actions={ACTIONS} />);
    expect(screen.getByRole('combobox', { name: 'Commands' })).toBe(field());
    expect(screen.getByRole('listbox', { name: 'Commands' })).toBe(listbox());
    rerender(<Command actions={ACTIONS} label="Settings" />);
    expect(screen.getByRole('combobox', { name: 'Settings' })).toBe(field());
    expect(screen.getByRole('listbox', { name: 'Settings' })).toBe(listbox());
    // An empty label counts as none.
    rerender(<Command actions={ACTIONS} label="" />);
    expect(field()).toHaveAccessibleName('Commands');
  });

  it('puts the placeholder on the field', () => {
    render(<Command actions={ACTIONS} placeholder="Type a command" />);
    expect(field()).toHaveAttribute('placeholder', 'Type a command');
  });

  it('wires the combobox to the list, with the first item highlighted', () => {
    render(<Command actions={ACTIONS} />);
    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(field()).toHaveAttribute('aria-controls', listbox().id);
    expect(field()).toHaveAttribute('aria-autocomplete', 'list');
    expect(field()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(field()).toHaveAttribute('autocomplete', 'off');
    expect(field()).toHaveAttribute('spellcheck', 'false');
    expect(field()).toHaveAttribute('autocorrect', 'off');
    expect(highlighted()).toBe('Go to dashboard');
    const first = options()[0];
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveClass('command-item', 'is-active');
    expect(options()[1]).not.toHaveAttribute('aria-selected');
  });

  describe('the default filter', () => {
    it('matches labels, ignoring case and the spaces around the search', () => {
      render(<Command actions={ACTIONS} />);
      type('  GO TO ');
      expect(labels()).toEqual(['Go to dashboard', 'Go to settings']);
    });

    it('matches keywords and descriptions after labels', () => {
      const actions: CommandAction[] = [
        { id: 'a', label: 'Appearance', description: 'Colors' },
        { id: 'b', label: 'Dark mode', keywords: ['appearance'] },
        { id: 'c', label: 'Layout', description: 'Choose an appearance' },
        { id: 'd', label: 'Help' },
      ];
      render(<Command actions={actions} />);
      type('appear');
      expect(labels()).toEqual(['Appearance', 'Dark mode', 'Layout']);
      expect(highlighted()).toBe('Appearance');
      type('bug');
      expect(labels()).toEqual([]);
    });

    it('groups the matches in the order they first name a group, so the best match is on top', () => {
      const actions: CommandAction[] = [
        { id: 'a', label: 'Open file', group: 'Files' },
        { id: 'b', label: 'Theme', group: 'Settings', keywords: ['open'] },
        { id: 'c', label: 'Open recent', group: 'Settings' },
        { id: 'd', label: 'Reopen tab' },
        { id: 'e', label: 'Copy', keywords: ['open'] },
      ];
      render(<Command actions={actions} />);
      type('open');
      // Label matches first: Open file, Open recent, Reopen tab, then
      // Theme and Copy, each group where it's first named.
      expect(labels()).toEqual([
        'Open file',
        'Open recent',
        'Theme',
        'Reopen tab',
        'Copy',
      ]);
      expect(
        screen.getAllByRole('group').map(g => g.firstElementChild?.textContent)
      ).toEqual(['Files', 'Settings']);
      expect(highlighted()).toBe('Open file');
    });

    it('keeps them all for an empty search', () => {
      render(<Command actions={ACTIONS} defaultQuery="   " />);
      expect(options()).toHaveLength(4);
    });
  });

  it('takes a filter of its own, handed the search as typed', () => {
    const filter = vi.fn((query: string, actions: CommandAction[]) =>
      actions.filter(a => a.id.startsWith(query)).reverse()
    );
    render(<Command actions={ACTIONS} filter={filter} />);
    expect(filter).toHaveBeenLastCalledWith('', ACTIONS);
    type('d');
    expect(filter).toHaveBeenLastCalledWith('d', ACTIONS);
    expect(labels()).toEqual(['Go to dashboard']);
    type('');
    expect(labels()[0]).toBe('Dark mode');
  });

  it('shows "No results" when nothing matches, and its own empty message', () => {
    const { rerender } = render(<Command actions={ACTIONS} />);
    type('zzz');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('No results')).toHaveClass('command-empty');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).not.toHaveAttribute('aria-controls');
    expect(field()).not.toHaveAttribute('aria-activedescendant');
    rerender(<Command actions={ACTIONS} empty="Nothing to do" />);
    expect(screen.getByText('Nothing to do')).toBeInTheDocument();
    rerender(<Command actions={ACTIONS} empty={null} />);
    expect(screen.queryByText('Nothing to do')).not.toBeInTheDocument();
    expect(document.querySelector('.command-empty')).toBeNull();
  });

  it('renders an action’s icon, description and hint', () => {
    render(
      <Command
        actions={[
          {
            id: 'issue',
            label: 'New issue',
            icon: <svg data-testid="icon" />,
            description: 'File a bug',
            hint: <kbd>N</kbd>,
          },
        ]}
      />
    );
    const option = options()[0];
    const icon = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(icon).toHaveClass('command-item-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('File a bug')).toHaveClass(
      'command-item-description'
    );
    expect(screen.getByText('N').parentElement).toHaveClass(
      'command-item-hint'
    );
    expect(option).toHaveAccessibleName('New issue');
    expect(option).toHaveAccessibleDescription('File a bug N');
  });

  it('runs an action with Enter: its own onSelect, then the Command’s', () => {
    const calls: string[] = [];
    const actions: CommandAction[] = [
      { id: 'a', label: 'Alpha', onSelect: () => calls.push('action a') },
      { id: 'b', label: 'Beta' },
    ];
    render(<Command actions={actions} onSelect={value => calls.push(value)} />);
    key('Enter');
    expect(calls).toEqual(['action a', 'a']);
    key('ArrowDown');
    key('Enter');
    expect(calls).toEqual(['action a', 'a', 'b']);
  });

  it('runs an action on a click, and keeps focus in the field', () => {
    const onSelect = vi.fn();
    render(<Command actions={ACTIONS} onSelect={onSelect} />);
    field().focus();
    fireEvent.mouseDown(options()[2]);
    fireEvent.click(options()[2]);
    expect(onSelect).toHaveBeenCalledWith('issue');
    expect(field()).toHaveFocus();
  });

  it('never runs a disabled action, which the arrows still reach', () => {
    const onSelect = vi.fn();
    const run = vi.fn();
    render(
      <Command
        actions={[
          { id: 'a', label: 'Alpha', disabled: true, onSelect: run },
          { id: 'b', label: 'Beta' },
        ]}
        onSelect={onSelect}
      />
    );
    // The first enabled one is highlighted.
    expect(highlighted()).toBe('Beta');
    key('ArrowUp');
    expect(highlighted()).toBe('Alpha');
    const disabled = options()[0];
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).not.toHaveAttribute('aria-selected');
    expect(disabled).toHaveClass('is-disabled', 'is-active');
    key('Enter');
    fireEvent.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('ignores children, with a warning in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      // @ts-expect-error -- children aren't taken with actions
      <Command actions={ACTIONS}>
        <p>Ignored</p>
      </Command>
    );
    expect(screen.queryByText('Ignored')).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('<Command actions> renders its own')
    );
    warn.mockRestore();
  });
});

describe('the search', () => {
  it('is the Command’s own when uncontrolled, from defaultQuery', () => {
    const onQueryChange = vi.fn();
    render(
      <Command
        actions={ACTIONS}
        defaultQuery="dark"
        onQueryChange={onQueryChange}
      />
    );
    expect(field()).toHaveValue('dark');
    expect(labels()).toEqual(['Dark mode']);
    type('go');
    expect(field()).toHaveValue('go');
    expect(onQueryChange).toHaveBeenCalledWith('go');
  });

  it('follows query when controlled', () => {
    function Controlled() {
      const [query, setQuery] = useState('new');
      return (
        <>
          <Command actions={ACTIONS} query={query} onQueryChange={setQuery} />
          <button onClick={() => setQuery('')}>Clear</button>
        </>
      );
    }
    render(<Controlled />);
    expect(field()).toHaveValue('new');
    expect(labels()).toEqual(['New issue']);
    type('dark');
    expect(labels()).toEqual(['Dark mode']);
    fireEvent.click(screen.getByText('Clear'));
    expect(field()).toHaveValue('');
    expect(options()).toHaveLength(4);
  });

  it('stays put when controlled and nothing updates it', () => {
    render(<Command actions={ACTIONS} query="go" />);
    type('dark');
    expect(field()).toHaveValue('go');
  });

  it('moves the highlight to the top match as the user types', async () => {
    const user = userEvent.setup();
    render(<Command actions={ACTIONS} />);
    await user.click(field());
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(highlighted()).toBe('New issue');
    await user.type(field(), 'go to s');
    expect(highlighted()).toBe('Go to settings');
  });
});

describe('the keys', () => {
  it('wraps the arrows at both ends', () => {
    render(<Command actions={ACTIONS} />);
    key('ArrowUp');
    expect(highlighted()).toBe('Dark mode');
    key('ArrowDown');
    expect(highlighted()).toBe('Go to dashboard');
    key('ArrowDown');
    key('ArrowDown');
    expect(highlighted()).toBe('New issue');
  });

  it('hands Home, End, Left and Right back to the field', () => {
    render(<Command actions={ACTIONS} />);
    for (const name of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
      key('ArrowDown');
      expect(highlighted()).not.toBeNull();
      key(name);
      expect(highlighted()).toBeNull();
    }
  });

  it('runs nothing on Enter with nothing highlighted', () => {
    const onSelect = vi.fn();
    render(<Command actions={ACTIONS} onSelect={onSelect} />);
    key('End');
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    field().dispatchEvent(enter);
    expect(onSelect).not.toHaveBeenCalled();
    // The key goes on, so a form around it would submit.
    expect(enter.defaultPrevented).toBe(false);
  });

  it('leaves the keys to an IME that is composing', () => {
    const onSelect = vi.fn();
    render(<Command actions={ACTIONS} onSelect={onSelect} />);
    key('ArrowDown', { isComposing: true });
    expect(highlighted()).toBe('Go to dashboard');
    key('Enter', { keyCode: 229 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('leaves Escape to what is around it', () => {
    render(<Command actions={ACTIONS} />);
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    field().dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
    expect(listbox()).toBeInTheDocument();
  });

  it('runs a caller’s handlers first, and a key they used is theirs', () => {
    const onSelect = vi.fn();
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => {
      if (event.key === 'Enter') event.preventDefault();
    });
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const onBlur = vi.fn();
    const onChange = vi.fn();
    render(
      <Command onSelect={onSelect}>
        <Command.Input
          onKeyDown={onKeyDown}
          onClick={onClick}
          onBlur={onBlur}
          onChange={onChange}
        />
        <Command.List>
          <Command.Item value="a">Alpha</Command.Item>
        </Command.List>
      </Command>
    );
    key('Enter');
    expect(onKeyDown).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(field());
    expect(onClick).toHaveBeenCalled();
    fireEvent.blur(field());
    expect(onBlur).toHaveBeenCalled();
    type('a');
    expect(onChange).toHaveBeenCalled();
    fireEvent.click(field(), { button: 0 });
    // Inline, the list stays on screen whatever happens to the field.
    expect(listbox()).toBeInTheDocument();
  });
});

describe('Command built from parts', () => {
  function People({
    onSelect,
    loading = false,
  }: {
    onSelect?: (value: string) => void;
    loading?: boolean;
  }) {
    const [query, setQuery] = useState('');
    const people = ['Ada Lovelace', 'Grace Hopper'].filter(p =>
      p.toLowerCase().includes(query.toLowerCase())
    );
    return (
      <Command label="People" onQueryChange={setQuery} onSelect={onSelect}>
        <Command.Input placeholder="Find a person" isLoading={loading} />
        {people.length > 0 ? (
          <Command.List>
            {people.map(p => (
              <Command.Item key={p} value={p}>
                {p}
              </Command.Item>
            ))}
          </Command.List>
        ) : (
          <Command.Empty>No one matches</Command.Empty>
        )}
      </Command>
    );
  }

  it('filters nothing itself: the app renders what matches', () => {
    render(
      <Command>
        <Command.Input />
        <Command.List>
          <Command.Item value="a">Alpha</Command.Item>
          <Command.Item value="b">Beta</Command.Item>
        </Command.List>
      </Command>
    );
    type('zzz');
    expect(options()).toHaveLength(2);
  });

  it('reports the search for the app to filter on, and runs a pick', () => {
    const onSelect = vi.fn();
    render(<People onSelect={onSelect} />);
    type('grace');
    expect(labels()).toEqual(['Grace Hopper']);
    key('Enter');
    expect(onSelect).toHaveBeenCalledWith('Grace Hopper');
    type('zzz');
    expect(screen.getByText('No one matches')).toHaveClass('command-empty');
  });

  it('runs an item’s own onSelect before the Command’s, with Enter or a click', () => {
    const calls: string[] = [];
    render(
      <Command onSelect={value => calls.push(`command ${value}`)}>
        <Command.Input />
        <Command.List>
          <Command.Item value="a" onSelect={() => calls.push('item a')}>
            Alpha
          </Command.Item>
          <Command.Item value="b">Beta</Command.Item>
        </Command.List>
      </Command>
    );
    key('Enter');
    fireEvent.click(options()[1]);
    expect(calls).toEqual(['item a', 'command a', 'command b']);
  });

  it('runs an item’s latest onSelect', () => {
    function Changing() {
      const [count, setCount] = useState(0);
      return (
        <Command>
          <Command.Input />
          <Command.List>
            <Command.Item value="a" onSelect={() => setCount(count + 1)}>
              Ran {count}
            </Command.Item>
          </Command.List>
        </Command>
      );
    }
    render(<Changing />);
    key('Enter');
    key('Enter');
    expect(screen.getByText('Ran 2')).toBeInTheDocument();
  });

  it('keeps the onSelect of an item that shares a value with one that left', () => {
    const first = vi.fn();
    const second = vi.fn();
    function Twins({ both }: { both: boolean }) {
      return (
        <Command>
          <Command.Input />
          <Command.List>
            {both && (
              <Command.Item value="a" onSelect={first}>
                First
              </Command.Item>
            )}
            <Command.Item value="a" onSelect={second}>
              Second
            </Command.Item>
          </Command.List>
        </Command>
      );
    }
    const { rerender } = render(<Twins both />);
    rerender(<Twins both={false} />);
    key('Enter');
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  it('forgets an item’s onSelect once it has gone', () => {
    const run = vi.fn();
    const onSelect = vi.fn();
    function Going({ shown }: { shown: boolean }) {
      return (
        <Command onSelect={onSelect}>
          <Command.Input />
          <Command.List>
            {shown && (
              <Command.Item value="a" onSelect={run}>
                Alpha
              </Command.Item>
            )}
            <Command.Item value="b">Beta</Command.Item>
          </Command.List>
        </Command>
      );
    }
    const { rerender } = render(<Going shown />);
    rerender(<Going shown={false} />);
    rerender(<Going shown />);
    expect(highlighted()).toBe('Alpha');
    key('Enter');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('names an item by its label and describes it by its description and hint', () => {
    render(
      <Command>
        <Command.Input />
        <Command.List>
          <Command.Item value="a" description="First letter" hint="A">
            Alpha
          </Command.Item>
          <Command.Item value="b" hint="B">
            Beta
          </Command.Item>
          <Command.Item value="c" description="">
            Gamma
          </Command.Item>
        </Command.List>
      </Command>
    );
    const [a, b, c] = options();
    expect(a).toHaveAccessibleName('Alpha');
    expect(a).toHaveAccessibleDescription('First letter A');
    expect(b).toHaveAccessibleDescription('B');
    expect(c).not.toHaveAttribute('aria-describedby');
    expect(c.querySelector('.command-item-description')).toBeNull();
    expect(c.querySelector('.command-item-icon')).toBeNull();
    expect(c.querySelector('.command-item-hint')).toBeNull();
  });

  it('keeps names and descriptions the caller gave the parts', () => {
    render(
      <Command label="Things">
        <Command.Input aria-label="Search things" />
        <Command.List aria-label="Things found">
          <Command.Group label="Letters" aria-label="Greek letters">
            <Command.Item
              value="a"
              aria-label="The letter alpha"
              aria-describedby="note"
            >
              Alpha
            </Command.Item>
          </Command.Group>
        </Command.List>
        <p id="note">A note</p>
      </Command>
    );
    expect(field()).toHaveAccessibleName('Search things');
    expect(listbox()).toHaveAccessibleName('Things found');
    expect(screen.getByRole('group')).toHaveAccessibleName('Greek letters');
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
    expect(options()[0]).toHaveAccessibleName('The letter alpha');
    expect(options()[0]).toHaveAccessibleDescription('A note');
  });

  it('keeps an aria-labelledby the caller gave the parts', () => {
    render(
      <Command>
        <h2 id="heading">Search</h2>
        <Command.Input aria-labelledby="heading" />
        <Command.List aria-labelledby="heading">
          <Command.Group label="Letters" aria-labelledby="heading">
            <Command.Item value="a" aria-labelledby="heading">
              Alpha
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    );
    expect(field()).toHaveAccessibleName('Search');
    expect(field()).not.toHaveAttribute('aria-label');
    expect(listbox()).toHaveAccessibleName('Search');
    expect(screen.getByRole('group')).toHaveAccessibleName('Search');
    expect(options()[0]).toHaveAccessibleName('Search');
  });

  it('draws a search icon at the start of the field, unless it’s given another or none', () => {
    const { rerender, container } = render(
      <Command>
        <Command.Input />
      </Command>
    );
    const control = () => container.querySelector('.control') as HTMLElement;
    expect(control()).toHaveClass('has-icons-left');
    expect(control().querySelector('.icon.is-left svg')).toBeInTheDocument();
    expect(control().querySelector('.icon.is-left')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    rerender(
      <Command>
        <Command.Input iconLeft={null} />
      </Command>
    );
    expect(control()).not.toHaveClass('has-icons-left');
    rerender(
      <Command>
        <Command.Input iconLeft={<span data-testid="mine" />} />
      </Command>
    );
    expect(screen.getByTestId('mine')).toBeInTheDocument();
    rerender(
      <Command>
        <Command.Input iconLeftName="magnifying-glass" />
      </Command>
    );
    expect(control().querySelector('.fa-magnifying-glass')).toBeInTheDocument();
  });

  it('shows the field loading, and takes aria-autocomplete from the caller', () => {
    const { container } = render(
      <Command>
        <Command.Input isLoading aria-autocomplete="none" />
      </Command>
    );
    expect(container.querySelector('.control')).toHaveClass('is-loading');
    expect(field()).toHaveAttribute('aria-autocomplete', 'none');
  });

  it('keeps a press in the list, a group or the empty message from taking focus', () => {
    const onMouseDown = vi.fn();
    render(
      <Command>
        <Command.Input />
        <Command.List onMouseDown={onMouseDown}>
          <Command.Item value="a">Alpha</Command.Item>
        </Command.List>
        <Command.Empty onMouseDown={onMouseDown}>Nothing</Command.Empty>
      </Command>
    );
    expect(fireEvent.mouseDown(listbox())).toBe(false);
    expect(fireEvent.mouseDown(screen.getByText('Nothing'))).toBe(false);
    expect(onMouseDown).toHaveBeenCalledTimes(2);
  });

  it('runs a caller’s click and pointer handlers on an item, and a used click is theirs', () => {
    const onSelect = vi.fn();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const onPointerMove = vi.fn();
    render(
      <Command onSelect={onSelect}>
        <Command.Input />
        <Command.List>
          <Command.Item value="a">Alpha</Command.Item>
          <Command.Item
            value="b"
            onClick={onClick}
            onPointerMove={onPointerMove}
          >
            Beta
          </Command.Item>
          <Command.Item value="c" disabled>
            Gamma
          </Command.Item>
        </Command.List>
      </Command>
    );
    fireEvent.pointerMove(options()[1]);
    expect(onPointerMove).toHaveBeenCalled();
    expect(highlighted()).toBe('Beta');
    // Moving over the highlighted one again, or a disabled one, changes
    // nothing.
    fireEvent.pointerMove(options()[1]);
    fireEvent.pointerMove(options()[2]);
    expect(highlighted()).toBe('Beta');
    fireEvent.click(options()[1]);
    expect(onClick).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('holds back the empty message’s announcement while the field is loading', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(<People loading />);
      const said = () =>
        Array.from(screen.getByRole('status').children, el => el.textContent);
      type('zzz');
      act(() => {
        vi.advanceTimersByTime(announceDelay);
      });
      expect(said()).toEqual([]);
      rerender(<People />);
      act(() => {
        vi.advanceTimersByTime(announceDelay);
      });
      expect(said()).toEqual(['No one matches']);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Command announces its empty message', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  const said = () =>
    Array.from(screen.getByRole('status').children, el => el.textContent);

  it('has its polite status region in the page, empty, from the start', () => {
    const { container } = render(<Command actions={ACTIONS} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();
    expect(status.parentElement).toBe(container.firstElementChild);
  });

  it('once when typing brings it on screen, and not a count', () => {
    render(<Command actions={ACTIONS} />);
    type('go');
    advance(announceDelay);
    expect(said()).toEqual([]);
    type('zz');
    advance(announceDelay);
    expect(said()).toEqual(['No results']);
    advance(announcementLifetime);
    type('zzz');
    advance(announceDelay);
    expect(said()).toEqual([]);
  });

  it('not when the search starts out matching nothing, or is emptied', () => {
    render(
      <Command>
        <Command.Input />
        <Command.Empty>Nothing here</Command.Empty>
      </Command>
    );
    advance(announceDelay);
    expect(said()).toEqual([]);
    type('a');
    type('');
    advance(announceDelay);
    expect(said()).toEqual([]);
  });
});

describe('Command.Dialog', () => {
  function Palette(
    props: Partial<React.ComponentProps<typeof Command.Dialog>>
  ) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          actions={ACTIONS}
          {...(props as object)}
        />
      </>
    );
  }
  const dialog = () => screen.queryByRole('dialog');

  it('renders nothing while closed', () => {
    render(<Palette />);
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('is a named modal dialog holding the Command, inside a Modal', () => {
    render(<Command.Dialog defaultOpen actions={ACTIONS} className="mine" />);
    const box = dialog() as HTMLElement;
    expect(box).toHaveAttribute('aria-modal', 'true');
    expect(box).toHaveAccessibleName('Commands');
    expect(box).toHaveClass('command', 'command-dialog', 'mine');
    const modal = box.parentElement as HTMLElement;
    expect(modal).toHaveClass('modal', 'is-active');
    expect(modal).toHaveAttribute('role', 'presentation');
    expect(modal).not.toHaveAttribute('aria-modal');
    expect(modal.querySelector('.modal-background')).toBeInTheDocument();
    expect(within(box).getByRole('combobox')).toHaveAccessibleName('Commands');
  });

  it('is named by its label, or by an aria-label or aria-labelledby of its own', () => {
    const { rerender } = render(
      <Command.Dialog defaultOpen actions={ACTIONS} label="Go to" />
    );
    expect(dialog()).toHaveAccessibleName('Go to');
    expect(field()).toHaveAccessibleName('Go to');
    rerender(
      <Command.Dialog
        defaultOpen
        actions={ACTIONS}
        label="Go to"
        aria-label="Quick open"
      />
    );
    expect(dialog()).toHaveAccessibleName('Quick open');
    expect(field()).toHaveAccessibleName('Go to');
    rerender(
      <>
        <h2 id="title">Jump anywhere</h2>
        <Command.Dialog defaultOpen actions={ACTIONS} aria-labelledby="title" />
      </>
    );
    expect(dialog()).toHaveAccessibleName('Jump anywhere');
    expect(dialog()).not.toHaveAttribute('aria-label');
  });

  it('opens with focus in the field and hands it back on Escape', () => {
    const onOpenChange = vi.fn();
    render(<Palette onOpenChange={onOpenChange} />);
    const opener = screen.getByText('Open');
    opener.focus();
    fireEvent.click(opener);
    expect(field()).toHaveFocus();
    expect(highlighted()).toBe('Go to dashboard');
    fireEvent.keyDown(field(), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape and a click on the background, uncontrolled', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Command.Dialog
        defaultOpen
        actions={ACTIONS}
        onOpenChange={onOpenChange}
      />
    );
    fireEvent.keyDown(field(), { key: 'Escape' });
    expect(dialog()).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    rerender(<Command.Dialog key="again" defaultOpen actions={ACTIONS} />);
    fireEvent.click(document.querySelector('.modal-background') as Element);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('runs a pick, then closes, unless closeOnSelect is off', () => {
    const calls: string[] = [];
    const actions: CommandAction[] = [
      { id: 'a', label: 'Alpha', onSelect: () => calls.push('action') },
    ];
    const { rerender } = render(
      <Command.Dialog
        defaultOpen
        actions={actions}
        onSelect={value => calls.push(value)}
      />
    );
    key('Enter');
    expect(calls).toEqual(['action', 'a']);
    expect(dialog()).not.toBeInTheDocument();

    rerender(
      <Command.Dialog
        key="stays"
        defaultOpen
        actions={actions}
        closeOnSelect={false}
      />
    );
    key('Enter');
    expect(calls).toEqual(['action', 'a', 'action']);
    expect(dialog()).toBeInTheDocument();
  });

  it('clears an uncontrolled search when it closes, unless clearOnClose is off', () => {
    const { rerender } = render(<Palette />);
    fireEvent.click(screen.getByText('Open'));
    type('dark');
    fireEvent.keyDown(field(), { key: 'Escape' });
    fireEvent.click(screen.getByText('Open'));
    expect(field()).toHaveValue('');
    expect(options()).toHaveLength(4);

    rerender(<Palette key="keeps" clearOnClose={false} />);
    fireEvent.click(screen.getByText('Open'));
    type('dark');
    fireEvent.keyDown(field(), { key: 'Escape' });
    fireEvent.click(screen.getByText('Open'));
    expect(field()).toHaveValue('dark');
    expect(labels()).toEqual(['Dark mode']);
  });

  it('starts from defaultQuery the first time it opens', () => {
    render(<Palette defaultQuery="new" />);
    fireEvent.click(screen.getByText('Open'));
    expect(field()).toHaveValue('new');
  });

  it('clears a controlled search through onQueryChange when it closes, however it closed', () => {
    const changes: string[] = [];
    function Controlled({ clearOnClose }: { clearOnClose?: boolean }) {
      const [open, setOpen] = useState(true);
      const [query, setQuery] = useState('');
      return (
        <>
          <button onClick={() => setOpen(false)}>Close</button>
          <button onClick={() => setOpen(true)}>Open</button>
          <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            query={query}
            onQueryChange={next => {
              changes.push(next);
              setQuery(next);
            }}
            clearOnClose={clearOnClose}
            actions={ACTIONS}
          />
        </>
      );
    }
    const { unmount } = render(<Controlled />);
    // Closed with an empty search: nothing to clear.
    fireEvent.click(screen.getByText('Close'));
    expect(changes).toEqual([]);
    fireEvent.click(screen.getByText('Open'));
    type('dark');
    fireEvent.click(screen.getByText('Close'));
    expect(changes).toEqual(['dark', '']);
    fireEvent.click(screen.getByText('Open'));
    expect(field()).toHaveValue('');
    unmount();

    changes.length = 0;
    render(<Controlled clearOnClose={false} />);
    type('dark');
    fireEvent.click(screen.getByText('Close'));
    fireEvent.click(screen.getByText('Open'));
    expect(changes).toEqual(['dark']);
    expect(field()).toHaveValue('dark');
  });

  it('reports a change it asks for only when it is one', () => {
    const onOpenChange = vi.fn();
    render(
      <Command.Dialog open actions={ACTIONS} onOpenChange={onOpenChange} />
    );
    // Controlled and kept open: Escape asks, and the dialog stays.
    fireEvent.keyDown(field(), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeInTheDocument();
  });

  it('forwards its ref to the dialog box, and its portal to the Modal', () => {
    const ref = createRef<HTMLDivElement>();
    const target = document.createElement('div');
    document.body.appendChild(target);
    try {
      render(
        <Command.Dialog
          defaultOpen
          actions={ACTIONS}
          ref={ref}
          portal={target}
        />
      );
      expect(ref.current).toBe(dialog());
      expect(target).toContainElement(dialog());
    } finally {
      target.remove();
    }
  });

  it('takes parts as well as actions', () => {
    const onSelect = vi.fn();
    render(
      <Command.Dialog defaultOpen onSelect={onSelect}>
        <Command.Input />
        <Command.List>
          <Command.Item value="a">Alpha</Command.Item>
        </Command.List>
      </Command.Dialog>
    );
    key('Enter');
    expect(onSelect).toHaveBeenCalledWith('a');
    expect(dialog()).not.toBeInTheDocument();
  });

  it('warns in development when nothing can open it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Command.Dialog actions={ACTIONS} />);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('<Command.Dialog> has no way to open')
    );
    warn.mockClear();
    render(<Command.Dialog actions={ACTIONS} open={false} />);
    render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  describe('its shortcut', () => {
    const press = (
      init: KeyboardEventInit & { key: string },
      target: EventTarget = document.body
    ) => {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        composed: true,
        ...init,
      });
      act(() => {
        target.dispatchEvent(event);
      });
      return event;
    };

    it('is off unless given', () => {
      render(<Command.Dialog actions={ACTIONS} open={false} />);
      press({ key: 'k', ctrlKey: true });
      press({ key: 'k', metaKey: true });
      expect(dialog()).not.toBeInTheDocument();
    });

    it('opens on Ctrl or ⌘ for mod, and marks the key used', () => {
      const { unmount } = render(
        <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
      );
      const event = press({ key: 'k', ctrlKey: true });
      expect(event.defaultPrevented).toBe(true);
      expect(dialog()).toBeInTheDocument();
      unmount();
      render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
      press({ key: 'K', metaKey: true });
      expect(dialog()).toBeInTheDocument();
    });

    it('reports the open through onOpenChange, controlled', () => {
      const onOpenChange = vi.fn();
      render(
        <Command.Dialog
          actions={ACTIONS}
          shortcut="mod+k"
          open={false}
          onOpenChange={onOpenChange}
        />
      );
      press({ key: 'k', ctrlKey: true });
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(dialog()).not.toBeInTheDocument();
    });

    it('wants exactly the modifiers it names', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="ctrl+shift+p" />);
      press({ key: 'p', ctrlKey: true });
      press({ key: 'P', ctrlKey: true, shiftKey: true, altKey: true });
      press({ key: 'P', metaKey: true, shiftKey: true });
      press({ key: 'P', ctrlKey: true, metaKey: true, shiftKey: true });
      expect(dialog()).not.toBeInTheDocument();
      press({ key: 'P', ctrlKey: true, shiftKey: true });
      expect(dialog()).toBeInTheDocument();
    });

    it('doesn’t take mod+shift+k for mod+k', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
      press({ key: 'K', ctrlKey: true, shiftKey: true });
      press({ key: 'j', ctrlKey: true });
      press({ key: 'k' });
      expect(dialog()).not.toBeInTheDocument();
    });

    it('reads the modifiers’ other names, spaces, and named keys', () => {
      const cases: Array<[string, KeyboardEventInit & { key: string }]> = [
        ['Command + Option + J', { key: 'j', metaKey: true, altKey: true }],
        ['cmd+j', { key: 'j', metaKey: true }],
        ['meta+j', { key: 'j', metaKey: true }],
        ['control+j', { key: 'j', ctrlKey: true }],
        ['alt+j', { key: 'j', altKey: true }],
        ['ctrl+space', { key: ' ', ctrlKey: true }],
        ['shift+esc', { key: 'Escape', shiftKey: true }],
        ['/', { key: '/' }],
        ['f1', { key: 'F1' }],
      ];
      for (const [shortcut, init] of cases) {
        const { unmount } = render(
          <Command.Dialog actions={ACTIONS} shortcut={shortcut} />
        );
        press(init);
        expect([shortcut, !!dialog()]).toEqual([shortcut, true]);
        unmount();
      }
    });

    it('lets a symbol say whether Shift was down', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="?" />);
      press({ key: '?', shiftKey: true });
      expect(dialog()).toBeInTheDocument();
    });

    it('wants Shift for a named key unless it names it', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="f1" />);
      press({ key: 'F1', shiftKey: true });
      expect(dialog()).not.toBeInTheDocument();
    });

    it('matches a letter or digit by its place when the layout types something else', () => {
      const { unmount } = render(
        <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
      );
      // Cyrillic: the K key types л.
      press({ key: 'л', code: 'KeyK', ctrlKey: true });
      expect(dialog()).toBeInTheDocument();
      unmount();

      const second = render(
        <Command.Dialog actions={ACTIONS} shortcut="alt+1" />
      );
      // Option+1 on a Mac types ¡.
      press({ key: '¡', code: 'Digit1', altKey: true });
      expect(dialog()).toBeInTheDocument();
      second.unmount();

      render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
      // Another Latin layout's letter in that place keeps its own shortcut,
      // as on Dvorak, where the K key types t.
      press({ key: 't', code: 'KeyK', ctrlKey: true });
      // And a symbol is never matched by place.
      press({ key: 'л', code: 'KeyJ', ctrlKey: true });
      expect(dialog()).not.toBeInTheDocument();
    });

    it('matches a symbol by its key only', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="mod+/" />);
      press({ key: '÷', code: 'Slash', ctrlKey: true });
      expect(dialog()).not.toBeInTheDocument();
      press({ key: '/', code: 'Slash', ctrlKey: true });
      expect(dialog()).toBeInTheDocument();
    });

    it('is ignored while typing in a field, a text area, a select or editable content', () => {
      render(
        <>
          <input data-testid="text" />
          <input data-testid="search" type="search" />
          <textarea data-testid="area" />
          <select data-testid="select">
            <option>One</option>
          </select>
          <div
            data-testid="editable"
            contentEditable
            suppressContentEditableWarning
          >
            <span data-testid="inside">Text</span>
          </div>
          <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
        </>
      );
      for (const id of ['text', 'search', 'area', 'select', 'inside']) {
        const event = press(
          { key: 'k', ctrlKey: true },
          screen.getByTestId(id)
        );
        expect([id, event.defaultPrevented]).toEqual([id, false]);
      }
      expect(dialog()).not.toBeInTheDocument();
    });

    it('still works from a control that takes no typing, or content that isn’t editable', () => {
      const targets = ['checkbox', 'button', 'not-editable', 'plain'];
      for (const id of targets) {
        const { unmount } = render(
          <>
            <input data-testid="checkbox" type="checkbox" />
            <button data-testid="button">Button</button>
            <div contentEditable="false" data-testid="not-editable" />
            <p data-testid="plain">Text</p>
            <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
          </>
        );
        press({ key: 'k', ctrlKey: true }, screen.getByTestId(id));
        expect([id, !!dialog()]).toEqual([id, true]);
        unmount();
      }
    });

    it('reads a keydown that names no key as no match', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
      const event = new KeyboardEvent('keydown', {
        ctrlKey: true,
        bubbles: true,
      });
      // As the keydown Chrome sends when it autofills a field.
      Object.defineProperty(event, 'key', { value: undefined });
      act(() => {
        document.body.dispatchEvent(event);
      });
      expect(dialog()).not.toBeInTheDocument();
    });

    it('works from the window itself', () => {
      render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
      press({ key: 'k', ctrlKey: true }, window);
      expect(dialog()).toBeInTheDocument();
    });

    it('sees through a shadow root to the field typed in', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });
      const input = document.createElement('input');
      shadow.appendChild(input);
      try {
        render(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />);
        press({ key: 'k', ctrlKey: true }, input);
        expect(dialog()).not.toBeInTheDocument();
      } finally {
        host.remove();
      }
    });

    it('is ignored while an IME is composing, or when the key was used', () => {
      render(
        <>
          <div
            data-testid="user"
            onKeyDown={event => {
              if (event.key === 'j') event.preventDefault();
            }}
          />
          <Command.Dialog actions={ACTIONS} shortcut="mod+j" />
        </>
      );
      press({ key: 'j', ctrlKey: true, isComposing: true });
      press({ key: 'j', ctrlKey: true, keyCode: 229 } as KeyboardEventInit & {
        key: string;
      });
      press({ key: 'j', ctrlKey: true }, screen.getByTestId('user'));
      expect(dialog()).not.toBeInTheDocument();
    });

    it('is quiet while another overlay is open', () => {
      function Page() {
        const [modal, setModal] = useState(true);
        return (
          <>
            <Modal isActive={modal} onClose={() => setModal(false)}>
              <Modal.Background />
              <Modal.Content>Settings</Modal.Content>
            </Modal>
            <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
          </>
        );
      }
      render(<Page />);
      const palette = () => screen.queryByRole('dialog', { name: 'Commands' });
      press({ key: 'k', ctrlKey: true });
      expect(palette()).not.toBeInTheDocument();
      press({ key: 'Escape' });
      press({ key: 'k', ctrlKey: true });
      expect(palette()).toBeInTheDocument();
    });

    it('still opens over a Sidebar without an overlay, which leaves the page in use', () => {
      render(
        <>
          <Sidebar isOpen overlay={false} inline onClose={() => {}}>
            Navigation
          </Sidebar>
          <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
        </>
      );
      press({ key: 'k', ctrlKey: true });
      expect(
        screen.getByRole('dialog', { name: 'Commands' })
      ).toBeInTheDocument();
    });

    it('only opens: while open, its keypress does nothing', () => {
      const onOpenChange = vi.fn();
      render(
        <Command.Dialog
          actions={ACTIONS}
          shortcut="mod+k"
          defaultOpen
          onOpenChange={onOpenChange}
        />
      );
      const event = press({ key: 'k', ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(dialog()).toBeInTheDocument();
    });

    it('stops listening once it is unmounted', () => {
      const { unmount } = render(
        <Command.Dialog actions={ACTIONS} shortcut="mod+k" />
      );
      unmount();
      const event = press({ key: 'k', ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
    });

    it('warns in development about a shortcut it can’t read, and ignores it', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      for (const shortcut of ['mod+', '+', 'super+k', '']) {
        const { unmount } = render(
          <Command.Dialog actions={ACTIONS} shortcut={shortcut} open={false} />
        );
        press({ key: 'k', ctrlKey: true });
        unmount();
      }
      expect(warn.mock.calls.map(([message]) => message)).toEqual([
        expect.stringContaining('can\'t read the shortcut "mod+"'),
        expect.stringContaining('can\'t read the shortcut "+"'),
        expect.stringContaining('can\'t read the shortcut "super+k"'),
      ]);
      warn.mockRestore();
    });
  });
});

describe('Compound components', () => {
  it('attaches the parts as statics', () => {
    expect(Command.Input).toBe(CommandInput);
    expect(Command.List).toBe(CommandList);
    expect(Command.Group).toBe(CommandGroup);
    expect(Command.Item).toBe(CommandItem);
    expect(Command.Empty).toBe(CommandEmpty);
    expect(Command.Dialog).toBe(CommandDialog);
    expect(Command.displayName).toBe('Command');
  });

  it('renders through the dot paths', () => {
    render(
      <Command label="Letters">
        <Command.Input />
        <Command.List>
          <Command.Group label="Greek">
            <Command.Item value="alpha">Alpha</Command.Item>
          </Command.Group>
        </Command.List>
        <Command.Empty>None</Command.Empty>
      </Command>
    );
    expect(screen.getByRole('group', { name: 'Greek' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('renders a part on its own, outside a Command, with nothing to report to', () => {
    render(
      <>
        <CommandInput />
        <CommandList>
          <CommandItem value="a" onSelect={vi.fn()}>
            Alpha
          </CommandItem>
        </CommandList>
        <CommandEmpty>None</CommandEmpty>
      </>
    );
    const option = screen.getByRole('option');
    expect(option).not.toHaveAttribute('id');
    expect(screen.getByRole('listbox')).not.toHaveAttribute('id');
    fireEvent.click(option);
    fireEvent.pointerMove(option);
    fireEvent.mouseDown(option);
    type('a');
    key('ArrowDown');
    expect(field()).toHaveValue('');
    expect(field()).toHaveAccessibleName('Commands');
  });
});

describe('Command, the element', () => {
  it('forwards its ref to div.command', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Command actions={ACTIONS} ref={ref} />);
    expect(ref.current).toBe(container.firstElementChild);
  });

  it('calls a callback ref', () => {
    let node: HTMLDivElement | null = null;
    const { unmount } = render(
      <Command
        actions={ACTIONS}
        ref={el => {
          node = el;
        }}
      />
    );
    expect(node).toHaveClass('command');
    unmount();
    expect(node).toBeNull();
  });

  it('puts the helper props, className and other attributes on div.command', () => {
    const { container } = render(
      <Command actions={ACTIONS} m="2" className="mine" data-testid="root" />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('command', 'm-2', 'mine');
    expect(root).toHaveAttribute('data-testid', 'root');
    expect(root).not.toHaveAttribute('m');
  });

  it('forwards Command.Input’s ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    const calls: Array<HTMLInputElement | null> = [];
    render(
      <Command>
        <Command.Input ref={ref} />
        <CommandInput
          ref={el => {
            calls.push(el);
          }}
        />
      </Command>
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(calls[0]).toBeInstanceOf(HTMLInputElement);
  });

  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { baseElement } = render(
      <ConfigProvider classPrefix="bestax-">
        <Command
          actions={[
            {
              id: 'a',
              label: 'Alpha',
              group: 'Letters',
              icon: <svg />,
              description: 'First',
              hint: 'A',
            },
            { id: 'b', label: 'Beta', disabled: true },
          ]}
        />
        <Command.Dialog defaultOpen actions={ACTIONS} defaultQuery="zzz" />
      </ConfigProvider>
    );
    const classes = new Set(
      Array.from(baseElement.querySelectorAll('[class]')).flatMap(el =>
        Array.from(el.classList)
      )
    );
    for (const name of [
      'command',
      'command-list',
      'command-group',
      'command-group-label',
      'command-item',
      'command-item-icon',
      'command-item-body',
      'command-item-label',
      'command-item-description',
      'command-item-hint',
      'command-empty',
      'command-dialog',
      'is-active',
      'is-disabled',
    ]) {
      expect(classes).toContain(`bestax-${name}`);
      expect(classes).not.toContain(name);
    }
  });
});

describe('server rendering', () => {
  it('renders the field and the list, with no highlight yet', () => {
    const html = renderToString(<Command actions={ACTIONS} label="Go" />);
    const container = document.createElement('div');
    container.innerHTML = html;
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(4);
  });

  it('renders nothing for a closed dialog', () => {
    expect(
      renderToString(<Command.Dialog actions={ACTIONS} shortcut="mod+k" />)
    ).toBe('');
  });

  it('hydrates without a mismatch, then highlights the first item', async () => {
    const ui = <Command actions={ACTIONS} />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      expect(errorSpy).not.toHaveBeenCalled();
      expect(highlighted()).toBe('Go to dashboard');
      expect(danglingIdRefs(container)).toEqual([]);
    } finally {
      errorSpy.mockRestore();
      await act(async () => root!.unmount());
      container.remove();
    }
  });
});
