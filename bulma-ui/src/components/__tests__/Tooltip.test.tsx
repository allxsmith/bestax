import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '../Tooltip';
import { Popover } from '../Popover';
import { Modal } from '../Modal';
import { HoverCard } from '../HoverCard';
import { ConfigProvider } from '../../helpers/Config';

type PointerType = 'mouse' | 'pen' | 'touch';

/**
 * jsdom has no PointerEvent, so build a MouseEvent and give it a
 * `pointerType`; React reads both off the native event. React makes
 * `onPointerEnter` and `onPointerLeave` out of `pointerover` and `pointerout`,
 * walking from the element the pointer left to the one it entered.
 */
const pointer = (
  el: Element,
  type: 'pointerover' | 'pointerout' | 'pointerdown',
  {
    pointerType = 'mouse',
    relatedTarget = null,
  }: { pointerType?: PointerType; relatedTarget?: EventTarget | null } = {}
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    relatedTarget,
  });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(el, event);
};

/** The pointer arrives on `el` from outside the page's React tree. */
const hover = (el: Element, pointerType?: PointerType) =>
  pointer(el, 'pointerover', { pointerType });
/** The pointer leaves `el`, onto `to` (the page itself unless given). */
const unhover = (el: Element, to: Element = document.body) =>
  pointer(el, 'pointerout', { relatedTarget: to });
/**
 * Focus as a key brings it. Tooltip asks the browser, through
 * `:focus-visible`, and jsdom matches that on any focus, which is what a
 * browser does after a key, so plain `focus()` is keyboard focus here.
 */
const keyboardFocus = (el: HTMLElement) => el.focus();
/**
 * A press and the focus it brings. A browser doesn't show that focus as
 * `:focus-visible` and jsdom does, so the element says it isn't until the
 * focus handlers have run.
 */
const pressFocus = (el: HTMLElement, pointerType: PointerType = 'mouse') => {
  pointer(el, 'pointerdown', { pointerType });
  const matches = el.matches.bind(el);
  const spy = jest
    .spyOn(el, 'matches')
    .mockImplementation(selector =>
      selector === ':focus-visible' ? false : matches(selector)
    );
  try {
    el.focus();
  } finally {
    spy.mockRestore();
  }
};

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

const wrapper = (root: ParentNode = document) =>
  root.querySelector('.tooltip') as HTMLElement;
const bubble = () => screen.getByRole('tooltip', { hidden: true });
const trigger = () => screen.getByRole('button', { name: 'Hover me' });

