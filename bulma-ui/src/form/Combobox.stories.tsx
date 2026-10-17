import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Combobox, type ComboboxPartsProps } from './Combobox';
import { Popover } from '../components/Popover';
import { Modal } from '../components/Modal';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Block } from '../elements/Block';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Delete } from '../elements/Delete';
import { Paragraph } from '../elements/Paragraph';
import { Tag } from '../elements/Tag';
import { Tags } from '../elements/Tags';
import { Hero } from '../layout/Hero';
import { ConfigProvider } from '../helpers/Config';

const COUNTRIES = [
  'Argentina',
  'Australia',
  'Brazil',
  'Canada',
  'France',
  'Germany',
  'India',
  'Japan',
  'Kenya',
  'Mexico',
  'Norway',
  'Portugal',
];

const meta: Meta<typeof Combobox> = {
  title: 'Form/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A text field with a list to pick from under it. Given data, it renders the field, the menu and the items, filters them by label as you type and keeps the value, with the picks as tags under the field when it takes several. Built from parts, the keys and the ARIA are done and the data is yours: you filter the items, keep the value and set the text in the field, and a pick calls onSelect with the item’s value. For a free-text field with suggestions, Autocomplete is the simpler choice.',
      },
    },
  },
  args: {
    label: 'Country',
  },
  argTypes: {
    label: {
      control: 'text',
      description:
        'The label, which names the field and the list; dropped inside an outer Field',
    },
    labelSize: {
      control: 'select',
      options: [undefined, 'small', 'normal', 'medium', 'large'],
      description: 'Size for the label, in a horizontal layout',
    },
    labelProps: {
      control: false,
      description:
        'Props for the label element; an explicit htmlFor takes over the association',
    },
    horizontal: {
      control: 'boolean',
      description: 'Lays the Field out horizontally',
    },
    message: {
      control: 'text',
      description: 'Help text under the field',
    },
    messageColor: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Bulma color for the help text',
    },
    fieldClassName: {
      control: 'text',
      description: 'Additional classes for the Field',
    },
    className: {
      control: 'text',
      description: 'Additional classes for div.combobox',
    },
    data: {
      control: 'object',
      description:
        'The items, as strings or { value, label, disabled, group }; the Combobox renders them, filters them by label and keeps the value',
    },
    value: {
      control: false,
      description:
        'With data, the controlled value: an item’s value or null, or with multiple an array',
    },
    defaultValue: {
      control: false,
      description: 'With data, the value to start with when uncontrolled',
    },
    onChange: {
      action: 'change',
      description:
        'With data, called with the new value when a pick or a tag’s button changes it',
    },
    placeholder: {
      control: 'text',
      description: 'With data, the field’s placeholder',
    },
    name: {
      control: 'text',
      description:
        'With data, a form field name: hidden inputs post the value, one per value with multiple',
    },
    empty: {
      control: 'text',
      description:
        'With data, what the menu shows when nothing matches; without it, the menu closes then',
    },
    itemTemplate: {
      control: false,
      description: 'With data, renders an item’s content in place of its label',
    },
    children: {
      control: false,
      description:
        'Built from parts: Combobox.Input, then Combobox.Menu with Combobox.List or Combobox.Empty in it',
    },
    open: {
      control: 'boolean',
      description:
        'Controlled open state; opening and closing then only report through onOpenChange',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state when uncontrolled',
    },
    onOpenChange: {
      action: 'openChange',
      description: 'Called with the open state asked for',
    },
    onSelect: {
      action: 'select',
      description:
        'Called with the picked item’s value; built from parts, the Combobox keeps no value and never changes the field',
    },
    keepFirst: {
      control: 'boolean',
      description:
        'Highlights the first enabled item when the list opens or its items change, so Enter picks the top match',
    },
    multiple: {
      control: 'boolean',
      description:
        'Several values: the list stays open after a pick, and checked is each item’s aria-selected',
    },
    inline: {
      control: 'boolean',
      description:
        'The list is always on screen in the flow, as in a Popover; Escape goes to whatever is around it',
    },
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'auto'],
      description:
        'Where the menu opens against the field; auto keeps it in the viewport',
    },
    appendToBody: {
      control: 'boolean',
      description:
        'Portals the menu, fixed at the field, out of a container that clips it',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Sizes the field and the items together',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

/** Opens the list from the keyboard, the way a story's screenshot wants it. */
const openList = async (canvasElement: HTMLElement, index = 0) => {
  const field = within(canvasElement).getAllByRole('combobox')[index];
  await userEvent.click(field);
  // A click opens the list on the checked option, or on nothing.
  if (!field.getAttribute('aria-activedescendant')) {
    await userEvent.keyboard('{ArrowDown}');
  }
  return field;
};

/**
 * The filterable select: the value has to be one of the countries, and the
 * field goes back to it when you leave without picking.
 */
function CountrySelect(props: Partial<ComboboxPartsProps>) {
  const [value, setValue] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Showing the value isn't a search, so the whole list opens.
  const term = query === value ? '' : query.trim().toLowerCase();
  const matches = COUNTRIES.filter(c => c.toLowerCase().includes(term));

  return (
    <Combobox
      label="Country"
      {...props}
      onSelect={picked => {
        setValue(picked);
        setQuery(picked);
        props.onSelect?.(picked);
      }}
    >
      <Combobox.Input
        placeholder="Pick a country"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onBlur={() => setQuery(value ?? '')}
      />
      <Combobox.Menu>
        {matches.length > 0 ? (
          <Combobox.List>
            {matches.map(c => (
              <Combobox.Item key={c} value={c} checked={c === value}>
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Given data, the Combobox is one element: it filters the countries as you type, keeps the pick and shows it in the field.',
      },
    },
  },
  args: {
    data: COUNTRIES,
    placeholder: 'Pick a country',
    empty: 'No countries match',
  },
  play: async ({ canvasElement }) => {
    const field = await openList(canvasElement);
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-activedescendant');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(field).toHaveValue('Australia');
  },
};

const LABELS = [
  { value: 'bug', label: 'Bug', group: 'Type' },
  { value: 'feature', label: 'Feature', group: 'Type' },
  { value: 'docs', label: 'Docs', group: 'Area' },
  { value: 'tests', label: 'Tests', group: 'Area' },
  { value: 'wontfix', label: 'Won’t fix', group: 'Status', disabled: true },
];

export const MultipleWithTags: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Given data with multiple, the picks show as tags under the field, each with a button that takes it off. The groups come from each item’s group, and a disabled item can’t be picked.',
      },
    },
  },
  args: {
    label: 'Labels',
    data: LABELS,
    multiple: true,
    defaultValue: ['docs'],
    placeholder: 'Find a label',
  },
  play: async ({ canvasElement }) => {
    await openList(canvasElement);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('option', { name: 'Bug' }));
    await expect(
      canvas.getByRole('button', { name: 'Remove Bug' })
    ).toBeInTheDocument();
    await expect(canvas.getByRole('option', { name: 'Docs' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const SearchableSelect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same searchable select built from parts, with the app filtering the list and keeping the value. Type to filter, pick with Enter or a click, and the field shows the pick. The list opens with the highlight on the checked item.',
      },
    },
  },
  render: () => <CountrySelect />,
  play: async ({ canvasElement }) => {
    const field = await openList(canvasElement);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(field).toHaveValue('Australia');
    await userEvent.keyboard('{ArrowDown}');
    const checked = within(canvasElement).getByRole('option', {
      name: 'Australia',
    });
    await expect(checked).toHaveClass('is-checked');
    await expect(checked).toHaveAttribute('aria-selected', 'true');
  },
};

