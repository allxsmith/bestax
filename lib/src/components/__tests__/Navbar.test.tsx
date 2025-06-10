import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('renders children content', () => {
    render(<Navbar>Test Navbar</Navbar>);
    expect(screen.getByText('Test Navbar')).toBeInTheDocument();
  });

  it('applies base navbar class', () => {
    render(<Navbar>Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('navbar');
  });

  it('applies custom className', () => {
    render(<Navbar className="custom-navbar">Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('custom-navbar');
  });

  it('applies Bulma color modifier class', () => {
    render(<Navbar color="primary">Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('is-primary');
  });

  it('applies textColor as helper class', () => {
    render(<Navbar textColor="success">Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('has-text-success');
  });

  it('applies bgColor as helper class', () => {
    render(<Navbar bgColor="light">Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('has-background-light');
  });

  it('applies is-transparent class', () => {
    render(<Navbar transparent>Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('is-transparent');
  });

  it('applies fixed modifier', () => {
    render(<Navbar fixed="top">Test</Navbar>);
    expect(screen.getByRole('navigation')).toHaveClass('is-fixed-top');
  });

  it('passes HTML attributes to nav', () => {
    render(
      <Navbar data-testid="navbar" aria-label="main-nav">
        Test
      </Navbar>
    );
    const nav = screen.getByTestId('navbar');
    expect(nav).toHaveAttribute('aria-label', 'main-nav');
  });

  it('does not pass Bulma-specific props to nav', () => {
    render(
      <Navbar
        textColor="primary"
        bgColor="light"
        color="primary"
        data-testid="navbar"
      >
        Test
      </Navbar>
    );
    const nav = screen.getByTestId('navbar');
    expect(nav).not.toHaveAttribute('textColor');
    expect(nav).not.toHaveAttribute('bgColor');
    expect(nav).not.toHaveAttribute('color');
  });
});

describe('Navbar.Brand', () => {
  it('renders brand content', () => {
    render(<Navbar.Brand data-testid="brand">Brand</Navbar.Brand>);
    expect(screen.getByTestId('brand')).toHaveTextContent('Brand');
  });

  it('applies brand class', () => {
    render(<Navbar.Brand data-testid="brand">Brand</Navbar.Brand>);
    expect(screen.getByTestId('brand')).toHaveClass('navbar-brand');
  });

  it('accepts custom className', () => {
    render(
      <Navbar.Brand className="custom-brand" data-testid="brand">
        Brand
      </Navbar.Brand>
    );
    expect(screen.getByTestId('brand')).toHaveClass('custom-brand');
  });
});

describe('Navbar.Item', () => {
  it('renders item content', () => {
    render(<Navbar.Item data-testid="item">Item</Navbar.Item>);
    expect(screen.getByTestId('item')).toHaveTextContent('Item');
  });

  it('applies item class', () => {
    render(<Navbar.Item data-testid="item">Item</Navbar.Item>);
    expect(screen.getByTestId('item')).toHaveClass('navbar-item');
  });

  it('applies is-active class when active', () => {
    render(
      <Navbar.Item active data-testid="item">
        Active Item
      </Navbar.Item>
    );
    expect(screen.getByTestId('item')).toHaveClass('is-active');
  });

  it('allows changing root element with "as"', () => {
    render(
      <Navbar.Item as="span" data-testid="item">
        Span Item
      </Navbar.Item>
    );
    const item = screen.getByTestId('item');
    expect(item.tagName).toBe('SPAN');
    expect(item).toHaveClass('navbar-item');
  });

  it('applies textColor and bgColor', () => {
    render(
      <Navbar.Item textColor="danger" bgColor="white" data-testid="item">
        Colored
      </Navbar.Item>
    );
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('has-text-danger');
    expect(item).toHaveClass('has-background-white');
  });

  it('accepts custom className', () => {
    render(
      <Navbar.Item className="custom-item" data-testid="item">
        Custom
      </Navbar.Item>
    );
    expect(screen.getByTestId('item')).toHaveClass('custom-item');
  });

  it('passes anchor HTML attributes', () => {
    render(
      <Navbar.Item href="/test" data-testid="navitem">
        Link
      </Navbar.Item>
    );
    const item = screen.getByTestId('navitem');
    expect(item).toHaveAttribute('href', '/test');
  });
});

describe('Navbar.Burger', () => {
  it('renders burger with three spans', () => {
    render(<Navbar.Burger data-testid="burger" />);
    const burger = screen.getByTestId('burger');
    expect(burger.querySelectorAll('span')).toHaveLength(3);
  });

  it('applies is-active when active', () => {
    render(<Navbar.Burger active data-testid="burger" />);
    expect(screen.getByTestId('burger')).toHaveClass('is-active');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Navbar.Burger onClick={handleClick} data-testid="burger" />);
    fireEvent.click(screen.getByTestId('burger'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('accepts custom aria-label and aria-expanded', () => {
    render(
      <Navbar.Burger
        aria-label="open menu"
        aria-expanded={true}
        data-testid="burger"
      />
    );
    const burger = screen.getByTestId('burger');
    expect(burger).toHaveAttribute('aria-label', 'open menu');
    expect(burger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Navbar.Menu', () => {
  it('renders menu content', () => {
    render(<Navbar.Menu data-testid="menu">Menu Content</Navbar.Menu>);
    expect(screen.getByTestId('menu')).toHaveTextContent('Menu Content');
  });

  it('applies menu class', () => {
    render(<Navbar.Menu data-testid="menu">Menu</Navbar.Menu>);
    expect(screen.getByTestId('menu')).toHaveClass('navbar-menu');
  });

  it('applies is-active when active', () => {
    render(
      <Navbar.Menu active data-testid="menu">
        Active Menu
      </Navbar.Menu>
    );
    expect(screen.getByTestId('menu')).toHaveClass('is-active');
  });

  it('accepts custom className', () => {
    render(
      <Navbar.Menu className="custom-menu" data-testid="menu">
        Custom Menu
      </Navbar.Menu>
    );
    expect(screen.getByTestId('menu')).toHaveClass('custom-menu');
  });
});

describe('Navbar.Start & Navbar.End', () => {
  it('renders start content', () => {
    render(<Navbar.Start data-testid="start">Start</Navbar.Start>);
    expect(screen.getByTestId('start')).toHaveTextContent('Start');
  });

  it('applies navbar-start class', () => {
    render(<Navbar.Start data-testid="start">Start</Navbar.Start>);
    expect(screen.getByTestId('start')).toHaveClass('navbar-start');
  });

  it('renders end content', () => {
    render(<Navbar.End data-testid="end">End</Navbar.End>);
    expect(screen.getByTestId('end')).toHaveTextContent('End');
  });

  it('applies navbar-end class', () => {
    render(<Navbar.End data-testid="end">End</Navbar.End>);
    expect(screen.getByTestId('end')).toHaveClass('navbar-end');
  });
});
