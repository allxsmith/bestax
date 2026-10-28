import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Command, type CommandAction } from './Command';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Kbd } from '../elements/Kbd';
import { Paragraph } from '../elements/Paragraph';
import { Tag } from '../elements/Tag';

const ACTIONS: CommandAction[] = [
  {
    id: 'dashboard',
    label: 'Go to dashboard',
    group: 'Navigation',
    icon: <Icon name="house" />,
    hint: (
      <Kbd.Group separator="then">
        <Kbd>G</Kbd>
        <Kbd>D</Kbd>
      </Kbd.Group>
    ),
  },
  {
    id: 'issues',
    label: 'Go to issues',
    group: 'Navigation',
    icon: <Icon name="circle-dot" />,
    hint: (
      <Kbd.Group separator="then">
        <Kbd>G</Kbd>
        <Kbd>I</Kbd>
      </Kbd.Group>
    ),
  },
  {
    id: 'new-issue',
    label: 'New issue',
    group: 'Actions',
    description: 'File a bug or ask for a feature',
    keywords: ['create', 'bug'],
    icon: <Icon name="plus" />,
    hint: <Kbd>C</Kbd>,
  },
  {
    id: 'archive',
    label: 'Archive project',
    group: 'Actions',
    description: 'Only an owner can archive a project',
    icon: <Icon name="box-archive" />,
    disabled: true,
  },
  {
    id: 'theme',
    label: 'Dark mode',
    group: 'Settings',
    keywords: ['theme', 'appearance'],
    icon: <Icon name="moon" />,
    hint: <Tag color="info">New</Tag>,
  },
  {
    id: 'help',
    label: 'Help and feedback',
    icon: <Icon name="circle-question" />,
  },
];

const meta: Meta<typeof Command> = {
  title: 'Components/Command',
  component: Command,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A search field over a list of things to do, which narrows as you type and runs the top match on Enter. Given actions, it filters them by label, keywords and description, groups them and draws them. Built from parts, the items and their filtering are yours. Command.Dialog is the same thing in a Modal, a command palette, with an opt-in shortcut such as mod+k.',
      },
    },
  },
  args: {
    label: 'Commands',
    placeholder: 'Type a command or search',
    actions: ACTIONS,
  },
  argTypes: {
    label: {
      control: 'text',
      description:
        'Names the field and the list for assistive tech, and in Command.Dialog the dialog; "Commands" by default',
    },
    actions: {
      control: 'object',
      description:
        'The actions, as { id, label, description, keywords, group, icon, hint, disabled, onSelect }; the Command filters, groups and draws them',
    },
    filter: {
      control: false,
      description:
        'With actions, takes over the filtering: handed the search and the actions, returns the ones to show',
    },
    placeholder: {
      control: 'text',
      description: 'With actions, the field’s placeholder',
    },
    empty: {
      control: 'text',
      description:
        'With actions, what shows when nothing matches; "No results" by default',
    },
    children: {
      control: false,
      description:
        'Built from parts: Command.Input, then Command.List or Command.Empty',
    },
    query: {
      control: 'text',
      description: 'The search, controlled',
    },
    defaultQuery: {
      control: 'text',
      description: 'The search to start with when uncontrolled',
    },
    onQueryChange: {
      action: 'queryChange',
      description: 'Called with the search as the user types it',
    },
    onSelect: {
      action: 'select',
      description:
        'Called with the run item’s value, an action’s id, after its own onSelect',
    },
    className: {
      control: 'text',
      description: 'Additional classes for div.command',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Given actions, the Command is one element: type to narrow them, the arrows move the highlight, and Enter runs the top match. Each action can have an icon, a description, keywords and a hint at the end of the row, and a disabled one is shown but never runs.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    await userEvent.click(field);
    await userEvent.keyboard('bug');
    await expect(
      canvas.getByRole('option', { name: 'New issue' })
    ).toHaveAttribute('aria-selected', 'true');
  },
};