interface City {
  id: string;
  name: string;
  country: string;
}

const CITIES: City[] = [
  { id: 'apple-valley', name: 'Apple Valley', country: 'United States' },
  { id: 'aplerbeck', name: 'Aplerbeck', country: 'Germany' },
  { id: 'naples', name: 'Naples', country: 'Italy' },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya' },
  { id: 'osaka', name: 'Osaka', country: 'Japan' },
  { id: 'oslo', name: 'Oslo', country: 'Norway' },
  { id: 'paris', name: 'Paris', country: 'France' },
  { id: 'porto', name: 'Porto', country: 'Portugal' },
];

/**
 * A pretend server that matches the letters in order, so "aple" finds
 * "Apple Valley", which a substring filter wouldn't.
 */
function searchCities(term: string): Promise<City[]> {
  const letters = term.toLowerCase().replace(/\s+/g, '');
  const matches = (name: string) => {
    let at = 0;
    for (const char of name.toLowerCase()) {
      if (char === letters[at]) at += 1;
    }
    return at === letters.length;
  };
  return new Promise(resolve =>
    setTimeout(() => resolve(CITIES.filter(c => matches(c.name))), 600)
  );
}

function CitySearch() {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState<City | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term || term === city?.name) return undefined;
    let current = true;
    const timer = setTimeout(() => {
      searchCities(term).then(found => {
        if (!current) return;
        setCities(found);
        setLoading(false);
      });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, city]);

  return (
    <Combobox
      label="City"
      onSelect={id => {
        const picked = cities.find(c => c.id === id) ?? null;
        setCity(picked);
        setQuery(picked?.name ?? '');
      }}
    >
      <Combobox.Input
        iconLeftName="search"
        placeholder="Search cities"
        isLoading={loading}
        value={query}
        onChange={e => {
          const term = e.target.value.trim();
          setQuery(e.target.value);
          // A search starts for any text but the picked city's name.
          setLoading(term !== '' && term !== city?.name);
          if (!term) setCities([]);
        }}
      />
      <Combobox.Menu>
        {cities.length > 0 ? (
          <Combobox.List>
            {cities.map(c => (
              <Combobox.Item
                key={c.id}
                value={c.id}
                checked={c.id === city?.id}
              >
                {c.name}, {c.country}
              </Combobox.Item>
            ))}
          </Combobox.List>
        ) : query.trim() && !loading ? (
          <Combobox.Empty>No cities match</Combobox.Empty>
        ) : null}
      </Combobox.Menu>
    </Combobox>
  );
}

