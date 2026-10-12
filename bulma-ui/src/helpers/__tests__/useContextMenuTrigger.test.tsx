import React from 'react';
import { createPortal } from 'react-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LONG_PRESS_DELAY,
  LONG_PRESS_TOLERANCE,
  useContextMenuTrigger,
  UseContextMenuTriggerOptions,
} from '../useContextMenuTrigger';

type PointerType = 'mouse' | 'pen' | 'touch' | '';

/** A pointer event with a `pointerType` and a `pointerId`, which jsdom's events lack. */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  {
    pointerType = 'touch',
    pointerId = 1,
    x = 20,
    y = 10,
  }: {
    pointerType?: PointerType;
    pointerId?: number;
    x?: number;
    y?: number;
  } = {}
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return fireEvent(el, event);
};

const contextMenu = (el: Element, x = 20, y = 10) =>
  fireEvent.contextMenu(el, { clientX: x, clientY: y });

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

/** The hook's handlers on a region holding a button, with what portals out of it. */
const Region = ({
  onOpen,
  disabled = false,
  children,
  portaled,
  testId = 'region',
}: Partial<UseContextMenuTriggerOptions> & {
  children?: React.ReactNode;
  portaled?: React.ReactNode;
  testId?: string;
}) => {
  const handlers = useContextMenuTrigger({
    onOpen: onOpen ?? (() => {}),
    disabled,
  });
  return (
    <div data-testid={testId} {...handlers}>
      <button>Details</button>
      {children}
      {portaled && createPortal(portaled, document.body)}
    </div>
  );
};

