---
title: Combobox
sidebar_label: Combobox
description: The `Combobox` component builds a text field with a list of options under it, for a searchable select, a server search, a multi-select or grouped options, with the keys and ARIA done and the data left to you.
---

# Combobox

## Overview

<!-- bestax:generated overview -->

The `Combobox` component builds a text field with a list of options under it, for a searchable select, a server search, a multi-select or grouped options, with the keys and ARIA done and the data left to you.

<!-- /bestax:generated overview -->

You build it from parts: `Combobox.Input` is the field, `Combobox.Dropdown` is the panel under it,
and `Combobox.Options`, `Combobox.Option`, `Combobox.Group` and `Combobox.Empty` go in the panel.
The Combobox handles the keys, the highlight, the open state and the ARIA wiring. You handle the
data: what's in the list, how it's filtered, and the value.

That split is the whole idea. A pick calls `onOptionSubmit` with the option's `value`, and that's
it. The Combobox keeps no value and never changes the text in the field, so your handler sets both.
Nothing filters the options for you either, so a server's answer shows exactly as it came back. In
return, a searchable select, a server search, a multi-select with tags, grouped options and a
"Create" row are each a few lines of your own code, as the examples below show.

:::info
Bulma has the look of a dropdown but no combobox, so `Combobox` brings its own styles, in
`bestax.css` and its variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Combobox } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Combobox or Autocomplete?

They answer different questions:

- **Free text with suggestions** is [`Autocomplete`](./autocomplete.md). The field's text is the
  value, the suggestions only help you type it, and Autocomplete filters `data` for you.
- **A value from a list** is `Combobox`: a searchable select, a server search whose results you
  pick from, several values, grouped options, or a list with a "Create" row. The list is yours to
  filter, and the value is yours to keep.

If you're reaching for Autocomplete props to turn its filtering off or keep a picked value, that's
a Combobox.

### A Searchable Select

The value has to be one of the countries, and the field shows it. Type to narrow the list, and
pick with Enter or a click. Leaving the field without picking puts the value back. Here it starts
an address form: the open list lies over the fields under it, and Enter with nothing highlighted
submits the form, the way it does in any text field.

```tsx live
function example() {
  const countries = [
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
  const [value, setValue] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Showing the value isn't a search, so the whole list opens.
  const term = query === value ? '' : query.trim().toLowerCase();
  const matches = countries.filter(c => c.toLowerCase().includes(term));

  return (
    <form onSubmit={e => e.preventDefault()}>
      <Combobox
        label="Country"
        onOptionSubmit={picked => {
          setValue(picked);
          setQuery(picked);
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
      <Input label="Street address" />
      <Input label="City" />
      <Input label="Postal code" />
      <Button type="submit" color="primary">
        Save address
      </Button>
    </form>
  );
}
```

`checked` marks the value. It shows a check mark, and the list opens with the highlight on it. Render
`Combobox.Options` while there are options and `Combobox.Empty` while there aren't: the empty message
goes beside the list, never in it.

### Server Search

When the results come from a server, show them as they come. Nothing in the Combobox filters them
again, so a server that matches "aple" to "Apple Valley" gets its answer shown. Put `isLoading` on
the field while a search is out. Try typing "aple" here: this pretend server matches the letters
in order.

```tsx live
function example() {
  type City = { id: string; name: string; country: string };
  const all: City[] = [
    { id: 'apple-valley', name: 'Apple Valley', country: 'United States' },
    { id: 'aplerbeck', name: 'Aplerbeck', country: 'Germany' },
    { id: 'naples', name: 'Naples', country: 'Italy' },
    { id: 'nairobi', name: 'Nairobi', country: 'Kenya' },
    { id: 'osaka', name: 'Osaka', country: 'Japan' },
    { id: 'oslo', name: 'Oslo', country: 'Norway' },
    { id: 'paris', name: 'Paris', country: 'France' },
    { id: 'porto', name: 'Porto', country: 'Portugal' },
  ];
  // Stands in for your API: the letters in order, after a delay.
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
      setTimeout(() => resolve(all.filter(c => matches(c.name))), 600)
    );
  }

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
    <form onSubmit={e => e.preventDefault()}>
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
      <Input label="Check-in" type="date" />
      <Input label="Guests" type="number" min={1} defaultValue={2} />
      <Button type="submit" color="primary">
        Find a room
      </Button>
    </form>
  );
}
```

