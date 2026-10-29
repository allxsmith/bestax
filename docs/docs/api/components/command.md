---
title: Command
sidebar_label: Command
description: 'The `Command` component is a search field over a list of things to do, which narrows as you type and runs the top match on Enter: inline by default, and a command palette in a modal as `Command.Dialog`.'
---

# Command

## Overview

<!-- bestax:generated overview -->

The `Command` component is a search field over a list of things to do, which narrows as you type and runs the top match on Enter: inline by default, and a command palette in a modal as `Command.Dialog`.

<!-- /bestax:generated overview -->

Reach for it for a command palette that opens on ⌘K or Ctrl+K, a spotlight search over pages and
records, or a "jump to" list inside a Popover or a settings page. You type, the list narrows, the
arrows move the highlight, and Enter runs the top match.

Give it `actions` and it's one element: it filters them by label, keywords and description,
groups them, and draws each with its icon, description and hint. When that doesn't fit, such as
for results from a server, build it from parts: `Command.Input` is the search field, and
`Command.List`, `Command.Group`, `Command.Item` and `Command.Empty` show what you render. The
Command then handles the keys, the highlight and the ARIA, and you handle what's in the list.

`Command` renders inline. `Command.Dialog` is the same thing in a [`Modal`](./modal.md), a
command palette, with an optional `shortcut` that opens it from anywhere on the page.

:::info
Bulma has no command palette, so `Command` brings its own styles, in `bestax.css` and its
variants, or in `extras.css` next to your own Bulma. The search field is Bulma's `Input`.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Command } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it `actions`, each with an `id`, a `label` and an `onSelect` that runs it. `label` names the
field and the list for assistive tech, and `placeholder` is the field's.

```tsx live
function example() {
  const [ran, setRan] = useState('nothing yet');

  return (
    <>
      <Command
        label="Settings"
        placeholder="Search settings"
        actions={[
          {
            id: 'profile',
            label: 'Edit profile',
            onSelect: () => setRan('Edit profile'),
          },
          {
            id: 'password',
            label: 'Change password',
            onSelect: () => setRan('Change password'),
          },
          {
            id: 'theme',
            label: 'Dark mode',
            keywords: ['theme', 'appearance'],
            onSelect: () => setRan('Dark mode'),
          },
          {
            id: 'sign-out',
            label: 'Sign out',
            onSelect: () => setRan('Sign out'),
          },
        ]}
      />
      <Paragraph mt="3">Ran: {ran}</Paragraph>
    </>
  );
}
```

Running an action calls its own `onSelect`, then the Command's `onSelect` with its `id`, so you
can handle every action in one place instead.

### A Command Palette

