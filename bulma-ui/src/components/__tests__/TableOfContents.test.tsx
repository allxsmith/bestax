import { createRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  TableOfContents,
  useScrollSpy,
  type TableOfContentsItem,
  type TableOfContentsProps,
} from '../TableOfContents';
import { useScrollSpy as helperUseScrollSpy } from '../../helpers/useScrollSpy';
import { ConfigProvider } from '../../helpers/Config';

const items: TableOfContentsItem[] = [
  { id: 'install', label: 'Install' },
  {
    id: 'usage',
    label: 'Usage',
    children: [
      { id: 'props', label: 'Props' },
      { id: 'examples', label: 'Examples' },
    ],
  },
  { id: 'faq', label: 'FAQ' },
];

const ids = ['install', 'usage', 'props', 'examples', 'faq'];

// jsdom has no layout, so each section's top is set here, by id. The list's
// own box and its links are set apart, for keeping the current link in view.
const tops: Record<string, number> = {};
let navBox = { top: 0, bottom: 0 };
let linkBox = { top: 0, bottom: 0 };
let navScroll = { scrollHeight: 0, clientHeight: 0 };

/** The sections the list links to, and the list. */
const Page = (props: Partial<TableOfContentsProps>) => (
  <>
    {ids.map(id => (
      <h2 key={id} id={id}>
        {id}
      </h2>
    ))}
    <TableOfContents items={items} offset={0} {...props} />
  </>
);

const link = (name: string) => screen.getByRole('link', { name });

const currentLinks = (root: ParentNode = document) =>
  Array.from(root.querySelectorAll('a[aria-current]')).map(a => a.textContent);

