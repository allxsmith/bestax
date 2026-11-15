import React, {
  StrictMode,
  createRef,
  useEffect,
  useRef,
  useState,
} from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Tour,
  TourBack,
  TourNext,
  TourProgress,
  TourSkip,
  TourStep,
  useTour,
} from '../Tour';
import { Controlled as ControlledStory } from '../Tour.stories';
import type { TourProps, TourState } from '../Tour';
import { Modal } from '../Modal';
import { Popover } from '../Popover';
import { Buttons } from '../../elements/Buttons';
import { ConfigProvider } from '../../helpers/Config';
import { useClientLayoutEffect } from '../../helpers/useClientLayoutEffect';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

/**
 * jsdom lays nothing out, so an element's box comes from its `data-rect`
 * ("top left width height"), and anything without one is 200 by 100 at the
 * top left. An element inside `hidden` has no box. The viewport is 1000 by
 * 800, and `direction` follows the nearest `dir`.
 */
const root = document.documentElement;
const computed = window.getComputedStyle;

beforeEach(() => {
  resetDevWarnings();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(
    function (this: HTMLElement) {
      return (this.closest('[hidden]') ? [] : [{}]) as unknown as DOMRectList;
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      const [top, left, width, height] = (
        this.isConnected ? (this.dataset.rect ?? '0 0 200 100') : '0 0 0 0'
      )
        .split(' ')
        .map(Number);
      return {
        top,
        left,
        width,
        height,
        bottom: top + height,
        right: left + width,
        x: left,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    }
  );
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (el: Element, pseudo?: string | null) => {
      const style = computed(el, pseudo);
      if (el.closest('[dir="rtl"]') === null) return style;
      return { ...style, direction: 'rtl' } as CSSStyleDeclaration;
    }
  );
  Object.defineProperty(root, 'clientWidth', {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(root, 'clientHeight', {
    configurable: true,
    value: 800,
  });
  // A frame runs at once, so what a change asks to measure lands in `act`.
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    callback(0);
    return 0;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(root, 'clientWidth');
  Reflect.deleteProperty(root, 'clientHeight');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  Reflect.deleteProperty(window, 'matchMedia');
  Reflect.deleteProperty(globalThis, 'ResizeObserver');
  Reflect.deleteProperty(globalThis, 'IntersectionObserver');
});

/** A ResizeObserver the tests fire by hand, recording what it watches. */
class MockResizeObserver {
  static all: MockResizeObserver[] = [];
  watched = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.all.push(this);
  }
  observe(el: Element) {
    this.watched.add(el);
  }
  unobserve(el: Element) {
    this.watched.delete(el);
  }
  disconnect() {
    this.watched.clear();
  }
  fire() {
    act(() => {
      this.callback([], this as unknown as ResizeObserver);
    });
  }
}

/**
 * Installs the mock. The tour watches its target and the page with one
 * observer, and the step is placed by `useAnchoredPosition`, which watches
 * the step and its target with another, so a test reads what all of the
 * live ones watch, and fires them all.
 */
const withResizeObserver = () => {
  MockResizeObserver.all = [];
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: MockResizeObserver,
  });
  const live = () =>
    MockResizeObserver.all.filter(observer => observer.watched.size > 0);
  return {
    watches: (el: Element) => live().some(observer => observer.watched.has(el)),
    fire: () => live().forEach(observer => observer.fire()),
  };
};

/** An IntersectionObserver the tests report to by hand. */
class MockIntersectionObserver {
  static last: MockIntersectionObserver | null = null;
  watched = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
    MockIntersectionObserver.last = this;
  }
  observe(el: Element) {
    this.watched.add(el);
  }
  unobserve(el: Element) {
    this.watched.delete(el);
  }
  disconnect() {
    this.watched.clear();
  }
  report(el: Element, isIntersecting: boolean) {
    act(() => {
      this.callback(
        [{ target: el, isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    });
  }
}

const withIntersectionObserver = () => {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: MockIntersectionObserver,
  });
  return () => MockIntersectionObserver.last as MockIntersectionObserver;
};

const steps = (
  <>
    <Tour.Step title="Welcome">A quick look around.</Tour.Step>
    <>
      <Tour.Step target="#filters" title="Filters">
        The filters narrow the list.
      </Tour.Step>
    </>
    <Tour.Step target="#export" title="Export" position="left">
      Export downloads the rows.
    </Tour.Step>
  </>
);

/** A page with an opener, two targets and a tour. */
function Page({
  children = steps,
  ...props
}: Partial<TourProps> & { children?: React.ReactNode }) {
  return (
    <>
      <button type="button" id="opener">
        Open
      </button>
      <button type="button" id="filters" data-rect="100 100 80 30">
        Filters
      </button>
      <button type="button" id="export" data-rect="100 800 80 30">
        Export
      </button>
      <Tour {...props}>{children}</Tour>
    </>
  );
}

/** A page whose opener opens the tour, as most apps do. */
function Controlled(props: Partial<TourProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Take the tour
      </button>
      <Page
        {...props}
        open={open}
        onOpenChange={next => {
          props.onOpenChange?.(next);
          setOpen(next);
        }}
      />
    </>
  );
}

type TourActions = Pick<TourState, 'next' | 'back' | 'skip'>;

/** Hands the step's actions on to app code, which may call them later. */
function KeepActions({ onKeep }: { onKeep: (actions: TourActions) => void }) {
  const { next, back, skip } = useTour() as TourState;
  useEffect(() => onKeep({ next, back, skip }), [onKeep, next, back, skip]);
  return null;
}

/** A controlled tour on its second step, whose footer hands its actions on. */
function KeptTour(props: {
  onKeep: (actions: TourActions) => void;
  onChange: (value: number) => void;
  onOpenChange: (open: boolean) => void;
  onFinish: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState(1);
  return (
    <Tour
      open={open}
      onOpenChange={o => {
        props.onOpenChange(o);
        setOpen(o);
      }}
      value={value}
      onChange={v => {
        props.onChange(v);
        setValue(v);
      }}
      onFinish={props.onFinish}
      footer={
        <>
          <KeepActions onKeep={props.onKeep} />
          <Tour.Skip />
        </>
      }
    >
      <Tour.Step title="One">1</Tour.Step>
      <Tour.Step title="Two">2</Tour.Step>
      <Tour.Step title="Three">3</Tour.Step>
    </Tour>
  );
}

/** Two targets and a tour of tips on them, opened in any order. */
function Tips({
  children,
  ...props
}: Partial<TourProps> & { children?: React.ReactNode }) {
  return (
    <>
      <button type="button" id="opener">
        Open
      </button>
      <button type="button" id="filters" data-rect="100 100 80 30">
        Filters
      </button>
      <button type="button" id="export" data-rect="100 800 80 30">
        Export
      </button>
      <Tour mode="beacon" {...props}>
        {children ?? (
          <>
            <Tour.Step target="#filters" title="Filters">
              The filters narrow the list.
            </Tour.Step>
            <Tour.Step target="#export" title="Export">
              Export downloads the rows.
            </Tour.Step>
          </>
        )}
      </Tour>
    </>
  );
}

const beacons = () => screen.queryAllByRole('button', { name: /^Show tip/ });
const beacon = (name: string) =>
  screen.getByRole('button', { name: `Show tip ${name}` });

const dialog = () => screen.getByRole('dialog');
const next = () => screen.getByRole('button', { name: /^(Next|Done)$/ });
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement as Element, { key, ...init });