export const Dialog: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Command.Dialog is a command palette: the same Command in a Modal. Its shortcut opens it, Ctrl+K or ⌘K here, unless you’re typing in a field, and Escape or a click on the background closes it, as does running an action. The button below opens it too, through open and onOpenChange.',
      },
    },
  },
  render: function DialogExample(args) {
    const [open, setOpen] = useState(false);
    const [ran, setRan] = useState<string | null>(null);
    return (
      <Block>
        <Button onClick={() => setOpen(true)} aria-keyshortcuts="Control+K">
          Open the palette
        </Button>
        <Paragraph mt="3">
          Or press{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </Kbd.Group>{' '}
          or{' '}
          <Kbd.Group>
            <Kbd label="Command">⌘</Kbd>
            <Kbd>K</Kbd>
          </Kbd.Group>
          . {ran && `Last run: ${ran}.`}
        </Paragraph>
        <Command.Dialog
          shortcut="mod+k"
          open={open}
          onOpenChange={setOpen}
          placeholder={args.placeholder}
          actions={args.actions as CommandAction[]}
          onSelect={setRan}
        />
      </Block>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /palette/ }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = body.getByRole('dialog', { name: 'Commands' });
    await expect(within(dialog).getByRole('combobox')).toHaveFocus();
    await userEvent.keyboard('dark{Enter}');
    await expect(canvas.getByText(/Last run: theme/)).toBeInTheDocument();
  },
};

/**
 * Whether each letter of the search turns up in the label in order, as a
 * fuzzy matcher's first pass does, scored by how tightly they sit together.
 */
const fuzzy = (query: string, actions: CommandAction[]) => {
  const term = query.replace(/\s+/g, '').toLowerCase();
  if (!term) return actions;
  const scored = actions.flatMap(action => {
    const label = action.label.toLowerCase();
    let at = -1;
    let first = -1;
    for (const letter of term) {
      at = label.indexOf(letter, at + 1);
      if (at === -1) return [];
      if (first === -1) first = at;
    }
    return [{ action, spread: at - first }];
  });
  return scored.sort((a, b) => a.spread - b.spread).map(s => s.action);
};

export const CustomFilter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A filter of your own takes over the matching. This one keeps the actions whose label has the letters of the search in order, so "gtd" finds "Go to dashboard", and puts the tightest matches first. The docs show the same with Fuse.js.',
      },
    },
  },
  args: {
    filter: fuzzy,
    placeholder: 'Try “gtd” or “nis”',
  },
};

const PEOPLE = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Katherine Johnson',
  'Margaret Hamilton',
  'Radia Perlman',
];

export const ServerSearch: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Built from parts, nothing is filtered for you: the app takes the search from onQueryChange, asks for matches and renders them, with isLoading on the field while it waits. The empty message is announced once the answer is in.',
      },
    },
  },
  render: function ServerSearchExample() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(PEOPLE);
    const [picked, setPicked] = useState<string | null>(null);
    useEffect(() => {
      setLoading(true);
      const timer = setTimeout(() => {
        const term = query.trim().toLowerCase();
        setResults(PEOPLE.filter(p => p.toLowerCase().includes(term)));
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }, [query]);
    return (
      <Block>
        <Command label="People" onQueryChange={setQuery} onSelect={setPicked}>
          <Command.Input placeholder="Find a person" isLoading={loading} />
          {results.length > 0 ? (
            <Command.List>
              {results.map(person => (
                <Command.Item
                  key={person}
                  value={person}
                  icon={<Icon name="user" />}
                >
                  {person}
                </Command.Item>
              ))}
            </Command.List>
          ) : (
            <Command.Empty>No one matches</Command.Empty>
          )}
        </Command>
        <Paragraph mt="3">
          {picked ? `Opened ${picked}` : 'Pick someone'}
        </Paragraph>
      </Block>
    );
  },
};

