import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useScrollSpy, type UseScrollSpyOptions } from '../useScrollSpy';

// jsdom has no layout, so each section's top is set here, by id, along with
// the ones that aren't drawn.
const tops: Record<string, number> = {};
const undrawn = new Set<string>();

// Properties stubbed on window, performance and the root element, put back
// after each test.
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

/** How the page was reached, as the navigation timing entry records it. */
const setNavigation = (type: string) =>
  stub(performance, 'getEntriesByType', (kind: string) =>
    kind === 'navigation' ? [{ type }] : []
  );

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

/**
 * Clicks a link to `href`, with `init` for the click and `attributes` for the
 * link, and says whether the click went on. A link to another page is kept
 * from navigating, which jsdom can't do.
 */
const clickLink = (
  href: string,
  init: MouseEventInit = {},
  attributes: Record<string, string> = {}
) => {
  const link = document.createElement('a');
  link.setAttribute('href', href);
  for (const [name, value] of Object.entries(attributes)) {
    link.setAttribute(name, value);
  }
  if (!href.startsWith('#')) {
    link.addEventListener('click', event => event.preventDefault());
  }
  document.body.appendChild(link);
  let followed = false;
  act(() => {
    followed = link.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, ...init })
    );
  });
  link.remove();
  return followed;
};

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
      const onCurrentChange = vi.fn();
      render(<Page offset={50} onCurrentChange={onCurrentChange} />);
      expect(active()).toBe('none');
      expect(onCurrentChange).not.toHaveBeenCalled();
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

    it('reads the end from the visual viewport, which grows when a phone hides its toolbar', () => {
      Object.assign(tops, { a: -900, b: -100, c: 500 });
      setScroll(2200, 3000);
      // The root keeps the height with the toolbar shown; the reader sees
      // 100px more, down to the true bottom.
      stub(document.documentElement, 'clientHeight', 700);
      stub(window, 'visualViewport', { height: 800 });
      render(<Page offset={0} />);
      expect(active()).toBe('c');
    });

    it("doesn't count a horizontal scrollbar's height, which the window has and the reader doesn't see past", () => {
      Object.assign(tops, { a: -900, b: -100, c: 500 });
      // With 15px of scrollbar, the window reaches 3000 here; the page shows
      // down to 2985.
      setScroll(2200, 3000);
      stub(document.documentElement, 'clientHeight', 785);
      stub(window, 'visualViewport', { height: 785 });
      render(<Page offset={0} />);
      expect(active()).toBe('b');
    });

    it("reads the end from the root's height under a pinch zoom", () => {
      Object.assign(tops, { a: -900, b: -100, c: 500 });
      setScroll(2200, 3000);
      stub(window, 'visualViewport', { height: 400 });
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

    it('skips an id with no element until one appears, and warns about nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      Object.assign(tops, { a: -300, b: 20, late: 30 });
      const { rerender } = render(
        <Page offset={50} sections={['a', 'b']} ids={['a', 'b', 'late']} />
      );
      expect(active()).toBe('b');
      rerender(
        <Page
          offset={50}
          sections={['a', 'b', 'late']}
          ids={['a', 'b', 'late']}
        />
      );
      scroll();
      expect(active()).toBe('late');
      expect(warn).not.toHaveBeenCalled();
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
      const onCurrentChange = vi.fn();
      const { unmount } = render(
        <Page offset={50} onCurrentChange={onCurrentChange} />
      );
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      clickLink('#a');
      unmount();
      onCurrentChange.mockClear();
      Object.assign(tops, { b: -200, c: 30 });
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      clickLink('#c');
      vi.advanceTimersByTime(1000);
      expect(onCurrentChange).not.toHaveBeenCalled();
    });
  });

  describe('after a jump', () => {
    // The page at its end, where c is the last section and b, short, sits
    // below the line with c under it: the rule says c, a jump to b says b.
    const atTheEnd = () => {
      Object.assign(tops, { a: -900, b: 300, c: 500 });
      setScroll(2200, 3000);
    };

    it('holds the section a plain click on its link goes to, and leaves the click alone', () => {
      atTheEnd();
      render(<Page offset={0} />);
      expect(active()).toBe('c');
      expect(clickLink('#b')).toBe(true);
      expect(active()).toBe('b');
    });

    it('keeps it once the page is still, where a jump puts it, until the next scroll', () => {
      atTheEnd();
      render(<Page offset={0} />);
      clickLink('#b');
      scroll();
      settle();
      expect(active()).toBe('b');
      scroll();
      expect(active()).toBe('c');
    });

    it('keeps one a shift of the layout moved by less than its own height', () => {
      Object.assign(tops, { a: -900, b: 0, c: 300 });
      render(<Page offset={0} />);
      clickLink('#b');
      // Something loads above b and pushes it 4px down, with no scroll.
      Object.assign(tops, { b: 4, c: 304 });
      settle();
      expect(active()).toBe('b');
    });

    it('lets go of one hidden before the page is still', () => {
      atTheEnd();
      render(<Page offset={0} />);
      clickLink('#b');
      undrawn.add('b');
      settle();
      expect(active()).toBe('c');
    });

    it('lets go of one moved further than its own height', () => {
      Object.assign(tops, { a: -900, b: 0, c: 300 });
      render(<Page offset={0} />);
      clickLink('#b');
      Object.assign(tops, { b: 41, c: 341 });
      settle();
      expect(active()).toBe('a');
    });

    it('lets go once the page is still away from it, as after a flick right after the click', () => {
      Object.assign(tops, { a: -900, b: 0, c: 300 });
      render(<Page offset={0} />);
      clickLink('#b');
      Object.assign(tops, { a: -1500, b: -600, c: -300 });
      scroll();
      expect(active()).toBe('b');
      settle();
      expect(active()).toBe('c');
    });

    it('shows it the whole way through a smooth jump, each scroll pushing the end back', () => {
      Object.assign(tops, { a: -900, b: -100, c: 600 });
      render(<Page offset={0} />);
      expect(active()).toBe('b');
      clickLink('#a');
      for (const a of [-600, -300, 0]) {
        Object.assign(tops, { a, b: a + 800, c: a + 1500 });
        scroll();
        act(() => {
          vi.advanceTimersByTime(70);
        });
        expect(active()).toBe('a');
      }
      settle();
      expect(active()).toBe('a');
    });

    it.each([
      ['Ctrl', { ctrlKey: true }],
      ['Cmd', { metaKey: true }],
      ['Shift', { shiftKey: true }],
      ['Alt', { altKey: true }],
      ['the middle button', { button: 1 }],
    ])('ignores a click with %s', (_, init) => {
      atTheEnd();
      render(<Page offset={0} />);
      clickLink('#b', init);
      expect(active()).toBe('c');
    });

    it('ignores a link that opens elsewhere, and takes one that names this page', () => {
      atTheEnd();
      render(<Page offset={0} />);
      clickLink('#b', {}, { target: '_blank' });
      expect(active()).toBe('c');
      clickLink('#b', {}, { target: '_self' });
      expect(active()).toBe('b');
    });

    it('ignores a link to another page, one with no fragment, and a click on no link', () => {
      atTheEnd();
      render(<Page offset={0} />);
      clickLink('/elsewhere#b');
      clickLink('/plain');
      act(() => {
        screen.getByTestId('active').click();
      });
      expect(active()).toBe('c');
    });

    it("ignores a link to an id that isn't watched, isn't on the page or isn't drawn", () => {
      atTheEnd();
      undrawn.add('c');
      render(<Page offset={0} ids={['a', 'b', 'c', 'gone']} />);
      expect(active()).toBe('b');
      for (const href of ['#footnote', '#gone', '#c']) clickLink(href);
      settle();
      expect(active()).toBe('b');
    });

    it('takes a link inside a shadow root', () => {
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

    it('reads a fragment that is percent-encoded, or not valid as that', () => {
      Object.assign(tops, { a: -900, café: 300, '100%': 400, z: 500 });
      setScroll(2200, 3000);
      render(<Page offset={0} sections={['a', 'café', '100%', 'z']} />);
      expect(active()).toBe('z');
      clickLink('#café');
      expect(active()).toBe('café');
      clickLink('#100%');
      expect(active()).toBe('100%');
    });

    describe('a page opened at #id', () => {
      it('holds the section, as a jump', () => {
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        render(<Page offset={0} />);
        expect(active()).toBe('b');
        settle();
        expect(active()).toBe('b');
        scroll();
        expect(active()).toBe('c');
      });

      it("lets it go once the page is still away from it, where the browser hasn't jumped", () => {
        Object.assign(tops, { a: -900, b: -400, c: 300 });
        window.history.replaceState(null, '', '#a');
        render(<Page offset={0} />);
        settle();
        expect(active()).toBe('b');
      });

      it.each(['reload', 'back_forward'])(
        "doesn't hold it when the page was reached by %s",
        type => {
          setNavigation(type);
          atTheEnd();
          window.history.replaceState(null, '', '#b');
          render(<Page offset={0} />);
          expect(active()).toBe('c');
        }
      );

      it('holds it when the page was opened by a link', () => {
        setNavigation('navigate');
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        render(<Page offset={0} />);
        expect(active()).toBe('b');
      });

      it("holds it through React's development double run of effects", () => {
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        render(
          <StrictMode>
            <Page offset={0} />
          </StrictMode>
        );
        settle();
        expect(active()).toBe('b');
      });

      it('keeps the hold when the ids change, and drops it when they leave its section out', () => {
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        const { rerender } = render(<Page offset={0} />);
        rerender(<Page offset={0} ids={['a', 'b', 'c', 'd']} />);
        settle();
        expect(active()).toBe('b');
        rerender(<Page offset={0} ids={['a', 'c']} />);
        expect(active()).toBe('c');
      });

      it('holds it when the ids arrive after mount, as from fetched content', () => {
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        const { rerender } = render(<Page offset={0} sections={[]} />);
        expect(active()).toBe('none');
        rerender(<Page offset={0} />);
        expect(active()).toBe('b');
        settle();
        expect(active()).toBe('b');
        scroll();
        expect(active()).toBe('c');
      });

      it("doesn't read the hash again when the ids or the offset change", () => {
        atTheEnd();
        window.history.replaceState(null, '', '#b');
        const { rerender } = render(<Page offset={0} />);
        settle();
        scroll();
        expect(active()).toBe('c');
        rerender(<Page offset={0} ids={['a', 'b', 'c', 'd']} />);
        rerender(<Page offset={1} ids={['a', 'b', 'c', 'd']} />);
        settle();
        expect(active()).toBe('c');
      });
    });
  });

  describe('onCurrentChange', () => {
    it('is called with each new id, and with null above the first section', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const onCurrentChange = vi.fn();
      render(<Page offset={50} onCurrentChange={onCurrentChange} />);
      expect(onCurrentChange.mock.calls).toEqual([['b']]);
      scroll();
      expect(onCurrentChange).toHaveBeenCalledTimes(1);
      Object.assign(tops, { a: 300, b: 620, c: 1000 });
      scroll();
      expect(onCurrentChange.mock.calls).toEqual([['b'], [null]]);
    });

    it('calls the latest function without watching the page again', () => {
      Object.assign(tops, { a: -300, b: 20, c: 400 });
      const add = vi.spyOn(window, 'addEventListener');
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<Page offset={50} onCurrentChange={first} />);
      rerender(<Page offset={50} onCurrentChange={second} />);
      expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(
        1
      );
      Object.assign(tops, { b: -200, c: 30 });
      scroll();
      expect(first.mock.calls).toEqual([['b']]);
      expect(second.mock.calls).toEqual([['c']]);
    });
  });

  it('is null on the server, and touches nothing there', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const html = renderToStaticMarkup(<Page offset={50} />);
    expect(html).toContain('<output data-testid="active">none</output>');
    expect(add).not.toHaveBeenCalled();
  });
});
