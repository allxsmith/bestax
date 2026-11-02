import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useScrollSpy, type UseScrollSpyOptions } from '../useScrollSpy';
import { resetDevWarnings } from '../devWarnings';

// jsdom has no layout, so each section's top is set here, by id, along with
// the ones that aren't drawn.
const tops: Record<string, number> = {};
const undrawn = new Set<string>();

// Properties stubbed on window and the root element, put back after each test.
const stubbed: Array<[object, string, PropertyDescriptor | undefined]> = [];
const stub = (target: object, key: string, value: unknown) => {
  stubbed.push([target, key, Object.getOwnPropertyDescriptor(target, key)]);
  Object.defineProperty(target, key, { configurable: true, value });
};

/** Puts the page at `y` in a document `height` tall, in a viewport of 800. */
const setScroll = (y: number, height = 3000) => {
  stub(window, 'scrollY', y);
  stub(document.documentElement, 'clientHeight', 800);
  stub(document.documentElement, 'scrollHeight', height);
};

/** The page's `scroll-padding-top`, as getComputedStyle reports it. */
const setScrollPadding = (value: string) => {
  const real = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) =>
    el === document.documentElement
      ? ({ scrollPaddingTop: value } as CSSStyleDeclaration)
      : real(el, pseudo)
  );
};

/** Runs the next animation frame, where a scroll's check runs. */
const nextFrame = () =>
  act(() => {
    vi.advanceTimersByTime(16);
  });

/** A scroll event, and the frame after it. */
const scroll = () => {
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
  nextFrame();
};

/** Lets the page be still long enough for a jump to count as over. */
const settle = () =>
  act(() => {
    vi.advanceTimersByTime(100);
  });

