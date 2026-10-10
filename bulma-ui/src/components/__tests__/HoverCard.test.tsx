import React, { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HoverCard, HoverCardProps } from '../HoverCard';
import { Popover } from '../Popover';
import { Modal } from '../Modal';
import { Button } from '../../elements/Button';
import { ConfigProvider } from '../../helpers/Config';

type PointerType = 'mouse' | 'pen' | 'touch';

/**
 * jsdom has no PointerEvent, so `fireEvent.pointerOver` and the rest send an
 * event without a `pointerType`. Build a MouseEvent of the pointer type, from
 * the element's own window so it works in an iframe, and give it one; React
 * reads both off the native event. React makes `onPointerEnter` and
 * `onPointerLeave` out of `pointerover` and `pointerout`, walking from the
 * element the pointer left to the one it entered.
 */
const pointer = (
  el: Element,
  type: 'pointerover' | 'pointerout' | 'pointerdown',
  {
    pointerType = 'mouse',
    relatedTarget = null,
  }: { pointerType?: PointerType; relatedTarget?: EventTarget | null } = {}
) => {
  const view = el.ownerDocument.defaultView as typeof window;
  const event = new view.MouseEvent(type, {
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
/** A press, which makes the focus that follows it press focus. */
const press = (el: Element, pointerType: PointerType = 'mouse') =>
  pointer(el, 'pointerdown', { pointerType });
/** A key, which makes the focus that follows it keyboard focus. */
const key = (el: Element = document.body, init: Partial<KeyboardEvent> = {}) =>
  fireEvent.keyDown(el, { key: 'Tab', ...init });

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

const Profile: React.FC<Partial<HoverCardProps>> = ({
  trigger = <a href="#ada">Ada Lovelace</a>,
  ...props
}) => (
  <HoverCard trigger={trigger} {...props}>
    <p>Analytical Engine team</p>
    <a href="#profile">View profile</a>
  </HoverCard>
);

const card = () => document.querySelector<HTMLElement>('.hover-card-content');
const triggerLink = () => screen.getByRole('link', { name: 'Ada Lovelace' });
const profileLink = () => screen.getByRole('link', { name: 'View profile' });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('HoverCard', () => {
  describe('trigger', () => {
    it('keeps its own role and gets aria-expanded, with no aria-controls while closed', () => {
      render(<Profile />);
      const trigger = triggerLink();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
      expect(trigger).not.toHaveAttribute('aria-haspopup');
      expect(trigger).not.toHaveAttribute('role');
      expect(trigger).not.toHaveAttribute('tabindex');
      expect(card()).toBeNull();
    });

    it('names the card in aria-controls only while the card is on the page', () => {
      render(<Profile defaultOpen />);
      const trigger = triggerLink();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', card()!.id);

      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(card()).toBeNull();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('gives the card an id and no role, and puts it right after the trigger', () => {
      render(<Profile defaultOpen />);
      const panel = card()!;
      expect(panel.id).toBeTruthy();
      expect(panel).not.toHaveAttribute('role');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.queryByRole('tooltip')).toBeNull();
      expect(triggerLink().nextElementSibling).toBe(panel);
    });

    it('leaves a click to the trigger: the card does not toggle', () => {
      const onClick = jest.fn();
      const onOpenChange = jest.fn();
      render(
        <Profile
          trigger={<Button onClick={onClick}>Ada Lovelace</Button>}
          onOpenChange={onOpenChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
      advance(1000);
      expect(onClick).toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(card()).toBeNull();
    });

    it('keeps a ref on the trigger element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Profile trigger={<Button ref={ref}>Ada Lovelace</Button>} />);
      expect(ref.current).toBe(
        screen.getByRole('button', { name: 'Ada Lovelace' })
      );
    });

    it('moves no focus when it opens', () => {
      render(
        <>
          <button>Elsewhere</button>
          <Profile />
        </>
      );
      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
      elsewhere.focus();
      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
      expect(elsewhere).toHaveFocus();
    });
  });

  describe('hover', () => {
    it('opens after openDelay, reporting it through onOpenChange', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      hover(triggerLink());
      advance(599);
      expect(card()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      advance(1);
      expect(card()).toBeInTheDocument();
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('closes after closeDelay once the pointer leaves', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink());
      advance(299);
      expect(card()).toBeInTheDocument();
      advance(1);
      expect(card()).toBeNull();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('stays open while the pointer crosses the gap onto the card within closeDelay', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink());
      advance(250);
      hover(card()!);
      advance(5000);
      expect(card()).toBeInTheDocument();

      unhover(card()!);
      advance(300);
      expect(card()).toBeNull();
    });

    it('stays open when the pointer moves straight from the trigger onto the card', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      advance(5000);
      expect(card()).toBeInTheDocument();
    });

    it('does not open when the pointer leaves before openDelay', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      hover(triggerLink());
      advance(300);
      unhover(triggerLink());
      advance(5000);
      expect(card()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('is not opened by a touch pointer, or by the focus a tap brings', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      const trigger = triggerLink();
      press(trigger, 'touch');
      hover(trigger, 'touch');
      trigger.focus();
      fireEvent.click(trigger);
      advance(5000);
      expect(card()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('opens for a pen hovering', () => {
      render(<Profile />);
      hover(triggerLink(), 'pen');
      advance(600);
      expect(card()).toBeInTheDocument();
    });

    it('has no timer that closes a card the pointer is on', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(60_000);
      expect(card()).toBeInTheDocument();
    });

    it('takes its own delays', () => {
      render(<Profile openDelay={100} closeDelay={0} />);
      hover(triggerLink());
      advance(100);
      expect(card()).toBeInTheDocument();
      unhover(triggerLink());
      advance(0);
      expect(card()).toBeNull();
    });
  });

  describe('keyboard focus', () => {
    it('opens on keyboard focus after openDelay', () => {
      render(<Profile />);
      key();
      triggerLink().focus();
      advance(599);
      expect(card()).toBeNull();
      advance(1);
      expect(card()).toBeInTheDocument();
    });

    it('is not opened by focus that a press brings', () => {
      render(<Profile />);
      const trigger = triggerLink();
      press(trigger);
      trigger.focus();
      advance(5000);
      expect(card()).toBeNull();
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'] as const)(
      'does not count a key pressed with %s as keyboard use',
      modifier => {
        render(<Profile />);
        const trigger = triggerLink();
        press(trigger);
        key(document.body, { key: 'Tab', [modifier]: true });
        trigger.focus();
        advance(5000);
        expect(card()).toBeNull();
      }
    );

    it('stays open while focus is in the trigger or the card, whatever the pointer does', () => {
      render(<Profile />);
      key();
      triggerLink().focus();
      advance(600);
      hover(triggerLink());
      unhover(triggerLink());
      advance(5000);
      expect(card()).toBeInTheDocument();

      key();
      profileLink().focus();
      advance(5000);
      expect(card()).toBeInTheDocument();
    });

    it('closes after closeDelay once Tab moves focus past an inline card', () => {
      render(
        <>
          <Profile />
          <button>Next</button>
        </>
      );
      key();
      triggerLink().focus();
      advance(600);
      key();
      profileLink().focus();
      key();
      const next = screen.getByRole('button', { name: 'Next' });
      next.focus();
      advance(299);
      expect(card()).toBeInTheDocument();
      advance(1);
      expect(card()).toBeNull();
      expect(next).toHaveFocus();
    });

    it('closes once focus leaves the trigger', () => {
      render(
        <>
          <Profile />
          <button>Next</button>
        </>
      );
      key();
      triggerLink().focus();
      advance(600);
      screen.getByRole('button', { name: 'Next' }).focus();
      advance(300);
      expect(card()).toBeNull();
    });

    it('keeps a card opened by keyboard open when a press moves focus into it', () => {
      render(<Profile />);
      key();
      triggerLink().focus();
      advance(600);
      press(profileLink());
      profileLink().focus();
      advance(5000);
      expect(card()).toBeInTheDocument();
    });
  });

  describe('Escape', () => {
    it('closes at once with focus on the trigger, and leaves focus there', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      key();
      triggerLink().focus();
      advance(600);
      const event = fireEvent.keyDown(triggerLink(), { key: 'Escape' });
      expect(event).toBe(false);
      expect(card()).toBeNull();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();
    });

    it('hands focus in the card back to the trigger without opening it again', () => {
      render(
        <>
          <Profile />
          <button>Next</button>
        </>
      );
      key();
      triggerLink().focus();
      advance(600);
      key();
      profileLink().focus();
      fireEvent.keyDown(profileLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();

      // Only focus that leaves and comes back opens it again.
      key();
      screen.getByRole('button', { name: 'Next' }).focus();
      key();
      triggerLink().focus();
      advance(600);
      expect(card()).toBeInTheDocument();
    });

    it('closes while the trigger is hovered and focus is elsewhere, moving neither', () => {
      render(
        <>
          <input aria-label="Search" />
          <Profile />
        </>
      );
      const search = screen.getByRole('textbox', { name: 'Search' });
      search.focus();
      hover(triggerLink());
      advance(600);
      fireEvent.keyDown(search, { key: 'Escape' });
      expect(card()).toBeNull();
      expect(search).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();

      // A fresh hover opens it again.
      unhover(triggerLink());
      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
    });

    it('closes while the card is hovered, and the next hover of the trigger opens it', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(card()).toBeNull();
      advance(5000);
      expect(card()).toBeNull();

      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
    });

    it('does not count handing focus back as keyboard focus arriving', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      press(profileLink());
      profileLink().focus();
      // The pointer has left and the card is closing when Escape comes.
      unhover(card()!);
      advance(100);
      fireEvent.keyDown(profileLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();
    });

    it('cancels an opening that has not happened yet, and lets the key through', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      hover(triggerLink());
      advance(300);
      expect(fireEvent.keyDown(triggerLink(), { key: 'Escape' })).toBe(true);
      advance(5000);
      expect(card()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('ignores other keys while open', () => {
      render(<Profile defaultOpen />);
      fireEvent.keyDown(triggerLink(), { key: 'a' });
      expect(card()).toBeInTheDocument();
    });

    it('closes only the card inside an open Popover', () => {
      render(
        <Popover trigger={<button>Team</button>} ariaLabel="Team" defaultOpen>
          <Profile defaultOpen />
        </Popover>
      );
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(card()).toBeNull();
      expect(screen.getByRole('dialog', { name: 'Team' })).toBeInTheDocument();

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Team' })).toBeNull();
    });

    it('closes only the card inside an open Modal', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          <Profile defaultOpen />
        </Modal>
      );
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(card()).toBeNull();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('open state', () => {
    it('follows `open` when controlled, reporting hover through onOpenChange after the delay', () => {
      const onOpenChange = jest.fn();
      const { rerender } = render(
        <Profile open={false} onOpenChange={onOpenChange} />
      );
      hover(triggerLink());
      advance(600);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(card()).toBeNull();

      rerender(<Profile open onOpenChange={onOpenChange} />);
      expect(card()).toBeInTheDocument();
      unhover(triggerLink());
      advance(300);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(card()).toBeInTheDocument();

      rerender(<Profile open={false} onOpenChange={onOpenChange} />);
      expect(card()).toBeNull();
    });

    it('reports Escape on a controlled card right away', () => {
      const onOpenChange = jest.fn();
      render(<Profile open onOpenChange={onOpenChange} />);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(card()).toBeInTheDocument();
    });

    it('does not report the state the card is already in when a delay runs out', () => {
      const onOpenChange = jest.fn();
      const { rerender } = render(
        <Profile open={false} onOpenChange={onOpenChange} />
      );
      hover(triggerLink());
      advance(300);
      rerender(<Profile open onOpenChange={onOpenChange} />);
      advance(5000);
      expect(onOpenChange).not.toHaveBeenCalled();

      // Hovering a card that is open already asks for nothing.
      unhover(triggerLink());
      hover(triggerLink());
      advance(5000);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('stays open with defaultOpen until the pointer has been and gone', () => {
      render(<Profile defaultOpen />);
      advance(60_000);
      expect(card()).toBeInTheDocument();
      hover(triggerLink());
      unhover(triggerLink());
      advance(300);
      expect(card()).toBeNull();
    });

    it('lets an action inside the card close it, handing focus back to the trigger', () => {
      const Controlled = () => {
        const [open, setOpen] = useState(false);
        return (
          <HoverCard
            trigger={<a href="#ada">Ada Lovelace</a>}
            open={open}
            onOpenChange={setOpen}
          >
            <button onClick={() => setOpen(false)}>Follow</button>
          </HoverCard>
        );
      };
      render(<Controlled />);
      key();
      triggerLink().focus();
      advance(600);
      const follow = screen.getByRole('button', { name: 'Follow' });
      key(document.activeElement!);
      follow.focus();
      key(follow, { key: 'Enter' });
      fireEvent.click(follow);
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();
    });

    it('leaves focus where the update that closed the card put it', () => {
      const Controlled = () => {
        const [open, setOpen] = useState(true);
        // The input comes first, so it has taken focus by the time the card
        // looks at where focus went.
        return (
          <>
            {!open && <input aria-label="Note" autoFocus />}
            <HoverCard
              trigger={<a href="#ada">Ada Lovelace</a>}
              open={open}
              onOpenChange={setOpen}
            >
              <button onClick={() => setOpen(false)}>Write a note</button>
            </HoverCard>
          </>
        );
      };
      render(<Controlled />);
      const write = screen.getByRole('button', { name: 'Write a note' });
      write.focus();
      fireEvent.click(write);
      expect(card()).toBeNull();
      expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus();
    });

    it('hands back focus a press put in the card when the pointer leaves, without opening again', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      press(profileLink());
      profileLink().focus();
      unhover(card()!);
      advance(300);
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();
    });
  });

  describe('placement', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    const setViewport = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: height,
      });
    };

    afterEach(() => setViewport(originalWidth, originalHeight));

    const rect = (r: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    }) =>
      ({
        ...r,
        width: r.right - r.left,
        height: r.bottom - r.top,
        x: r.left,
        y: r.top,
        toJSON: () => ({}),
      }) as DOMRect;

    /** Mocks the wrapper's and the card's rects, then measures again. */
    const measure = (
      container: HTMLElement,
      anchor: DOMRect,
      size: { width: number; height: number }
    ) => {
      jest
        .spyOn(container.querySelector('.hover-card')!, 'getBoundingClientRect')
        .mockReturnValue(anchor);
      jest
        .spyOn(card()!, 'getBoundingClientRect')
        .mockReturnValue(
          rect({ top: 0, left: 0, right: size.width, bottom: size.height })
        );
      act(() => {
        fireEvent(window, new Event('resize'));
      });
    };

    it('opens below on the left by default, placed by CSS', () => {
      render(<Profile defaultOpen />);
      expect(card()).toHaveClass('hover-card-content', 'is-bottom-left');
      expect(card()).not.toHaveClass('is-portal');
      expect(card()).not.toHaveAttribute('style');
    });

    it.each(['bottom-right', 'top-left', 'top-right'] as const)(
      'takes position="%s"',
      position => {
        render(<Profile defaultOpen position={position} />);
        expect(card()).toHaveClass(`is-${position}`);
      }
    );

    it('flips an auto card above the trigger when there is no room below', () => {
      setViewport(1000, 1000);
      const { container } = render(<Profile defaultOpen position="auto" />);
      measure(
        container,
        rect({ top: 900, bottom: 930, left: 50, right: 150 }),
        {
          width: 200,
          height: 150,
        }
      );
      expect(card()).toHaveClass('is-top-left');
      expect(card()).not.toHaveAttribute('style');
    });

    it('portals into document.body with fixed coordinates at the trigger’s edge', () => {
      setViewport(1000, 1000);
      const { container } = render(
        <Profile defaultOpen appendToBody position="auto" />
      );
      const panel = card()!;
      expect(panel.parentElement).toBe(document.body);
      expect(panel).toHaveClass('is-portal');
      expect(panel.style.position).toBe('fixed');
      expect(triggerLink()).toHaveAttribute('aria-controls', panel.id);

      measure(
        container,
        rect({ top: 100, bottom: 130, left: 900, right: 960 }),
        {
          width: 200,
          height: 150,
        }
      );
      expect(panel).toHaveClass('is-bottom-right');
      // The gap is the stylesheet's, so the coordinates are the edge itself.
      expect(panel.style.top).toBe('130px');
      expect(panel.style.left).toBe('760px');

      measure(
        container,
        rect({ top: 900, bottom: 930, left: 50, right: 110 }),
        {
          width: 200,
          height: 150,
        }
      );
      expect(panel).toHaveClass('is-top-left');
      expect(panel.style.top).toBe('750px');
      expect(panel.style.left).toBe('50px');
    });

    it('counts focus in a portaled card as inside, though the card is elsewhere in the page', () => {
      render(<Profile appendToBody />);
      key();
      triggerLink().focus();
      advance(600);
      hover(card()!);
      press(profileLink());
      profileLink().focus();
      unhover(card()!);
      advance(5000);
      expect(card()).toBeInTheDocument();
    });

    it('keeps a portaled card open while the pointer is on it, and leaves it out of the Tab order', () => {
      render(
        <>
          <Profile appendToBody />
          <button>Next</button>
        </>
      );
      hover(triggerLink());
      advance(600);
      unhover(triggerLink());
      hover(card()!);
      advance(5000);
      expect(card()!.parentElement).toBe(document.body);

      // The card comes last in the document, so Tab from the trigger reaches
      // the page's next stop, and the card closes behind it.
      unhover(card()!);
      key();
      triggerLink().focus();
      key();
      screen.getByRole('button', { name: 'Next' }).focus();
      advance(300);
      expect(card()).toBeNull();
    });
  });

  describe('props and classes', () => {
    it('puts className, helper props and attributes on the wrapper span, contentClassName on the card', () => {
      const { container } = render(
        <Profile
          defaultOpen
          className="custom"
          m="2"
          data-testid="wrapper"
          contentClassName="card-extra"
        />
      );
      const wrapper = screen.getByTestId('wrapper');
      expect(wrapper).toBe(container.firstChild);
      expect(wrapper.tagName).toBe('SPAN');
      expect(wrapper).toHaveClass('hover-card', 'is-active', 'custom', 'm-2');
      expect(card()).toHaveClass('hover-card-content', 'card-extra');
    });

    it("runs the wrapper's own pointer and focus handlers as well", () => {
      const calls: string[] = [];
      render(
        <Profile
          onPointerEnter={() => calls.push('enter')}
          onPointerLeave={() => calls.push('leave')}
          onFocus={() => calls.push('focus')}
          onBlur={() => calls.push('blur')}
        />
      );
      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
      unhover(triggerLink());
      key();
      triggerLink().focus();
      triggerLink().blur();
      expect(calls).toEqual(['enter', 'leave', 'focus', 'blur']);
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Profile defaultOpen appendToBody position="top-right" m="1" />
        </ConfigProvider>
      );
      expect(container.firstChild).toHaveClass(
        'bestax-hover-card',
        'bestax-is-active',
        'bestax-m-1'
      );
      const panel = document.querySelector('.bestax-hover-card-content')!;
      expect(panel).toHaveClass('bestax-is-top-right', 'bestax-is-portal');
      expect(panel.className).not.toMatch(/(^|\s)hover-card-content(\s|$)/);
      expect(container.querySelector('.hover-card')).toBeNull();
    });
  });

  describe('lifecycle', () => {
    it('fires nothing after it unmounts', () => {
      const onOpenChange = jest.fn();
      const { unmount } = render(<Profile onOpenChange={onOpenChange} />);
      hover(triggerLink());
      unmount();
      advance(5000);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('fires no pending close after it unmounts', () => {
      const onOpenChange = jest.fn();
      const { unmount } = render(
        <Profile defaultOpen onOpenChange={onOpenChange} />
      );
      hover(triggerLink());
      unhover(triggerLink());
      unmount();
      advance(5000);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('works with a trigger that renders nothing, with nothing to hand focus back to', () => {
      const Nothing = () => null;
      render(
        <HoverCard trigger={<Nothing />} defaultOpen>
          <a href="#profile">View profile</a>
        </HoverCard>
      );
      key();
      profileLink().focus();
      fireEvent.keyDown(profileLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(document.body).toHaveFocus();
    });
  });

  describe('in an iframe', () => {
    let iframe: HTMLIFrameElement;
    let frameDoc: Document;
    let mount: HTMLDivElement;

    beforeEach(() => {
      iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      frameDoc = iframe.contentDocument!;
      mount = frameDoc.createElement('div');
      frameDoc.body.appendChild(mount);
    });

    afterEach(() => {
      iframe.remove();
    });

    it('listens for Escape and presses in the iframe’s document', () => {
      render(<Profile />, { container: mount, baseElement: frameDoc.body });
      const frame = within(frameDoc.body);
      const trigger = frame.getByRole('link', { name: 'Ada Lovelace' });

      press(trigger);
      trigger.focus();
      advance(5000);
      expect(frameDoc.querySelector('.hover-card-content')).toBeNull();

      hover(trigger);
      advance(600);
      expect(frameDoc.querySelector('.hover-card-content')).not.toBeNull();
      fireEvent.keyDown(frameDoc.body, { key: 'Escape' });
      expect(frameDoc.querySelector('.hover-card-content')).toBeNull();
    });
  });

  describe('in a shadow root', () => {
    it('opens on hover and closes on Escape', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = host.attachShadow({ mode: 'open' });
      const mount = document.createElement('div');
      root.appendChild(mount);
      try {
        render(<Profile />, { container: mount, baseElement: mount });
        const trigger = mount.querySelector('a')!;
        hover(trigger);
        advance(600);
        expect(mount.querySelector('.hover-card-content')).not.toBeNull();
        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(mount.querySelector('.hover-card-content')).toBeNull();
      } finally {
        host.remove();
      }
    });
  });

  describe('hydration', () => {
    const hydrate = async (ui: React.ReactElement) => {
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
        },
      };
    };

    it('server-renders an open inline card and hydrates it without a mismatch', async () => {
      const { serverHtml, errorSpy, cleanup } = await hydrate(
        <Profile defaultOpen />
      );
      try {
        expect(serverHtml).toContain('hover-card-content');
        expect(errorSpy).not.toHaveBeenCalled();
        expect(triggerLink()).toHaveAttribute('aria-controls', card()!.id);
      } finally {
        await cleanup();
      }
    });

    it('leaves a portaled card out of the server markup and shows it after hydration', async () => {
      const { container, serverHtml, errorSpy, cleanup } = await hydrate(
        <Profile defaultOpen appendToBody />
      );
      try {
        expect(serverHtml).not.toContain('hover-card-content');
        expect(serverHtml).not.toContain('aria-controls');
        expect(errorSpy).not.toHaveBeenCalled();
        const panel = card()!;
        expect(panel.parentElement).toBe(document.body);
        expect(container.querySelector('a')).toHaveAttribute(
          'aria-controls',
          panel.id
        );
      } finally {
        await cleanup();
      }
    });
  });
});