const region = (testId = 'region') => screen.getByTestId(testId);
const details = () => screen.getByRole('button', { name: 'Details' });

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockReturnValue(rect(0, 0, 400, 100));
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useContextMenuTrigger', () => {
  it('renders nothing and adds no ARIA', () => {
    render(<Region />);
    expect(region().attributes).toHaveLength(1);
  });

  describe('contextmenu', () => {
    it('asks to open at the event’s point, with the trigger, and prevents the browser’s menu', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      expect(contextMenu(details(), 30, 40)).toBe(false);
      expect(onOpen).toHaveBeenCalledWith({ x: 30, y: 40 }, region());
    });

    it('asks again for each one, so a right-click elsewhere moves it', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      contextMenu(region(), 30, 40);
      contextMenu(region(), 300, 60);
      expect(onOpen.mock.calls.map(([point]) => point)).toEqual([
        { x: 30, y: 40 },
        { x: 300, y: 60 },
      ]);
    });

    it('asks at the bottom-left corner of the element it was fired at when its point is off it', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      jest
        .spyOn(details(), 'getBoundingClientRect')
        .mockReturnValue(rect(50, 20, 80, 30));
      for (const [x, y] of [
        [0, 0],
        [49, 30],
        [131, 30],
        [60, 19],
        [60, 51],
      ]) {
        contextMenu(details(), x, y);
      }
      contextMenu(details(), 50, 20);
      contextMenu(details(), 130, 50);
      expect(onOpen.mock.calls.map(([point]) => point)).toEqual([
        ...Array(5).fill({ x: 50, y: 50 }),
        { x: 50, y: 20 },
        { x: 130, y: 50 },
      ]);
    });

    it('leaves one a handler before it prevented', () => {
      const onOpen = jest.fn();
      render(
        <Region onOpen={onOpen}>
          <span onContextMenu={e => e.preventDefault()}>Mine</span>
        </Region>
      );
      contextMenu(screen.getByText('Mine'));
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('leaves the browser’s menu alone while disabled', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} disabled />);
      expect(contextMenu(region())).toBe(true);
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('ignores one from content portaled out of the trigger', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} portaled={<p>Portaled</p>} />);
      expect(contextMenu(screen.getByText('Portaled'))).toBe(true);
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('lets the innermost of nested triggers ask', () => {
      const outer = jest.fn();
      const inner = jest.fn();
      render(
        <Region onOpen={outer} testId="outer">
          <Region onOpen={inner} testId="inner" />
        </Region>
      );
      contextMenu(region('inner'));
      expect(inner).toHaveBeenCalledWith({ x: 20, y: 10 }, region('inner'));
      expect(outer).not.toHaveBeenCalled();
    });
  });

  describe('long press', () => {
    it('fires a contextmenu at what the press landed on, at its point, once held long enough', () => {
      const onOpen = jest.fn();
      const seen = jest.fn();
      render(<Region onOpen={onOpen} />);
      details().addEventListener('contextmenu', seen);
      pointer(details(), 'pointerdown', { x: 60, y: 30 });
      advance(LONG_PRESS_DELAY - 1);
      expect(seen).not.toHaveBeenCalled();
      advance(1);
      expect(seen).toHaveBeenCalledTimes(1);
      const event = seen.mock.calls[0][0] as MouseEvent;
      expect(event).toMatchObject({
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: 60,
        clientY: 30,
        defaultPrevented: true,
      });
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith({ x: 60, y: 30 }, region());
    });

    it.each(['touch', 'pen'] as const)('starts for a %s', pointerType => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown', { pointerType });
      advance(LONG_PRESS_DELAY);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it.each(['mouse', ''] as const)(
      'never starts for a pointer of type "%s"',
      pointerType => {
        const onOpen = jest.fn();
        render(<Region onOpen={onOpen} />);
        pointer(region(), 'pointerdown', { pointerType });
        advance(LONG_PRESS_DELAY * 2);
        expect(onOpen).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
      }
    );

    it('allows a move up to the tolerance', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown', { x: 20, y: 10 });
      pointer(region(), 'pointermove', { x: 26, y: 18 });
      expect(Math.hypot(6, 8)).toBe(LONG_PRESS_TOLERANCE);
      advance(LONG_PRESS_DELAY);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it.each([
      [
        'a move past the tolerance',
        () => pointer(region(), 'pointermove', { x: 27, y: 18 }),
      ],
      ['lifting', () => pointer(region(), 'pointerup')],
      ['pointercancel', () => pointer(region(), 'pointercancel')],
      [
        'another pointer coming down',
        () => pointer(region(), 'pointerdown', { pointerId: 2 }),
      ],
      [
        'another pointer coming down anywhere in the document',
        () => pointer(document.body, 'pointerdown', { pointerId: 2 }),
      ],
      [
        'a mouse button going down',
        () =>
          pointer(document.body, 'pointerdown', {
            pointerType: 'mouse',
            pointerId: 2,
          }),
      ],
    ])('is cancelled by %s', (_, interrupt) => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown', { x: 20, y: 10 });
      interrupt();
      advance(LONG_PRESS_DELAY * 2);
      expect(onOpen).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('ignores the movement, lifting and cancelling of another pointer', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown', { pointerId: 1 });
      pointer(region(), 'pointermove', { pointerId: 2, x: 300 });
      pointer(region(), 'pointerup', { pointerId: 2 });
      pointer(region(), 'pointercancel', { pointerId: 2 });
      advance(LONG_PRESS_DELAY);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('ignores movement once it has opened', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      pointer(region(), 'pointermove', { x: 300 });
      expect(contextMenu(region())).toBe(false);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('asks once when the browser fires its own contextmenu during the hold', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown', { x: 20, y: 10 });
      advance(100);
      expect(contextMenu(region(), 22, 12)).toBe(false);
      expect(onOpen).toHaveBeenCalledWith({ x: 22, y: 12 }, region());
      advance(LONG_PRESS_DELAY);
      expect(contextMenu(region(), 22, 12)).toBe(false);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('prevents the end of the touch that opened it, and only that one', () => {
      render(<Region />);
      pointer(region(), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      pointer(region(), 'pointerup');
      expect(fireEvent.touchEnd(region())).toBe(false);
      expect(fireEvent.touchEnd(region())).toBe(true);

      // A press that the browser's contextmenu opened counts as well.
      pointer(region(), 'pointerdown');
      contextMenu(region());
      pointer(region(), 'pointerup');
      expect(fireEvent.touchEnd(region())).toBe(false);

      // A press that opened nothing, after one that did, doesn't.
      pointer(region(), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      pointer(region(), 'pointerdown', { pointerId: 2 });
      pointer(region(), 'pointerdown');
      pointer(region(), 'pointerup');
      expect(fireEvent.touchEnd(region())).toBe(true);
    });

    it('lets a touch end alone after a mouse right-click opened it', () => {
      render(<Region />);
      contextMenu(region());
      expect(fireEvent.touchEnd(region())).toBe(true);
    });

    it('stays closed when a handler before it prevents the contextmenu it fires', () => {
      const onOpen = jest.fn();
      render(
        <Region onOpen={onOpen}>
          <span onContextMenu={e => e.preventDefault()}>Mine</span>
        </Region>
      );
      pointer(screen.getByText('Mine'), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      expect(onOpen).not.toHaveBeenCalled();
      expect(fireEvent.touchEnd(screen.getByText('Mine'))).toBe(true);
    });

    it('goes to the innermost of nested triggers, and only it starts a timer', () => {
      const outer = jest.fn();
      const inner = jest.fn();
      render(
        <Region onOpen={outer} testId="outer">
          <Region onOpen={inner} testId="inner" />
        </Region>
      );
      pointer(region('inner'), 'pointerdown');
      expect(jest.getTimerCount()).toBe(1);
      advance(LONG_PRESS_DELAY);
      expect(inner).toHaveBeenCalledTimes(1);
      expect(outer).not.toHaveBeenCalled();
    });

    it('cancels the trigger around it too when another pointer comes down on the inner one', () => {
      const outer = jest.fn();
      const inner = jest.fn();
      render(
        <Region onOpen={outer} testId="outer">
          <Region onOpen={inner} testId="inner" />
        </Region>
      );
      pointer(region('inner'), 'pointerdown', { pointerId: 1 });
      pointer(region('inner'), 'pointerdown', { pointerId: 2 });
      advance(LONG_PRESS_DELAY * 2);
      expect(inner).not.toHaveBeenCalled();
      expect(outer).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('goes to the trigger around a disabled one', () => {
      const outer = jest.fn();
      render(
        <Region onOpen={outer} testId="outer">
          <Region disabled testId="inner" />
        </Region>
      );
      pointer(region('inner'), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      expect(outer).toHaveBeenCalledWith({ x: 20, y: 10 }, region('outer'));
    });

    it('starts nothing while disabled, and asks nothing once disabled turns on', () => {
      const onOpen = jest.fn();
      const { rerender } = render(<Region onOpen={onOpen} disabled />);
      pointer(region(), 'pointerdown');
      expect(jest.getTimerCount()).toBe(0);
      pointer(region(), 'pointerup');

      rerender(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown');
      rerender(<Region onOpen={onOpen} disabled />);
      advance(LONG_PRESS_DELAY);
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('ignores a press in content portaled out of the trigger', () => {
      const onOpen = jest.fn();
      render(<Region onOpen={onOpen} portaled={<p>Portaled</p>} />);
      pointer(screen.getByText('Portaled'), 'pointerdown');
      expect(jest.getTimerCount()).toBe(0);
    });

    it('opens neither of two sibling triggers held at once', () => {
      const first = jest.fn();
      const second = jest.fn();
      render(
        <>
          <Region onOpen={first} testId="first" />
          <Region onOpen={second} testId="second" />
        </>
      );
      pointer(region('first'), 'pointerdown', { pointerId: 1 });
      advance(100);
      pointer(region('second'), 'pointerdown', { pointerId: 2 });
      expect(jest.getTimerCount()).toBe(0);
      advance(LONG_PRESS_DELAY * 2);
      expect(first).not.toHaveBeenCalled();
      expect(second).not.toHaveBeenCalled();

      // Once both are up, a fresh press on either works again.
      pointer(region('first'), 'pointerup', { pointerId: 1 });
      pointer(region('second'), 'pointerup', { pointerId: 2 });
      pointer(region('second'), 'pointerdown', { pointerId: 3 });
      advance(LONG_PRESS_DELAY);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('listens on the document only while a finger is down', () => {
      const listen = jest.spyOn(document, 'addEventListener');
      const unlisten = jest.spyOn(document, 'removeEventListener');
      const presses = (spy: jest.SpyInstance) =>
        spy.mock.calls.filter(([type]) => type === 'pointerdown');
      render(<Region />);
      pointer(region(), 'pointerdown', { pointerType: 'mouse' });
      expect(presses(listen)).toHaveLength(0);

      pointer(region(), 'pointerdown');
      expect(presses(listen)).toEqual([
        ['pointerdown', expect.any(Function), true],
      ]);
      advance(LONG_PRESS_DELAY);
      // Still held after it opens, so a second finger then is heard too.
      expect(presses(unlisten)).toHaveLength(0);
      pointer(region(), 'pointerup');
      expect(presses(unlisten)).toEqual(presses(listen));
    });

    it('leaves no timer and no listener behind once it unmounts', () => {
      const unlisten = jest.spyOn(document, 'removeEventListener');
      const onOpen = jest.fn();
      const { unmount } = render(<Region onOpen={onOpen} />);
      pointer(region(), 'pointerdown');
      expect(jest.getTimerCount()).toBe(1);
      unmount();
      expect(jest.getTimerCount()).toBe(0);
      expect(
        unlisten.mock.calls.filter(([type]) => type === 'pointerdown')
      ).toHaveLength(1);
    });
  });
});
