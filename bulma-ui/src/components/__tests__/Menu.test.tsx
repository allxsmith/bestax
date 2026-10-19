import React, { createRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu, MenuLabel, MenuList, MenuItem, MenuSection } from '../Menu';
import { ConfigProvider } from '../../helpers/Config';

// A simple link-like mock component for custom "as" prop testing
type CustomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children: React.ReactNode;
};

const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
  ({ to, children, ...rest }, ref) => (
    <a href={to} ref={ref} data-testid="custom-link" {...rest}>
      {children}
    </a>
  )
);

CustomLink.displayName = 'CustomLink';

describe('Menu', () => {
  it('renders the menu container with the Bulma menu class', () => {
    render(
      <Menu data-testid="menu-root">
        <MenuLabel>Label</MenuLabel>
      </Menu>
    );
    expect(screen.getByTestId('menu-root')).toHaveClass('menu');
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Menu data-testid="menu-root">
          <MenuLabel>Label</MenuLabel>
        </Menu>
      </ConfigProvider>
    );
    const menu = screen.getByTestId('menu-root');
    expect(menu).toHaveClass('bulma-menu');
    expect(menu).not.toHaveClass('menu');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Menu data-testid="menu">
            <MenuLabel>Label</MenuLabel>
          </Menu>
        </ConfigProvider>
      );
      const menu = screen.getByTestId('menu');
      expect(menu).toHaveClass('bulma-menu');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <Menu data-testid="menu">
          <MenuLabel>Label</MenuLabel>
        </Menu>
      );
      const menu = screen.getByTestId('menu');
      expect(menu).toHaveClass('menu');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Menu data-testid="menu">
            <MenuLabel>Label</MenuLabel>
          </Menu>
        </ConfigProvider>
      );
      const menu = screen.getByTestId('menu');
      expect(menu).toHaveClass('menu');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Menu color="primary" m="2" data-testid="menu">
            <MenuLabel>Label</MenuLabel>
          </Menu>
        </ConfigProvider>
      );
      const menu = screen.getByTestId('menu');
      expect(menu).toHaveClass('bulma-menu');
      expect(menu).toHaveClass('bulma-has-text-primary');
      expect(menu).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Menu color="danger" data-testid="menu">
          <MenuLabel>Label</MenuLabel>
        </Menu>
      );
      const menu = screen.getByTestId('menu');
      expect(menu).toHaveClass('menu');
      expect(menu).toHaveClass('has-text-danger');
    });
  });

  it('renders menu-label correctly', () => {
    render(
      <Menu>
        <MenuLabel data-testid="label">Section Label</MenuLabel>
      </Menu>
    );
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('menu-label');
    expect(label).toHaveTextContent('Section Label');
  });

  it('applies menu-list class only to top-level MenuList', () => {
    render(
      <Menu>
        <MenuList data-testid="top-list">
          <MenuItem>
            Parent
            <MenuList data-testid="nested-list">
              <MenuItem>Child</MenuItem>
            </MenuList>
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(screen.getByTestId('top-list')).toHaveClass('menu-list');
    expect(screen.getByTestId('nested-list')).not.toHaveClass('menu-list');
  });

  it('does not render an empty class attribute on a nested MenuList', () => {
    render(
      <Menu>
        <MenuList data-testid="top-list">
          <MenuItem>
            Parent
            <MenuList data-testid="nested-list">
              <MenuItem>Child</MenuItem>
            </MenuList>
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(screen.getByTestId('nested-list')).not.toHaveAttribute('class');
  });

  it('renders MenuItem as <a> by default', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem data-testid="item-li">Dashboard</MenuItem>
        </MenuList>
      </Menu>
    );
    // Only the <li> has data-testid="item-li"
    const li = screen.getByTestId('item-li');
    const a = li.querySelector('a');
    expect(a).toBeInTheDocument();
    expect(a).toHaveTextContent('Dashboard');
  });

  it('renders MenuItem as custom component when as prop is used', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem as={CustomLink} to="/custom-link" data-testid="item-li">
            Custom
          </MenuItem>
        </MenuList>
      </Menu>
    );
    const li = screen.getByTestId('item-li');
    const custom = li.querySelector('a[data-testid="custom-link"]');
    expect(custom).toBeInTheDocument();
    expect(custom).toHaveAttribute('href', '/custom-link');
    expect(custom).toHaveTextContent('Custom');
  });

  it('passes href to <a> when as is "a" and href is given', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem as="a" href="/foo" data-testid="item-li">
            Foo
          </MenuItem>
        </MenuList>
      </Menu>
    );
    const li = screen.getByTestId('item-li');
    const a = li.querySelector('a');
    expect(a).toHaveAttribute('href', '/foo');
  });

  it('does not render an empty class attribute on the link when inactive', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem href="#" data-testid="item-li">
            Dashboard
          </MenuItem>
        </MenuList>
      </Menu>
    );
    const li = screen.getByTestId('item-li');
    const a = li.querySelector('a');
    expect(a).not.toHaveAttribute('class');
  });

  it('applies is-active class to MenuItem when active prop is true', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem active data-testid="item-li">
            Active Item
          </MenuItem>
        </MenuList>
      </Menu>
    );
    const li = screen.getByTestId('item-li');
    const a = li.querySelector('a');
    expect(a).toHaveClass('is-active');
  });

  it('renders nested MenuList under MenuItem', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem data-testid="parent">
            Parent
            <MenuList data-testid="submenu">
              <MenuItem>Child 1</MenuItem>
              <MenuItem>Child 2</MenuItem>
            </MenuList>
          </MenuItem>
        </MenuList>
      </Menu>
    );
    const submenu = screen.getByTestId('submenu');
    expect(submenu).toBeInTheDocument();
    expect(submenu.querySelectorAll('li').length).toBe(2);
  });

  it('renders correct text and structure in a multi-level menu', () => {
    render(
      <Menu>
        <MenuLabel>General</MenuLabel>
        <MenuList>
          <MenuItem>Dashboard</MenuItem>
          <MenuItem>
            Customers
            <MenuList>
              <MenuItem>Sub A</MenuItem>
              <MenuItem>Sub B</MenuItem>
            </MenuList>
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Sub A')).toBeInTheDocument();
    expect(screen.getByText('Sub B')).toBeInTheDocument();
  });
});

