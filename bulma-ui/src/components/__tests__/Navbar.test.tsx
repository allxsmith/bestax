import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { createRef } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentProps } from 'react';
import Navbar, {
  NavbarBrand,
  NavbarItem,
  NavbarLink,
  NavbarBurger,
  NavbarMenu,
  NavbarStart,
  NavbarEnd,
  NavbarDropdown,
  NavbarDropdownMenu,
  NavbarDivider,
} from '../Navbar';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('isSpaced and hasShadow', () => {
    it('renders is-spaced for isSpaced, and nothing more', () => {
      render(<Navbar isSpaced>Test</Navbar>);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('class', 'navbar is-spaced');
      expect(nav).not.toHaveAttribute('isSpaced');
      expect(nav).not.toHaveAttribute('isspaced');
    });

    it('renders has-shadow for hasShadow, and nothing more', () => {
      render(<Navbar hasShadow>Test</Navbar>);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('class', 'navbar has-shadow');
      expect(nav).not.toHaveAttribute('hasShadow');
      expect(nav).not.toHaveAttribute('hasshadow');
    });

    it('renders neither class when the flags are false or unset', () => {
      const { rerender } = render(<Navbar>Test</Navbar>);
      expect(screen.getByRole('navigation')).toHaveAttribute('class', 'navbar');
      rerender(
        <Navbar isSpaced={false} hasShadow={false}>
          Test
        </Navbar>
      );
      expect(screen.getByRole('navigation')).toHaveAttribute('class', 'navbar');
    });

    it("combines with the other modifiers, as in Bulma's own markup", () => {
      render(
        <Navbar color="primary" transparent isSpaced hasShadow fixed="bottom">
          Test
        </Navbar>
      );
      expect(screen.getByRole('navigation')).toHaveAttribute(
        'class',
        'navbar is-primary is-transparent is-spaced has-shadow is-fixed-bottom'
      );
    });

    it('prefixes both classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Navbar isSpaced hasShadow>
            Test
          </Navbar>
        </ConfigProvider>
      );
      expect(screen.getByRole('navigation')).toHaveAttribute(
        'class',
        'bulma-navbar bulma-is-spaced bulma-has-shadow'
      );
    });

    it('types both as booleans', () => {
      const props: ComponentProps<typeof Navbar> = {
        isSpaced: true,
        hasShadow: false,
      };
      expect(props).toBeDefined();
      const wrong: ComponentProps<typeof Navbar> = {
        // @ts-expect-error: a flag, not a size
        isSpaced: 'large',
        // @ts-expect-error: a flag, not a shadow size
        hasShadow: 'small',
      };
      expect(wrong).toBeDefined();
    });
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

  it('names the nav main navigation by default, and an undefined aria-label removes it', () => {
    const { rerender } = render(<Navbar data-testid="navbar">Test</Navbar>);
    expect(screen.getByTestId('navbar')).toHaveAttribute(
      'aria-label',
      'main navigation'
    );
    rerender(
      <Navbar data-testid="navbar" aria-label={undefined}>
        Test
      </Navbar>
    );
    expect(screen.getByTestId('navbar')).not.toHaveAttribute('aria-label');
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

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Navbar>Test</Navbar>
      </ConfigProvider>
    );
    const navbar = screen.getByRole('navigation');
    expect(navbar).toHaveClass('bulma-navbar');
    expect(navbar).not.toHaveClass('navbar');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Navbar data-testid="navbar">Test</Navbar>
        </ConfigProvider>
      );
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('bulma-navbar');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Navbar data-testid="navbar">Test</Navbar>);
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('navbar');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Navbar data-testid="navbar">Test</Navbar>
        </ConfigProvider>
      );
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('navbar');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Navbar color="primary" m="2" data-testid="navbar">
            Test
          </Navbar>
        </ConfigProvider>
      );
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('bulma-navbar');
      expect(navbar).toHaveClass('bulma-is-primary');
      expect(navbar).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Navbar color="danger" data-testid="navbar">
          Test
        </Navbar>
      );
      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('navbar');
      expect(navbar).toHaveClass('is-danger');
    });
  });

  it('forwards ref to the root <nav> element', () => {
    const ref = createRef<HTMLElement>();
    render(<Navbar ref={ref}>Test</Navbar>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('navigation'));
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

  it('applies textColor as a helper class and not as a DOM attribute', () => {
    render(
      <Navbar.Brand textColor="primary" data-testid="brand">
        Brand
      </Navbar.Brand>
    );
    const brand = screen.getByTestId('brand');
    expect(brand).toHaveClass('has-text-primary');
    expect(brand).not.toHaveAttribute('textColor');
  });

  it('renders color as a text color, with textColor taking precedence', () => {
    const { rerender } = render(
      <Navbar.Brand color="info" data-testid="brand">
        Brand
      </Navbar.Brand>
    );
    expect(screen.getByTestId('brand')).toHaveClass('has-text-info');

    rerender(
      <Navbar.Brand color="info" textColor="grey" data-testid="brand">
        Brand
      </Navbar.Brand>
    );
    const brand = screen.getByTestId('brand');
    expect(brand).toHaveClass('has-text-grey');
    expect(brand).not.toHaveClass('has-text-info');
    expect(brand).not.toHaveAttribute('color');
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

  it('forwards router props like "to" to a custom "as" component', () => {
    // Stand-in for a router link (e.g. react-router-dom's Link)
    const RouterLink = ({
      to,
      ...rest
    }: { to: string } & ComponentProps<'a'>) => <a href={to} {...rest} />;
    render(
      <Navbar.Item as={RouterLink} to="/pricing" data-testid="item">
        Pricing
      </Navbar.Item>
    );
    const item = screen.getByTestId('item');
    expect(item).toHaveAttribute('href', '/pricing');
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
  // Navbar.Item gained ref forwarding with #641: the polymorphic contract is
  // props AND ref following `as`, and it had neither.
  it('forwards Navbar.Item ref to the rendered <a> element by default', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Navbar.Item ref={ref}>Home</Navbar.Item>);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ref.current).toBe(screen.getByText('Home'));
  });

  it('forwards Navbar.Item ref to whatever as renders', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Navbar.Item as="span" ref={ref}>
        Static
      </Navbar.Item>
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  describe('as="button"', () => {
    it('renders type="button", so it does not submit a form around it', () => {
      render(<Navbar.Item as="button">Save draft</Navbar.Item>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('keeps the button type default through a spread carrying an absent type', () => {
      // React reads `type={undefined}` as "remove the attribute", and a props
      // spread whose `type` is undefined is how that arrives.
      const spread: { type?: 'button' | 'submit' | 'reset' } = {
        type: undefined,
      };
      render(
        <Navbar.Item as="button" {...spread}>
          Save draft
        </Navbar.Item>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('lets an explicit submit or reset type win', () => {
      render(
        <>
          <Navbar.Item as="button" type="submit">
            Search
          </Navbar.Item>
          <Navbar.Item as="button" type="reset">
            Clear
          </Navbar.Item>
        </>
      );
      expect(screen.getByText('Search')).toHaveAttribute('type', 'submit');
      expect(screen.getByText('Clear')).toHaveAttribute('type', 'reset');
    });

    it('replaces a type HTML would read as submit with type="button"', () => {
      const loose: object = { type: 'text/html' };
      render(
        <Navbar.Item as="button" {...loose}>
          Save draft
        </Navbar.Item>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('marks an active button as the current page, on the button', () => {
      render(
        <Navbar.Item as="button" active data-testid="button">
          Filter
        </Navbar.Item>
      );
      const button = screen.getByTestId('button');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('aria-current', 'page');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('sets no type on an item that is not a button', () => {
      const Custom = (props: ComponentProps<'a'>) => <a {...props} />;
      render(
        <>
          <Navbar.Item data-testid="a">Home</Navbar.Item>
          <Navbar.Item as="span" data-testid="span">
            Static
          </Navbar.Item>
          <Navbar.Item as={Custom} data-testid="custom">
            Custom
          </Navbar.Item>
        </>
      );
      expect(screen.getByTestId('a')).not.toHaveAttribute('type');
      expect(screen.getByTestId('span')).not.toHaveAttribute('type');
      expect(screen.getByTestId('custom')).not.toHaveAttribute('type');
    });
  });
});

describe('current page', () => {
  // `active` is how a navbar marks the page you're on, and a class alone
  // tells assistive tech nothing (#1338). The attribute goes on the element
  // `as` renders, the one a screen reader announces.
  const CustomLink = ({
    to,
    ...rest
  }: { to: string } & ComponentProps<'a'>) => (
    <a href={to} data-testid="custom-link" {...rest} />
  );

  it('marks an active item as the current page', () => {
    render(
      <>
        <Navbar.Item href="#a" data-testid="plain">
          Home
        </Navbar.Item>
        <Navbar.Item href="#b" active data-testid="current">
          About
        </Navbar.Item>
      </>
    );
    expect(screen.getByTestId('current')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByTestId('current')).toHaveClass('is-active');
    expect(screen.getByTestId('plain')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('plain')).not.toHaveClass('is-active');
  });

  it('marks a custom component the same way', () => {
    render(
      <Navbar.Item as={CustomLink} to="/about" active>
        About
      </Navbar.Item>
    );
    expect(screen.getByTestId('custom-link')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('lets a caller’s own aria-current win', () => {
    render(
      <>
        <Navbar.Item
          href="#intro"
          active
          aria-current="location"
          data-testid="location"
        >
          Introduction
        </Navbar.Item>
        <Navbar.Item href="#b" active aria-current={false} data-testid="off">
          About
        </Navbar.Item>
      </>
    );
    expect(screen.getByTestId('location')).toHaveAttribute(
      'aria-current',
      'location'
    );
    // "false" is how ARIA says not current, which is what turning it off means.
    expect(screen.getByTestId('off')).toHaveAttribute('aria-current', 'false');
  });

  it('lets a caller’s aria-current decide even when it’s undefined', () => {
    // Nothing goes wrong when the attribute is left off, so the caller's
    // value decides outright. bestax-migrate converts `is-active` to `active`
    // only beside an `aria-current` of the element's own, and a value that is
    // undefined at run time has to render nothing there, as it did on the <a>.
    const spread: { 'aria-current'?: 'page' } = {
      'aria-current': undefined,
    };
    render(
      <Navbar.Item href="#b" active data-testid="current" {...spread}>
        About
      </Navbar.Item>
    );
    expect(screen.getByTestId('current')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('current')).toHaveClass('is-active');
  });

  it('passes a caller’s aria-current through on an item that isn’t active', () => {
    render(
      <Navbar.Item href="#intro" aria-current="location" data-testid="item">
        Introduction
      </Navbar.Item>
    );
    expect(screen.getByTestId('item')).toHaveAttribute(
      'aria-current',
      'location'
    );
    expect(screen.getByTestId('item')).not.toHaveClass('is-active');
  });
});

describe('Navbar.Burger', () => {
  it('renders the four hidden spans Bulma v1 positions', () => {
    render(<Navbar.Burger data-testid="burger" />);
    const spans = screen.getByTestId('burger').querySelectorAll('span');
    expect(spans).toHaveLength(4);
    spans.forEach(span => expect(span).toHaveAttribute('aria-hidden', 'true'));
  });

  it('renders children after the four bar spans the mixin counts', () => {
    render(
      <Navbar.Burger data-testid="burger">
        <em>extra</em>
      </Navbar.Burger>
    );
    const kids = Array.from(screen.getByTestId('burger').children);
    expect(kids.slice(0, 4).map(el => el.tagName)).toEqual([
      'SPAN',
      'SPAN',
      'SPAN',
      'SPAN',
    ]);
    expect(kids[4]).toHaveTextContent('extra');
  });

  it('applies is-active when active', () => {
    render(<Navbar.Burger active data-testid="burger" />);
    expect(screen.getByTestId('burger')).toHaveClass('is-active');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
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

  it('renders type="button", aria-label="menu" and aria-expanded from active', () => {
    render(<Navbar.Burger active data-testid="burger" />);
    const burger = screen.getByTestId('burger');
    expect(burger).toHaveAttribute('type', 'button');
    expect(burger).toHaveAttribute('aria-label', 'menu');
    expect(burger).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps its defaults through a spread carrying absent values', () => {
    // React reads an `undefined` attribute as "remove it", and a props spread
    // whose key has no value is how that arrives. Defaults written before the
    // spread were erased by it: a nameless burger that submits a form and
    // reports no expanded state.
    const spread: {
      type?: 'button' | 'submit' | 'reset';
      'aria-label'?: string;
      'aria-expanded'?: boolean;
    } = {
      type: undefined,
      'aria-label': undefined,
      'aria-expanded': undefined,
    };
    render(<Navbar.Burger active data-testid="burger" {...spread} />);
    const burger = screen.getByTestId('burger');
    expect(burger).toHaveAttribute('type', 'button');
    expect(burger).toHaveAttribute('aria-label', 'menu');
    expect(burger).toHaveAttribute('aria-expanded', 'true');
  });

  it('falls back to its name when given an empty aria-label', () => {
    // `''` names nothing, and the burger is drawn as bars, so an empty label
    // would leave it unnamed. It falls back like a missing one.
    render(<Navbar.Burger data-testid="burger" aria-label="" />);
    expect(screen.getByTestId('burger')).toHaveAttribute('aria-label', 'menu');
  });

  it('leaves aria-expanded off for null, whatever active says', () => {
    render(<Navbar.Burger active aria-expanded={null} data-testid="burger" />);
    expect(screen.getByTestId('burger')).not.toHaveAttribute('aria-expanded');
  });

  it('lets an explicit type and aria-expanded win', () => {
    render(
      <Navbar.Burger
        active
        type="submit"
        aria-expanded={false}
        data-testid="burger"
      />
    );
    const burger = screen.getByTestId('burger');
    expect(burger).toHaveAttribute('type', 'submit');
    expect(burger).toHaveAttribute('aria-expanded', 'false');
  });

  it('replaces a type HTML would read as submit with type="button"', () => {
    const loose: object = { type: 'text/html' };
    render(<Navbar.Burger data-testid="burger" {...loose} />);
    expect(screen.getByTestId('burger')).toHaveAttribute('type', 'button');
  });

  it('forwards ref to the burger button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Navbar.Burger ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies textColor as a helper class and not as a DOM attribute', () => {
    render(<Navbar.Burger textColor="primary" data-testid="burger" />);
    const burger = screen.getByTestId('burger');
    expect(burger).toHaveClass('has-text-primary');
    expect(burger).not.toHaveAttribute('textColor');
  });

  it('renders color as a text color, with textColor taking precedence', () => {
    const { rerender } = render(
      <Navbar.Burger color="info" data-testid="burger" />
    );
    expect(screen.getByTestId('burger')).toHaveClass('has-text-info');

    rerender(
      <Navbar.Burger color="info" textColor="grey" data-testid="burger" />
    );
    const burger = screen.getByTestId('burger');
    expect(burger).toHaveClass('has-text-grey');
    expect(burger).not.toHaveClass('has-text-info');
    expect(burger).not.toHaveAttribute('color');
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

  it('applies textColor as a helper class and not as a DOM attribute', () => {
    render(
      <Navbar.Menu textColor="primary" data-testid="menu">
        Menu
      </Navbar.Menu>
    );
    const menu = screen.getByTestId('menu');
    expect(menu).toHaveClass('has-text-primary');
    expect(menu).not.toHaveAttribute('textColor');
  });

  it('renders color as a text color, with textColor taking precedence', () => {
    const { rerender } = render(
      <Navbar.Menu color="info" data-testid="menu">
        Menu
      </Navbar.Menu>
    );
    expect(screen.getByTestId('menu')).toHaveClass('has-text-info');

    rerender(
      <Navbar.Menu color="info" textColor="grey" data-testid="menu">
        Menu
      </Navbar.Menu>
    );
    const menu = screen.getByTestId('menu');
    expect(menu).toHaveClass('has-text-grey');
    expect(menu).not.toHaveClass('has-text-info');
    expect(menu).not.toHaveAttribute('color');
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

  it('applies textColor on Navbar.Start as a helper class and not as a DOM attribute', () => {
    render(
      <Navbar.Start textColor="primary" data-testid="start">
        Start
      </Navbar.Start>
    );
    const start = screen.getByTestId('start');
    expect(start).toHaveClass('has-text-primary');
    expect(start).not.toHaveAttribute('textColor');
  });

  it('applies textColor on Navbar.End as a helper class and not as a DOM attribute', () => {
    render(
      <Navbar.End textColor="primary" data-testid="end">
        End
      </Navbar.End>
    );
    const end = screen.getByTestId('end');
    expect(end).toHaveClass('has-text-primary');
    expect(end).not.toHaveAttribute('textColor');
  });

  it('renders color as a text color on Navbar.Start, with textColor taking precedence', () => {
    const { rerender } = render(
      <Navbar.Start color="info" data-testid="start">
        Start
      </Navbar.Start>
    );
    expect(screen.getByTestId('start')).toHaveClass('has-text-info');

    rerender(
      <Navbar.Start color="info" textColor="grey" data-testid="start">
        Start
      </Navbar.Start>
    );
    const start = screen.getByTestId('start');
    expect(start).toHaveClass('has-text-grey');
    expect(start).not.toHaveClass('has-text-info');
    expect(start).not.toHaveAttribute('color');
  });

  it('renders color as a text color on Navbar.End, with textColor taking precedence', () => {
    const { rerender } = render(
      <Navbar.End color="info" data-testid="end">
        End
      </Navbar.End>
    );
    expect(screen.getByTestId('end')).toHaveClass('has-text-info');

    rerender(
      <Navbar.End color="info" textColor="grey" data-testid="end">
        End
      </Navbar.End>
    );
    const end = screen.getByTestId('end');
    expect(end).toHaveClass('has-text-grey');
    expect(end).not.toHaveClass('has-text-info');
    expect(end).not.toHaveAttribute('color');
  });
});

describe('Navbar.Dropdown', () => {
  it('renders dropdown with correct classes', () => {
    render(
      <Navbar.Dropdown hoverable right active data-testid="dropdown">
        <Navbar.Item as="a">Dropdown</Navbar.Item>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveClass('has-dropdown');
    expect(dropdown).toHaveClass('is-hoverable');
    expect(dropdown).toHaveClass('is-right');
    expect(dropdown).toHaveClass('is-active');
  });

  it('renders dropdown menu with correct classes', () => {
    render(
      <Navbar.Dropdown>
        <Navbar.Item as="a">Dropdown</Navbar.Item>
        <Navbar.DropdownMenu right data-testid="dropdown-menu">
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const menu = screen.getByTestId('dropdown-menu');
    expect(menu).toHaveClass('navbar-dropdown');
    expect(menu).toHaveClass('is-right');
  });

  it('renders divider', () => {
    render(
      <Navbar.Dropdown>
        <Navbar.Item as="a">Dropdown</Navbar.Item>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
          <Navbar.Divider data-testid="divider" />
          <Navbar.Item href="#">B</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('HR');
    expect(divider).toHaveClass('navbar-divider');
  });

  it('merges a custom className with navbar-divider instead of replacing it', () => {
    render(<Navbar.Divider className="my-2" data-testid="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toHaveClass('navbar-divider');
    expect(divider).toHaveClass('my-2');
  });

  it('starts closed by default and can be controlled externally via active', () => {
    const { rerender } = render(
      <Navbar.Dropdown data-testid="dropdown">
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    expect(screen.getByTestId('dropdown')).not.toHaveClass('is-active');
    rerender(
      <Navbar.Dropdown active data-testid="dropdown">
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    expect(screen.getByTestId('dropdown')).toHaveClass('is-active');
  });

  it('toggles active state via its Navbar.Link trigger and calls onActiveChange', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange} data-testid="dropdown">
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const trigger = screen.getByText('More');
    expect(screen.getByTestId('dropdown')).not.toHaveClass('is-active');

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('dropdown')).toHaveClass('is-active');

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('dropdown')).not.toHaveClass('is-active');
  });

  it('Escape closes the dropdown and keeps focus on the link', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown
        active
        onActiveChange={onActiveChange}
        data-testid="dropdown"
      >
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const trigger = screen.getByText('More');
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
    expect(trigger).toHaveFocus();
  });

  it('Escape does nothing when already closed', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange} data-testid="dropdown">
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.keyDown(screen.getByText('More'), { key: 'Escape' });
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  describe('Escape inside the open menu', () => {
    const renderOpen = (
      props: Partial<ComponentProps<typeof Navbar.Dropdown>> = {},
      prefix = ''
    ) => {
      const onActiveChange = vi.fn();
      render(
        <ConfigProvider classPrefix={prefix}>
          <Navbar.Dropdown
            onActiveChange={onActiveChange}
            data-testid="dropdown"
            {...props}
          >
            <Navbar.Link>More</Navbar.Link>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#about">About</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </ConfigProvider>
      );
      const trigger = screen.getByRole('button', { name: 'More' });
      const item = screen.getByRole('link', { name: 'About' });
      return { onActiveChange, trigger, item };
    };

    it.each([
      ['no prefix', ''],
      ['a class prefix', 'bestax-'],
    ])(
      'closes the dropdown and puts focus on its link, with %s',
      (_label, prefix) => {
        const { onActiveChange, trigger, item } = renderOpen({}, prefix);
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        item.focus();
        fireEvent.keyDown(item, { key: 'Escape' });
        expect(onActiveChange).toHaveBeenLastCalledWith(false);
        expect(onActiveChange).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('dropdown')).not.toHaveClass(
          `${prefix}is-active`
        );
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveFocus();
      }
    );

    it('closes a dropdown opened through `active` too', () => {
      const { onActiveChange, trigger, item } = renderOpen({ active: true });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(onActiveChange).toHaveBeenCalledWith(false);
      expect(trigger).toHaveFocus();
    });

    it('closes once for an Escape on the link', () => {
      const { onActiveChange, trigger } = renderOpen({ active: true });
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(onActiveChange).toHaveBeenCalledTimes(1);
      expect(onActiveChange).toHaveBeenCalledWith(false);
    });

    it('does nothing in a closed dropdown, and passes the key on', () => {
      const { onActiveChange, item } = renderOpen();
      const escape = createEvent.keyDown(item, { key: 'Escape' });
      fireEvent(item, escape);
      expect(onActiveChange).not.toHaveBeenCalled();
      expect(escape.defaultPrevented).toBe(false);
    });

    it('leaves the dropdown open for an Escape something inside already used', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          <Navbar.Link>More</Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#about" onKeyDown={e => e.preventDefault()}>
              About
            </Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(onActiveChange).not.toHaveBeenCalled();
      expect(item).toHaveFocus();
    });

    it('finds a Navbar.Link wrapped in another element', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          <span>
            <Navbar.Link>More</Navbar.Link>
          </span>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#about">About</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(onActiveChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();
    });

    it('goes back to its own link, not one in its menu', () => {
      // The menu comes first here, as it can in a dropdown that opens up.
      render(
        <Navbar.Dropdown active up>
          <Navbar.DropdownMenu>
            <Navbar.Link href="#nested">Nested</Navbar.Link>
            <Navbar.Item href="#about">About</Navbar.Item>
          </Navbar.DropdownMenu>
          <Navbar.Link>More</Navbar.Link>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();
    });

    it('closes the inner of two nested dropdowns, back to its own link', () => {
      const outerChange = vi.fn();
      const innerChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={outerChange}>
          <Navbar.Link>More</Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Dropdown active onActiveChange={innerChange}>
              <Navbar.Link>Team</Navbar.Link>
              <Navbar.DropdownMenu>
                <Navbar.Item href="#people">People</Navbar.Item>
              </Navbar.DropdownMenu>
            </Navbar.Dropdown>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'People' });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(innerChange).toHaveBeenCalledWith(false);
      expect(outerChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Team' })).toHaveFocus();
    });

    it('leaves a dropdown with no Navbar.Link open, and passes the key on', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#about">About</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'About' });
      const escape = createEvent.keyDown(item, { key: 'Escape' });
      fireEvent(item, escape);
      expect(onActiveChange).not.toHaveBeenCalled();
      expect(escape.defaultPrevented).toBe(false);
    });

    it('stays open, and passes the key on, when focus can’t go back to the link', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          <Navbar.Link as="button" disabled>
            More
          </Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#about">About</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      const escape = createEvent.keyDown(item, { key: 'Escape' });
      fireEvent(item, escape);
      expect(onActiveChange).not.toHaveBeenCalled();
      expect(escape.defaultPrevented).toBe(false);
      expect(item).toHaveFocus();
    });

    it('finds the link only while it’s there, and never one in the menu', () => {
      const onActiveChange = vi.fn();
      const Menu = ({ link, nested }: { link: boolean; nested: boolean }) => (
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          {link && <Navbar.Link>More</Navbar.Link>}
          <Navbar.DropdownMenu>
            {nested && <Navbar.Link href="#nested">Nested</Navbar.Link>}
            <Navbar.Item href="#about">About</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const { rerender } = render(<Menu link nested />);
      rerender(<Menu link nested={false} />);
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(onActiveChange).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();

      onActiveChange.mockClear();
      rerender(<Menu link={false} nested={false} />);
      const again = screen.getByRole('link', { name: 'About' });
      again.focus();
      fireEvent.keyDown(again, { key: 'Escape' });
      expect(onActiveChange).not.toHaveBeenCalled();
    });

    it('still closes from a menu that is itself marked as a dialog', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          <Navbar.Link>More</Navbar.Link>
          <Navbar.DropdownMenu role="dialog" aria-label="Products">
            <Navbar.Item href="#about">About</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(onActiveChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();
    });

    it('leaves an IME’s Escape to its composition', () => {
      const { onActiveChange, item } = renderOpen({ active: true });
      fireEvent.keyDown(item, { key: 'Escape', isComposing: true });
      fireEvent.keyDown(item, { key: 'Escape', keyCode: 229 });
      expect(onActiveChange).not.toHaveBeenCalled();
    });

    it('closes a dropdown that sits in a dialog, leaving the dialog to the next Escape', () => {
      const onActiveChange = vi.fn();
      render(
        <div role="dialog" aria-label="Settings">
          <Navbar.Dropdown active onActiveChange={onActiveChange}>
            <Navbar.Link>More</Navbar.Link>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#about">About</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </div>
      );
      const item = screen.getByRole('link', { name: 'About' });
      item.focus();
      const escape = createEvent.keyDown(item, { key: 'Escape' });
      fireEvent(item, escape);
      expect(onActiveChange).toHaveBeenCalledWith(false);
      expect(escape.defaultPrevented).toBe(true);
    });

    it('leaves an Escape from a dialog in the menu, or from content portaled out of it, alone', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown active onActiveChange={onActiveChange}>
          <Navbar.Link>More</Navbar.Link>
          <Navbar.DropdownMenu>
            <div role="dialog" aria-label="Inline">
              <button type="button">Inside</button>
            </div>
            <dialog open aria-label="Native">
              <button type="button">Native inside</button>
            </dialog>
            {createPortal(
              <div role="dialog" aria-label="Portaled">
                <button type="button">Portaled inside</button>
              </div>,
              document.body
            )}
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      for (const name of ['Inside', 'Native inside', 'Portaled inside']) {
        const button = screen.getByRole('button', { name });
        const escape = createEvent.keyDown(button, { key: 'Escape' });
        fireEvent(button, escape);
        expect(escape.defaultPrevented).toBe(false);
      }
      expect(onActiveChange).not.toHaveBeenCalled();
    });

    it('still runs an onKeyDown passed to the dropdown', () => {
      const onKeyDown = vi.fn();
      const { item } = renderOpen({ active: true, onKeyDown });
      fireEvent.keyDown(item, { key: 'Escape' });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  it('other keys on the trigger are ignored', () => {
    render(
      <Navbar.Dropdown data-testid="dropdown">
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.keyDown(screen.getByText('More'), { key: 'a' });
    expect(screen.getByTestId('dropdown')).not.toHaveClass('is-active');
  });

  it('forwards ref to the dropdown container element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Navbar.Dropdown ref={ref} data-testid="dropdown">
        <Navbar.Link>More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByTestId('dropdown'));
  });
});

describe('Navbar.Link', () => {
  it('renders link with navbar-link class by default', () => {
    render(<Navbar.Link href="/home">Home</Navbar.Link>);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('navbar-link');
    expect(link).toHaveTextContent('Home');
  });

  it('applies textColor, bgColor, and margin helper classes', () => {
    render(
      <Navbar.Link href="/home" textColor="primary" bgColor="light" m="2">
        Home
      </Navbar.Link>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('navbar-link');
    expect(link).toHaveClass('has-text-primary');
    expect(link).toHaveClass('has-background-light');
    expect(link).toHaveClass('m-2');
  });

  it('applies is-arrowless when arrowless is true', () => {
    render(
      <Navbar.Link href="/home" arrowless>
        Home
      </Navbar.Link>
    );
    expect(screen.getByRole('link')).toHaveClass('is-arrowless');
  });

  it('allows changing root element with "as"', () => {
    render(
      <Navbar.Link as="span" data-testid="navlink">
        Span Link
      </Navbar.Link>
    );
    const link = screen.getByTestId('navlink');
    expect(link.tagName).toBe('SPAN');
    expect(link).toHaveClass('navbar-link');
  });

  it('accepts custom className', () => {
    render(
      <Navbar.Link className="custom-link" data-testid="navlink">
        Custom
      </Navbar.Link>
    );
    expect(screen.getByTestId('navlink')).toHaveClass('custom-link');
  });

  it('does not pass Bulma helper props to underlying element', () => {
    render(
      <Navbar.Link
        textColor="danger"
        bgColor="white"
        p="3"
        data-testid="navlink"
      >
        Link
      </Navbar.Link>
    );
    const link = screen.getByTestId('navlink');
    expect(link).not.toHaveAttribute('textColor');
    expect(link).not.toHaveAttribute('bgColor');
    expect(link).toHaveClass('p-3');
  });

  it('applies prefix to navbar-link and helper classes via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Navbar.Link textColor="info" m="1" data-testid="navlink">
          Prefixed
        </Navbar.Link>
      </ConfigProvider>
    );
    const link = screen.getByTestId('navlink');
    expect(link).toHaveClass('bulma-navbar-link');
  });

  it('does not add dropdown ARIA attributes when rendered outside Navbar.Dropdown', () => {
    render(<Navbar.Link data-testid="navlink">Standalone</Navbar.Link>);
    const link = screen.getByTestId('navlink');
    expect(link).not.toHaveAttribute('aria-haspopup');
    expect(link).not.toHaveAttribute('aria-expanded');
    expect(link).not.toHaveAttribute('role');
  });

  it('adds aria-haspopup/aria-expanded and role="button"/tabIndex when it has no href', () => {
    render(
      <Navbar.Dropdown>
        <Navbar.Link data-testid="navlink">More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const link = screen.getByTestId('navlink');
    expect(link).toHaveAttribute('aria-haspopup', 'true');
    expect(link).toHaveAttribute('aria-expanded', 'false');
    expect(link).toHaveAttribute('role', 'button');
    expect(link).toHaveAttribute('tabIndex', '0');
  });

  it('omits role/tabIndex when it has an href (already natively interactive)', () => {
    render(
      <Navbar.Dropdown active>
        <Navbar.Link href="/more" data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const link = screen.getByTestId('navlink');
    expect(link).toHaveAttribute('aria-haspopup', 'true');
    expect(link).toHaveAttribute('aria-expanded', 'true');
    expect(link).not.toHaveAttribute('role');
    expect(link).not.toHaveAttribute('tabIndex');
  });

  it('omits role/tabIndex when rendered as a button (already natively interactive)', () => {
    render(
      <Navbar.Dropdown>
        <Navbar.Link as="button" data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const link = screen.getByTestId('navlink');
    expect(link).not.toHaveAttribute('role');
    expect(link).not.toHaveAttribute('tabIndex');
  });

  it('calls a caller-supplied onKeyDown alongside the dropdown toggle behavior', () => {
    const onKeyDown = vi.fn();
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange}>
        <Navbar.Link onKeyDown={onKeyDown} data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('navlink'), { key: 'Enter' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(onActiveChange).toHaveBeenCalledWith(true);
  });

  it('respects a caller-supplied onKeyDown that calls preventDefault', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange}>
        <Navbar.Link onKeyDown={e => e.preventDefault()} data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('navlink'), { key: 'Enter' });
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it('opens the dropdown on click when it has no href (touch/mouse users)', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange}>
        <Navbar.Link data-testid="navlink">More</Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    const link = screen.getByTestId('navlink');
    fireEvent.click(link);
    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(link).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(link);
    expect(onActiveChange).toHaveBeenCalledWith(false);
  });

  it('calls a caller-supplied onClick alongside the dropdown toggle', () => {
    const onClick = vi.fn();
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange}>
        <Navbar.Link onClick={onClick} data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.click(screen.getByTestId('navlink'));
    expect(onClick).toHaveBeenCalled();
    expect(onActiveChange).toHaveBeenCalledWith(true);
  });

  it('respects a caller-supplied onClick that calls preventDefault', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange}>
        <Navbar.Link onClick={e => e.preventDefault()} data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.click(screen.getByTestId('navlink'));
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  describe('a custom `as` target in a dropdown (#668)', () => {
    // Stands in for a router link: it takes `to`, not `href`, and builds the
    // anchor itself — so nothing in the props Navbar.Link receives says "link".
    const RouterLink = ({
      to,
      children,
      ...rest
    }: { to: string } & ComponentProps<'a'>) => (
      <a href={to} {...rest}>
        {children}
      </a>
    );

    it('keeps link semantics for a custom component with no href of ours', () => {
      render(
        <Navbar.Dropdown>
          <Navbar.Link as={RouterLink} to="/x" data-testid="navlink">
            More
          </Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#">A</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const link = screen.getByTestId('navlink');
      expect(link).toHaveAttribute('href', '/x');
      expect(link).not.toHaveAttribute('role');
      expect(link).not.toHaveAttribute('tabIndex');
      // The dropdown wiring it does still need.
      expect(link).toHaveAttribute('aria-haspopup', 'true');
      expect(link).toHaveAttribute('aria-expanded', 'false');
    });

    it('leaves the custom target its own click, rather than toggling over it', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown onActiveChange={onActiveChange}>
          <Navbar.Link as={RouterLink} to="/x" data-testid="navlink">
            More
          </Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#">A</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      fireEvent.click(screen.getByTestId('navlink'));
      expect(onActiveChange).not.toHaveBeenCalled();
    });

    it('still toggles from the keyboard', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown onActiveChange={onActiveChange}>
          <Navbar.Link as={RouterLink} to="/x" data-testid="navlink">
            More
          </Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#">A</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      fireEvent.keyDown(screen.getByTestId('navlink'), { key: 'Enter' });
      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('keeps the fallback for a non-interactive intrinsic (as="span")', () => {
      const onActiveChange = vi.fn();
      render(
        <Navbar.Dropdown onActiveChange={onActiveChange}>
          <Navbar.Link as="span" data-testid="navlink">
            More
          </Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#">A</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const link = screen.getByTestId('navlink');
      expect(link).toHaveAttribute('role', 'button');
      expect(link).toHaveAttribute('tabIndex', '0');
      fireEvent.click(link);
      expect(onActiveChange).toHaveBeenCalledWith(true);
    });

    it('keeps the fallback for a custom element, which is a real non-interactive tag', () => {
      render(
        <Navbar.Dropdown>
          <Navbar.Link as={'x-trigger' as never} data-testid="navlink">
            More
          </Navbar.Link>
          <Navbar.DropdownMenu>
            <Navbar.Item href="#">A</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      );
      const link = screen.getByTestId('navlink');
      expect(link).toHaveAttribute('role', 'button');
      expect(link).toHaveAttribute('tabIndex', '0');
    });

    // The guess is the caller's to correct: a custom target declaring itself a
    // button gets the whole fallback back, including the click it cannot wire up
    // for itself.
    describe('a custom target declaring role="button"', () => {
      const DivTrigger = (props: ComponentProps<'div'>) => <div {...props} />;

      it('takes the fallback click, so a mouse can open the dropdown', () => {
        const onActiveChange = vi.fn();
        render(
          <Navbar.Dropdown onActiveChange={onActiveChange}>
            <Navbar.Link
              as={DivTrigger}
              role="button"
              tabIndex={0}
              data-testid="navlink"
            >
              More
            </Navbar.Link>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">A</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        );
        const link = screen.getByTestId('navlink');
        expect(link).toHaveAttribute('role', 'button');
        expect(link).toHaveAttribute('tabIndex', '0');
        fireEvent.click(link);
        expect(onActiveChange).toHaveBeenCalledWith(true);
      });

      it('still loses to an href — somewhere to navigate makes it a link', () => {
        const onActiveChange = vi.fn();
        render(
          <Navbar.Dropdown onActiveChange={onActiveChange}>
            <Navbar.Link
              as={RouterLink}
              to="/x"
              href="/x"
              role="button"
              data-testid="navlink"
            >
              More
            </Navbar.Link>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">A</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        );
        fireEvent.click(screen.getByTestId('navlink'));
        expect(onActiveChange).not.toHaveBeenCalled();
      });
    });
  });

  it('does not hijack click when natively interactive (href)', () => {
    const onActiveChange = vi.fn();
    render(
      <Navbar.Dropdown onActiveChange={onActiveChange}>
        <Navbar.Link href="/more" data-testid="navlink">
          More
        </Navbar.Link>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    );
    fireEvent.click(screen.getByTestId('navlink'));
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it('forwards ref to the rendered <a> element by default', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Navbar.Link ref={ref}>More</Navbar.Link>);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ref.current).toBe(screen.getByText('More'));
  });

  it('forwards ref to the rendered <button> element when as="button"', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Navbar.Link as="button" ref={ref}>
        More
      </Navbar.Link>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  describe('as="button"', () => {
    it('renders type="button", so it does not submit a form around it', () => {
      render(
        <Navbar.Dropdown>
          <Navbar.Link as="button">More</Navbar.Link>
        </Navbar.Dropdown>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('keeps the button type default through a spread carrying an absent type', () => {
      // React reads `type={undefined}` as "remove the attribute", and a props
      // spread whose `type` is undefined is how that arrives.
      const spread: { type?: 'button' | 'submit' | 'reset' } = {
        type: undefined,
      };
      render(
        <Navbar.Link as="button" {...spread}>
          More
        </Navbar.Link>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('lets an explicit submit or reset type win', () => {
      render(
        <>
          <Navbar.Link as="button" type="submit">
            Search
          </Navbar.Link>
          <Navbar.Link as="button" type="reset">
            Clear
          </Navbar.Link>
        </>
      );
      expect(screen.getByText('Search')).toHaveAttribute('type', 'submit');
      expect(screen.getByText('Clear')).toHaveAttribute('type', 'reset');
    });

    it('replaces a type HTML would read as submit with type="button"', () => {
      const loose: object = { type: 'text/html' };
      render(
        <Navbar.Link as="button" {...loose}>
          More
        </Navbar.Link>
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('sets no type on a link that is not a button', () => {
      render(
        <>
          <Navbar.Link href="/more" data-testid="a">
            More
          </Navbar.Link>
          <Navbar.Link as="span" data-testid="span">
            Static
          </Navbar.Link>
        </>
      );
      expect(screen.getByTestId('a')).not.toHaveAttribute('type');
      expect(screen.getByTestId('span')).not.toHaveAttribute('type');
    });
  });
});

describe('Compound components', () => {
  it('statics are the separately exported components', () => {
    expect(Navbar.Brand).toBe(NavbarBrand);
    expect(Navbar.Item).toBe(NavbarItem);
    expect(Navbar.Link).toBe(NavbarLink);
    expect(Navbar.Burger).toBe(NavbarBurger);
    expect(Navbar.Menu).toBe(NavbarMenu);
    expect(Navbar.Start).toBe(NavbarStart);
    expect(Navbar.End).toBe(NavbarEnd);
    expect(Navbar.Dropdown).toBe(NavbarDropdown);
    expect(Navbar.DropdownMenu).toBe(NavbarDropdownMenu);
    expect(Navbar.Divider).toBe(NavbarDivider);
  });

  it('renders a full navbar through the dot path', () => {
    const { container } = render(
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item href="#">Bestax</Navbar.Item>
          <Navbar.Burger />
        </Navbar.Brand>
        <Navbar.Menu active>
          <Navbar.Start>
            <Navbar.Item href="#">Home</Navbar.Item>
            <Navbar.Dropdown hoverable>
              <Navbar.Link>More</Navbar.Link>
              <Navbar.DropdownMenu>
                <Navbar.Item href="#">About</Navbar.Item>
                <Navbar.Divider />
                <Navbar.Item href="#">Contact</Navbar.Item>
              </Navbar.DropdownMenu>
            </Navbar.Dropdown>
          </Navbar.Start>
          <Navbar.End>
            <Navbar.Item href="#">Log in</Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Navbar>
    );
    expect(container.querySelector('.navbar')).toBeInTheDocument();
    expect(container.querySelector('.navbar-brand')).toBeInTheDocument();
    expect(container.querySelector('.navbar-burger')).toBeInTheDocument();
    expect(container.querySelector('.navbar-menu')).toBeInTheDocument();
    expect(container.querySelector('.navbar-start')).toBeInTheDocument();
    expect(container.querySelector('.navbar-end')).toBeInTheDocument();
    expect(container.querySelector('.has-dropdown')).toBeInTheDocument();
    expect(container.querySelector('.navbar-link')).toBeInTheDocument();
    expect(container.querySelector('.navbar-dropdown')).toBeInTheDocument();
    expect(container.querySelector('.navbar-divider')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.navbar-item').length
    ).toBeGreaterThanOrEqual(5);
  });
});
