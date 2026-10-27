import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { ScrollArea, type ScrollAreaProps } from '../ScrollArea';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

// jsdom lays nothing out, so the viewport's sizes come from `metrics`, which
// each test sets before it renders or before it tells the observer.
const metrics = {
  scrollHeight: 100,
  clientHeight: 100,
  scrollWidth: 200,
  clientWidth: 200,
  offsetWidth: 200,
  offsetHeight: 100,
};
type Metric = keyof typeof metrics;
const reset = () =>
  Object.assign(metrics, {
    scrollHeight: 100,
    clientHeight: 100,
    scrollWidth: 200,
    clientWidth: 200,
    offsetWidth: 200,
    offsetHeight: 100,
  });

const isViewport = (el: Element) =>
  el.classList.contains('scroll-area-viewport') ||
  el.classList.contains('bestax-scroll-area-viewport');

const saved = new Map<Metric, PropertyDescriptor | undefined>();

beforeAll(() => {
  for (const key of Object.keys(metrics) as Metric[]) {
    saved.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get(this: HTMLElement) {
        return isViewport(this) ? metrics[key] : 0;
      },
    });
  }
});

afterAll(() => {
  for (const [key, descriptor] of saved) {
    if (descriptor)
      Object.defineProperty(HTMLElement.prototype, key, descriptor);
    else
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

/** A ResizeObserver the tests fire by hand. */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;
  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
    this.disconnected = false;
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
    this.disconnected = true;
  }
  fire() {
    act(() => {
      this.callback([], this as unknown as ResizeObserver);
    });
  }
}

const observer = () =>
  MockResizeObserver.instances[MockResizeObserver.instances.length - 1];

beforeEach(() => {
  reset();
  resetDevWarnings();
  MockResizeObserver.instances = [];
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
    MockResizeObserver;
});

afterEach(() => {
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  jest.restoreAllMocks();
});

type AreaProps = Partial<React.ComponentProps<typeof ScrollArea>>;

const renderArea = (props: AreaProps = {}) =>
  render(
    <ScrollArea aria-label="Notes" {...props}>
      {props.children ?? <p>Some notes.</p>}
    </ScrollArea>
  );

const viewportOf = (container: HTMLElement) =>
  container.querySelector('.scroll-area-viewport') as HTMLElement;

const overflowAttributes = (el: HTMLElement) =>
  Array.from(el.attributes)
    .map(attribute => attribute.name)
    .filter(name => name.startsWith('data-overflow'))
    .sort();

/** Scrolls the viewport to a position and lets it measure. */
const scrollTo = (el: HTMLElement, top: number, left = el.scrollLeft) => {
  el.scrollTop = top;
  el.scrollLeft = left;
  fireEvent.scroll(el);
};

describe('ScrollArea', () => {
  describe('Rendering', () => {
    it('renders a frame holding the viewport, which holds the children as given', () => {
      const { container } = renderArea();
      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass('scroll-area');
      expect(frame.children).toHaveLength(1);
      const viewport = frame.firstChild as HTMLElement;
      expect(viewport).toHaveClass('scroll-area-viewport');
      expect(viewport.innerHTML).toBe('<p>Some notes.</p>');
    });

    it('puts the helper props, className and style on the frame, and the rest on the viewport', () => {
      metrics.scrollHeight = 400;
      const ref = React.createRef<HTMLDivElement>();
      const { container } = renderArea({
        ref,
        className: 'box',
        style: { borderWidth: 2 },
        m: '2',
        textColor: 'primary',
        bgColor: 'light',
        id: 'notes',
        'aria-describedby': 'hint',
        'data-testid': 'area',
      } as AreaProps & { 'data-testid': string });
      const frame = container.firstChild as HTMLElement;
      const viewport = viewportOf(container);
      expect(frame).toHaveClass(
        'scroll-area',
        'box',
        'm-2',
        'has-text-primary',
        'has-background-light'
      );
      expect(frame.style.borderWidth).toBe('2px');
      expect(frame).not.toHaveAttribute('id');
      expect(viewport).toHaveAttribute('id', 'notes');
      expect(viewport).toHaveAttribute('aria-label', 'Notes');
      expect(viewport).toHaveAttribute('aria-describedby', 'hint');
      expect(viewport).toHaveAttribute('data-testid', 'area');
      expect(viewport.className).toBe('scroll-area-viewport');
      expect(ref.current).toBe(viewport);
    });

    it('calls a function ref with the viewport', () => {
      const ref = jest.fn();
      const { container, unmount } = renderArea({ ref });
      expect(ref).toHaveBeenCalledWith(viewportOf(container));
      unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });

    it('sizes the frame from height and maxHeight, a number in pixels, over a style of its own', () => {
      const { container, rerender } = renderArea({
        height: 240,
        style: { height: 10, color: 'red' },
      });
      const frame = container.firstChild as HTMLElement;
      expect(frame.style.height).toBe('240px');
      expect(frame.style.color).toBe('red');
      rerender(
        <ScrollArea aria-label="Notes" maxHeight="20rem">
          <p>Some notes.</p>
        </ScrollArea>
      );
      expect(frame.style.maxHeight).toBe('20rem');
      expect(frame.style.height).toBe('');
    });

    it("keeps a style's height when only maxHeight is given", () => {
      const { container } = renderArea({
        maxHeight: 300,
        style: { height: 120 },
      });
      const frame = container.firstChild as HTMLElement;
      expect(frame.style.height).toBe('120px');
      expect(frame.style.maxHeight).toBe('300px');
    });

    it('leaves the frame without a style when nothing sizes it', () => {
      const { container } = renderArea();
      expect(container.firstChild).not.toHaveAttribute('style');
    });

    it.each([
      [{}, []],
      [{ orientation: 'vertical' }, ['is-vertical']],
      [{ orientation: 'horizontal' }, ['is-horizontal']],
      [{ orientation: 'both' }, []],
      [{ showScrollbars: 'hover' }, ['has-hover-scrollbars']],
      [{ showScrollbars: 'always' }, ['has-visible-scrollbars']],
      [{ showScrollbars: 'auto' }, []],
      [{ hasStableGutter: true }, ['has-stable-gutter']],
      [{ hasFade: true }, ['has-fade']],
    ] as [Partial<ScrollAreaProps>, string[]][])(
      'gives the frame the classes for %j',
      (props, classes) => {
        const { container } = renderArea(props);
        expect((container.firstChild as HTMLElement).className).toBe(
          ['scroll-area', ...classes].join(' ')
        );
      }
    );

    it('has a display name', () => {
      expect(ScrollArea.displayName).toBe('ScrollArea');
    });
  });

  describe('A tab stop while it overflows', () => {
    it('is a plain box with no name while the content fits', () => {
      const { container } = render(
        <ScrollArea aria-labelledby="notes-title" aria-describedby="hint">
          <p>Some notes.</p>
        </ScrollArea>
      );
      const viewport = viewportOf(container);
      expect(viewport).not.toHaveAttribute('role');
      expect(viewport).not.toHaveAttribute('tabindex');
      expect(viewport).not.toHaveAttribute('aria-labelledby');
      expect(viewport).toHaveAttribute('aria-describedby', 'hint');
      expect(overflowAttributes(viewport)).toEqual([]);
    });

    it('is a named region you can tab to while it overflows', () => {
      metrics.scrollHeight = 400;
      const { container } = renderArea();
      const region = screen.getByRole('region', { name: 'Notes' });
      expect(region).toBe(viewportOf(container));
      expect(region).toHaveAttribute('tabindex', '0');
    });

    it('becomes one when its content grows past it, and stops when it shrinks back', () => {
      const { container } = renderArea();
      const viewport = viewportOf(container);
      metrics.scrollHeight = 400;
      observer().fire();
      expect(viewport).toHaveAttribute('role', 'region');
      expect(viewport).toHaveAttribute('aria-label', 'Notes');
      metrics.scrollHeight = 100;
      observer().fire();
      expect(viewport).not.toHaveAttribute('role');
      expect(viewport).not.toHaveAttribute('tabindex');
      expect(viewport).not.toHaveAttribute('aria-label');
    });

    it('becomes one when text it holds grows, which resizes no element', async () => {
      const Log = ({ text }: { text: string }) => (
        <ScrollArea aria-label="Log" height={100}>
          {text}
        </ScrollArea>
      );
      const { container, rerender } = render(<Log text="one line" />);
      const viewport = viewportOf(container);
      expect(viewport).not.toHaveAttribute('role');
      const observed = Array.from(observer().observed);
      metrics.scrollHeight = 400;
      // React rewrites the text node in place: a characterData mutation.
      await act(async () => {
        rerender(<Log text={'many lines '.repeat(40)} />);
      });
      expect(viewport).toHaveAttribute('role', 'region');
      // A change inside the content leaves what's observed as it was.
      expect(Array.from(observer().observed)).toEqual(observed);
    });

    it('becomes one when an inline child grows, which a ResizeObserver never reports', async () => {
      const Line = ({ text }: { text: string }) => (
        <ScrollArea aria-label="Line" height={100}>
          <span>{text}</span>
        </ScrollArea>
      );
      const { container, rerender } = render(<Line text="short" />);
      metrics.scrollHeight = 400;
      await act(async () => {
        rerender(<Line text={'longer '.repeat(80)} />);
      });
      expect(viewportOf(container)).toHaveAttribute('role', 'region');
    });

    it('keeps its tab stop while it has focus, and drops it once focus leaves', () => {
      metrics.scrollHeight = 400;
      const { container } = renderArea();
      const viewport = viewportOf(container);
      act(() => viewport.focus());
      metrics.scrollHeight = 100;
      observer().fire();
      expect(viewport).toHaveAttribute('role', 'region');
      expect(viewport).toHaveAttribute('tabindex', '0');
      expect(viewport).toHaveFocus();
      act(() => viewport.blur());
      expect(viewport).not.toHaveAttribute('role');
      expect(viewport).not.toHaveAttribute('tabindex');
    });

    it("doesn't count focus on something inside it as its own", () => {
      const { container } = render(
        <ScrollArea aria-label="Links">
          <a href="#one">One</a>
        </ScrollArea>
      );
      const viewport = viewportOf(container);
      const link = screen.getByRole('link');
      act(() => link.focus());
      expect(viewport).not.toHaveAttribute('role');
      act(() => link.blur());
      expect(viewport).not.toHaveAttribute('tabindex');
    });

    it('still calls the onFocus, onBlur and onScroll it was given', () => {
      metrics.scrollHeight = 400;
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      const onScroll = jest.fn();
      const { container } = renderArea({ onFocus, onBlur, onScroll });
      const viewport = viewportOf(container);
      act(() => viewport.focus());
      act(() => viewport.blur());
      scrollTo(viewport, 50);
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(onScroll).toHaveBeenCalledTimes(1);
    });

    it('never lets a role or a tabIndex passed in win', () => {
      const props = { role: 'list', tabIndex: 3 } as unknown as ScrollAreaProps;
      const { container, rerender } = render(
        <ScrollArea aria-label="Notes" {...props}>
          x
        </ScrollArea>
      );
      const viewport = viewportOf(container);
      expect(viewport).not.toHaveAttribute('role');
      expect(viewport).not.toHaveAttribute('tabindex');
      metrics.scrollHeight = 400;
      rerender(
        <ScrollArea aria-label="Notes" {...props}>
          y
        </ScrollArea>
      );
      observer().fire();
      expect(viewport).toHaveAttribute('role', 'region');
      expect(viewport).toHaveAttribute('tabindex', '0');
    });

    it('counts only the axes it scrolls', () => {
      metrics.scrollWidth = 600;
      const { container, rerender } = renderArea({ orientation: 'vertical' });
      const viewport = viewportOf(container);
      expect(viewport).not.toHaveAttribute('role');
      rerender(
        <ScrollArea aria-label="Notes" orientation="horizontal">
          <p>Some notes.</p>
        </ScrollArea>
      );
      expect(viewport).toHaveAttribute('role', 'region');
      expect(overflowAttributes(viewport)).toEqual(['data-overflow-end']);
      metrics.scrollWidth = 200;
      metrics.scrollHeight = 400;
      observer().fire();
      expect(viewport).not.toHaveAttribute('role');
    });

    it('allows a pixel of slack before it calls the content overflowing', () => {
      metrics.scrollHeight = 101;
      const { container } = renderArea();
      expect(viewportOf(container)).not.toHaveAttribute('role');
    });
  });

  describe('Edges', () => {
    it('marks each edge that has more past it, as it scrolls', () => {
      metrics.scrollHeight = 400;
      metrics.scrollWidth = 600;
      const { container } = renderArea();
      const viewport = viewportOf(container);
      expect(overflowAttributes(viewport)).toEqual([
        'data-overflow-bottom',
        'data-overflow-end',
      ]);
      scrollTo(viewport, 150, 200);
      expect(overflowAttributes(viewport)).toEqual([
        'data-overflow-bottom',
        'data-overflow-end',
        'data-overflow-start',
        'data-overflow-top',
      ]);
      scrollTo(viewport, 300, 400);
      expect(overflowAttributes(viewport)).toEqual([
        'data-overflow-start',
        'data-overflow-top',
      ]);
    });

    it('reads start and end from the direction, right to left from the right', () => {
      metrics.scrollWidth = 600;
      const real = window.getComputedStyle;
      jest
        .spyOn(window, 'getComputedStyle')
        .mockImplementation((el, pseudo) => {
          const style = real(el, pseudo);
          return isViewport(el)
            ? ({ ...style, direction: 'rtl' } as CSSStyleDeclaration)
            : style;
        });
      const onEdgeReach = jest.fn();
      const { container } = renderArea({ onEdgeReach });
      const viewport = viewportOf(container);
      expect(overflowAttributes(viewport)).toEqual(['data-overflow-end']);
      // Right to left, scrollLeft runs negative toward the end.
      scrollTo(viewport, 0, -400);
      expect(overflowAttributes(viewport)).toEqual(['data-overflow-start']);
      expect(onEdgeReach).toHaveBeenLastCalledWith('end');
      scrollTo(viewport, 0, 0);
      expect(onEdgeReach).toHaveBeenLastCalledWith('start');
    });

    it('calls onEdgeReach once on arriving at an edge, and again only after leaving it', () => {
      metrics.scrollHeight = 400;
      const onEdgeReach = jest.fn();
      const { container } = renderArea({ onEdgeReach });
      const viewport = viewportOf(container);
      scrollTo(viewport, 100);
      expect(onEdgeReach).not.toHaveBeenCalled();
      scrollTo(viewport, 300);
      expect(onEdgeReach).toHaveBeenCalledTimes(1);
      expect(onEdgeReach).toHaveBeenLastCalledWith('bottom');
      scrollTo(viewport, 300);
      expect(onEdgeReach).toHaveBeenCalledTimes(1);
      scrollTo(viewport, 0);
      expect(onEdgeReach).toHaveBeenCalledTimes(2);
      expect(onEdgeReach).toHaveBeenLastCalledWith('top');
    });

    it('reads the latest onEdgeReach, not the one it started with', () => {
      metrics.scrollHeight = 400;
      const first = jest.fn();
      const second = jest.fn();
      const { container, rerender } = renderArea({ onEdgeReach: first });
      rerender(
        <ScrollArea aria-label="Notes" onEdgeReach={second}>
          <p>Some notes.</p>
        </ScrollArea>
      );
      scrollTo(viewportOf(container), 300);
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith('bottom');
    });

    it("doesn't call onEdgeReach on mount, or when the content changes size", () => {
      metrics.scrollHeight = 400;
      const onEdgeReach = jest.fn();
      const { container } = renderArea({ onEdgeReach });
      const viewport = viewportOf(container);
      viewport.scrollTop = 300;
      metrics.scrollHeight = 400;
      observer().fire();
      expect(overflowAttributes(viewport)).toEqual(['data-overflow-top']);
      expect(onEdgeReach).not.toHaveBeenCalled();
    });

    it('works without onEdgeReach', () => {
      metrics.scrollHeight = 400;
      const { container } = renderArea();
      const viewport = viewportOf(container);
      expect(() => scrollTo(viewport, 300)).not.toThrow();
      expect(overflowAttributes(viewport)).toEqual(['data-overflow-top']);
    });
  });

  describe('Measuring', () => {
    it('measures the scrollbars, less the borders, for the fade', () => {
      Object.assign(metrics, {
        scrollHeight: 400,
        offsetWidth: 216,
        clientWidth: 200,
        offsetHeight: 116,
        clientHeight: 100,
      });
      const { container } = render(
        <ScrollArea aria-label="Notes" hasFade>
          x
        </ScrollArea>
      );
      const viewport = viewportOf(container);
      viewport.style.border = '2px solid';
      metrics.offsetWidth = 216;
      observer().fire();
      expect(
        viewport.style.getPropertyValue('--scroll-area-bar-inline-size')
      ).toBe('12px');
      expect(
        viewport.style.getPropertyValue('--scroll-area-bar-block-size')
      ).toBe('12px');
    });

    it('never measures a bar smaller than nothing', () => {
      metrics.offsetWidth = 100;
      const { container } = renderArea();
      expect(
        viewportOf(container).style.getPropertyValue(
          '--scroll-area-bar-inline-size'
        )
      ).toBe('0px');
    });

    it('observes the viewport and each child, and follows children coming and going', async () => {
      const Area = ({ count }: { count: number }) => (
        <ScrollArea aria-label="Messages">
          {Array.from({ length: count }, (_, i) => (
            <p key={i}>Message {i}</p>
          ))}
        </ScrollArea>
      );
      const { container, rerender } = render(<Area count={1} />);
      const viewport = viewportOf(container);
      expect(Array.from(observer().observed)).toEqual([
        viewport,
        viewport.children[0],
      ]);
      metrics.scrollHeight = 400;
      // The MutationObserver reports the new child and re-measures.
      await act(async () => {
        rerender(<Area count={3} />);
      });
      expect(Array.from(observer().observed)).toEqual([
        viewport,
        ...Array.from(viewport.children),
      ]);
      expect(viewport).toHaveAttribute('role', 'region');
    });

    it('stops observing when it unmounts', () => {
      const { unmount } = renderArea();
      const resizes = observer();
      unmount();
      expect(resizes.disconnected).toBe(true);
    });

    it('measures again with a new orientation', () => {
      metrics.scrollHeight = 400;
      const { container, rerender } = renderArea();
      const viewport = viewportOf(container);
      expect(viewport).toHaveAttribute('role', 'region');
      rerender(
        <ScrollArea aria-label="Notes" orientation="horizontal">
          <p>Some notes.</p>
        </ScrollArea>
      );
      expect(viewport).not.toHaveAttribute('role');
    });

    it('measures once and on scroll where there is no ResizeObserver', () => {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
      metrics.scrollHeight = 400;
      const { container } = renderArea();
      const viewport = viewportOf(container);
      expect(viewport).toHaveAttribute('role', 'region');
      scrollTo(viewport, 300);
      expect(overflowAttributes(viewport)).toEqual(['data-overflow-top']);
    });

    it('works without a MutationObserver', () => {
      const real = globalThis.MutationObserver;
      delete (globalThis as { MutationObserver?: unknown }).MutationObserver;
      try {
        metrics.scrollHeight = 400;
        const { container, unmount } = renderArea();
        expect(viewportOf(container)).toHaveAttribute('role', 'region');
        unmount();
      } finally {
        globalThis.MutationObserver = real;
      }
    });

    it('skips a measurement that finds nothing new', () => {
      metrics.scrollHeight = 400;
      const renders = jest.fn();
      const Probe = () => {
        renders();
        return <p>x</p>;
      };
      const { container } = render(
        <ScrollArea aria-label="Notes">
          <Probe />
        </ScrollArea>
      );
      const before = renders.mock.calls.length;
      observer().fire();
      fireEvent.scroll(viewportOf(container));
      expect(renders.mock.calls.length).toBe(before);
    });
  });

  describe('A name', () => {
    it('warns in development when it has neither aria-label nor aria-labelledby', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<ScrollArea>x</ScrollArea>);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('<ScrollArea> has no accessible name')
      );
    });

    it.each([
      [{ 'aria-label': 'Notes' }],
      [{ 'aria-labelledby': 'notes-title' }],
    ])("doesn't warn when it's named with %j", name => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<ScrollArea {...name}>x</ScrollArea>);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('Server rendering', () => {
    const Area = () => (
      <ScrollArea aria-label="Notes" height={240} hasFade>
        <p>Some notes.</p>
      </ScrollArea>
    );

    it('renders a plain scroller on the server, with no role, name, tab stop or edges', () => {
      metrics.scrollHeight = 400;
      const html = renderToString(<Area />);
      expect(html).toBe(
        '<div class="scroll-area has-fade" style="height:240px">' +
          '<div class="scroll-area-viewport"><p>Some notes.</p></div></div>'
      );
    });

    it('hydrates without a mismatch, then measures', async () => {
      metrics.scrollHeight = 400;
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Area />);
      document.body.appendChild(container);
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <Area />);
          unmountRoot = () => root.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
        expect(viewportOf(container)).toHaveAttribute('role', 'region');
        expect(viewportOf(container)).toHaveAttribute('aria-label', 'Notes');
      } finally {
        await act(async () => unmountRoot());
        document.body.removeChild(container);
      }
    });
  });

  describe('Class prefix', () => {
    it('prefixes every class under ConfigProvider classPrefix', () => {
      metrics.scrollHeight = 400;
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <ScrollArea
            aria-label="Notes"
            orientation="vertical"
            showScrollbars="hover"
            hasStableGutter
            hasFade
            m="2"
          >
            x
          </ScrollArea>
        </ConfigProvider>
      );
      const frame = container.firstChild as HTMLElement;
      expect(frame.className).toBe(
        'bestax-scroll-area bestax-is-vertical bestax-has-hover-scrollbars bestax-has-stable-gutter bestax-has-fade bestax-m-2'
      );
      const viewport = frame.firstChild as HTMLElement;
      expect(viewport.className).toBe('bestax-scroll-area-viewport');
      expect(viewport).toHaveAttribute('role', 'region');
    });
  });
});
