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
  Radio: { children: 'Choose' },
  Switch: { children: 'Enable' },
  Loading: { active: true, canCancel: true, children: 'Loading…' },
  Toast: {
    message: 'Saved',
    inline: true,
    indefinite: true,
    closable: true,
    actionText: 'Undo',
  },
  Taginput: { value: ['tag-one'] },
  Modal: { active: true, children: 'Modal content' },
  Dialog: { isOpen: true, message: 'Are you sure?' },
  Tabs: {
    children: [
      <Library.Tabs.Tab key="a" label="A">
        A
      </Library.Tabs.Tab>,
      <Library.Tabs.Tab key="b" label="B">
        B
      </Library.Tabs.Tab>,
    ],
  },
  Dropdown: { label: 'Menu', children: 'Item', active: true },
  Sidebar: { isOpen: true, children: 'Sidebar content' },
  Pagination: { current: 1, total: 5 },
  Breadcrumb: { items: [{ label: 'Home', href: '#' }] },
  Message: { children: 'Hello' },
  Notification: { children: 'Hello' },
  Slider: {
    marks: [{ value: 50, label: '50' }],
    tooltip: 'always',
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