export const ServerSearch: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The results come from a pretend server with a delay, which matches the letters in order, so "aple" finds Apple Valley. Nothing filters them again. While isLoading is on, the empty message waits, and it is announced once the search comes back empty.',
      },
    },
  },
  render: () => <CitySearch />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox'), 'aple');
    await expect(
      await canvas.findByRole(
        'option',
        { name: /Apple Valley/ },
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
  },
};

function AssigneePicker() {
  const people = [
    'Ada Lovelace',
    'Grace Hopper',
    'Katherine Johnson',
    'Margaret Hamilton',
  ];
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const matches = people.filter(p =>
    p.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) setQuery('');
      }}
      ariaLabel="Assign to"
      trigger={
        <Button>{assignee ? `Assignee: ${assignee}` : 'Assign to…'}</Button>
      }
    >
      <Popover.Body>
        <Combobox
          inline
          size="small"
          onSelect={name => {
            setAssignee(name);
            setOpen(false);
          }}
        >
          <Combobox.Input
            aria-label="Search people"
            placeholder="Search people"
            iconLeftName="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {matches.length > 0 ? (
            <Combobox.List aria-label="People">
              {matches.map(p => (
                <Combobox.Item key={p} value={p} checked={p === assignee}>
                  {p}
                </Combobox.Item>
              ))}
            </Combobox.List>
          ) : (
            <Combobox.Empty>Nobody matches</Combobox.Empty>
          )}
        </Combobox>
      </Popover.Body>
    </Popover>
  );
}

export const InPopover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A searchable select behind a button: an inline Combobox in a Popover. The Popover moves focus into the field, and an inline list has nothing to close, so Escape closes the Popover.',
      },
    },
  },
  render: () => (
    <Block pb="6" mb="6">
      <AssigneePicker />
    </Block>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Assign to…' }));
    const field = await canvas.findByRole('combobox');
    await expect(field).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(field).toHaveAttribute('aria-activedescendant');
  },
};