The `value` is the city's `id`, and `onOptionSubmit` looks the record up by it. While `isLoading` is
on, the "No cities match" announcement waits, and it's made once the search comes back empty. A
dropdown with nothing in it doesn't show, so the `null` branch keeps the panel shut until there's
something to say.

### Grouped Options

Put options in `Combobox.Group`s, each named by its `label`. With `autoHighlight` the top match is
highlighted as you type, so Enter picks it.

```tsx live
function example() {
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
    <form onSubmit={e => e.preventDefault()}>
      <Combobox label="Produce" autoHighlight onOptionSubmit={setQuery}>
        <Combobox.Input
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
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
      <Input label="Quantity" type="number" min={1} defaultValue={1} />
      <Input label="Deliver on" type="date" />
      <Input label="Note for the shopper" />
      <Button type="submit" color="primary">
        Add to order
      </Button>
    </form>
  );
}
```

`autoHighlight` only highlights. Leaving the field, or pressing Tab, still picks nothing.

### Several Values, with Tags

With `multiple`, the list stays open after each pick, and every option keeps room for a check mark.
The picks show as tags under the field, each with a button to take it off. This one also offers to
make a label that isn't on the list yet.

```tsx live
function example() {
  // A value no label can be.
  const CREATE = '\u0000create';
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
    <form onSubmit={e => e.preventDefault()}>
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
      <Select label="Priority">
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </Select>
      <Button type="submit" color="primary">
        Save issue
      </Button>
    </form>
  );
}
```

Each option's `checked` is its `aria-selected` here, and the list says it's `aria-multiselectable`,
so a screen reader reads which labels are on. The tags sit under the field rather than inside it,
which keeps the field an ordinary text field. For chips inside the field, see
[`Taginput`](./taginput.md).

### A Create Option

A "Create" row is one more option, with a `value` none of yours can be. Its handler makes the new
entry and picks it. Type a category that isn't on the list.

```tsx live
function example() {
  // A value no category can be.
  const CREATE = '\u0000create';
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
    <form onSubmit={e => e.preventDefault()}>
      <Combobox
        label="Category"
        onOptionSubmit={picked => {
          const next = picked === CREATE ? term : picked;
          if (picked === CREATE) setCategories(prev => [...prev, term]);
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
              <Combobox.Option value={CREATE}>Create “{term}”</Combobox.Option>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      <Input label="Price" type="number" min={0} step="0.01" />
      <Button type="submit" color="primary">
        Save product
      </Button>
    </form>
  );
}
```

The create row only shows once there's something to create, so the list always has an option and
needs no `Combobox.Empty`.

### In a Popover

A searchable select behind a button is an `inline` Combobox in a [`Popover`](../components/popover.md),
here on an issue's "Assign to…" button.
The Popover moves focus into the field when it opens and back to the button when it closes. An
inline list is always on screen, so it has nothing to close, and Escape in the field reaches the
Popover.

```tsx live
function example() {
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
    <Box>
      <Title as="h3" textSize="5">
        Fix the login redirect
      </Title>
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
      <Paragraph mt="4">
        People land on the home page after they sign in, instead of the page
        they started from. Send them back to where they were, query string and
        all.
      </Paragraph>
      <Tags mt="4">
        <Tag>bug</Tag>
        <Tag>login</Tag>
      </Tags>
      <Buttons>
        <Button size="small">Comment</Button>
        <Button size="small">Close issue</Button>
      </Buttons>
    </Box>
  );
}
```