describe('list role', () => {
  // WebKit stops exposing a <ul> as a list once its markers are hidden, as
  // Bulma's reset hides them, unless the role is written out.
  const nestedMenu = (
    listProps: Partial<React.ComponentProps<typeof MenuList>>
  ) =>
    render(
      <Menu>
        <MenuList data-testid="top-list" {...listProps}>
          <MenuItem href="#customers">
            Customers
            <MenuList data-testid="nested-list" {...listProps}>
              <MenuItem href="#sub-a">Sub A</MenuItem>
              <MenuItem href="#sub-b">Sub B</MenuItem>
            </MenuList>
          </MenuItem>
          <MenuItem href="#dashboard">Dashboard</MenuItem>
        </MenuList>
      </Menu>
    );

  it('gives every list role="list", nested lists included', () => {
    nestedMenu({});
    const top = screen.getByTestId('top-list');
    const nested = screen.getByTestId('nested-list');
    expect(top).toHaveAttribute('role', 'list');
    expect(nested).toHaveAttribute('role', 'list');
    expect(screen.getAllByRole('list')).toEqual([top, nested]);
    expect(within(nested).getAllByRole('listitem')).toHaveLength(2);
  });

  it.each([
    ['another role', { role: 'menu' }],
    ['a spread carrying an absent role', { role: undefined }],
  ])('keeps role="list" when the caller passes %s', (_label, listProps) => {
    nestedMenu(listProps);
    expect(screen.getByTestId('top-list')).toHaveAttribute('role', 'list');
    expect(screen.getByTestId('nested-list')).toHaveAttribute('role', 'list');
  });
});