describe('Tooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // The tooltip is still mounted here, so what the timers set goes in act.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the tooltip wrapper', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('renders tooltip content with label', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
        'Test tooltip'
      );
    });

    it('has data-tooltip attribute with label', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveAttribute(
        'data-tooltip',
        'Test tooltip'
      );
    });
  });

  describe('visibility', () => {
    it('is hidden by default', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-active');
    });

    it('becomes visible on pointer enter', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      hover(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('hides on pointer leave', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      hover(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      unhover(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('becomes visible on keyboard focus', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      keyboardFocus(trigger());
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('hides on blur', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      keyboardFocus(trigger());
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      trigger().blur();
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });
  });

  describe('always active', () => {
    it('is always visible when active prop is true', () => {
      const { container } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('stays visible on pointer leave when active', () => {
      const { container } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      hover(tooltip);
      unhover(tooltip);
      act(() => {
        jest.runAllTimers();
      });

      expect(tooltip).toHaveClass('is-active');
    });

    it('stays shown on Escape, and lets the key through to a Modal around it', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          <Tooltip label="Test tooltip" active>
            <button>Hover me</button>
          </Tooltip>
        </Modal>
      );
      hover(trigger());
      keyboardFocus(trigger());
      advance(1000);
      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(wrapper()).toHaveClass('is-active');
      expect(bubble()).toHaveAttribute('aria-hidden', 'false');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('leaves no Escape listener behind once it turns down the ask to open', () => {
      const add = jest.spyOn(document, 'addEventListener');
      const remove = jest.spyOn(document, 'removeEventListener');
      const liveKeydown = () =>
        add.mock.calls.filter(
          ([type, , capture]) => type === 'keydown' && capture
        ).length -
        remove.mock.calls.filter(
          ([type, , capture]) => type === 'keydown' && capture
        ).length;
      try {
        render(
          <Tooltip label="Test tooltip" active>
            <button>Hover me</button>
          </Tooltip>
        );
        hover(trigger());
        // The delay runs out and the hook asks to open, which `active`
        // turns down. That ask lapses on a timer the fake clock runs a
        // millisecond later, since it is set while another timer runs.
        advance(0);
        advance(1);
        expect(wrapper()).toHaveClass('is-active');
        expect(liveKeydown()).toBe(0);
      } finally {
        add.mockRestore();
        remove.mockRestore();
      }
    });

    it('hides once active is dropped, and shows on the next hover', () => {
      const { rerender } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      rerender(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(wrapper()).not.toHaveClass('is-active');
      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
    });
  });

  describe('positions', () => {
    it.each(['top', 'bottom', 'left', 'right'] as const)(
      'applies is-%s class when position="%s"',
      position => {
        const { container } = render(
          <Tooltip label="Test" position={position}>
            <button>Hover me</button>
          </Tooltip>
        );
        expect(container.querySelector('.tooltip')).toHaveClass(
          `is-${position}`
        );
      }
    );

    it('defaults to top position', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-top');
    });
  });

  describe('colors', () => {
    it.each([
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
      'dark',
      'light',
    ] as const)('applies is-%s class when color="%s"', color => {
      const { container } = render(
        <Tooltip label="Test" color={color}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass(`is-${color}`);
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class when size="%s"',
      size => {
        const { container } = render(
          <Tooltip label="Test" size={size}>
            <button>Hover me</button>
          </Tooltip>
        );
        expect(container.querySelector('.tooltip')).toHaveClass(`is-${size}`);
      }
    );

    it('does not apply size class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).not.toHaveClass('is-small');
      expect(tooltip).not.toHaveClass('is-medium');
      expect(tooltip).not.toHaveClass('is-large');
    });
  });

  describe('multiline', () => {
    it('applies is-multiline class when multiline is true', () => {
      const { container } = render(
        <Tooltip label="Long tooltip text" multiline>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-multiline');
    });

    it('does not apply is-multiline class when multiline is false', () => {
      const { container } = render(
        <Tooltip label="Test" multiline={false}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass(
        'is-multiline'
      );
    });
  });

  describe('animated', () => {
    it('applies is-animated class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-animated');
    });

    it('does not apply is-animated class when animated is false', () => {
      const { container } = render(
        <Tooltip label="Test" animated={false}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass(
        'is-animated'
      );
    });
  });

  describe('square', () => {
    it('applies is-square class when square is true', () => {
      const { container } = render(
        <Tooltip label="Test" square>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-square');
    });

    it('does not apply is-square class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-square');
    });
  });

  describe('dashed', () => {
    it('applies is-dashed class when dashed is true', () => {
      const { container } = render(
        <Tooltip label="Test" dashed>
          <span>Hover me</span>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-dashed');
    });

    it('does not apply is-dashed class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <span>Hover me</span>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-dashed');
    });
  });

  describe('delay', () => {
    it('shows tooltip immediately when delay is 0', () => {
      const { container } = render(
        <Tooltip label="Test" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      hover(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('delays showing tooltip when delay is set', () => {
      const { container } = render(
        <Tooltip label="Test" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      hover(container.querySelector('.tooltip')!);

      // Not visible yet
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-active');

      // After delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('cancels delay when the pointer leaves before timeout', () => {
      const { container } = render(
        <Tooltip label="Test" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      hover(tooltip);

      // Not visible yet
      expect(tooltip).not.toHaveClass('is-active');

      // Leave before delay completes
      act(() => {
        jest.advanceTimersByTime(250);
      });
      unhover(tooltip);

      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should still not be visible
      expect(tooltip).not.toHaveClass('is-active');
    });
  });

  describe('closeDelay', () => {
    it('hides tooltip immediately when closeDelay is 0', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      hover(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      unhover(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('delays hiding tooltip when closeDelay is set', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      hover(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      unhover(tooltip);

      // Still visible immediately after leave
      expect(tooltip).toHaveClass('is-active');

      // Still visible before closeDelay elapses
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(tooltip).toHaveClass('is-active');

      // Hidden after closeDelay elapses
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('cancels close delay when the pointer re-enters before timeout', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      hover(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      // Leave, then re-enter before closeDelay elapses
      unhover(tooltip);
      act(() => {
        jest.advanceTimersByTime(250);
      });
      hover(tooltip);
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should still be visible
      expect(tooltip).toHaveClass('is-active');
    });
  });

  describe('keyboard focus', () => {
    it('shows after delay on keyboard focus, and hides once focus leaves', () => {
      render(
        <>
          <Tooltip label="Test tooltip" delay={200}>
            <button>Hover me</button>
          </Tooltip>
          <button>Next</button>
        </>
      );
      keyboardFocus(trigger());
      advance(199);
      expect(wrapper()).not.toHaveClass('is-active');
      advance(1);
      expect(wrapper()).toHaveClass('is-active');

      keyboardFocus(screen.getByRole('button', { name: 'Next' }));
      advance(0);
      expect(wrapper()).not.toHaveClass('is-active');
    });

    it('stays while keyboard focus holds it, whatever the pointer does', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      keyboardFocus(trigger());
      advance(0);
      hover(trigger());
      unhover(trigger());
      advance(5000);
      expect(wrapper()).toHaveClass('is-active');
    });

    it('is not held by the focus a click brings, so it goes with the pointer', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      pressFocus(trigger());
      unhover(trigger());
      advance(0);
      expect(wrapper()).not.toHaveClass('is-active');
      expect(trigger()).toHaveFocus();
    });
  });

  describe('hoverable', () => {
    it('stays while the pointer moves from the trigger onto the tooltip, with no closeDelay', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      unhover(trigger(), bubble());
      advance(5000);
      expect(wrapper()).toHaveClass('is-active');

      unhover(bubble());
      advance(0);
      expect(wrapper()).not.toHaveClass('is-active');
    });

    it('has no timer that hides a tooltip the pointer is on', () => {
      render(
        <Tooltip label="Test tooltip" closeDelay={300}>
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      unhover(trigger(), bubble());
      advance(60_000);
      expect(wrapper()).toHaveClass('is-active');
    });

    it('shows for a pen hovering', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger(), 'pen');
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
    });
  });

  describe('portaled into a shadow root from page content', () => {
    /**
     * A page that portals its preview into a shadow root, as the docs site's
     * live examples do. Moving from the page onto something in the shadow
     * root, the browser's pointerout names only the shadow host, so React
     * sends no enter, and it skips the pointerover since the page is its own.
     */
    const Page = ({ children }: { children: ReactNode }) => {
      const [root, setRoot] = useState<ShadowRoot | null>(null);
      return (
        <>
          <p>Page text</p>
          <div
            ref={el => {
              if (el && !el.shadowRoot) {
                setRoot(el.attachShadow({ mode: 'open' }));
              }
            }}
          >
            {root && createPortal(children, root)}
          </div>
        </>
      );
    };
    const page = () => screen.getByText('Page text');
    const shadow = () => page().nextElementSibling!.shadowRoot!;
    const shadowWrapper = () => wrapper(shadow());
    /** The browser's events for the pointer moving from `from` onto `to`. */
    const move = (
      from: Element,
      to: Element,
      pointerType: PointerType = 'mouse'
    ) => {
      pointer(from, 'pointerout', { pointerType, relatedTarget: to });
      pointer(to, 'pointerover', { pointerType, relatedTarget: from });
    };

    it('shows after its delay when the pointer comes from the page, and hides once it goes back', () => {
      render(
        <Page>
          <Tooltip label="Test tooltip" delay={200}>
            <button>Hover me</button>
          </Tooltip>
        </Page>
      );
      const button = shadow().querySelector('button')!;
      move(page(), button);
      advance(199);
      expect(shadowWrapper()).not.toHaveClass('is-active');
      advance(1);
      expect(shadowWrapper()).toHaveClass('is-active');

      move(button, page());
      advance(0);
      expect(shadowWrapper()).not.toHaveClass('is-active');
    });

    it('is not shown by a touch pointer coming from the page', () => {
      render(
        <Page>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </Page>
      );
      move(page(), shadow().querySelector('button')!, 'touch');
      advance(5000);
      expect(shadowWrapper()).not.toHaveClass('is-active');
    });
  });

  describe('after Escape, with the pointer still on the trigger', () => {
    it('stays hidden while the pointer moves between the trigger’s own children, until it leaves and comes back', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>
            <span>Save</span> <span>draft</span>
          </button>
        </Tooltip>
      );
      const [first, last] = Array.from(wrapper().querySelectorAll('span'));
      hover(first);
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(wrapper()).not.toHaveClass('is-active');

      pointer(first, 'pointerout', { relatedTarget: last });
      pointer(last, 'pointerover', { relatedTarget: first });
      advance(5000);
      expect(wrapper()).not.toHaveClass('is-active');

      unhover(last);
      hover(last);
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
    });
  });

  describe('touch', () => {
    it('is not shown by a touch pointer, or by the focus a tap brings', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger(), 'touch');
      pressFocus(trigger(), 'touch');
      fireEvent.click(trigger());
      advance(5000);
      expect(wrapper()).not.toHaveClass('is-active');
    });

    it('stays under the mouse when a touch pointer crosses the trigger', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      hover(trigger(), 'touch');
      pointer(trigger(), 'pointerout', {
        pointerType: 'touch',
        relatedTarget: document.body,
      });
      advance(5000);
      expect(wrapper()).toHaveClass('is-active');
    });
  });

  describe('Escape', () => {
    it('hides it with keyboard focus on the trigger, leaving focus there, until focus leaves and comes back', () => {
      render(
        <>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
          <button>Next</button>
        </>
      );
      keyboardFocus(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');

      expect(fireEvent.keyDown(trigger(), { key: 'Escape' })).toBe(false);
      expect(wrapper()).not.toHaveClass('is-active');
      expect(bubble()).toHaveAttribute('aria-hidden', 'true');
      expect(trigger()).toHaveFocus();
      advance(5000);
      expect(wrapper()).not.toHaveClass('is-active');

      keyboardFocus(screen.getByRole('button', { name: 'Next' }));
      keyboardFocus(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
    });

    it('hides it while the trigger is hovered and focus is in a field elsewhere, and the key goes on to that field', () => {
      const onKeyDown = jest.fn();
      render(
        <>
          <input aria-label="Search" onKeyDown={onKeyDown} />
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </>
      );
      const search = screen.getByRole('textbox', { name: 'Search' });
      search.focus();
      hover(trigger());
      advance(0);
      expect(fireEvent.keyDown(search, { key: 'Escape' })).toBe(true);
      expect(wrapper()).not.toHaveClass('is-active');
      expect(search).toHaveFocus();
      expect(onKeyDown).toHaveBeenCalledTimes(1);

      // The pointer moving about inside the wrapper brings nothing back.
      pointer(trigger(), 'pointerout', { relatedTarget: wrapper() });
      advance(5000);
      expect(wrapper()).not.toHaveClass('is-active');

      unhover(wrapper());
      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
    });

    it('hides it while the pointer is on the tooltip and focus is on nothing, taking the key, and the next hover of the trigger shows it', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      unhover(trigger(), bubble());
      expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(false);
      expect(wrapper()).not.toHaveClass('is-active');
      advance(5000);
      expect(wrapper()).not.toHaveClass('is-active');

      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
    });

    it('lets the key through while no tooltip is showing', () => {
      const outer = jest.fn();
      document.addEventListener('keydown', outer);
      try {
        render(
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        );
        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(outer).toHaveBeenCalledTimes(1);

        hover(trigger());
        advance(0);
        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(outer).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(outer).toHaveBeenCalledTimes(2);
      } finally {
        document.removeEventListener('keydown', outer);
      }
    });

    it('cancels a delayed show that has not happened yet, and lets the key through', () => {
      render(
        <Tooltip label="Test tooltip" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(200);
      expect(fireEvent.keyDown(trigger(), { key: 'Escape' })).toBe(true);
      advance(5000);
      expect(wrapper()).not.toHaveClass('is-active');
    });

    it('ignores other keys while shown', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      fireEvent.keyDown(trigger(), { key: 'a' });
      expect(wrapper()).toHaveClass('is-active');
    });

    it('hides only the tooltip inside an open Modal while focus is on its trigger', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </Modal>
      );
      keyboardFocus(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(wrapper()).not.toHaveClass('is-active');
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides a hovered tooltip in an open Modal and lets the Modal have the key when focus is elsewhere in it', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          <button>Save</button>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </Modal>
      );
      const save = screen.getByRole('button', { name: 'Save' });
      keyboardFocus(save);
      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      fireEvent.keyDown(save, { key: 'Escape' });
      expect(wrapper()).not.toHaveClass('is-active');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides only the tooltip inside an open Popover while focus is on its trigger', () => {
      render(
        <Popover trigger={<button>Team</button>} ariaLabel="Team" defaultOpen>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </Popover>
      );
      keyboardFocus(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(wrapper()).not.toHaveClass('is-active');
      expect(screen.getByRole('dialog', { name: 'Team' })).toBeInTheDocument();

      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Team' })).toBeNull();
    });

    it('hides a hovered tooltip in an open Popover and lets the Popover have the key when focus is elsewhere in it', () => {
      render(
        <Popover trigger={<button>Team</button>} ariaLabel="Team" defaultOpen>
          <button>Invite</button>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </Popover>
      );
      const invite = screen.getByRole('button', { name: 'Invite' });
      keyboardFocus(invite);
      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      fireEvent.keyDown(invite, { key: 'Escape' });
      // The Popover closes, and the tooltip goes with its panel.
      expect(screen.queryByRole('dialog', { name: 'Team' })).toBeNull();
      expect(wrapper()).toBeNull();
    });

    it('hides a tooltip inside an open HoverCard before the card', () => {
      render(
        <HoverCard trigger={<a href="#ada">Ada Lovelace</a>} defaultOpen>
          <Tooltip label="Test tooltip">
            <button>Hover me</button>
          </Tooltip>
        </HoverCard>
      );
      const card = () => document.querySelector('.hover-card-content');
      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(wrapper()).not.toHaveClass('is-active');
      expect(card()).toBeInTheDocument();

      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(card()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('tooltip content has role="tooltip"', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
    });

    it('tooltip content has aria-hidden="true" when not visible', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('tooltip content has aria-hidden="false" when visible', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      hover(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });

    it('tooltip content has aria-hidden="false" when always active', () => {
      render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Tooltip label="Test" className="custom-class">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('custom-class');
    });

    it('applies tooltipClassName to content', () => {
      render(
        <Tooltip label="Test" tooltipClassName="custom-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass(
        'custom-tooltip'
      );
    });

    it('combines multiple classes correctly', () => {
      const { container } = render(
        <Tooltip
          label="Test"
          position="bottom"
          color="primary"
          multiline
          className="custom-class"
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveClass(
        'tooltip',
        'is-bottom',
        'is-primary',
        'is-multiline',
        'custom-class'
      );
    });
  });

  describe('class prefix', () => {
    it('prefixes every class under ConfigProvider classPrefix, shown or hidden', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Tooltip
            label="Test"
            color="info"
            size="small"
            multiline
            square
            dashed
            m="1"
          >
            <button>Hover me</button>
          </Tooltip>
        </ConfigProvider>
      );
      const root = container.firstChild as HTMLElement;
      const classes = () =>
        [...root.classList, ...bubble().classList].filter(
          name => !name.startsWith('bestax-')
        );
      expect(root).toHaveClass(
        'bestax-tooltip',
        'bestax-is-top',
        'bestax-is-info',
        'bestax-is-small',
        'bestax-is-multiline',
        'bestax-is-animated',
        'bestax-is-square',
        'bestax-is-dashed',
        'bestax-m-1'
      );
      expect(bubble()).toHaveClass('bestax-tooltip-content');
      expect(classes()).toEqual([]);

      hover(trigger());
      advance(0);
      expect(root).toHaveClass('bestax-is-active');
      expect(classes()).toEqual([]);

      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(root).not.toHaveClass('bestax-is-active');
      expect(container.querySelector('.tooltip')).toBeNull();
    });
  });

  describe('own handlers', () => {
    it("runs the wrapper's own pointer and focus handlers as well", () => {
      const calls: string[] = [];
      render(
        <Tooltip
          label="Test"
          onPointerEnter={() => calls.push('enter')}
          onPointerLeave={() => calls.push('leave')}
          onFocus={() => calls.push('focus')}
          onBlur={() => calls.push('blur')}
        >
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      unhover(trigger());
      keyboardFocus(trigger());
      advance(0);
      expect(wrapper()).toHaveClass('is-active');
      trigger().blur();
      expect(calls).toEqual(['enter', 'leave', 'focus', 'blur']);
    });
  });

  describe('lifecycle', () => {
    it('shows nothing and holds no Escape after it unmounts', () => {
      const outer = jest.fn();
      document.addEventListener('keydown', outer);
      try {
        const { unmount } = render(
          <Tooltip label="Test" delay={500}>
            <button>Hover me</button>
          </Tooltip>
        );
        hover(trigger());
        unmount();
        advance(5000);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(outer).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', outer);
      }
    });
  });

  describe('hydration', () => {
    const hydrate = async (ui: ReactElement) => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const serverHtml = container.innerHTML;
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      return {
        container,
        serverHtml,
        errorSpy,
        cleanup: async () => {
          await act(async () => root!.unmount());
          container.remove();
          errorSpy.mockRestore();
        },
      };
    };

    it('hydrates a hidden tooltip without a mismatch, and shows it on hover', async () => {
      const { container, serverHtml, errorSpy, cleanup } = await hydrate(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      try {
        expect(serverHtml).toContain('aria-hidden="true"');
        expect(errorSpy).not.toHaveBeenCalled();
        hover(trigger());
        advance(0);
        expect(wrapper(container)).toHaveClass('is-active');
      } finally {
        await cleanup();
      }
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(
        <Tooltip label="Test" m="2" p="3">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveClass('m-2', 'p-3');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      const { container } = render(
        <Tooltip label="Test" data-testid="tooltip" id="my-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveAttribute('data-testid', 'tooltip');
      expect(tooltip).toHaveAttribute('id', 'my-tooltip');
    });
  });

  describe('auto position resolution', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;

    const setViewport = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        value: width,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: height,
        writable: true,
        configurable: true,
      });
    };

    const mockRects = (
      wrapperRect: Partial<DOMRect>,
      contentRect: Partial<DOMRect> = {}
    ) => {
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const isContent = this.classList.contains('tooltip-content');
        const rect = isContent ? contentRect : wrapperRect;
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
          ...rect,
        } as DOMRect;
      };
    };

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        writable: true,
        configurable: true,
      });
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('resolves auto position to top when there is space above', () => {
      setViewport(1024, 768);
      mockRects({ top: 100, bottom: 120, left: 500, right: 540 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-top');
    });

    it('resolves auto position to bottom when top space is too small but bottom is sufficient', () => {
      setViewport(1024, 768);
      // top space = 10 (< 40 margin), bottom space = 768 - 30 = 738 (>= 40)
      mockRects({ top: 10, bottom: 30, left: 500, right: 540 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-bottom');
    });

    it('resolves auto position to right when both vertical spaces are insufficient and right has more room', () => {
      setViewport(1024, 100);
      // top = 10 (<40), bottom = 100 - 90 = 10 (<40)
      // wrapper at left: 50, right: 90 — right space = 1024 - 90 = 934, left space = 50
      mockRects({ top: 10, bottom: 90, left: 50, right: 90 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-right');
    });

    it('resolves auto position to left when both vertical spaces are insufficient and left has more room', () => {
      setViewport(1024, 100);
      // top = 10 (<40), bottom = 100 - 90 = 10 (<40)
      // wrapper at left: 900, right: 1000 — right space = 24, left space = 900
      mockRects({ top: 10, bottom: 90, left: 900, right: 1000 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-left');
    });

    it('resolves auto position when hover shows it', () => {
      setViewport(1024, 768);
      mockRects({ top: 10, bottom: 30, left: 500, right: 540 });

      render(
        <Tooltip label="Test" position="auto">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      act(() => {
        jest.runAllTimers();
      });

      expect(wrapper()).toHaveClass('is-active', 'is-bottom');
    });
  });

  describe('overflow correction', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;
    const originalRAF = window.requestAnimationFrame;

    const setViewport = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        value: width,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: height,
        writable: true,
        configurable: true,
      });
    };

    const mockRects = (
      wrapperRect: Partial<DOMRect>,
      contentRect: Partial<DOMRect>
    ) => {
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const isContent = this.classList.contains('tooltip-content');
        const rect = isContent ? contentRect : wrapperRect;
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
          ...rect,
        } as DOMRect;
      };
    };

    beforeEach(() => {
      // Make rAF synchronous so the overflow-correction callback runs in act().
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      };
    });

    afterEach(() => {
      window.requestAnimationFrame = originalRAF;
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        writable: true,
        configurable: true,
      });
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('shifts vertical-position tooltip right when content overflows the left edge', () => {
      setViewport(1024, 768);
      // Wrapper near left edge so tooltip-content (centered) overflows left.
      // contentRect.left = -10 (< edgePadding 8) → shift = 8 - (-10) = 18
      mockRects(
        { top: 100, bottom: 120, left: 0, right: 40 },
        { top: 60, bottom: 100, left: -10, right: 90 }
      );

      render(
        <Tooltip label="Test" position="top" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.left).toBe('calc(50% + 18px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '-18px'
      );
    });

    it('shifts vertical-position tooltip left when content overflows the right edge', () => {
      setViewport(1024, 768);
      // contentRect.right = 1030 > innerWidth 1024 - edgePadding 8 = 1016
      // shift = 1030 - 1016 = 14
      mockRects(
        { top: 100, bottom: 120, left: 980, right: 1024 },
        { top: 60, bottom: 100, left: 930, right: 1030 }
      );

      render(
        <Tooltip label="Test" position="bottom" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.left).toBe('calc(50% - 14px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '14px'
      );
    });

    it('shifts horizontal-position tooltip down when content overflows the top edge', () => {
      setViewport(1024, 768);
      // contentRect.top = -5 (< edgePadding 8) → shift = 8 - (-5) = 13
      mockRects(
        { top: 50, bottom: 90, left: 100, right: 140 },
        { top: -5, bottom: 35, left: 150, right: 250 }
      );

      render(
        <Tooltip label="Test" position="right" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.top).toBe('calc(50% + 13px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '-13px'
      );
    });

    it('does not shift vertical-position tooltip when content fits within viewport', () => {
      setViewport(1024, 768);
      // contentRect well within viewport: left 200 (>= 8) and right 400 (<= 1016)
      mockRects(
        { top: 100, bottom: 120, left: 250, right: 350 },
        { top: 60, bottom: 100, left: 200, right: 400 }
      );

      render(
        <Tooltip label="Test" position="top" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      // No corrective inline styles applied.
      expect(content.getAttribute('style')).toBeNull();
    });

    it('does not shift horizontal-position tooltip when content fits within viewport', () => {
      setViewport(1024, 768);
      // contentRect well within viewport: top 200 (>= 8) and bottom 400 (<= 760)
      mockRects(
        { top: 250, bottom: 350, left: 100, right: 140 },
        { top: 200, bottom: 400, left: 150, right: 250 }
      );

      render(
        <Tooltip label="Test" position="right" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.getAttribute('style')).toBeNull();
    });

    it('shifts horizontal-position tooltip up when content overflows the bottom edge', () => {
      setViewport(1024, 768);
      // contentRect.bottom = 775 > innerHeight 768 - edgePadding 8 = 760
      // shift = 775 - 760 = 15
      mockRects(
        { top: 700, bottom: 740, left: 100, right: 140 },
        { top: 735, bottom: 775, left: 0, right: 90 }
      );

      render(
        <Tooltip label="Test" position="left" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.top).toBe('calc(50% - 15px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '15px'
      );
    });

    it('corrects a tooltip hover shows, and drops the correction once Escape hides it', () => {
      setViewport(1024, 768);
      mockRects(
        { top: 100, bottom: 120, left: 0, right: 40 },
        { top: 60, bottom: 100, left: -10, right: 90 }
      );

      render(
        <Tooltip label="Test" position="top">
          <button>Hover me</button>
        </Tooltip>
      );
      hover(trigger());
      act(() => {
        jest.runAllTimers();
      });
      expect(bubble().style.left).toBe('calc(50% + 18px)');

      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(bubble().style.left).toBe('');
    });
  });

  describe('custom content', () => {
    it('renders ReactNode content when content prop is provided', () => {
      render(
        <Tooltip
          content={
            <span data-testid="rich">
              <strong>Bold</strong> text
            </span>
          }
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltipContent = screen.getByRole('tooltip', { hidden: true });
      expect(tooltipContent).toContainHTML('<strong>Bold</strong>');
      expect(tooltipContent).toHaveTextContent('Bold text');
    });

    it('content takes precedence over label when both provided', () => {
      render(
        <Tooltip label="Label text" content={<em>Content text</em>}>
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltipContent = screen.getByRole('tooltip', { hidden: true });
      expect(tooltipContent).toHaveTextContent('Content text');
      expect(tooltipContent).not.toHaveTextContent('Label text');
    });

    it('omits data-tooltip attribute when only content is provided', () => {
      const { container } = render(
        <Tooltip content={<span>Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveAttribute(
        'data-tooltip'
      );
    });

    it('sets data-tooltip attribute when label is provided alongside content', () => {
      const { container } = render(
        <Tooltip label="Label text" content={<span>Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveAttribute(
        'data-tooltip',
        'Label text'
      );
    });
  });

  describe('measurement frame after unmount', () => {
    const originalRAF = window.requestAnimationFrame;

    afterEach(() => {
      window.requestAnimationFrame = originalRAF;
    });

    it('skips the overflow-correction frame when the tooltip unmounted first', () => {
      // Capture rAF callbacks instead of running them so the measurement
      // frame can be flushed after the tooltip is gone.
      const frames: FrameRequestCallback[] = [];
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      };

      const { unmount } = render(
        <Tooltip label="Test" position="top" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(frames.length).toBeGreaterThan(0);

      unmount();
      // The content ref is detached now; the queued frame must bail out
      // without touching state or throwing.
      expect(() => frames.forEach(cb => cb(0))).not.toThrow();
    });
  });
});