With no `label`, the field takes an `aria-label` and the list takes one of its own. Without one, the
list is named "Suggestions".

### A Result Count

The Combobox announces its empty message and nothing else. It doesn't announce how many options
there are: a screen reader reads that from the list itself, and a count read out on every keystroke
talks over the typing. When the count matters on its own, show it in a `role="status"` line beside
the list, in the page the whole time, so a change to its text is announced. This list is `inline`,
the way a filter panel shows one, with the count under it.

```tsx live
function example() {
  const fruit = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Date'];
  const [query, setQuery] = useState('');
  const matches = fruit.filter(f =>
    f.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <Combobox label="Fruit" inline onOptionSubmit={setQuery}>
        <Combobox.Input
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {matches.length > 0 ? (
          <Combobox.Options>
            {matches.map(f => (
              <Combobox.Option key={f} value={f}>
                {f}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        ) : (
          <Combobox.Empty>No fruit matches</Combobox.Empty>
        )}
      </Combobox>
      <Paragraph role="status" aria-atomic="true" textSize="7" mt="2">
        {`${matches.length} of ${fruit.length} fruit`}
      </Paragraph>
    </>
  );
}
```

### Sizes

`size` sizes the field and the options together. These four are `inline`, so their options show
at each size without a click. In a dropdown they're the same size.

```tsx live
<Columns>
  {(['small', undefined, 'medium', 'large'] as const).map(size => (
    <Column key={size ?? 'normal'}>
      <Combobox label={size ?? 'normal'} size={size} inline>
        <Combobox.Input placeholder="Fruit" />
        <Combobox.Options>
          <Combobox.Option value="apple">Apple</Combobox.Option>
          <Combobox.Option value="banana" checked>
            Banana
          </Combobox.Option>
          <Combobox.Option value="cherry" disabled>
            Cherry
          </Combobox.Option>
        </Combobox.Options>
      </Combobox>
    </Column>
  ))}
</Columns>
```

Banana is `checked`, so it has the highlight to start with. Cherry is `disabled`: the arrows still
reach it, so a screen reader user finds it, but it can't be picked.

### Where the List Opens

The dropdown opens below the field, lined up on the left. `position` takes the corners Popover
takes, and `auto` picks the one that keeps the list in the viewport, preferring below.

Inside a container that clips its overflow, such as a Modal card's scrolling body, add
`appendToBody`. The dropdown is then portaled, fixed to the viewport at the field and at least as
wide as it. A portaled panel sits outside the Combobox, so it carries its own copy of the
`--bulma-combobox-*` defaults, declared on `.combobox-dropdown.is-portal`: set a theme override
there as well as on `.combobox`. A lone `.combobox-dropdown` loses to it on specificity. In a
`Modal`, point a `ConfigProvider`'s `portalContainer` at an element inside the
modal, so the list stays inside the dialog for assistive tech:

```tsx
<Modal active={active} onClose={close} aria-label="Edit shipping">
  <Modal.Background onClick={close} />
  <Modal.Card>
    <Modal.Card.Body>
      <ConfigProvider portalContainer={overlay ?? undefined}>
        <Combobox label="Country" appendToBody position="auto">
          {/* … */}
        </Combobox>
      </ConfigProvider>
    </Modal.Card.Body>
  </Modal.Card>
  {/* In the modal and outside the card, so the card can't clip it. */}
  <div ref={setOverlay} />
</Modal>
```

### Compound (dot-notation) usage

Every part, in dot notation: `Combobox.Input`, `Combobox.Dropdown`, `Combobox.Options`,
`Combobox.Group`, `Combobox.Option` and `Combobox.Empty`. Each is also exported by name
(`ComboboxInput`, `ComboboxDropdown`, `ComboboxOptions`, `ComboboxGroup`, `ComboboxOption` and
`ComboboxEmpty`).

