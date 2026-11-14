import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { IconButton, type IconButtonProps } from '../IconButton';
import { Icon } from '../Icon';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

beforeEach(() => resetDevWarnings());
afterEach(() => vi.restoreAllMocks());

/** The `span.icon` elements directly inside the button. */
const iconsOf = (button: HTMLElement) =>
  Array.from(button.children).filter(child => child.classList.contains('icon'));

/** Props as a JavaScript caller might pass them, past the types. */
const untyped = (props: Record<string, unknown>) =>
  props as unknown as IconButtonProps;

/** A router-style link, standing in for `react-router`'s `Link`. */
const RouterLink = React.forwardRef<
  HTMLAnchorElement,
  { to: string; type?: string; children?: React.ReactNode }
>(function RouterLink({ to, type, children, ...rest }, ref) {
  return (
    <a {...rest} href={to} ref={ref} data-type={type}>
      {children}
    </a>
  );
});

describe('IconButton', () => {
  describe('markup', () => {
    it('renders a named button with one decorative icon', () => {
      render(<IconButton icon="trash" aria-label="Delete" />);
      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveClass('button', 'icon-button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label', 'Delete');
      const icons = iconsOf(button);
      expect(icons).toHaveLength(1);
      expect(icons[0].tagName).toBe('SPAN');
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
      expect(icons[0].querySelector('i')).toHaveClass('fas', 'fa-trash');
      expect(button.children).toHaveLength(1);
    });

    it("puts its own class after Button's, and the caller's after that", () => {
      render(
        <IconButton
          icon="trash"
          aria-label="Delete"
          color="danger"
          className="mine"
        />
      );
      expect(screen.getByRole('button').className).toBe(
        'button is-danger icon-button mine'
      );
    });

    it('takes aria-labelledby in place of aria-label', () => {
      render(
        <>
          <span id="delete-label">Delete the row</span>
          <IconButton icon="trash" aria-labelledby="delete-label" />
        </>
      );
      const button = screen.getByRole('button', { name: 'Delete the row' });
      expect(button).not.toHaveAttribute('aria-label');
    });
  });

  describe('the icon', () => {
    it('draws a string from the library ConfigProvider sets', () => {
      render(
        <ConfigProvider iconLibrary="mdi">
          <IconButton icon="pencil" aria-label="Edit" />
        </ConfigProvider>
      );
      const [icon] = iconsOf(screen.getByRole('button'));
      expect(icon.querySelector('i')).toHaveClass('mdi', 'mdi-pencil');
    });

    it('renders an <Icon> as given', () => {
      render(
        <IconButton
          icon={<Icon name="heart" variant="regular" data-testid="given" />}
          aria-label="Favorite"
        />
      );
      const button = screen.getByRole('button');
      const icons = iconsOf(button);
      expect(icons).toHaveLength(1);
      expect(icons[0]).toBe(screen.getByTestId('given'));
      expect(icons[0].querySelector('i')).toHaveClass('far', 'fa-heart');
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    });

    it('wraps any other node in an Icon', () => {
      render(
        <IconButton
          icon={<svg data-testid="glyph" viewBox="0 0 24 24" />}
          aria-label="Share"
        />
      );
      const button = screen.getByRole('button');
      const icons = iconsOf(button);
      expect(icons).toHaveLength(1);
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('glyph').parentElement).toBe(icons[0]);
    });

    it('wraps a component that is not Icon', () => {
      const ShareIcon = () => <svg data-testid="share" />;
      render(<IconButton icon={<ShareIcon />} aria-label="Share" />);
      expect(screen.getByTestId('share').parentElement).toHaveClass('icon');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['false', false],
      ['an empty string', ''],
    ])('draws nothing for %s, and warns once', (_, icon) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<IconButton icon={icon} aria-label="Nothing" />);
      render(<IconButton icon={icon} aria-label="Nothing" />);
      expect(screen.getAllByRole('button')[0].children).toHaveLength(0);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/has no glyph/);
    });

    it('opens a Fragment, so an <Icon> in one renders as given', () => {
      render(
        <IconButton
          icon={
            <>
              <Icon name="cog" data-testid="given" />
            </>
          }
          aria-label="Settings"
        />
      );
      const button = screen.getByRole('button');
      expect(button.children).toHaveLength(1);
      expect(button.children[0]).toBe(screen.getByTestId('given'));
    });

    it('puts several nodes in one Icon, so the button holds one .icon', () => {
      render(
        <IconButton
          icon={[<svg key="a" data-testid="a" />, <svg key="b" />]}
          aria-label="Layers"
        />
      );
      const button = screen.getByRole('button');
      expect(button.children).toHaveLength(1);
      expect(button.children[0]).toHaveClass('icon');
      expect(button.children[0].children).toHaveLength(2);
    });
  });

  describe('the icon as children', () => {
    it('renders an <Icon> as given, the way Mantine, MUI and Chakra take it', () => {
      render(
        <IconButton aria-label="Settings">
          <Icon name="cog" data-testid="given" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.children).toHaveLength(1);
      expect(button.children[0]).toBe(screen.getByTestId('given'));
      expect(button.children[0].querySelector('i')).toHaveClass('fa-cog');
    });

    it('wraps any other node in an Icon, as icon does', () => {
      render(
        <IconButton aria-label="Share">
          <svg data-testid="glyph" viewBox="0 0 24 24" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      const icons = iconsOf(button);
      expect(button.children).toHaveLength(1);
      expect(icons).toHaveLength(1);
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('glyph').parentElement).toBe(icons[0]);
    });

    it.each([
      ['null', null],
      ['false', false],
      ['an empty Fragment', <React.Fragment key="empty" />],
    ])('draws nothing for %s, and warns once', (_, children) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<IconButton aria-label="Nothing">{children}</IconButton>);
      render(<IconButton aria-label="Nothing">{children}</IconButton>);
      expect(screen.getAllByRole('button')[0].children).toHaveLength(0);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/has no glyph/);
    });

    it('draws icon and leaves the children out when both are given', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <IconButton icon="bell" aria-label="Notifications">
          <span data-testid="extra" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.children).toHaveLength(1);
      expect(button.children[0].querySelector('i')).toHaveClass('fa-bell');
      expect(screen.queryByTestId('extra')).toBeNull();
    });

    it('draws the children when icon draws nothing, and warns about neither', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <IconButton icon={<></>} aria-label="Settings">
            <Icon name="cog" data-testid="cog" />
          </IconButton>
          <IconButton icon="  " aria-label="Bell">
            <Icon name="bell" data-testid="bell" />
          </IconButton>
        </>
      );
      expect(screen.getByRole('button', { name: 'Settings' }).children[0]).toBe(
        screen.getByTestId('cog')
      );
      expect(screen.getByRole('button', { name: 'Bell' }).children[0]).toBe(
        screen.getByTestId('bell')
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it("doesn't count empty children as a second glyph", () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <IconButton icon="bell" aria-label="Notifications">
          {[]}
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.children).toHaveLength(1);
      expect(button.children[0].querySelector('i')).toHaveClass('fa-bell');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('type', () => {
    it('is button by default, so it never submits the form around it', () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <IconButton icon="trash" aria-label="Delete" />
        </form>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it.each(['submit', 'reset', 'button'] as const)('keeps %s', type => {
      render(<IconButton icon="search" aria-label="Search" type={type} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', type);
    });

    it('submits with type="submit"', () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <IconButton icon="search" aria-label="Search" type="submit" />
        </form>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('turns a value HTML would read as submit into button', () => {
      const props = { type: 'text/html' } as unknown as { type: 'button' };
      render(<IconButton icon="x" aria-label="Close" {...props} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('keeps button when a spread carries type: undefined', () => {
      const props = { type: undefined };
      render(<IconButton icon="x" aria-label="Close" {...props} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('treats as="button" as a button', () => {
      render(<IconButton as="button" icon="x" aria-label="Close" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('passes type through untouched on an anchor', () => {
      render(
        <>
          <IconButton
            as="a"
            href="/report.pdf"
            type="application/pdf"
            icon="download"
            aria-label="Download"
          />
          <IconButton as="a" href="/x" icon="cog" aria-label="Settings" />
        </>
      );
      expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
        'type',
        'application/pdf'
      );
      expect(
        screen.getByRole('link', { name: 'Settings' })
      ).not.toHaveAttribute('type');
    });

    it('passes type through untouched to a custom component', () => {
      render(
        <IconButton
          as={RouterLink}
          to="/home"
          type="text/html"
          icon="home"
          aria-label="Home"
        />
      );
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveAttribute('href', '/home');
      expect(link).toHaveAttribute('data-type', 'text/html');
      expect(link).toHaveClass('button', 'icon-button');
    });
  });

  describe("Button's props", () => {
    it('reach Button: color, size and the shape and fill modifiers', () => {
      render(
        <IconButton
          icon="trash"
          aria-label="Delete"
          color="danger"
          size="small"
          isRounded
          isLight
          isOutlined
          isInverted
          isFullwidth
          isFocused
          isHovered
          isActive
          isStatic
        />
      );
      expect(screen.getByRole('button')).toHaveClass(
        'button',
        'icon-button',
        'is-danger',
        'is-small',
        'is-rounded',
        'is-light',
        'is-outlined',
        'is-inverted',
        'is-fullwidth',
        'is-focused',
        'is-hovered',
        'is-active',
        'is-static'
      );
    });

    it('reach Button: the helper props', () => {
      render(
        <IconButton
          icon="trash"
          aria-label="Delete"
          m="2"
          textColor="danger"
          bgColor="light"
        />
      );
      expect(screen.getByRole('button')).toHaveClass(
        'm-2',
        'has-text-danger',
        'has-background-light'
      );
    });

    it('keeps focus while loading, with the icon behind the spinner', () => {
      render(<IconButton icon="trash" aria-label="Delete" isLoading />);
      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button).toHaveClass('is-loading');
      expect(button).not.toBeDisabled();
      button.focus();
      expect(button).toHaveFocus();
      expect(iconsOf(button)).toHaveLength(1);
    });

    it('disables with isDisabled, as Button does', () => {
      const onClick = vi.fn();
      render(
        <IconButton
          icon="trash"
          aria-label="Delete"
          isDisabled
          onClick={onClick}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('is-disabled');
    });

    it('calls onClick', () => {
      const onClick = vi.fn();
      render(<IconButton icon="trash" aria-label="Delete" onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders as an anchor with as="a"', () => {
      render(
        <IconButton
          as="a"
          href="/settings"
          target="_blank"
          icon="cog"
          aria-label="Settings"
        />
      );
      const link = screen.getByRole('link', { name: 'Settings' });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/settings');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveClass('button', 'icon-button');
      expect(iconsOf(link)).toHaveLength(1);
    });
  });

  describe('ref', () => {
    it('reaches the <button>', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<IconButton ref={ref} icon="trash" aria-label="Delete" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole('button'));
    });

    it('reaches the element as renders', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(
        <IconButton as="a" href="/x" ref={ref} icon="cog" aria-label="Go" />
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  it('prefixes every class under ConfigProvider classPrefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <IconButton
          icon="trash"
          aria-label="Delete"
          color="danger"
          size="small"
          isRounded
          m="2"
        />
      </ConfigProvider>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'bestax-button',
      'bestax-icon-button',
      'bestax-is-danger',
      'bestax-is-small',
      'bestax-is-rounded',
      'bestax-m-2'
    );
    expect(button).not.toHaveClass('button', 'icon-button');
    const [icon] = Array.from(button.children);
    expect(icon).toHaveClass('bestax-icon');
    expect(icon).not.toHaveClass('icon');
  });

  describe('development warnings', () => {
    const named = /has no accessible name/;
    const text = /was given text as children/;

    it.each([
      ['an empty aria-label', { 'aria-label': '' }],
      ['a blank aria-label', { 'aria-label': '   ' }],
      ['a blank aria-labelledby', { 'aria-labelledby': ' ' }],
      ['no name at all', {}],
    ])('warns once about %s', (_, name) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const props = untyped({ icon: 'trash', ...name });
      const { rerender } = render(<IconButton {...props} />);
      rerender(<IconButton {...props} />);
      render(<IconButton {...props} />);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(named);
    });

    it.each([
      ['aria-label', { 'aria-label': 'Delete' }],
      ['aria-labelledby', { 'aria-labelledby': 'label' }],
    ])("doesn't warn when it's named with %s", (_, name) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const props = untyped({ icon: 'trash', ...name });
      render(<IconButton {...props} />);
      expect(warn).not.toHaveBeenCalled();
    });

    it.each([
      ['a string', 'Delete'],
      ['a number', 3],
      [
        'a string in a Fragment',
        <React.Fragment key="fragment">
          <Icon name="trash" />
          <>Delete</>
        </React.Fragment>,
      ],
    ])('warns once about text in children: %s', (_, children) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<IconButton aria-label="Delete">{children}</IconButton>);
      render(<IconButton aria-label="Delete">{children}</IconButton>);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(text);
    });

    it('still draws text in children inside an Icon, hidden from the name', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<IconButton aria-label="Delete">Remove</IconButton>);
      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button.children).toHaveLength(1);
      expect(button.children[0]).toHaveClass('icon');
      expect(button.children[0]).toHaveAttribute('aria-hidden', 'true');
    });

    it('warns once when given both icon and children', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const both = (
        <IconButton icon="bell" aria-label="Notifications">
          <Icon name="envelope" />
        </IconButton>
      );
      const { rerender } = render(both);
      rerender(both);
      render(both);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/both icon and children/);
    });

    it("doesn't warn about a glyph, or draw the spaces around it", () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <IconButton aria-label="Settings">
          {' '}
          <Icon name="cog" data-testid="cog" />{' '}
        </IconButton>
      );
      expect(warn).not.toHaveBeenCalled();
      const button = screen.getByRole('button');
      expect(button.querySelectorAll('.icon')).toHaveLength(1);
      expect(button.children[0]).toBe(screen.getByTestId('cog'));
    });

    it('stays quiet in production', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const props = untyped({ icon: 'trash' });
        render(<IconButton {...props}>Delete</IconButton>);
      } finally {
        process.env.NODE_ENV = previous;
      }
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('hydrates without a mismatch', async () => {
    const tree = (
      <IconButton icon="trash" aria-label="Delete" color="danger" isRounded />
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);
    const before = container.innerHTML;
    expect(before).toContain('type="button"');
    expect(before).toContain('aria-hidden="true"');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, tree);
        unmountRoot = () => root.unmount();
      });
      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe(before);
    } finally {
      await act(async () => unmountRoot());
      document.body.removeChild(container);
    }
  });
});
