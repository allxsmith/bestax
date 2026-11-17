import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Reveal } from '../Reveal';
import type { RevealAnimation } from '../Reveal';
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
      entryOf(isIntersecting ? 1 : 0, null, { width: 1, height: 1 }),
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
  scrollThrough(ratios: number[], view: Size, box: Size, place: Place = {}) {
    const thresholds = this.thresholdList;
    const pastAt = (ratio: number) =>
      thresholds.filter(t => (t === 0 ? ratio > 0 : ratio >= t)).length;
    for (const ratio of ratios) {
      const past = pastAt(ratio);
      if (past === this.past) continue;
      this.past = past;
      this.deliver([entryOf(ratio, view, box, place)]);
    }
  }
}

/** A width and a height. */
type Size = { width: number; height: number };

/** A rectangle of `size` at the viewport's corner. */
const rectOf = ({ width, height }: Size) =>
  ({
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
  }) as DOMRectReadOnly;

/** Where an entering element sits, beyond how much of it is in view. */
type Place = {
  /**
   * The share of its width in view, as a sideways offset leaves it, moved
   * that far off the viewport's right side. All of it by default.
   */
  across?: number;
  /**
   * The edge it comes up from: the viewport's bottom by default, or the
   * bottom of a container that clips it higher up.
   */
  bottom?: number;
  /**
   * Where its left edge is, for a part cut off on the left. By default, the
   * part out of view is off the right.
   */
  left?: number;
};

/**
 * An entry for an element of `box` coming up into a viewport of `view`, with
 * `ratio` of it in view, placed as `place` says. A `view` of null is a root
 * the browser gives no size for, as in a cross-origin frame, and stands for
 * jsdom's window.
 */
