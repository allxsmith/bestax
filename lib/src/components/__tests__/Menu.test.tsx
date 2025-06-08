import React from 'react';
import { render, screen } from '@testing-library/react';
import { Menu, MenuLabel, MenuList, MenuItem } from '../Menu';

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