function Produce() {
  const groups = {
    Fruit: ['Apple', 'Banana', 'Cherry'],
    Vegetables: ['Carrot', 'Leek', 'Pea'],
  };
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const shown = Object.entries(groups)
    .map(([label, items]) => ({
      label,
      items: items.filter(i => i.toLowerCase().includes(term)),
    }))
    .filter(g => g.items.length > 0);

  return (
    <Combobox label="Produce" keepFirst onSelect={setQuery}>
      <Combobox.Input value={query} onChange={e => setQuery(e.target.value)} />
      <Combobox.Menu>
        {shown.length > 0 ? (
          <Combobox.List>
            {shown.map(g => (
              <Combobox.Group key={g.label} label={g.label}>
                {g.items.map(i => (
                  <Combobox.Item key={i} value={i}>
                    {i}
                  </Combobox.Item>
                ))}
              </Combobox.Group>
            ))}
          </Combobox.List>
        ) : (
          <Combobox.Empty>Nothing matches</Combobox.Empty>
        )}
      </Combobox.Menu>
    </Combobox>
  );
}

export const Groups: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Items under headings, each group named by its heading. With keepFirst, the top match is highlighted, so Enter picks it.',
      },
    },
  },
  render: () => <Produce />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox'), 'e');
    await expect(canvas.getByRole('group', { name: 'Fruit' })).toBeVisible();
    await expect(canvas.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

// A value no label can be.
const CREATE = '\u0000create';

function LabelPicker() {
  const [labels, setLabels] = useState(['bug', 'docs', 'feature', 'question']);
  const [picked, setPicked] = useState<string[]>(['docs']);
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const matches = labels.filter(l => l.includes(term));
  const canCreate = term !== '' && !labels.includes(term);

  function toggle(label: string) {
    setPicked(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  }

  return (
    <>
      <Combobox
        label="Labels"
        multiple
        onSelect={value => {
          if (value === CREATE) {
            setLabels(prev => [...prev, term]);
            toggle(term);
            setQuery('');
          } else {
            toggle(value);
          }
        }}
      >
        <Combobox.Input
          placeholder="Find or create a label"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Combobox.Menu>
          <Combobox.List>
            {matches.map(l => (
              <Combobox.Item key={l} value={l} checked={picked.includes(l)}>
                {l}
              </Combobox.Item>
            ))}
            {canCreate && (
              <Combobox.Item value={CREATE}>Create “{term}”</Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Menu>
      </Combobox>
      <Tags mt="2">
        {picked.map(l => (
          <Tag key={l}>
            {l}
            <Delete
              size="small"
              ariaLabel={`Remove ${l}`}
              onClick={() => toggle(l)}
            />
          </Tag>
        ))}
      </Tags>
    </>
  );
}

export const MultipleWithCreate: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Several values, with a way to make a new one. The list stays open after each pick, every item keeps room for the check mark, and the picks show as tags under the field.',
      },
    },
  },
  render: () => <LabelPicker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openList(canvasElement);
    await expect(canvas.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    );
    // The highlight is on docs, the one checked, so Down Arrow moves to
    // feature and Enter checks it, keeping the list open.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByRole('listbox')).toBeVisible();
    await expect(
      canvas.getByRole('option', { name: 'feature' })
    ).toHaveAttribute('aria-selected', 'true');
    await userEvent.type(canvas.getByRole('combobox'), 'urgent');
    await expect(
      canvas.getByRole('option', { name: 'Create “urgent”' })
    ).toBeVisible();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(
      canvas.getByRole('option', { name: 'urgent' })
    ).toHaveAttribute('aria-selected', 'true');
  },
};

// A value no category can be.
const CREATE_CATEGORY = '\u0000create';