function entryOf(
  ratio: number,
  view: Size | null,
  box: Size,
  { across = 1, bottom, left: leftEdge }: Place = {}
): Partial<IntersectionObserverEntry> {
  const edge = bottom ?? (view ? view.height : window.innerHeight);
  const seenHeight = ratio > 0 ? (ratio * box.height) / across : 0;
  const top = edge - seenHeight;
  const left = leftEdge ?? box.width * (1 - across);
  const placed = (width: number, height: number, x: number, y: number) =>
    ({
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
      width,
      height,
    }) as DOMRectReadOnly;
  return {
    isIntersecting: ratio > 0,
    intersectionRatio: ratio,
    rootBounds: view && rectOf(view),
    boundingClientRect: placed(box.width, box.height, left, top),
    intersectionRect: placed(
      ratio > 0 ? box.width * across : 0,
      seenHeight,
      Math.max(left, 0),
      top
    ),
  };
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

      // jsdom's window is 768px tall, so a 2000px element can show 38% of
      // itself, and waits for 15%.
      instance.deliver([entryOf(0.02, null, { width: 320, height: 2000 })]);
      expect(revealed(container)).toBe(false);

      // A 6000px one can show 12.8%, under 15%.
      instance.deliver([entryOf(0.02, null, { width: 320, height: 6000 })]);
      expect(revealed(container)).toBe(true);
    });

    it('goes by the newest entry when several arrive at once', () => {
      const { container } = render(
        <Reveal once={false} animation="fade">
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      // Past 0, then past `threshold`, in one delivery: it's 40% in view.
      instance.deliver([entryOf(0.05, phone, fits), entryOf(0.4, phone, fits)]);
      expect(revealed(container)).toBe(true);

      // Back below `threshold`, then out of view.
      instance.deliver([entryOf(0.1, phone, fits), entryOf(0, phone, fits)]);
      expect(revealed(container)).toBe(false);
    });

    // #1940: an element that can't reach `threshold` for a reason other
    // than the viewport's size.
    describe('in a scrolling container', () => {
      /**
       * Gives `el` the layout jsdom leaves out: `size` inside, as drawn and as
       * laid out, at `top` in the viewport.
       */
      const layOut = (el: HTMLElement, size: Size, top = 0) => {
        for (const [name, value] of Object.entries({
          clientWidth: size.width,
          clientHeight: size.height,
          offsetWidth: size.width,
          offsetHeight: size.height,
        })) {
          Object.defineProperty(el, name, { value, configurable: true });
        }
        const rect = {
          ...rectOf(size),
          top,
          bottom: top + size.height,
        } as DOMRect;
        el.getBoundingClientRect = () => rect;
        el.getClientRects = () => [rect] as unknown as DOMRectList;
      };

      /** Renders the Reveal inside a box that clips with `overflow`. */
      const renderInBox = (overflow: React.CSSProperties) => {
        const { container } = render(
          <div data-testid="box" style={overflow}>
            <Reveal animation="fade">Content</Reveal>
          </div>
        );
        return { container, box: screen.getByTestId('box') };
      };
      const desktop = { width: 1024, height: 1000 };
      const section = { width: 1024, height: 2000 };

      it('reveals a section too tall for the container to show `threshold` of it as soon as any of it is in view', () => {
        // A 250px box can show 12.5% of a 2000px section, under 15%, though
        // the 1000px viewport could show half of it.
        const { container, box } = renderInBox({ overflowY: 'auto' });
        layOut(box, { width: 1024, height: 250 });
        const instance = MockIntersectionObserver.instances[0];

        // Most of the section is below the box but inside the viewport.
        instance.scrollThrough([0.013], desktop, section, { bottom: 250 });

        expect(revealed(container)).toBe(true);
      });

      it('waits for `threshold` in a container tall enough to show it, however little of the container is on the screen yet', () => {
        // The 600px box has only its top 20px on the screen as the section
        // peeks in, but it scrolls into view whole, and then shows 30%.
        const { container, box } = renderInBox({
          overflowX: 'hidden',
          overflowY: 'hidden',
        });
        layOut(box, { width: 1024, height: 600 }, 980);
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.005, 0.1], desktop, section);
        expect(revealed(container)).toBe(false);

        instance.scrollThrough([0.2], desktop, section);
        expect(revealed(container)).toBe(true);
      });

      it('takes the size the container is drawn at, as a transform that scales it draws it', () => {
        // Laid out 500px tall and drawn at half that, it shows 12.5% of the
        // section.
        const { container, box } = renderInBox({ overflowY: 'auto' });
        layOut(box, { width: 1024, height: 500 });
        box.getBoundingClientRect = () =>
          rectOf({ width: 512, height: 250 }) as DOMRect;
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.013], desktop, section, { bottom: 250 });

        expect(revealed(container)).toBe(true);
      });

      it('cuts only the way the container clips', () => {
        // `overflow-x: clip` leaves its height alone, so the section can
        // still show half of itself in the 1000px viewport.
        const { container, box } = renderInBox({
          overflowX: 'clip',
          overflowY: 'visible',
        });
        layOut(box, { width: 1024, height: 250 });
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.013], desktop, section);

        expect(revealed(container)).toBe(false);
      });

      it('counts the body as a container when the page clips what overflows it', () => {
        const { body, documentElement } = document;
        documentElement.style.overflowY = 'hidden';
        body.style.overflowY = 'auto';
        const drawn = body.getBoundingClientRect;
        try {
          const { container } = render(
            <Reveal animation="fade">Content</Reveal>
          );
          layOut(body, { width: 1024, height: 250 });
          const instance = MockIntersectionObserver.instances[0];

          instance.scrollThrough([0.013], desktop, section, { bottom: 250 });

          expect(revealed(container)).toBe(true);
        } finally {
          documentElement.style.overflowY = '';
          body.style.overflowY = '';
          body.getBoundingClientRect = drawn;
          delete (body as Partial<HTMLElement>).getClientRects;
          for (const name of [
            'clientWidth',
            'clientHeight',
            'offsetWidth',
            'offsetHeight',
          ]) {
            delete (body as unknown as Record<string, unknown>)[name];
          }
        }
      });

      it('takes no sideways scroll from a container further out than the nearest one that clips it sideways', () => {
        // 100px of a 400px card shows inside a 300px `overflow: hidden` box,
        // all of it in view up and down, waiting for half of itself.
        // Scrolling the `overflow-x: auto` row around the box moves the box
        // with it, so no more of it ever shows.
        const { container } = render(
          <div data-testid="row" style={{ overflowX: 'auto' }}>
            <div
              data-testid="box"
              style={{ overflowX: 'hidden', overflowY: 'hidden' }}
            >
              <Reveal animation="fade" threshold={0.5}>
                Content
              </Reveal>
            </div>
          </div>
        );
        layOut(screen.getByTestId('row'), { width: 1024, height: 300 });
        layOut(screen.getByTestId('box'), { width: 300, height: 300 });
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough(
          [0.25],
          desktop,
          { width: 400, height: 300 },
          {
            across: 0.25,
          }
        );

        expect(revealed(container)).toBe(true);
      });

      it('finds a container outside the shadow root the Reveal is in', () => {
        // As in the docs site's live examples, which render in a shadow root.
        const scroller = document.createElement('div');
        scroller.style.overflowY = 'auto';
        const host = document.createElement('div');
        scroller.appendChild(host);
        document.body.appendChild(scroller);
        const mount = document.createElement('div');
        host.attachShadow({ mode: 'open' }).appendChild(mount);
        try {
          render(<Reveal animation="fade">Content</Reveal>, {
            container: mount,
            baseElement: mount,
          });
          layOut(scroller, { width: 1024, height: 250 });
          const instance = MockIntersectionObserver.instances[0];

          instance.scrollThrough([0.013], desktop, section, { bottom: 250 });

          expect(revealed(mount)).toBe(true);
        } finally {
          scroller.remove();
        }
      });

      it('finds a container a web component wraps the slot the Reveal is in with', () => {
        const host = document.createElement('div');
        const shadow = host.attachShadow({ mode: 'open' });
        const scroller = document.createElement('div');
        scroller.style.overflowY = 'auto';
        scroller.appendChild(document.createElement('slot'));
        shadow.appendChild(scroller);
        const mount = document.createElement('div');
        host.appendChild(mount);
        document.body.appendChild(host);
        try {
          render(<Reveal animation="fade">Content</Reveal>, {
            container: mount,
            baseElement: mount,
          });
          layOut(scroller, { width: 1024, height: 250 });
          const instance = MockIntersectionObserver.instances[0];

          instance.scrollThrough([0.013], desktop, section, { bottom: 250 });

          expect(revealed(mount)).toBe(true);
        } finally {
          host.remove();
        }
      });

      it('takes no size from an inline element, which overflow does not apply to', () => {
        const { container } = render(
          <span
            data-testid="inline"
            style={{ overflowX: 'hidden', overflowY: 'hidden' }}
          >
            <Reveal animation="fade">Content</Reveal>
          </span>
        );
        // An inline box reports no inside, whatever size it's drawn at.
        const inline = screen.getByTestId('inline');
        const drawn = rectOf({ width: 1024, height: 20 }) as DOMRect;
        inline.getBoundingClientRect = () => drawn;
        inline.getClientRects = () => [drawn] as unknown as DOMRectList;
        Object.defineProperty(inline, 'offsetWidth', { value: 1024 });
        Object.defineProperty(inline, 'offsetHeight', { value: 20 });
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.013], desktop, section);

        expect(revealed(container)).toBe(false);
      });

      it('takes the size an SVG element that clips it is drawn at', () => {
        // An SVG element has no layout size apart from how it's drawn.
        const { container } = render(
          <svg data-testid="svg">
            <foreignObject width="1024" height="2000">
              <Reveal animation="fade">Content</Reveal>
            </foreignObject>
          </svg>
        );
        const svg = screen.getByTestId('svg') as unknown as HTMLElement;
        svg.style.overflowX = 'hidden';
        svg.style.overflowY = 'hidden';
        layOut(svg, { width: 1024, height: 250 });
        Object.defineProperty(svg, 'offsetWidth', { value: undefined });
        Object.defineProperty(svg, 'offsetHeight', { value: undefined });
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.013], desktop, section, { bottom: 250 });

        expect(revealed(container)).toBe(true);
      });

      it('takes the viewport alone for a Reveal rendered outside the document', () => {
        const detached = document.createElement('div');
        render(<Reveal animation="fade">Content</Reveal>, {
          container: detached,
          baseElement: detached,
        });
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.013], desktop, section);

        expect(revealed(detached)).toBe(false);
      });

      it('leaves the body out while the page itself scrolls', () => {
        document.body.style.overflowY = 'auto';
        try {
          const { container } = render(
            <Reveal animation="fade">Content</Reveal>
          );
          const instance = MockIntersectionObserver.instances[0];

          instance.scrollThrough([0.013], desktop, section);

          expect(revealed(container)).toBe(false);
        } finally {
          document.body.style.overflowY = '';
        }
      });
    });

    it('reveals a section kept partly off the screen sideways once any of it is in view when it can never show `threshold` of itself', () => {
      // A full-width section 3500px tall, 64px off a 320px phone's side, as
      // `slide-left` keeps it until it reveals: 80% of its width shows, and
      // 568px of its height at most, which is 13% of it. Its size alone says
      // it could show 16%.
      const { container } = render(
        <Reveal animation="slide-left">Content</Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      instance.scrollThrough(
        [0.01],
        phone,
        { width: 320, height: 3500 },
        {
          across: 0.8,
        }
      );

      expect(revealed(container)).toBe(true);
    });

    it('with once=false, keeps a section it revealed before it showed `threshold` of itself revealed until it leaves', () => {
      // Kept 64px sideways, the 3300px section can show 14% of itself on the
      // phone, so it reveals at once. Revealed, with no offset, it can show
      // 17%; hiding it as it drops under 15% would bring the offset back, and
      // with it no way to cross 15% again while it stays in view.
      const { container } = render(
        <Reveal animation="slide-left" once={false}>
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];
      const section = { width: 320, height: 3300 };

      instance.scrollThrough([0.01], phone, section, { across: 0.8 });
      expect(revealed(container)).toBe(true);

      instance.scrollThrough([0.16, 0.14], phone, section);
      expect(revealed(container)).toBe(true);

      instance.scrollThrough([0], phone, section);
      expect(revealed(container)).toBe(false);

      instance.scrollThrough([0.01], phone, section, { across: 0.8 });
      expect(revealed(container)).toBe(true);
    });

    it('asks again once its own move into its hidden place ends, which no entry reports', () => {
      // Scrolled back into view while it's still sliding into its hidden
      // place, 32px of its 64px off the side, the 3300px section can show
      // 15.5% of itself and waits. Once the slide ends, 64px off, it can show
      // 14%, and the fresh entry the end of the slide asks for reveals it.
      const { container } = render(
        <Reveal animation="slide-left" once={false}>
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];
      const section = { width: 320, height: 3300 };
      const end = (target: Element, propertyName: string) => {
        target.dispatchEvent(
          Object.assign(new Event('transitionend', { bubbles: true }), {
            propertyName,
          })
        );
      };
      instance.scrollThrough([0.01], phone, section, { across: 0.9 });
      expect(revealed(container)).toBe(false);
      instance.observe.mockClear();

      // A child's moves nothing that counts.
      const reveal = container.firstElementChild as HTMLElement;
      reveal.appendChild(document.createElement('span'));
      end(reveal.lastElementChild!, 'transform');
      expect(instance.observe).not.toHaveBeenCalled();

      end(reveal, 'transform');
      expect(instance.observe).toHaveBeenCalled();
      instance.deliver([entryOf(0.008, phone, section, { across: 0.8 })]);

      expect(revealed(container)).toBe(true);
    });

    it('asks again when its own transition is cut short, which leaves it where it was headed', () => {
      render(
        <Reveal animation="slide-left" once={false}>
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];
      instance.observe.mockClear();

      (document.querySelector('.reveal') as HTMLElement).dispatchEvent(
        new Event('transitioncancel')
      );

      expect(instance.observe).toHaveBeenCalled();
    });

    it('reveals a section in view top to bottom, kept partly off a page that does not scroll sideways, when it can never show `threshold` of itself', () => {
      // A full-width 300px card 64px off a 320px phone's side, all in view up
      // and down, waits for 90%: it shows 80%, and the page doesn't scroll
      // sideways to show the rest.
      const { container } = render(
        <Reveal animation="slide-right" threshold={0.9}>
          Content
        </Reveal>
      );
      const instance = MockIntersectionObserver.instances[0];

      instance.scrollThrough(
        [0.8],
        phone,
        { width: 320, height: 300 },
        {
          across: 0.8,
        }
      );

      expect(revealed(container)).toBe(true);
    });

    it('reveals a card kept partly outside a container that clips it sideways once any of it is in view, when it can never show `threshold` of itself', () => {
      // 64px of a 200px card at the right edge of an `overflow-x: hidden`
      // container, narrower than the viewport, sits outside it until it
      // reveals, so it can show 68% of itself at most, under the 80% it waits
      // for, though all of it is inside the viewport.
      const { container } = render(
        <div data-testid="box" style={{ overflowX: 'hidden' }}>
          <Reveal animation="slide-left" threshold={0.8}>
            Content
          </Reveal>
        </div>
      );
      const instance = MockIntersectionObserver.instances[0];
      const card = { width: 200, height: 300 };

      instance.scrollThrough([0.05], { width: 1024, height: 1000 }, card, {
        across: 0.68,
      });

      expect(revealed(container)).toBe(true);
    });

    describe('in a container that scrolls sideways', () => {
      /**
       * Lays `row` out `width` wide at the viewport's left, with `room` more
       * to scroll to, and scrolled `scrollLeft` along.
       */
      const layOutRow = (
        row: HTMLElement,
        width: number,
        room: number,
        scrollLeft = 0
      ) => {
        const rect = rectOf({ width, height: 300 }) as DOMRect;
        row.getBoundingClientRect = () => rect;
        row.getClientRects = () => [rect] as unknown as DOMRectList;
        for (const [name, value] of Object.entries({
          clientWidth: width,
          clientHeight: 300,
          offsetWidth: width,
          offsetHeight: 300,
          scrollWidth: width + room,
          scrollLeft,
        })) {
          Object.defineProperty(row, name, { value });
        }
      };
      const renderInRow = (
        style: React.CSSProperties,
        props: { animation?: RevealAnimation; threshold?: number } = {}
      ) => {
        const { container } = render(
          <div data-testid="row" style={style}>
            <Reveal animation="fade" {...props}>
              Content
            </Reveal>
          </div>
        );
        return { container, row: screen.getByTestId('row') };
      };
      const desktop = { width: 1024, height: 1000 };
      const card = { width: 300, height: 300 };

      it('waits for `threshold` from a card cut off on the side it can scroll to', () => {
        // 30px of a 300px card shows at the right edge of a 300px
        // `overflow-x: auto` row that's all in view up and down, with 300px
        // more to scroll to: scrolling it can show all of the card.
        const { container, row } = renderInRow({ overflowX: 'auto' });
        layOutRow(row, 300, 300);
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.1], desktop, card, { across: 0.1 });

        expect(revealed(container)).toBe(false);
      });

      it('reveals a card an offset keeps off the start of a container scrolling up and down, which no scroll reaches', () => {
        // A browser reports `overflow-x: auto` for an `overflow-y: auto`
        // pane. A 300px `slide-right` card sits 64px off its left edge, all
        // in view up and down, waiting for 90%, and the pane has nothing to
        // scroll to sideways.
        const { container, row } = renderInRow(
          { overflowX: 'auto', overflowY: 'auto' },
          { animation: 'slide-right', threshold: 0.9 }
        );
        layOutRow(row, 300, 0);
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.79], desktop, card, {
          across: 0.79,
          left: -64,
        });

        expect(revealed(container)).toBe(true);
      });

      it('counts the room a right-to-left row has to scroll left', () => {
        // Right to left, a row at its start has all its room to the left,
        // where 270px of the card are cut off.
        const { container, row } = renderInRow({
          overflowX: 'auto',
          direction: 'rtl',
        });
        layOutRow(row, 300, 300, 0);
        const instance = MockIntersectionObserver.instances[0];

        instance.scrollThrough([0.1], desktop, card, {
          across: 0.1,
          left: -270,
        });

        expect(revealed(container)).toBe(false);
      });
    });

    describe('when its size or the window changes', () => {
      class MockResizeObserver {
        static instances: MockResizeObserver[] = [];
        callback: ResizeObserverCallback;
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
          MockResizeObserver.instances.push(this);
        }
        /** Reports `target`, the first element observed by default, at `size`. */
        report(
          size: Size,
          target: Element = this.observe.mock.calls[0][0] as Element
        ) {
          this.callback(
            [{ target, contentRect: rectOf(size) } as ResizeObserverEntry],
            this as unknown as ResizeObserver
          );
        }
      }
      const originalResizeObserver = global.ResizeObserver;

      beforeEach(() => {
        MockResizeObserver.instances = [];
        global.ResizeObserver =
          MockResizeObserver as unknown as typeof ResizeObserver;
      });

      afterEach(() => {
        global.ResizeObserver = originalResizeObserver;
      });

      it('observes the element again when its size changes, for a fresh entry, and not for the size it starts with', () => {
        render(<Reveal animation="fade">Content</Reveal>);
        const instance = MockIntersectionObserver.instances[0];
        const resize = MockResizeObserver.instances[0];
        expect(resize.observe).toHaveBeenCalled();
        instance.observe.mockClear();

        resize.report({ width: 320, height: 600 });
        resize.report({ width: 320, height: 600 });
        expect(instance.observe).not.toHaveBeenCalled();

        resize.report({ width: 320, height: 4000 });
        expect(instance.unobserve).toHaveBeenCalled();
        expect(instance.observe).toHaveBeenCalled();
      });

      it('reveals a section that grows past what the viewport can show `threshold` of, once any of it is in view', () => {
        // It peeks in at 600px tall, able to reach 15%, so it waits; then it
        // grows to 4000px, which the 568px viewport can show 14% of, and the
        // fresh entry its new size asks for reveals it.
        const { container } = render(<Reveal animation="fade">Content</Reveal>);
        const instance = MockIntersectionObserver.instances[0];
        const resize = MockResizeObserver.instances[0];
        resize.report({ width: 320, height: 600 });
        instance.scrollThrough([0.05], phone, { width: 320, height: 600 });
        expect(revealed(container)).toBe(false);

        resize.report({ width: 320, height: 4000 });
        instance.deliver([entryOf(0.007, phone, { width: 320, height: 4000 })]);

        expect(revealed(container)).toBe(true);
      });

      it('observes the element again when a container that clips it changes size, as a resized pane does', () => {
        const scroller = document.createElement('div');
        scroller.style.overflowY = 'auto';
        scroller.getClientRects = () =>
          [rectOf({ width: 1024, height: 600 })] as unknown as DOMRectList;
        document.body.appendChild(scroller);
        try {
          render(<Reveal animation="fade">Content</Reveal>, {
            container: scroller.appendChild(document.createElement('div')),
          });
          const instance = MockIntersectionObserver.instances[0];
          const resize = MockResizeObserver.instances[0];
          // It's watched from when the section is first measured against it.
          expect(resize.observe).not.toHaveBeenCalledWith(scroller);
          const entry = entryOf(
            0.05,
            { width: 1024, height: 1000 },
            { width: 1024, height: 2000 }
          );
          instance.deliver([entry]);
          instance.deliver([entry]);
          expect(
            resize.observe.mock.calls.filter(([el]) => el === scroller)
          ).toHaveLength(1);
          resize.report({ width: 1024, height: 600 }, scroller);
          instance.observe.mockClear();

          resize.report({ width: 1024, height: 250 }, scroller);

          expect(instance.observe).toHaveBeenCalled();
        } finally {
          scroller.remove();
        }
      });

      it("listens for the resize of the window its document is in, or the page's for a document with no window", () => {
        const doc = document.implementation.createHTMLDocument();
        const mount = doc.body.appendChild(doc.createElement('div'));
        render(<Reveal animation="fade">Content</Reveal>, {
          container: mount,
          baseElement: mount,
        });
        const instance = MockIntersectionObserver.instances[0];
        instance.observe.mockClear();

        act(() => {
          window.dispatchEvent(new Event('resize'));
        });

        expect(instance.observe).toHaveBeenCalled();
      });

      it('observes the element again when the window resizes, as turning a phone or zooming in does', () => {
        render(<Reveal animation="fade">Content</Reveal>);
        const instance = MockIntersectionObserver.instances[0];
        instance.observe.mockClear();

        act(() => {
          window.dispatchEvent(new Event('resize'));
        });

        expect(instance.unobserve).toHaveBeenCalled();
        expect(instance.observe).toHaveBeenCalled();
      });

      it('stops watching its size, the window and its transitions once it reveals for good', () => {
        const { container } = render(<Reveal animation="fade">Content</Reveal>);
        const instance = MockIntersectionObserver.instances[0];

        instance.trigger(true);
        expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled();

        instance.observe.mockClear();
        window.dispatchEvent(new Event('resize'));
        container.firstElementChild!.dispatchEvent(
          Object.assign(new Event('transitionend'), {
            propertyName: 'transform',
          })
        );
        expect(instance.observe).not.toHaveBeenCalled();
      });

      it('stops watching its size and the window when it unmounts', () => {
        const { unmount } = render(<Reveal animation="fade">Content</Reveal>);
        const instance = MockIntersectionObserver.instances[0];
        unmount();
        expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled();

        instance.observe.mockClear();
        window.dispatchEvent(new Event('resize'));
        expect(instance.observe).not.toHaveBeenCalled();
      });
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
