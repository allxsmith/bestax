import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Reveal } from '../Reveal';
import { ConfigProvider } from '../../helpers/Config';

type Listener = (event: { matches: boolean }) => void;

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

  /** Hands the observer's callback `entries`, as one delivery. */
  deliver(entries: Partial<IntersectionObserverEntry>[]) {
    act(() => {
      this.callback(
        entries as IntersectionObserverEntry[],
        this as unknown as IntersectionObserver
      );
    });
  }

  trigger(isIntersecting: boolean) {
    this.deliver([
      { isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 },
    ]);
  }

  /** The thresholds the observer was made with, as a list. */
  get thresholdList(): number[] {
    const { threshold = 0 } = this.options ?? {};
    return Array.isArray(threshold) ? threshold : [threshold];
  }

  /** How many thresholds the element was past at the last entry reported. */
  past = 0;

  /**
   * Scrolls the element on through `ratios` of it in view, inside a viewport
   * of `view` for an element of `box`, and reports entries the way browsers
   * do: only when the ratio crosses one of the observer's thresholds, with
   * `isIntersecting` true from the lowest one up, where 0 means any of it.
   * That's what Chromium, Firefox and WebKit report for a section observed
   * at [0.15] and at [0, 0.15] (#1907). The element starts out of view, as
   * `observe()` reports it, and each call carries on from where the last left
   * it.
   */
  scrollThrough(
    ratios: number[],
    view: { width: number; height: number },
    box: { width: number; height: number }
  ) {
    const thresholds = this.thresholdList;
    const pastAt = (ratio: number) =>
      thresholds.filter(t => (t === 0 ? ratio > 0 : ratio >= t)).length;
    for (const ratio of ratios) {
      const past = pastAt(ratio);
      if (past === this.past) continue;
      this.past = past;
      this.deliver([
        {
          isIntersecting: past > 0,
          intersectionRatio: ratio,
          rootBounds: view as DOMRectReadOnly,
          boundingClientRect: box as DOMRectReadOnly,
        },
      ]);
    }
  }
}

function mockMatchMedia(matches: boolean) {
  const listeners: Listener[] = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_event: string, cb: Listener) => listeners.push(cb),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return { mql, listeners };
}

