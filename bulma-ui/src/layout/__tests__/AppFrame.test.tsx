import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  AppFrame,
  AppFrameAside,
  AppFrameBurger,
  AppFrameFooter,
  AppFrameHeader,
  AppFrameMain,
  AppFrameNav,
  useAppFrame,
  type AppFrameProps,
  type AppFrameNavProps,
} from '../AppFrame';
import { Navbar } from '../../components/Navbar';
import { Menu } from '../../components/Menu';
import { Popover } from '../../components/Popover';
import { Modal } from '../../components/Modal';
import { Sidebar } from '../../components/Sidebar';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

/**
 * A window `width` pixels wide, as `matchMedia` answers the queries the
 * frame asks: each comma-separated part is a min-width, and a part with
 * none (`print`) never matches. Carousel's tests answer them the same way.
 * It keeps the queries asked, in `queries`.
 */
const mockViewport = (initialWidth: number) => {
  let width = initialWidth;
  const listeners: (() => void)[] = [];
  const queries: string[] = [];
  const matches = (query: string) =>
    query.split(',').some(part => {
      const min = /min-width:\s*(\d+)px/.exec(part);
      return !!min && width >= Number(min[1]);
    });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => {
      queries.push(query);
      return {
        media: query,
        get matches() {
          return matches(query);
        },
        addEventListener: (_type: string, fn: () => void) => listeners.push(fn),
        removeEventListener: (_type: string, fn: () => void) =>
          listeners.splice(listeners.indexOf(fn), 1),
      };
    },
  });
  return {
    queries,
    resize(next: number) {
      width = next;
      act(() => {
        [...new Set(listeners)].forEach(fn => fn());
      });
    },
  };
};

const PHONE = 375;
const DESKTOP = 1280;

beforeEach(() => {
  resetDevWarnings();
});

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
  document.body.style.overflow = '';
});

/** A whole frame, with the props given to the root and to the nav. */
const Frame = ({
  nav,
  ...props
}: AppFrameProps & { nav?: AppFrameNavProps }) => (
  <AppFrame {...props}>
    <AppFrame.Header>
      <Navbar aria-label="Site">
        <Navbar.Brand>
          <Navbar.Item href="#home">Acme</Navbar.Item>
          <AppFrame.Burger />
        </Navbar.Brand>
      </Navbar>
    </AppFrame.Header>
    <AppFrame.Nav {...nav}>
      <a href="#dashboard">Dashboard</a>
      <a href="#orders">Orders</a>
      <button type="button">Filter</button>
    </AppFrame.Nav>
    <AppFrame.Main>
      <a href="#page">Page link</a>
    </AppFrame.Main>
    <AppFrame.Footer>
      <a href="#footer">Footer link</a>
    </AppFrame.Footer>
  </AppFrame>
);

const burger = () => screen.getByRole('button', { name: 'menu' });
const nav = () => document.querySelector('nav.app-frame-nav') as HTMLElement;
const root = () => document.querySelector('.app-frame') as HTMLElement;
const link = (name: string) => screen.getByRole('link', { name });

/** A phone-width frame with its drawer opened from the burger. */
const openDrawer = (props: Parameters<typeof Frame>[0] = {}) => {
  mockViewport(PHONE);
  const onNavOpenChange = vi.fn();
  const view = render(<Frame onNavOpenChange={onNavOpenChange} {...props} />);
  fireEvent.click(burger());
  onNavOpenChange.mockClear();
  return { ...view, onNavOpenChange };
};

