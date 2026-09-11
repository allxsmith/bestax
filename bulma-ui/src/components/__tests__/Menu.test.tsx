import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Menu, MenuLabel, MenuList, MenuItem } from '../Menu';
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
          {/* @ts-expect-error a span takes no href; a JS consumer can still
              deliver one, and it must not reach the DOM */}
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