```tsx live
function example() {
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
  const [query, setQuery] = useState('');
  const [value, setValue] = useState('tea');
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
    <form onSubmit={e => e.preventDefault()}>
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
      <Select label="Size">
        <option>Small</option>
        <option>Medium</option>
        <option>Large</option>
      </Select>
      <Input label="Name for the cup" />
      <Button type="submit" color="primary">
        Order
      </Button>
    </form>
  );
}
```

---

## Keyboard

Focus stays in the field the whole time. The keys work on the field like this:

| Key                          | List closed                                                                                   | List open                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Down Arrow                   | Opens it, highlighting the checked option if it's showing, otherwise the first enabled option | Highlights the next option, wrapping to the first                                                                                                    |
| Up Arrow                     | Opens it, highlighting the checked option if it's showing, otherwise the last enabled option  | Highlights the previous option, wrapping to the last                                                                                                 |
| Alt+Down Arrow               | Opens it without a highlight                                                                  | Nothing                                                                                                                                              |
| Alt+Up Arrow                 | Nothing                                                                                       | Closes it                                                                                                                                            |
| Enter                        | Left alone, so a form submits                                                                 | Picks the highlighted option, and does nothing on a disabled one. With nothing highlighted, closes it and lets the form submit                       |
| Escape                       | Left alone, so it reaches whatever is around the field                                        | Closes it. When a panel was on screen, the key stops there, so a Popover around it stays open                                                        |
| Tab                          | Left alone                                                                                    | Closes it and picks nothing. Focus moves on                                                                                                          |
| Home, End, Left, Right       | The field's own                                                                               | The field's own, and the highlight clears                                                                                                            |
| Typing, Backspace and Delete | The field's own, and a change to the text opens the list                                      | The field's own. When the text changes, the highlight clears, or moves to the first enabled option with `autoHighlight`, and your new options follow |

- **`inline`:** the "List open" column applies the whole time, except that Escape and Alt+Up Arrow
  are left alone, so they reach whatever is around the list, and Tab only moves focus on, since
  nothing closes an inline list.
- **While an IME is composing,** none of this runs, so Enter finishes the word instead of picking.
- **Your own `onKeyDown`** on `Combobox.Input` runs first, and one that calls `preventDefault()`
  keeps the Combobox from handling that key.

The pointer works the same way. Moving it over an enabled option highlights it, a click picks it,
and a click in the field opens the list. A press in the list never takes focus from the field.

---

## Accessibility

- **The roles:** the field is `role="combobox"` with `aria-autocomplete="list"` and
  `aria-haspopup="listbox"`. The list is a `listbox` of `option`s, and a group is a `group` named by
  its heading. This is the ARIA 1.2 combobox the ARIA Authoring Practices describe.
- **Focus stays in the field:** the highlighted option is the field's `aria-activedescendant`.
  When a key or the list opening moves the highlight, the option is scrolled into view, since a
  browser only scrolls to what has focus. The pointer moves it without scrolling, since the pointer
  is already on that option. A click on an option keeps focus in the field too.
- **`aria-expanded`** is `true` while a list with an option in it is on screen, and
  `aria-controls` points at the list then. While the dropdown shows just `Combobox.Empty`, the
  field says it's collapsed, and so does the server markup for a list rendered with
  `appendToBody`, which shows only once the page has hydrated.
- **The list's name** comes from the label that names the field: the Combobox's `label`, or an
  outer `Field`'s. An `aria-label` or `aria-labelledby` you put on `Combobox.Options` wins, and
  with none of these the list is named "Suggestions".
- **`aria-selected`, with one value,** is on the highlighted option and nothing else, the way the
  Authoring Practices' combobox examples do it. The value shows as a check mark, which doesn't rely
  on color, and the list opens with the highlight on it. Several libraries put `aria-selected` on
  the chosen option instead.
- **With `multiple`,** the list is `aria-multiselectable`, and each option's `aria-selected` is its
  `checked`.