describe('Reveal', () => {
  const originalIntersectionObserver = global.IntersectionObserver;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    global.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
    window.matchMedia = originalMatchMedia;
  });

  describe('rendering', () => {
    it('renders children inside a div by default', () => {
      const { container } = render(
        <Reveal>
          <p>Hello</p>
        </Reveal>
      );
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(container.querySelector('div.reveal')).toBeInTheDocument();
    });

    it('renders as a custom element via the `as` prop', () => {
      const { container } = render(
        <Reveal as="section" data-testid="section">
          Content
        </Reveal>
      );
      expect(container.querySelector('section.reveal')).toBeInTheDocument();
    });

    it('renders as a custom, non-forwardRef component via the `as` prop', () => {
      // Modeled on this library's own components (Section, Card, ...), which
      // are plain function components with no ref forwarding.
      const Custom: React.FC<{
        children?: React.ReactNode;
        'data-testid'?: string;
      }> = ({ children, ...rest }) => <article {...rest}>{children}</article>;
      const { container } = render(
        <Reveal as={Custom} data-testid="custom" animation="fade">
          Content
        </Reveal>
      );
      expect(screen.getByTestId('custom').tagName).toBe('ARTICLE');
      // Falls back to an internal wrapper div for scroll observation, since
      // Custom can't accept a ref.
      expect(
        container.querySelector('div.reveal.reveal-fade')
      ).toContainElement(screen.getByTestId('custom'));
    });

    it('applies the animation class once mounted', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      expect(container.querySelector('.reveal-fade')).toBeInTheDocument();
    });

    it('applies default fade-up animation class', () => {
      const { container } = render(<Reveal>Content</Reveal>);
      expect(container.querySelector('.reveal-fade-up')).toBeInTheDocument();
    });

    it('merges a custom className and passes through helper props', () => {
      const { container } = render(
        <Reveal className="custom-class" m="4">
          Content
        </Reveal>
      );
      const el = container.querySelector('.reveal');
      expect(el).toHaveClass('custom-class');
      expect(el).toHaveClass('m-4');
    });

    it('applies duration and delay as inline transition styles', () => {
      const { container } = render(
        <Reveal duration={800} delay={200}>
          Content
        </Reveal>
      );
      const el = container.querySelector('.reveal') as HTMLElement;
      expect(el.style.transitionDuration).toBe('800ms');
      expect(el.style.transitionDelay).toBe('200ms');
    });

    it('applies classPrefix from ConfigProvider', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Reveal animation="fade">Content</Reveal>
        </ConfigProvider>
      );
      const el = container.querySelector('.bulma-reveal');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('bulma-reveal-fade');
      expect(el).not.toHaveClass('reveal');
    });
  });

  describe('IntersectionObserver behavior', () => {
    it('is not revealed before intersecting', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      expect(container.querySelector('.reveal')).not.toHaveClass('is-revealed');
    });

    it('observes the rendered node with the given threshold', () => {
      render(<Reveal threshold={0.4}>Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];
      expect(instance.observe).toHaveBeenCalled();
      expect(instance.options).toEqual({ threshold: [0, 0.4] });
    });

    it('clamps a threshold above 1 down to 1', () => {
      render(<Reveal threshold={2}>Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];
      expect(instance.options).toEqual({ threshold: [0, 1] });
    });

    it('clamps a negative threshold up to 0', () => {
      render(<Reveal threshold={-0.5}>Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];
      expect(instance.options).toEqual({ threshold: 0 });
    });

    it('falls back to the default threshold for a non-finite value', () => {
      render(<Reveal threshold={NaN}>Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];
      expect(instance.options).toEqual({ threshold: [0, 0.15] });
    });

    it('adds is-revealed once the element intersects', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];

      instance.trigger(true);

      expect(container.querySelector('.reveal')).toHaveClass('is-revealed');
    });

    it('unobserves after the first reveal by default (once=true)', () => {
      render(<Reveal>Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];

      instance.trigger(true);

      expect(instance.unobserve).toHaveBeenCalled();
    });

    it('stays revealed on exit when once=true (default)', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];

      instance.trigger(true);
      instance.trigger(false);

      expect(container.querySelector('.reveal')).toHaveClass('is-revealed');
    });

    it('toggles is-revealed on exit when once=false', () => {
      const { container } = render(
        <Reveal once={false} animation="fade">
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      instance.trigger(true);
      expect(container.querySelector('.reveal')).toHaveClass('is-revealed');

      instance.trigger(false);
      expect(container.querySelector('.reveal')).not.toHaveClass('is-revealed');
      expect(instance.unobserve).not.toHaveBeenCalled();
    });

    // On a 320 by 256 viewport (400% zoom of 1280 by 1024), a section 2000px
    // tall can show at most 12.8% of itself, under the default 15%.
    const zoomed = { width: 320, height: 256 };
    const tall = { width: 320, height: 2000 };
    // On a 320 by 568 phone, a 400px section can show all of itself.
    const phone = { width: 320, height: 568 };
    const fits = { width: 320, height: 400 };
    const revealed = (container: HTMLElement) =>
      container.querySelector('.reveal')!.classList.contains('is-revealed');

    it('reveals a section too tall ever to show `threshold` of itself as soon as any of it is in view', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];

      instance.scrollThrough([0.02], zoomed, tall);

      expect(revealed(container)).toBe(true);
    });

    it('waits for `threshold` on a section that can show it', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];

      instance.scrollThrough([0.02, 0.1], phone, fits);
      expect(revealed(container)).toBe(false);

      instance.scrollThrough([0.14, 0.22], phone, fits);
      expect(revealed(container)).toBe(true);
    });

    it('measures against the window when the browser gives no root size, as in a cross-origin frame', () => {
      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];
      /** An entry at 2% in view, with no root size, for an element `height` tall. */
      const entryFor = (height: number) => ({
        isIntersecting: true,
        intersectionRatio: 0.02,
        rootBounds: null,
        boundingClientRect: { width: 320, height } as DOMRectReadOnly,
      });

      // jsdom's window is 768px tall, so a 2000px element can show 38% of
      // itself, and waits for 15%.
      instance.deliver([entryFor(2000)]);
      expect(revealed(container)).toBe(false);

      // A 6000px one can show 12.8%, under 15%.
      instance.deliver([entryFor(6000)]);
      expect(revealed(container)).toBe(true);
    });

    it('goes by the newest entry when several arrive at once', () => {
      const { container } = render(
        <Reveal once={false} animation="fade">
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];
      const entryAt = (ratio: number) => ({
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
        rootBounds: phone as DOMRectReadOnly,
        boundingClientRect: fits as DOMRectReadOnly,
      });

      // Past 0, then past `threshold`, in one delivery: it's 40% in view.
      instance.deliver([entryAt(0.05), entryAt(0.4)]);
      expect(revealed(container)).toBe(true);

      // Back below `threshold`, then out of view.
      instance.deliver([entryAt(0.1), entryAt(0)]);
      expect(revealed(container)).toBe(false);
    });

    it('with once=false, hides a section that drops below `threshold`', () => {
      const { container } = render(
        <Reveal once={false} animation="fade">
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      instance.scrollThrough([0.05, 0.22], phone, fits);
      expect(revealed(container)).toBe(true);
      instance.scrollThrough([0.095], phone, fits);
      expect(revealed(container)).toBe(false);
      instance.scrollThrough([0.22], phone, fits);
      expect(revealed(container)).toBe(true);
    });

    it('with once=false, keeps a too-tall section shown while any of it is in view, and hides it once it leaves', () => {
      const { container } = render(
        <Reveal once={false} animation="fade">
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      instance.scrollThrough([0.02, 0.06, 0.1, 0.128, 0.1], zoomed, tall);
      expect(revealed(container)).toBe(true);
      instance.scrollThrough([0.06, 0.02, 0], zoomed, tall);
      expect(revealed(container)).toBe(false);
    });

    it('observes a threshold of 0 at 0 alone', () => {
      render(<Reveal threshold={0}>Content</Reveal>);
      const instance = MockIntersectionObserver.instances[0];
      expect(instance.thresholdList).toEqual([0]);
    });

    it('reveals immediately when IntersectionObserver is unavailable', () => {
      // @ts-expect-error simulating an environment without IntersectionObserver
      delete global.IntersectionObserver;

      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      expect(container.querySelector('.reveal')).toHaveClass('is-revealed');
    });

    it('still observes and reveals when `as` is a non-forwardRef component', () => {
      // Regression test: a plain function component (like this library's own
      // Section/Card) can't accept a ref directly, so Reveal must fall back
      // to its internal wrapper div rather than silently never observing.
      const Plain: React.FC<{ children?: React.ReactNode }> = ({
        children,
      }) => <p>{children}</p>;

      const { container } = render(
        <Reveal as={Plain} animation="fade">
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];
      expect(instance.observe).toHaveBeenCalled();

      instance.trigger(true);

      expect(container.querySelector('.reveal')).toHaveClass('is-revealed');
    });
  });

  describe('prefers-reduced-motion', () => {
    it('renders the final state immediately and skips the animation class', () => {
      mockMatchMedia(true);

      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      const el = container.querySelector('.reveal') as HTMLElement;

      expect(el).toHaveClass('is-revealed');
      expect(el).not.toHaveClass('reveal-fade');
    });

    it('reacts to a change event from the media query', () => {
      const { listeners } = mockMatchMedia(false);

      const { container } = render(<Reveal animation="fade">Content</Reveal>);
      expect(container.querySelector('.reveal')).toHaveClass('reveal-fade');

      act(() => {
        listeners.forEach(listener => listener({ matches: true }));
      });

      expect(container.querySelector('.reveal')).not.toHaveClass('reveal-fade');
    });
  });

  describe('cascade', () => {
    it('clones each direct child with animation classes and a staggered delay', () => {
      const { container } = render(
        <Reveal cascade cascadeInterval={50} duration={300} animation="fade">
          <div data-testid="item-0">A</div>
          <div data-testid="item-1">B</div>
          <div data-testid="item-2">C</div>
        </Reveal>
      );

      const item0 = screen.getByTestId('item-0');
      const item1 = screen.getByTestId('item-1');
      const item2 = screen.getByTestId('item-2');

      expect(item0).toHaveClass('reveal-fade');
      expect(item0.style.transitionDelay).toBe('0ms');
      expect(item1.style.transitionDelay).toBe('50ms');
      expect(item2.style.transitionDelay).toBe('100ms');
      [item0, item1, item2].forEach(item => {
        expect(item.style.transitionDuration).toBe('300ms');
      });

      // The container itself is not animated as a single block.
      expect(container.querySelector('.reveal')).not.toHaveClass('reveal-fade');
    });

    it('reveals cascaded children together once the container intersects', () => {
      render(
        <Reveal cascade animation="fade">
          <div data-testid="item-0">A</div>
          <div data-testid="item-1">B</div>
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      instance.trigger(true);

      expect(screen.getByTestId('item-0')).toHaveClass('is-revealed');
      expect(screen.getByTestId('item-1')).toHaveClass('is-revealed');
    });

    it('wraps non-element children (e.g. text nodes) in a span', () => {
      const { container } = render(
        <Reveal cascade animation="fade">
          Plain text
        </Reveal>
      );
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span).toHaveClass('reveal-fade');
      expect(span).toHaveTextContent('Plain text');
    });

    it('merges cascaded child className and style rather than overwriting them', () => {
      render(
        <Reveal cascade animation="fade">
          <div
            data-testid="item-0"
            className="existing-class"
            style={{ color: 'red' }}
          >
            A
          </div>
        </Reveal>
      );
      const item = screen.getByTestId('item-0');
      expect(item).toHaveClass('existing-class');
      expect(item).toHaveClass('reveal-fade');
      expect(item.style.color).toBe('red');
    });
  });

  describe('SSR safety', () => {
    it('renders the final, visible markup with no animation class before hydration', () => {
      const html = renderToStaticMarkup(
        <Reveal animation="fade-up">
          <p>SSR content</p>
        </Reveal>
      );
      expect(html).toContain('SSR content');
      expect(html).not.toContain('reveal-fade-up');
    });
  });
});
