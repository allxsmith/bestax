/**
 * Central classPrefix sweep: renders every public component export under
 * `<ConfigProvider classPrefix="bestax-">` and asserts no emitted class escapes
 * unprefixed. Each component also carries its own hand-written prefix test, but
 * that pattern relies on remembering to write it — this sweep is a backstop that
 * catches a forgotten `usePrefixedClassNames` call anywhere, current or future,
 * without relying on a per-component test author to think of it.
 *
 * PROPS supplies the minimal props/children a component needs either to satisfy
 * a required prop or to reach a code path that renders its own literal class
 * (e.g. a conditional child). Components not listed render with no props at all —
 * still a valid (if shallow) check of whatever they emit by default.
 */
import React from 'react';
import { render } from '@testing-library/react';
import * as Library from '../index';
import { ConfigProvider } from '../helpers/Config';

const PREFIX = 'bestax-';

// Vendor icon-library classes are deliberately never routed through the
// runtime class prefix: they come from an external CSS framework (Font
// Awesome, Material Design Icons, Google Material Icons/Symbols) selected via
// the `library`/`iconLibrary` prop, not from Bulma, and have no
// bestax-prefixed equivalent to switch to.
const ICON_LIBRARY_CLASS =
  /^(fas|far|fab|fal|fad|fat|fa-[a-z0-9-]+|mdi|mdi-[a-z0-9-]+|material-icons(-(outlined|round|sharp))?|material-symbols-(outlined|rounded|sharp))$/;

type AnyComponent = React.ComponentType<Record<string, unknown>>;

function isComponentExport(value: unknown): value is AnyComponent {
  if (typeof value === 'function') return true;
  return (
    typeof value === 'object' &&
    value !== null &&
    '$$typeof' in (value as Record<string, unknown>)
  );
}

