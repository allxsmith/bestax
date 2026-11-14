import React, { createRef, useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Tour, TourStep } from '../Tour';
import { Controlled as ControlledStory } from '../Tour.stories';
import type { TourProps } from '../Tour';
import { Modal } from '../Modal';
import { Popover } from '../Popover';
import { ConfigProvider } from '../../helpers/Config';
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
  vi.restoreAllMocks();
  Reflect.deleteProperty(root, 'clientWidth');
  Reflect.deleteProperty(root, 'clientHeight');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  Reflect.deleteProperty(window, 'matchMedia');
  Reflect.deleteProperty(globalThis, 'ResizeObserver');
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
});