function CategoryPicker() {
  const [categories, setCategories] = useState(['Books', 'Games', 'Music']);
  const [value, setValue] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const term = query === value ? '' : query.trim();
  const matches = categories.filter(c =>
    c.toLowerCase().includes(term.toLowerCase())
  );
  const canCreate =
    term !== '' &&
    !categories.some(c => c.toLowerCase() === term.toLowerCase());

  return (
    <Combobox
      label="Category"
      onSelect={picked => {
        const next = picked === CREATE_CATEGORY ? term : picked;
        if (picked === CREATE_CATEGORY) setCategories(prev => [...prev, term]);
        setValue(next);
        setQuery(next);
      }}
    >
      <Combobox.Input
        placeholder="Pick or create a category"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onBlur={() => setQuery(value ?? '')}
      />
      <Combobox.Menu>
        <Combobox.List>
          {matches.map(c => (
            <Combobox.Item key={c} value={c} checked={c === value}>
              {c}
            </Combobox.Item>
          ))}
          {canCreate && (
            <Combobox.Item value={CREATE_CATEGORY}>
              Create “{term}”
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Menu>
    </Combobox>
  );
}

export const CreateItem: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A Create row is one more item, with a value none of yours can be. Its handler makes the new entry and picks it.',
      },
    },
  },
  render: () => <CategoryPicker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    await userEvent.type(field, 'Films');
    await userEvent.keyboard('{ArrowDown}');
    await expect(
      canvas.getByRole('option', { name: 'Create “Films”' })
    ).toHaveAttribute('aria-selected', 'true');
  },
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'size sizes the field and the items together. Each list here is open, with a checked item, which has the highlight, and a disabled one.',
      },
    },
  },
  render: () => (
    <Columns pb="6" mb="6">
      {(['small', undefined, 'medium', 'large'] as const).map(size => (
        <Column key={size ?? 'normal'}>
          <Combobox label={size ?? 'normal'} size={size} defaultOpen>
            <Combobox.Input placeholder="Fruit" />
            <Combobox.Menu>
              <Combobox.List>
                <Combobox.Item value="apple">Apple</Combobox.Item>
                <Combobox.Item value="banana" checked>
                  Banana
                </Combobox.Item>
                <Combobox.Item value="cherry" disabled>
                  Cherry
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Menu>
          </Combobox>
        </Column>
      ))}
    </Columns>
  ),
};

export const DisabledItems: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A disabled item can’t be picked. The arrows still reach it, so a screen reader user finds it, but the opening highlight and keepFirst pass over it.',
      },
    },
  },
  render: () => (
    <Block pb="6" mb="6">
      <Combobox label="Plan" defaultOpen>
        <Combobox.Input placeholder="Pick a plan" />
        <Combobox.Menu>
          <Combobox.List>
            <Combobox.Item value="free">Free</Combobox.Item>
            <Combobox.Item value="team" disabled>
              Team (sold out)
            </Combobox.Item>
            <Combobox.Item value="business">Business</Combobox.Item>
            <Combobox.Item value="enterprise" disabled>
              Enterprise (talk to sales)
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Menu>
      </Combobox>
    </Block>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const team = canvas.getByRole('option', { name: 'Team (sold out)' });
    await expect(team).toHaveClass('is-active');
    await expect(team).not.toHaveAttribute('aria-selected');
  },
};

export const EmptyMessage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Combobox.Empty sits in the menu beside the list, not in it, so the field says it’s collapsed while it shows. Typing that brings it on screen has it announced through a status region.',
      },
    },
  },
  render: () => <CountrySelect />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    await userEvent.type(field, 'zz');
    await expect(canvas.getByText('No countries match')).toBeVisible();
    await expect(field).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Inline: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'inline puts the list in the flow under the field, always on screen, as in a page panel. Nothing closes it.',
      },
    },
  },
  render: function InlineExample() {
    const [value, setValue] = useState('Canada');
    const [query, setQuery] = useState('');
    const matches = COUNTRIES.filter(c =>
      c.toLowerCase().includes(query.trim().toLowerCase())
    );
    return (
      <Box>
        <Combobox label="Country" inline onSelect={setValue}>
          <Combobox.Input
            placeholder="Filter"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {matches.length > 0 ? (
            <Combobox.List>
              {matches.map(c => (
                <Combobox.Item key={c} value={c} checked={c === value}>
                  {c}
                </Combobox.Item>
              ))}
            </Combobox.List>
          ) : (
            <Combobox.Empty>No countries match</Combobox.Empty>
          )}
        </Combobox>
      </Box>
    );
  },
};

export const FlipsAbove: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'With position="auto", a field near the bottom of the viewport opens its list above itself.',
      },
    },
  },
  render: () => (
    <Hero size="fullheight">
      <Hero.Body>
        <Paragraph>
          The field is at the foot of the viewport, so its list opens above it.
        </Paragraph>
      </Hero.Body>
      <Hero.Foot p="5">
        <CountrySelect position="auto" />
      </Hero.Foot>
    </Hero>
  ),
  play: async ({ canvasElement }) => {
    await openList(canvasElement);
    const panel = canvasElement.querySelector('.combobox-menu');
    await expect(panel).toHaveClass('is-top-left');
  },
};

