import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Combobox, type ComboboxProps } from './Combobox';
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
          'A text field with a list of options under it, built from parts: a searchable select, a server search, a multi-select, grouped options. The keys and the ARIA are done, and the data is yours: you filter the options, keep the value and set the text in the field, and a pick calls onOptionSubmit with the option’s value. For a free-text field with suggestions, Autocomplete is the simpler choice.',
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
    children: {
      control: false,
      description:
        'The parts: Combobox.Input, then Combobox.Dropdown with Combobox.Options or Combobox.Empty in it',
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
    onOptionSubmit: {
      action: 'optionSubmit',
      description:
        'Called with the picked option’s value; the Combobox keeps no value and never changes the field',
    },
    autoHighlight: {
      control: 'boolean',
      description:
        'Highlights the first enabled option when the list opens or its options change, so Enter picks the top match',
    },
    multiple: {
      control: 'boolean',
      description:
        'Several values: the list stays open after a pick, and checked is each option’s aria-selected',
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
        'Where the dropdown opens against the field; auto keeps it in the viewport',
    },
    appendToBody: {
      control: 'boolean',
      description:
        'Portals the dropdown, fixed at the field, out of a container that clips it',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Sizes the field and the options together',
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
function CountrySelect(props: Partial<ComboboxProps>) {
  const [value, setValue] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Showing the value isn't a search, so the whole list opens.
  const term = query === value ? '' : query.trim().toLowerCase();
  const matches = COUNTRIES.filter(c => c.toLowerCase().includes(term));

  return (
    <Combobox
      label="Country"
      {...props}
      onOptionSubmit={picked => {
        setValue(picked);
        setQuery(picked);
        props.onOptionSubmit?.(picked);
      }}
    >
      <Combobox.Input
        placeholder="Pick a country"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onBlur={() => setQuery(value ?? '')}
      />
      <Combobox.Dropdown>
        {matches.length > 0 ? (
          <Combobox.Options>
            {matches.map(c => (
              <Combobox.Option key={c} value={c} checked={c === value}>
                {c}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        ) : (
          <Combobox.Empty>No countries match</Combobox.Empty>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
}

export const Default: Story = {
  render: args => <CountrySelect {...args} />,
  play: async ({ canvasElement }) => {
    const field = await openList(canvasElement);
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toHaveAttribute('aria-activedescendant');
  },
};

export const SearchableSelect: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The value has to be one of the list. Type to filter, pick with Enter or a click, and the field shows the pick. The list opens with the highlight on the checked option.',
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
      onOptionSubmit={id => {
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
      <Combobox.Dropdown>
        {cities.length > 0 ? (
          <Combobox.Options>
            {cities.map(c => (
              <Combobox.Option
                key={c.id}
                value={c.id}
                checked={c.id === city?.id}
              >
                {c.name}, {c.country}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        ) : query.trim() && !loading ? (
          <Combobox.Empty>No cities match</Combobox.Empty>
        ) : null}
      </Combobox.Dropdown>
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
          onOptionSubmit={name => {
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
            <Combobox.Options aria-label="People">
              {matches.map(p => (
                <Combobox.Option key={p} value={p} checked={p === assignee}>
                  {p}
                </Combobox.Option>
              ))}
            </Combobox.Options>
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
    <Combobox label="Produce" autoHighlight onOptionSubmit={setQuery}>
      <Combobox.Input value={query} onChange={e => setQuery(e.target.value)} />
      <Combobox.Dropdown>
        {shown.length > 0 ? (
          <Combobox.Options>
            {shown.map(g => (
              <Combobox.Group key={g.label} label={g.label}>
                {g.items.map(i => (
                  <Combobox.Option key={i} value={i}>
                    {i}
                  </Combobox.Option>
                ))}
              </Combobox.Group>
            ))}
          </Combobox.Options>
        ) : (
          <Combobox.Empty>Nothing matches</Combobox.Empty>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
}

export const Groups: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Options under headings, each group named by its heading. With autoHighlight, the top match is highlighted, so Enter picks it.',
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
        onOptionSubmit={value => {
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
        <Combobox.Dropdown>
          <Combobox.Options>
            {matches.map(l => (
              <Combobox.Option key={l} value={l} checked={picked.includes(l)}>
                {l}
              </Combobox.Option>
            ))}
            {canCreate && (
              <Combobox.Option value={CREATE}>Create “{term}”</Combobox.Option>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
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
          'Several values, with a way to make a new one. The list stays open after each pick, every option keeps room for the check mark, and the picks show as tags under the field.',
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
      onOptionSubmit={picked => {
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
      <Combobox.Dropdown>
        <Combobox.Options>
          {matches.map(c => (
            <Combobox.Option key={c} value={c} checked={c === value}>
              {c}
            </Combobox.Option>
          ))}
          {canCreate && (
            <Combobox.Option value={CREATE_CATEGORY}>
              Create “{term}”
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export const CreateOption: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A Create row is one more option, with a value none of yours can be. Its handler makes the new entry and picks it.',
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
          'size sizes the field and the options together. Each list here is open, with a checked option, which has the highlight, and a disabled one.',
      },
    },
  },
  render: () => (
    <Columns pb="6" mb="6">
      {(['small', undefined, 'medium', 'large'] as const).map(size => (
        <Column key={size ?? 'normal'}>
          <Combobox label={size ?? 'normal'} size={size} defaultOpen>
            <Combobox.Input placeholder="Fruit" />
            <Combobox.Dropdown>
              <Combobox.Options>
                <Combobox.Option value="apple">Apple</Combobox.Option>
                <Combobox.Option value="banana" checked>
                  Banana
                </Combobox.Option>
                <Combobox.Option value="cherry" disabled>
                  Cherry
                </Combobox.Option>
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
        </Column>
      ))}
    </Columns>
  ),
};

export const DisabledOptions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A disabled option can’t be picked. The arrows still reach it, so a screen reader user finds it, but the opening highlight and autoHighlight pass over it.',
      },
    },
  },
  render: () => (
    <Block pb="6" mb="6">
      <Combobox label="Plan" defaultOpen>
        <Combobox.Input placeholder="Pick a plan" />
        <Combobox.Dropdown>
          <Combobox.Options>
            <Combobox.Option value="free">Free</Combobox.Option>
            <Combobox.Option value="team" disabled>
              Team (sold out)
            </Combobox.Option>
            <Combobox.Option value="business">Business</Combobox.Option>
            <Combobox.Option value="enterprise" disabled>
              Enterprise (talk to sales)
            </Combobox.Option>
          </Combobox.Options>
        </Combobox.Dropdown>
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
          'Combobox.Empty sits in the dropdown beside the list, not in it, so the field says it’s collapsed while it shows. Typing that brings it on screen has it announced through a status region.',
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
        <Combobox label="Country" inline onOptionSubmit={setValue}>
          <Combobox.Input
            placeholder="Filter"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {matches.length > 0 ? (
            <Combobox.Options>
              {matches.map(c => (
                <Combobox.Option key={c} value={c} checked={c === value}>
                  {c}
                </Combobox.Option>
              ))}
            </Combobox.Options>
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
    const panel = canvasElement.querySelector('.combobox-dropdown');
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
          'Every part in dot notation: Combobox.Input, Combobox.Dropdown, Combobox.Options, Combobox.Group, Combobox.Option and Combobox.Empty. Each is also exported by name (ComboboxInput and so on).',
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
          onOptionSubmit={next => {
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
          <Combobox.Dropdown>
            {groups.length > 0 ? (
              <Combobox.Options>
                {groups.map(g => (
                  <Combobox.Group key={g.label} label={g.label}>
                    {g.items.map(i => (
                      <Combobox.Option
                        key={i.value}
                        value={i.value}
                        checked={i.value === value}
                        disabled={i.disabled}
                      >
                        {i.label}
                      </Combobox.Option>
                    ))}
                  </Combobox.Group>
                ))}
              </Combobox.Options>
            ) : (
              <Combobox.Empty>No drinks match</Combobox.Empty>
            )}
          </Combobox.Dropdown>
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