describe('Tour', () => {
  describe('rendering', () => {
    it('renders nothing while closed, and nothing on the server', () => {
      const { container } = render(<Page />);
      expect(container.querySelector('.tour')).toBeNull();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(renderToStaticMarkup(<Page defaultOpen />)).not.toContain('tour');
    });

    it('shows one step at a time in a portal, named by its title and described by its body', () => {
      const { container } = render(<Page defaultOpen />);
      const step = screen.getByRole('dialog', { name: 'Welcome' });
      expect(step).toHaveAccessibleDescription('A quick look around.');
      expect(step).toHaveAttribute('aria-modal', 'true');
      expect(step).toHaveClass('tour-step', 'is-centered');
      expect(container.contains(step)).toBe(false);
      expect(step.parentElement).toHaveClass('tour');
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(
        screen.getByRole('heading', { level: 2, name: 'Welcome' })
      ).toHaveClass('tour-step-title');
    });

    it('counts steps inside fragments, and writes the progress line', () => {
      render(<Page defaultOpen />);
      expect(screen.getByText('Step 1 of 3')).toHaveClass('tour-progress');
    });

    it('has Skip, Next and a close button on the first step, and no Back', () => {
      render(<Page defaultOpen />);
      expect(screen.getByRole('button', { name: 'Skip' })).toHaveClass(
        'button',
        'is-text'
      );
      expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
        'delete'
      );
      expect(next()).toHaveClass('button', 'is-primary');
      expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    });

    it('renders nothing for a tour without steps', () => {
      render(<Tour defaultOpen />);
      expect(document.querySelector('.tour')).toBeNull();
    });

    it('renders nothing for a Tour.Step outside a tour', () => {
      const { container } = render(
        <TourStep title="Alone">Nothing here.</TourStep>
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('leaves out children that aren’t steps, and warns once', () => {
      const Wrapped = () => <Tour.Step title="Wrapped">Inside.</Tour.Step>;
      render(
        <Tour defaultOpen>
          <Tour.Step title="Kept">Kept.</Tour.Step>
          <Wrapped />
          text
        </Tour>
      );
      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
      expect(screen.queryByText('Inside.')).toBeNull();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('takes Tour.Step children')
      );
    });

    it('renders the title as titleAs asks, and h2 for anything else', () => {
      const { unmount } = render(<Page defaultOpen titleAs="h3" />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Welcome'
      );
      unmount();
      render(
        <Page defaultOpen titleAs={'h1' as unknown as TourProps['titleAs']} />
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('takes the words from labels, and the English ones for an empty label', () => {
      render(
        <Page
          defaultOpen
          defaultValue={1}
          labels={{
            skip: 'Omitir',
            back: 'Atrás',
            next: '',
            close: 'Cerrar',
            progress: (step, total) => `Paso ${step} de ${total}`,
          }}
        />
      );
      expect(screen.getByRole('button', { name: 'Omitir' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Atrás' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeVisible();
      expect(screen.getByText('Paso 2 de 3')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByRole('button', { name: 'Done' })).toBeVisible();
    });

    it('writes Done from labels on the last step', () => {
      render(<Page defaultOpen defaultValue={2} labels={{ done: 'Listo' }} />);
      expect(screen.getByRole('button', { name: 'Listo' })).toBeVisible();
    });

    it('writes the step numbers in the LocaleProvider’s locale', () => {
      render(
        <LocaleProvider locale="ar-EG">
          <Page defaultOpen />
        </LocaleProvider>
      );
      expect(screen.getByText('Step ١ of ٣')).toBeInTheDocument();
    });

    it('takes a step without a body, and leaves it undescribed', () => {
      render(
        <Tour defaultOpen>
          <Tour.Step title="Just a title" />
          <Tour.Step title="False">{false}</Tour.Step>
          <Tour.Step title="Empty">{''}</Tour.Step>
          <Tour.Step title="Nothing in a list">{[false, null, '']}</Tour.Step>
        </Tour>
      );
      for (let i = 0; i < 4; i++) {
        expect(dialog()).not.toHaveAttribute('aria-describedby');
        if (i < 3) fireEvent.click(next());
      }
    });
  });

  describe('naming', () => {
    it('is named by aria-label in place of the title', () => {
      render(
        <Tour defaultOpen>
          <Tour.Step title="Shown" aria-label="Spoken">
            Body.
          </Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('dialog', { name: 'Spoken' })).toBeVisible();
      expect(dialog()).not.toHaveAttribute('aria-labelledby');
    });

    it('warns once about a step with neither a title nor an aria-label', () => {
      render(
        <Tour defaultOpen>
          <Tour.Step title="">Body.</Tour.Step>
        </Tour>
      );
      expect(dialog()).not.toHaveAttribute('aria-labelledby');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('no accessible name')
      );
    });

    it('keeps the title’s name and the body’s description through a spread of undefined, and takes its own', () => {
      const spread = {
        'aria-labelledby': undefined,
        'aria-describedby': undefined,
      };
      const { unmount } = render(
        <Tour defaultOpen>
          <Tour.Step title="Kept" {...spread}>
            Described.
          </Tour.Step>
        </Tour>
      );
      expect(
        screen.getByRole('dialog', { name: 'Kept' })
      ).toHaveAccessibleDescription('Described.');
      unmount();
      render(
        <>
          <p id="own">Own description</p>
          <Tour defaultOpen>
            <Tour.Step title="Own" aria-describedby="own">
              Body.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(dialog()).toHaveAccessibleDescription('Own description');
    });

    it('stays quiet about a step named by aria-labelledby', () => {
      render(
        <>
          <p id="name">Named elsewhere</p>
          <Tour defaultOpen>
            <Tour.Step aria-labelledby="name">Body.</Tour.Step>
          </Tour>
        </>
      );
      expect(
        screen.getByRole('dialog', { name: 'Named elsewhere' })
      ).toBeVisible();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('state', () => {
    it('walks the steps uncontrolled, and finishes on Done', () => {
      const onChange = vi.fn();
      const onFinish = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Page
          defaultOpen
          onChange={onChange}
          onFinish={onFinish}
          onOpenChange={open => {
            onOpenChange(open);
            expect(onFinish).toHaveBeenCalled();
          }}
        />
      );
      fireEvent.click(next());
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onChange).toHaveBeenLastCalledWith(0);
      fireEvent.click(next());
      fireEvent.click(next());
      expect(next()).toHaveTextContent('Done');
      fireEvent.click(next());
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('finishes without an onFinish', () => {
      render(<Page defaultOpen defaultValue={2} />);
      fireEvent.click(next());
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it.each([
      [
        'Skip',
        () => fireEvent.click(screen.getByRole('button', { name: 'Skip' })),
      ],
      [
        'the close button',
        () => fireEvent.click(screen.getByRole('button', { name: 'Close' })),
      ],
      ['Escape', () => press('Escape')],
    ])('ends without finishing on %s', (_name, end) => {
      const onFinish = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Page
          defaultOpen
          defaultValue={2}
          onFinish={onFinish}
          onOpenChange={onOpenChange}
        />
      );
      end();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onFinish).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('stays open on Escape with closeOnEscape off', () => {
      render(<Page defaultOpen closeOnEscape={false} />);
      press('Escape');
      expect(dialog()).toBeVisible();
    });

    it('without the overlay, ends only on an Escape from inside the step', () => {
      const onOpenChange = vi.fn();
      render(
        <>
          <input aria-label="Search the page" />
          <Tour defaultOpen overlay={false} onOpenChange={onOpenChange}>
            <Tour.Step title="Search">
              <div role="dialog" aria-label="Nested">
                <button type="button">In the nested dialog</button>
              </div>
            </Tour.Step>
          </Tour>
        </>
      );
      const field = screen.getByRole('textbox', { name: 'Search the page' });
      field.focus();
      expect(fireEvent.keyDown(field, { key: 'Escape' })).toBe(true);
      fireEvent.keyDown(
        screen.getByRole('button', { name: 'In the nested dialog' }),
        { key: 'Escape' }
      );
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(fireEvent.keyDown(next(), { key: 'Escape' })).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('without the overlay and closeOnEscape off, stays open on an Escape inside the step', () => {
      render(<Page defaultOpen overlay={false} closeOnEscape={false} />);
      press('Escape');
      expect(dialog()).toBeVisible();
    });

    it('only reports the step and the end while controlled', () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Page open value={1} onChange={onChange} onOpenChange={onOpenChange} />
      );
      fireEvent.click(next());
      expect(onChange).toHaveBeenCalledWith(2);
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(dialog()).toBeVisible();
    });

    it('shows the nearest step for a value past either end', () => {
      const { rerender } = render(<Page open value={7} />);
      expect(screen.getByRole('dialog', { name: 'Export' })).toBeVisible();
      rerender(<Page open value={-3} />);
      expect(screen.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
    });

    it('starts a different step at the same index with a body of its own', () => {
      const Notes = ({ steps }: { steps: string[] }) => (
        <Tour open>
          {steps.map(name => (
            <Tour.Step key={name} title={name}>
              <input aria-label="Note" />
            </Tour.Step>
          ))}
        </Tour>
      );
      const { rerender } = render(<Notes steps={['One', 'Two']} />);
      const note = () => screen.getByRole('textbox', { name: 'Note' });
      fireEvent.change(note(), { target: { value: 'typed in One' } });
      rerender(<Notes steps={['Two']} />);
      expect(note()).toHaveValue('');
    });

    it('rounds a fraction down, and shows the first step for NaN', () => {
      const { rerender } = render(<Page open value={1.5} />);
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
      rerender(<Page open value={NaN} />);
      expect(screen.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
    });

    it('starts an uncontrolled step again at defaultValue each time it opens', () => {
      render(<Controlled defaultValue={1} />);
      fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }));
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
      fireEvent.click(next());
      expect(screen.getByRole('dialog', { name: 'Export' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }));
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    });

    it('follows steps added while it’s open', () => {
      const { rerender } = render(
        <Tour defaultOpen>
          <Tour.Step title="One">1</Tour.Step>
        </Tour>
      );
      expect(screen.getByText('Step 1 of 1')).toBeVisible();
      rerender(
        <Tour defaultOpen>
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      expect(screen.getByText('Step 1 of 2')).toBeVisible();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('records a finished tour apart from a skipped one, as the Controlled story does', () => {
      // The docs page's controlled example is the same code.
      const Story = ControlledStory.render as unknown as React.FC;
      render(<Story />);
      const start = () =>
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
      start();
      fireEvent.click(next());
      fireEvent.click(next());
      expect(screen.getByText(/tour finished/)).toBeInTheDocument();
      start();
      expect(screen.getByText(/tour in progress/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(screen.getByText(/tour skipped/)).toBeInTheDocument();
    });
  });

  describe('modality', () => {
    it('with the overlay, makes the rest of the page inert and still, and dims it', () => {
      const { container } = render(<Page defaultOpen />);
      expect(container).toHaveAttribute('inert');
      expect(document.documentElement.style.overflow).toBe('hidden');
      const overlay = document.querySelector('svg.tour-overlay');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      // Centered, so there's no hole.
      expect(document.querySelector('.tour-spotlight')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(container).not.toHaveAttribute('inert');
      expect(document.documentElement.style.overflow).toBe('');
    });

    it('cuts the spotlight at the target, grown by the padding', () => {
      render(<Page defaultOpen defaultValue={1} />);
      const spotlight = document.querySelector('.tour-spotlight') as SVGElement;
      expect(spotlight.style.x).toBe(
        'calc(100px - var(--bulma-tour-spotlight-padding))'
      );
      expect(spotlight.style.height).toBe(
        'calc(30px + 2 * var(--bulma-tour-spotlight-padding))'
      );
      expect(document.querySelector('.tour-spotlight-ring')).toHaveAttribute(
        'style',
        spotlight.getAttribute('style')
      );
      const mask = spotlight.closest('mask') as SVGMaskElement;
      expect(
        document.querySelector(`rect[mask="url(#${mask.id})"]`)
      ).not.toBeNull();
    });

    it('without the overlay, leaves the page alone and claims no modality', () => {
      const { container } = render(<Page defaultOpen overlay={false} />);
      expect(dialog()).not.toHaveAttribute('aria-modal');
      expect(container).not.toHaveAttribute('inert');
      expect(document.documentElement.style.overflow).toBe('');
      expect(document.querySelector('.tour-overlay')).toBeNull();
    });

    it('takes a step’s own overlay over the tour’s', () => {
      const { container } = render(
        <Tour defaultOpen>
          <Tour.Step title="Open" overlay={false}>
            Try it.
          </Tour.Step>
          <Tour.Step title="Modal">Look.</Tour.Step>
        </Tour>
      );
      expect(dialog()).not.toHaveAttribute('aria-modal');
      expect(container).not.toHaveAttribute('inert');
      fireEvent.click(next());
      expect(dialog()).toHaveAttribute('aria-modal', 'true');
      expect(document.documentElement.style.overflow).toBe('hidden');
    });

    it('swallows a click on the overlay, and ends on one with closeOnClickOutside', () => {
      const onOpenChange = vi.fn();
      const { unmount } = render(
        <Page defaultOpen onOpenChange={onOpenChange} />
      );
      const overlay = document.querySelector('.tour-overlay') as Element;
      fireEvent.pointerDown(overlay);
      expect(onOpenChange).not.toHaveBeenCalled();
      unmount();
      render(
        <Page defaultOpen closeOnClickOutside onOpenChange={onOpenChange} />
      );
      fireEvent.pointerDown(dialog());
      expect(onOpenChange).not.toHaveBeenCalled();
      fireEvent.pointerDown(document.querySelector('.tour-overlay') as Element);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('focus', () => {
    it('moves to Next on open and back to the opener on close', () => {
      render(<Controlled />);
      const opener = screen.getByRole('button', { name: 'Take the tour' });
      opener.focus();
      fireEvent.click(opener);
      expect(next()).toHaveFocus();
      press('Escape');
      expect(opener).toHaveFocus();
    });

    it('stays on the control used, and goes to Next when it’s gone', () => {
      render(<Page defaultOpen defaultValue={1} />);
      const back = screen.getByRole('button', { name: 'Back' });
      back.focus();
      fireEvent.click(back);
      expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
      expect(next()).toHaveFocus();
      fireEvent.click(next());
      expect(next()).toHaveFocus();
    });

    it('leaves focus a step change finds outside the step', () => {
      render(<Page defaultOpen overlay={false} />);
      const opener = screen.getByRole('button', { name: 'Open' });
      opener.focus();
      fireEvent.click(next());
      expect(opener).toHaveFocus();
    });

    it('holds Tab in a modal step', () => {
      render(<Page defaultOpen />);
      const close = screen.getByRole('button', { name: 'Close' });
      expect(press('Tab')).toBe(false);
      expect(close).toHaveFocus();
      expect(press('Tab', { shiftKey: true })).toBe(false);
      expect(next()).toHaveFocus();
    });

    it('without the overlay, sends Tab from Next to the target, and leaves the rest of Tab to the browser', () => {
      render(<Page defaultOpen overlay={false} defaultValue={1} />);
      expect(press('Tab')).toBe(false);
      const filters = screen.getByRole('button', { name: 'Filters' });
      expect(filters).toHaveFocus();
      // From the target, and from anywhere but Next, Tab is the browser's.
      expect(press('Tab')).toBe(true);
      expect(press('Tab', { shiftKey: true })).toBe(true);
      next().focus();
      expect(press('Tab', { shiftKey: true })).toBe(true);
      screen.getByRole('button', { name: 'Skip' }).focus();
      expect(press('Tab')).toBe(true);
    });

    it('sends Tab from Next to the first control inside a target, and leaves it be when nothing there takes focus', () => {
      render(
        <>
          <div id="panel" data-rect="100 100 300 100">
            <span>Filters</span>
            <button type="button">First</button>
            <button type="button">Second</button>
          </div>
          <p id="plain" data-rect="300 100 300 40">
            Plain text
          </p>
          <Tour defaultOpen overlay={false}>
            <Tour.Step target="#panel" title="Panel">
              A panel of controls.
            </Tour.Step>
            <Tour.Step target="#plain" title="Plain">
              Text alone.
            </Tour.Step>
            <Tour.Step title="Nowhere">No target.</Tour.Step>
          </Tour>
        </>
      );
      expect(press('Tab')).toBe(false);
      expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      next().focus();
      fireEvent.click(next());
      expect(press('Tab')).toBe(true);
      expect(next()).toHaveFocus();
      fireEvent.click(next());
      expect(press('Tab')).toBe(true);
      expect(next()).toHaveFocus();
    });

    it('sends Tab from Next to the first control inside a target in a shadow root', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });
      const panel = document.createElement('div');
      panel.dataset.rect = '100 100 300 100';
      const first = document.createElement('button');
      first.textContent = 'First';
      panel.appendChild(first);
      shadow.appendChild(panel);
      render(
        <Tour defaultOpen overlay={false}>
          <Tour.Step target={panel} title="Panel">
            A panel of controls in a web component.
          </Tour.Step>
        </Tour>
      );
      expect(press('Tab')).toBe(false);
      expect(shadow.activeElement).toBe(first);
      host.remove();
    });

    it('portals a popup in a modal step into the step, and leaves one in a non-modal step in <body>', () => {
      const WithPopover = ({ overlay }: { overlay: boolean }) => (
        <Tour open overlay={overlay}>
          <Tour.Step title="Filters">
            <Popover
              trigger={<button type="button">Open filters</button>}
              defaultOpen
              appendToBody
              ariaLabel="Filter panel"
            >
              <button type="button">Only mine</button>
            </Popover>
          </Tour.Step>
        </Tour>
      );
      const { rerender } = render(<WithPopover overlay />);
      const inStep = () =>
        screen
          .getByRole('dialog', { name: 'Filters' })
          .contains(screen.getByRole('button', { name: 'Only mine' }));
      expect(inStep()).toBe(true);
      rerender(<WithPopover overlay={false} />);
      expect(inStep()).toBe(false);
    });

    it('keeps focus in a popup the step portaled when the step turns modal, as the popup moves into it', () => {
      const Turning = ({ overlay }: { overlay: boolean }) => (
        <Tour open overlay={overlay}>
          <Tour.Step title="Filters">
            <Popover
              trigger={<button type="button">Open filters</button>}
              defaultOpen
              appendToBody
              ariaLabel="Filter panel"
            >
              <button type="button">Only mine</button>
            </Popover>
          </Tour.Step>
        </Tour>
      );
      const { rerender } = render(<Turning overlay={false} />);
      const inPopover = screen.getByRole('button', { name: 'Only mine' });
      inPopover.focus();
      expect(
        screen.getByRole('dialog', { name: 'Filters' }).contains(inPopover)
      ).toBe(false);
      rerender(<Turning overlay />);
      // The Popover's panel moves from <body> into the modal step, where
      // the page going inert doesn't reach it, and focuses its control again.
      expect(inPopover).not.toBeInTheDocument();
      const moved = screen.getByRole('button', { name: 'Only mine' });
      expect(screen.getByRole('dialog', { name: 'Filters' })).toContainElement(
        moved
      );
      expect(moved).toHaveFocus();
    });

    it('moves focus into a step that turns modal while focus is on the page', () => {
      const Mixed = ({ value }: { value: number }) => (
        <>
          <button type="button" id="target" data-rect="100 100 80 30">
            Try me
          </button>
          <Tour open value={value}>
            <Tour.Step target="#target" title="Try it" overlay={false}>
              Use the button.
            </Tour.Step>
            <Tour.Step title="Look">The page waits.</Tour.Step>
          </Tour>
        </>
      );
      const { rerender } = render(<Mixed value={0} />);
      const target = screen.getByRole('button', { name: 'Try me' });
      target.focus();
      rerender(<Mixed value={1} />);
      expect(dialog()).toHaveAttribute('aria-modal', 'true');
      expect(next()).toHaveFocus();
    });

    it('leaves Tab and Escape to a Modal opened from a step', () => {
      function WithModal({ overlay }: { overlay: boolean }) {
        const [modal, setModal] = useState(false);
        return (
          <Tour defaultOpen overlay={overlay}>
            <Tour.Step title="With a modal">
              <button type="button" onClick={() => setModal(true)}>
                More
              </button>
              <Modal active={modal} onClose={() => setModal(false)}>
                <Modal.Background />
                <Modal.Content>
                  <button type="button">In the modal</button>
                </Modal.Content>
              </Modal>
            </Tour.Step>
          </Tour>
        );
      }
      for (const overlay of [true, false]) {
        const { unmount } = render(<WithModal overlay={overlay} />);
        fireEvent.click(screen.getByRole('button', { name: 'More' }));
        const inModal = screen.getByRole('button', { name: 'In the modal' });
        inModal.focus();
        // The Modal holds Tab itself, so the step's trap stands aside.
        press('Tab');
        expect(inModal).toHaveFocus();
        press('Escape');
        expect(document.querySelector('.modal.is-active')).toBeNull();
        expect(dialog()).toBeVisible();
        unmount();
      }
    });
  });

  describe('keys', () => {
    it('steps with ArrowRight and ArrowLeft from inside, and does nothing past either end', () => {
      const onChange = vi.fn();
      render(<Page defaultOpen onChange={onChange} />);
      press('ArrowLeft');
      expect(onChange).not.toHaveBeenCalled();
      expect(press('ArrowRight')).toBe(false);
      expect(onChange).toHaveBeenLastCalledWith(1);
      press('ArrowRight');
      expect(onChange).toHaveBeenLastCalledWith(2);
      expect(press('ArrowRight')).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(2);
      press('ArrowLeft');
      expect(onChange).toHaveBeenLastCalledWith(1);
    });

    it('mirrors the arrows under right-to-left text', () => {
      const onChange = vi.fn();
      render(<Page defaultOpen dir="rtl" onChange={onChange} />);
      press('ArrowRight');
      expect(onChange).not.toHaveBeenCalled();
      press('ArrowLeft');
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
      'leaves an arrow with %s alone',
      modifier => {
        const onChange = vi.fn();
        render(<Page defaultOpen onChange={onChange} />);
        press('ArrowRight', { [modifier]: true });
        expect(onChange).not.toHaveBeenCalled();
      }
    );

    it('leaves the arrows to a clip with controls, as a cover may hold', () => {
      render(
        <Tour defaultOpen defaultValue={1}>
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step
            title="Two"
            cover={<video controls tabIndex={0} aria-label="Clip" />}
          >
            2
          </Tour.Step>
        </Tour>
      );
      screen.getByLabelText('Clip').focus();
      expect(press('ArrowLeft')).toBe(true);
      expect(press('ArrowRight')).toBe(true);
      expect(screen.getByRole('dialog', { name: 'Two' })).toBeVisible();
    });

    it('leaves the arrows to a text field, a control that uses them, and a nested dialog', () => {
      const onChange = vi.fn();
      render(
        <Tour defaultOpen onChange={onChange}>
          <Tour.Step title="Controls">
            <input aria-label="Name" />
            <button type="button" role="tab">
              Tab
            </button>
            <div role="dialog" aria-label="Nested">
              <button type="button">In the nested dialog</button>
            </div>
            <button type="button">Plain</button>
          </Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      for (const from of [
        screen.getByRole('textbox', { name: 'Name' }),
        screen.getByRole('tab', { name: 'Tab' }),
        screen.getByRole('button', { name: 'In the nested dialog' }),
      ]) {
        fireEvent.keyDown(from, { key: 'ArrowRight' });
      }
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.keyDown(screen.getByRole('button', { name: 'Plain' }), {
        key: 'ArrowRight',
      });
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('runs the step’s own key handler first, and takes a key it used as used', () => {
      const onChange = vi.fn();
      render(
        <Tour defaultOpen onChange={onChange}>
          <Tour.Step
            title="Own keys"
            onKeyDown={e => {
              if (e.key === 'ArrowRight') e.preventDefault();
            }}
          >
            Body.
          </Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      press('ArrowRight');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('announcements', () => {
    it('says nothing on open, then the progress and the title after each change', () => {
      render(<Page defaultOpen />);
      const status = screen.getByRole('status');
      expect(status).toBeEmptyDOMElement();
      expect(dialog()).toContainElement(status);
      fireEvent.click(next());
      expect(status).toHaveTextContent('Step 2 of 3: Filters');
    });

    it('says the aria-label of a step without a title, and the progress alone with neither', () => {
      render(
        <Tour defaultOpen>
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step aria-label="Labelled">2</Tour.Step>
          <Tour.Step>3</Tour.Step>
        </Tour>
      );
      fireEvent.click(next());
      expect(screen.getByRole('status')).toHaveTextContent(
        'Step 2 of 3: Labelled'
      );
      fireEvent.click(next());
      expect(screen.getByRole('status')).toHaveTextContent(/^Step 3 of 3$/);
    });

    it('says a different step that takes the index after the steps change, and keeps focus', () => {
      const Tips = ({ tips }: { tips: string[] }) => (
        <Tour open value={1}>
          {tips.map(tip => (
            <Tour.Step key={tip} title={tip}>
              About {tip}.
            </Tour.Step>
          ))}
        </Tour>
      );
      const { rerender } = render(<Tips tips={['One', 'Two', 'Three']} />);
      const back = screen.getByRole('button', { name: 'Back' });
      back.focus();
      // "One" is read and dropped, so "Three" now sits at index 1, and Back,
      // which had focus, is gone with the first step.
      rerender(<Tips tips={['Two', 'Three']} />);
      rerender(<Tips tips={['Three', 'Four']} />);
      expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 2: Four');
      rerender(<Tips tips={['Four']} />);
      expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 1: Four');
      expect(back).not.toBeInTheDocument();
      expect(next()).toHaveFocus();
    });
  });

  describe('targets and placement', () => {
    it('places the panel on the side asked for, bottom by default', () => {
      render(<Page defaultOpen defaultValue={1} />);
      // Centered under the 80px target, past the gap the stylesheet adds.
      expect(dialog()).toHaveClass('is-bottom');
      expect(dialog().style.top).toBe('130px');
      expect(dialog().style.left).toBe('40px');
      fireEvent.click(next());
      // `left` is the start of the line, and there's room there.
      expect(dialog()).toHaveClass('is-left');
      expect(dialog().style.left).toBe('600px');
    });

    it('swaps left and right under the target’s right-to-left text', () => {
      const Start = ({ rtl }: { rtl: boolean }) => (
        <>
          <div dir={rtl ? 'rtl' : 'ltr'}>
            <button type="button" id="t" data-rect="100 400 80 30">
              T
            </button>
          </div>
          <Tour defaultOpen>
            <Tour.Step target="#t" title="Start" position="left">
              The start of the line.
            </Tour.Step>
          </Tour>
        </>
      );
      const { unmount } = render(<Start rtl={false} />);
      expect(dialog()).toHaveClass('is-left');
      unmount();
      render(<Start rtl />);
      expect(dialog()).toHaveClass('is-right');
      expect(dialog().style.left).toBe('480px');
    });

    it('keeps a bottom step below with margins on its sides, as mx sets', () => {
      // 690 + 100 fits under 800 with no gap, and wouldn't with a 24px one.
      render(
        <>
          <button type="button" id="low" data-rect="660 100 80 30">
            Low
          </button>
          <Tour defaultOpen>
            <Tour.Step
              target="#low"
              title="Low"
              style={{ marginLeft: '24px', marginRight: '24px' }}
            >
              Near the bottom.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(dialog()).toHaveClass('is-bottom');
    });

    it('places the panel at the bottom for a position it doesn’t know', () => {
      render(
        <>
          <button type="button" id="t" data-rect="100 100 80 30">
            T
          </button>
          <Tour defaultOpen>
            <Tour.Step
              target="#t"
              title="Odd"
              position={'auto' as unknown as 'top'}
            >
              Body.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(dialog()).toHaveClass('is-bottom');
    });

    it('points at an element, or a ref to one', () => {
      function Targets() {
        const ref = useRef<HTMLButtonElement>(null);
        const [element, setElement] = useState<HTMLElement | null>(null);
        return (
          <>
            <button
              type="button"
              ref={ref}
              data-rect="300 300 50 50"
              aria-label="By ref"
            />
            <button
              type="button"
              ref={setElement}
              data-rect="500 300 50 50"
              aria-label="By element"
            />
            {element && (
              <Tour defaultOpen>
                <Tour.Step target={ref} title="Ref" position="top">
                  1
                </Tour.Step>
                <Tour.Step target={element} title="Element" position="right">
                  2
                </Tour.Step>
              </Tour>
            )}
          </>
        );
      }
      render(<Targets />);
      expect(dialog()).toHaveClass('is-top');
      fireEvent.click(next());
      expect(dialog()).toHaveClass('is-right');
    });

    it('centers a step whose target is missing, boxless, detached or an invalid selector, and warns once each', () => {
      const detached = document.createElement('button');
      render(
        <>
          <div hidden>
            <span id="boxless">No box</span>
          </div>
          <Tour defaultOpen>
            <Tour.Step target="#missing" title="Missing">
              1
            </Tour.Step>
            <Tour.Step target="#boxless" title="Boxless">
              2
            </Tour.Step>
            <Tour.Step target={detached} title="Detached">
              3
            </Tour.Step>
            <Tour.Step target="[[" title="Invalid">
              4
            </Tour.Step>
          </Tour>
        </>
      );
      for (let i = 0; i < 4; i++) {
        expect(dialog()).toHaveClass('is-centered');
        expect(dialog().style.top).toBe('350px');
        expect(dialog().style.left).toBe('400px');
        if (i < 3) fireEvent.click(next());
      }
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Target: "#missing"')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Target: "[["')
      );
      expect(console.warn).toHaveBeenCalledTimes(4);
    });

    it('moves to a target that turns up, and back to the middle when it goes', async () => {
      withResizeObserver();
      render(
        <Tour defaultOpen>
          <Tour.Step target="#late" title="Late">
            Shows when it mounts.
          </Tour.Step>
        </Tour>
      );
      expect(dialog()).toHaveClass('is-centered');
      const late = document.createElement('button');
      late.id = 'late';
      late.dataset.rect = '100 100 80 30';
      // Async, so the observer's callback runs inside it.
      await act(async () => {
        document.body.appendChild(late);
      });
      expect(dialog()).toHaveClass('is-bottom');
      expect(document.querySelector('.tour-spotlight')).not.toBeNull();
      await act(async () => {
        late.remove();
      });
      expect(dialog()).toHaveClass('is-centered');
      expect(document.querySelector('.tour-spotlight')).toBeNull();
    });

    it('takes an inline ref object or a created ref as a target, render after render', () => {
      function Inline() {
        const [element, setElement] = useState<HTMLButtonElement | null>(null);
        const [, setRenders] = useState(0);
        return (
          <>
            <button
              type="button"
              ref={setElement}
              data-rect="100 100 80 30"
              onClick={() => setRenders(n => n + 1)}
            >
              Render again
            </button>
            <Tour defaultOpen overlay={false}>
              <Tour.Step target={{ current: element }} title="Inline">
                Body.
              </Tour.Step>
              {/* eslint-disable-next-line @eslint-react/no-create-ref -- a new ref each render is the case under test */}
              <Tour.Step target={createRef<HTMLElement>()} title="Created">
                Body.
              </Tour.Step>
            </Tour>
          </>
        );
      }
      render(<Inline />);
      expect(dialog()).toHaveClass('is-bottom');
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: 'Render again' }));
      }
      expect(dialog()).toHaveClass('is-bottom');
      expect(dialog().style.top).toBe('130px');
      fireEvent.click(next());
      expect(dialog()).toHaveClass('is-centered');
    });

    it('never places the step against a target that left the page, finding its replacement at once', () => {
      const Remount = ({ id, top }: { id: string; top: number }) => (
        <>
          <button
            key={id}
            type="button"
            id="swapped"
            data-rect={`${top} 100 80 30`}
          >
            Swapped
          </button>
          <Tour open>
            <Tour.Step target="#swapped" title="Swapped">
              Remounted.
            </Tour.Step>
          </Tour>
        </>
      );
      const { rerender } = render(<Remount id="a" top={100} />);
      expect(dialog().style.top).toBe('130px');
      // Measured in the commit that swaps it, before a frame finds it again.
      rerender(<Remount id="b" top={300} />);
      expect(dialog().style.top).toBe('330px');
    });

    it('keeps its place while a target that left the page has no replacement', () => {
      const Going = ({ shown, label }: { shown: boolean; label: string }) => (
        <>
          {shown && (
            <button type="button" id="going" data-rect="100 100 80 30">
              Going
            </button>
          )}
          <Tour open>
            <Tour.Step target="#going" title="Going" aria-label={label}>
              Goes.
            </Tour.Step>
          </Tour>
        </>
      );
      const { rerender } = render(<Going shown label="Going" />);
      expect(dialog().style.top).toBe('130px');
      rerender(<Going shown={false} label="Gone" />);
      expect(dialog().style.top).toBe('130px');
    });

    it('finds a target any attribute change makes a selector match', async () => {
      render(
        <>
          <button type="button" id="data" data-rect="100 100 80 30">
            Data
          </button>
          <Tour defaultOpen>
            <Tour.Step target="[data-ready]" title="Ready">
              Matches once it's ready.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(dialog()).toHaveClass('is-centered');
      await act(async () => {
        document.getElementById('data')!.setAttribute('data-ready', '');
      });
      expect(dialog()).toHaveClass('is-bottom');
    });

    it('looks a selector up in the shadow root the tour renders into, and watches it', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });
      const container = document.createElement('div');
      shadow.appendChild(container);
      render(
        <>
          <button type="button" id="inside" data-rect="100 100 80 30">
            Inside
          </button>
          <Tour defaultOpen portal={false}>
            <Tour.Step target="#inside" title="Inside">
              In the same shadow root.
            </Tour.Step>
            <Tour.Step target="#later" title="Later">
              Mounts there later.
            </Tour.Step>
          </Tour>
        </>,
        { container }
      );
      const step = () => shadow.querySelector('[role="dialog"]') as HTMLElement;
      expect(step()).toHaveClass('is-bottom');
      fireEvent.click(
        shadow.querySelector('.tour-step-footer .is-primary') as HTMLElement
      );
      expect(step()).toHaveClass('is-centered');
      const later = document.createElement('button');
      later.id = 'later';
      later.dataset.rect = '100 100 80 30';
      // Async, so the observer's callback runs inside it.
      await act(async () => {
        container.appendChild(later);
      });
      expect(step()).toHaveClass('is-bottom');
      host.remove();
    });

    it('finds a selector in the page around the shadow root a tour renders into, as it mounts', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });
      const container = document.createElement('div');
      shadow.appendChild(container);
      render(
        <Tour defaultOpen portal={false}>
          <Tour.Step target="#outside" title="Outside">
            In the page around the tour.
          </Tour.Step>
        </Tour>,
        { container }
      );
      const step = () => shadow.querySelector('[role="dialog"]') as HTMLElement;
      expect(step()).toHaveClass('is-centered');
      const outside = document.createElement('button');
      outside.id = 'outside';
      outside.dataset.rect = '100 100 80 30';
      await act(async () => {
        document.body.appendChild(outside);
      });
      expect(step()).toHaveClass('is-bottom');
      outside.remove();
      host.remove();
    });

    it('finds a target a class change makes a selector match', async () => {
      render(
        <>
          <button type="button" id="later" data-rect="100 100 80 30">
            Later
          </button>
          <Tour defaultOpen>
            <Tour.Step target=".is-ready" title="Ready">
              Matches once it's ready.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(dialog()).toHaveClass('is-centered');
      await act(async () => {
        document.getElementById('later')!.classList.add('is-ready');
      });
      expect(dialog()).toHaveClass('is-bottom');
    });

    it('watches a boxless target, the step and the page for size, and measures again', () => {
      const sizes = withResizeObserver();
      render(
        <>
          <div hidden id="box">
            <button type="button" id="inside" data-rect="100 100 80 30">
              Inside
            </button>
          </div>
          <Tour defaultOpen>
            <Tour.Step target="#inside" title="Inside">
              In a box that opens.
            </Tour.Step>
            <Tour.Step title="Grows">Its content grows.</Tour.Step>
          </Tour>
        </>
      );
      const inside = document.getElementById('inside') as HTMLElement;
      expect(sizes.watches(inside)).toBe(true);
      expect(sizes.watches(dialog())).toBe(true);
      expect(sizes.watches(document.body)).toBe(true);
      expect(dialog()).toHaveClass('is-centered');
      // Showing it changes no id or class: only its size says so.
      document.getElementById('box')!.removeAttribute('hidden');
      sizes.fire();
      expect(dialog()).toHaveClass('is-bottom');
      fireEvent.click(next());
      expect(sizes.watches(inside)).toBe(false);
      expect(dialog().style.top).toBe('350px');
      dialog().dataset.rect = '0 0 200 300';
      sizes.fire();
      expect(dialog().style.top).toBe('250px');
    });

    it('measures once a frame, however many changes ask in it', () => {
      const frames: FrameRequestCallback[] = [];
      vi.mocked(window.requestAnimationFrame).mockImplementation(callback => {
        frames.push(callback);
        return frames.length;
      });
      render(<Page defaultOpen defaultValue={1} />);
      // One frame for the spotlight and one for the step's placement.
      act(() => {
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      expect(frames).toHaveLength(2);
      const filters = document.getElementById('filters') as HTMLElement;
      filters.dataset.rect = '200 100 80 30';
      act(() => frames.forEach(frame => frame(0)));
      expect(
        (document.querySelector('.tour-spotlight') as SVGElement).style.y
      ).toBe('calc(200px - var(--bulma-tour-spotlight-padding))');
      expect(dialog().style.top).toBe('230px');
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(frames).toHaveLength(4);
    });

    it('follows its target on scroll, and on resize', () => {
      render(<Page defaultOpen defaultValue={1} />);
      // A scroll that moves nothing leaves it where it is.
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(dialog().style.top).toBe('130px');
      const filters = document.getElementById('filters') as HTMLElement;
      filters.dataset.rect = '200 100 80 30';
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(dialog().style.top).toBe('230px');
      filters.dataset.rect = '250 100 80 30';
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(dialog().style.top).toBe('280px');
    });
  });

  describe('scrolling', () => {
    const scrollTo = () => {
      const scrollIntoView = vi.fn();
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value: scrollIntoView,
      });
      return scrollIntoView;
    };

    it('leaves a target that’s all in view where it is', () => {
      const scrollIntoView = scrollTo();
      render(<Page defaultOpen defaultValue={1} />);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it('scrolls a target out of view to the middle, smoothly', () => {
      const scrollIntoView = scrollTo();
      render(
        <>
          <button type="button" id="far" data-rect="2000 100 80 30">
            Far
          </button>
          <Tour defaultOpen>
            <Tour.Step target="#far" title="Far">
              Below.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'center',
        inline: 'nearest',
        behavior: 'smooth',
      });
    });

    it('scrolls instantly when the user asks for less motion', () => {
      const scrollIntoView = scrollTo();
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: true }),
      });
      render(
        <>
          <button type="button" id="far" data-rect="-50 100 80 30">
            Far
          </button>
          <Tour defaultOpen>
            <Tour.Step target="#far" title="Far">
              Above.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(window.matchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: reduce)'
      );
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'instant' })
      );
    });

    it('scrolls a target its scrolling ancestor cuts off, and not one it shows', () => {
      const scrollIntoView = scrollTo();
      const Clipped = ({ inner }: { inner: string }) => (
        <>
          <div data-rect="0 0 300 300" style={{ overflowY: 'auto' }}>
            <div>
              <button type="button" id="inner" data-rect={inner}>
                Inner
              </button>
            </div>
          </div>
          <Tour defaultOpen>
            <Tour.Step target="#inner" title="Inner">
              In a box.
            </Tour.Step>
          </Tour>
        </>
      );
      const { unmount } = render(<Clipped inner="100 100 50 20" />);
      expect(scrollIntoView).not.toHaveBeenCalled();
      unmount();
      render(<Clipped inner="400 100 50 20" />);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('scrolls a target in a shadow root that a scrolling ancestor around its host cuts off', () => {
      const scrollIntoView = scrollTo();
      const scroller = document.createElement('div');
      scroller.dataset.rect = '0 0 300 300';
      scroller.style.overflowY = 'auto';
      const host = document.createElement('div');
      scroller.appendChild(host);
      document.body.appendChild(scroller);
      const container = document.createElement('div');
      host.attachShadow({ mode: 'open' }).appendChild(container);
      render(
        <>
          <button type="button" id="inner" data-rect="400 100 50 20">
            Inner
          </button>
          <Tour defaultOpen portal={false}>
            <Tour.Step target="#inner" title="Inner">
              Below the box's edge.
            </Tour.Step>
          </Tour>
        </>,
        { container }
      );
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      scroller.remove();
    });

    it('doesn’t scroll to the step before’s target when the next one is missing', () => {
      const scrollIntoView = scrollTo();
      render(
        <>
          <button type="button" id="far" data-rect="2000 100 80 30">
            Far
          </button>
          <Tour defaultOpen>
            <Tour.Step target="#far" title="Far">
              Below.
            </Tour.Step>
            <Tour.Step target="#missing" title="Missing">
              Nowhere.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      fireEvent.click(next());
      expect(dialog()).toHaveClass('is-centered');
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('does without scrollIntoView where there’s none', () => {
      render(
        <>
          <button type="button" id="far" data-rect="2000 100 80 30">
            Far
          </button>
          <Tour defaultOpen>
            <Tour.Step target="#far" title="Far">
              Below.
            </Tour.Step>
          </Tour>
        </>
      );
      expect(dialog()).toBeVisible();
    });
  });

  describe('custom layouts', () => {
    it('puts a cover above the header, keyed to its step, and none without one', () => {
      render(
        <Tour defaultOpen>
          <Tour.Step title="New editor" cover={<img src="editor.png" alt="" />}>
            Saves as you type.
          </Tour.Step>
          <Tour.Step title="No cover" cover={[false, null]}>
            Plain.
          </Tour.Step>
        </Tour>
      );
      const cover = dialog().firstElementChild as HTMLElement;
      expect(cover).toHaveClass('tour-step-cover');
      expect(cover.querySelector('img')).toHaveAttribute('src', 'editor.png');
      expect(cover.nextElementSibling).toHaveClass('tour-step-header');
      fireEvent.click(next());
      expect(dialog().querySelector('.tour-step-cover')).toBeNull();
    });

    it('takes the tour’s footer for every step, a step’s own over it, and none for null', () => {
      render(
        <Tour
          defaultOpen
          footer={
            <>
              <Tour.Progress />
              <Buttons>
                <Tour.Next />
              </Buttons>
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step
            title="Two"
            footer={
              <>
                <Tour.Skip>Not now</Tour.Skip>
                <Tour.Next>Onward</Tour.Next>
              </>
            }
          >
            2
          </Tour.Step>
          <Tour.Step title="Three" footer={null}>
            3
          </Tour.Step>
        </Tour>
      );
      const footer = () => dialog().querySelector('.tour-step-footer');
      expect(footer()).toHaveTextContent('Step 1 of 3Next');
      expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
      fireEvent.click(next());
      expect(footer()).toHaveTextContent(/^Not nowOnward$/);
      fireEvent.click(screen.getByRole('button', { name: 'Onward' }));
      expect(screen.getByRole('dialog', { name: 'Three' })).toBeVisible();
      expect(footer()).toBeNull();
    });

    it('acts through each part, labelled from labels unless it has children', () => {
      const onChange = vi.fn();
      const onFinish = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          onChange={onChange}
          onFinish={onFinish}
          onOpenChange={onOpenChange}
          labels={{ back: 'Previous', skip: 'Later' }}
          footer={
            <>
              <Tour.Skip />
              <Tour.Back />
              <Tour.Next>Onward</Tour.Next>
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Onward' }));
      expect(onChange).toHaveBeenLastCalledWith(1);
      fireEvent.click(screen.getByRole('button', { name: 'Onward' }));
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('lets a part’s own onClick keep it from acting', () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      const stop = (e: React.MouseEvent) => e.preventDefault();
      const ran = vi.fn();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          onChange={onChange}
          onOpenChange={onOpenChange}
          footer={
            <>
              <Tour.Skip onClick={stop} />
              <Tour.Back onClick={stop}>Back</Tour.Back>
              <Tour.Next onClick={stop} />
              <Tour.Next onClick={ran} type="submit">
                Also next
              </Tour.Next>
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      for (const name of ['Skip', 'Back', 'Next']) {
        fireEvent.click(screen.getByRole('button', { name }));
      }
      expect(onChange).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      const also = screen.getByRole('button', { name: 'Also next' });
      expect(also).toHaveAttribute('type', 'submit');
      fireEvent.click(also);
      expect(ran).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('takes helper props, a class and its own text on Tour.Progress', () => {
      render(
        <Tour
          defaultOpen
          footer={
            <Tour.Progress className="mine" textWeight="bold" mr="2">
              Almost there
            </Tour.Progress>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
        </Tour>
      );
      expect(screen.getByText('Almost there')).toHaveClass(
        'tour-progress',
        'mine',
        'has-text-weight-bold',
        'mr-2'
      );
    });

    it('acts on the step a part shows on, from the part’s own layout effect', () => {
      const onChange = vi.fn();
      // Moves on as soon as it shows, as a step that only waits for
      // something already done would.
      const AutoNext = () => {
        const { next } = useTour() as NonNullable<ReturnType<typeof useTour>>;
        useClientLayoutEffect(() => next(), [next]);
        return null;
      };
      render(
        <Tour defaultOpen onChange={onChange}>
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">
            <AutoNext />
          </Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      fireEvent.click(next());
      expect(onChange.mock.calls).toEqual([[1], [2]]);
      expect(screen.getByRole('dialog', { name: 'Three' })).toBeVisible();
    });

    it('does nothing from an action a part handed on, once the tour has ended', () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const onChange = vi.fn();
      const onFinish = vi.fn();
      const onOpenChange = vi.fn();
      let kept: TourActions | undefined;
      const props = {
        onKeep: (actions: TourActions) => {
          kept = actions;
        },
        onChange,
        onFinish,
        onOpenChange,
      };
      // A timer the app set with the actions, which fires after the end.
      const later = () =>
        setTimeout(() => {
          const actions = kept as TourActions;
          actions.next();
          actions.back();
          actions.skip();
        }, 1000);

      const { unmount } = render(<KeptTour {...props} />);
      later();
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(onFinish).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
      unmount();

      // Nor once the tour has gone from the page.
      const { unmount: unmountAgain } = render(<KeptTour {...props} />);
      later();
      unmountAgain();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('keeps useTour’s object while the step stays, so an effect can depend on it', () => {
      const runs = vi.fn();
      const Watcher = () => {
        const tour = useTour();
        useEffect(() => runs(tour?.value), [tour]);
        return null;
      };
      const tree = (className?: string) => (
        <Tour
          defaultOpen
          className={className}
          footer={
            <>
              <Watcher />
              <Tour.Next />
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      const { rerender } = render(tree());
      rerender(tree('again'));
      expect(runs.mock.calls).toEqual([[0]]);
      fireEvent.click(next());
      expect(runs.mock.calls).toEqual([[0], [1]]);
    });

    it('keeps useTour’s actions from render to render, acting on the step the tour is on', () => {
      const onChange = vi.fn();
      const onFinish = vi.fn();
      const runs = vi.fn();
      const Keeper = () => {
        const tour = useTour() as NonNullable<ReturnType<typeof useTour>>;
        // The actions as the first render handed them out.
        const [first] = useState(tour);
        const { next, back, skip } = tour;
        useEffect(() => runs(), [next, back, skip]);
        return (
          <>
            <button type="button" onClick={first.next}>
              Kept next
            </button>
            <button type="button" onClick={first.back}>
              Kept back
            </button>
          </>
        );
      };
      render(
        <Tour
          defaultOpen
          onChange={onChange}
          onFinish={onFinish}
          footer={<Keeper />}
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      const kept = (name: string) =>
        screen.getByRole('button', { name: `Kept ${name}` });
      fireEvent.click(kept('next'));
      expect(onChange).toHaveBeenLastCalledWith(1);
      fireEvent.click(kept('next'));
      expect(onChange).toHaveBeenLastCalledWith(2);
      fireEvent.click(kept('back'));
      expect(onChange).toHaveBeenLastCalledWith(1);
      fireEvent.click(kept('next'));
      expect(runs).toHaveBeenCalledTimes(1);
      fireEvent.click(kept('next'));
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders nothing for a part outside a tour, where useTour is null', () => {
      const Probe = () => <output>{String(useTour())}</output>;
      const { container } = render(
        <>
          <TourSkip />
          <TourBack />
          <TourNext />
          <TourProgress />
          <Probe />
        </>
      );
      expect(container.querySelectorAll('button, span')).toHaveLength(0);
      expect(screen.getByRole('status')).toHaveTextContent('null');
    });

    it('hands a custom part the step, the total and the actions through useTour', () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      const Custom = () => {
        const tour = useTour() as NonNullable<ReturnType<typeof useTour>>;
        return (
          <>
            <span>{`${tour.value + 1}/${tour.total}`}</span>
            <button type="button" onClick={tour.back}>
              Custom back
            </button>
            <button type="button" onClick={tour.next}>
              Custom next
            </button>
            <button type="button" onClick={tour.skip}>
              Custom skip
            </button>
          </>
        );
      };
      render(
        <Tour
          defaultOpen
          onChange={onChange}
          onOpenChange={onOpenChange}
          footer={<Custom />}
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      expect(screen.getByText('1/2')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Custom back' }));
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Custom next' }));
      expect(screen.getByText('2/2')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Custom back' }));
      expect(onChange).toHaveBeenLastCalledWith(0);
      fireEvent.click(screen.getByRole('button', { name: 'Custom skip' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('starts focus on a footer’s first control without a Next, and comes back there when the control used goes', () => {
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          footer={
            <>
              <Tour.Back />
              <Tour.Skip />
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      const back = screen.getByRole('button', { name: 'Back' });
      expect(back).toHaveFocus();
      fireEvent.click(back);
      expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus();
    });

    it('passes over a disabled Next for the footer’s first control, then the body’s, then the step’s first', () => {
      const { unmount } = render(
        <Tour
          defaultOpen
          footer={
            <>
              <Tour.Skip />
              <Tour.Next disabled />
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus();
      unmount();
      const { unmount: unmountAgain } = render(
        <Tour defaultOpen footer={<Tour.Next disabled />}>
          <Tour.Step title="One">
            <a href="#more">More</a>
          </Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('link', { name: 'More' })).toHaveFocus();
      unmountAgain();
      render(
        <Tour defaultOpen footer={<Tour.Next disabled />}>
          <Tour.Step title="One">1</Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    });

    it('starts on, and presses, the Next and Back that show, past ones a responsive layout hides', () => {
      const onChange = vi.fn();
      const wide = vi.fn();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          onChange={onChange}
          footer={
            <>
              <Tour.Skip />
              <Tour.Back hidden onClick={wide}>
                Wide back
              </Tour.Back>
              <Tour.Back>Narrow back</Tour.Back>
              <Tour.Next hidden onClick={wide}>
                Wide next
              </Tour.Next>
              <Tour.Next>Narrow next</Tour.Next>
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Narrow next' })).toHaveFocus();
      press('ArrowLeft');
      expect(onChange).toHaveBeenLastCalledWith(0);
      press('ArrowRight');
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(wide).not.toHaveBeenCalled();
    });

    it('presses the Next and Back that show, past ones hidden by visibility or inert', () => {
      const onChange = vi.fn();
      const hiddenPart = vi.fn();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          onChange={onChange}
          footer={
            <>
              <Tour.Back style={{ visibility: 'hidden' }} onClick={hiddenPart}>
                Hidden back
              </Tour.Back>
              <Tour.Back>Back</Tour.Back>
              <div inert>
                <Tour.Next onClick={hiddenPart}>Inert next</Tour.Next>
              </div>
              <Tour.Next>Next</Tour.Next>
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
      press('ArrowLeft');
      expect(onChange).toHaveBeenLastCalledWith(0);
      press('ArrowRight');
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(hiddenPart).not.toHaveBeenCalled();
    });

    it('starts on the close button when the step has no Next and no control in its footer or body, past a cover', () => {
      render(
        <Tour defaultOpen footer={null}>
          <Tour.Step
            title="Clip"
            cover={<video controls tabIndex={0} aria-label="Clip" />}
          >
            Plain text.
          </Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    });

    it('finds only its own step’s parts, past those of a tour rendered inside the step', () => {
      const onChange = vi.fn();
      const onInnerChange = vi.fn();
      const inner = (
        <Tour
          defaultOpen
          portal={false}
          overlay={false}
          onChange={onInnerChange}
          footer={<Tour.Next>Inner next</Tour.Next>}
        >
          <Tour.Step title="Inner one">a</Tour.Step>
          <Tour.Step title="Inner two">b</Tour.Step>
        </Tour>
      );
      const { unmount } = render(
        <Tour
          defaultOpen
          onChange={onChange}
          footer={
            <>
              <Tour.Back>Outer back</Tour.Back>
              <Tour.Next>Outer next</Tour.Next>
            </>
          }
        >
          <Tour.Step title="One">{inner}</Tour.Step>
          <Tour.Step title="Two">{inner}</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Outer next' })).toHaveFocus();
      press('ArrowRight');
      expect(onChange).toHaveBeenLastCalledWith(1);
      press('ArrowLeft');
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(onInnerChange).not.toHaveBeenCalled();
      unmount();

      // Without a Next of its own, the step starts in its own footer.
      render(
        <Tour defaultOpen footer={<Tour.Skip>Outer skip</Tour.Skip>}>
          <Tour.Step title="One">{inner}</Tour.Step>
        </Tour>
      );
      expect(screen.getByRole('button', { name: 'Outer skip' })).toHaveFocus();
    });

    it('passes over a disabled Next when Back goes, and finds the first enabled Next of two', () => {
      const { unmount } = render(
        <Tour
          defaultOpen
          defaultValue={1}
          footer={
            <>
              <Tour.Back />
              <Tour.Skip />
              <Tour.Next disabled />
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus();
      unmount();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          footer={
            <>
              <Tour.Back />
              <Tour.Next disabled>Wait</Tour.Next>
              <Tour.Next>Go</Tour.Next>
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      const go = screen.getByRole('button', { name: 'Go' });
      expect(go).toHaveFocus();
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(go).toHaveFocus();
    });

    it.each([
      ['without a Next', () => <Tour.Skip />],
      [
        'with a disabled Next',
        () => (
          <>
            <Tour.Skip />
            <Tour.Next disabled />
          </>
        ),
      ],
    ])(
      'moves focus to the first control of a footer %s when the step turns modal',
      (_, makeFooter) => {
        const footer = makeFooter();
        const Mixed = ({ value }: { value: number }) => (
          <>
            <button type="button" id="page-button" data-rect="100 100 80 30">
              On the page
            </button>
            <Tour open value={value} footer={footer}>
              <Tour.Step title="Try it" overlay={false}>
                Use the page.
              </Tour.Step>
              <Tour.Step title="Look">The page waits.</Tour.Step>
            </Tour>
          </>
        );
        const { rerender } = render(<Mixed value={0} />);
        screen.getByRole('button', { name: 'On the page' }).focus();
        rerender(<Mixed value={1} />);
        expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus();
      }
    );

    it('presses the step’s Next and Back for the arrows, so their onClick runs', () => {
      const onChange = vi.fn();
      const onNext = vi.fn();
      const onBack = vi.fn();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          onChange={onChange}
          footer={
            <>
              <Tour.Back onClick={onBack} />
              <Tour.Next onClick={onNext} />
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      expect(press('ArrowRight')).toBe(false);
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(2);
      // Next reads Done on the last step, and an arrow never finishes.
      expect(press('ArrowRight')).toBe(true);
      expect(onNext).toHaveBeenCalledTimes(1);
      press('ArrowLeft');
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(1);
    });

    const prevent = (e: React.MouseEvent) => e.preventDefault();
    it.each([
      [
        'a disabled Next and Back',
        () => (
          <>
            <Tour.Back disabled />
            <Tour.Next disabled />
          </>
        ),
      ],
      [
        'a Next and Back whose onClick prevents',
        () => (
          <>
            <Tour.Back onClick={prevent} />
            <Tour.Next onClick={prevent} />
          </>
        ),
      ],
      [
        'an aria-disabled Next and Back',
        () => (
          <>
            <Tour.Back aria-disabled="true" />
            <Tour.Next aria-disabled="true" />
          </>
        ),
      ],
      [
        // A loading or static Bulma button holds off a pointer this way.
        'a Next and Back a pointer can’t press',
        () => (
          <>
            <Tour.Back style={{ pointerEvents: 'none' }} />
            <Tour.Next style={{ pointerEvents: 'none' }} />
          </>
        ),
      ],
      ['a footer without Next or Back', () => <Tour.Skip />],
      ['footer={null}', () => null],
    ])('ignores the arrows with %s', (_, makeFooter) => {
      const footer = makeFooter();
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Tour
          defaultOpen
          defaultValue={1}
          onChange={onChange}
          onOpenChange={onOpenChange}
          footer={footer}
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
          <Tour.Step title="Three">3</Tour.Step>
        </Tour>
      );
      press('ArrowRight');
      press('ArrowLeft');
      expect(onChange).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: 'Two' })).toBeVisible();
    });

    it('without the overlay, sends Tab to the target from the footer’s last control, wherever Next is', () => {
      render(
        <Page
          defaultOpen
          overlay={false}
          defaultValue={1}
          footer={
            <>
              <Tour.Next />
              <Tour.Skip />
            </>
          }
        />
      );
      // Next isn't last here: the browser takes Tab on to Skip.
      expect(press('Tab')).toBe(true);
      screen.getByRole('button', { name: 'Skip' }).focus();
      expect(press('Tab')).toBe(false);
      expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    });

    it('without the overlay, sends Tab to the target from focus past the step’s last stop', () => {
      render(
        <Page
          defaultOpen
          overlay={false}
          defaultValue={1}
          footer={
            <>
              <Tour.Next />
              <span tabIndex={-1}>Not a stop</span>
            </>
          }
        />
      );
      screen.getByText('Not a stop').focus();
      expect(press('Tab')).toBe(false);
      expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    });

    it('without the overlay, reads focus in a shadow root, sending Tab to the target only from the last stop', () => {
      const Shadowed = () => (
        <span
          data-testid="host"
          ref={node => {
            if (node && !node.shadowRoot) {
              node.attachShadow({ mode: 'open' }).innerHTML =
                '<button type="button">Inside</button>';
            }
          }}
        />
      );
      const inner = () =>
        screen
          .getByTestId('host')
          .shadowRoot?.querySelector('button') as HTMLButtonElement;
      const { unmount } = render(
        <Page
          defaultOpen
          overlay={false}
          defaultValue={1}
          footer={
            <>
              <Shadowed />
              <Tour.Next />
            </>
          }
        />
      );
      // React reports the host as the key's target, but focus is inside it,
      // with Next still to come.
      inner().focus();
      expect(press('Tab')).toBe(true);
      expect((inner().getRootNode() as ShadowRoot).activeElement).toBe(inner());
      unmount();
      render(
        <Page
          defaultOpen
          overlay={false}
          defaultValue={1}
          footer={
            <>
              <Tour.Next />
              <Shadowed />
            </>
          }
        />
      );
      inner().focus();
      expect(press('Tab')).toBe(false);
      expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    });
  });

  describe('beacons', () => {
    it('shows a named group of beacons in step order, each opening a dialog, and moves no focus', () => {
      render(<Tips />);
      const opener = screen.getByRole('button', { name: 'Open' });
      opener.focus();
      fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
      expect(screen.queryByRole('group')).toBeNull();
    });

    it('shows its beacons as it opens, over each target’s top end corner, with focus left where it was', () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      opener.focus();
      render(<Tips defaultOpen />);
      const group = screen.getByRole('group', { name: 'Tips' });
      expect(group).toHaveClass('tour-beacons');
      expect(beacons().map(b => b.textContent)).toEqual([
        'Show tip Filters',
        'Show tip Export',
      ]);
      const filters = beacon('Filters');
      expect(filters).toHaveClass('tour-beacon');
      expect(filters).toHaveAttribute('type', 'button');
      expect(filters).toHaveAttribute('aria-haspopup', 'dialog');
      expect(filters).toHaveAttribute('aria-expanded', 'false');
      // The corner: the target's top, and its right edge.
      expect(filters.style.top).toBe('100px');
      expect(filters.style.left).toBe('180px');
      expect(beacon('Export').style.left).toBe('880px');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(opener).toHaveFocus();
      const root = document.querySelector('.tour') as HTMLElement;
      expect(root).toHaveClass('is-beacon');
      expect(root).not.toHaveClass('is-active');
      opener.remove();
    });

    it('opens a beacon’s step, hiding every beacon, and brings them back with focus on its beacon as Done closes it', () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      const onFinish = vi.fn();
      render(
        <Tips
          defaultOpen
          onChange={onChange}
          onOpenChange={onOpenChange}
          onFinish={onFinish}
        />
      );
      fireEvent.click(beacon('Export'));
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(screen.getByRole('dialog', { name: 'Export' })).toBeVisible();
      expect(beacons()).toHaveLength(0);
      expect(screen.queryByRole('group')).toBeNull();
      expect(document.querySelector('.tour')).toHaveClass(
        'is-beacon',
        'is-active'
      );
      // A beacon's step stands alone: no Skip, Back or progress line.
      const done = screen.getByRole('button', { name: 'Done' });
      expect(done).toHaveFocus();
      for (const name of ['Skip', 'Back', 'Next']) {
        expect(screen.queryByRole('button', { name })).toBeNull();
      }
      expect(document.querySelector('.tour-progress')).toBeNull();
      fireEvent.click(done);
      expect(onChange).toHaveBeenLastCalledWith(-1);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(beacon('Export')).toHaveFocus();
      expect(beacons()).toHaveLength(2);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(onFinish).not.toHaveBeenCalled();
    });

    it('closes only the step on Escape and the close button, modal or not', () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      const { unmount } = render(
        <Tips defaultOpen onChange={onChange} onOpenChange={onOpenChange} />
      );
      fireEvent.click(beacon('Filters'));
      press('Escape');
      expect(onChange).toHaveBeenLastCalledWith(-1);
      expect(beacon('Filters')).toHaveFocus();
      fireEvent.click(beacon('Filters'));
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onChange).toHaveBeenLastCalledWith(-1);
      unmount();
      render(
        <Tips
          defaultOpen
          overlay={false}
          onChange={onChange}
          onOpenChange={onOpenChange}
        />
      );
      fireEvent.click(beacon('Export'));
      expect(dialog()).not.toHaveAttribute('aria-modal');
      press('Escape');
      expect(onChange).toHaveBeenLastCalledWith(-1);
      expect(beacon('Export')).toHaveFocus();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('closes the step on a press outside with closeOnClickOutside, and does nothing on one without it', () => {
      const onChange = vi.fn();
      const { unmount } = render(<Tips defaultOpen onChange={onChange} />);
      fireEvent.click(beacon('Filters'));
      fireEvent.pointerDown(document.querySelector('.tour-overlay') as Element);
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(dialog()).toBeVisible();
      unmount();
      const onOpenChange = vi.fn();
      render(
        <Tips
          defaultOpen
          closeOnClickOutside
          onChange={onChange}
          onOpenChange={onOpenChange}
        />
      );
      fireEvent.click(beacon('Filters'));
      fireEvent.pointerDown(document.querySelector('.tour-overlay') as Element);
      expect(onChange).toHaveBeenLastCalledWith(-1);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('leaves the arrow keys alone in a beacon’s step, and says nothing in its status line', () => {
      const onChange = vi.fn();
      render(
        <Tips defaultOpen onChange={onChange}>
          <Tour.Step target="#filters" title="Filters">
            1
          </Tour.Step>
          <Tour.Step target="#export" title="Export">
            2
          </Tour.Step>
          <Tour.Step target="#opener" title="Opener">
            3
          </Tour.Step>
        </Tips>
      );
      fireEvent.click(beacon('Export'));
      onChange.mockClear();
      expect(press('ArrowRight')).toBe(true);
      expect(press('ArrowLeft')).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('opens a step from a controlled value as if from its beacon, without a status line', () => {
      const Controlled = ({ value }: { value: number }) => (
        <Tips open value={value} />
      );
      const { rerender } = render(<Controlled value={-1} />);
      expect(beacons()).toHaveLength(2);
      rerender(<Controlled value={0} />);
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
      rerender(<Controlled value={1} />);
      expect(screen.getByRole('dialog', { name: 'Export' })).toBeVisible();
      expect(screen.getByRole('status')).toHaveTextContent('');
      rerender(<Controlled value={-1} />);
      expect(beacon('Export')).toHaveFocus();
      // One that names no step shows the beacons.
      rerender(<Controlled value={5} />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(beacons()).toHaveLength(2);
    });

    it('hands focus back to the closed step’s own beacon, though steps before it go at the same time, and to its target when it goes too', () => {
      const all = [
        { id: 'opener', title: 'Opener' },
        { id: 'filters', title: 'Filters' },
        { id: 'export', title: 'Export' },
      ];
      const Some = ({ ids, value }: { ids: string[]; value: number }) => (
        <Tips open value={value}>
          {all
            .filter(tip => ids.includes(tip.id))
            .map(tip => (
              <Tour.Step key={tip.id} target={`#${tip.id}`} title={tip.title}>
                {tip.title}
              </Tour.Step>
            ))}
        </Tips>
      );
      const ids = all.map(tip => tip.id);
      const { rerender } = render(<Some ids={ids} value={1} />);
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
      rerender(<Some ids={['filters', 'export']} value={-1} />);
      expect(beacon('Filters')).toHaveFocus();
      // A step that goes as it closes takes its beacon with it, and focus
      // goes to its target, still on the page.
      rerender(<Some ids={['filters', 'export']} value={0} />);
      rerender(<Some ids={['export']} value={-1} />);
      expect(document.getElementById('filters')).toHaveFocus();
    });

    it('starts again from the beacons each time it opens, unless defaultValue names a step', () => {
      const Toggled = ({ open, ...props }: Partial<TourProps>) => (
        <Tips open={open} {...props} />
      );
      const { rerender } = render(<Toggled open />);
      fireEvent.click(beacon('Filters'));
      expect(dialog()).toBeVisible();
      rerender(<Toggled open={false} />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(beacons()).toHaveLength(0);
      expect(document.querySelector('.tour')).toBeNull();
      const filters = document.getElementById('filters') as HTMLElement;
      rerender(<Toggled open />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(beacons()).toHaveLength(2);
      // Showing the beacons moves no focus.
      expect(filters).toHaveFocus();
      rerender(<Toggled open={false} />);
      rerender(<Toggled open defaultValue={1} />);
      expect(screen.getByRole('dialog', { name: 'Export' })).toBeVisible();
    });

    it('names a beacon by a title that’s a node, or by the step’s aria-label, in its own words', () => {
      render(
        <Tips defaultOpen labels={{ beacon: 'Tipp zeigen', beacons: 'Tipps' }}>
          <Tour.Step
            target="#filters"
            title={
              <>
                <em>Filters</em> panel
              </>
            }
          >
            1
          </Tour.Step>
          <Tour.Step target="#export" aria-label="Export">
            2
          </Tour.Step>
        </Tips>
      );
      expect(screen.getByRole('group', { name: 'Tipps' })).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Tipp zeigen Filters panel' })
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Tipp zeigen Export' })
      ).toBeVisible();
    });

    it('mirrors a beacon to its target’s top left corner under right-to-left text', () => {
      render(
        <div dir="rtl">
          <Tips defaultOpen />
        </div>
      );
      // Queried by class: naming it would read the mocked rtl styles.
      const first = document.querySelector('.tour-beacon') as HTMLElement;
      expect(first).toHaveTextContent('Show tip Filters');
      expect(first.style.left).toBe('100px');
    });

    it('gives a step with no target, or one off the page or without a box, no beacon until it turns up, and warns', async () => {
      render(
        <>
          <div hidden>
            <button type="button" id="hidden-target">
              Hidden
            </button>
          </div>
          <Tips defaultOpen>
            <Tour.Step title="Anywhere">1</Tour.Step>
            <Tour.Step target="#late" title="Late">
              2
            </Tour.Step>
            <Tour.Step target="#hidden-target" title="Hidden">
              3
            </Tour.Step>
            <Tour.Step target="#filters" title="Filters">
              4
            </Tour.Step>
          </Tips>
        </>
      );
      expect(beacons().map(b => b.textContent)).toEqual(['Show tip Filters']);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('beacon mode has no target')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Target: "#late"')
      );
      const late = document.createElement('button');
      late.id = 'late';
      late.dataset.rect = '300 300 40 20';
      await act(async () => {
        document.body.prepend(late);
      });
      expect(beacons().map(b => b.textContent)).toEqual([
        'Show tip Late',
        'Show tip Filters',
      ]);
      expect(beacon('Late').style.top).toBe('300px');
      late.remove();
    });

    it('drops a step’s beacon with the step, and the group with the last beacon', () => {
      const { rerender } = render(<Tips defaultOpen />);
      rerender(
        <Tips defaultOpen>
          <Tour.Step target="#export" title="Export">
            2
          </Tour.Step>
        </Tips>
      );
      expect(beacons().map(b => b.textContent)).toEqual(['Show tip Export']);
      rerender(
        <Tips defaultOpen>
          <Tour.Step target="#nowhere" title="Nowhere">
            3
          </Tour.Step>
        </Tips>
      );
      expect(screen.queryByRole('group')).toBeNull();
      expect(document.querySelector('.tour')).not.toBeNull();
    });

    it('warns once when the targets are out of document order', () => {
      render(
        <Tips defaultOpen>
          <Tour.Step target="#export" title="Export">
            1
          </Tour.Step>
          <Tour.Step target="#filters" title="Filters">
            2
          </Tour.Step>
        </Tips>
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('out of document order')
      );
    });

    it('follows its targets as the page scrolls or resizes, or one changes size', () => {
      const sizes = withResizeObserver();
      render(<Tips defaultOpen />);
      const filters = document.getElementById('filters') as HTMLElement;
      expect(sizes.watches(filters)).toBe(true);
      filters.dataset.rect = '150 100 80 30';
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(beacon('Filters').style.top).toBe('150px');
      filters.dataset.rect = '160 100 90 30';
      sizes.fire();
      expect(beacon('Filters').style.left).toBe('190px');
      filters.dataset.rect = '170 100 90 30';
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(beacon('Filters').style.top).toBe('170px');
    });

    it('measures its beacons once a frame, however many changes ask in it', () => {
      const frames: FrameRequestCallback[] = [];
      vi.mocked(window.requestAnimationFrame).mockImplementation(callback => {
        frames.push(callback);
        return frames.length;
      });
      render(<Tips defaultOpen />);
      const asked = frames.length;
      act(() => {
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      expect(frames).toHaveLength(asked + 1);
      const filters = document.getElementById('filters') as HTMLElement;
      filters.dataset.rect = '220 100 80 30';
      act(() => frames[frames.length - 1](0));
      expect(beacon('Filters').style.top).toBe('220px');
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(frames).toHaveLength(asked + 2);
    });

    it('hides a beacon whose corner is out of view while part of its target shows', () => {
      render(<Tips defaultOpen />);
      // Scrolled so its top is above the viewport, and its top end corner,
      // where the beacon sits, is off the screen.
      document.getElementById('filters')!.dataset.rect = '-100 100 80 400';
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(beacons().map(b => b.textContent)).toEqual(['Show tip Export']);
    });

    it('draws each beacon at its own step’s target in the render that reorders them', () => {
      const frames: FrameRequestCallback[] = [];
      vi.mocked(window.requestAnimationFrame).mockImplementation(callback => {
        frames.push(callback);
        return frames.length;
      });
      const two = [
        <Tour.Step key="filters" target="#filters" title="Filters">
          1
        </Tour.Step>,
        <Tour.Step key="export" target="#export" title="Export">
          2
        </Tour.Step>,
      ];
      const { rerender } = render(<Tips defaultOpen>{two}</Tips>);
      rerender(<Tips defaultOpen>{[two[1], two[0]]}</Tips>);
      // No frame has run: the render measured them.
      expect(beacon('Filters').style.left).toBe('180px');
      expect(beacon('Export').style.left).toBe('880px');
    });

    it('keeps a focused beacon, and its place, when a step is added before it', () => {
      const step = (name: string, target: string) => (
        <Tour.Step key={name} target={target} title={name}>
          {name}
        </Tour.Step>
      );
      const { rerender } = render(
        <Tips defaultOpen>
          {[step('Filters', '#filters'), step('Export', '#export')]}
        </Tips>
      );
      const exportBeacon = beacon('Export');
      exportBeacon.focus();
      rerender(
        <Tips defaultOpen>
          {[
            step('Opener', '#opener'),
            step('Filters', '#filters'),
            step('Export', '#export'),
          ]}
        </Tips>
      );
      expect(beacon('Export')).toBe(exportBeacon);
      expect(exportBeacon).toHaveFocus();
      expect(exportBeacon.style.left).toBe('880px');
    });

    it('leaves focus in a step that turns guided while its tip shows', () => {
      const { rerender } = render(<Tips defaultOpen />);
      fireEvent.click(beacon('Filters'));
      fireEvent.click(next());
      expect(beacon('Filters')).toHaveFocus();
      fireEvent.click(beacon('Export'));
      expect(next()).toHaveFocus();
      rerender(<Tips defaultOpen mode="guided" />);
      expect(dialog()).toContainElement(document.activeElement as HTMLElement);
    });

    it('closes a tip the value opened when its step moves, as one a beacon opened', () => {
      const onChange = vi.fn();
      const three = (names: string[]) =>
        names.map(name => (
          <Tour.Step key={name} target="#filters" title={name}>
            {name}
          </Tour.Step>
        ));
      const { rerender } = render(
        <Tips defaultOpen defaultValue={1} onChange={onChange}>
          {three(['A', 'B', 'C'])}
        </Tips>
      );
      expect(screen.getByRole('dialog', { name: 'B' })).toBeVisible();
      rerender(
        <Tips defaultOpen defaultValue={1} onChange={onChange}>
          {three(['B', 'C'])}
        </Tips>
      );
      expect(onChange).toHaveBeenCalledWith(-1);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('warns about a step in beacon mode with no target as having none', () => {
      render(
        <Tips defaultOpen>
          <Tour.Step title="Nowhere">No target.</Tour.Step>
        </Tips>
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('has no target, so it has no beacon')
      );
    });

    it('forgets which targets were out of view when the tour closes', () => {
      const observer = withIntersectionObserver();
      const { rerender } = render(<Tips open />);
      observer().report(
        document.getElementById('filters') as HTMLElement,
        false
      );
      expect(beacons().map(b => b.textContent)).toEqual(['Show tip Export']);
      rerender(<Tips open={false} />);
      rerender(<Tips open />);
      expect(beacons().map(b => b.textContent)).toEqual([
        'Show tip Filters',
        'Show tip Export',
      ]);
    });

    it('hides a beacon while its target is out of view, and stops watching a target that goes', () => {
      const observer = withIntersectionObserver();
      const { rerender } = render(<Tips defaultOpen />);
      const filters = document.getElementById('filters') as HTMLElement;
      expect(observer().watched.has(filters)).toBe(true);
      observer().report(filters, false);
      expect(beacons().map(b => b.textContent)).toEqual(['Show tip Export']);
      // A report that changes nothing changes nothing.
      observer().report(filters, false);
      observer().report(filters, true);
      expect(beacons()).toHaveLength(2);
      rerender(
        <Tips defaultOpen>
          <Tour.Step target="#export" title="Export">
            2
          </Tour.Step>
        </Tips>
      );
      expect(observer().watched.has(filters)).toBe(false);
    });

    it('measures nothing again for its own changes, only for the page’s', async () => {
      render(<Tips defaultOpen />);
      const frames = vi.mocked(window.requestAnimationFrame);
      frames.mockClear();
      await act(async () => {
        (document.querySelector('.tour-beacon') as HTMLElement).dataset.seen =
          '1';
      });
      expect(frames).not.toHaveBeenCalled();
      await act(async () => {
        (document.getElementById('export') as HTMLElement).dataset.seen = '1';
      });
      expect(frames).toHaveBeenCalled();
    });

    it('hands useTour the mode, with Back doing nothing and Next and Skip closing the step', () => {
      const onChange = vi.fn();
      const Custom = () => {
        const tour = useTour() as NonNullable<ReturnType<typeof useTour>>;
        return (
          <>
            <span>{tour.mode}</span>
            <button type="button" onClick={tour.back}>
              Custom back
            </button>
            <button type="button" onClick={tour.skip}>
              Custom skip
            </button>
            <button type="button" onClick={tour.next}>
              Custom next
            </button>
          </>
        );
      };
      render(<Tips defaultOpen onChange={onChange} footer={<Custom />} />);
      fireEvent.click(beacon('Export'));
      expect(screen.getByText('beacon')).toBeVisible();
      onChange.mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Custom back' }));
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Custom skip' }));
      expect(onChange).toHaveBeenLastCalledWith(-1);
      fireEvent.click(beacon('Export'));
      fireEvent.click(screen.getByRole('button', { name: 'Custom next' }));
      expect(onChange).toHaveBeenLastCalledWith(-1);
    });

    it('reports a guided tour’s mode as guided', () => {
      const Mode = () => <output>{useTour()?.mode}</output>;
      render(
        <Tour defaultOpen footer={<Mode />}>
          <Tour.Step title="One">1</Tour.Step>
        </Tour>
      );
      expect(document.querySelector('output')).toHaveTextContent('guided');
    });

    it('sends focus to the step’s target when the tour closes over a beacon’s step that holds it', () => {
      const Toggled = ({ open }: { open: boolean }) => <Tips open={open} />;
      const { rerender } = render(<Toggled open />);
      fireEvent.click(beacon('Filters'));
      rerender(<Toggled open={false} />);
      expect(document.querySelector('.tour')).toBeNull();
      expect(document.getElementById('filters')).toHaveFocus();
    });

    it('sends focus into a target’s first control, and leaves it on the page where the user moved it', () => {
      const Toggled = ({ open }: { open: boolean }) => (
        <>
          <div id="panel" data-rect="300 300 200 100">
            <input aria-label="Inside the panel" />
          </div>
          <Tips open={open} overlay={false}>
            <Tour.Step target="#panel" title="Panel">
              1
            </Tour.Step>
            <Tour.Step target="#export" title="Export">
              2
            </Tour.Step>
          </Tips>
        </>
      );
      const { rerender } = render(<Toggled open />);
      fireEvent.click(beacon('Panel'));
      rerender(<Toggled open={false} />);
      expect(
        screen.getByRole('textbox', { name: 'Inside the panel' })
      ).toHaveFocus();
      rerender(<Toggled open />);
      fireEvent.click(beacon('Export'));
      const opener = screen.getByRole('button', { name: 'Open' });
      opener.focus();
      rerender(<Toggled open={false} />);
      expect(opener).toHaveFocus();
    });

    it('hands focus back to the beacon only while the closing step holds it', () => {
      const Some = ({ value }: { value: number }) => (
        <Tips open value={value} overlay={false} />
      );
      const { rerender } = render(<Some value={0} />);
      const field = document.createElement('input');
      document.body.appendChild(field);
      field.focus();
      rerender(<Some value={-1} />);
      expect(field).toHaveFocus();
      expect(beacons()).toHaveLength(2);
      field.remove();
    });

    it('closes the open tip when a step before it comes or goes, or it goes, firing onChange(-1) once each', () => {
      const onChange = vi.fn();
      const Some = ({ ids }: { ids: string[] }) => (
        <Tips defaultOpen onChange={onChange}>
          {['opener', 'filters', 'export']
            .filter(id => ids.includes(id))
            .map(id => (
              <Tour.Step key={id} target={`#${id}`} title={id}>
                {id}
              </Tour.Step>
            ))}
        </Tips>
      );
      const { rerender } = render(<Some ids={['filters', 'export']} />);
      fireEvent.click(beacon('export'));
      expect(onChange).toHaveBeenLastCalledWith(1);
      // A step inserted before it: the tip closes, with focus on its beacon.
      rerender(<Some ids={['opener', 'filters', 'export']} />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(-1);
      expect(beacon('export')).toHaveFocus();
      fireEvent.click(beacon('export'));
      expect(onChange).toHaveBeenLastCalledWith(2);
      // A step removed before it.
      rerender(<Some ids={['filters', 'export']} />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(-1);
      fireEvent.click(beacon('export'));
      // The open step removed: focus goes to its target.
      rerender(<Some ids={['filters']} />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.getElementById('export')).toHaveFocus();
      expect(onChange.mock.calls.filter(([v]) => v === -1)).toHaveLength(3);
    });

    it('leaves what shows to a controlled value, telling the app once that its tip closed', () => {
      const onChange = vi.fn();
      // A parent that takes the opening and ignores the rest.
      const Stubborn = ({ ids }: { ids: string[] }) => {
        const [value, setValue] = useState(-1);
        return (
          <Tips
            open
            value={value}
            onChange={v => {
              onChange(v);
              if (v >= 0) setValue(v);
            }}
          >
            {['opener', 'filters', 'export']
              .filter(id => ids.includes(id))
              .map(id => (
                <Tour.Step key={id} target={`#${id}`} title={id}>
                  {id}
                </Tour.Step>
              ))}
          </Tips>
        );
      };
      const { rerender } = render(<Stubborn ids={['filters', 'export']} />);
      fireEvent.click(beacon('export'));
      rerender(<Stubborn ids={['opener', 'filters', 'export']} />);
      expect(onChange).toHaveBeenLastCalledWith(-1);
      // The value still says 1, so the step there shows.
      expect(screen.getByRole('dialog', { name: 'filters' })).toBeVisible();
      rerender(<Stubborn ids={['opener', 'filters', 'export']} />);
      expect(onChange.mock.calls.filter(([v]) => v === -1)).toHaveLength(1);
    });

    it('opens a value that names no step once steps arrive that it names', () => {
      const onChange = vi.fn();
      const Some = ({ ids }: { ids: string[] }) => (
        <Tips open value={2} onChange={onChange}>
          {['opener', 'filters', 'export']
            .filter(id => ids.includes(id))
            .map(id => (
              <Tour.Step key={id} target={`#${id}`} title={id}>
                {id}
              </Tour.Step>
            ))}
        </Tips>
      );
      const { rerender } = render(<Some ids={['filters']} />);
      expect(screen.queryByRole('dialog')).toBeNull();
      rerender(<Some ids={['opener', 'filters', 'export']} />);
      expect(screen.getByRole('dialog', { name: 'export' })).toBeVisible();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('forgets the tip a beacon opened when the mode or open changes', () => {
      const onChange = vi.fn();
      const Some = ({
        ids,
        mode = 'beacon',
        open = true,
      }: {
        ids: string[];
        mode?: TourProps['mode'];
        open?: boolean;
      }) => (
        <Tips open={open} mode={mode} onChange={onChange}>
          {['opener', 'filters', 'export']
            .filter(id => ids.includes(id))
            .map(id => (
              <Tour.Step key={id} target={`#${id}`} title={id}>
                {id}
              </Tour.Step>
            ))}
        </Tips>
      );
      const ids = ['filters', 'export'];
      const { rerender, unmount } = render(<Some ids={ids} />);
      fireEvent.click(beacon('export'));
      onChange.mockClear();
      // Guided now: steps change under the step it opened, and back.
      rerender(<Some ids={ids} mode="guided" />);
      rerender(<Some ids={['opener', ...ids]} mode="guided" />);
      rerender(<Some ids={['opener', ...ids]} />);
      expect(onChange).not.toHaveBeenCalled();
      unmount();
      const again = render(<Some ids={ids} />);
      fireEvent.click(beacon('export'));
      onChange.mockClear();
      // Closed, the steps change, and it opens again.
      again.rerender(<Some ids={ids} open={false} />);
      again.rerender(<Some ids={['opener', ...ids]} open={false} />);
      again.rerender(<Some ids={['opener', ...ids]} />);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('fires onChange(-1) once for a tip closed under StrictMode', () => {
      const onChange = vi.fn();
      const Some = ({ ids }: { ids: string[] }) => (
        <StrictMode>
          <Tips defaultOpen onChange={onChange}>
            {['opener', 'filters', 'export']
              .filter(id => ids.includes(id))
              .map(id => (
                <Tour.Step key={id} target={`#${id}`} title={id}>
                  {id}
                </Tour.Step>
              ))}
          </Tips>
        </StrictMode>
      );
      const { rerender } = render(<Some ids={['filters', 'export']} />);
      fireEvent.click(beacon('export'));
      rerender(<Some ids={['opener', 'filters', 'export']} />);
      expect(onChange.mock.calls.filter(([v]) => v === -1)).toHaveLength(1);
    });

    it('moves no focus as a step goes that didn’t hold it, as after a click on the page’s background', () => {
      const Some = ({ open, value }: { open: boolean; value: number }) => (
        <Tips open={open} value={value} overlay={false} />
      );
      const { rerender } = render(<Some open value={0} />);
      expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
      // A click on the page's background leaves focus on <body>.
      (document.activeElement as HTMLElement).blur();
      rerender(<Some open value={-1} />);
      expect(document.body).toHaveFocus();
      rerender(<Some open value={1} />);
      (document.activeElement as HTMLElement).blur();
      rerender(<Some open={false} value={1} />);
      expect(document.body).toHaveFocus();
    });

    it('keeps watching the targets while a step is open, so the beacons come back as they are', () => {
      const observer = withIntersectionObserver();
      const { rerender } = render(<Tips defaultOpen />);
      const filters = document.getElementById('filters') as HTMLElement;
      const exportButton = document.getElementById('export') as HTMLElement;
      fireEvent.click(beacon('Filters'));
      expect(observer().watched.has(exportButton)).toBe(true);
      observer().report(exportButton, false);
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(beacons().map(b => b.textContent)).toEqual(['Show tip Filters']);
      expect(beacon('Filters')).toHaveFocus();
      fireEvent.click(beacon('Filters'));
      observer().report(exportButton, true);
      // A report that changes nothing changes nothing.
      observer().report(exportButton, true);
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(beacons()).toHaveLength(2);
      // A target no longer a step's is dropped, and not hidden when it's
      // one again.
      observer().report(filters, false);
      rerender(
        <Tips defaultOpen>
          <Tour.Step target="#export" title="Export">
            2
          </Tour.Step>
        </Tips>
      );
      expect(observer().watched.has(filters)).toBe(false);
      rerender(<Tips defaultOpen />);
      expect(beacons()).toHaveLength(2);
    });

    it('moves focus nowhere when neither the beacon nor the target is left', () => {
      const Some = ({ value }: { value: number }) => (
        <Tips open value={value}>
          <Tour.Step title="Anywhere">1</Tour.Step>
          <Tour.Step target="#export" title="Export">
            2
          </Tour.Step>
        </Tips>
      );
      const { rerender } = render(<Some value={0} />);
      expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
      rerender(<Some value={-1} />);
      expect(document.body).toHaveFocus();
    });

    it('skips the development checks in a production build', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        render(
          <Tips defaultOpen>
            <Tour.Step target="#export" title="Export">
              1
            </Tour.Step>
            <Tour.Step target="#filters" title="Filters">
              2
            </Tour.Step>
            <Tour.Step target="#nowhere" title="Nowhere">
              3
            </Tour.Step>
          </Tips>
        );
        expect(beacons()).toHaveLength(2);
        expect(console.warn).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = previous;
      }
    });

    it('prefixes the beacons’ classes under ConfigProvider classPrefix', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Tips defaultOpen />
        </ConfigProvider>
      );
      const root = document.querySelector('.bestax-tour') as HTMLElement;
      expect(root).toHaveClass('bestax-is-beacon');
      expect(root.querySelector('.bestax-tour-beacons')).not.toBeNull();
      expect(beacon('Filters')).toHaveClass('bestax-tour-beacon');
      expect(root.querySelector('.tour-beacon')).toBeNull();
      fireEvent.click(beacon('Filters'));
      expect(root).toHaveClass('bestax-is-active');
    });
  });

  describe('props, refs and the portal', () => {
    it('puts the root’s helper props and attributes on .tour, and the step’s on its panel', () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <Tour defaultOpen className="mine" p="2" data-testid="tour">
          <Tour.Step
            title="Step"
            className="own"
            m="3"
            id="the-step"
            style={{ zIndex: 1 }}
            onPointerDownCapture={() => {}}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            Body.
          </Tour.Step>
        </Tour>
      );
      expect(screen.getByTestId('tour')).toHaveClass('tour', 'mine', 'p-2');
      expect(dialog()).toHaveClass('tour-step', 'own', 'm-3');
      expect(dialog()).toHaveAttribute('id', 'the-step');
      expect(dialog().style.zIndex).toBe('1');
      fireEvent.pointerDown(dialog());
      expect(onFocus).toHaveBeenCalled();
      next().blur();
      expect(onBlur).toHaveBeenCalled();
    });

    it('forwards the root’s ref and the step’s, objects and callbacks alike', () => {
      const rootRef = createRef<HTMLDivElement>();
      const stepRef = createRef<HTMLDivElement>();
      const { unmount } = render(
        <Tour defaultOpen ref={rootRef}>
          <Tour.Step title="Step" ref={stepRef}>
            Body.
          </Tour.Step>
        </Tour>
      );
      expect(rootRef.current).toHaveClass('tour');
      expect(stepRef.current).toBe(dialog());
      unmount();
      expect(rootRef.current).toBeNull();

      const seen: Array<HTMLDivElement | null> = [];
      const cleanup = vi.fn();
      const { unmount: unmountAgain } = render(
        <Tour defaultOpen ref={node => void seen.push(node)}>
          <Tour.Step title="Step" ref={() => cleanup}>
            Body.
          </Tour.Step>
        </Tour>
      );
      unmountAgain();
      expect(seen[0]).toHaveClass('tour');
      expect(seen[seen.length - 1]).toBeNull();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('forwards a ref on Tour.Skip, Tour.Back and Tour.Next to the button, objects and callbacks alike', () => {
      const skipRef = createRef<HTMLButtonElement>();
      const backRef = createRef<HTMLButtonElement>();
      const seen: Array<HTMLButtonElement | null> = [];
      const { unmount } = render(
        <Tour
          defaultOpen
          defaultValue={1}
          footer={
            <>
              <Tour.Skip ref={skipRef} />
              <Tour.Back ref={backRef} />
              <Tour.Next ref={node => void seen.push(node)} />
            </>
          }
        >
          <Tour.Step title="One">1</Tour.Step>
          <Tour.Step title="Two">2</Tour.Step>
        </Tour>
      );
      expect(skipRef.current).toBe(
        screen.getByRole('button', { name: 'Skip' })
      );
      expect(backRef.current).toBe(
        screen.getByRole('button', { name: 'Back' })
      );
      expect(seen[0]).toBe(next());
      // A ref on Next doesn't take where focus starts away.
      expect(next()).toHaveFocus();
      unmount();
      expect(skipRef.current).toBeNull();
      expect(seen[seen.length - 1]).toBeNull();
    });

    it('renders in place with portal={false}, and into a container a selector names', () => {
      const { container, unmount } = render(
        <Page defaultOpen portal={false} />
      );
      expect(container.querySelector('.tour')).not.toBeNull();
      unmount();
      const target = document.createElement('div');
      target.id = 'tour-host';
      document.body.appendChild(target);
      render(<Page defaultOpen portal="#tour-host" />);
      expect(target.querySelector('[role="dialog"]')).not.toBeNull();
      target.remove();
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Page defaultOpen defaultValue={1} />
        </ConfigProvider>
      );
      const tour = document.querySelector('.bestax-tour') as HTMLElement;
      expect(tour).not.toHaveClass('tour');
      expect(dialog()).toHaveClass('bestax-tour-step', 'bestax-is-bottom');
      for (const part of [
        'tour-overlay',
        'tour-spotlight',
        'tour-spotlight-ring',
        'tour-step-header',
        'tour-step-title',
        'tour-step-body',
        'tour-step-footer',
        'tour-progress',
      ]) {
        expect(tour.querySelector(`.bestax-${part}`)).not.toBeNull();
        expect(tour.querySelector(`.${part}`)).toBeNull();
      }
      expect(next()).toHaveClass('bestax-button', 'bestax-is-primary');
    });

    it('shows after hydration, with no mismatch', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const app = <Page defaultOpen />;
      const host = document.createElement('div');
      host.innerHTML = renderToString(app);
      // React 18 warns about a layout effect in a server render that runs in
      // a test's browser, which a real server never is. The hydration is
      // what's checked.
      error.mockClear();
      document.body.appendChild(host);
      expect(host.querySelector('.tour')).toBeNull();
      await act(async () => {
        hydrateRoot(host, app);
      });
      expect(dialog()).toBeVisible();
      expect(error).not.toHaveBeenCalled();
      host.remove();
    });
  });

  describe('Compound components', () => {
    it('attaches the step and the footer’s parts as statics', () => {
      expect(Tour.Step).toBe(TourStep);
      expect(Tour.Skip).toBe(TourSkip);
      expect(Tour.Back).toBe(TourBack);
      expect(Tour.Next).toBe(TourNext);
      expect(Tour.Progress).toBe(TourProgress);
      expect(Tour.displayName).toBe('Tour');
    });
  });
});