function ModalWithCombobox() {
  const [active, setActive] = useState(false);
  // Inside the modal, so the portaled list stays in the dialog for assistive
  // tech, and outside the card, so its scrolling body doesn't clip it.
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <Button onClick={() => setActive(true)}>Edit shipping</Button>
      <Modal
        active={active}
        onClose={() => setActive(false)}
        aria-label="Edit shipping"
      >
        <Modal.Background onClick={() => setActive(false)} />
        <Modal.Card>
          <Modal.Card.Head>
            <Modal.Card.Title>Edit shipping</Modal.Card.Title>
          </Modal.Card.Head>
          <Modal.Card.Body>
            <Paragraph mb="4">
              The card’s body scrolls, which would clip a list in place, so this
              one is portaled with appendToBody.
            </Paragraph>
            <ConfigProvider portalContainer={overlay ?? undefined}>
              <CountrySelect appendToBody position="auto" />
            </ConfigProvider>
          </Modal.Card.Body>
          <Modal.Card.Foot>
            <Button color="primary" onClick={() => setActive(false)}>
              Save
            </Button>
          </Modal.Card.Foot>
        </Modal.Card>
        <div ref={setOverlay} />
      </Modal>
    </>
  );
}

export const AppendToBodyInModal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'appendToBody portals the list out of a container that clips it, such as a Modal card’s body, and position="auto" keeps it in the viewport. Point a ConfigProvider’s portalContainer inside the Modal, so the list stays in the dialog for assistive tech. Escape closes the list first, and the Modal on the next press.',
      },
    },
  },
  render: () => <ModalWithCombobox />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit shipping' })
    );
    const modal = await within(document.body).findByRole('dialog');
    const field = within(modal).getByRole('combobox');
    await userEvent.click(field);
    await expect(
      within(modal).getByRole('listbox', { name: 'Country' })
    ).toBeVisible();
  },
};

export const CompoundUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Every part in dot notation: Combobox.Input, Combobox.Menu, Combobox.List, Combobox.Group, Combobox.Item and Combobox.Empty. Each is also exported by name (ComboboxInput and so on).',
      },
    },
  },
  render: function CompoundExample() {
    const [query, setQuery] = useState('');
    const [value, setValue] = useState('tea');
    const drinks: Record<
      string,
      { value: string; label: string; disabled?: boolean }[]
    > = {
      Hot: [
        { value: 'coffee', label: 'Coffee' },
        { value: 'tea', label: 'Tea' },
      ],
      Cold: [
        { value: 'lemonade', label: 'Lemonade' },
        { value: 'iced-tea', label: 'Iced tea' },
        { value: 'smoothie', label: 'Smoothie (sold out)', disabled: true },
      ],
    };
    const picked = Object.values(drinks)
      .flat()
      .find(i => i.value === value);
    const term = query.trim().toLowerCase();
    const groups = Object.entries(drinks)
      .map(([label, items]) => ({
        label,
        items: items.filter(i => i.label.toLowerCase().includes(term)),
      }))
      .filter(g => g.items.length > 0);
    return (
      <Block pb="6" mb="6">
        <Combobox
          label="Drink"
          message={`Your drink: ${picked?.label}`}
          onSelect={next => {
            setValue(next);
            setQuery('');
          }}
        >
          <Combobox.Input
            iconLeftName="mug-hot"
            placeholder="Type to filter"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Combobox.Menu>
            {groups.length > 0 ? (
              <Combobox.List>
                {groups.map(g => (
                  <Combobox.Group key={g.label} label={g.label}>
                    {g.items.map(i => (
                      <Combobox.Item
                        key={i.value}
                        value={i.value}
                        checked={i.value === value}
                        disabled={i.disabled}
                      >
                        {i.label}
                      </Combobox.Item>
                    ))}
                  </Combobox.Group>
                ))}
              </Combobox.List>
            ) : (
              <Combobox.Empty>No drinks match</Combobox.Empty>
            )}
          </Combobox.Menu>
        </Combobox>
      </Block>
    );
  },
  play: async ({ canvasElement }) => {
    await openList(canvasElement);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Hot' })).toBeVisible();
    await expect(canvas.getByRole('option', { name: 'Tea' })).toHaveClass(
      'is-checked'
    );
  },
};