describe('Compound components', () => {
  it('Menu.Label is the MenuLabel component', () => {
    expect(Menu.Label).toBe(MenuLabel);
  });

  it('Menu.List is the MenuList component', () => {
    expect(Menu.List).toBe(MenuList);
  });

  it('Menu.Item is the MenuItem component', () => {
    expect(Menu.Item).toBe(MenuItem);
  });

  it('Menu.Section is the MenuSection component', () => {
    expect(Menu.Section).toBe(MenuSection);
  });

  it('renders a menu through the dot path', () => {
    const { container } = render(
      <Menu>
        <Menu.Label>General</Menu.Label>
        <Menu.List>
          <Menu.Item>Dashboard</Menu.Item>
          <Menu.Item>Customers</Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(container.querySelector('.menu')).toBeInTheDocument();
    expect(container.querySelector('.menu-label')).toBeInTheDocument();
    expect(container.querySelector('.menu-list')).toBeInTheDocument();
    expect(container.querySelectorAll('.menu-list li')).toHaveLength(2);
  });
});

describe('href routing', () => {
  it('withholds href from a non-anchor intrinsic tag', () => {
    render(
      <Menu>
        <MenuList>
          {/* A JS consumer can still deliver an href, and it must not reach
              the DOM. Keep the directive on its own single-line comment: TS
              anchors it to the line a comment STARTS on, so a multi-line one
              never lands on the line below it. */}
          {/* @ts-expect-error a span takes no href */}
          <MenuItem as="span" href="/x" data-testid="li">
            Static
          </MenuItem>
        </MenuList>
      </Menu>
    );
    const span = screen.getByTestId('li').querySelector('span');
    expect(span).not.toHaveAttribute('href');
  });

  it('forwards href to a custom element, which declares its own props', () => {
    render(
      <Menu>
        <MenuList>
          <MenuItem
            as={'x-link' as never}
            {...({ href: '/x' } as Record<string, unknown>)}
            data-testid="li"
          >
            i
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(screen.getByTestId('li').querySelector('x-link')).toHaveAttribute(
      'href',
      '/x'
    );
  });

  it('forwards href to a custom component, which owns its prop contract', () => {
    const Custom = ({
      href,
      children,
    }: {
      href?: string;
      children?: React.ReactNode;
    }) => (
      <a data-testid="custom" href={href}>
        {children}
      </a>
    );
    render(
      <Menu>
        <MenuList>
          <MenuItem as={Custom} href="/x">
            Go
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(screen.getByTestId('custom')).toHaveAttribute('href', '/x');
  });
});

describe('Ref forwarding', () => {
  // Menu.Item gained ref forwarding with #641. The ref goes to the INNER
  // element `as` renders, not the wrapping <li>: `as` names the inner one.
  it('forwards ref to the inner <a>, not the wrapping <li>', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Menu>
        <MenuList>
          <MenuItem href="/foo" ref={ref} data-testid="item-li">
            Foo
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ref.current).toBe(screen.getByTestId('item-li').querySelector('a'));
  });

  it('forwards ref to whatever as renders', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Menu>
        <MenuList>
          <MenuItem as="span" ref={ref}>
            Static
          </MenuItem>
        </MenuList>
      </Menu>
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe('anchor-only attributes on a non-link tag', () => {
  it('withholds href and forwards the rest, which is the documented gap', () => {
    // Pinned in BOTH directions on purpose. `Menu.Item`'s `as` is open, so a flat
    // strip would delete attributes that are legal on the element a caller named
    // — `referrerPolicy` on `as="img"`, `media` on `as="source"`. Closing the gap
    // needs a per-attribute-per-element rule, and until then this records what
    // actually happens so a widening cannot land quietly (#682).
    render(
      <Menu>
        <Menu.List>
          {/* @ts-expect-error a span takes none of these */}
          <Menu.Item
            as="span"
            href="/x"
            target="_blank"
            download="f"
            hrefLang="en"
            ping="/p"
            referrerPolicy="no-referrer"
            media="print"
            type="text/html"
            data-testid="item"
          >
            Static
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    const span = screen.getByTestId('item').querySelector('span');
    expect(span).not.toHaveAttribute('href');
    for (const attr of [
      'target',
      'download',
      'hreflang',
      'ping',
      'referrerpolicy',
      'media',
      'type',
    ]) {
      expect(span).toHaveAttribute(attr);
    }
  });
});

describe('button form', () => {
  it('does not submit the form it sits in', () => {
    // `<button>` defaults to type="submit", so a menu item in a sidebar that
    // sits inside a form would post it on click (#691).
    render(
      <Menu>
        <Menu.List>
          <Menu.Item as="button" data-testid="item">
            Filter
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(screen.getByTestId('item').querySelector('button')).toHaveAttribute(
      'type',
      'button'
    );
  });

  it('survives a spread carrying an absent type', () => {
    // React reads `type={undefined}` as "remove the attribute", and a props
    // spread whose `type` is undefined is how that arrives. A default spread
    // before it would be erased.
    const spread: { type?: 'button' | 'submit' | 'reset' } = {
      type: undefined,
    };
    render(
      <Menu>
        <Menu.List>
          <Menu.Item as="button" data-testid="item" {...spread}>
            Filter
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(screen.getByTestId('item').querySelector('button')).toHaveAttribute(
      'type',
      'button'
    );
  });

  it('lets an explicit type win', () => {
    render(
      <Menu>
        <Menu.List>
          <Menu.Item as="button" type="submit" data-testid="item">
            Save
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(screen.getByTestId('item').querySelector('button')).toHaveAttribute(
      'type',
      'submit'
    );
  });

  it('replaces a type HTML would read as submit with type="button"', () => {
    // The types reject this, but a loose spread or an untyped caller can still
    // deliver it, and HTML treats an invalid button type as submit.
    const loose: object = { type: 'text/html' };
    render(
      <Menu>
        <Menu.List>
          <Menu.Item as="button" data-testid="item" {...loose}>
            Filter
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(screen.getByTestId('item').querySelector('button')).toHaveAttribute(
      'type',
      'button'
    );
  });

  it('sets no type on an item that is not a button', () => {
    render(
      <Menu>
        <Menu.List>
          <Menu.Item href="/x" data-testid="link">
            Link
          </Menu.Item>
          <Menu.Item as="div" data-testid="div">
            Static
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    const link = screen.getByTestId('link').querySelector('a');
    const div = screen.getByTestId('div').querySelector('div');
    expect(link).toBeInTheDocument();
    expect(div).toBeInTheDocument();
    expect(link).not.toHaveAttribute('type');
    expect(div).not.toHaveAttribute('type');
  });
});

describe('current page', () => {
  // `active` is how a sidebar marks the page you're on, and a class alone
  // tells assistive tech nothing (#1093). The attribute goes on the element
  // `as` renders, the one a screen reader announces, not the wrapping <li>.
  const inner = (testId: string) =>
    screen.getByTestId(testId).firstElementChild as HTMLElement;

  it('marks an active item as the current page', () => {
    render(
      <Menu>
        <Menu.List>
          <Menu.Item href="#a" data-testid="plain">
            Dashboard
          </Menu.Item>
          <Menu.Item href="#b" active data-testid="current">
            Customers
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(inner('current')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('current')).not.toHaveAttribute('aria-current');
    expect(inner('plain')).not.toHaveAttribute('aria-current');
  });

  it('marks a button item and a custom component the same way', () => {
    render(
      <Menu>
        <Menu.List>
          <Menu.Item as="button" active data-testid="button">
            Filter
          </Menu.Item>
          <Menu.Item as={CustomLink} to="/x" active>
            Custom
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(inner('button')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('custom-link')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('lets a caller’s own aria-current win', () => {
    render(
      <Menu>
        <Menu.List>
          <Menu.Item
            href="#intro"
            active
            aria-current="location"
            data-testid="location"
          >
            Introduction
          </Menu.Item>
          <Menu.Item href="#b" active aria-current={false} data-testid="off">
            Customers
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(inner('location')).toHaveAttribute('aria-current', 'location');
    // "false" is how ARIA says not current, which is what turning it off means.
    expect(inner('off')).toHaveAttribute('aria-current', 'false');
  });

  it('lets a caller’s aria-current decide even when it’s undefined', () => {
    // Unlike the button type, nothing goes wrong when the attribute is left
    // off, so the caller's value decides outright. bestax-migrate converts
    // `is-active` to `active` only beside an `aria-current` of the element's
    // own, and a value that is undefined at run time has to render nothing
    // there, as it did on the <a>.
    const spread: { 'aria-current'?: 'page' } = {
      'aria-current': undefined,
    };
    render(
      <Menu>
        <Menu.List>
          <Menu.Item href="#b" active data-testid="current" {...spread}>
            Customers
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(inner('current')).not.toHaveAttribute('aria-current');
  });

  it('passes a caller’s aria-current through on an item that isn’t active', () => {
    render(
      <Menu>
        <Menu.List>
          <Menu.Item href="#intro" aria-current="location" data-testid="item">
            Introduction
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(inner('item')).toHaveAttribute('aria-current', 'location');
  });

  it('marks one page when the section and a filter are active too, as the TSDoc shows', () => {
    // `active` can't tell an ancestor or a button from a page, so `active`
    // on the section and its page would claim two current pages. The
    // documented overrides leave one.
    const { container } = render(
      <Menu>
        <Menu.List>
          <Menu.Item
            href="#team"
            active
            aria-current="location"
            data-testid="section"
          >
            Manage Your Team
            <Menu.List>
              <Menu.Item href="#members" active data-testid="page">
                Members
              </Menu.Item>
            </Menu.List>
          </Menu.Item>
          <Menu.Item
            as="button"
            active
            aria-current={false}
            data-testid="filter"
          >
            Filter
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(inner('page')).toHaveAttribute('aria-current', 'page');
    expect(inner('section')).toHaveAttribute('aria-current', 'location');
    expect(inner('filter')).toHaveAttribute('aria-current', 'false');
  });
});

describe('Menu.Section', () => {
  // A section is APG's disclosure navigation (#1172): a button with
  // aria-expanded and aria-controls, and under it a list of ordinary links.
  const sidebar = (
    sectionProps: Partial<React.ComponentProps<typeof MenuSection>> = {}
  ) =>
    render(
      <Menu>
        <Menu.Section
          label="Components"
          data-testid="section"
          {...sectionProps}
        >
          <Menu.List>
            <Menu.Item href="/button" active>
              Button
            </Menu.Item>
            <Menu.Item href="/card">Card</Menu.Item>
          </Menu.List>
        </Menu.Section>
        <Menu.Section label="Form">
          <Menu.List>
            <Menu.Item href="/input">Input</Menu.Item>
          </Menu.List>
        </Menu.Section>
      </Menu>
    );

  const heading = (name = 'Components') => screen.getByRole('button', { name });
  const regionOf = (button: HTMLElement) =>
    document.getElementById(button.getAttribute('aria-controls')!)!;

  it('renders its heading as a button, drawn by its own classes, with the label inside', () => {
    sidebar();
    const button = heading();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('menu-section-toggle');
    expect(button).not.toHaveClass('menu-label');
    const [label, chevron] = Array.from(button.children);
    expect(label).toHaveClass('menu-section-label');
    expect(label).toHaveTextContent('Components');
    expect(chevron).toHaveClass('menu-section-chevron');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron).toBeEmptyDOMElement();
    expect(screen.getByTestId('section')).toHaveClass('menu-section');
  });

  it('takes a node as its label, and names the button with it', () => {
    render(
      <Menu>
        <Menu.Section
          label={
            <>
              <span aria-hidden="true">#</span> Guides
            </>
          }
        >
          <Menu.List>
            <Menu.Item href="/intro">Intro</Menu.Item>
          </Menu.List>
        </Menu.Section>
      </Menu>
    );
    expect(heading('Guides')).toBeInTheDocument();
  });

  it('points the button at the list it opens and closes', () => {
    sidebar({ defaultOpen: true });
    const button = heading();
    const region = regionOf(button);
    expect(region).toBeInTheDocument();
    expect(region.previousElementSibling).toBe(button);
    expect(within(region).getByRole('list')).toHaveClass('menu-list');
    expect(button.parentElement).toBe(screen.getByTestId('section'));
  });

  it('gives each section its own list id', () => {
    sidebar();
    const first = heading().getAttribute('aria-controls');
    const second = heading('Form').getAttribute('aria-controls');
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(first).not.toBe(second);
  });

  it('starts closed, with its list hidden from everyone', () => {
    sidebar();
    const button = heading();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(regionOf(button)).toHaveAttribute('hidden');
    // Not drawn, and not in the accessibility tree.
    expect(screen.getByText('Button')).not.toBeVisible();
    expect(screen.queryByRole('link', { name: 'Button' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Card' })).toBeNull();
    // Still in the DOM, so aria-controls names an element that exists.
    expect(regionOf(button)).toContainElement(screen.getByText('Button'));
  });

  it('starts open with defaultOpen', () => {
    sidebar({ defaultOpen: true });
    const button = heading();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(regionOf(button)).not.toHaveAttribute('hidden');
    expect(screen.getByRole('link', { name: 'Button' })).toBeVisible();
  });

  it('opens and closes on a click', async () => {
    const user = userEvent.setup();
    sidebar();
    const button = heading();
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(regionOf(button)).not.toHaveAttribute('hidden');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(regionOf(button)).toHaveAttribute('hidden');
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('opens and closes with %s, as a button does', async (_key, keys) => {
    const user = userEvent.setup();
    sidebar();
    const button = heading();
    button.focus();
    await user.keyboard(keys);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(keys);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('reports each toggle through onOpenChange while holding its own state', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    sidebar({ onOpenChange });
    await user.click(heading());
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
    await user.click(heading());
    expect(heading()).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('only reports while open is set, until the caller passes the new state', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const ui = (open: boolean) => (
      <Menu>
        <Menu.Section
          label="Components"
          open={open}
          onOpenChange={onOpenChange}
        >
          <Menu.List>
            <Menu.Item href="/button">Button</Menu.Item>
          </Menu.List>
        </Menu.Section>
      </Menu>
    );
    const { rerender } = render(ui(false));
    await user.click(heading());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(heading()).toHaveAttribute('aria-expanded', 'false');
    expect(regionOf(heading())).toHaveAttribute('hidden');

    rerender(ui(true));
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
    expect(regionOf(heading())).not.toHaveAttribute('hidden');
    await user.click(heading());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
  });

  it('follows open over defaultOpen', () => {
    sidebar({ open: false, defaultOpen: true });
    expect(heading()).toHaveAttribute('aria-expanded', 'false');
  });

  it('lets open and onOpenChange drive it together', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [open, setOpen] = useState(false);
      return (
        <Menu>
          <Menu.Section label="Components" open={open} onOpenChange={setOpen}>
            <Menu.List>
              <Menu.Item href="/button">Button</Menu.Item>
            </Menu.List>
          </Menu.Section>
        </Menu>
      );
    };
    render(<Controlled />);
    await user.click(heading());
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Button' })).toBeVisible();
  });

  it('leaves a closed section’s links out of the tab order, and makes each open one a tab stop', async () => {
    const user = userEvent.setup();
    sidebar();
    await user.tab();
    expect(heading()).toHaveFocus();
    // Closed: Tab goes from one heading straight to the next.
    await user.tab();
    expect(heading('Form')).toHaveFocus();

    await user.click(heading());
    expect(heading()).toHaveFocus();
    // Open: every link is a tab stop of its own, in order, with no roving
    // focus to skip past.
    await user.tab();
    expect(screen.getByRole('link', { name: 'Button' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Card' })).toHaveFocus();
    await user.tab();
    expect(heading('Form')).toHaveFocus();
  });

  it('leaves the arrow keys alone', async () => {
    const user = userEvent.setup();
    sidebar({ defaultOpen: true });
    heading().focus();
    await user.keyboard('{ArrowDown}');
    expect(heading()).toHaveFocus();
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps its links’ href, active and aria-current', () => {
    sidebar({ defaultOpen: true });
    const current = screen.getByRole('link', { name: 'Button' });
    expect(current).toHaveAttribute('href', '/button');
    expect(current).toHaveClass('is-active');
    expect(current).toHaveAttribute('aria-current', 'page');
    const other = screen.getByRole('link', { name: 'Card' });
    expect(other).toHaveAttribute('href', '/card');
    expect(other).not.toHaveAttribute('aria-current');
  });

  it('does not submit a form it sits in', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Menu>
          <Menu.Section label="Components">
            <Menu.List>
              <Menu.Item href="/button">Button</Menu.Item>
            </Menu.List>
          </Menu.Section>
        </Menu>
      </form>
    );
    await user.click(heading());
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('puts className, helper props and other attributes on the wrapping div', () => {
    sidebar({ className: 'custom', mt: '4', id: 'components', title: 'Docs' });
    const section = screen.getByTestId('section');
    expect(section.tagName).toBe('DIV');
    expect(section).toHaveClass('menu-section', 'custom', 'mt-4');
    expect(section).toHaveAttribute('id', 'components');
    expect(section).toHaveAttribute('title', 'Docs');
    expect(heading()).not.toHaveClass('custom');
  });

  it('applies the class prefix from ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Menu>
          <Menu.Section label="Components" data-testid="section" mt="2">
            <Menu.List>
              <Menu.Item href="/button">Button</Menu.Item>
            </Menu.List>
          </Menu.Section>
        </Menu>
      </ConfigProvider>
    );
    const section = screen.getByTestId('section');
    expect(section).toHaveClass('bestax-menu-section', 'bestax-mt-2');
    const button = heading();
    expect(button).toHaveClass('bestax-menu-section-toggle');
    expect(button.children[0]).toHaveClass('bestax-menu-section-label');
    expect(button.children[1]).toHaveClass('bestax-menu-section-chevron');
    expect(section.querySelector('ul')).toHaveClass('bestax-menu-list');
  });

  it('renders on the server with a closed list already hidden, and each list wired to its button', () => {
    const html = renderToStaticMarkup(
      <Menu>
        <Menu.Section label="Components">
          <Menu.List>
            <Menu.Item href="/button">Button</Menu.Item>
          </Menu.List>
        </Menu.Section>
        <Menu.Section label="Form" defaultOpen>
          <Menu.List>
            <Menu.Item href="/input">Input</Menu.Item>
          </Menu.List>
        </Menu.Section>
      </Menu>
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const [closed, open] = Array.from(doc.querySelectorAll('button'));
    const regionFor = (button: Element) =>
      doc.getElementById(button.getAttribute('aria-controls')!)!;
    expect(closed.getAttribute('aria-expanded')).toBe('false');
    expect(regionFor(closed).hasAttribute('hidden')).toBe(true);
    expect(regionFor(closed).textContent).toBe('Button');
    expect(open.getAttribute('aria-expanded')).toBe('true');
    expect(regionFor(open).hasAttribute('hidden')).toBe(false);
    expect(regionFor(open).textContent).toBe('Input');
  });
});
