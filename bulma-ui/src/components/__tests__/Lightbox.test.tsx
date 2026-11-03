import React, { createRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Lightbox,
  LightboxTrigger,
  type LightboxItem,
  type LightboxProps,
} from '../Lightbox';
import { Image } from '../../elements/Image';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

const PHOTOS: LightboxItem[] = [
  { src: '/harbour.jpg', alt: 'Harbour at dusk', caption: 'Brixham' },
  {
    src: '/quay.jpg',
    alt: 'Boats along the quay',
    srcSet: '/quay-800.jpg 800w, /quay-1600.jpg 1600w',
    sizes: '100vw',
  },
  { src: '/lighthouse.jpg', alt: 'Lighthouse on the breakwater' },
];

/** A Lightbox over PHOTOS with a trigger per photo. */
function Gallery(props: Partial<LightboxProps>) {
  return (
    <Lightbox items={PHOTOS} {...props}>
      {(props.items ?? PHOTOS).map((photo, i) => (
        <Lightbox.Trigger key={photo.src} index={i}>
          <img src={photo.src} alt={photo.alt} />
        </Lightbox.Trigger>
      ))}
    </Lightbox>
  );
}

const dialog = () => screen.getByRole('dialog');
const queryDialog = () => screen.queryByRole('dialog');
/** The image shown, not the one fading out. */
const shownImage = () =>
  document.querySelector(
    '.lightbox-image:not(.is-leaving)'
  ) as HTMLImageElement;
const leavingImage = () => document.querySelector('.lightbox-image.is-leaving');
const button = (name: string) => screen.getByRole('button', { name });
const trigger = (alt: string) => screen.getByRole('button', { name: alt });
const key = (name: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(dialog(), { key: name, ...init });
const statusText = () => screen.getByRole('status').textContent;
const transformOf = (el: Element) => (el as HTMLElement).style.transform;

/** Renders, and lets the image shown load, which zoom waits for. */
const renderLoaded = (ui: React.ReactElement) => {
  const result = render(ui);
  fireEvent.load(shownImage());
  return result;
};

/** Opens the gallery at a photo by its trigger. */
const open = (alt = 'Harbour at dusk') => fireEvent.click(trigger(alt));

/**
 * Lays the viewer out as a browser would: 1000 by 800, with the image
 * 600 by 450 in the middle. jsdom lays out nothing.
 */
function layOut() {
  const box = (el: HTMLElement, image: number, root: number, otherwise = 0) => {
    if (el.classList.contains('lightbox-image')) return image;
    if (el.classList.contains('lightbox')) return root;
    return otherwise;
  };
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return box(this, 600, 1000);
    }
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return box(this, 450, 800);
    }
  );
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
    function (this: HTMLElement) {
      return box(this, 200, 0);
    }
  );
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(
    function (this: HTMLElement) {
      return box(this, 175, 0);
    }
  );
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains('lightbox-image')
        ? this.closest('.lightbox')
        : null;
    }
  );
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(
    function (this: Element) {
      return box(this as HTMLElement, 0, 1000);
    }
  );
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: Element) {
      return box(this as HTMLElement, 0, 800);
    }
  );
}

/** Makes the viewer right to left, as far as it can tell. */
function rightToLeft() {
  const real = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    const style = real(el, pseudo);
    return el.classList.contains('lightbox')
      ? ({ ...style, direction: 'rtl' } as CSSStyleDeclaration)
      : style;
  });
}

type Listener = (event: { matches: boolean }) => void;
function reduceMotion(matches = true) {
  const listeners: Listener[] = [];
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_: string, cb: Listener) => listeners.push(cb),
    removeEventListener: () => {},
  });
}

/** A pointer event with what jsdom leaves out. */
const pointer = (
  el: Element,
  type: 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel',
  {
    timeStamp,
    ...init
  }: {
    pointerId?: number;
    pointerType?: string;
    clientX?: number;
    clientY?: number;
    timeStamp?: number;
  } = {}
) => {
  const event = createEvent[type](el, {
    pointerId: 1,
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
    // The first pointer down is the primary one, as a browser has it.
    isPrimary: (init.pointerId ?? 1) === 1,
    ...init,
  });
  // jsdom stamps events with the real clock, which fake timers don't move.
  if (timeStamp !== undefined) {
    Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  }
  return fireEvent(el, event);
};

/**
 * Records what the viewer fetches ahead: what's set on the images it makes
 * and never puts on the page.
 */
function watchPreloads() {
  const watch = (name: 'src' | 'srcset' | 'sizes') =>
    vi.spyOn(HTMLImageElement.prototype, name, 'set');
  const spies = {
    src: watch('src'),
    srcset: watch('srcset'),
    sizes: watch('sizes'),
  };
  const read = (spy: (typeof spies)['src']) =>
    spy.mock.calls
      .filter((_, i) => {
        const image = spy.mock.contexts[i] as Element;
        // The viewer's own images have a class, even once they're gone.
        return !image.isConnected && !image.className;
      })
      .map(([value]) => value);
  return () => ({
    src: read(spies.src),
    srcset: read(spies.srcset),
    sizes: read(spies.sizes),
  });
}

const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  // jsdom has no pointer capture.
  Element.prototype.setPointerCapture = vi.fn();
});

beforeEach(() => {
  resetDevWarnings();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
});