const PROPS: Record<string, Record<string, unknown>> = {
  Icon: { name: 'star' },
  IconText: { children: 'Text', iconProps: { name: 'star' } },
  Avatar: { name: 'Ada Lovelace' },
  Badge: { children: '9' },
  Steps: { items: [{ label: 'Step 1' }], hasNavigation: true },
  Carousel: {
    children: [
      <Library.CarouselItem key="a">Slide A</Library.CarouselItem>,
      <Library.CarouselItem key="b">Slide B</Library.CarouselItem>,
    ],
  },
  Rate: { value: 2.5, showScore: true, text: 'Good' },
  Checkbox: { children: 'Accept' },
  // Colored, with the indicator, a title, a description and more, so every
  // class a card takes is swept.
  CheckboxCard: {
    color: 'success',
    title: 'Backups',
    description: 'Kept for 30 days',
    children: '$5',
  },
  Radio: { children: 'Choose' },
  RadioCard: {
    color: 'info',
    title: 'Express',
    description: 'Tomorrow',
    children: '$12',
  },
  Switch: { children: 'Enable' },
  Loading: { active: true, canCancel: true, children: 'Loading…' },
  // Its helper classes, and the element it puts portaled content in.
  LocaleProvider: {
    locale: 'ar',
    p: '2',
    children: (
      <Library.Portal>
        <Library.Tag>Portaled</Library.Tag>
      </Library.Portal>
    ),
  },
  Toast: {
    message: 'Saved',
    inline: true,
    indefinite: true,
    closable: true,
    actionText: 'Undo',
  },
  Taginput: { value: ['tag-one'] },
  // Vertical, with a collapsed pane, so every class it emits is swept.
  Splitter: {
    orientation: 'vertical',
    children: [
      <Library.Splitter.Pane key="a" label="A" collapsible defaultCollapsed>
        A
      </Library.Splitter.Pane>,
      <Library.Splitter.Pane key="b" label="B">
        B
      </Library.Splitter.Pane>,
    ],
  },
  // Every orientation class and dividers, with an item from its props and
  // one from its parts, so each class the family emits is swept.
  DescriptionList: {
    orientation: 'vertical',
    orientationMobile: 'vertical',
    orientationTablet: 'horizontal',
    orientationDesktop: 'vertical',
    orientationWidescreen: 'horizontal',
    orientationFullhd: 'vertical',
    hasDividers: true,
    children: [
      <Library.DescriptionList.Item key="a" label="Order" value="#1234" />,
      <Library.DescriptionList.Item key="b">
        <Library.DescriptionList.Label>Tags</Library.DescriptionList.Label>
        <Library.DescriptionList.Value>Gift</Library.DescriptionList.Value>
      </Library.DescriptionList.Item>,
    ],
  },
  DescriptionListItem: { label: 'Order', value: '#1234' },
  // Sized, colored and rounded, in sections, so every class it emits is swept.
  RingProgress: {
    label: 'Storage',
    size: 'small',
    color: 'info',
    isRounded: true,
    sections: [{ value: 40, color: 'warning', label: 'Photos' }],
    children: '40%',
  },
  // Filled, with a legend and a colored message, so the legend's and the
  // help's classes are swept with the variant's.
  Fieldset: {
    legend: 'Shipping',
    variant: 'filled',
    message: 'We only ship within the EU.',
    messageColor: 'info',
    children: 'Fields',
  },
  // Every modifier, so each class the frame takes is swept.
  ScrollArea: {
    'aria-label': 'Notes',
    orientation: 'vertical',
    showScrollbars: 'hover',
    hasStableGutter: true,
    hasFade: true,
    children: 'Notes',
  },
  // Labeled, with a message, colored, sized, rounded and disabled, so the
  // Field, the Control and every class a box takes are swept.
  PinInput: {
    label: 'Code',
    message: 'Six digits',
    defaultValue: '12',
    color: 'primary',
    size: 'small',
    isRounded: true,
    disabled: true,
  },
  // Open, sized, with a checked, a highlighted and a disabled option in a
  // group and an empty message beside the list, so each class the Combobox
  // family adds is swept.
  Combobox: {
    label: 'Produce',
    size: 'small',
    defaultOpen: true,
    keepFirst: true,
    children: [
      <Library.Combobox.Input key="i" iconLeftName="search" />,
      <Library.Combobox.Menu key="d">
        <Library.Combobox.List>
          <Library.Combobox.Group label="Fruit">
            <Library.Combobox.Item value="apple" checked>
              Apple
            </Library.Combobox.Item>
            <Library.Combobox.Item value="pear" disabled>
              Pear
            </Library.Combobox.Item>
          </Library.Combobox.Group>
        </Library.Combobox.List>
        <Library.Combobox.Empty>Nothing else</Library.Combobox.Empty>
      </Library.Combobox.Menu>,
    ],
  },
  ComboboxItem: { value: 'apple', checked: true, children: 'Apple' },
  ComboboxGroup: { label: 'Fruit' },
  // A highlighted item with an icon, a description and a hint, a disabled
  // one in a group, and an empty message beside the list, so each class the
  // Command family adds is swept.
  Command: {
    label: 'Commands',
    children: [
      <Library.Command.Input key="i" />,
      <Library.Command.List key="l">
        <Library.Command.Group label="Files">
          <Library.Command.Item
            value="open"
            icon={<svg />}
            description="Open a file"
            hint="O"
          >
            Open
          </Library.Command.Item>
          <Library.Command.Item value="close" disabled>
            Close
          </Library.Command.Item>
        </Library.Command.Group>
      </Library.Command.List>,
      <Library.Command.Empty key="e">Nothing else</Library.Command.Empty>,
    ],
  },
  CommandDialog: {
    defaultOpen: true,
    actions: [{ id: 'open', label: 'Open', group: 'Files' }],
  },
  CommandItem: {
    value: 'open',
    icon: <svg />,
    description: 'Open a file',
    hint: 'O',
    children: 'Open',
  },
  CommandGroup: { label: 'Files' },
  // Sorted, selectable, searched and paged, with a toolbar and a scroll
  // area, so each class DataTable adds, and the parts it renders, are swept.
  DataTable: {
    caption: 'People',
    columns: [
      { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
      { id: 'role', header: 'Role', align: 'right' },
    ],
    data: [
      { id: '1', name: 'Ada', role: 'Admin' },
      { id: '2', name: 'Alan', role: 'Editor' },
      { id: '3', name: 'Grace', role: 'Viewer' },
    ],
    selectionMode: 'multiple',
    defaultSelected: ['1'],
    defaultSort: [{ id: 'name', direction: 'ascending' }],
    pageSize: 2,
    hasSearch: true,
    isResponsive: true,
    toolbar: () => <Library.Button>Export</Library.Button>,
  },
  TagInput: { value: ['tag-one'] },
  Modal: { active: true, children: 'Modal content' },
  Dialog: { isOpen: true, message: 'Are you sure?' },
  Tabs: {
    children: [
      <Library.Tabs.Tab key="a" index={0}>
        A
      </Library.Tabs.Tab>,
      <Library.Tabs.Tab key="b" index={1}>
        B
      </Library.Tabs.Tab>,
    ],
  },
  Collapses: {
    seamless: true,
    defaultValue: 0,
    children: [
      <Library.Collapse key="a" bordered trigger="A">
        A
      </Library.Collapse>,
      <Library.Collapse key="b" bordered trigger="B">
        B
      </Library.Collapse>,
    ],
  },
  Dropdown: { label: 'Menu', children: 'Item', active: true },
  Popover: {
    trigger: <button>Open</button>,
    defaultOpen: true,
    position: 'top-right',
    children: [
      <Library.Popover.Header key="h">Title</Library.Popover.Header>,
      <Library.Popover.Body key="b">Body</Library.Popover.Body>,
      <Library.Popover.Footer key="f">
        <Library.Popover.Close>Done</Library.Popover.Close>
      </Library.Popover.Footer>,
    ],
  },
  HoverCard: {
    trigger: <a href="#ada">Ada Lovelace</a>,
    defaultOpen: true,
    position: 'top-right',
    children: 'Analytical Engine team',
  },
  // Its menu needs a gesture, so the sweep sees the trigger and its class.
  // ContextMenu.test.tsx opens the menu under a prefix.
  ContextMenu: {
    trigger: <div>report.pdf</div>,
    children: <Library.ContextMenu.Item>Rename</Library.ContextMenu.Item>,
  },
  Sidebar: { isOpen: true, children: 'Sidebar content' },
  Pagination: { current: 1, total: 5 },
  Breadcrumb: { items: [{ label: 'Home', href: '#' }] },
  Message: { children: 'Hello' },
  Notification: { children: 'Hello' },
  // Every shorthand part, a size, a color and the left alignment, with the
  // actions row as a child, so each class the EmptyState family adds is swept.
  EmptyState: {
    icon: 'folder-open',
    title: 'No projects yet',
    description: 'Projects you create show up here.',
    size: 'small',
    color: 'info',
    variant: 'filled',
    align: 'left',
    children: (
      <Library.EmptyState.Actions>
        <Library.Button>New project</Library.Button>
      </Library.EmptyState.Actions>
    ),
  },
  EmptyStateActions: { children: <Library.Button>New project</Library.Button> },
  EmptyStateDescription: { children: 'Projects you create show up here.' },
  EmptyStateIndicator: { children: <Library.Icon name="folder-open" /> },
  EmptyStateTitle: { children: 'No projects yet' },
  // Progress, a pending item, a color, an icon marker and the alternate
  // layout, so each class the Timeline family adds is swept.
  Timeline: {
    active: 0,
    pending: 'Out for delivery',
    align: 'alternate',
    color: 'success',
    children: [
      <Library.Timeline.Item
        key="placed"
        title="Order placed"
        time="12 October"
        icon="box"
        color="info"
      />,
      <Library.Timeline.Item key="shipped" title="Shipped" />,
    ],
  },
  TimelineItem: { title: 'Shipped', time: '14 October', icon: 'truck' },
  // A symbol with a label, so its two spans are swept, and in a group with a
  // second key, so the separator is too.
  Kbd: { label: 'Command', children: '⌘' },
  KbdGroup: {
    children: [
      <Library.Kbd key="mod" label="Command">
        ⌘
      </Library.Kbd>,
      <Library.Kbd key="k">K</Library.Kbd>,
    ],
  },
  // Pressed, so the fill and `is-selected` it adds are swept too.
  ToggleButton: { defaultPressed: true, children: 'Mute' },
  // Checked and sized, so the fill, `is-selected` and `are-small` are swept.
  SegmentedControl: {
    'aria-label': 'View',
    defaultValue: 'list',
    size: 'small',
    children: [
      <Library.SegmentedControl.Segment key="list" value="list">
        List
      </Library.SegmentedControl.Segment>,
      <Library.SegmentedControl.Segment key="grid" value="grid">
        Grid
      </Library.SegmentedControl.Segment>,
    ],
  },
  Slider: {
    marks: [{ value: 50, label: '50' }],
    tooltip: 'always',
  },
  // A checkbox tree, sized and open, with an icon, a disabled item and a
  // checked one, so the box, the group and the modifiers are swept. An item
  // renders nothing outside a tree, so TreeViewItem's classes are swept here.
  TreeView: {
    'aria-label': 'Files',
    selectionMode: 'checkbox',
    size: 'small',
    defaultExpanded: ['src'],
    defaultChecked: ['src/index.ts'],
    children: (
      <Library.TreeView.Item value="src" label="src" icon="folder">
        <Library.TreeView.Item value="src/index.ts" label="index.ts" />
        <Library.TreeView.Item value="src/old.ts" label="old.ts" disabled />
      </Library.TreeView.Item>
    ),
  },
};

describe('classPrefix sweep', () => {
  const entries = Object.entries(Library as Record<string, unknown>)
    .filter(([name]) => /^[A-Z]/.test(name))
    .filter((entry): entry is [string, AnyComponent] =>
      isComponentExport(entry[1])
    )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  // Sanity check the enumeration itself isn't accidentally empty (e.g. a
  // broken barrel import), which would make every test below vacuously pass.
  it('found a substantial number of component exports to sweep', () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it.each(entries)('%s renders no unprefixed classes', (name, Component) => {
    const props = PROPS[name] ?? {};

    const { baseElement } = render(
      <ConfigProvider classPrefix={PREFIX}>
        <Component {...props} />
      </ConfigProvider>
    );

    const offenders: string[] = [];
    baseElement.querySelectorAll('[class]').forEach(el => {
      (el.getAttribute('class') ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .forEach(cls => {
          if (!cls.startsWith(PREFIX) && !ICON_LIBRARY_CLASS.test(cls)) {
            offenders.push(`<${el.tagName.toLowerCase()}> "${cls}"`);
          }
        });
    });

    expect(offenders).toEqual([]);
  });
});
