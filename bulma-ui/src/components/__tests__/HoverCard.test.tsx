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
import { resetDevWarnings } from '../../helpers/devWarnings';

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
  type: 'pointerover' | 'pointerout' | 'pointerdown' | 'pointerup',
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
/**
 * Focus as a key brings it. HoverCard asks the browser, through
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
      hover(trigger, 'touch');
      pressFocus(trigger, 'touch');
      fireEvent.click(trigger);
      advance(5000);
      expect(card()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('stays open under the mouse when a touch pointer crosses the trigger', () => {
      render(<Profile />);
      const trigger = triggerLink();
      hover(trigger);
      advance(600);
      expect(card()).toBeInTheDocument();
      hover(trigger, 'touch');
      pointer(trigger, 'pointerout', {
        pointerType: 'touch',
        relatedTarget: document.body,
      });
      advance(5000);
      expect(card()).toBeInTheDocument();
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
      keyboardFocus(triggerLink());
      advance(599);
      expect(card()).toBeNull();
      advance(1);
      expect(card()).toBeInTheDocument();
    });

    it('is not opened by focus that a press brings', () => {
      render(<Profile />);
      const trigger = triggerLink();
      pressFocus(trigger);
      advance(5000);
      expect(card()).toBeNull();
    });

    it('stays open while focus is in the trigger or the card, whatever the pointer does', () => {
      render(<Profile />);
      keyboardFocus(triggerLink());
      advance(600);
      hover(triggerLink());
      unhover(triggerLink());
      advance(5000);
      expect(card()).toBeInTheDocument();

      keyboardFocus(profileLink());
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
      keyboardFocus(triggerLink());
      advance(600);
      keyboardFocus(profileLink());
      const next = screen.getByRole('button', { name: 'Next' });
      keyboardFocus(next);
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
      keyboardFocus(triggerLink());
      advance(600);
      screen.getByRole('button', { name: 'Next' }).focus();
      advance(300);
      expect(card()).toBeNull();
    });

    it('does not hold the card open for focus a press puts on the trigger', () => {
      render(<Profile trigger={<Button>Ada Lovelace</Button>} />);
      const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
      hover(trigger);
      advance(600);
      pressFocus(trigger);
      unhover(trigger);
      advance(300);
      expect(card()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('stops holding the card when a press moves focus from it to the trigger', () => {
      render(<Profile />);
      keyboardFocus(triggerLink());
      advance(600);
      keyboardFocus(profileLink());
      pressFocus(triggerLink());
      advance(299);
      expect(card()).toBeInTheDocument();
      advance(1);
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
    });

    it('keeps a card opened by keyboard open when a press moves focus into it', () => {
      render(<Profile />);
      keyboardFocus(triggerLink());
      advance(600);
      pressFocus(profileLink());
      advance(5000);
      expect(card()).toBeInTheDocument();
    });
  });

  describe('Escape', () => {
    it('closes at once with focus on the trigger, and leaves focus there', () => {
      const onOpenChange = jest.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      keyboardFocus(triggerLink());
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
      keyboardFocus(triggerLink());
      advance(600);
      keyboardFocus(profileLink());
      fireEvent.keyDown(profileLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();

      // Only focus that leaves and comes back opens it again.
      keyboardFocus(screen.getByRole('button', { name: 'Next' }));
      keyboardFocus(triggerLink());
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

    describe('who the key belongs to', () => {
      it('passes it on to a field elsewhere that has focus, after closing the card', () => {
        const onKeyDown = jest.fn();
        render(
          <>
            <input aria-label="Search" onKeyDown={onKeyDown} />
            <Profile />
          </>
        );
        const search = screen.getByRole('textbox', { name: 'Search' });
        search.focus();
        hover(triggerLink());
        advance(600);
        expect(fireEvent.keyDown(search, { key: 'Escape' })).toBe(true);
        expect(card()).toBeNull();
        expect(onKeyDown).toHaveBeenCalledWith(
          expect.objectContaining({ key: 'Escape' })
        );
      });

      it.each([
        ['the card', () => profileLink()],
        ['its trigger', () => triggerLink()],
      ])('keeps it when focus is in %s', (_, focusTarget) => {
        render(<Profile />);
        hover(triggerLink());
        advance(600);
        pressFocus(focusTarget());
        expect(fireEvent.keyDown(focusTarget(), { key: 'Escape' })).toBe(false);
        expect(card()).toBeNull();
      });

      it('keeps it when nothing has focus', () => {
        render(<Profile />);
        hover(triggerLink());
        advance(600);
        // Some browsers report no active element at all rather than <body>.
        Object.defineProperty(document, 'activeElement', {
          configurable: true,
          get: () => null,
        });
        try {
          expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(
            false
          );
        } finally {
          delete (document as unknown as { activeElement?: unknown })
            .activeElement;
        }
        expect(card()).toBeNull();
      });

      it('lets a Modal opened from a button in the card close on it', () => {
        const Page = () => {
          const [reporting, setReporting] = useState(false);
          return (
            <>
              <HoverCard trigger={<a href="#ada">Ada Lovelace</a>}>
                <button onClick={() => setReporting(true)}>Report</button>
              </HoverCard>
              <Modal active={reporting} onClose={() => setReporting(false)}>
                <button>Send report</button>
              </Modal>
            </>
          );
        };
        render(<Page />);
        hover(triggerLink());
        advance(600);
        unhover(triggerLink(), card()!);
        const report = screen.getByRole('button', { name: 'Report' });
        pressFocus(report);
        fireEvent.click(report);
        const send = screen.getByRole('button', { name: 'Send report' });
        expect(send).toHaveFocus();
        expect(document.querySelector('.modal')).toHaveClass('is-active');

        // The Modal has focus, so the key is its: the card the pointer left
        // open closes, and the Modal closes as well.
        fireEvent.keyDown(send, { key: 'Escape' });
        expect(document.querySelector('.modal')).not.toHaveClass('is-active');
        expect(card()).toBeNull();
      });

      it('closes the card focus is in before one that opened after it', () => {
        render(
          <>
            <Profile />
            <HoverCard
              trigger={<a href="#grace">Grace Hopper</a>}
              contentClassName="grace"
            >
              Compiler team
            </HoverCard>
          </>
        );
        keyboardFocus(triggerLink());
        advance(600);
        hover(screen.getByRole('link', { name: 'Grace Hopper' }));
        advance(600);
        expect(document.querySelectorAll('.hover-card-content')).toHaveLength(
          2
        );

        fireEvent.keyDown(triggerLink(), { key: 'Escape' });
        expect(screen.queryByText('Analytical Engine team')).toBeNull();
        expect(document.querySelector('.grace')).toBeInTheDocument();
      });
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

    it('hands back focus a press put in the card without opening it again, and a fresh hover opens it', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      pressFocus(profileLink());
      // The pointer has gone and focus alone holds the card when Escape comes.
      unhover(card()!);
      advance(1000);
      fireEvent.keyDown(profileLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();
      advance(5000);
      expect(card()).toBeNull();

      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
    });

    it('opens on a fresh hover after Escape, though keyboard focus is still on the trigger', () => {
      render(<Profile />);
      keyboardFocus(triggerLink());
      advance(600);
      fireEvent.keyDown(triggerLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(triggerLink()).toHaveFocus();

      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
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

    describe('with one card inside another', () => {
      const Nested: React.FC<Partial<HoverCardProps>> = props => (
        <HoverCard trigger={<a href="#team">Engine team</a>} {...props}>
          <HoverCard
            trigger={<a href="#ada">Ada Lovelace</a>}
            contentClassName="inner"
            {...props}
          >
            <a href="#profile">View profile</a>
          </HoverCard>
        </HoverCard>
      );
      // The inner trigger sits in the outer card, so it is there while that is.
      const outer = () => screen.queryByRole('link', { name: 'Ada Lovelace' });
      const inner = () => document.querySelector('.inner');

      /** Hovers the outer trigger, then the inner one in the outer card. */
      const openBoth = () => {
        hover(screen.getByRole('link', { name: 'Engine team' }));
        advance(600);
        hover(triggerLink());
        advance(600);
        expect(inner()).toBeInTheDocument();
      };

      it.each([
        ['in place', {}],
        ['portaled', { appendToBody: true }],
      ])('closes the inner card first, then the outer one, %s', (_, props) => {
        render(<Nested {...props} />);
        openBoth();
        const first = fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(first).toBe(false);
        expect(inner()).toBeNull();
        expect(outer()).toBeInTheDocument();

        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(outer()).toBeNull();
        // Nothing is open, so the next Escape goes on its way.
        expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(true);
      });

      it.each([
        ['in place', {}],
        ['portaled', { appendToBody: true }],
      ])(
        'closes the inner card first when both open in the same commit, %s',
        (_, props) => {
          // The inner card starts open, so it opens with the outer one.
          render(
            <HoverCard trigger={<a href="#team">Engine team</a>} {...props}>
              <HoverCard
                trigger={<a href="#ada">Ada Lovelace</a>}
                contentClassName="inner"
                defaultOpen
                {...props}
              >
                <a href="#profile">View profile</a>
              </HoverCard>
            </HoverCard>
          );
          hover(screen.getByRole('link', { name: 'Engine team' }));
          advance(600);
          expect(inner()).toBeInTheDocument();

          fireEvent.keyDown(document.body, { key: 'Escape' });
          expect(inner()).toBeNull();
          expect(outer()).toBeInTheDocument();
        }
      );

      it('holds the outer card open for focus in a portaled inner card', () => {
        render(<Nested appendToBody />);
        openBoth();
        unhover(triggerLink(), inner()!);
        pressFocus(profileLink());
        unhover(inner()!);
        advance(60_000);
        expect(inner()).toBeInTheDocument();
        expect(outer()).toBeInTheDocument();
      });

      it('hands focus in the inner card back to its trigger, and keeps the outer open', () => {
        render(<Nested />);
        keyboardFocus(screen.getByRole('link', { name: 'Engine team' }));
        advance(600);
        keyboardFocus(triggerLink());
        advance(600);
        keyboardFocus(profileLink());
        fireEvent.keyDown(profileLink(), { key: 'Escape' });
        expect(inner()).toBeNull();
        expect(outer()).toBeInTheDocument();
        expect(triggerLink()).toHaveFocus();
      });
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
      keyboardFocus(triggerLink());
      advance(600);
      const follow = screen.getByRole('button', { name: 'Follow' });
      keyboardFocus(follow);
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
  });

  describe('with openOnTap', () => {
    /** A finger's press and lift on `el`. */
    const tap = (el: Element) => {
      pointer(el, 'pointerdown', { pointerType: 'touch' });
      pointer(el, 'pointerup', { pointerType: 'touch' });
    };

    /** Press listeners on `document` outside the capture phase that are still on. */
    const watchPresses = () => {
      const add = jest.spyOn(document, 'addEventListener');
      const remove = jest.spyOn(document, 'removeEventListener');
      return () =>
        add.mock.calls.filter(([t, , o]) => t === 'pointerdown' && !o).length -
        remove.mock.calls.filter(([t, , o]) => t === 'pointerdown' && !o)
          .length;
    };

    it('opens at once on a tap on the trigger, with no delay, and calls it expanded', () => {
      const onOpenChange = jest.fn();
      render(<Profile openOnTap onOpenChange={onOpenChange} />);
      tap(triggerLink());
      expect(card()).toBeInTheDocument();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(triggerLink()).toHaveAttribute('aria-expanded', 'true');
    });

    it('stays open with no timer, then closes on a second tap on the trigger', () => {
      render(<Profile openOnTap />);
      tap(triggerLink());
      advance(60_000);
      expect(card()).toBeInTheDocument();
      tap(triggerLink());
      expect(card()).toBeNull();
    });

    it('stays open for a tap inside the card, and closes for one outside', () => {
      render(
        <>
          <Profile openOnTap />
          <button>Elsewhere</button>
        </>
      );
      tap(triggerLink());
      tap(profileLink());
      advance(60_000);
      expect(card()).toBeInTheDocument();
      tap(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(card()).toBeNull();
    });

    it('closes on Escape', () => {
      render(<Profile openOnTap />);
      tap(triggerLink());
      expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(false);
      expect(card()).toBeNull();
    });

    it('lets the trigger’s own tap action run', () => {
      const onClick = jest.fn();
      render(
        <Profile
          openOnTap
          trigger={<Button onClick={onClick}>Ada Lovelace</Button>}
        />
      );
      const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
      tap(trigger);
      expect(fireEvent.click(trigger)).toBe(true);
      expect(onClick).toHaveBeenCalled();
      expect(card()).toBeInTheDocument();
    });

    it('keeps the focus rules for a card a tap opened', () => {
      render(
        <>
          <Profile openOnTap />
          <button>Elsewhere</button>
        </>
      );
      tap(triggerLink());
      keyboardFocus(profileLink());
      advance(60_000);
      expect(card()).toBeInTheDocument();
      // Focus leaving the card closes it after the delay, as it does
      // however the card opened.
      keyboardFocus(screen.getByRole('button', { name: 'Elsewhere' }));
      advance(300);
      expect(card()).toBeNull();
    });

    it('listens for a press outside only while a tap holds it open', () => {
      const live = watchPresses();
      const { unmount } = render(<Profile openOnTap />);
      expect(live()).toBe(0);
      tap(triggerLink());
      expect(live()).toBe(1);
      tap(triggerLink());
      expect(live()).toBe(0);

      // Opened by hover, nothing outside closes it but leaving.
      hover(triggerLink());
      advance(600);
      expect(card()).toBeInTheDocument();
      expect(live()).toBe(0);
      unhover(triggerLink());
      advance(300);

      tap(triggerLink());
      expect(live()).toBe(1);
      unmount();
      expect(live()).toBe(0);
    });

    it('forgets the tap once the card closes another way', () => {
      render(
        <>
          <Profile openOnTap />
          <button>Elsewhere</button>
        </>
      );
      tap(triggerLink());
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(card()).toBeNull();
      // Opened by hover next, a press elsewhere leaves it alone.
      unhover(triggerLink());
      hover(triggerLink());
      advance(600);
      pointer(screen.getByRole('button', { name: 'Elsewhere' }), 'pointerdown');
      expect(card()).toBeInTheDocument();
    });

    it('does nothing for a tap without it', () => {
      render(<Profile />);
      tap(triggerLink());
      advance(5000);
      expect(card()).toBeNull();
    });

    it('leaves mouse and pen as they are', () => {
      render(
        <>
          <Profile openOnTap />
          <button>Elsewhere</button>
        </>
      );
      // A click is no tap: it neither opens the card nor closes it.
      pointer(triggerLink(), 'pointerdown');
      pointer(triggerLink(), 'pointerup');
      expect(card()).toBeNull();

      hover(triggerLink(), 'pen');
      advance(599);
      expect(card()).toBeNull();
      advance(1);
      expect(card()).toBeInTheDocument();
      pointer(triggerLink(), 'pointerup', { pointerType: 'pen' });
      expect(card()).toBeInTheDocument();
      // A press elsewhere doesn't close a card the pointer opened.
      pointer(screen.getByRole('button', { name: 'Elsewhere' }), 'pointerdown');
      expect(card()).toBeInTheDocument();
      unhover(triggerLink());
      advance(300);
      expect(card()).toBeNull();
    });

    it('forgets a tap its caller turned down', () => {
      const onOpenChange = jest.fn();
      const { rerender } = render(
        <>
          <Profile openOnTap open={false} onOpenChange={onOpenChange} />
          <button>Elsewhere</button>
        </>
      );
      tap(triggerLink());
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      rerender(
        <>
          <Profile openOnTap open={false} onOpenChange={onOpenChange} />
          <button>Elsewhere</button>
        </>
      );
      // Opened by its caller later, it isn't a card a tap opened.
      rerender(
        <>
          <Profile openOnTap open onOpenChange={onOpenChange} />
          <button>Elsewhere</button>
        </>
      );
      onOpenChange.mockClear();
      pointer(screen.getByRole('button', { name: 'Elsewhere' }), 'pointerdown');
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    describe('with one card inside another', () => {
      it.each([
        ['in place', {}],
        ['portaled', { appendToBody: true }],
      ])('opens and closes them one tap at a time, %s', (_, props) => {
        render(
          <>
            <HoverCard
              openOnTap
              trigger={<Button>Engine team</Button>}
              {...props}
            >
              <HoverCard
                openOnTap
                contentClassName="inner"
                trigger={<Button>Ada Lovelace</Button>}
                {...props}
              >
                <a href="#profile">View profile</a>
              </HoverCard>
            </HoverCard>
            <button>Elsewhere</button>
          </>
        );
        const inner = () => document.querySelector('.inner');
        tap(screen.getByRole('button', { name: 'Engine team' }));
        tap(screen.getByRole('button', { name: 'Ada Lovelace' }));
        expect(inner()).toBeInTheDocument();

        // A tap in the inner card is inside both.
        tap(profileLink());
        expect(inner()).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Ada Lovelace' })
        ).toBeInTheDocument();

        // Escape closes the inner one first.
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(inner()).toBeNull();
        expect(
          screen.getByRole('button', { name: 'Ada Lovelace' })
        ).toBeInTheDocument();

        // A tap outside closes the outer one.
        tap(screen.getByRole('button', { name: 'Elsewhere' }));
        expect(
          screen.queryByRole('button', { name: 'Ada Lovelace' })
        ).toBeNull();
      });
    });
  });

  describe('focus in the card', () => {
    it('stays open while a control a press focused in it has focus, after the pointer leaves', () => {
      render(
        <>
          <Profile />
          <button>Elsewhere</button>
        </>
      );
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      pressFocus(profileLink());
      unhover(card()!);
      advance(60_000);
      expect(card()).toBeInTheDocument();
      expect(profileLink()).toHaveFocus();

      // Focus leaving the card is what closes it, and it leaves focus where
      // it went.
      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
      pressFocus(elsewhere);
      advance(299);
      expect(card()).toBeInTheDocument();
      advance(1);
      expect(card()).toBeNull();
      expect(elsewhere).toHaveFocus();
    });

    it('closes once a press moves focus out of the card onto nothing that takes it', () => {
      render(<Profile />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink(), card()!);
      pressFocus(profileLink());
      unhover(card()!);
      advance(1000);
      pointer(document.body, 'pointerdown');
      profileLink().blur();
      advance(300);
      expect(card()).toBeNull();
      expect(document.body).toHaveFocus();
    });

    it('holds a portaled card open for focus a press put in it', () => {
      render(<Profile appendToBody />);
      hover(triggerLink());
      advance(600);
      unhover(triggerLink());
      hover(card()!);
      pressFocus(profileLink());
      unhover(card()!);
      advance(60_000);
      expect(card()).toBeInTheDocument();
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
      keyboardFocus(triggerLink());
      advance(600);
      hover(card()!);
      pressFocus(profileLink());
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
      keyboardFocus(triggerLink());
      keyboardFocus(screen.getByRole('button', { name: 'Next' }));
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
      keyboardFocus(triggerLink());
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
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const Nothing = () => null;
      render(
        <HoverCard trigger={<Nothing />} defaultOpen>
          <a href="#profile">View profile</a>
        </HoverCard>
      );
      keyboardFocus(profileLink());
      fireEvent.keyDown(profileLink(), { key: 'Escape' });
      expect(card()).toBeNull();
      expect(document.body).toHaveFocus();
      // There's no trigger to judge, so there's nothing to warn about.
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('a trigger that cannot take focus', () => {
    afterEach(() => {
      resetDevWarnings();
    });

    it('warns once in development, and leaves the trigger as it is', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <Profile trigger={<span>Ada Lovelace</span>} />
          <Profile trigger={<span>Grace Hopper</span>} />
        </>
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("trigger that can't take focus")
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Use a link or a button')
      );
      const trigger = screen.getByText('Ada Lovelace');
      expect(trigger).not.toHaveAttribute('tabindex');
      expect(trigger).not.toHaveAttribute('role');
    });

    // Each case builds its trigger, so the table holds no bare elements.
    it.each([
      ['a link', () => <a href="#ada">Ada Lovelace</a>],
      ['a button', () => <Button>Ada Lovelace</Button>],
      [
        'an element given tabIndex={0}',
        () => <span tabIndex={0}>Ada Lovelace</span>,
      ],
    ])('does not warn for %s', (_, trigger) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Profile trigger={trigger()} />);
      expect(warn).not.toHaveBeenCalled();
    });

    it.each([
      ['an element given tabIndex={-1}', () => <span tabIndex={-1}>Ada</span>],
      ['a disabled button', () => <button disabled>Ada</button>],
      [
        'a disabled button given tabIndex={0}',
        () => (
          <button disabled tabIndex={0}>
            Ada
          </button>
        ),
      ],
      ['a link with no href', () => <a>Ada</a>],
      // Focus comes back to the trigger and its ARIA is on it, so a link
      // inside doesn't stand in for it.
      [
        'an element with a link inside',
        () => (
          <span>
            <a href="#ada">Ada Lovelace</a>
          </span>
        ),
      ],
    ])('warns for %s', (_, trigger) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Profile trigger={trigger()} />);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('judges the trigger alone, so the links in an open card do not stand in for it', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Profile defaultOpen trigger={<span>Ada Lovelace</span>} />);
      expect(card()).toBeInTheDocument();
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('does not warn for a link that is hidden for now', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <div style={{ visibility: 'hidden' }}>
          <Profile />
        </div>
      );
      expect(
        getComputedStyle(screen.getByText('Ada Lovelace')).visibility
      ).toBe('hidden');
      expect(warn).not.toHaveBeenCalled();
    });

    it('checks a trigger that changes', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(<Profile />);
      expect(warn).not.toHaveBeenCalled();
      rerender(<Profile trigger={<span>Ada Lovelace</span>} />);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('stays quiet in production, without reading the page for it', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // The check finds the trigger as the wrapper's first element.
      const firstChild = jest.spyOn(
        Element.prototype,
        'firstElementChild',
        'get'
      );
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        render(<Profile trigger={<span>Ada Lovelace</span>} />);
      } finally {
        process.env.NODE_ENV = previous;
      }
      expect(warn).not.toHaveBeenCalled();
      const wrapper = document.querySelector('.hover-card');
      expect(firstChild.mock.contexts).not.toContain(wrapper);
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

      pressFocus(trigger);
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
        expect(serverHtml).toContain('aria-expanded="false"');
        expect(errorSpy).not.toHaveBeenCalled();
        const panel = card()!;
        expect(panel.parentElement).toBe(document.body);
        const trigger = container.querySelector('a');
        expect(trigger).toHaveAttribute('aria-controls', panel.id);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      } finally {
        await cleanup();
      }
    });
  });
});