describe('Lightbox', () => {
  describe('closed', () => {
    it('renders its children in place and nothing else', () => {
      const { container } = render(
        <Lightbox items={PHOTOS}>
          <span>One</span>
          <span>Two</span>
        </Lightbox>
      );
      expect(container.innerHTML).toBe('<span>One</span><span>Two</span>');
      expect(queryDialog()).toBeNull();
    });

    it('renders a trigger as a button that says it opens a dialog', () => {
      render(<Gallery />);
      const first = trigger('Harbour at dusk');
      expect(first.tagName).toBe('BUTTON');
      expect(first).toHaveAttribute('type', 'button');
      expect(first).toHaveAttribute('aria-haspopup', 'dialog');
      expect(first).toHaveClass('lightbox-trigger');
    });

    it('renders nothing on the server but the triggers', () => {
      const html = renderToString(<Gallery />);
      expect(html).not.toContain('modal');
      expect(html).toContain('lightbox-trigger');
    });
  });

  describe('opening', () => {
    it('opens a portaled dialog at the trigger’s image', () => {
      const { container } = render(<Gallery />);
      open('Boats along the quay');

      expect(dialog()).toHaveClass('modal', 'lightbox', 'is-active');
      expect(dialog()).toHaveAttribute('aria-modal', 'true');
      expect(dialog()).toHaveAccessibleName('Image viewer');
      expect(container.contains(dialog())).toBe(false);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      expect(shownImage()).toHaveAttribute('alt', 'Boats along the quay');
      expect(shownImage()).toHaveAttribute('srcset', PHOTOS[1].srcSet);
      expect(shownImage()).toHaveAttribute('sizes', '100vw');
    });

    it('portals into the ConfigProvider’s portalContainer, or a target of its own', () => {
      const container = document.createElement('div');
      const own = document.createElement('div');
      document.body.append(container, own);
      try {
        const { unmount } = render(
          <ConfigProvider portalContainer={container}>
            <Gallery defaultOpen />
          </ConfigProvider>
        );
        expect(container.contains(dialog())).toBe(true);
        unmount();

        render(<Gallery defaultOpen portal={own} />);
        expect(own.contains(dialog())).toBe(true);
      } finally {
        container.remove();
        own.remove();
      }
    });

    it('renders in place with portal off', () => {
      const { container } = render(<Gallery portal={false} />);
      open();
      expect(container.contains(dialog())).toBe(true);
    });

    it('lays out its parts in order', () => {
      render(<Gallery />);
      open('Boats along the quay');
      const parts = Array.from(dialog().children).map(
        child => child.className || child.getAttribute('role')
      );
      expect(parts).toEqual([
        'modal-background',
        'modal-close is-large',
        'lightbox-toolbar',
        'modal-content',
        'button lightbox-arrow is-previous',
        'button lightbox-arrow is-next',
        'status',
      ]);
      expect(document.querySelector('.modal-content > figure')).toHaveClass(
        'lightbox-figure'
      );
    });

    it('moves focus to the close button, and back to the trigger on close', () => {
      render(<Gallery />);
      open('Boats along the quay');
      expect(button('Close')).toHaveFocus();

      fireEvent.click(button('Close'));
      expect(queryDialog()).toBeNull();
      expect(trigger('Boats along the quay')).toHaveFocus();
    });

    it('calls onChange before onOpenChange', () => {
      const calls: string[] = [];
      render(
        <Gallery
          onChange={value => calls.push(`change ${value}`)}
          onOpenChange={next => calls.push(`open ${next}`)}
        />
      );
      open('Lighthouse on the breakwater');
      expect(calls).toEqual(['change 2', 'open true']);
    });

    it('lets a trigger’s onClick stop it opening', () => {
      const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0} onClick={onClick}>
            View
          </Lightbox.Trigger>
        </Lightbox>
      );
      fireEvent.click(button('View'));
      expect(onClick).toHaveBeenCalled();
      expect(queryDialog()).toBeNull();
    });

    it('opens from defaultOpen at defaultValue', () => {
      render(<Gallery defaultOpen defaultValue={1} />);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
    });

    it('moves to a trigger’s image when one is pressed while open', () => {
      const onOpenChange = vi.fn();
      render(
        <Lightbox
          items={[
            {
              ...PHOTOS[0],
              caption: (
                <Lightbox.Trigger index={2}>
                  See the lighthouse
                </Lightbox.Trigger>
              ),
            },
            PHOTOS[1],
            PHOTOS[2],
          ]}
          defaultOpen
          onOpenChange={onOpenChange}
        />
      );
      fireEvent.click(button('See the lighthouse'));
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('opens from open at the last image shown', () => {
      function Controlled() {
        const [isOpen, setOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Show
            </button>
            <Lightbox items={PHOTOS} open={isOpen} onOpenChange={setOpen} />
          </>
        );
      }
      render(<Controlled />);
      fireEvent.click(button('Show'));
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
      fireEvent.click(button('Next image'));
      fireEvent.click(button('Close'));

      fireEvent.click(button('Show'));
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
    });

    it('follows a controlled value, held to the ends without calling onChange', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <Lightbox items={PHOTOS} open value={1} onChange={onChange} />
      );
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');

      fireEvent.click(button('Next image'));
      expect(onChange).toHaveBeenCalledWith(2);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');

      rerender(<Lightbox items={PHOTOS} open value={9} onChange={onChange} />);
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
      rerender(<Lightbox items={PHOTOS} open value={-4} onChange={onChange} />);
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
      rerender(
        <Lightbox items={PHOTOS} open value={Number.NaN} onChange={onChange} />
      );
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
      rerender(
        <Lightbox items={PHOTOS} open value={1.7} onChange={onChange} />
      );
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('wraps a value past either end with repeat', () => {
      const { rerender } = render(
        <Lightbox items={PHOTOS} open repeat value={4} />
      );
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      rerender(<Lightbox items={PHOTOS} open repeat value={-1} />);
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
    });

    it('calls onChange from a trigger at the image already shown, for a parent that opens it from value', () => {
      // The photo kept in the URL: closed while `photo` is undefined, and
      // `value` falls back to the first image.
      function UrlGallery() {
        const [photo, setPhoto] = useState<number>();
        return (
          <Gallery
            open={photo !== undefined}
            onOpenChange={next => !next && setPhoto(undefined)}
            value={photo ?? 0}
            onChange={setPhoto}
          />
        );
      }
      render(<UrlGallery />);
      open('Harbour at dusk');
      expect(dialog()).toBeInTheDocument();
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('shows nothing open with no items yet, and opens when they arrive', () => {
      const onOpenChange = vi.fn();
      const ui = (items: LightboxItem[]) => (
        <React.StrictMode>
          <Lightbox items={items} onOpenChange={onOpenChange} defaultOpen>
            <Lightbox.Trigger index={0}>View</Lightbox.Trigger>
          </Lightbox>
        </React.StrictMode>
      );
      const { rerender } = render(ui([]));
      expect(queryDialog()).toBeNull();
      fireEvent.click(button('View'));
      expect(onOpenChange).not.toHaveBeenCalled();

      // A deep link whose data was still loading.
      rerender(ui(PHOTOS));
      expect(dialog()).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('closes when its items run out, and stays closed when they come back', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<Gallery onOpenChange={onOpenChange} />);
      open();
      expect(dialog()).toBeInTheDocument();

      // A refetch that empties the list for a moment.
      rerender(<Gallery onOpenChange={onOpenChange} items={[]} />);
      expect(queryDialog()).toBeNull();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);

      rerender(<Gallery onOpenChange={onOpenChange} />);
      expect(queryDialog()).toBeNull();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    });

    it('forwards its ref to the dialog, null while closed', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Lightbox items={PHOTOS} ref={ref}>
          <Lightbox.Trigger index={0}>View</Lightbox.Trigger>
        </Lightbox>
      );
      expect(ref.current).toBeNull();
      fireEvent.click(button('View'));
      expect(ref.current).toBe(dialog());
      fireEvent.click(button('Close'));
      expect(ref.current).toBeNull();
    });

    it('calls a callback ref, and a cleanup it returns', () => {
      const cleanup = vi.fn();
      const ref = vi.fn(() => cleanup);
      render(
        <Lightbox items={PHOTOS} ref={ref}>
          <Lightbox.Trigger index={0}>View</Lightbox.Trigger>
        </Lightbox>
      );
      fireEvent.click(button('View'));
      expect(ref).toHaveBeenCalledWith(dialog());
      fireEvent.click(button('Close'));
      expect(cleanup).toHaveBeenCalled();
    });

    it('puts helper props and other attributes on the dialog', () => {
      render(
        <Gallery defaultOpen className="mine" mt="3" data-gallery="photos" />
      );
      expect(dialog()).toHaveClass('mine', 'mt-3');
      expect(dialog()).toHaveAttribute('data-gallery', 'photos');
    });

    it('takes its own name', () => {
      render(<Gallery defaultOpen ariaLabel="Floor plans" />);
      expect(dialog()).toHaveAccessibleName('Floor plans');
    });
  });

  describe('closing', () => {
    it('closes on Escape', () => {
      const onOpenChange = vi.fn();
      render(<Gallery onOpenChange={onOpenChange} />);
      open();
      key('Escape');
      expect(queryDialog()).toBeNull();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('stays open on Escape with closeOnEscape off', () => {
      render(<Gallery defaultOpen closeOnEscape={false} />);
      key('Escape');
      expect(dialog()).toBeInTheDocument();
    });

    it('closes on a click on the background, unless closeOnClickOutside is off', () => {
      const { unmount } = render(<Gallery defaultOpen />);
      fireEvent.click(document.querySelector('.modal-background') as Element);
      expect(queryDialog()).toBeNull();
      unmount();

      render(<Gallery defaultOpen closeOnClickOutside={false} />);
      fireEvent.click(document.querySelector('.modal-background') as Element);
      expect(dialog()).toBeInTheDocument();
    });

    it('closes on a swipe down, and not on a swipe up', () => {
      render(<Gallery defaultOpen />);
      const image = shownImage();
      fireEvent.touchStart(image, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(image, { touches: [{ clientX: 110, clientY: 40 }] });
      fireEvent.touchEnd(image);
      expect(dialog()).toBeInTheDocument();

      fireEvent.touchStart(image, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(image, { touches: [{ clientX: 110, clientY: 260 }] });
      fireEvent.touchEnd(image);
      expect(queryDialog()).toBeNull();
    });
  });

  describe('moving', () => {
    it('goes on and back with the arrows, disabled but focusable at the ends', () => {
      const onChange = vi.fn();
      render(<Gallery defaultOpen onChange={onChange} />);
      const previous = button('Previous image');
      const next = button('Next image');
      expect(previous).toHaveAttribute('aria-disabled', 'true');
      expect(previous).not.toBeDisabled();

      fireEvent.click(previous);
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.click(next);
      fireEvent.click(next);
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
      expect(next).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(next);
      expect(onChange.mock.calls).toEqual([[1], [2]]);

      fireEvent.click(previous);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      expect(previous).not.toHaveAttribute('aria-disabled');
    });

    it('wraps round with repeat', () => {
      render(<Gallery defaultOpen repeat />);
      expect(button('Previous image')).not.toHaveAttribute('aria-disabled');
      fireEvent.click(button('Previous image'));
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
      fireEvent.click(button('Next image'));
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('moves with the arrow keys, Home and End', () => {
      render(<Gallery defaultOpen />);
      key('ArrowRight');
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      key('ArrowLeft');
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
      key('End');
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
      key('Home');
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('mirrors the arrow keys and swipes right to left', () => {
      rightToLeft();
      render(<Gallery defaultOpen />);
      key('ArrowLeft');
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      key('ArrowRight');
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');

      const image = shownImage();
      fireEvent.touchStart(image, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchMove(image, { touches: [{ clientX: 300, clientY: 0 }] });
      fireEvent.touchEnd(image);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
    });

    it('moves with a swipe left and a swipe right', () => {
      render(<Gallery defaultOpen />);
      const swipe = (from: number, to: number) => {
        const image = shownImage();
        fireEvent.touchStart(image, {
          touches: [{ clientX: from, clientY: 0 }],
        });
        fireEvent.touchMove(image, { touches: [{ clientX: to, clientY: 0 }] });
        fireEvent.touchEnd(image);
      };
      swipe(300, 100);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');
      swipe(100, 300);
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('follows a swipe with the figure, never upward', () => {
      render(<Gallery defaultOpen />);
      const figure = document.querySelector('.lightbox-figure') as HTMLElement;
      fireEvent.mouseDown(shownImage(), { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(shownImage(), { clientX: 60, clientY: 80 });
      expect(figure.style.transform).toBe('translate(-40px, 0px)');
      expect(figure.style.transition).toBe('none');
      fireEvent.mouseMove(shownImage(), { clientX: 60, clientY: 130 });
      expect(figure.style.transform).toBe('translate(-40px, 30px)');
      fireEvent.mouseUp(shownImage());
      expect(figure.style.transform).toBe('');
    });

    it('drops a swipe when a second finger lands', () => {
      render(<Gallery defaultOpen />);
      const image = shownImage();
      fireEvent.touchStart(image, { touches: [{ clientX: 300, clientY: 0 }] });
      fireEvent.touchStart(image, {
        touches: [
          { clientX: 300, clientY: 0 },
          { clientX: 400, clientY: 0 },
        ],
      });
      fireEvent.touchMove(image, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(image);
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('leaves out the arrows and the counter for a single image', () => {
      const preloads = watchPreloads();
      render(<Lightbox items={[PHOTOS[0]]} defaultOpen repeat />);
      // With repeat its neighbours are itself, which it already has.
      expect(preloads().src).toEqual([]);
      expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull();
      expect(document.querySelector('.lightbox-progress')).toBeNull();
      key('Home');
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('ignores keys with a modifier, in a field, from portaled content, or already used', () => {
      const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
        if (e.key === 'End') e.preventDefault();
      });
      function Caption() {
        return (
          <>
            <input aria-label="Note" />
            {createPortal(<input aria-label="Elsewhere" />, document.body)}
          </>
        );
      }
      render(
        <Lightbox
          items={[{ ...PHOTOS[0], caption: <Caption /> }, PHOTOS[1]]}
          defaultOpen
          onKeyDown={onKeyDown}
        />
      );
      key('ArrowRight', { altKey: true });
      key('ArrowRight', { ctrlKey: true });
      key('ArrowRight', { metaKey: true });
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Note' }), {
        key: 'ArrowRight',
      });
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Elsewhere' }), {
        key: 'ArrowRight',
      });
      key('End');
      expect(onKeyDown).toHaveBeenCalledTimes(6);
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('lets other keys through', () => {
      render(<Gallery defaultOpen />);
      expect(fireEvent.keyDown(dialog(), { key: 'a' })).toBe(true);
      // Up and Down pan, so they do nothing on a fitted image.
      expect(fireEvent.keyDown(dialog(), { key: 'ArrowUp' })).toBe(true);
      expect(fireEvent.keyDown(dialog(), { key: 'ArrowRight' })).toBe(false);
    });
  });

  describe('the counter and the status line', () => {
    it('shows the counter hidden from assistive technology', () => {
      render(<Gallery defaultOpen defaultValue={1} />);
      const counter = document.querySelector('.lightbox-progress');
      expect(counter?.tagName).toBe('BDI');
      expect(counter).toHaveTextContent('2 / 3');
      expect(counter).toHaveAttribute('aria-hidden', 'true');
    });

    it('says which image is shown a moment after opening and after each move', () => {
      vi.useFakeTimers();
      render(<Gallery defaultOpen />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveTextContent('');
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe('Image 1 of 3: Harbour at dusk');

      fireEvent.click(button('Next image'));
      fireEvent.click(button('Next image'));
      act(() => vi.advanceTimersByTime(499));
      expect(statusText()).toBe('Image 1 of 3: Harbour at dusk');
      act(() => vi.advanceTimersByTime(1));
      expect(statusText()).toBe('Image 3 of 3: Lighthouse on the breakwater');
    });

    it('says only the progress for an image with an empty alt', () => {
      vi.useFakeTimers();
      render(<Lightbox items={[{ src: '/a.jpg', alt: '' }]} defaultOpen />);
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe('Image 1 of 1');
    });

    it('writes the numbers in the LocaleProvider’s locale', () => {
      vi.useFakeTimers();
      render(
        <LocaleProvider locale="ar-EG">
          <Gallery defaultOpen defaultValue={1} />
        </LocaleProvider>
      );
      act(() => vi.advanceTimersByTime(500));
      expect(document.querySelector('.lightbox-progress')).toHaveTextContent(
        '٢ / ٣'
      );
      expect(statusText()).toBe('Image ٢ of ٣: Boats along the quay');
    });

    it('takes every label from labels, with empty ones falling back', () => {
      vi.useFakeTimers();
      render(
        <Gallery
          defaultOpen
          labels={{
            close: 'Fermer',
            previous: 'Précédente',
            next: '',
            zoomIn: 'Agrandir',
            zoomOut: 'Réduire',
            resetZoom: 'Ajuster',
            loading: 'Chargement',
            progress: (current, total) => `Photo ${current} sur ${total}`,
          }}
        />
      );
      act(() => vi.advanceTimersByTime(500));
      for (const name of ['Fermer', 'Précédente', 'Next image', 'Agrandir']) {
        expect(button(name)).toBeInTheDocument();
      }
      expect(button('Réduire')).toBeInTheDocument();
      expect(button('Ajuster')).toBeInTheDocument();
      expect(statusText()).toBe('Photo 1 sur 3: Harbour at dusk');
      act(() => vi.advanceTimersByTime(300));
      expect(
        screen.getByRole('progressbar', { name: 'Chargement' })
      ).toBeInTheDocument();
    });
  });

  describe('presses outside the image', () => {
    /** Whether a mousedown on the element was cancelled. */
    const pressCancelled = (el: Element) => {
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    };

    it('leaves a press on a caption link and on Retry alone', () => {
      render(
        <Lightbox
          items={[
            {
              ...PHOTOS[0],
              caption: <a href="#credits">Credits</a>,
            },
            PHOTOS[1],
          ]}
          defaultOpen
        />
      );
      expect(
        pressCancelled(screen.getByRole('link', { name: 'Credits' }))
      ).toBe(false);
      // The image's own press is the swipe's.
      expect(pressCancelled(shownImage())).toBe(true);

      key('ArrowRight');
      fireEvent.error(shownImage());
      expect(pressCancelled(button('Retry'))).toBe(false);
      // The caption's text is the caption's, not a swipe's.
      key('Home');
      const caption = document.querySelector('figcaption') as Element;
      expect(pressCancelled(caption)).toBe(false);
    });

    it('swipes past a failed image, and down to close, from its message', () => {
      render(<Gallery defaultOpen />);
      fireEvent.error(shownImage());
      const message = () =>
        document.querySelector('.lightbox-error p') as Element;
      const swipe = (from: [number, number], to: [number, number]) => {
        fireEvent.touchStart(message(), {
          touches: [{ clientX: from[0], clientY: from[1] }],
        });
        fireEvent.touchMove(message(), {
          touches: [{ clientX: to[0], clientY: to[1] }],
        });
        fireEvent.touchEnd(message());
      };
      swipe([300, 0], [100, 0]);
      expect(shownImage()).toHaveAttribute('src', '/quay.jpg');

      fireEvent.error(shownImage());
      swipe([100, 100], [110, 260]);
      expect(queryDialog()).toBeNull();
    });

    it('starts no swipe from a touch on Retry', () => {
      render(<Gallery defaultOpen />);
      fireEvent.error(shownImage());
      const retry = button('Retry');
      fireEvent.touchStart(retry, { touches: [{ clientX: 300, clientY: 0 }] });
      fireEvent.touchMove(retry, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(retry);
      expect(button('Retry')).toBeInTheDocument();
    });
  });

  describe('captions', () => {
    it('puts the caption in the figure’s figcaption', () => {
      render(<Gallery defaultOpen />);
      const caption = document.querySelector('figcaption');
      expect(caption).toHaveClass('lightbox-caption');
      expect(caption).toHaveTextContent('Brixham');
      expect(caption?.parentElement?.tagName).toBe('FIGURE');
    });

    it('leaves it out for an image without one', () => {
      render(<Gallery defaultOpen defaultValue={1} />);
      expect(document.querySelector('figcaption')).toBeNull();
    });
  });

  describe('loading', () => {
    it('fades the image in once it loads', () => {
      render(<Gallery defaultOpen />);
      expect(shownImage()).toHaveClass('lightbox-image', 'is-loading');
      fireEvent.load(shownImage());
      expect(shownImage()).not.toHaveClass('is-loading');
    });

    it('takes an image the browser already has as loaded', () => {
      vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(
        true
      );
      vi.spyOn(
        HTMLImageElement.prototype,
        'naturalWidth',
        'get'
      ).mockReturnValue(640);
      render(<Gallery defaultOpen />);
      expect(shownImage()).not.toHaveClass('is-loading');
    });

    it('shows a Loader for an image that takes a while', () => {
      vi.useFakeTimers();
      render(<Gallery defaultOpen />);
      act(() => vi.advanceTimersByTime(299));
      expect(screen.queryByRole('progressbar')).toBeNull();
      act(() => vi.advanceTimersByTime(1));
      expect(
        screen.getByRole('progressbar', { name: 'Loading image' })
      ).toBeInTheDocument();
      fireEvent.load(shownImage());
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('shows the error, the alt and Retry for an image that fails', () => {
      vi.useFakeTimers();
      render(
        <Gallery
          defaultOpen
          labels={{ loadError: 'Pas chargée.', retry: 'Réessayer' }}
        />
      );
      fireEvent.error(shownImage());
      expect(shownImage()).toBeNull();
      const error = document.querySelector('.lightbox-error') as HTMLElement;
      expect(error).toHaveTextContent('Pas chargée.');
      expect(error).toHaveTextContent('Harbour at dusk');
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe('Pas chargée. Image 1 of 3: Harbour at dusk');

      fireEvent.click(button('Réessayer'));
      expect(document.querySelector('.lightbox-error')).toBeNull();
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
      expect(dialog()).toHaveFocus();
    });

    it('leaves out the alt line for a failed image with an empty alt', () => {
      vi.useFakeTimers();
      render(<Lightbox items={[{ src: '/a.jpg', alt: '' }]} defaultOpen />);
      fireEvent.error(shownImage());
      expect(document.querySelectorAll('.lightbox-error p')).toHaveLength(1);
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe("This image didn't load. Image 1 of 1");
    });

    it('says which image failed, so two failures in a row are both announced', () => {
      vi.useFakeTimers();
      render(
        <Lightbox
          items={[PHOTOS[0], { src: '/b.jpg', alt: 'What a view!' }]}
          defaultOpen
        />
      );
      fireEvent.error(shownImage());
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe(
        "This image didn't load. Image 1 of 2: Harbour at dusk"
      );

      key('ArrowRight');
      fireEvent.error(shownImage());
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe(
        "This image didn't load. Image 2 of 2: What a view!"
      );
    });

    it('announces a Retry that fails again', () => {
      vi.useFakeTimers();
      render(<Gallery defaultOpen />);
      fireEvent.error(shownImage());
      act(() => vi.advanceTimersByTime(500));
      const failed = "This image didn't load. Image 1 of 3: Harbour at dusk";
      expect(statusText()).toBe(failed);

      fireEvent.click(button('Retry'));
      expect(statusText()).toBe('');
      fireEvent.error(shownImage());
      act(() => vi.advanceTimersByTime(500));
      expect(statusText()).toBe(failed);
    });

    it('fetches the images either side ahead', () => {
      const preloads = watchPreloads();
      render(<Gallery defaultOpen />);
      expect(preloads()).toEqual({
        src: ['/quay.jpg'],
        srcset: [PHOTOS[1].srcSet],
        sizes: ['100vw'],
      });

      fireEvent.click(button('Next image'));
      expect(preloads().src).toEqual([
        '/quay.jpg',
        '/harbour.jpg',
        '/lighthouse.jpg',
      ]);
    });

    it('fetches round the ends with repeat', () => {
      const preloads = watchPreloads();
      render(<Gallery defaultOpen repeat />);
      expect(preloads().src).toEqual(['/lighthouse.jpg', '/quay.jpg']);
    });

    it('fetches the other image once when two repeat', () => {
      const preloads = watchPreloads();
      render(<Lightbox items={PHOTOS.slice(0, 2)} defaultOpen repeat />);
      expect(preloads().src).toEqual(['/quay.jpg']);
    });
  });

  describe('the crossfade', () => {
    it('keeps the image before over the new one until its fade ends', () => {
      render(<Gallery defaultOpen />);
      fireEvent.load(shownImage());
      fireEvent.click(button('Next image'));

      const leaving = leavingImage() as HTMLImageElement;
      expect(leaving).toHaveAttribute('src', '/harbour.jpg');
      expect(leaving).toHaveAttribute('alt', '');
      expect(leaving).toHaveAttribute('aria-hidden', 'true');
      // Right after the new image, so the stylesheet can start its fade
      // once that one has loaded.
      expect(shownImage().nextElementSibling).toBe(leaving);
      expect(shownImage()).toHaveClass('is-loading');

      fireEvent.load(shownImage());
      expect(shownImage()).not.toHaveClass('is-loading');
      expect(leavingImage()).toBe(leaving);
      // jsdom has no AnimationEvent, so React listens for the prefixed name.
      fireEvent(leaving, new Event('webkitAnimationEnd', { bubbles: true }));
      expect(leavingImage()).toBeNull();
    });

    it('keeps the first image through a quick second move', () => {
      render(<Gallery defaultOpen />);
      fireEvent.load(shownImage());
      fireEvent.click(button('Next image'));
      fireEvent.click(button('Next image'));
      expect(leavingImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('drops it when the new image is slow or fails', () => {
      vi.useFakeTimers();
      render(<Gallery defaultOpen />);
      fireEvent.load(shownImage());
      fireEvent.click(button('Next image'));
      act(() => vi.advanceTimersByTime(300));
      expect(leavingImage()).toBeNull();

      fireEvent.load(shownImage());
      fireEvent.click(button('Next image'));
      expect(leavingImage()).not.toBeNull();
      fireEvent.error(shownImage());
      expect(leavingImage()).toBeNull();
    });

    it('swaps at once under reduced motion', () => {
      reduceMotion();
      render(<Gallery defaultOpen />);
      fireEvent.load(shownImage());
      fireEvent.click(button('Next image'));
      expect(leavingImage()).toBeNull();
    });
  });

  describe('zoom', () => {
    const zoomIn = () => fireEvent.click(button('Zoom in'));
    const zoomOut = () => fireEvent.click(button('Zoom out'));
    const reset = () => fireEvent.click(button('Reset zoom'));

    it('steps by half again up to maxZoom, and back to fitted', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      expect(button('Zoom out')).toHaveAttribute('aria-disabled', 'true');
      expect(button('Reset zoom')).toHaveAttribute('aria-disabled', 'true');
      expect(transformOf(shownImage())).toBe('');

      zoomIn();
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(1.5)');
      expect(dialog()).toHaveClass('is-zoomed');
      expect(button('Zoom out')).not.toHaveAttribute('aria-disabled');

      zoomIn();
      zoomIn();
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(3)');
      expect(button('Zoom in')).toHaveAttribute('aria-disabled', 'true');
      zoomIn();
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(3)');

      zoomOut();
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(2)');
      reset();
      expect(transformOf(shownImage())).toBe('');
      expect(dialog()).not.toHaveClass('is-zoomed');
    });

    it('zooms with the keys, and pans with the arrows while zoomed', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      key('+');
      key('=');
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(2.25)');
      key('-');
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(1.5)');
      key('+');
      key('+');

      key('ArrowLeft');
      expect(transformOf(shownImage())).toBe('translate(50px, 0px) scale(3)');
      key('ArrowUp');
      expect(transformOf(shownImage())).toBe('translate(50px, 50px) scale(3)');
      key('ArrowRight');
      key('ArrowDown');
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(3)');
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
      key('0');
      expect(transformOf(shownImage())).toBe('');
    });

    it('caps at maxZoom, and reads a bad one as 3', () => {
      layOut();
      const { unmount } = renderLoaded(<Gallery defaultOpen maxZoom={2} />);
      zoomIn();
      zoomIn();
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(2)');
      unmount();

      renderLoaded(<Gallery defaultOpen maxZoom={Number.NaN} />);
      zoomIn();
      zoomIn();
      zoomIn();
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(3)');
    });

    it('toggles 2x at the pointer with a double click', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      // 100px right of centre and 50px down: that point stays put.
      fireEvent.doubleClick(shownImage(), { clientX: 600, clientY: 450 });
      expect(transformOf(shownImage())).toBe(
        'translate(-100px, -50px) scale(2)'
      );
      fireEvent.doubleClick(shownImage(), { clientX: 600, clientY: 450 });
      expect(transformOf(shownImage())).toBe('');
    });

    it('zooms with the wheel at the pointer', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      const at = { clientX: 700, clientY: 400 };
      // A big step counts as 100px, so it can't jump.
      const notch = fireEvent.wheel(shownImage(), { deltaY: -300, ...at });
      expect(notch).toBe(false);
      const once = Math.exp(100 / 300);
      // Still narrower than the viewer, so it stays centred.
      expect(transformOf(shownImage())).toBe(
        `translate(0px, 0px) scale(${once})`
      );
      expect(shownImage().style.transition).toBe('none');

      fireEvent.wheel(shownImage(), { deltaY: -100, ...at });
      const twice = once * Math.exp(100 / 300);
      // Wider now: the point under the pointer, 200px right of centre,
      // stays put.
      expect(transformOf(shownImage())).toBe(
        `translate(${200 - 200 * (twice / once)}px, 0px) scale(${twice})`
      );

      // Firefox's lines count as 16px.
      fireEvent.wheel(shownImage(), { deltaY: 3, deltaMode: 1, ...at });
      expect(transformOf(shownImage())).toContain(
        `scale(${twice * Math.exp(-48 / 300)})`
      );
      for (let i = 0; i < 3; i++) {
        fireEvent.wheel(shownImage(), { deltaY: 500, ...at });
      }
      expect(transformOf(shownImage())).toBe('');
    });

    it('pans a zoomed image with a drag, to its edges', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      zoomIn();
      zoomIn();
      zoomIn();
      const image = shownImage();
      pointer(image, 'pointerDown', { clientX: 500, clientY: 400 });
      expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(1);
      pointer(image, 'pointerMove', { clientX: 530, clientY: 380 });
      expect(transformOf(image)).toBe('translate(30px, -20px) scale(3)');
      expect(image.style.transition).toBe('none');
      // 1800 by 1350 in a 1000 by 800 viewer: 400px of room either side
      // across, 275px up and down.
      pointer(image, 'pointerMove', { clientX: 1500, clientY: 1500 });
      expect(transformOf(image)).toBe('translate(400px, 275px) scale(3)');
      pointer(image, 'pointerUp', { clientX: 1500, clientY: 1500 });
      pointer(image, 'pointerMove', { clientX: 0, clientY: 0 });
      expect(transformOf(image)).toBe('translate(400px, 275px) scale(3)');
    });

    it('doesn’t swipe while zoomed', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      zoomIn();
      const image = shownImage();
      fireEvent.touchStart(image, { touches: [{ clientX: 300, clientY: 0 }] });
      fireEvent.touchMove(image, { touches: [{ clientX: 100, clientY: 300 }] });
      fireEvent.touchEnd(image);
      expect(dialog()).toBeInTheDocument();
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('pinches, and carries on panning with the finger left down', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      const image = shownImage();
      const background = document.querySelector('.modal-background') as Element;
      pointer(image, 'pointerDown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 450,
        clientY: 400,
      });
      pointer(background, 'pointerDown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 550,
        clientY: 400,
      });
      const move = (id: number, clientX: number, clientY = 400) =>
        pointer(id === 1 ? image : background, 'pointerMove', {
          pointerId: id,
          clientX,
          clientY,
        });
      // Twice as far apart, the middle 50px right: that much pan.
      move(2, 650);
      expect(transformOf(image)).toBe('translate(50px, 0px) scale(2)');
      move(1, 350);
      expect(transformOf(image)).toBe('translate(0px, 0px) scale(3)');
      move(1, 400);
      move(2, 700);
      expect(transformOf(image)).toBe('translate(50px, 0px) scale(3)');

      pointer(background, 'pointerUp', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 700,
        clientY: 400,
      });
      move(1, 370, 380);
      expect(transformOf(image)).toBe('translate(20px, -20px) scale(3)');
      pointer(image, 'pointerCancel', { pointerId: 1, pointerType: 'touch' });
    });

    it('snaps back to fitted from a pinch that ends near it', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      const image = shownImage();
      pointer(image, 'pointerDown', {
        pointerId: 1,
        clientX: 450,
        clientY: 400,
      });
      pointer(image, 'pointerDown', {
        pointerId: 2,
        clientX: 550,
        clientY: 400,
      });
      pointer(image, 'pointerMove', {
        pointerId: 2,
        clientX: 550.5,
        clientY: 400,
      });
      expect(transformOf(image)).toContain('scale(1.00');
      pointer(image, 'pointerUp', { pointerId: 1 });
      expect(transformOf(image)).toBe('');
      expect(image.style.transition).toBe('');
    });

    it('pinches from two fingers that land together', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      const image = shownImage();
      pointer(image, 'pointerDown', {
        pointerId: 1,
        clientX: 500,
        clientY: 400,
      });
      pointer(image, 'pointerDown', {
        pointerId: 2,
        clientX: 500,
        clientY: 400,
      });
      pointer(image, 'pointerMove', {
        pointerId: 2,
        clientX: 503,
        clientY: 400,
      });
      expect(transformOf(image)).toContain('scale(3)');
    });

    it('ignores a pointer that starts off the image, or that a handler used', () => {
      layOut();
      const onPointerDown = vi.fn((e: React.PointerEvent) => {
        if (e.pointerId === 9) e.preventDefault();
      });
      const onPointerMove = vi.fn();
      const onPointerUp = vi.fn();
      const onPointerCancel = vi.fn();
      renderLoaded(
        <Gallery
          defaultOpen
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      );
      fireEvent.click(button('Zoom in'));
      const background = document.querySelector('.modal-background') as Element;
      pointer(background, 'pointerDown', { clientX: 500, clientY: 400 });
      pointer(background, 'pointerMove', { clientX: 600, clientY: 400 });
      pointer(background, 'pointerUp');
      pointer(shownImage(), 'pointerDown', { pointerId: 9, clientX: 500 });
      pointer(shownImage(), 'pointerMove', { pointerId: 9, clientX: 600 });
      pointer(shownImage(), 'pointerCancel', { pointerId: 9 });
      expect(transformOf(shownImage())).toBe('translate(0px, 0px) scale(1.5)');
      expect(onPointerDown).toHaveBeenCalledTimes(2);
      expect(onPointerMove).toHaveBeenCalledTimes(2);
      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(onPointerCancel).toHaveBeenCalledTimes(1);
    });

    it('toggles with a double tap, and not with two slow or distant taps', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      const image = shownImage();
      const tap = (clientX: number, timeStamp: number) => {
        const at = { pointerType: 'touch', clientX, clientY: 400, timeStamp };
        pointer(image, 'pointerDown', at);
        pointer(image, 'pointerUp', at);
      };
      tap(500, 1000);
      tap(500, 1400);
      expect(transformOf(image)).toBe('');
      tap(600, 1500);
      expect(transformOf(image)).toBe('');
      tap(600, 1700);
      expect(transformOf(image)).toBe('translate(-100px, 0px) scale(2)');
      // The double click a browser can fire after it changes nothing.
      fireEvent.doubleClick(image, { clientX: 600, clientY: 400 });
      expect(transformOf(image)).toBe('translate(-100px, 0px) scale(2)');
    });

    it('takes a finger that moves as no tap', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      const image = shownImage();
      const tap = (to: number) => {
        pointer(image, 'pointerDown', { pointerType: 'touch', clientX: 500 });
        pointer(image, 'pointerMove', { pointerType: 'touch', clientX: to });
        pointer(image, 'pointerUp', { pointerType: 'touch', clientX: to });
      };
      tap(505);
      tap(530);
      expect(transformOf(image)).toBe('');
    });

    it('resets when the image changes', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen />);
      fireEvent.click(button('Zoom in'));
      key('End');
      expect(transformOf(shownImage())).toBe('');
      expect(dialog()).not.toHaveClass('is-zoomed');
    });

    it('does nothing for a failed image', () => {
      render(<Gallery defaultOpen />);
      fireEvent.error(shownImage());
      expect(button('Zoom in')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(button('Zoom in'));
      key('+');
      expect(dialog()).not.toHaveClass('is-zoomed');
    });

    it.each([
      ['a loading image', {}],
      ['zoomable off', { zoomable: false }],
    ])('takes a pinch on %s as no swipe', (_, props) => {
      render(<Gallery defaultOpen {...props} />);
      if ('zoomable' in props) fireEvent.load(shownImage());
      const image = shownImage();
      const background = document.querySelector('.modal-background') as Element;
      fireEvent.touchStart(image, { touches: [{ clientX: 300, clientY: 0 }] });
      // The second finger lands off the image, where only the dialog hears it.
      pointer(background, 'pointerDown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 600,
      });
      fireEvent.touchMove(image, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(image);
      expect(shownImage()).toHaveAttribute('src', '/harbour.jpg');
    });

    it('waits for the image to load before anything zooms', () => {
      layOut();
      render(<Gallery defaultOpen />);
      const image = shownImage();
      expect(button('Zoom in')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(button('Zoom in'));
      key('+');
      expect(fireEvent.wheel(image, { deltaY: -100 })).toBe(true);
      fireEvent.doubleClick(image, { clientX: 600, clientY: 450 });
      pointer(image, 'pointerDown', { pointerId: 1, clientX: 450 });
      pointer(image, 'pointerDown', { pointerId: 2, clientX: 550 });
      pointer(image, 'pointerMove', { pointerId: 2, clientX: 750 });
      expect(dialog()).not.toHaveClass('is-zoomed');

      fireEvent.load(image);
      expect(button('Zoom in')).not.toHaveAttribute('aria-disabled');
    });

    it('leaves all of it out with zoomable off', () => {
      layOut();
      renderLoaded(<Gallery defaultOpen zoomable={false} />);
      expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
      const image = shownImage();
      expect(fireEvent.wheel(image, { deltaY: -100 })).toBe(true);
      fireEvent.doubleClick(image, { clientX: 500, clientY: 400 });
      pointer(image, 'pointerDown', { clientX: 500, clientY: 400 });
      pointer(image, 'pointerDown', { pointerId: 2, clientX: 600 });
      pointer(image, 'pointerMove', { pointerId: 2, clientX: 900 });
      key('+');
      key('0');
      expect(transformOf(image)).toBe('');
      expect(fireEvent.keyDown(dialog(), { key: '+' })).toBe(true);
    });
  });

  describe('triggers', () => {
    it('warns about a trigger outside a Lightbox, which opens nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<LightboxTrigger index={0}>View</LightboxTrigger>);
      fireEvent.click(button('View'));
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('outside a <Lightbox>')
      );
    });

    it('skips the name check in production', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        render(
          <Lightbox items={PHOTOS}>
            <Lightbox.Trigger index={0}>
              <img src="/a.jpg" alt="" />
            </Lightbox.Trigger>
          </Lightbox>
        );
      } finally {
        process.env.NODE_ENV = previous;
      }
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns about a trigger with no name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0}>
            <img src="/a.jpg" alt="" />
            <span aria-hidden="true">Photo</span>
          </Lightbox.Trigger>
        </Lightbox>
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('no accessible name')
      );
    });

    it('takes an image inside a figure as no name, as browsers do', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { unmount } = render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0}>
            <Image src="/a.jpg" alt="Harbour" size="4by3" />
          </Lightbox.Trigger>
        </Lightbox>
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('as="div"'));
      unmount();

      resetDevWarnings();
      warn.mockClear();
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0}>
            <Image as="div" src="/a.jpg" alt="Harbour" size="4by3" />
          </Lightbox.Trigger>
        </Lightbox>
      );
      expect(warn).not.toHaveBeenCalled();
      expect(button('Harbour')).toBeInTheDocument();
    });

    const NAMES: [string, React.ReactNode, Record<string, string>][] = [
      ['text', 'View all photos', {}],
      ['an image’s alt', <img key="a" src="/a.jpg" alt="Harbour" />, {}],
      ['a label inside', <span key="a" aria-label="Harbour" />, {}],
      [
        'its own label',
        <img key="a" src="/a.jpg" alt="" />,
        { 'aria-label': 'Harbour' },
      ],
      ['labelledby', null, { 'aria-labelledby': 'elsewhere' }],
      ['a title', null, { title: 'Harbour' }],
    ];
    it.each(NAMES)('takes %s as a name', (_, content, attributes) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0} {...attributes}>
            {content}
            <svg />
          </Lightbox.Trigger>
        </Lightbox>
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('focuses itself when clicked, as Safari doesn’t', () => {
      render(<Gallery />);
      const first = trigger('Harbour at dusk');
      const focus = vi.spyOn(first, 'focus');
      open();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('keeps a submit or reset type, and makes any other a button', () => {
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0} type="submit">
            A
          </Lightbox.Trigger>
          <Lightbox.Trigger
            index={1}
            type={
              'text/html' as React.ButtonHTMLAttributes<HTMLButtonElement>['type']
            }
          >
            B
          </Lightbox.Trigger>
        </Lightbox>
      );
      expect(button('A')).toHaveAttribute('type', 'submit');
      expect(button('B')).toHaveAttribute('type', 'button');
    });

    it('takes helper props, a class and a ref', () => {
      const ref = createRef<HTMLButtonElement>();
      const callback = vi.fn();
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={0} ref={ref} mt="2" className="mine">
            A
          </Lightbox.Trigger>
          <Lightbox.Trigger index={1} ref={callback}>
            B
          </Lightbox.Trigger>
        </Lightbox>
      );
      expect(button('A')).toHaveClass('lightbox-trigger', 'mt-2', 'mine');
      expect(ref.current).toBe(button('A'));
      expect(callback).toHaveBeenCalledWith(button('B'));
    });
  });

  it('warns once about an item with no alt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Lightbox items={[{ src: '/a.jpg' } as LightboxItem]}>
        <span />
      </Lightbox>
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no alt'));
  });

  describe('server rendering', () => {
    it('renders an open viewer in place and hydrates without a mismatch', async () => {
      const ui = <Gallery defaultOpen />;
      const html = renderToString(ui);
      // Visible without script: nothing waits for a load event there.
      expect(html).not.toContain('is-loading');

      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      expect(
        container.querySelector('.modal.lightbox.is-active')
      ).not.toBeNull();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, ui);
        });
        expect(errorSpy).not.toHaveBeenCalled();
        // Moved into the portal once hydrated.
        expect(container.contains(dialog())).toBe(false);
      } finally {
        errorSpy.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });

  it('prefixes every class under ConfigProvider classPrefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Gallery defaultOpen defaultValue={1} />
      </ConfigProvider>
    );
    expect(trigger('Harbour at dusk')).toHaveClass('bestax-lightbox-trigger');
    expect(dialog()).toHaveClass(
      'bestax-modal',
      'bestax-lightbox',
      'bestax-is-active'
    );
    expect(dialog()).not.toHaveClass('lightbox');
    for (const part of [
      'modal-background',
      'modal-close',
      'lightbox-toolbar',
      'lightbox-progress',
      'buttons',
      'modal-content',
      'lightbox-figure',
      'lightbox-image',
      'lightbox-arrow',
    ]) {
      expect(document.querySelector(`.bestax-${part}`)).not.toBeNull();
      expect(document.querySelector(`.${part}`)).toBeNull();
    }
    expect(shownImage()).toBeNull();
    expect(document.querySelector('.bestax-lightbox-image')).toHaveClass(
      'bestax-is-loading'
    );
  });

  describe('Compound components', () => {
    it('attaches Trigger to Lightbox', () => {
      expect(Lightbox.Trigger).toBe(LightboxTrigger);
    });

    it('renders through the dot path', () => {
      render(
        <Lightbox items={PHOTOS}>
          <Lightbox.Trigger index={2}>View</Lightbox.Trigger>
        </Lightbox>
      );
      fireEvent.click(button('View'));
      expect(shownImage()).toHaveAttribute('src', '/lighthouse.jpg');
    });
  });
});