describe('AppFrame', () => {
  describe('markup', () => {
    it('renders a div with the skip link first and each part as a direct child', () => {
      render(<Frame />);
      const frame = root();
      expect(frame.localName).toBe('div');
      expect(frame).toHaveClass('app-frame', 'is-desktop');
      expect([...frame.children].map(child => child.className)).toEqual([
        'app-frame-skip-link',
        'app-frame-header',
        'app-frame-nav',
        'app-frame-backdrop',
        'app-frame-main',
        'app-frame-footer',
      ]);
    });

    it('exposes the parts as the page’s landmarks', () => {
      render(<Frame />);
      expect(screen.getByRole('banner')).toHaveClass('app-frame-header');
      expect(screen.getByRole('navigation', { name: 'Sections' })).toBe(nav());
      expect(screen.getByRole('main')).toHaveClass('app-frame-main');
      expect(screen.getByRole('contentinfo')).toHaveClass('app-frame-footer');
    });

    it('renders the aside as a complementary landmark that takes a width', () => {
      render(
        <AppFrame>
          <AppFrame.Main>Page</AppFrame.Main>
          <AppFrame.Aside aria-label="Details" width={300}>
            Details
          </AppFrame.Aside>
        </AppFrame>
      );
      const aside = screen.getByRole('complementary', { name: 'Details' });
      expect(aside).toHaveClass('app-frame-aside');
      expect(
        aside.style.getPropertyValue('--bulma-app-frame-aside-width')
      ).toBe('300px');
    });

    it('writes a string width as it is, and none without one', () => {
      render(
        <AppFrame>
          <AppFrame.Nav width="20rem">Nav</AppFrame.Nav>
          <AppFrame.Aside width="18em">Aside</AppFrame.Aside>
          <AppFrame.Main>Page</AppFrame.Main>
        </AppFrame>
      );
      expect(nav().style.getPropertyValue('--bulma-app-frame-nav-width')).toBe(
        '20rem'
      );
      expect(
        (
          document.querySelector('.app-frame-aside') as HTMLElement
        ).style.getPropertyValue('--bulma-app-frame-aside-width')
      ).toBe('18em');
      expect(
        (document.querySelector('.app-frame-main') as HTMLElement).getAttribute(
          'style'
        )
      ).toBeNull();
    });

    it('writes a number width in pixels and keeps a style of its own', () => {
      render(
        <AppFrame>
          <AppFrame.Nav width={240} style={{ color: 'red' }}>
            Nav
          </AppFrame.Nav>
        </AppFrame>
      );
      expect(nav().style.getPropertyValue('--bulma-app-frame-nav-width')).toBe(
        '240px'
      );
      expect(nav().style.color).toBe('red');
    });

    it('puts the breakpoint class on the root', () => {
      const { rerender } = render(<Frame breakpoint="tablet" />);
      expect(root()).toHaveClass('is-tablet');
      rerender(<Frame breakpoint="widescreen" />);
      expect(root()).toHaveClass('is-widescreen');
      expect(root()).not.toHaveClass('is-desktop');
    });

    it('puts a close button first in the nav and a hidden backdrop after it', () => {
      render(<Frame />);
      const close = nav().firstElementChild as HTMLElement;
      expect(close).toBe(
        screen.getByRole('button', { name: 'Close navigation' })
      );
      expect(close).toHaveClass('delete', 'is-medium', 'app-frame-close');
      expect(close).toHaveAttribute('type', 'button');
      const backdrop = nav().nextElementSibling as HTMLElement;
      expect(backdrop).toHaveClass('app-frame-backdrop');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });

    it('opens up Fragments and finds the parts inside', () => {
      render(
        <AppFrame>
          <>
            <AppFrame.Nav id="side">Nav</AppFrame.Nav>
            <AppFrame.Main id="content">Page</AppFrame.Main>
          </>
        </AppFrame>
      );
      expect(
        screen.getByRole('link', { name: 'Skip to main content' })
      ).toHaveAttribute('href', '#content');
      expect(nav()).toHaveAttribute('id', 'side');
    });

    it('forwards each ref to its element', () => {
      const refs = {
        root: createRef<HTMLDivElement>(),
        header: createRef<HTMLElement>(),
        nav: createRef<HTMLElement>(),
        main: createRef<HTMLElement>(),
        aside: createRef<HTMLElement>(),
        footer: createRef<HTMLElement>(),
        burger: createRef<HTMLButtonElement>(),
      };
      render(
        <AppFrame ref={refs.root}>
          <AppFrame.Header ref={refs.header}>
            <AppFrame.Burger ref={refs.burger} />
          </AppFrame.Header>
          <AppFrame.Nav ref={refs.nav}>Nav</AppFrame.Nav>
          <AppFrame.Main ref={refs.main}>Page</AppFrame.Main>
          <AppFrame.Aside ref={refs.aside}>Aside</AppFrame.Aside>
          <AppFrame.Footer ref={refs.footer}>Footer</AppFrame.Footer>
        </AppFrame>
      );
      expect(refs.root.current).toBe(root());
      expect(refs.header.current?.localName).toBe('header');
      expect(refs.nav.current).toBe(nav());
      expect(refs.main.current?.localName).toBe('main');
      expect(refs.aside.current?.localName).toBe('aside');
      expect(refs.footer.current?.localName).toBe('footer');
      expect(refs.burger.current).toBe(burger());
    });

    it('hands a callback ref its element, and null on unmount', () => {
      const rootRef = vi.fn();
      const navRef = vi.fn();
      const { unmount } = render(
        <AppFrame ref={rootRef}>
          <AppFrame.Nav ref={navRef}>Nav</AppFrame.Nav>
        </AppFrame>
      );
      expect(rootRef).toHaveBeenLastCalledWith(root());
      expect(navRef).toHaveBeenLastCalledWith(nav());
      unmount();
      expect(rootRef).toHaveBeenLastCalledWith(null);
      expect(navRef).toHaveBeenLastCalledWith(null);
    });

    it('passes helper props, classes and attributes to each element', () => {
      render(
        <AppFrame
          textColor="primary"
          bgColor="light"
          className="mine"
          data-testid="frame"
        >
          <AppFrame.Header m="1" className="h">
            Top
          </AppFrame.Header>
          <AppFrame.Nav p="2" className="n">
            Nav
          </AppFrame.Nav>
          <AppFrame.Main p="3" className="m">
            Page
          </AppFrame.Main>
          <AppFrame.Aside p="4" className="a">
            Aside
          </AppFrame.Aside>
          <AppFrame.Footer p="5" className="f">
            Bottom
          </AppFrame.Footer>
        </AppFrame>
      );
      expect(screen.getByTestId('frame')).toHaveClass(
        'app-frame',
        'has-text-primary',
        'has-background-light',
        'mine'
      );
      expect(screen.getByRole('banner')).toHaveClass('m-1', 'h');
      expect(nav()).toHaveClass('p-2', 'n');
      expect(screen.getByRole('main')).toHaveClass('p-3', 'm');
      expect(screen.getByRole('complementary')).toHaveClass('p-4', 'a');
      expect(screen.getByRole('contentinfo')).toHaveClass('p-5', 'f');
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      mockViewport(PHONE);
      render(
        <ConfigProvider classPrefix="bestax-">
          <Frame />
        </ConfigProvider>
      );
      fireEvent.click(burger());
      const frame = document.querySelector('.bestax-app-frame') as HTMLElement;
      expect(frame).toHaveClass(
        'bestax-app-frame',
        'bestax-is-desktop',
        'bestax-is-nav-open'
      );
      expect(frame).not.toHaveClass('app-frame');
      for (const part of [
        'skip-link',
        'header',
        'nav',
        'close',
        'backdrop',
        'main',
        'footer',
      ]) {
        expect(
          frame.querySelector(`.bestax-app-frame-${part}`)
        ).toBeInTheDocument();
        expect(frame.querySelector(`.app-frame-${part}`)).toBeNull();
      }
      expect(burger()).toHaveClass(
        'bestax-navbar-burger',
        'bestax-app-frame-burger',
        'bestax-is-active'
      );
    });

    it('renders the parts on their own outside a frame', () => {
      render(
        <>
          <AppFrame.Nav aria-label="Pages">Nav</AppFrame.Nav>
          <AppFrame.Main>Page</AppFrame.Main>
        </>
      );
      const lone = screen.getByRole('navigation', { name: 'Pages' });
      expect(lone).not.toHaveAttribute('id');
      expect(lone.querySelector('.app-frame-close')).toBeNull();
      expect(document.querySelector('.app-frame-backdrop')).toBeNull();
      expect(screen.getByRole('main')).not.toHaveAttribute('id');
    });

    it('leaves a lone nav unnamed', () => {
      render(<AppFrame.Nav>Nav</AppFrame.Nav>);
      expect(document.querySelector('nav')).not.toHaveAttribute('aria-label');
    });
  });

  describe('skip link', () => {
    it('points at main, which takes focus', () => {
      render(<Frame />);
      const skip = screen.getByRole('link', { name: 'Skip to main content' });
      const main = screen.getByRole('main');
      expect(main.id).not.toBe('');
      expect(skip).toHaveAttribute('href', `#${main.id}`);
      expect(main).toHaveAttribute('tabindex', '-1');
    });

    it('uses main’s own id', () => {
      render(
        <AppFrame>
          <AppFrame.Main id="content">Page</AppFrame.Main>
        </AppFrame>
      );
      expect(screen.getByRole('main')).toHaveAttribute('id', 'content');
      expect(
        screen.getByRole('link', { name: 'Skip to main content' })
      ).toHaveAttribute('href', '#content');
    });

    it('lets main’s tabIndex be set', () => {
      render(
        <AppFrame>
          <AppFrame.Main tabIndex={0}>Page</AppFrame.Main>
        </AppFrame>
      );
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '0');
    });

    it('is left out with skipLink={false}', () => {
      render(<Frame skipLink={false} />);
      expect(
        screen.queryByRole('link', { name: 'Skip to main content' })
      ).toBeNull();
      expect(root().firstElementChild).toHaveClass('app-frame-header');
    });

    it('points at a generated id when there is no main', () => {
      render(<AppFrame>Nothing</AppFrame>);
      expect(
        screen.getByRole('link', { name: 'Skip to main content' })
      ).toHaveAttribute('href', expect.stringMatching(/^#.+-main$/));
    });
  });

  describe('labels', () => {
    it('replaces each string, and keeps a default for an empty one', () => {
      render(
        <Frame
          labels={{
            skipLink: 'Zum Inhalt',
            nav: 'Bereiche',
            closeNav: 'Navigation schließen',
            burger: 'Menü',
          }}
        />
      );
      expect(screen.getByRole('link', { name: 'Zum Inhalt' })).toBeTruthy();
      expect(screen.getByRole('navigation', { name: 'Bereiche' })).toBe(nav());
      expect(
        screen.getByRole('button', { name: 'Navigation schließen' })
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Menü' })).toHaveClass(
        'app-frame-burger'
      );
    });

    it('falls back to its defaults for empty strings', () => {
      render(
        <Frame labels={{ skipLink: '', nav: '', closeNav: '', burger: '' }} />
      );
      expect(
        screen.getByRole('link', { name: 'Skip to main content' })
      ).toBeTruthy();
      expect(screen.getByRole('navigation', { name: 'Sections' })).toBe(nav());
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toBeTruthy();
      expect(burger()).toBeTruthy();
    });

    it('lets the nav’s own aria-label win, and aria-labelledby replace it', () => {
      const { rerender } = render(
        <Frame nav={{ 'aria-label': 'Admin sections' }} />
      );
      expect(screen.getByRole('navigation', { name: 'Admin sections' })).toBe(
        nav()
      );
      rerender(<Frame nav={{ 'aria-labelledby': 'brand' }} />);
      expect(nav()).not.toHaveAttribute('aria-label');
      expect(nav()).toHaveAttribute('aria-labelledby', 'brand');
    });

    it('lets the burger’s own aria-label win', () => {
      render(
        <AppFrame labels={{ burger: 'Menu' }}>
          <AppFrame.Burger aria-label="Sections menu" />
        </AppFrame>
      );
      expect(
        screen.getByRole('button', { name: 'Sections menu' })
      ).toBeTruthy();
    });
  });

  describe('the burger', () => {
    it('controls the nav, by its own id or a generated one', () => {
      const { rerender } = render(<Frame />);
      expect(burger()).toHaveAttribute('aria-controls', nav().id);
      expect(nav().id).not.toBe('');
      rerender(<Frame nav={{ id: 'side' }} />);
      expect(nav()).toHaveAttribute('id', 'side');
      expect(burger()).toHaveAttribute('aria-controls', 'side');
    });

    it('renders Navbar.Burger with the frame’s class, and a class of its own', () => {
      render(
        <AppFrame>
          <AppFrame.Burger className="mine" textColor="danger" />
        </AppFrame>
      );
      expect(burger()).toHaveClass(
        'navbar-burger',
        'app-frame-burger',
        'mine',
        'has-text-danger'
      );
      expect(burger()).toHaveAttribute('type', 'button');
    });

    it('collapses and expands the column at a desktop width', () => {
      mockViewport(DESKTOP);
      const onNavCollapsedChange = vi.fn();
      const onNavOpenChange = vi.fn();
      render(
        <Frame
          onNavCollapsedChange={onNavCollapsedChange}
          onNavOpenChange={onNavOpenChange}
        />
      );
      expect(burger()).toHaveAttribute('aria-expanded', 'true');
      expect(burger()).toHaveClass('is-active');
      fireEvent.click(burger());
      expect(onNavCollapsedChange).toHaveBeenLastCalledWith(true);
      expect(root()).toHaveClass('is-nav-collapsed');
      expect(burger()).toHaveAttribute('aria-expanded', 'false');
      expect(burger()).not.toHaveClass('is-active');
      fireEvent.click(burger());
      expect(onNavCollapsedChange).toHaveBeenLastCalledWith(false);
      expect(root()).not.toHaveClass('is-nav-collapsed');
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('treats the width as wide until it has been read', () => {
      render(<Frame />);
      expect(burger()).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(burger());
      expect(root()).toHaveClass('is-nav-collapsed');
    });

    it('opens and closes the drawer at a phone width', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      const onNavCollapsedChange = vi.fn();
      render(
        <Frame
          onNavOpenChange={onNavOpenChange}
          onNavCollapsedChange={onNavCollapsedChange}
        />
      );
      expect(burger()).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(burger());
      expect(onNavOpenChange).toHaveBeenLastCalledWith(true);
      expect(root()).toHaveClass('is-nav-open');
      expect(burger()).toHaveAttribute('aria-expanded', 'true');
      act(() => burger().click());
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
      expect(root()).not.toHaveClass('is-nav-open');
      expect(onNavCollapsedChange).not.toHaveBeenCalled();
    });

    it('watches the one media query of its breakpoint', () => {
      const viewport = mockViewport(DESKTOP);
      render(<Frame breakpoint="tablet" />);
      expect([...new Set(viewport.queries)]).toEqual([
        'screen and (min-width: 769px), print',
      ]);
    });

    it('switches at the breakpoint it is given', () => {
      mockViewport(900);
      expect(isDrawerAt('tablet')).toBe(false);
      expect(isDrawerAt('desktop')).toBe(true);
      expect(isDrawerAt('widescreen')).toBe(true);
    });

    it('calls its own onClick first, and does nothing more when it prevents the default', () => {
      const onNavCollapsedChange = vi.fn();
      const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
      render(
        <AppFrame onNavCollapsedChange={onNavCollapsedChange}>
          <AppFrame.Burger onClick={onClick} />
        </AppFrame>
      );
      fireEvent.click(burger());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onNavCollapsedChange).not.toHaveBeenCalled();
    });

    it('controls nothing outside a frame', () => {
      const onClick = vi.fn();
      render(<AppFrame.Burger onClick={onClick} />);
      // Navbar.Burger's own default: it follows `active`, which is off.
      expect(burger()).toHaveAttribute('aria-expanded', 'false');
      expect(burger()).not.toHaveAttribute('aria-controls');
      expect(burger()).toHaveClass('navbar-burger', 'app-frame-burger');
      expect(burger()).not.toHaveClass('is-active');
      fireEvent.click(burger());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(burger()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('state', () => {
    it('starts from defaultNavOpen and defaultNavCollapsed', () => {
      mockViewport(PHONE);
      render(<Frame defaultNavOpen defaultNavCollapsed />);
      expect(root()).toHaveClass('is-nav-open', 'is-nav-collapsed');
      expect(burger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('leaves a controlled navOpen to its owner', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      const { rerender } = render(
        <Frame navOpen={false} onNavOpenChange={onNavOpenChange} />
      );
      fireEvent.click(burger());
      expect(onNavOpenChange).toHaveBeenLastCalledWith(true);
      expect(root()).not.toHaveClass('is-nav-open');
      rerender(<Frame navOpen onNavOpenChange={onNavOpenChange} />);
      expect(root()).toHaveClass('is-nav-open');
    });

    it('leaves a controlled navCollapsed to its owner', () => {
      mockViewport(DESKTOP);
      const onNavCollapsedChange = vi.fn();
      const { rerender } = render(
        <Frame
          navCollapsed={false}
          onNavCollapsedChange={onNavCollapsedChange}
        />
      );
      fireEvent.click(burger());
      expect(onNavCollapsedChange).toHaveBeenLastCalledWith(true);
      expect(root()).not.toHaveClass('is-nav-collapsed');
      rerender(
        <Frame navCollapsed onNavCollapsedChange={onNavCollapsedChange} />
      );
      expect(root()).toHaveClass('is-nav-collapsed');
      expect(burger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the drawer once the window is at the breakpoint', () => {
      const viewport = mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      render(<Frame onNavOpenChange={onNavOpenChange} />);
      fireEvent.click(burger());
      expect(document.body.style.overflow).toBe('hidden');
      viewport.resize(DESKTOP);
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
      expect(root()).not.toHaveClass('is-nav-open');
      expect(document.body.style.overflow).toBe('');
      expect(screen.getByRole('banner')).not.toHaveAttribute('inert');
    });

    it('asks a frame that starts open on a desktop to close', () => {
      mockViewport(DESKTOP);
      const onNavOpenChange = vi.fn();
      render(<Frame navOpen onNavOpenChange={onNavOpenChange} />);
      expect(onNavOpenChange).toHaveBeenCalledWith(false);
      // A controlled open state is its owner's, and nothing of the drawer runs.
      expect(root()).toHaveClass('is-nav-open');
      expect(document.body.style.overflow).toBe('');
    });

    it('reads the latest callbacks', () => {
      mockViewport(PHONE);
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<Frame onNavOpenChange={first} />);
      rerender(<Frame onNavOpenChange={second} />);
      fireEvent.click(burger());
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(true);
    });
  });

  describe('useAppFrame', () => {
    const Toggle = () => {
      const frame = useAppFrame();
      return (
        <>
          <button
            type="button"
            aria-controls={frame.navId}
            aria-expanded={frame.isDrawer ? frame.navOpen : !frame.navCollapsed}
            onClick={frame.toggleNav}
          >
            Toggle
          </button>
          <button type="button" onClick={() => frame.setNavOpen(true)}>
            Open
          </button>
          <button
            type="button"
            onClick={() => frame.setNavCollapsed(!frame.navCollapsed)}
          >
            Collapse
          </button>
          <output>
            {JSON.stringify({
              navOpen: frame.navOpen,
              navCollapsed: frame.navCollapsed,
              isDrawer: frame.isDrawer,
            })}
          </output>
        </>
      );
    };
    const state = () => JSON.parse(screen.getByRole('status').textContent!);

    it('gives a control of its own the state and the toggle', () => {
      mockViewport(PHONE);
      render(
        <AppFrame>
          <AppFrame.Header>
            <Toggle />
          </AppFrame.Header>
          <AppFrame.Nav id="side">Nav</AppFrame.Nav>
        </AppFrame>
      );
      const toggle = screen.getByRole('button', { name: 'Toggle' });
      expect(toggle).toHaveAttribute('aria-controls', 'side');
      expect(state()).toEqual({
        navOpen: false,
        navCollapsed: false,
        isDrawer: true,
      });
      fireEvent.click(toggle);
      expect(state().navOpen).toBe(true);
    });

    it('sets each state on its own', () => {
      mockViewport(DESKTOP);
      render(
        <AppFrame>
          <Toggle />
        </AppFrame>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      expect(state().navCollapsed).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      // Open is asked for, and at a desktop width it's asked to close again.
      expect(state().navOpen).toBe(false);
    });

    it('throws outside a frame', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Toggle />)).toThrow(
        '[bestax-bulma] useAppFrame() must be used inside <AppFrame>.'
      );
      error.mockRestore();
    });
  });

  describe('the drawer', () => {
    it('moves focus to its close button and back to the burger', () => {
      const { onNavOpenChange } = openDrawer();
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toHaveFocus();
      fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
      expect(burger()).toHaveFocus();
    });

    it('focuses the burger as it is pressed, which a pointer press may not', () => {
      openDrawer();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(burger()).toHaveFocus();
    });

    it('hands focus back to whatever had it as it opened', () => {
      mockViewport(PHONE);
      const Opener = () => {
        const { setNavOpen } = useAppFrame();
        return (
          <button type="button" onClick={() => setNavOpen(true)}>
            Open sections
          </button>
        );
      };
      render(
        <AppFrame>
          <AppFrame.Nav>
            <a href="#a">A</a>
          </AppFrame.Nav>
          <AppFrame.Main>
            <Opener />
          </AppFrame.Main>
        </AppFrame>
      );
      const opener = screen.getByRole('button', { name: 'Open sections' });
      opener.focus();
      fireEvent.click(opener);
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toHaveFocus();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(opener).toHaveFocus();
    });

    it('leaves focus where it went once it left the drawer', () => {
      openDrawer({ nav: { overlay: false } });
      link('Page link').focus();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(link('Page link')).toHaveFocus();
    });

    it('holds the page while it is open: inert, scroll locked, Tab inside', () => {
      openDrawer();
      for (const part of ['skip-link', 'header', 'main', 'footer']) {
        expect(document.querySelector(`.app-frame-${part}`)).toHaveAttribute(
          'inert'
        );
      }
      // The backdrop stays live, to take the presses outside the drawer.
      expect(document.querySelector('.app-frame-backdrop')).not.toHaveAttribute(
        'inert'
      );
      expect(nav()).not.toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('hidden');
      // Tab from the last stop wraps to the first, the close button.
      const filter = screen.getByRole('button', { name: 'Filter' });
      filter.focus();
      fireEvent.keyDown(filter, { key: 'Tab' });
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toHaveFocus();
    });

    it('leaves what renders outside the frame live, such as a Modal portaled from the nav', () => {
      mockViewport(PHONE);
      render(
        <>
          <AppFrame>
            <AppFrame.Header>
              <AppFrame.Burger />
            </AppFrame.Header>
            <AppFrame.Nav>
              <Modal active={false} aria-label="Editor">
                <button type="button">Save</button>
              </Modal>
            </AppFrame.Nav>
            <AppFrame.Main>Page</AppFrame.Main>
          </AppFrame>
          <div data-testid="beside">Beside the frame</div>
        </>
      );
      fireEvent.click(burger());
      expect(screen.getByRole('banner')).toHaveAttribute('inert');
      expect(screen.getByTestId('beside')).not.toHaveAttribute('inert');
      expect(document.querySelector('.modal')).not.toHaveAttribute('inert');
    });

    it('lets the page go as it closes', () => {
      openDrawer();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByRole('banner')).not.toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('');
    });

    it('closes on Escape, marking it used', () => {
      const { onNavOpenChange } = openDrawer();
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        cancelable: true,
      });
      act(() => {
        window.dispatchEvent(escape);
      });
      expect(escape.defaultPrevented).toBe(true);
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('leaves other keys, a used Escape and closeOnEscape={false} alone', () => {
      const { onNavOpenChange, rerender } = openDrawer();
      fireEvent.keyDown(window, { key: 'Enter' });
      const used = new KeyboardEvent('keydown', {
        key: 'Escape',
        cancelable: true,
      });
      used.preventDefault();
      act(() => {
        window.dispatchEvent(used);
      });
      expect(onNavOpenChange).not.toHaveBeenCalled();
      rerender(
        <Frame
          onNavOpenChange={onNavOpenChange}
          nav={{ closeOnEscape: false }}
        />
      );
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('stays open under a Modal opened from it, which takes a press and Escape first', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      const Page = () => {
        const [modal, setModal] = useState(false);
        return (
          <AppFrame onNavOpenChange={onNavOpenChange}>
            <AppFrame.Header>
              <AppFrame.Burger />
            </AppFrame.Header>
            <AppFrame.Nav>
              <button type="button" onClick={() => setModal(true)}>
                Edit
              </button>
              <Modal
                active={modal}
                onClose={() => setModal(false)}
                aria-label="Editor"
              >
                <button type="button">Save</button>
              </Modal>
            </AppFrame.Nav>
          </AppFrame>
        );
      };
      render(<Page />);
      fireEvent.click(burger());
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      // The Modal is portaled out of the nav, but it's still the nav's.
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Save' }));
      expect(onNavOpenChange).toHaveBeenLastCalledWith(true);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Editor' })).toBeNull();
      expect(onNavOpenChange).toHaveBeenLastCalledWith(true);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('leaves a press in a Modal opened over it, from elsewhere in the page, to the Modal', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      const Page = () => {
        const [modal, setModal] = useState(false);
        return (
          <AppFrame onNavOpenChange={onNavOpenChange}>
            <AppFrame.Header>
              <AppFrame.Burger />
            </AppFrame.Header>
            <AppFrame.Nav overlay={false}>
              <button type="button" onClick={() => setModal(true)}>
                New project
              </button>
            </AppFrame.Nav>
            <AppFrame.Main>
              <Modal
                portal
                active={modal}
                onClose={() => setModal(false)}
                aria-label="New project"
              >
                <button type="button">Create</button>
              </Modal>
            </AppFrame.Main>
          </AppFrame>
        );
      };
      render(<Page />);
      fireEvent.click(burger());
      fireEvent.click(screen.getByRole('button', { name: 'New project' }));
      const create = screen.getByRole('button', { name: 'Create' });
      expect(create.closest('[inert]')).toBeNull();
      fireEvent.pointerDown(create);
      expect(onNavOpenChange).toHaveBeenLastCalledWith(true);
    });

    it('closes on a press outside, not one inside or on the burger', () => {
      const { onNavOpenChange } = openDrawer({ nav: { overlay: false } });
      fireEvent.pointerDown(screen.getByRole('link', { name: 'Dashboard' }));
      fireEvent.pointerDown(burger());
      expect(onNavOpenChange).not.toHaveBeenCalled();
      fireEvent.pointerDown(link('Page link'));
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('calls a pointerdown capture handler of its own', () => {
      const onPointerDownCapture = vi.fn();
      const { onNavOpenChange } = openDrawer({
        nav: { onPointerDownCapture },
      });
      fireEvent.pointerDown(screen.getByRole('link', { name: 'Orders' }));
      expect(onPointerDownCapture).toHaveBeenCalledTimes(1);
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('stays open on a press outside with closeOnClickOutside={false}', () => {
      const { onNavOpenChange, rerender } = openDrawer({
        nav: { closeOnClickOutside: false },
      });
      fireEvent.click(document.querySelector('.app-frame-backdrop') as Element);
      rerender(
        <Frame
          onNavOpenChange={onNavOpenChange}
          nav={{ closeOnClickOutside: false, overlay: false }}
        />
      );
      fireEvent.pointerDown(link('Page link'));
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('closes on a click on the backdrop, with focus back on the burger', () => {
      const { onNavOpenChange } = openDrawer();
      // A press on the backdrop leaves nothing focused, then clicks.
      (document.activeElement as HTMLElement).blur();
      fireEvent.click(document.querySelector('.app-frame-backdrop') as Element);
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
      expect(burger()).toHaveFocus();
    });

    it('takes no press outside with an overlay: the backdrop does', () => {
      const { onNavOpenChange } = openDrawer();
      fireEvent.pointerDown(document.body);
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('hands focus to the burger after a press outside without an overlay', () => {
      const { onNavOpenChange } = openDrawer({ nav: { overlay: false } });
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toHaveFocus();
      // A pointerdown with no mousedown after it, as a touch that scrolls.
      // In a browser, a mousedown would then move focus where the press went.
      fireEvent.pointerDown(link('Page link'));
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
      expect(burger()).toHaveFocus();
    });

    it('leaves focus in the nav when the window widens and it becomes the column', () => {
      const viewport = mockViewport(PHONE);
      render(<Frame />);
      fireEvent.click(burger());
      link('Orders').focus();
      viewport.resize(DESKTOP);
      expect(root()).not.toHaveClass('is-nav-open');
      expect(link('Orders')).toHaveFocus();
    });

    it('hands focus to the burger when the window widens with it on the close button', () => {
      const viewport = mockViewport(PHONE);
      render(<Frame />);
      fireEvent.click(burger());
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toHaveFocus();
      // The close button hides in the column, so focus can't stay on it.
      viewport.resize(DESKTOP);
      expect(root()).not.toHaveClass('is-nav-open');
      expect(burger()).toHaveFocus();
    });

    it('hands focus to the burger when the window widens with it dropped to the page', () => {
      const viewport = mockViewport(PHONE);
      render(<Frame />);
      fireEvent.click(burger());
      (document.activeElement as HTMLElement).blur();
      viewport.resize(DESKTOP);
      expect(burger()).toHaveFocus();
    });

    it('leaves the backdrop alone under an overlay opened over the drawer', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      const Page = () => {
        const [help, setHelp] = useState(false);
        return (
          <AppFrame onNavOpenChange={onNavOpenChange}>
            <AppFrame.Header>
              <AppFrame.Burger />
            </AppFrame.Header>
            <AppFrame.Nav>
              <button type="button" onClick={() => setHelp(true)}>
                Help
              </button>
              <Sidebar
                isOpen={help}
                overlay={false}
                onClose={() => setHelp(false)}
                aria-label="Help"
              >
                <button type="button">Got it</button>
              </Sidebar>
            </AppFrame.Nav>
          </AppFrame>
        );
      };
      render(<Page />);
      fireEvent.click(burger());
      fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      onNavOpenChange.mockClear();
      const backdrop = document.querySelector('.app-frame-backdrop') as Element;
      fireEvent.click(backdrop);
      expect(onNavOpenChange).not.toHaveBeenCalled();
      // Closed, the Sidebar leaves the drawer on top again.
      fireEvent.keyDown(window, { key: 'Escape' });
      fireEvent.click(backdrop);
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('leaves focus alone when it opens without an overlay over a modal overlay', () => {
      mockViewport(PHONE);
      render(
        <>
          <Modal active aria-label="Editor">
            <button type="button">Save</button>
          </Modal>
          <Frame nav={{ overlay: false }} />
        </>
      );
      fireEvent.click(burger());
      expect(root()).toHaveClass('is-nav-open');
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).not.toHaveFocus();
      expect(burger()).toHaveFocus();
    });

    it('closes when a link in it is followed with a plain click', () => {
      const { onNavOpenChange } = openDrawer();
      fireEvent.click(screen.getByRole('link', { name: 'Orders' }));
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('closes when a link it holds is followed even if a router prevented the default', () => {
      const { onNavOpenChange } = openDrawer();
      const orders = screen.getByRole('link', { name: 'Orders' });
      orders.addEventListener('click', e => e.preventDefault());
      fireEvent.click(orders);
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it.each([
      ['a modifier key', { metaKey: true }],
      ['Ctrl', { ctrlKey: true }],
      ['Shift', { shiftKey: true }],
      ['Alt', { altKey: true }],
      ['the middle button', { button: 1 }],
    ])('stays open for a click with %s', (_name, init) => {
      const { onNavOpenChange } = openDrawer();
      fireEvent.click(screen.getByRole('link', { name: 'Orders' }), init);
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('stays open for a link to a new window, a download, or no link at all', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      const onClick = vi.fn();
      render(
        <AppFrame onNavOpenChange={onNavOpenChange} defaultNavOpen>
          <AppFrame.Nav onClick={onClick}>
            <a href="#a" target="_blank">
              New window
            </a>
            <a href="#b" download>
              Download
            </a>
            <a href="#c" target="_self">
              Same window
            </a>
            <button type="button">Filter</button>
          </AppFrame.Nav>
        </AppFrame>
      );
      fireEvent.click(screen.getByRole('link', { name: 'New window' }));
      fireEvent.click(screen.getByRole('link', { name: 'Download' }));
      fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
      expect(onNavOpenChange).not.toHaveBeenCalled();
      expect(onClick).toHaveBeenCalledTimes(3);
      fireEvent.click(screen.getByRole('link', { name: 'Same window' }));
      expect(onNavOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('stays open for a link in a Modal portaled from it', () => {
      mockViewport(PHONE);
      const onNavOpenChange = vi.fn();
      render(
        <AppFrame onNavOpenChange={onNavOpenChange} defaultNavOpen>
          <AppFrame.Nav>
            <Modal portal active aria-label="Help">
              <a href="#help">Read the help</a>
            </Modal>
          </AppFrame.Nav>
        </AppFrame>
      );
      const help = screen.getByRole('link', { name: 'Read the help' });
      expect(nav().contains(help)).toBe(false);
      fireEvent.click(help);
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('stays open for a followed link with closeOnNavigate={false}', () => {
      const { onNavOpenChange } = openDrawer({
        nav: { closeOnNavigate: false },
      });
      fireEvent.click(screen.getByRole('link', { name: 'Orders' }));
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('does nothing on a link click while the nav is a column', () => {
      mockViewport(DESKTOP);
      const onNavOpenChange = vi.fn();
      render(<Frame onNavOpenChange={onNavOpenChange} />);
      fireEvent.click(screen.getByRole('link', { name: 'Orders' }));
      fireEvent.pointerDown(link('Page link'));
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('without an overlay: no backdrop, nothing inert or locked, focus still moves in', () => {
      openDrawer({ nav: { overlay: false } });
      expect(document.querySelector('.app-frame-backdrop')).toBeNull();
      expect(screen.getByRole('banner')).not.toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('');
      expect(
        screen.getByRole('button', { name: 'Close navigation' })
      ).toHaveFocus();
      // Tab from the last stop is the browser's: nothing wraps it.
      const filter = screen.getByRole('button', { name: 'Filter' });
      filter.focus();
      fireEvent.keyDown(filter, { key: 'Tab' });
      expect(filter).toHaveFocus();
    });
  });

  describe('development warnings', () => {
    it('warns once when the frame sits inside main or a sectioning element', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <main>
          <section>
            <Frame />
            <Frame />
          </section>
        </main>
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(
        '<AppFrame> sits inside a <section>'
      );
      warn.mockRestore();
    });

    it('stays quiet at the top of the page', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Frame />);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('warns when main or nav has an id the frame can’t read', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const Wrapped = () => (
        <>
          <AppFrame.Nav id="side">Nav</AppFrame.Nav>
          <AppFrame.Main id="content">Page</AppFrame.Main>
        </>
      );
      render(
        <AppFrame>
          <Wrapped />
        </AppFrame>
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('<AppFrame.Main> has an id')
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('the skip link misses it')
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("the burger's aria-controls misses it")
      );
      // Each keeps its own id.
      expect(screen.getByRole('main')).toHaveAttribute('id', 'content');
      expect(nav()).toHaveAttribute('id', 'side');
      warn.mockRestore();
    });
  });

  describe('server rendering', () => {
    it('renders the layout, and a burger that says nothing of a state it can’t know', () => {
      const html = renderToStaticMarkup(<Frame />);
      expect(html).toContain('class="app-frame is-desktop"');
      expect(html).toMatch(/<a class="app-frame-skip-link" href="#[^"]+-main"/);
      expect(html).toContain('aria-label="Sections"');
      const burgerTag = /<button[^>]*app-frame-burger[^>]*>/.exec(html)?.[0];
      expect(burgerTag).toBeDefined();
      expect(burgerTag).not.toContain('aria-expanded');
      expect(burgerTag).not.toContain('is-active');
      expect(burgerTag).toMatch(/aria-controls="[^"]+-nav"/);
    });

    it('keeps the burger quiet on the server even with the drawer starting open', () => {
      const html = renderToStaticMarkup(<Frame defaultNavOpen />);
      expect(html).toContain('class="app-frame is-desktop is-nav-open"');
      expect(
        /<button[^>]*app-frame-burger[^>]*>/.exec(html)?.[0]
      ).not.toContain('aria-expanded');
    });

    it('hydrates without a mismatch and reads the width before paint', async () => {
      mockViewport(PHONE);
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Frame />);
      document.body.appendChild(container);
      expect(container.querySelector('.app-frame-burger')).not.toHaveAttribute(
        'aria-expanded'
      );
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmount = () => {};
      try {
        await act(async () => {
          const hydrated = hydrateRoot(container, <Frame />);
          unmount = () => hydrated.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
        expect(container.querySelector('.app-frame-burger')).toHaveAttribute(
          'aria-expanded',
          'false'
        );
      } finally {
        await act(async () => unmount());
        errorSpy.mockRestore();
        container.remove();
      }
    });
  });

  describe('Compound components', () => {
    it('attaches each part', () => {
      expect(AppFrame.Header).toBe(AppFrameHeader);
      expect(AppFrame.Nav).toBe(AppFrameNav);
      expect(AppFrame.Main).toBe(AppFrameMain);
      expect(AppFrame.Aside).toBe(AppFrameAside);
      expect(AppFrame.Footer).toBe(AppFrameFooter);
      expect(AppFrame.Burger).toBe(AppFrameBurger);
      expect(AppFrame.displayName).toBe('AppFrame');
    });
  });
});

describe('AppFrame.Nav rail', () => {
  const Glyph = () => <svg />;

  /** A frame whose nav has a rail and a Menu of icons, a section and a nested list. */
  const RailFrame = ({
    nav,
    ...props
  }: AppFrameProps & { nav?: AppFrameNavProps }) => (
    <AppFrame {...props}>
      <AppFrame.Header>
        <AppFrame.Burger />
      </AppFrame.Header>
      <AppFrame.Nav rail {...nav}>
        <Menu>
          <Menu.Label>General</Menu.Label>
          <Menu.List>
            <Menu.Item href="#dashboard" icon={<Glyph />} active>
              Dashboard
            </Menu.Item>
            <Menu.Item href="#orders" icon={<Glyph />}>
              Orders
              <Menu.List>
                <Menu.Item href="#open">Open orders</Menu.Item>
              </Menu.List>
            </Menu.Item>
            <Menu.Item href="#plain">Plain</Menu.Item>
          </Menu.List>
          <Menu.Section label="Reports" icon={<Glyph />}>
            <Menu.List>
              <Menu.Item href="#sales">Sales</Menu.Item>
            </Menu.List>
          </Menu.Section>
        </Menu>
      </AppFrame.Nav>
      <AppFrame.Main>Page</AppFrame.Main>
    </AppFrame>
  );

  const reports = () => screen.getByRole('button', { name: 'Reports' });
  /** The tooltip wrapper around a link or a button. */
  const tipOf = (el: HTMLElement) => el.parentElement as HTMLElement;

  it('puts each item and section with an icon in a tooltip of its label, hidden from assistive technology', () => {
    mockViewport(DESKTOP);
    render(<RailFrame />);
    const dashboard = link('Dashboard');
    const tip = tipOf(dashboard);
    expect(tip).toHaveClass('tooltip', 'app-frame-rail-tooltip', 'is-right');
    // The link comes first, as the stylesheet expects.
    expect(tip.firstElementChild).toBe(dashboard);
    const content = tip.querySelector('.tooltip-content') as HTMLElement;
    expect(content).toHaveTextContent(/^Dashboard$/);
    expect(content).toHaveAttribute('aria-hidden', 'true');
    // The name isn't read twice.
    expect(dashboard).not.toHaveAttribute('aria-describedby');
    expect(tipOf(reports())).toHaveClass('app-frame-rail-tooltip');
    expect(
      tipOf(reports()).querySelector('.tooltip-content')
    ).toHaveTextContent(/^Reports$/);
    // Nothing to show for an item without an icon.
    expect(tipOf(link('Plain')).localName).toBe('li');
  });

  it('opens the tooltips only while the column is collapsed to the rail', async () => {
    mockViewport(DESKTOP);
    const { rerender } = render(<RailFrame navCollapsed={false} />);
    const dashboard = link('Dashboard');
    const tip = tipOf(dashboard);
    const content = tip.querySelector('.tooltip-content') as HTMLElement;
    const over = () => {
      const event = new MouseEvent('pointerover', { bubbles: true });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      fireEvent(dashboard, event);
    };
    const settle = () => act(() => new Promise(resolve => setTimeout(resolve)));
    over();
    await settle();
    // The wide column: nothing opens, so nothing is measured.
    expect(tip).not.toHaveClass('is-open');
    expect(content).not.toHaveAttribute('style');
    rerender(<RailFrame navCollapsed />);
    expect(tip).not.toHaveClass('is-open');
    // Collapsed, the next hover opens it.
    fireEvent(dashboard, new MouseEvent('pointerout', { bubbles: true }));
    await settle();
    over();
    await settle();
    expect(tip).toHaveClass('is-open', 'is-active');
  });

  describe('taller than the window under the header', () => {
    type Observer = { measure: () => void; disconnect: () => void };
    let observers: Observer[];

    beforeEach(() => {
      observers = [];
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
        measure: () => void;
        disconnect = vi.fn();
        constructor(callback: () => void) {
          this.measure = callback;
          observers.push(this);
        }
        observe() {}
      };
    });

    afterEach(() => {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
      vi.restoreAllMocks();
    });

    /** The nav laid out `height` pixels tall with `room` under the header. */
    const layOut = (height: number, room: number) => {
      vi.restoreAllMocks();
      const real = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
        const style = real(el, pseudo);
        if (!el.matches('.app-frame-nav')) return style;
        return {
          direction: 'ltr',
          getPropertyValue: (name: string) =>
            name === 'min-block-size'
              ? `${room}px`
              : style.getPropertyValue(name),
        } as CSSStyleDeclaration;
      });
      vi.spyOn(nav(), 'getBoundingClientRect').mockReturnValue({
        height,
      } as DOMRect);
      act(() => observers[observers.length - 1].measure());
    };

    it('scrolls with the page, and sticks again once it fits', () => {
      mockViewport(DESKTOP);
      render(<RailFrame defaultNavCollapsed />);
      expect(observers).toHaveLength(1);
      layOut(760, 368);
      expect(nav()).toHaveClass('is-rail', 'is-tall');
      layOut(668, 668);
      expect(nav()).not.toHaveClass('is-tall');
    });

    it('measures only while the column is collapsed to the rail', () => {
      mockViewport(DESKTOP);
      const { rerender } = render(<RailFrame navCollapsed={false} />);
      expect(observers).toHaveLength(0);
      rerender(<RailFrame navCollapsed />);
      expect(observers).toHaveLength(1);
      layOut(760, 368);
      rerender(<RailFrame navCollapsed={false} />);
      expect(observers[0].disconnect).toHaveBeenCalled();
      expect(nav()).not.toHaveClass('is-tall');
    });

    it('measures nothing in the drawer', () => {
      mockViewport(PHONE);
      render(<RailFrame defaultNavCollapsed />);
      expect(observers).toHaveLength(0);
    });
  });

  it('marks the nav as a rail only while the column is collapsed', () => {
    mockViewport(DESKTOP);
    render(<RailFrame />);
    expect(nav()).not.toHaveClass('is-rail');
    fireEvent.click(burger());
    expect(nav()).toHaveClass('app-frame-nav', 'is-rail');
    expect(root()).toHaveClass('is-nav-collapsed');
    expect(burger()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(burger());
    expect(nav()).not.toHaveClass('is-rail');
  });

  it('keeps focus on the item that has it as the column collapses and expands', () => {
    mockViewport(DESKTOP);
    const { rerender } = render(<RailFrame navCollapsed={false} />);
    const orders = link('Orders');
    orders.focus();
    rerender(<RailFrame navCollapsed />);
    expect(nav()).toHaveClass('is-rail');
    expect(link('Orders')).toBe(orders);
    expect(orders).toHaveFocus();
    rerender(<RailFrame navCollapsed={false} />);
    expect(link('Orders')).toBe(orders);
    expect(orders).toHaveFocus();
  });

  it('moves focus from a nested link the rail hides to its item’s own link', () => {
    mockViewport(DESKTOP);
    const { rerender } = render(<RailFrame navCollapsed={false} />);
    link('Open orders').focus();
    rerender(<RailFrame navCollapsed />);
    expect(link('Orders')).toHaveFocus();
  });

  it('moves focus from a link in an open section the rail hides to the section’s button', () => {
    mockViewport(DESKTOP);
    const { rerender } = render(<RailFrame navCollapsed={false} />);
    fireEvent.click(reports());
    link('Sales').focus();
    rerender(<RailFrame navCollapsed />);
    expect(reports()).toHaveFocus();
  });

  it('leaves focus on a top-level link as the column collapses', () => {
    mockViewport(DESKTOP);
    const { rerender } = render(<RailFrame navCollapsed={false} />);
    link('Dashboard').focus();
    rerender(<RailFrame navCollapsed />);
    expect(link('Dashboard')).toHaveFocus();
  });

  it('expands the column and opens a section from its button in the rail', () => {
    mockViewport(DESKTOP);
    const onNavCollapsedChange = vi.fn();
    render(
      <RailFrame
        defaultNavCollapsed
        onNavCollapsedChange={onNavCollapsedChange}
      />
    );
    const button = reports();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(onNavCollapsedChange).toHaveBeenLastCalledWith(false);
    expect(nav()).not.toHaveClass('is-rail');
    expect(reports()).toBe(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(link('Sales')).toBeVisible();
  });

  it('says an open section in the rail is collapsed, since the rail hides its list', () => {
    mockViewport(DESKTOP);
    const { rerender } = render(<RailFrame navCollapsed={false} />);
    fireEvent.click(reports());
    expect(reports()).toHaveAttribute('aria-expanded', 'true');
    rerender(<RailFrame navCollapsed />);
    expect(reports()).toHaveAttribute('aria-expanded', 'false');
    rerender(<RailFrame navCollapsed={false} />);
    expect(reports()).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaves a section to open and close as usual in the drawer, where there is no rail', () => {
    mockViewport(PHONE);
    const onNavCollapsedChange = vi.fn();
    render(
      <RailFrame
        defaultNavCollapsed
        onNavCollapsedChange={onNavCollapsedChange}
      />
    );
    fireEvent.click(burger());
    expect(root()).toHaveClass('is-nav-open');
    fireEvent.click(reports());
    expect(reports()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(reports());
    expect(reports()).toHaveAttribute('aria-expanded', 'false');
    expect(onNavCollapsedChange).not.toHaveBeenCalled();
  });

  it('leaves a section in a Popover opened from the rail’s menu out of the rail', async () => {
    mockViewport(DESKTOP);
    const onNavCollapsedChange = vi.fn();
    render(
      <AppFrame defaultNavCollapsed onNavCollapsedChange={onNavCollapsedChange}>
        <AppFrame.Nav rail>
          <Menu>
            <Menu.List>
              <li>
                <Popover
                  appendToBody
                  trigger={<button type="button">Filters</button>}
                >
                  <Menu>
                    <Menu.Section label="Status" icon={<Glyph />} defaultOpen>
                      <Menu.List>
                        <Menu.Item href="#open">Open</Menu.Item>
                      </Menu.List>
                    </Menu.Section>
                  </Menu>
                </Popover>
              </li>
            </Menu.List>
          </Menu>
        </AppFrame.Nav>
        <AppFrame.Main>Page</AppFrame.Main>
      </AppFrame>
    );
    expect(nav()).toHaveClass('is-rail');
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const status = await screen.findByRole('button', { name: 'Status' });
    expect(status.closest('.app-frame-rail-tooltip')).toBeNull();
    expect(status).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(status);
    expect(status).toHaveAttribute('aria-expanded', 'false');
    expect(onNavCollapsedChange).not.toHaveBeenCalled();
    expect(nav()).toHaveClass('is-rail');
  });

  it('leaves a Menu in a Popover at the nav’s foot out of the rail, and doesn’t warn about it', async () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockViewport(DESKTOP);
    const onNavCollapsedChange = vi.fn();
    try {
      render(
        <AppFrame
          defaultNavCollapsed
          onNavCollapsedChange={onNavCollapsedChange}
        >
          <AppFrame.Nav rail>
            <Menu>
              <Menu.List>
                <Menu.Item href="#dashboard" icon={<Glyph />}>
                  Dashboard
                </Menu.Item>
              </Menu.List>
            </Menu>
            <Popover
              appendToBody
              trigger={<button type="button">Filters</button>}
            >
              <Menu>
                <Menu.List>
                  <Menu.Item href="#mine">Mine</Menu.Item>
                </Menu.List>
                <Menu.Section label="Status" defaultOpen>
                  <Menu.List>
                    <Menu.Item href="#open">Open</Menu.Item>
                  </Menu.List>
                </Menu.Section>
              </Menu>
            </Popover>
          </AppFrame.Nav>
          <AppFrame.Main>Page</AppFrame.Main>
        </AppFrame>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
      const status = await screen.findByRole('button', { name: 'Status' });
      expect(status.closest('.app-frame-rail-tooltip')).toBeNull();
      expect(link('Mine').closest('.app-frame-rail-tooltip')).toBeNull();
      expect(status).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(status);
      expect(status).toHaveAttribute('aria-expanded', 'false');
      expect(onNavCollapsedChange).not.toHaveBeenCalled();
      // Its items have no icons, and that's fine outside the rail.
      expect(
        warn.mock.calls.filter(([m]) => /has no\s+icon/.test(String(m)))
      ).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it('gives the rail to a reusable Menu nested in the nav’s own Menu', () => {
    mockViewport(DESKTOP);
    const HelpMenu = () => (
      <Menu>
        <Menu.List>
          <Menu.Item href="#help" icon={<Glyph />}>
            Help
          </Menu.Item>
        </Menu.List>
      </Menu>
    );
    render(
      <AppFrame defaultNavCollapsed>
        <AppFrame.Nav rail>
          <Menu>
            <Menu.List>
              <Menu.Item href="#dashboard" icon={<Glyph />}>
                Dashboard
              </Menu.Item>
            </Menu.List>
            <HelpMenu />
          </Menu>
        </AppFrame.Nav>
        <AppFrame.Main>Page</AppFrame.Main>
      </AppFrame>
    );
    expect(tipOf(link('Help'))).toHaveClass('app-frame-rail-tooltip');
    expect(tipOf(link('Dashboard'))).toHaveClass('app-frame-rail-tooltip');
  });

  it('warns once when a collapsed rail holds no Menu, and not when it does', () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockViewport(DESKTOP);
    try {
      const { unmount } = render(<RailFrame defaultNavCollapsed />);
      expect(
        warn.mock.calls.filter(([m]) => /holds no <Menu>/.test(String(m)))
      ).toEqual([]);
      unmount();
      render(
        <AppFrame defaultNavCollapsed>
          <AppFrame.Nav rail>
            <Menu.List>
              <Menu.Item href="#dashboard" icon={<Glyph />}>
                Dashboard
              </Menu.Item>
            </Menu.List>
          </AppFrame.Nav>
          <AppFrame.Main>Page</AppFrame.Main>
        </AppFrame>
      );
      // A Menu.List with no Menu around it isn't in the rail.
      expect(link('Dashboard').closest('.app-frame-rail-tooltip')).toBeNull();
      expect(
        warn.mock.calls.filter(([m]) => /holds no <Menu>/.test(String(m)))
      ).toHaveLength(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('puts the tooltips on the left of a right-to-left rail', () => {
    mockViewport(DESKTOP);
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const style = real(el, pseudo);
      return el.matches('.app-frame-nav')
        ? ({ ...style, direction: 'rtl' } as CSSStyleDeclaration)
        : style;
    });
    try {
      render(<RailFrame />);
      expect(tipOf(link('Dashboard'))).toHaveClass('is-left');
      expect(tipOf(link('Dashboard'))).not.toHaveClass('is-right');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('leaves aria-expanded off a section in the rail on the server, and sets it once the mode is known', () => {
    const OpenSection = (props: AppFrameProps) => (
      <AppFrame {...props}>
        <AppFrame.Nav rail>
          <Menu>
            <Menu.Section label="Reports" icon={<Glyph />} defaultOpen>
              <Menu.List>
                <Menu.Item href="#sales">Sales</Menu.Item>
              </Menu.List>
            </Menu.Section>
          </Menu>
        </AppFrame.Nav>
        <AppFrame.Main>Page</AppFrame.Main>
      </AppFrame>
    );
    const toggleIn = (html: string) =>
      /<button[^>]*menu-section-toggle[^>]*>/.exec(html)?.[0];
    const button = toggleIn(
      renderToStaticMarkup(<OpenSection defaultNavCollapsed />)
    );
    expect(button).toBeDefined();
    expect(button).not.toContain('aria-expanded');
    // Not set to collapse, the column is no rail at any width, so the
    // section's state is known.
    expect(toggleIn(renderToStaticMarkup(<OpenSection />))).toContain(
      'aria-expanded="true"'
    );
    mockViewport(DESKTOP);
    render(<OpenSection defaultNavCollapsed />);
    expect(reports()).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves the tooltips to the other side when a LocaleProvider switches direction', () => {
    mockViewport(DESKTOP);
    // jsdom lays nothing out, so the nav's direction is the nearest dir.
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const style = real(el, pseudo);
      return el.matches('.app-frame-nav')
        ? ({
            ...style,
            direction: el.closest('[dir]')?.getAttribute('dir') ?? 'ltr',
          } as CSSStyleDeclaration)
        : style;
    });
    try {
      const { rerender } = render(
        <LocaleProvider dir="ltr">
          <RailFrame defaultNavCollapsed />
        </LocaleProvider>
      );
      expect(tipOf(link('Dashboard'))).toHaveClass('is-right');
      rerender(
        <LocaleProvider dir="rtl">
          <RailFrame defaultNavCollapsed />
        </LocaleProvider>
      );
      expect(tipOf(link('Dashboard'))).toHaveClass('is-left');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('renders the rail and its tooltips on the server, so hydrating remounts nothing', () => {
    const html = renderToStaticMarkup(<RailFrame defaultNavCollapsed />);
    expect(html).toMatch(/<nav[^>]*class="app-frame-nav is-rail"/);
    expect(html).toContain('app-frame-rail-tooltip');
    expect(html).toMatch(/role="tooltip"/);
    expect(html).not.toContain('aria-describedby');
  });

  it('prefixes the rail’s classes', () => {
    mockViewport(DESKTOP);
    render(
      <ConfigProvider classPrefix="bestax-">
        <RailFrame defaultNavCollapsed />
      </ConfigProvider>
    );
    expect(document.querySelector('nav')).toHaveClass(
      'bestax-app-frame-nav',
      'bestax-is-rail'
    );
    expect(tipOf(link('Dashboard'))).toHaveClass(
      'bestax-tooltip',
      'bestax-app-frame-rail-tooltip'
    );
  });

  it('gives a menu no tooltips in a nav without a rail, or outside a frame', () => {
    mockViewport(DESKTOP);
    const { unmount } = render(<RailFrame nav={{ rail: false }} />);
    expect(document.querySelector('.tooltip')).toBeNull();
    unmount();
    render(
      <AppFrame.Nav rail>
        <Menu>
          <Menu.List>
            <Menu.Item href="#dashboard" icon={<Glyph />}>
              Dashboard
            </Menu.Item>
          </Menu.List>
        </Menu>
      </AppFrame.Nav>
    );
    expect(document.querySelector('.tooltip')).toBeNull();
  });
});

/** Whether `useAppFrame()` reads the nav as a drawer at `breakpoint`. */
function isDrawerAt(breakpoint: AppFrameProps['breakpoint']) {
  const Probe = () => <output>{String(useAppFrame().isDrawer)}</output>;
  const view = render(
    <AppFrame breakpoint={breakpoint}>
      <Probe />
    </AppFrame>
  );
  const isDrawer = screen.getByRole('status').textContent === 'true';
  view.unmount();
  return isDrawer;
}