`Command.Dialog` puts the Command in a modal. Its `shortcut` opens it, here ⌘J or Ctrl+J, and
Escape, a click on the background or running an action closes it. Focus goes to the search field
when it opens and back to where it was when it closes. Open it from a button too, with `open` and
`onOpenChange`.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const [ran, setRan] = useState<string | null>(null);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Control+J Meta+J"
      >
        Open the palette
      </Button>
      <Paragraph mt="3">
        Or press{' '}
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>J</Kbd>
        </Kbd.Group>{' '}
        or{' '}
        <Kbd.Group>
          <Kbd label="Command">⌘</Kbd>
          <Kbd>J</Kbd>
        </Kbd.Group>
        .{ran && ` Last run: ${ran}.`}
      </Paragraph>
      <Command.Dialog
        shortcut="mod+j"
        open={open}
        onOpenChange={setOpen}
        placeholder="Type a command or search"
        onSelect={setRan}
        actions={[
          {
            id: 'Go to dashboard',
            label: 'Go to dashboard',
            group: 'Navigation',
          },
          { id: 'Go to issues', label: 'Go to issues', group: 'Navigation' },
          {
            id: 'New issue',
            label: 'New issue',
            group: 'Actions',
            keywords: ['create', 'bug'],
          },
          {
            id: 'Dark mode',
            label: 'Dark mode',
            group: 'Settings',
            keywords: ['theme'],
          },
        ]}
      />
    </>
  );
}
```

This page uses ⌘J because the site's own search already takes ⌘K, which is the usual choice in
an app. Uncontrolled, the dialog needs nothing but the shortcut and the actions:
`<Command.Dialog shortcut="mod+k" actions={actions} />`.

The shortcut is modifiers and a key joined by `+`. `mod` is Ctrl or ⌘, whichever is held, on
every platform, and the others are `ctrl`, `meta`, `alt` and `shift`. It stays out of the way:
it does nothing while the user is typing in a text field, a text area, a select or editable
content, while an input method is composing, while a modal overlay has the page shut off (a
`Modal`, a `Dialog`, a `Sidebar` with its overlay or a full-page `Loading`), or when something else
on the page has already used the key. A `Sidebar` without an overlay leaves the page in use, so the
shortcut still works with one open. It only opens the dialog. A shortcut
with no modifier, such as `/`, is a character key shortcut, and WCAG asks for a way to turn one
off or change it, which a setting in your app passed to `shortcut` gives.

A button that opens the palette can carry `aria-keyshortcuts`, as above, which tells assistive
tech about the shortcut. Show it with [`Kbd`](../elements/kbd.md).

### Groups, Icons, Descriptions and Hints

An action's `group` puts it under a heading. `icon` sits before the label, `description` on a
line under it, and `hint` at the end of the row: a keyboard shortcut in a `Kbd.Group`, or a
`Tag`. A `disabled` action is shown, and the arrows reach it, but it never runs.

```tsx live
<Command
  label="Project"
  placeholder="Search the project"
  actions={[
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
      icon: <Icon name="moon" />,
      hint: <Tag color="info">New</Tag>,
    },
  ]}
/>
```

The hint only shows: nothing listens for a shortcut written there. The icon is hidden from
assistive tech, and a screen reader hears the label as the item's name, then the description and
the hint.

### How It Matches

The search is matched, ignoring case and the spaces around it, against each action's label, then
its `keywords` and its `description`. Label matches come first, and the order is kept otherwise.
Groups show in the order the matches first name them, so the best match is always at the top,
and Enter runs it. Inside a [`LocaleProvider`](../helpers/localeprovider.md) with a `locale`, the
comparison follows that language, so accents are ignored where it treats the letters as the same:
"cafe" finds "Café", while in Swedish "a" doesn't find "å".

`keywords` are words that aren't shown, for what someone might type instead: "theme" and
"appearance" for "Dark mode", or "create" for "New issue". When nothing matches, the list shows
"No results", or what you pass as `empty`.

```tsx live
<Command
  label="Settings"
  placeholder="Try “theme” or “mail”"
  empty="No settings match"
  actions={[
    { id: 'dark', label: 'Dark mode', keywords: ['theme', 'appearance'] },
    { id: 'font', label: 'Font size', keywords: ['text', 'zoom'] },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Email and push alerts',
      keywords: ['mail'],
    },
    { id: 'language', label: 'Language', description: 'English' },
  ]}
/>
```

### Fuzzy Matching

`filter` takes over. It's handed the search as typed and every action, and returns the ones to
show, in the order to show them, so it's where fuzzy matching goes, or a limit on how many show.
This one keeps the actions whose label has the letters of the search in order, so "gti" finds "Go
to issues", tightest matches first.

```tsx live
import type { CommandAction } from '@allxsmith/bestax-bulma';

function example() {
  const fuzzy = (query: string, actions: CommandAction[]) => {
    const term = query.replace(/\s+/g, '').toLowerCase();
    if (!term) return actions;
    return actions
      .flatMap(action => {
        const label = action.label.toLowerCase();
        let at = -1;
        let first = -1;
        for (const letter of term) {
          at = label.indexOf(letter, at + 1);
          if (at === -1) return [];
          if (first === -1) first = at;
        }
        return [{ action, spread: at - first }];
      })
      .sort((a, b) => a.spread - b.spread)
      .map(match => match.action);
  };

  return (
    <Command
      placeholder="Try “gti” or “nis”"
      filter={fuzzy}
      actions={[
        { id: 'dashboard', label: 'Go to dashboard' },
        { id: 'issues', label: 'Go to issues' },
        { id: 'new-issue', label: 'New issue' },
        { id: 'settings', label: 'Settings' },
      ]}
    />
  );
}
```

With a library such as [Fuse.js](https://www.fusejs.io/), the filter is a search over the same
fields the default one reads:

```tsx
import Fuse from 'fuse.js';

