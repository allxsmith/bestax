import { act, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useScrollSpy, type UseScrollSpyOptions } from '../useScrollSpy';
import { resetDevWarnings } from '../devWarnings';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  /** A section crossed the line. The hook reads the page, not the entries. */
  fire() {
    act(() => {
      this.callback([], this as unknown as IntersectionObserver);
    });
  }
}

const latestObserver = () =>
  MockIntersectionObserver.instances[
    MockIntersectionObserver.instances.length - 1
  ];

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
  stub(window, 'innerHeight', 800);
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

const scroll = () =>
  act(() => {
    window.dispatchEvent(new Event('scroll'));
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
  const originalIntersectionObserver = global.IntersectionObserver;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    global.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
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
    global.IntersectionObserver = originalIntersectionObserver;
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

    it('reads a percentage of the viewport', () => {
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

    it('is read again on resize', () => {
      setScrollPadding('64px');
      Object.assign(tops, { a: -300, b: 64, c: 400 });
      render(<Page />);
      expect(active()).toBe('b');
      setScrollPadding('32px');
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(active()).toBe('a');
    });
  });

  describe('watching the page', () => {
    it('observes each section with a region that ends at the line', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page offset={50} />);
      const observer = latestObserver();
      expect(observer.options).toEqual({
        root: document,
        rootMargin: '1000000px 1000000px -749px 1000000px',
      });
      expect(observer.observe.mock.calls.map(([el]) => el.id)).toEqual([
        'a',
        'b',
        'c',
      ]);
    });

    it('checks again when a section crosses the line', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page offset={50} />);
      Object.assign(tops, { b: -200, c: 30 });
      latestObserver().fire();
      expect(active()).toBe('c');
    });

    it('checks once scrolling stops, which is how it sees the end of the page', () => {
      vi.useFakeTimers();
      Object.assign(tops, { a: -900, b: -100, c: 500 });
      render(<Page offset={0} />);
      expect(active()).toBe('b');
      setScroll(2200, 3000);
      scroll();
      expect(active()).toBe('b');
      act(() => {
        vi.advanceTimersByTime(99);
      });
      scroll();
      act(() => {
        vi.advanceTimersByTime(99);
      });
      expect(active()).toBe('b');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(active()).toBe('c');
    });

    it('makes a new observer on resize, with the new viewport height', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page offset={50} />);
      const first = latestObserver();
      stub(window, 'innerHeight', 600);
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(first.disconnect).toHaveBeenCalled();
      expect(latestObserver()).not.toBe(first);
      expect(latestObserver().options?.rootMargin).toBe(
        '1000000px 1000000px -549px 1000000px'
      );
    });

    it('checks on every scroll where IntersectionObserver is missing', () => {
      // @ts-expect-error -- the browser this branch is for has none
      delete global.IntersectionObserver;
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      render(<Page offset={50} />);
      expect(active()).toBe('b');
      Object.assign(tops, { b: -200, c: 30 });
      scroll();
      expect(active()).toBe('c');
      // And nothing is left to disconnect on resize.
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(active()).toBe('c');
    });

    it('looks the sections up again when the ids change, not when the array does', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const { rerender } = render(<Page offset={50} />);
      expect(MockIntersectionObserver.instances).toHaveLength(1);
      rerender(<Page offset={50} ids={['a', 'b', 'c']} />);
      expect(MockIntersectionObserver.instances).toHaveLength(1);
      rerender(<Page offset={50} ids={['a', 'c']} />);
      expect(MockIntersectionObserver.instances).toHaveLength(2);
      expect(
        MockIntersectionObserver.instances[0].disconnect
      ).toHaveBeenCalled();
      expect(active()).toBe('a');
    });

    it('stops watching on unmount', () => {
      vi.useFakeTimers();
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const onActiveChange = vi.fn();
      const { unmount } = render(
        <Page offset={50} onActiveChange={onActiveChange} />
      );
      scroll();
      const observer = latestObserver();
      unmount();
      expect(observer.disconnect).toHaveBeenCalled();
      onActiveChange.mockClear();
      Object.assign(tops, { b: -200, c: 30 });
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      vi.advanceTimersByTime(1000);
      expect(onActiveChange).not.toHaveBeenCalled();
    });
  });

  describe('after a jump', () => {
    it('holds the section jumped to until the jump settles and the reader scrolls on', () => {
      vi.useFakeTimers();
      // c is a short last section; the jump lands with it below the line.
      Object.assign(tops, { a: -900, b: -100, c: 300 });
      render(<Page offset={0} />);
      expect(active()).toBe('b');
      jumpTo('c');
      expect(active()).toBe('c');
      // The jump's own scrolling, and the checks it causes, change nothing.
      scroll();
      latestObserver().fire();
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(active()).toBe('c');
      // The reader scrolls on, and the rule takes over.
      scroll();
      expect(active()).toBe('b');
    });

    it('lets go of a jump at the next jump elsewhere', () => {
      Object.assign(tops, { a: -900, b: -100, c: 300 });
      render(<Page offset={0} />);
      jumpTo('c');
      expect(active()).toBe('c');
      jumpTo('footnote-1');
      expect(active()).toBe('b');
    });

    it('reads a fragment that is percent-encoded', () => {
      Object.assign(tops, { a: -900, café: 300 });
      render(<Page offset={0} sections={['a', 'café']} />);
      expect(active()).toBe('a');
      jumpTo(encodeURIComponent('café'));
      expect(active()).toBe('café');
    });

    it('reads a fragment that is not valid percent-encoding as written', () => {
      Object.assign(tops, { a: -900, '100%': 300 });
      render(<Page offset={0} sections={['a', '100%']} />);
      jumpTo('100%');
      expect(active()).toBe('100%');
    });

    it('ignores a jump to a section that is not drawn', () => {
      Object.assign(tops, { a: -900, b: 0, c: 300 });
      undrawn.add('b');
      render(<Page offset={0} />);
      jumpTo('b');
      expect(active()).toBe('a');
    });

    it('ignores a jump to a section that is not on the page', () => {
      Object.assign(tops, { a: -900, b: 300 });
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Page offset={0} sections={['a', 'b']} ids={['a', 'b', 'gone']} />
      );
      jumpTo('gone');
      expect(active()).toBe('a');
    });
  });

  describe('onActiveChange', () => {
    it('is called with each new id, and with null above the first section', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const onActiveChange = vi.fn();
      render(<Page offset={50} onActiveChange={onActiveChange} />);
      expect(onActiveChange.mock.calls).toEqual([['b']]);
      latestObserver().fire();
      expect(onActiveChange).toHaveBeenCalledTimes(1);
      Object.assign(tops, { a: 300, b: 620, c: 1000 });
      latestObserver().fire();
      expect(onActiveChange.mock.calls).toEqual([['b'], [null]]);
    });

    it('calls the latest function without watching the page again', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<Page offset={50} onActiveChange={first} />);
      rerender(<Page offset={50} onActiveChange={second} />);
      expect(MockIntersectionObserver.instances).toHaveLength(1);
      Object.assign(tops, { b: -200, c: 30 });
      latestObserver().fire();
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
      unmount();
      render(
        <Page offset={50} sections={['a', 'b']} ids={['a', 'b', 'gone']} />
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('"gone"');
    });
  });

  it('is null on the server, and touches nothing there', () => {
    const html = renderToStaticMarkup(<Page offset={50} />);
    expect(html).toContain('<output data-testid="active">none</output>');
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});