- **Disabled options** are `aria-disabled` and stay reachable with the arrows, the Authoring
  Practices' advice for listbox options, so a screen reader user finds them. They're never picked
  or `aria-selected`, and the opening highlight and `autoHighlight` pass over them.
- **The empty message** sits beside the list, not in it, so it isn't counted as an option. When
  your typing brings it on screen, its text is announced through a polite status region that's in
  the page from the start, once each time the matches run out. Opening the list with it already
  there, or emptying the field, announces nothing. While `isLoading` is on, or a loading `Control`
  is around the Combobox, the announcement waits and is made once loading ends. In a dropdown,
  keep it to text: Tab closes the list before a keyboard user can reach a link or a button in it.
  An `inline` list stays on screen, so a link or a button beside it is in the Tab order.
- **No counts are announced,** for the reasons in [A Result Count](#a-result-count).
- **Enter and Escape** leave a form and the layers around the field alone unless they did
  something: Enter submits the form when nothing is highlighted, and Escape only stops at the
  Combobox when it closed a panel that was on screen.
- **Forced colors:** in Windows high contrast mode the highlight is drawn as an outline in the
  system's highlight color, a disabled option takes the system's color for disabled text, and the
  check mark and the panel's edge stay visible.
- **No motion:** nothing animates.

---

## Related Components

- [`Autocomplete`](./autocomplete.md): Free text with suggestions, filtered for you.
- [`Taginput`](./taginput.md): Several values as chips inside the field.
- [`Select`](./select.md): The native select, the simplest way to pick from a short list.
- [`Popover`](../components/popover.md): A panel behind a button, where an `inline` Combobox makes a
  searchable select.
- [`Dropdown`](../components/dropdown.md): A menu of actions, which has no value to pick.
- [`Field`](./field.md): The label and help text around the field.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Combobox Stories](https://bestax.io/storybook/?path=/story/form-combobox--default)
- [ARIA Authoring Practices: Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [ARIA Authoring Practices: Editable Combobox With List Autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)
- [ARIA Authoring Practices: Focusability of Disabled Controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols)
- [WCAG 2.2, Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                             | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`          | `React.ReactNode`                                                                | —               | The field's label, which names `Combobox.Input` through `htmlFor`, and the list through `aria-labelledby`. Dropped inside an outer `Field`, whose label names both instead when it points at the field.                                                                                                                                                                                                                                                                                                                         |
| `labelProps`     | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`      | —               | Props for the label element. An explicit `htmlFor` takes over the association: give `Combobox.Input` the same `id`, and the list is still named after the label.                                                                                                                                                                                                                                                                                                                                                                |
| `children`       | `React.ReactNode`                                                                | —               | The parts, in order: `Combobox.Input`, then `Combobox.Dropdown` with `Combobox.Options` and `Combobox.Empty` in it. With `inline`, the `Combobox.Options` and `Combobox.Empty` go straight in. Render `Combobox.Options` while there are options and `Combobox.Empty` while there aren't: the empty message sits beside the list, not in it.                                                                                                                                                                                    |
| `open`           | `boolean`                                                                        | —               | Controlled open state. When set, opening and closing only report through `onOpenChange`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `defaultOpen`    | `boolean`                                                                        | `false`         | Initial open state when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `onOpenChange`   | `(open: boolean) => void`                                                        | —               | Called with the open state asked for: `true` from typing, a click in the field or Down Arrow, and `false` from Escape, Tab, a pick with one value, focus leaving or a press outside. Fires in controlled and uncontrolled use.                                                                                                                                                                                                                                                                                                  |
| `onOptionSubmit` | `(value: string) => void`                                                        | —               | Called with an option's `value` when it's picked with Enter or a click. A disabled option is never picked. The Combobox keeps no value and doesn't change the text in the field: update yours here.                                                                                                                                                                                                                                                                                                                             |
| `autoHighlight`  | `boolean`                                                                        | `false`         | Highlights the first enabled option whenever the list opens or its options change, so Enter picks the top match. It only highlights: leaving the field still picks nothing, and so does Tab.                                                                                                                                                                                                                                                                                                                                    |
| `multiple`       | `boolean`                                                                        | `false`         | Several values can be picked. The list stays open after a pick, it's `aria-multiselectable`, and each option's `checked` is its `aria-selected`.                                                                                                                                                                                                                                                                                                                                                                                |
| `inline`         | `boolean`                                                                        | `false`         | The list is always on screen, in the flow under the field, as in a Popover or a page panel. There's no dropdown, so nothing closes it, and Escape goes to whatever is around it.                                                                                                                                                                                                                                                                                                                                                |
| `position`       | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'` | Where the dropdown opens against the field: below (`bottom-*`) or above (`top-*`), lined up with its left or right edge. `auto` picks the one that keeps the list in the viewport, preferring below. The same union Popover takes.                                                                                                                                                                                                                                                                                              |
| `appendToBody`   | `boolean`                                                                        | `false`         | Renders the dropdown through `Portal`, into the `portalContainer` a `ConfigProvider` sets, `document.body` by default, fixed to the viewport at the field, so a container that clips its overflow can't cut it off. It then shows from the commit after hydration, never in server markup. Theming variables set on an ancestor reach it only when the portal's container is inside that ancestor, as with Popover. In a `Modal`, point `portalContainer` inside the modal, so the list stays in the dialog for assistive tech. |
| `size`           | `'small'` \| `'medium'` \| `'large'`                                             | —               | Sizes the field and the options together.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `labelSize`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                               | —               | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `horizontal`     | `boolean`                                                                        | `false`         | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `message`        | `React.ReactNode`                                                                | —               | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `messageColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —               | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `fieldClassName` | `string`                                                                         | —               | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `className`      | `string`                                                                         | —               | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ref`            | `React.Ref<HTMLDivElement>`                                                      | —               | Ref forwarded to the `div.combobox` around the field and the list.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `...`            | All standard `<div>` attributes and Bulma helper props                           | —               | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Subcomponents:**

- `Combobox.Input`: The text field, with the combobox role and the keys, rendered as an `Input`.
- `Combobox.Dropdown`: The floating panel under the field, on screen while the list is open and it has something in it.
- `Combobox.Options`: The list of options, a `listbox` named by the label that names the field.
- `Combobox.Option`: One choice in the list, with a check mark while it's `checked`.
- `Combobox.Group`: Options under a heading, a `group` named by it.
- `Combobox.Empty`: The message shown in place of the list when nothing matches, announced when typing brings it on screen.

### Combobox.Input

| Prop               | Type                                                                                                                               | Default | Description                                                                                                                                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iconLeft`         | `IconProps` \| `React.ReactNode`                                                                                                   | —       | Icon props for left icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the input in its own addon `Control` instead.                                                                                          |
| `iconRight`        | `IconProps` \| `React.ReactNode`                                                                                                   | —       | Icon props for right icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the input in its own addon `Control` instead.                                                                                         |
| `iconLeftName`     | `string`                                                                                                                           | —       | Shortcut for left icon name.                                                                                                                                                                                                                                                            |
| `iconRightName`    | `string`                                                                                                                           | —       | Shortcut for right icon name.                                                                                                                                                                                                                                                           |
| `iconLeftSize`     | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Shortcut for left icon size.                                                                                                                                                                                                                                                            |
| `iconRightSize`    | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Shortcut for right icon size.                                                                                                                                                                                                                                                           |
| `hasIconsLeft`     | `boolean`                                                                                                                          | `false` | Force left icon container.                                                                                                                                                                                                                                                              |
| `hasIconsRight`    | `boolean`                                                                                                                          | `false` | Force right icon container.                                                                                                                                                                                                                                                             |
| `isLoading`        | `boolean`                                                                                                                          | `false` | Shows a loading spinner on the `Control` it renders. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded). The spinner sits at the right edge, where `iconRight` also sits, and the two overlap; leave the right icon out while loading. |
| `isExpanded`       | `boolean`                                                                                                                          | `false` | Expand the control.                                                                                                                                                                                                                                                                     |
| `controlSize`      | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Control size.                                                                                                                                                                                                                                                                           |
| `controlClassName` | `string`                                                                                                                           | —       | Additional CSS classes for the Control.                                                                                                                                                                                                                                                 |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the input.                                                                                                                                                                                                                                                     |
| `isRounded`        | `boolean`                                                                                                                          | `false` | Rounded input corners.                                                                                                                                                                                                                                                                  |
| `isStatic`         | `boolean`                                                                                                                          | `false` | Styles the input as static text. It stays editable; add `readOnly` to stop edits.                                                                                                                                                                                                       |
| `isHovered`        | `boolean`                                                                                                                          | `false` | Applies hovered state.                                                                                                                                                                                                                                                                  |
| `isFocused`        | `boolean`                                                                                                                          | `false` | Applies focused state.                                                                                                                                                                                                                                                                  |
| `className`        | `string`                                                                                                                           | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                        |
| `disabled`         | `boolean`                                                                                                                          | `false` | Disabled input.                                                                                                                                                                                                                                                                         |
| `readOnly`         | `boolean`                                                                                                                          | `false` | Read-only input.                                                                                                                                                                                                                                                                        |
| `ref`              | `React.Ref<HTMLInputElement>`                                                                                                      | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                    |
| `...`              | All standard `<input>` attributes and Bulma helper props                                                                           | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                       |

### Combobox.Dropdown

| Prop        | Type                            | Default | Description                            |
| ----------- | ------------------------------- | ------- | -------------------------------------- |
| `className` | `string`                        | —       | Additional CSS classes.                |
| `children`  | `React.ReactNode`               | —       | Content rendered inside the component. |
| `...`       | All standard `<div>` attributes | —       |                                        |

### Combobox.Options

| Prop        | Type                            | Default | Description                                                           |
| ----------- | ------------------------------- | ------- | --------------------------------------------------------------------- |
| `children`  | `React.ReactNode`               | —       | `Combobox.Option`s and `Combobox.Group`s, in the order they're shown. |
| `className` | `string`                        | —       | Additional CSS classes.                                               |
| `...`       | All standard `<div>` attributes | —       |                                                                       |

### Combobox.Option

| Prop        | Type                            | Default | Description                                                                                                                                   |
| ----------- | ------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`     | `string`                        | —       | What `onOptionSubmit` hands back. Unique within the Combobox.                                                                                 |
| `disabled`  | `boolean`                       | `false` | Can't be picked. The arrows still reach it, so a screen reader user finds it, and it's never `aria-selected`.                                 |
| `checked`   | `boolean`                       | `false` | It's the value, or one of them. It shows a check mark, the list opens with the highlight on it, and with `multiple` it's the `aria-selected`. |
| `children`  | `React.ReactNode`               | —       | What the option shows: text, or text with an avatar, a tag or a hint.                                                                         |
| `className` | `string`                        | —       | Additional CSS classes.                                                                                                                       |
| `...`       | All standard `<div>` attributes | —       |                                                                                                                                               |

### Combobox.Group

| Prop        | Type                            | Default | Description                                                 |
| ----------- | ------------------------------- | ------- | ----------------------------------------------------------- |
| `label`     | `React.ReactNode`               | —       | The heading, which also names the group for assistive tech. |
| `children`  | `React.ReactNode`               | —       | The group's `Combobox.Option`s.                             |
| `className` | `string`                        | —       | Additional CSS classes.                                     |
| `...`       | All standard `<div>` attributes | —       |                                                             |

### Combobox.Empty

| Prop        | Type                            | Default | Description                                                                                                                                                                                                |
| ----------- | ------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`               | —       | The message, such as "No countries match". Its text is announced when typing brings it on screen and isn't read again while it stays, so a message that names the query is heard for the first query only. |
| `className` | `string`                        | —       | Additional CSS classes.                                                                                                                                                                                    |
| `...`       | All standard `<div>` attributes | —       |                                                                                                                                                                                                            |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Combobox` registers these variables on its own `.combobox` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                               | Sass Variable                       | Default                                                                                                                       |
| ------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--bulma-combobox-dropdown-z-index`        | `$combobox-dropdown-z-index`        | `$extras-z-index-dropdown`                                                                                                    |
| `--bulma-combobox-portal-z-index`          | `$combobox-portal-z-index`          | `$extras-z-index-tooltip`                                                                                                     |
| `--bulma-combobox-dropdown-offset`         | `$combobox-dropdown-offset`         | `0.25rem`                                                                                                                     |
| `--bulma-combobox-dropdown-background`     | `$combobox-dropdown-background`     | `var(--bulma-scheme-main)`                                                                                                    |
| `--bulma-combobox-dropdown-radius`         | `$combobox-dropdown-radius`         | `var(--bulma-radius)`                                                                                                         |
| `--bulma-combobox-dropdown-shadow`         | `$combobox-dropdown-shadow`         | `var(--bulma-shadow)`                                                                                                         |
| `--bulma-combobox-dropdown-border-color`   | `$combobox-dropdown-border-color`   | `var(--bulma-border-weak)`                                                                                                    |
| `--bulma-combobox-dropdown-padding-y`      | `$combobox-dropdown-padding-y`      | `0.5rem`                                                                                                                      |
| `--bulma-combobox-list-max-height`         | `$combobox-list-max-height`         | `15rem`                                                                                                                       |
| `--bulma-combobox-option-color`            | `$combobox-option-color`            | `var(--bulma-text-strong)`                                                                                                    |
| `--bulma-combobox-option-size`             | `$combobox-option-size`             | `0.875rem`                                                                                                                    |
| `--bulma-combobox-option-padding-y`        | `$combobox-option-padding-y`        | `0.375rem`                                                                                                                    |
| `--bulma-combobox-option-padding-x`        | `$combobox-option-padding-x`        | `1rem`                                                                                                                        |
| `--bulma-combobox-option-hover-background` | `$combobox-option-hover-background` | `hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-scheme-main-l) + var(--bulma-hover-background-l-delta)))` |
| `--bulma-combobox-highlight-background`    | `$combobox-highlight-background`    | `var(--bulma-link)`                                                                                                           |
| `--bulma-combobox-highlight-color`         | `$combobox-highlight-color`         | `var(--bulma-link-invert)`                                                                                                    |
| `--bulma-combobox-disabled-color`          | `$combobox-disabled-color`          | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-combobox-check-color`             | `$combobox-check-color`             | `currentColor`                                                                                                                |
| `--bulma-combobox-check-size`              | `$combobox-check-size`              | `1em`                                                                                                                         |
| `--bulma-combobox-check-gap`               | `$combobox-check-gap`               | `0.5em`                                                                                                                       |
| `--bulma-combobox-group-label-size`        | `$combobox-group-label-size`        | `0.85em`                                                                                                                      |
| `--bulma-combobox-group-label-weight`      | `$combobox-group-label-weight`      | `var(--bulma-weight-semibold)`                                                                                                |
| `--bulma-combobox-group-label-color`       | `$combobox-group-label-color`       | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-combobox-divider-color`           | `$combobox-divider-color`           | `var(--bulma-border-weak)`                                                                                                    |
| `--bulma-combobox-empty-color`             | `$combobox-empty-color`             | `var(--bulma-text-weak)`                                                                                                      |

<!-- /bestax:generated cssvars -->