const fuse = new Fuse(actions, {
  keys: ['label', 'keywords', 'description'],
  threshold: 0.3,
});

<Command
  actions={actions}
  filter={query =>
    query.trim() ? fuse.search(query).map(result => result.item) : actions
  }
/>;
```

### Building It Yourself

Built from parts, the Command filters nothing: you render the items that match the search
`onQueryChange` reports. `Command.Input` is the field, and `Command.List` goes after it while
there are items, with `Command.Empty` in its place while there aren't. A `Command.Item` takes the
same `icon`, `description` and `hint` an action does, its label as its children, and an
`onSelect` of its own.

```tsx live
function example() {
  const files = [
    { path: 'README.md', folder: 'Docs' },
    { path: 'guide.md', folder: 'Docs' },
    { path: 'index.ts', folder: 'Source' },
    { path: 'Command.tsx', folder: 'Source' },
  ];
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const term = query.trim().toLowerCase();
  const matches = files.filter(f => f.path.toLowerCase().includes(term));
  const folders = [...new Set(matches.map(f => f.folder))];

  return (
    <>
      <Command label="Files" onQueryChange={setQuery} onSelect={setOpened}>
        <Command.Input placeholder="Open a file" />
        {matches.length > 0 ? (
          <Command.List>
            {folders.map(folder => (
              <Command.Group key={folder} label={folder}>
                {matches
                  .filter(f => f.folder === folder)
                  .map(f => (
                    <Command.Item
                      key={f.path}
                      value={f.path}
                      icon={<Icon name="file" />}
                    >
                      {f.path}
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
        {opened ? `Opened ${opened}` : 'Nothing open'}
      </Paragraph>
    </>
  );
}
```

The first enabled item is highlighted whenever the items change, so Enter runs the top one in
the order you render them. Each item's `value` is what `onSelect` hands back, and has to be
unique within the Command.

### Server Search

For results from a server, filter there. Put `isLoading` on `Command.Input` while you wait, and
the empty message is announced once the answer is in rather than while it's on its way. Leave the
order to the server, since the Command shows the items as you render them.

```tsx live
function example() {
  const people = [
    'Ada Lovelace',
    'Alan Turing',
    'Grace Hopper',
    'Katherine Johnson',
    'Margaret Hamilton',
    'Radia Perlman',
  ];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(people);
  const [loading, setLoading] = useState(false);

  // A stand-in for a fetch, which answers after a moment.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const term = query.trim().toLowerCase();
      setResults(people.filter(p => p.toLowerCase().includes(term)));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Command label="People" onQueryChange={setQuery}>
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
  );
}
```

### Pages

An action can open another page of the palette instead of running something, the way "Change
theme…" leads to the themes. Keep the page in state, turn `closeOnSelect` off, and close the
dialog yourself once something runs. Backspace in an empty field going back a page is yours to add
too, with an `onKeyDown`.

```tsx live
import type { CommandAction } from '@allxsmith/bestax-bulma';

function example() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<'home' | 'theme'>('home');
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('System');
  const close = () => {
    setOpen(false);
    setPage('home');
  };
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
  const themes: CommandAction[] = ['Light', 'Dark', 'System'].map(name => ({
    id: name,
    label: name,
    onSelect: () => {
      setTheme(name);
      close();
    },
  }));

  return (
    <>
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
    </>
  );
}
```

The dialog clears its search when it closes, a controlled one through `onQueryChange('')`. Turn
`clearOnClose` off to keep it for next time.

### In a Popover

The inline Command fits anywhere a list of things to do does, such as a "Move to…" button. The
[`Popover`](./popover.md) moves focus into the search field when it opens and back to the button
when it closes, and Escape in the field reaches the Popover, since an inline Command leaves it
alone.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState('Inbox');

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      ariaLabel="Move to"
      trigger={<Button>Move to… ({project})</Button>}
    >
      <Popover.Body>
        <Command
          label="Projects"
          placeholder="Search projects"
          onSelect={next => {
            setProject(next);
            setOpen(false);
          }}
          actions={['Inbox', 'Website', 'Mobile app', 'Marketing'].map(
            name => ({
              id: name,
              label: name,
            })
          )}
        />
      </Popover.Body>
    </Popover>
  );
}
```

### Compound (dot-notation) usage

Every part, in dot notation: `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`
and `Command.Empty`, with `Command.Dialog` for the modal. Each is also exported by name
(`CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty` and
`CommandDialog`).

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [ran, setRan] = useState<string | null>(null);
  const colors = [
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
  ] as const;
  const matches = colors.filter(c => c.includes(query.trim().toLowerCase()));

  return (
    <>
      <Button onClick={() => setOpen(true)}>Pick a color</Button>
      <Paragraph mt="3">{ran ? `Picked ${ran}` : 'No color yet'}</Paragraph>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Colors"
        query={query}
        onQueryChange={setQuery}
        onSelect={setRan}
      >
        <Command.Input placeholder="Search colors" />
        {matches.length > 0 ? (
          <Command.List>
            <Command.Group label="Bulma colors">
              {matches.map(color => (
                <Command.Item
                  key={color}
                  value={color}
                  hint={<Tag color={color}>is-{color}</Tag>}
                >
                  {color}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        ) : (
          <Command.Empty>No colors match</Command.Empty>
        )}
      </Command.Dialog>
    </>
  );
}
```

---

## Keyboard

Focus stays in the search field the whole time. The keys work on the field like this:

| Key                          | What it does                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Down Arrow                   | Highlights the next item, wrapping to the first. Disabled items are reached too, so a screen reader finds them |
| Up Arrow                     | Highlights the previous item, wrapping to the last                                                             |
| Enter                        | Runs the highlighted item. On a disabled one it runs nothing. With nothing highlighted, the key is left alone  |
| Typing, Backspace and Delete | The field's own. When the search changes, the highlight moves to the first enabled item of the new list        |
| Home, End, Left, Right       | The field's own, and the highlight clears until an arrow brings it back                                        |
| Escape                       | Left alone inline, so it reaches whatever is around the Command. In `Command.Dialog`, it closes the dialog     |
| Tab                          | Leaves the field inline. In `Command.Dialog`, focus stays in the field, the dialog's only stop                 |
| The `shortcut`               | Opens `Command.Dialog`, unless the user is typing in a field, an IME is composing or a modal overlay is open   |

- **While an IME is composing,** none of this runs, so Enter finishes the word instead of
  running an item.
- **Your own `onKeyDown`** on `Command.Input` runs first, and one that calls `preventDefault()`
  keeps the Command from handling that key.

The pointer works the same way. Moving it over an enabled item highlights it, and a click runs it.
A press in the list never takes focus from the field.

---

## Accessibility

- **The roles:** the field is `role="combobox"` with `aria-autocomplete="list"` and
  `aria-haspopup="listbox"`, and the list is a `listbox` of `option`s, the ARIA 1.2 combobox the
  ARIA Authoring Practices describe. A group is a `group` named by its heading.
- **Focus stays in the field:** the highlighted item is the field's `aria-activedescendant`, and
  the only item that's `aria-selected`. When a key moves it, it's scrolled into view. A click on an
  item keeps focus in the field too.
- **`aria-expanded`** is `true` while the list has an item in it, with `aria-controls` pointing
  at it, and `false` while only the empty message shows.
- **Names:** `label` names the field and the list, and in `Command.Dialog` the dialog as well.
  It's "Commands" unless you give one. An `aria-label` or `aria-labelledby` on `Command.Input`,
  `Command.List` or `Command.Dialog` names that one instead.
- **An item is named by its label alone,** and described by its description and hint, so a
  screen reader says what it does first and the rest after. Its icon is hidden.
- **Disabled items** are `aria-disabled`, reachable with the arrows, never run, and never
  highlighted when the list changes.
- **The empty message** is announced through a polite status region when your typing brings it on
  screen, once each time the matches run out, and after `isLoading` ends. An empty search
  announces nothing.
- **No count is announced,** as with [`Combobox`](../form/combobox.md#a-result-count): a screen
  reader reads how many items there are from the list itself, and a count read out on each
  keystroke talks over the typing.
- **The dialog** is a modal `dialog` with `aria-modal`, around the Command's box, inside a
  `Modal` that's `role="presentation"`. Focus moves to the search field when it opens, stays
  inside while it's open, and goes back to where it was when it closes. The page behind it
  doesn't scroll.
- **The shortcut** never fires while someone is typing, so it can't swallow a letter, and it
  leaves a key the page has already used alone. Nothing announces it, so put it on a button with
  `aria-keyshortcuts`, and show it with `Kbd`.
- **Forced colors:** in Windows high contrast mode the highlight is drawn as an outline in the
  system's highlight color, and a disabled item takes the system's color for disabled text.
- **No motion:** nothing animates.

---

## Related Components

- [`Combobox`](../form/combobox.md): A field that picks a value from a list, on the same keys and
  ARIA.
- [`Modal`](./modal.md): What `Command.Dialog` is built on, for a dialog of your own.
- [`Popover`](./popover.md): A panel behind a button, where an inline Command makes a "Move to…"
  list.
- [`Kbd`](../elements/kbd.md): Keys to show as a hint, or beside the button that opens the
  palette.
- [`Dropdown`](./dropdown.md): A short menu of actions with no search.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Command Stories](https://bestax.io/storybook/?path=/story/components-command--default)
- [ARIA Authoring Practices: Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [ARIA Authoring Practices: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [MDN: aria-keyshortcuts](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts)
- [WCAG 2.2, Understanding Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)

---

## Props

<!-- bestax:generated props -->

| Prop            | Type                                                           | Default        | Description                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `actions`       | `CommandAction[]`                                              | —              | The actions, for a Command that renders the field, the list, the groups and the empty message itself. Typing filters them by label, keywords and description, ignoring case, with label matches first. Inside a `LocaleProvider` with a `locale`, it ignores accents too where that language does, so "cafe" finds "Café". Leave it out to build the Command from parts. |
| `filter`        | `(query: string, actions: CommandAction[]) => CommandAction[]` | —              | Takes over the filtering, with `actions`: it's handed the search as typed and every action, and returns the ones to show, in the order to show them, which is how to plug in fuzzy matching or cut the list short. It's called with an empty search too.                                                                                                                 |
| `placeholder`   | `string`                                                       | —              | The field's placeholder, with `actions`.                                                                                                                                                                                                                                                                                                                                 |
| `empty`         | `React.ReactNode`                                              | `'No results'` | What shows in place of the list, with `actions`, when nothing matches. It's announced the way `Command.Empty` is. `null` shows nothing.                                                                                                                                                                                                                                  |
| `children`      | `React.ReactNode`                                              | —              | The parts, in order: `Command.Input`, then `Command.List` while there are items and `Command.Empty` while there aren't. Nothing filters them, so render the items that match the search `onQueryChange` reports. With `actions` there are none to give: children given with it are ignored, with a warning in development.                                               |
| `label`         | `string`                                                       | `'Commands'`   | What the Command is for, such as "Commands" or "Settings". It's never shown: it names the search field and the list for assistive tech, and in `Command.Dialog` the dialog too. An empty string counts as none.                                                                                                                                                          |
| `query`         | `string`                                                       | —              | The search, controlled: the text in the field. Pair it with `onQueryChange`.                                                                                                                                                                                                                                                                                             |
| `defaultQuery`  | `string`                                                       | `''`           | The search to start with when uncontrolled.                                                                                                                                                                                                                                                                                                                              |
| `onQueryChange` | `(query: string) => void`                                      | —              | Called with the search as the user types it. Built from parts, this is where the app filters its items.                                                                                                                                                                                                                                                                  |
| `onSelect`      | `(value: string) => void`                                      | —              | Called with the picked item's `value`, an action's `id`, when it's run with Enter or a click, after the item's own `onSelect`. A disabled item is never run.                                                                                                                                                                                                             |
| `className`     | `string`                                                       | —              | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                  |
| `ref`           | `React.Ref<HTMLDivElement>`                                    | —              | Ref forwarded to the `div.command` around the field and the list.                                                                                                                                                                                                                                                                                                        |
| `...`           | All standard `<div>` attributes and Bulma helper props         | —              | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                        |

**Subcomponents:**

- `Command.Input`: The search field, with the combobox role and the keys, rendered as an `Input` with a search icon.
- `Command.List`: The list of items, a `listbox` named by the Command's `label`.
- `Command.Group`: Items under a heading, a `group` named by it.
- `Command.Item`: One thing to do in the list, named by its label and described by its description and hint.
- `Command.Empty`: The message shown in place of the list when nothing matches, announced when typing brings it on screen.
- `Command.Dialog`: The Command in a modal, a command palette, opened by its `shortcut` or by `open`, that closes once an item has run. It renders nothing while it's closed. Open, it's a `Modal` with a background and the Command's box as the `dialog`, named by `label`: focus goes to the search field, Tab stays inside, Escape and a click on the background close it, the page behind it doesn't scroll, and focus goes back to where it was when it closes.

### Command.Input

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
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Size modifier for the input.                                                                                                                                                                                                                                                            |
| `isRounded`        | `boolean`                                                                                                                          | `false` | Rounded input corners.                                                                                                                                                                                                                                                                  |
| `isStatic`         | `boolean`                                                                                                                          | `false` | Styles the input as static text. It stays editable; add `readOnly` to stop edits.                                                                                                                                                                                                       |
| `isHovered`        | `boolean`                                                                                                                          | `false` | Applies hovered state.                                                                                                                                                                                                                                                                  |
| `isFocused`        | `boolean`                                                                                                                          | `false` | Applies focused state.                                                                                                                                                                                                                                                                  |
| `className`        | `string`                                                                                                                           | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                        |
| `disabled`         | `boolean`                                                                                                                          | `false` | Disabled input.                                                                                                                                                                                                                                                                         |
| `readOnly`         | `boolean`                                                                                                                          | `false` | Read-only input.                                                                                                                                                                                                                                                                        |
| `ref`              | `React.Ref<HTMLInputElement>`                                                                                                      | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                    |
| `...`              | All standard `<input>` attributes and Bulma helper props                                                                           | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                       |

### Command.List

| Prop        | Type                            | Default | Description                                                       |
| ----------- | ------------------------------- | ------- | ----------------------------------------------------------------- |
| `children`  | `React.ReactNode`               | —       | `Command.Item`s and `Command.Group`s, in the order they're shown. |
| `className` | `string`                        | —       | Additional CSS classes.                                           |
| `...`       | All standard `<div>` attributes | —       |                                                                   |

### Command.Group

| Prop        | Type                            | Default | Description                                                                                                                            |
| ----------- | ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `label`     | `React.ReactNode`               | —       | The heading, which also names the group for assistive tech, unless you give the group an `aria-label` or `aria-labelledby` of its own. |
| `children`  | `React.ReactNode`               | —       | The group's `Command.Item`s.                                                                                                           |
| `className` | `string`                        | —       | Additional CSS classes.                                                                                                                |
| `...`       | All standard `<div>` attributes | —       |                                                                                                                                        |

### Command.Item

| Prop          | Type                            | Default | Description                                                                                                                                                           |
| ------------- | ------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `string`                        | —       | What the Command's `onSelect` hands back. Unique within the Command.                                                                                                  |
| `disabled`    | `boolean`                       | `false` | Can't be run. The arrows still reach it, so a screen reader user finds it, and it's never `aria-selected`.                                                            |
| `onSelect`    | `() => void`                    | —       | Runs the item, when it's picked with Enter or a click, before the Command's `onSelect`.                                                                               |
| `icon`        | `React.ReactNode`               | —       | Shown before the label, and hidden from assistive tech.                                                                                                               |
| `description` | `React.ReactNode`               | —       | A line under the label. A screen reader hears it after the label, as the item's description.                                                                          |
| `hint`        | `React.ReactNode`               | —       | Shown at the end of the row, such as a keyboard shortcut in a `Kbd.Group`, or a `Tag`. It only shows. A screen reader hears it after the label, with the description. |
| `children`    | `React.ReactNode`               | —       | The label, which names the item.                                                                                                                                      |
| `className`   | `string`                        | —       | Additional CSS classes.                                                                                                                                               |
| `...`         | All standard `<div>` attributes | —       |                                                                                                                                                                       |

### Command.Empty

| Prop        | Type                            | Default | Description                                                                                                                                                                                                 |
| ----------- | ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`               | —       | The message, such as "No commands match". Its text is announced when typing brings it on screen and isn't read again while it stays, so a message that names the search is heard for the first search only. |
| `className` | `string`                        | —       | Additional CSS classes.                                                                                                                                                                                     |
| `...`       | All standard `<div>` attributes | —       |                                                                                                                                                                                                             |

### Command.Dialog

| Prop            | Type                                                           | Default        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`       | `CommandAction[]`                                              | —              | The actions, for a Command that renders the field, the list, the groups and the empty message itself. Typing filters them by label, keywords and description, ignoring case, with label matches first. Inside a `LocaleProvider` with a `locale`, it ignores accents too where that language does, so "cafe" finds "Café". Leave it out to build the Command from parts.                                                                                                                                                                                             |
| `filter`        | `(query: string, actions: CommandAction[]) => CommandAction[]` | —              | Takes over the filtering, with `actions`: it's handed the search as typed and every action, and returns the ones to show, in the order to show them, which is how to plug in fuzzy matching or cut the list short. It's called with an empty search too.                                                                                                                                                                                                                                                                                                             |
| `placeholder`   | `string`                                                       | —              | The field's placeholder, with `actions`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `empty`         | `React.ReactNode`                                              | `'No results'` | What shows in place of the list, with `actions`, when nothing matches. It's announced the way `Command.Empty` is. `null` shows nothing.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `open`          | `boolean`                                                      | —              | Controlled open state. When set, opening and closing only report through `onOpenChange`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `defaultOpen`   | `boolean`                                                      | `false`        | Initial open state when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onOpenChange`  | `(open: boolean) => void`                                      | —              | Called with the open state asked for: `true` from the `shortcut`, and `false` from Escape, a click on the background, or a pick while `closeOnSelect` is on. Fires in controlled and uncontrolled use.                                                                                                                                                                                                                                                                                                                                                               |
| `shortcut`      | `string`                                                       | —              | A key combination that opens the dialog from anywhere on the page, such as `"mod+k"`: modifiers and a key joined by `+`, where `mod` is Ctrl or ⌘ (either one, on every platform), and the others are `ctrl`, `meta`, `alt` and `shift`. It's ignored while the user is typing in a text field, a select or editable content, while an IME is composing, while a modal overlay is open (a `Modal`, a `Dialog`, a `Sidebar` with its overlay or a full-page `Loading`), and when something else has already used the key. It only opens the dialog. Off unless given. |
| `closeOnSelect` | `boolean`                                                      | `true`         | Closes the dialog once an item has run. Turn it off for an item that opens another page of the palette, and close it yourself with `open`.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `clearOnClose`  | `boolean`                                                      | `true`         | Clears the search when the dialog closes: an uncontrolled one itself, and a controlled one through `onQueryChange('')`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `portal`        | `boolean` \| `string` \| `HTMLElement`                         | `false`        | Renders the dialog into a portal target instead of inline. Forwarded to the underlying `Modal`; see its `portal` prop for the accepted values.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `children`      | `React.ReactNode`                                              | —              | The parts, in order: `Command.Input`, then `Command.List` while there are items and `Command.Empty` while there aren't. Nothing filters them, so render the items that match the search `onQueryChange` reports. With `actions` there are none to give: children given with it are ignored, with a warning in development.                                                                                                                                                                                                                                           |
| `label`         | `string`                                                       | `'Commands'`   | What the Command is for, such as "Commands" or "Settings". It's never shown: it names the search field and the list for assistive tech, and in `Command.Dialog` the dialog too. An empty string counts as none.                                                                                                                                                                                                                                                                                                                                                      |
| `query`         | `string`                                                       | —              | The search, controlled: the text in the field. Pair it with `onQueryChange`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `defaultQuery`  | `string`                                                       | `''`           | The search to start with when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `onQueryChange` | `(query: string) => void`                                      | —              | Called with the search as the user types it. Built from parts, this is where the app filters its items.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `onSelect`      | `(value: string) => void`                                      | —              | Called with the picked item's `value`, an action's `id`, when it's run with Enter or a click, after the item's own `onSelect`. A disabled item is never run.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `className`     | `string`                                                       | —              | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `ref`           | `React.Ref<HTMLDivElement>`                                    | —              | Ref forwarded to the `div.command` that is the dialog.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `...`           | All standard `<div>` attributes and Bulma helper props         | —              | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Command` registers these variables on its own `.command` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                            | Sass Variable                    | Default                                                                                                                       |
| --------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--bulma-command-background`            | `$command-background`            | `var(--bulma-scheme-main)`                                                                                                    |
| `--bulma-command-border-color`          | `$command-border-color`          | `var(--bulma-border-weak)`                                                                                                    |
| `--bulma-command-radius`                | `$command-radius`                | `var(--bulma-radius-large)`                                                                                                   |
| `--bulma-command-padding`               | `$command-padding`               | `0.5rem`                                                                                                                      |
| `--bulma-command-gap`                   | `$command-gap`                   | `0.5rem`                                                                                                                      |
| `--bulma-command-list-max-height`       | `$command-list-max-height`       | `20rem`                                                                                                                       |
| `--bulma-command-item-color`            | `$command-item-color`            | `var(--bulma-text-strong)`                                                                                                    |
| `--bulma-command-item-size`             | `$command-item-size`             | `0.875rem`                                                                                                                    |
| `--bulma-command-item-padding-y`        | `$command-item-padding-y`        | `0.5rem`                                                                                                                      |
| `--bulma-command-item-padding-x`        | `$command-item-padding-x`        | `0.75rem`                                                                                                                     |
| `--bulma-command-item-radius`           | `$command-item-radius`           | `var(--bulma-radius)`                                                                                                         |
| `--bulma-command-item-gap`              | `$command-item-gap`              | `0.75rem`                                                                                                                     |
| `--bulma-command-item-hover-background` | `$command-item-hover-background` | `hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-scheme-main-l) + var(--bulma-hover-background-l-delta)))` |
| `--bulma-command-highlight-background`  | `$command-highlight-background`  | `var(--bulma-link)`                                                                                                           |
| `--bulma-command-highlight-color`       | `$command-highlight-color`       | `var(--bulma-link-invert)`                                                                                                    |
| `--bulma-command-disabled-color`        | `$command-disabled-color`        | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-command-icon-color`            | `$command-icon-color`            | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-command-description-color`     | `$command-description-color`     | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-command-description-size`      | `$command-description-size`      | `0.875em`                                                                                                                     |
| `--bulma-command-hint-color`            | `$command-hint-color`            | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-command-group-label-size`      | `$command-group-label-size`      | `0.85em`                                                                                                                      |
| `--bulma-command-group-label-weight`    | `$command-group-label-weight`    | `var(--bulma-weight-semibold)`                                                                                                |
| `--bulma-command-group-label-color`     | `$command-group-label-color`     | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-command-divider-color`         | `$command-divider-color`         | `var(--bulma-border-weak)`                                                                                                    |
| `--bulma-command-empty-color`           | `$command-empty-color`           | `var(--bulma-text-weak)`                                                                                                      |
| `--bulma-command-empty-padding`         | `$command-empty-padding`         | `1.5rem`                                                                                                                      |
| `--bulma-command-dialog-width`          | `$command-dialog-width`          | `40rem`                                                                                                                       |
| `--bulma-command-dialog-offset`         | `$command-dialog-offset`         | `12vh`                                                                                                                        |
| `--bulma-command-dialog-shadow`         | `$command-dialog-shadow`         | `var(--bulma-shadow)`                                                                                                         |

<!-- /bestax:generated cssvars -->