/** Follows a link to `#hash`, as far as the page can see. */
const jumpTo = (hash: string) =>
  act(() => {
    window.history.replaceState(null, '', `#${hash}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

const Spy = (props: UseScrollSpyOptions) => {
  const active = useScrollSpy(props);
  return <output data-testid="active">{active ?? 'none'}</output>;
};

type PageProps = Partial<UseScrollSpyOptions> & { sections?: string[] };

/** Headings with ids, and the hook watching them. */
const Page = ({ sections = ['a', 'b', 'c'], ...props }: PageProps) => (
  <>
    {sections.map(id => (
      <h2 key={id} id={id}>
        {id}
      </h2>
    ))}
    <Spy {...props} ids={props.ids ?? sections} />
  </>
);

const active = () => screen.getByTestId('active').textContent;

describe('useScrollSpy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const id of Object.keys(tops)) delete tops[id];
    undrawn.clear();
    setScroll(500);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const top = tops[this.id] ?? 0;
        return { top, bottom: top + 40, height: 40 } as DOMRect;
      }
    );
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (
      this: Element
    ) {
      return (undrawn.has(this.id)
        ? []
        : [this.getBoundingClientRect()]) as unknown as DOMRectList;
    });
    resetDevWarnings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    for (const [target, key, descriptor] of stubbed.reverse()) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete (target as Record<string, unknown>)[key];
    }
    stubbed.length = 0;
    window.history.replaceState(null, '', window.location.pathname);
  });

  describe('which section is current', () => {
    it('is the last section whose top is at or above the line', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page offset={50} />);
      expect(active()).toBe('b');
    });

    it('is none above the first section', () => {
      Object.assign(tops, { a: 100, b: 600, c: 900 });
      const onActiveChange = vi.fn();
      render(<Page offset={50} onActiveChange={onActiveChange} />);
      expect(active()).toBe('none');
      expect(onActiveChange).not.toHaveBeenCalled();
    });

    it('takes a section a pixel past the line, for a jump that lands a fraction short', () => {
      Object.assign(tops, { a: -300, b: 51, c: 400 });
      render(<Page offset={50} />);
      expect(active()).toBe('b');
    });

    it('does not take a section further past the line than that', () => {
      Object.assign(tops, { a: -300, b: 51.5, c: 400 });
      render(<Page offset={50} />);
      expect(active()).toBe('a');
    });

    it('is the last section once the page is scrolled to its end', () => {
      // c is short and can't reach the line, but the page can't go further.
      Object.assign(tops, { a: -900, b: -100, c: 500 });
      setScroll(2200, 3000);
      render(<Page offset={0} />);
      expect(active()).toBe('c');
    });

    it('counts the end a pixel early, for a scroll position with a fraction', () => {
      Object.assign(tops, { a: -900, b: -100, c: 500 });
      setScroll(2199.5, 3000);
      render(<Page offset={0} />);
      expect(active()).toBe('c');
    });

    it('follows the line on a page that does not scroll at all', () => {
      Object.assign(tops, { a: 100, b: 300, c: 500 });
      setScroll(0, 800);
      render(<Page offset={0} />);
      expect(active()).toBe('none');
    });

    it('skips a section that is not drawn, at the line and at the end', () => {
      Object.assign(tops, { a: -300, b: 0, c: 0 });
      undrawn.add('b').add('c');
      render(<Page offset={50} />);
      expect(active()).toBe('a');
      setScroll(2200, 3000);
      scroll();
      expect(active()).toBe('a');
    });

    it('is none at the end when nothing is drawn', () => {
      undrawn.add('a').add('b').add('c');
      setScroll(2200, 3000);
      render(<Page offset={0} />);
      expect(active()).toBe('none');
    });
  });

  describe('the line', () => {
    it("is the page's scroll-padding-top when offset isn't set", () => {
      setScrollPadding('64px');
      Object.assign(tops, { a: -300, b: 64, c: 400 });
      render(<Page />);
      expect(active()).toBe('b');
    });

    it('reads a percentage of the viewport the page scrolls in', () => {
      setScrollPadding('10%');
      Object.assign(tops, { a: -300, b: 80, c: 400 });
      render(<Page />);
      expect(active()).toBe('b');
    });

    it('is the top of the viewport for auto', () => {
      setScrollPadding('auto');
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page />);
      expect(active()).toBe('a');
    });

    it('is offset when it is set, over the scroll padding', () => {
      setScrollPadding('64px');
      Object.assign(tops, { a: -300, b: 64, c: 400 });
      render(<Page offset={10} />);
      expect(active()).toBe('a');
    });

    it('falls back to the scroll padding for an offset that is not a number', () => {
      setScrollPadding('64px');
      Object.assign(tops, { a: -300, b: 64, c: 400 });
      render(<Page offset={Number.NaN} />);
      expect(active()).toBe('b');
    });

    it('is read again on resize, and checked in the next frame', () => {
      setScrollPadding('64px');
      Object.assign(tops, { a: -300, b: 64, c: 400 });
      render(<Page />);
      expect(active()).toBe('b');
      setScrollPadding('32px');
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(active()).toBe('b');
      nextFrame();
      expect(active()).toBe('a');
    });
  });

  describe('watching the page', () => {
    it('checks in the frame after a scroll, once however many scroll events', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page offset={50} />);
      const lookups = vi.spyOn(document, 'getElementById');
      Object.assign(tops, { b: -200, c: 30 });
      act(() => {
        for (let i = 0; i < 3; i++) window.dispatchEvent(new Event('scroll'));
      });
      expect(active()).toBe('b');
      expect(lookups).not.toHaveBeenCalled();
      nextFrame();
      expect(active()).toBe('c');
      expect(lookups).toHaveBeenCalledTimes(3);
    });

    it('looks each section up when it checks, so a node replaced under the same id counts', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const { rerender } = render(<Page offset={50} />);
      // A new heading for c, with the same id, now above the line.
      rerender(
        <Page offset={50} sections={['a', 'b', 'x']} ids={['a', 'b', 'c']} />
      );
      const fresh = document.createElement('h2');
      fresh.id = 'c';
      document.body.appendChild(fresh);
      tops.c = 30;
      scroll();
      expect(active()).toBe('c');
      fresh.remove();
    });

    it('sees a section rendered after it mounted at the next scroll', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      Object.assign(tops, { a: -300, b: 20, late: 30 });
      const { rerender } = render(
        <Page offset={50} sections={['a', 'b']} ids={['a', 'b', 'late']} />
      );
      expect(active()).toBe('b');
      expect(warn).toHaveBeenCalledTimes(1);
      rerender(
        <Page
          offset={50}
          sections={['a', 'b', 'late']}
          ids={['a', 'b', 'late']}
        />
      );
      scroll();
      expect(active()).toBe('late');
    });

    it('starts over when the ids change, and not for a new array with the same ids', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const add = vi.spyOn(window, 'addEventListener');
      const remove = vi.spyOn(window, 'removeEventListener');
      const scrollListeners = (spy: typeof add) =>
        spy.mock.calls.filter(([type]) => type === 'scroll').length;
      const { rerender } = render(<Page offset={50} />);
      expect(scrollListeners(add)).toBe(1);
      rerender(<Page offset={50} ids={['a', 'b', 'c']} />);
      expect(scrollListeners(add)).toBe(1);
      rerender(<Page offset={50} ids={['a', 'c']} />);
      expect(scrollListeners(remove)).toBe(1);
      expect(scrollListeners(add)).toBe(2);
      expect(active()).toBe('a');
    });

    it('stops watching on unmount', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const onActiveChange = vi.fn();
      const { unmount } = render(
        <Page offset={50} onActiveChange={onActiveChange} />
      );
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      jumpTo('b');
      unmount();
      onActiveChange.mockClear();
      Object.assign(tops, { b: -200, c: 30 });
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      document.body.click();
      vi.advanceTimersByTime(1000);
      expect(onActiveChange).not.toHaveBeenCalled();
    });
  });

  describe('after a jump', () => {
    // The page at its end, where c is the last section and b, short, sits
    // below the line with c under it: the rule says c, a jump to b says b.
    const atTheEnd = () => {
      Object.assign(tops, { a: -900, b: 300, c: 500 });
      setScroll(2200, 3000);
    };

    it('holds a section the page was jumped to, at the line or as near as its end allows', () => {
      Object.assign(tops, { a: -900, b: 0, c: 300 });
      render(<Page offset={0} />);
      expect(active()).toBe('b');
      atTheEnd();
      scroll();
      expect(active()).toBe('c');
      jumpTo('b');
      expect(active()).toBe('b');
    });

    it('lets go once the jump is over and the reader scrolls on', () => {
      atTheEnd();
      render(<Page offset={0} />);
      jumpTo('b');
      // The jump's own scrolling, and the checks it causes, change nothing,
      // and each scroll pushes its end back.
      scroll();
      act(() => {
        vi.advanceTimersByTime(80);
      });
      scroll();
      act(() => {
        vi.advanceTimersByTime(80);
      });
      expect(active()).toBe('b');
      settle();
      expect(active()).toBe('b');
      // The reader scrolls on, and the rule takes over.
      scroll();
      expect(active()).toBe('c');
    });

    it('keeps the mark where it was while a smooth jump is on its way, then marks where it lands', () => {
      Object.assign(tops, { a: -900, b: -100, c: 600 });
      render(<Page offset={0} />);
      expect(active()).toBe('b');
      jumpTo('a');
      // Passing b on the way up changes nothing.
      Object.assign(tops, { a: -400, b: 400, c: 1100 });
      scroll();
      expect(active()).toBe('b');
      Object.assign(tops, { a: 0, b: 800, c: 1500 });
      scroll();
      expect(active()).toBe('a');
    });

    it("doesn't hold a section the page wasn't put at, as after Back or Forward", () => {
      // Back restores where the page was, with b's top well above the line.
      Object.assign(tops, { a: -900, b: -400, c: 300 });
      const onActiveChange = vi.fn();
      render(<Page offset={0} onActiveChange={onActiveChange} />);
      jumpTo('a');
      scroll();
      expect(active()).toBe('b');
      settle();
      expect(active()).toBe('b');
      expect(onActiveChange.mock.calls).toEqual([['b']]);
    });

    it('lets go of a jump at a jump elsewhere', () => {
      atTheEnd();
      render(<Page offset={0} />);
      jumpTo('b');
      expect(active()).toBe('b');
      jumpTo('footnote-1');
      expect(active()).toBe('c');
    });

    it('reads a fragment that is percent-encoded', () => {
      Object.assign(tops, { a: -900, café: 300, z: 500 });
      setScroll(2200, 3000);
      render(<Page offset={0} sections={['a', 'café', 'z']} />);
      expect(active()).toBe('z');
      jumpTo(encodeURIComponent('café'));
      expect(active()).toBe('café');
    });

    it('reads a fragment that is not valid percent-encoding as written', () => {
      Object.assign(tops, { a: -900, '100%': 300, z: 500 });
      setScroll(2200, 3000);
      render(<Page offset={0} sections={['a', '100%', 'z']} />);
      expect(active()).toBe('z');
      jumpTo('100%');
      expect(active()).toBe('100%');
    });

    it("doesn't hold a section that is not drawn", () => {
      atTheEnd();
      undrawn.add('b');
      render(<Page offset={0} />);
      jumpTo('b');
      settle();
      expect(active()).toBe('c');
    });

    it("doesn't hold a section that is not on the page", () => {
      atTheEnd();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Page offset={0} ids={['a', 'b', 'c', 'gone']} />);
      jumpTo('gone');
      settle();
      expect(active()).toBe('c');
    });

    it('holds the section a page opens at', () => {
      atTheEnd();
      window.history.replaceState(null, '', '#b');
      render(<Page offset={0} />);
      expect(active()).toBe('b');
    });

    it("waits for a page opened at a section the browser hasn't put it at yet, then follows the rule", () => {
      Object.assign(tops, { a: -900, b: -400, c: 300 });
      window.history.replaceState(null, '', '#a');
      const onActiveChange = vi.fn();
      render(<Page offset={0} onActiveChange={onActiveChange} />);
      expect(active()).toBe('none');
      settle();
      expect(active()).toBe('b');
      expect(onActiveChange.mock.calls).toEqual([['b']]);
    });

    describe('a click on a link to the section already in the address bar', () => {
      const Links = ({ href }: { href: string }) => (
        <>
          <Page offset={0} />
          <a href={href}>link</a>
        </>
      );

      it('holds it, though no hashchange follows, and leaves the click alone', () => {
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        render(<Links href="#b" />);
        scroll();
        settle();
        scroll();
        expect(active()).toBe('c');
        let followed = false;
        act(() => {
          followed = fireEvent.click(screen.getByRole('link'));
        });
        expect(followed).toBe(true);
        expect(active()).toBe('b');
      });

      it('holds one from a link inside a shadow root', () => {
        atTheEnd();
        render(<Page offset={0} />);
        const host = document.createElement('div');
        document.body.appendChild(host);
        const link = document.createElement('a');
        link.href = '#b';
        host.attachShadow({ mode: 'open' }).appendChild(link);
        act(() => {
          link.dispatchEvent(
            new MouseEvent('click', { bubbles: true, composed: true })
          );
        });
        expect(active()).toBe('b');
        host.remove();
      });

      it('ignores a link to another page, a link with no fragment and a click on no link', () => {
        atTheEnd();
        render(<Links href="/elsewhere#b" />);
        act(() => {
          fireEvent.click(screen.getByRole('link'));
          fireEvent.click(screen.getByTestId('active'));
        });
        expect(active()).toBe('c');
        render(<a href="/plain">plain</a>);
        act(() => {
          fireEvent.click(screen.getByText('plain'));
        });
        expect(active()).toBe('c');
      });
    });
  });

  describe('onActiveChange', () => {
    it('is called with each new id, and with null above the first section', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const onActiveChange = vi.fn();
      render(<Page offset={50} onActiveChange={onActiveChange} />);
      expect(onActiveChange.mock.calls).toEqual([['b']]);
      scroll();
      expect(onActiveChange).toHaveBeenCalledTimes(1);
      Object.assign(tops, { a: 300, b: 620, c: 1000 });
      scroll();
      expect(onActiveChange.mock.calls).toEqual([['b'], [null]]);
    });

    it('calls the latest function without watching the page again', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const add = vi.spyOn(window, 'addEventListener');
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<Page offset={50} onActiveChange={first} />);
      rerender(<Page offset={50} onActiveChange={second} />);
      expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(
        1
      );
      Object.assign(tops, { b: -200, c: 30 });
      scroll();
      expect(first.mock.calls).toEqual([['b']]);
      expect(second.mock.calls).toEqual([['c']]);
    });
  });

  describe('a section that is not on the page', () => {
    it('is never current, and a development build names it once', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      Object.assign(tops, { a: -300, b: -100 });
      const { unmount } = render(
        <Page offset={50} sections={['a', 'b']} ids={['a', 'b', 'gone']} />
      );
      expect(active()).toBe('b');
      scroll();
      unmount();
      render(
        <Page offset={50} sections={['a', 'b']} ids={['a', 'b', 'gone']} />
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('"gone"');
    });
  });

  it('is null on the server, and touches nothing there', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const html = renderToStaticMarkup(<Page offset={50} />);
    expect(html).toContain('<output data-testid="active">none</output>');
    expect(add).not.toHaveBeenCalled();
  });
});