describe('TableOfContents', () => {
  beforeEach(() => {
    for (const id of Object.keys(tops)) delete tops[id];
    navBox = { top: 0, bottom: 0 };
    linkBox = { top: 0, bottom: 0 };
    navScroll = { scrollHeight: 0, clientHeight: 0 };
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        if (this.tagName === 'NAV') return navBox as DOMRect;
        if (this.getAttribute('aria-current')) return linkBox as DOMRect;
        const top = tops[this.id] ?? 1000;
        return { top, bottom: top + 40 } as DOMRect;
      }
    );
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (
      this: Element
    ) {
      return [this.getBoundingClientRect()] as unknown as DOMRectList;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.tagName === 'NAV' ? navScroll.scrollHeight : 0;
      }
    );
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.tagName === 'NAV' ? navScroll.clientHeight : 0;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // A followed link leaves its fragment in the address bar, and a list
    // mounted under one takes it for a jump.
    window.history.replaceState(null, '', window.location.pathname);
  });

  describe('markup', () => {
    it('is a navigation landmark named by its title', () => {
      render(<Page />);
      const nav = screen.getByRole('navigation', { name: 'On this page' });
      expect(nav.tagName).toBe('NAV');
      expect(nav).toHaveClass('menu', 'table-of-contents');
      expect(nav).not.toHaveClass('is-sticky');
      const title = within(nav).getByText('On this page');
      expect(title).toHaveClass('menu-label');
      expect(nav).toHaveAttribute('aria-labelledby', title.id);
    });

    it('lists each entry as a link to its id, nesting the children', () => {
      render(<Page />);
      const nav = screen.getByRole('navigation');
      const [list, nested] = within(nav).getAllByRole('list');
      expect(list).toHaveClass('menu-list');
      expect(within(list).getAllByRole('listitem')).toHaveLength(5);
      expect(
        within(nested)
          .getAllByRole('link')
          .map(a => a.textContent)
      ).toEqual(['Props', 'Examples']);
      expect(link('Usage').closest('li')).toContainElement(nested);
      expect(
        within(nav)
          .getAllByRole('link')
          .map(a => a.getAttribute('href'))
      ).toEqual(['#install', '#usage', '#props', '#examples', '#faq']);
    });

    it('takes a label with markup in it', () => {
      render(
        <TableOfContents
          items={[
            {
              id: 'beta',
              label: (
                <>
                  Beta <span className="tag">new</span>
                </>
              ),
            },
          ]}
        />
      );
      expect(screen.getByRole('link', { name: 'Beta new' })).toHaveAttribute(
        'href',
        '#beta'
      );
    });

    it('encodes an id that a URL would read differently', () => {
      render(<TableOfContents items={[{ id: 'café 100%', label: 'Café' }]} />);
      expect(link('Café')).toHaveAttribute('href', '#caf%C3%A9%20100%25');
    });

    it('takes its title from labels, falling back for an empty one', () => {
      const { rerender } = render(
        <Page labels={{ title: 'Sur cette page' }} />
      );
      expect(
        screen.getByRole('navigation', { name: 'Sur cette page' })
      ).toBeInTheDocument();
      rerender(<Page labels={{ title: '' }} />);
      expect(
        screen.getByRole('navigation', { name: 'On this page' })
      ).toBeInTheDocument();
    });

    it('lets a name of your own win', () => {
      render(
        <>
          <h2 id="mine">Contents</h2>
          <Page aria-labelledby="mine" />
        </>
      );
      expect(
        screen.getByRole('navigation', { name: 'Contents' })
      ).toBeInTheDocument();
    });

    it('adds is-sticky', () => {
      render(<Page isSticky />);
      expect(screen.getByRole('navigation')).toHaveClass('is-sticky');
    });

    it('takes a className, the helper props and the text and background colors', () => {
      render(
        <Page
          className="custom"
          m="2"
          textColor="primary"
          bgColor="light"
          data-testid="toc"
        />
      );
      const nav = screen.getByTestId('toc');
      expect(nav).toHaveClass(
        'menu',
        'table-of-contents',
        'custom',
        'm-2',
        'has-text-primary',
        'has-background-light'
      );
    });

    it('forwards its ref to the nav', () => {
      const ref = createRef<HTMLElement>();
      render(<TableOfContents ref={ref} items={items} />);
      expect(ref.current).toBe(screen.getByRole('navigation'));
    });

    it('forwards its ref to a callback too', () => {
      let node: HTMLElement | null = null;
      render(
        <TableOfContents
          ref={(el: HTMLElement | null) => {
            node = el;
          }}
          items={items}
        />
      );
      expect(node).toBe(screen.getByRole('navigation'));
    });

    it('applies classPrefix from ConfigProvider', () => {
      Object.assign(tops, { install: -500, usage: -10 });
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Page isSticky />
        </ConfigProvider>
      );
      const nav = container.querySelector('nav')!;
      expect(nav).toHaveClass(
        'bestax-menu',
        'bestax-table-of-contents',
        'bestax-is-sticky'
      );
      expect(nav).not.toHaveClass('menu');
      expect(nav.querySelector('p')).toHaveClass('bestax-menu-label');
      expect(nav.querySelector('ul')).toHaveClass('bestax-menu-list');
      expect(link('Usage')).toHaveClass('bestax-is-active');
      expect(link('Usage')).not.toHaveClass('is-active');
    });
  });

  describe('the current section', () => {
    it('marks one link with is-active and aria-current="location"', () => {
      Object.assign(tops, { install: -500, usage: -10, props: 300 });
      render(<Page />);
      expect(link('Usage')).toHaveClass('is-active');
      expect(link('Usage')).toHaveAttribute('aria-current', 'location');
      expect(currentLinks()).toEqual(['Usage']);
      expect(document.querySelectorAll('.is-active')).toHaveLength(1);
    });

    it('marks a nested entry', () => {
      Object.assign(tops, { install: -500, usage: -300, props: -10 });
      render(<Page />);
      expect(currentLinks()).toEqual(['Props']);
    });

    it('marks none above the first section', () => {
      render(<Page />);
      expect(currentLinks()).toEqual([]);
      expect(document.querySelector('.is-active')).toBeNull();
    });

    it('calls onActiveChange with the id', () => {
      Object.assign(tops, { install: -500, usage: -10 });
      const onActiveChange = vi.fn();
      render(<Page onActiveChange={onActiveChange} />);
      expect(onActiveChange).toHaveBeenCalledWith('usage');
    });

    it('leaves a click on a link alone, so following one is the browser’s own', () => {
      render(<Page />);
      expect(fireEvent.click(link('FAQ'))).toBe(true);
    });

    it('keeps the link to a section that is not on the page, and says nothing', () => {
      const warn = vi.spyOn(console, 'warn');
      render(<Page items={[...items, { id: 'missing', label: 'Missing' }]} />);
      expect(link('Missing')).toHaveAttribute('href', '#missing');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('a list taller than its room', () => {
    const renderTall = () => {
      navScroll = { scrollHeight: 900, clientHeight: 300 };
      navBox = { top: 100, bottom: 400 };
      return render(<Page isSticky />);
    };

    it('scrolls itself down to a current link below what it shows', () => {
      Object.assign(tops, { install: -500, usage: -10 });
      linkBox = { top: 420, bottom: 450 };
      renderTall();
      expect(screen.getByRole('navigation').scrollTop).toBe(50);
    });

    it('scrolls itself up to a current link above what it shows', () => {
      vi.useFakeTimers();
      try {
        renderTall();
        const nav = screen.getByRole('navigation');
        nav.scrollTop = 200;
        Object.assign(tops, { install: -500, usage: -10 });
        linkBox = { top: 60, bottom: 90 };
        // The page scrolls, and the check runs in the next frame.
        act(() => {
          window.dispatchEvent(new Event('scroll'));
          vi.advanceTimersByTime(16);
        });
        expect(nav.scrollTop).toBe(160);
      } finally {
        vi.useRealTimers();
      }
    });

    it('leaves a current link it already shows where it is', () => {
      Object.assign(tops, { install: -500, usage: -10 });
      linkBox = { top: 200, bottom: 230 };
      renderTall();
      expect(screen.getByRole('navigation').scrollTop).toBe(0);
    });

    it('does nothing when the list fits', () => {
      Object.assign(tops, { install: -500, usage: -10 });
      navBox = { top: 100, bottom: 400 };
      linkBox = { top: 420, bottom: 450 };
      render(<Page />);
      expect(screen.getByRole('navigation').scrollTop).toBe(0);
    });

    it('does nothing with no current link', () => {
      renderTall();
      expect(screen.getByRole('navigation').scrollTop).toBe(0);
    });
  });

  describe('server rendering', () => {
    it('renders every link on the server, none current, and marks one after hydration', async () => {
      Object.assign(tops, { install: -500, usage: -10 });
      const html = renderToString(<Page />);
      expect(html).toContain('href="#faq"');
      expect(html).not.toContain('aria-current');
      expect(html).not.toContain('is-active');

      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      expect(currentLinks(container)).toEqual([]);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <Page />);
          unmountRoot = () => root.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
        expect(currentLinks(container)).toEqual(['Usage']);
      } finally {
        await act(async () => unmountRoot());
        document.body.removeChild(container);
      }
    });
  });

  it('re-exports useScrollSpy from the helper', () => {
    expect(useScrollSpy).toBe(helperUseScrollSpy);
  });
});