export const Pages: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An action can open another page of the palette rather than run. Turn closeOnSelect off, keep the page in state, and close the dialog yourself once something runs. Backspace in an empty field goes back a page.',
      },
    },
  },
  render: function PagesExample() {
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState<'home' | 'theme'>('home');
    const [query, setQuery] = useState('');
    const [theme, setTheme] = useState('System');
    const close = () => {
      setOpen(false);
      setPage('home');
    };
    const themes = ['Light', 'Dark', 'System'].map(name => ({
      id: name,
      label: name,
      onSelect: () => {
        setTheme(name);
        close();
      },
    }));
    const home: CommandAction[] = [
      {
        id: 'theme',
        label: 'Change theme…',
        hint: theme,
        onSelect: () => {
          setPage('theme');
          setQuery('');
        },
      },
      { id: 'help', label: 'Help and feedback', onSelect: close },
    ];
    return (
      <Block>
        <Button onClick={() => setOpen(true)}>Open the palette</Button>
        <Paragraph mt="3">Theme: {theme}</Paragraph>
        <Command.Dialog
          open={open}
          onOpenChange={next => (next ? setOpen(true) : close())}
          closeOnSelect={false}
          label={page === 'home' ? 'Commands' : 'Themes'}
          placeholder={page === 'home' ? 'Type a command' : 'Pick a theme'}
          query={query}
          onQueryChange={setQuery}
          actions={page === 'home' ? home : themes}
          onKeyDown={event => {
            if (event.key === 'Backspace' && query === '' && page !== 'home') {
              setPage('home');
            }
          }}
        />
      </Block>
    );
  },
};

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Right to left, the icon, the label and the hint follow the writing direction: the hint is pushed to the end of the row, which is now its left.',
      },
    },
  },
  render: function RightToLeftExample() {
    return (
      <div dir="rtl" lang="ar">
        <Command
          label="الأوامر"
          placeholder="ابحث عن أمر"
          empty="لا توجد نتائج"
          actions={[
            {
              id: 'home',
              label: 'الصفحة الرئيسية',
              group: 'التنقل',
              icon: <Icon name="house" />,
            },
            {
              id: 'settings',
              label: 'الإعدادات',
              group: 'التنقل',
              icon: <Icon name="gear" />,
              hint: <Kbd>S</Kbd>,
            },
            {
              id: 'new',
              label: 'ملف جديد',
              group: 'إجراءات',
              description: 'إنشاء ملف فارغ',
              icon: <Icon name="plus" />,
            },
          ]}
        />
      </div>
    );
  },
};

export const CompoundUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Every part in dot notation: Command.Input, Command.List, Command.Group, Command.Item and Command.Empty, with Command.Dialog for the modal. Each is also exported by name (CommandInput and so on). Built from parts, you filter the items from the search onQueryChange reports.',
      },
    },
  },
  render: function CompoundExample() {
    const [query, setQuery] = useState('');
    const [ran, setRan] = useState<string | null>(null);
    const files = [
      { value: 'readme', label: 'README.md', folder: 'Docs' },
      { value: 'guide', label: 'guide.md', folder: 'Docs' },
      { value: 'index', label: 'index.ts', folder: 'Source' },
      { value: 'command', label: 'Command.tsx', folder: 'Source' },
    ];
    const term = query.trim().toLowerCase();
    const matches = files.filter(f => f.label.toLowerCase().includes(term));
    const folders = [...new Set(matches.map(f => f.folder))];
    return (
      <Block>
        <Command label="Files" onQueryChange={setQuery} onSelect={setRan}>
          <Command.Input placeholder="Open a file" />
          {matches.length > 0 ? (
            <Command.List>
              {folders.map(folder => (
                <Command.Group key={folder} label={folder}>
                  {matches
                    .filter(f => f.folder === folder)
                    .map(f => (
                      <Command.Item
                        key={f.value}
                        value={f.value}
                        icon={<Icon name="file" />}
                        description={`${folder.toLowerCase()}/${f.label}`}
                      >
                        {f.label}
                      </Command.Item>
                    ))}
                </Command.Group>
              ))}
            </Command.List>
          ) : (
            <Command.Empty>No files match</Command.Empty>
          )}
        </Command>
        <Paragraph mt="3">
          {ran ? `Opened ${ran}` : 'Nothing opened yet'}
        </Paragraph>
      </Block>
    );
  },
};
