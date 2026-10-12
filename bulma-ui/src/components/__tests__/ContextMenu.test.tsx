import React, { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextMenu, ContextMenuProps } from '../ContextMenu';
import { Dropdown, DropdownDivider, DropdownItem } from '../Dropdown';
import { Popover } from '../Popover';
import { Modal } from '../Modal';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import {
  LONG_PRESS_DELAY,
  LONG_PRESS_TOLERANCE,
} from '../../helpers/useContextMenuTrigger';

type PointerType = 'mouse' | 'pen' | 'touch';

/**
 * jsdom has no PointerEvent, so build a MouseEvent of the pointer type, from
 * the element's own window, and give it a `pointerType` and a `pointerId`;
 * React reads both off the native event.
 */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  {
    pointerType = 'touch',
    pointerId = 1,
    x = 100,
    y = 50,
    button = 0,
  }: {
    pointerType?: PointerType;
    pointerId?: number;
    x?: number;
    y?: number;
    button?: number;
  } = {}
) => {
  const view = el.ownerDocument.defaultView as typeof window;
  const event = new view.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    button,
  });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return fireEvent(el, event);
};

/** A `contextmenu` at a point, as the browser fires it. Returns false when prevented. */
const contextMenu = (el: Element, x = 100, y = 50) =>
  fireEvent.contextMenu(el, { clientX: x, clientY: y, button: 2 });

/** A right-click: the press, then the `contextmenu` that follows it. */
const rightClick = (el: Element, x = 100, y = 50) => {
  pointer(el, 'pointerdown', { pointerType: 'mouse', x, y, button: 2 });
  return contextMenu(el, x, y);
};

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

const rect = (r: {
  left: number;
  top: number;
  width: number;
  height: number;
}) =>
  ({
    ...r,
    right: r.left + r.width,
    bottom: r.top + r.height,
    x: r.left,
    y: r.top,
    toJSON: () => ({}),
  }) as DOMRect;

/**
 * Gives elements a layout, which jsdom has none of: the trigger region
 * covers the viewport, and the menu (`role="menu"`) is `menu` in size.
 */
const layout = ({
  menu = { width: 200, height: 150 },
  trigger = { left: 0, top: 0, width: 2000, height: 2000 },
}: {
  menu?: { width: number; height: number };
  trigger?: { left: number; top: number; width: number; height: number };
} = {}) =>
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      if (this.getAttribute('role') === 'menu') {
        return rect({ left: 0, top: 0, ...menu });
      }
      if (this.closest('[data-region]')) return rect(trigger);
      return rect({ left: 0, top: 0, width: 0, height: 0 });
    });

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
const originalWidth = window.innerWidth;
const originalHeight = window.innerHeight;

/** A file's row of actions, with a visible way in as well. */
const FileMenu: React.FC<
  Partial<ContextMenuProps> & { onRename?: () => void }
> = ({ onRename, trigger, ...props }) => (
  <ContextMenu
    aria-label="Actions for report.pdf"
    trigger={
      trigger ?? (
        <div data-region>
          report.pdf <button>Details</button>
        </div>
      )
    }
    {...props}
  >
    <ContextMenu.Item as="button" onClick={onRename}>
      Rename
    </ContextMenu.Item>
    <ContextMenu.Item as="button">Duplicate</ContextMenu.Item>
    <ContextMenu.Divider />
    <ContextMenu.Item as="button">Delete</ContextMenu.Item>
  </ContextMenu>
);

const region = () => document.querySelector('[data-region]') as HTMLElement;
const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
const box = () => menu()?.parentElement as HTMLElement;
const item = (name: string) =>
  within(document.body).getByRole('menuitem', { name });

beforeEach(() => {
  jest.useFakeTimers();
  layout();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  setViewport(originalWidth, originalHeight);
});

describe('ContextMenu', () => {
  describe('trigger', () => {
    it('clones the trigger rather than wrapping it, so a table row stays a row', () => {
      const ref = React.createRef<HTMLTableRowElement>();
      render(
        <table>
          <tbody>
            <ContextMenu
              aria-label="Actions"
              trigger={
                <tr className="file" ref={ref} data-region>
                  <td>report.pdf</td>
                </tr>
              }
            >
              <ContextMenu.Item>Rename</ContextMenu.Item>
            </ContextMenu>
          </tbody>
        </table>
      );
      const row = screen.getByRole('row');
      expect(row.parentElement?.tagName).toBe('TBODY');
      expect(row).toBe(ref.current);
      expect(row).toHaveClass('file', 'context-menu');

      rightClick(screen.getByText('report.pdf'));
      expect(menu()).toBeInTheDocument();
      expect(row.parentElement?.childElementCount).toBe(1);
    });

    it('gives the trigger no ARIA, role or tab stop', () => {
      render(<FileMenu />);
      rightClick(region());
      expect(menu()).toBeInTheDocument();
      for (const attr of [
        'aria-haspopup',
        'aria-expanded',
        'aria-controls',
        'role',
        'tabindex',
      ]) {
        expect(region()).not.toHaveAttribute(attr);
      }
    });

    it('renders nothing but the trigger while closed, and listens to nothing on the document', () => {
      const listen = jest.spyOn(document, 'addEventListener');
      const listenOnWindow = jest.spyOn(window, 'addEventListener');
      render(
        <>
          <FileMenu />
          <FileMenu />
        </>
      );
      expect(menu()).toBeNull();
      expect(listen).not.toHaveBeenCalled();
      expect(listenOnWindow).not.toHaveBeenCalled();
    });

    it('runs the trigger’s own handlers first', () => {
      const calls: string[] = [];
      const onOpenChange = jest.fn(() => calls.push('open'));
      render(
        <FileMenu
          onOpenChange={onOpenChange}
          trigger={
            <div
              data-region
              onContextMenu={() => calls.push('contextmenu')}
              onPointerDown={() => calls.push('pointerdown')}
              onPointerMove={() => calls.push('pointermove')}
              onPointerUp={() => calls.push('pointerup')}
              onPointerCancel={() => calls.push('pointercancel')}
              onTouchEnd={() => calls.push('touchend')}
            >
              report.pdf
            </div>
          }
        />
      );
      pointer(region(), 'pointerdown');
      pointer(region(), 'pointermove');
      pointer(region(), 'pointerup');
      pointer(region(), 'pointercancel');
      fireEvent.touchEnd(region());
      contextMenu(region());
      expect(calls).toEqual([
        'pointerdown',
        'pointermove',
        'pointerup',
        'pointercancel',
        'touchend',
        'contextmenu',
        'open',
      ]);
    });

    it('stays closed when the trigger’s own handler prevents the contextmenu', () => {
      const onOpenChange = jest.fn();
      render(
        <FileMenu
          onOpenChange={onOpenChange}
          trigger={
            <div data-region onContextMenu={e => e.preventDefault()}>
              report.pdf
            </div>
          }
        />
      );
      contextMenu(region());
      expect(menu()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('opening with contextmenu', () => {
    it('opens at the pointer on a right-click, and prevents the browser’s menu', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      expect(rightClick(region(), 120, 80)).toBe(false);
      expect(menu()).toBeInTheDocument();
      expect(box().style.left).toBe('120px');
      expect(box().style.top).toBe('80px');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('opens again at the new point on a right-click elsewhere on the trigger', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      rightClick(region(), 120, 80);
      rightClick(region(), 400, 200);
      expect(menu()).toBeInTheDocument();
      expect(box().style.left).toBe('400px');
      expect(box().style.top).toBe('200px');
      expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
    });

    it('moves an open menu to a contextmenu that comes without a press', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      contextMenu(region(), 120, 80);
      const first = menu();
      contextMenu(region(), 400, 200);
      expect(menu()).toBe(first);
      expect(box().style.left).toBe('400px');
      expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('opens from the keyboard at the event’s point when it is on the focused element, and at its bottom-left corner when it is not', () => {
      render(<FileMenu />);
      const details = screen.getByRole('button', { name: 'Details' });
      jest
        .spyOn(details, 'getBoundingClientRect')
        .mockReturnValue(rect({ left: 300, top: 20, width: 80, height: 30 }));
      details.focus();

      contextMenu(details, 310, 30);
      expect(box().style.left).toBe('310px');
      expect(box().style.top).toBe('30px');
      fireEvent.keyDown(menu()!, { key: 'Escape' });
      expect(details).toHaveFocus();

      contextMenu(details, 0, 0);
      expect(box().style.left).toBe('300px');
      expect(box().style.top).toBe('50px');
    });

    it('opens only the innermost of nested regions', () => {
      const outer = jest.fn();
      const inner = jest.fn();
      render(
        <ContextMenu
          aria-label="Board"
          onOpenChange={outer}
          trigger={
            <div data-region>
              Board
              <ContextMenu
                aria-label="Card"
                onOpenChange={inner}
                trigger={<div data-testid="card">Card</div>}
              >
                <ContextMenu.Item>Archive card</ContextMenu.Item>
              </ContextMenu>
            </div>
          }
        >
          <ContextMenu.Item>New card</ContextMenu.Item>
        </ContextMenu>
      );
      rightClick(screen.getByTestId('card'));
      expect(screen.getByRole('menu', { name: 'Card' })).toBeInTheDocument();
      expect(screen.queryByRole('menu', { name: 'Board' })).toBeNull();
      expect(outer).not.toHaveBeenCalled();

      rightClick(screen.getByText('Board'));
      expect(screen.queryByRole('menu', { name: 'Card' })).toBeNull();
      expect(screen.getByRole('menu', { name: 'Board' })).toBeInTheDocument();
      expect(inner.mock.calls).toEqual([[true], [false]]);
    });

    it('shows no browser menu and opens no other on a right-click on the open menu', () => {
      const outer = jest.fn();
      const onContextMenu = jest.fn();
      render(
        <div onContextMenu={onContextMenu}>
          <ContextMenu
            aria-label="Board"
            onOpenChange={outer}
            trigger={
              <div data-region>
                <ContextMenu
                  aria-label="Card"
                  trigger={<div data-testid="card">Card</div>}
                >
                  <ContextMenu.Item>Archive card</ContextMenu.Item>
                </ContextMenu>
              </div>
            }
          >
            <ContextMenu.Item>New card</ContextMenu.Item>
          </ContextMenu>
        </div>
      );
      contextMenu(screen.getByTestId('card'));
      onContextMenu.mockClear();
      const archive = item('Archive card');
      expect(rightClick(archive)).toBe(false);
      expect(screen.getByRole('menu', { name: 'Card' })).toBeInTheDocument();
      expect(screen.queryByRole('menu', { name: 'Board' })).toBeNull();
      expect(outer).not.toHaveBeenCalled();
      expect(onContextMenu).not.toHaveBeenCalled();
    });

    it('ignores a contextmenu from content portaled out of the trigger', () => {
      render(
        <FileMenu
          trigger={
            <div data-region>
              <Popover
                trigger={<button>Share</button>}
                ariaLabel="Share"
                appendToBody
                defaultOpen
              >
                <button>Copy link</button>
              </Popover>
            </div>
          }
        />
      );
      const copy = screen.getByRole('button', { name: 'Copy link' });
      expect(contextMenu(copy)).toBe(true);
      expect(menu()).toBeNull();
    });
  });

  describe('disabled', () => {
    it('leaves the browser’s menu alone and gives the trigger no class', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu disabled onOpenChange={onOpenChange} />);
      expect(region()).not.toHaveClass('context-menu');
      expect(rightClick(region())).toBe(true);
      expect(menu()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('ignores long presses', () => {
      render(<FileMenu disabled />);
      pointer(region(), 'pointerdown');
      advance(LONG_PRESS_DELAY * 2);
      expect(menu()).toBeNull();
    });

    it('closes an open menu when it turns on, and hands focus back', () => {
      const onOpenChange = jest.fn();
      const { rerender } = render(<FileMenu onOpenChange={onOpenChange} />);
      const details = screen.getByRole('button', { name: 'Details' });
      details.focus();
      contextMenu(details, 0, 0);
      expect(item('Rename')).toHaveFocus();

      rerender(<FileMenu onOpenChange={onOpenChange} disabled />);
      expect(menu()).toBeNull();
      expect(details).toHaveFocus();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);

      rerender(<FileMenu onOpenChange={onOpenChange} />);
      expect(menu()).toBeNull();
    });
  });

  describe('long press', () => {
    it('opens after a touch held still, at the touch point', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      pointer(region(), 'pointerdown', { x: 150, y: 90 });
      advance(LONG_PRESS_DELAY - 1);
      expect(menu()).toBeNull();
      advance(1);
      expect(menu()).toBeInTheDocument();
      expect(box().style.left).toBe('150px');
      expect(box().style.top).toBe('90px');
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('opens for a pen too', () => {
      render(<FileMenu />);
      pointer(region(), 'pointerdown', { pointerType: 'pen' });
      advance(LONG_PRESS_DELAY);
      expect(menu()).toBeInTheDocument();
    });

    it('never starts for a mouse', () => {
      render(<FileMenu />);
      pointer(region(), 'pointerdown', { pointerType: 'mouse' });
      advance(LONG_PRESS_DELAY * 2);
      expect(menu()).toBeNull();
    });

    it('allows a little movement, and cancels on more', () => {
      render(<FileMenu />);
      pointer(region(), 'pointerdown', { x: 100, y: 50 });
      pointer(region(), 'pointermove', {
        x: 100 + LONG_PRESS_TOLERANCE,
        y: 50,
      });
      advance(LONG_PRESS_DELAY);
      expect(menu()).toBeInTheDocument();
      fireEvent.keyDown(menu()!, { key: 'Escape' });
      pointer(region(), 'pointerup', { x: 100 + LONG_PRESS_TOLERANCE, y: 50 });

      pointer(region(), 'pointerdown', { x: 100, y: 50 });
      pointer(region(), 'pointermove', { x: 100, y: 50 + 11 });
      advance(LONG_PRESS_DELAY);
      expect(menu()).toBeNull();
    });

    it.each([
      ['lifting early', () => pointer(region(), 'pointerup', { pointerId: 1 })],
      [
        'pointercancel',
        () => pointer(region(), 'pointercancel', { pointerId: 1 }),
      ],
      [
        'a second touch',
        () => pointer(region(), 'pointerdown', { pointerId: 2 }),
      ],
    ])('is cancelled by %s', (_, interrupt) => {
      render(<FileMenu />);
      pointer(region(), 'pointerdown', { pointerId: 1 });
      advance(LONG_PRESS_DELAY - 100);
      interrupt();
      advance(LONG_PRESS_DELAY);
      expect(menu()).toBeNull();
    });

    it('ignores another pointer’s movement and lifting', () => {
      render(<FileMenu />);
      pointer(region(), 'pointerdown', { pointerId: 1 });
      pointer(region(), 'pointermove', { pointerId: 2, x: 400 });
      pointer(region(), 'pointerup', { pointerId: 2 });
      advance(LONG_PRESS_DELAY);
      expect(menu()).toBeInTheDocument();
    });

    it('opens once when the browser fires its own contextmenu during the hold', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      pointer(region(), 'pointerdown', { x: 150, y: 90 });
      advance(LONG_PRESS_DELAY - 100);
      expect(contextMenu(region(), 150, 90)).toBe(false);
      expect(menu()).toBeInTheDocument();
      advance(LONG_PRESS_DELAY);
      expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('opens once when the browser’s contextmenu comes after the hold opened it', () => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      pointer(region(), 'pointerdown', { x: 150, y: 90 });
      advance(LONG_PRESS_DELAY);
      const opened = menu();
      expect(contextMenu(region(), 150, 90)).toBe(false);
      expect(menu()).toBe(opened);
      expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('keeps lifting the finger after it opened from clicking what is under it', () => {
      const onClick = jest.fn();
      render(
        <FileMenu
          trigger={
            <div data-region onClick={onClick}>
              report.pdf
            </div>
          }
        />
      );
      pointer(region(), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      pointer(region(), 'pointerup');
      expect(fireEvent.touchEnd(region())).toBe(false);
      // Only the touch that opened it: the next one ends as it would anyway.
      pointer(region(), 'pointerdown');
      pointer(region(), 'pointerup');
      expect(fireEvent.touchEnd(region())).toBe(true);
    });

    it('lets a touch that opened nothing end as usual', () => {
      render(<FileMenu />);
      pointer(region(), 'pointerdown');
      advance(100);
      pointer(region(), 'pointerup');
      expect(fireEvent.touchEnd(region())).toBe(true);
    });

    it('stays closed when the trigger’s own handler prevents the contextmenu a long press fires', () => {
      render(
        <FileMenu
          trigger={
            <div data-region onContextMenu={e => e.preventDefault()}>
              report.pdf
            </div>
          }
        />
      );
      pointer(region(), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      expect(menu()).toBeNull();
    });

    it('opens only the innermost of nested regions', () => {
      render(
        <ContextMenu
          aria-label="Board"
          trigger={
            <div data-region>
              <ContextMenu
                aria-label="Card"
                trigger={<div data-testid="card">Card</div>}
              >
                <ContextMenu.Item>Archive card</ContextMenu.Item>
              </ContextMenu>
            </div>
          }
        >
          <ContextMenu.Item>New card</ContextMenu.Item>
        </ContextMenu>
      );
      pointer(screen.getByTestId('card'), 'pointerdown');
      advance(LONG_PRESS_DELAY);
      expect(screen.getByRole('menu', { name: 'Card' })).toBeInTheDocument();
      expect(screen.queryByRole('menu', { name: 'Board' })).toBeNull();
    });

    it('fires nothing after it unmounts', () => {
      const onOpenChange = jest.fn();
      const { unmount } = render(<FileMenu onOpenChange={onOpenChange} />);
      pointer(region(), 'pointerdown');
      const node = region();
      unmount();
      document.body.appendChild(node);
      try {
        advance(LONG_PRESS_DELAY * 2);
        expect(onOpenChange).not.toHaveBeenCalled();
      } finally {
        node.remove();
      }
    });
  });

  describe('placement', () => {
    it('hangs below and to the right of the point when there is room', () => {
      setViewport(1000, 800);
      render(<FileMenu />);
      contextMenu(region(), 100, 50);
      expect(box()).not.toHaveClass('is-up');
      expect(box()).not.toHaveClass('is-right');
      expect(box().style.left).toBe('100px');
      expect(box().style.top).toBe('50px');
    });

    it('flips above the point when there is no room below, and to its left when there is none on the right', () => {
      setViewport(1000, 800);
      render(<FileMenu />);
      contextMenu(region(), 900, 750);
      expect(box()).toHaveClass('is-up', 'is-right');
      expect(box().style.left).toBe('900px');
      expect(box().style.top).toBe('750px');
    });

    it('moves in until it is inside the viewport when it fits on neither side', () => {
      setViewport(300, 200);
      layout({ menu: { width: 250, height: 180 } });
      render(<FileMenu />);
      contextMenu(region(), 150, 100);
      expect(box()).not.toHaveClass('is-up');
      expect(box()).not.toHaveClass('is-right');
      expect(box().style.left).toBe('50px');
      expect(box().style.top).toBe('20px');
    });

    it('starts at the top of the viewport when it is taller than it', () => {
      setViewport(1000, 200);
      layout({ menu: { width: 200, height: 500 } });
      render(<FileMenu />);
      contextMenu(region(), 100, 100);
      expect(box().style.top).toBe('0px');
    });

    it('is measured once per opening, before anything else', () => {
      setViewport(1000, 800);
      const measure = layout();
      render(<FileMenu />);
      contextMenu(region(), 900, 750);
      const menuMeasures = () =>
        measure.mock.contexts.filter(el => el === menu()).length;
      expect(menuMeasures()).toBe(1);
      fireEvent.keyDown(menu()!, { key: 'ArrowDown' });
      expect(menuMeasures()).toBe(1);
    });
  });

  describe('focus', () => {
    it('moves to the first enabled item when it opens', () => {
      render(
        <ContextMenu aria-label="Actions" trigger={<div data-region>Row</div>}>
          <ContextMenu.Item as="button" disabled>
            Cut
          </ContextMenu.Item>
          <ContextMenu.Item aria-disabled="true">Copy</ContextMenu.Item>
          <ContextMenu.Item>Paste</ContextMenu.Item>
        </ContextMenu>
      );
      contextMenu(region());
      expect(item('Paste')).toHaveFocus();
    });

    it('moves to the menu when no item is enabled', () => {
      render(
        <ContextMenu aria-label="Actions" trigger={<div data-region>Row</div>}>
          <ContextMenu.Item as="button" disabled>
            Cut
          </ContextMenu.Item>
        </ContextMenu>
      );
      contextMenu(region());
      expect(menu()).toHaveFocus();
    });

    it.each(['Escape', 'Tab'])(
      'closes on %s, handing focus back to what had it',
      key => {
        const onOpenChange = jest.fn();
        render(<FileMenu onOpenChange={onOpenChange} />);
        const details = screen.getByRole('button', { name: 'Details' });
        details.focus();
        contextMenu(details, 0, 0);
        expect(item('Rename')).toHaveFocus();
        expect(fireEvent.keyDown(item('Rename'), { key })).toBe(false);
        expect(menu()).toBeNull();
        expect(details).toHaveFocus();
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
      }
    );

    it('closes on Shift+Tab too', () => {
      render(<FileMenu />);
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'Tab', shiftKey: true });
      expect(menu()).toBeNull();
    });

    it('hands focus back after an item runs', () => {
      const onRename = jest.fn();
      render(<FileMenu onRename={onRename} />);
      const details = screen.getByRole('button', { name: 'Details' });
      details.focus();
      contextMenu(details, 0, 0);
      fireEvent.click(item('Rename'));
      expect(onRename).toHaveBeenCalledTimes(1);
      expect(menu()).toBeNull();
      expect(details).toHaveFocus();
    });

    it('leaves focus where an item put it', () => {
      const Rename = () => {
        const [renaming, setRenaming] = useState(false);
        return (
          <>
            <FileMenu onRename={() => setRenaming(true)} />
            {renaming && <input aria-label="New name" autoFocus />}
          </>
        );
      };
      render(<Rename />);
      const details = screen.getByRole('button', { name: 'Details' });
      details.focus();
      contextMenu(details, 0, 0);
      fireEvent.click(item('Rename'));
      expect(menu()).toBeNull();
      expect(screen.getByRole('textbox', { name: 'New name' })).toHaveFocus();
    });

    it('leaves focus in a Modal an item opens', () => {
      const WithModal = () => {
        const [open, setOpen] = useState(false);
        return (
          <>
            <FileMenu onRename={() => setOpen(true)} />
            <Modal active={open} onClose={() => setOpen(false)}>
              <button>Save name</button>
            </Modal>
          </>
        );
      };
      render(<WithModal />);
      const details = screen.getByRole('button', { name: 'Details' });
      details.focus();
      contextMenu(details, 0, 0);
      fireEvent.click(item('Rename'));
      expect(menu()).toBeNull();
      expect(screen.getByRole('button', { name: 'Save name' })).toHaveFocus();
    });

    it('keeps what had focus before the first opening when it opens again at a new point', () => {
      render(<FileMenu />);
      const details = screen.getByRole('button', { name: 'Details' });
      details.focus();
      contextMenu(details, 0, 0);
      expect(item('Rename')).toHaveFocus();
      contextMenu(region(), 400, 200);
      fireEvent.keyDown(item('Rename'), { key: 'Escape' });
      expect(details).toHaveFocus();
    });

    it('hands focus back when a press outside closes it with focus still inside', () => {
      render(
        <>
          <FileMenu />
          <p>Elsewhere</p>
        </>
      );
      const details = screen.getByRole('button', { name: 'Details' });
      details.focus();
      contextMenu(details, 0, 0);
      pointer(screen.getByText('Elsewhere'), 'pointerdown', {
        pointerType: 'mouse',
      });
      expect(menu()).toBeNull();
      expect(details).toHaveFocus();
    });
  });

  describe('keys in the menu', () => {
    const Menu = ({ onDiv = jest.fn(), onLink = jest.fn() }) => (
      <ContextMenu aria-label="Actions" trigger={<div data-region>Row</div>}>
        <ContextMenu.Item as="button">Rename</ContextMenu.Item>
        <ContextMenu.Item as="button" disabled>
          Move
        </ContextMenu.Item>
        <ContextMenu.Item href="#download" onClick={onLink}>
          Download
        </ContextMenu.Item>
        <ContextMenu.Item as="div" onClick={onDiv}>
          Delete
        </ContextMenu.Item>
      </ContextMenu>
    );

    it('moves with the arrows, wrapping and skipping disabled items, and jumps with Home and End', () => {
      render(<Menu />);
      contextMenu(region());
      const keyDown = (key: string) =>
        fireEvent.keyDown(document.activeElement!, { key });
      expect(item('Rename')).toHaveFocus();
      keyDown('ArrowDown');
      expect(item('Download')).toHaveFocus();
      keyDown('ArrowDown');
      keyDown('ArrowDown');
      expect(item('Rename')).toHaveFocus();
      keyDown('ArrowUp');
      expect(item('Delete')).toHaveFocus();
      keyDown('Home');
      expect(item('Rename')).toHaveFocus();
      keyDown('End');
      expect(item('Delete')).toHaveFocus();
    });

    it('moves to the next item whose text starts with what is typed', () => {
      render(<Menu />);
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'd' });
      expect(item('Download')).toHaveFocus();
      fireEvent.keyDown(item('Download'), { key: 'd' });
      expect(item('Delete')).toHaveFocus();
      // Move is disabled, so typing its letter goes nowhere.
      advance(500);
      fireEvent.keyDown(item('Delete'), { key: 'm' });
      expect(item('Delete')).toHaveFocus();
    });

    it('activates a div item on Enter and Space once each, and closes', () => {
      const onDiv = jest.fn();
      render(<Menu onDiv={onDiv} />);
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'End' });
      expect(fireEvent.keyDown(item('Delete'), { key: 'Enter' })).toBe(false);
      expect(onDiv).toHaveBeenCalledTimes(1);
      expect(menu()).toBeNull();

      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'End' });
      fireEvent.keyDown(item('Delete'), { key: ' ' });
      expect(onDiv).toHaveBeenCalledTimes(2);
      expect(menu()).toBeNull();
    });

    it('activates a link on Space and leaves its Enter to the browser', () => {
      const onLink = jest.fn();
      render(<Menu onLink={onLink} />);
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'ArrowDown' });
      expect(fireEvent.keyDown(item('Download'), { key: 'Enter' })).toBe(true);
      expect(onLink).not.toHaveBeenCalled();
      fireEvent.keyDown(item('Download'), { key: ' ' });
      expect(onLink).toHaveBeenCalledTimes(1);
      expect(menu()).toBeNull();
    });

    it('leaves a button’s Enter and Space to the browser', () => {
      render(<Menu />);
      contextMenu(region());
      expect(fireEvent.keyDown(item('Rename'), { key: 'Enter' })).toBe(true);
      expect(fireEvent.keyDown(item('Rename'), { key: ' ' })).toBe(true);
      expect(menu()).toBeInTheDocument();
    });

    it('activates once for a held key', () => {
      const onDiv = jest.fn();
      render(
        <ContextMenu
          aria-label="Actions"
          closeOnClick={false}
          trigger={<div data-region>Row</div>}
        >
          <ContextMenu.Item as="div" role="menuitemcheckbox" onClick={onDiv}>
            Show hidden files
          </ContextMenu.Item>
          <ContextMenu.Item as="button">Rename</ContextMenu.Item>
        </ContextMenu>
      );
      contextMenu(region());
      const show = within(document.body).getByRole('menuitemcheckbox');
      fireEvent.keyDown(show, { key: 'Enter' });
      fireEvent.keyDown(show, { key: 'Enter', repeat: true });
      fireEvent.keyDown(show, { key: 'Enter', repeat: true });
      expect(onDiv).toHaveBeenCalledTimes(1);
      // The browser clicks a button on each Enter keydown, so a repeat is
      // stopped before it gets there.
      fireEvent.keyDown(show, { key: 'ArrowDown' });
      expect(
        fireEvent.keyDown(item('Rename'), { key: 'Enter', repeat: true })
      ).toBe(false);
    });

    it('keeps its keys from the tree around it', () => {
      const onKeyDown = jest.fn();
      render(
        <div onKeyDown={onKeyDown}>
          <Menu />
        </div>
      );
      contextMenu(region());
      for (const key of ['ArrowDown', 'Home', 'd', 'Enter', 'Escape']) {
        fireEvent.keyDown(document.activeElement!, { key });
      }
      expect(onKeyDown).not.toHaveBeenCalled();
    });
  });

  describe('closing', () => {
    it('closes when an item is clicked, and stays open with closeOnClick off', () => {
      const { rerender } = render(<FileMenu />);
      contextMenu(region());
      fireEvent.click(item('Duplicate'));
      expect(menu()).toBeNull();

      rerender(<FileMenu closeOnClick={false} />);
      contextMenu(region());
      fireEvent.click(item('Duplicate'));
      expect(menu()).toBeInTheDocument();
    });

    it('stays open for a click on a divider, between items, or on a disabled item', () => {
      render(
        <ContextMenu aria-label="Actions" trigger={<div data-region>Row</div>}>
          <ContextMenu.Item>Rename</ContextMenu.Item>
          <ContextMenu.Divider />
          <ContextMenu.Item aria-disabled="true">Move</ContextMenu.Item>
        </ContextMenu>
      );
      contextMenu(region());
      fireEvent.click(within(document.body).getByRole('separator'));
      fireEvent.click(menu()!.firstElementChild!);
      fireEvent.click(menu()!);
      fireEvent.click(item('Move'));
      expect(menu()).toBeInTheDocument();
    });

    it('closes on a press outside, which goes on to do what it does', () => {
      const onPointerDown = jest.fn();
      render(
        <>
          <FileMenu />
          <button onPointerDown={onPointerDown}>Elsewhere</button>
        </>
      );
      contextMenu(region());
      pointer(item('Rename'), 'pointerdown', { pointerType: 'mouse' });
      expect(menu()).toBeInTheDocument();
      pointer(
        screen.getByRole('button', { name: 'Elsewhere' }),
        'pointerdown',
        {
          pointerType: 'mouse',
        }
      );
      expect(menu()).toBeNull();
      expect(onPointerDown).toHaveBeenCalled();
    });

    it('closes on a press outside that something stops on its way', () => {
      render(
        <>
          <FileMenu />
          <button onPointerDown={e => e.stopPropagation()}>Elsewhere</button>
        </>
      );
      contextMenu(region());
      pointer(
        screen.getByRole('button', { name: 'Elsewhere' }),
        'pointerdown',
        {
          pointerType: 'mouse',
        }
      );
      expect(menu()).toBeNull();
    });

    it('closes on a scroll outside the menu, and not on one inside it', () => {
      render(<FileMenu />);
      contextMenu(region());
      fireEvent.scroll(menu()!.firstElementChild!);
      expect(menu()).toBeInTheDocument();
      fireEvent.scroll(document);
      expect(menu()).toBeNull();
    });

    it.each([
      ['resizing the window', () => fireEvent(window, new Event('resize'))],
      ['the window losing focus', () => fireEvent(window, new Event('blur'))],
    ])('closes on %s', (_, happen) => {
      const onOpenChange = jest.fn();
      render(<FileMenu onOpenChange={onOpenChange} />);
      contextMenu(region());
      happen();
      expect(menu()).toBeNull();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('stops listening once it closes', () => {
      const unlisten = jest.spyOn(document, 'removeEventListener');
      const unlistenOnWindow = jest.spyOn(window, 'removeEventListener');
      render(<FileMenu />);
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'Escape' });
      const types = [
        ...unlisten.mock.calls,
        ...unlistenOnWindow.mock.calls,
      ].map(([type]) => type);
      expect(types).toEqual(
        expect.arrayContaining(['pointerdown', 'scroll', 'resize', 'blur'])
      );
    });

    it('closes only the menu on Escape inside an open Popover, and a press in the menu leaves the Popover open', () => {
      render(
        <Popover trigger={<button>Files</button>} ariaLabel="Files" defaultOpen>
          <FileMenu />
        </Popover>
      );
      contextMenu(region());
      pointer(item('Rename'), 'pointerdown', { pointerType: 'mouse' });
      expect(screen.getByRole('dialog', { name: 'Files' })).toBeInTheDocument();

      fireEvent.keyDown(item('Rename'), { key: 'Escape' });
      expect(menu()).toBeNull();
      expect(screen.getByRole('dialog', { name: 'Files' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Details' })).toBeTruthy();

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Files' })).toBeNull();
    });

    it('closes only the menu on Escape inside an open Modal', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          <FileMenu />
        </Modal>
      );
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'Escape' });
      expect(menu()).toBeNull();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('fires nothing after it unmounts, open or not', () => {
      const onOpenChange = jest.fn();
      const { unmount } = render(<FileMenu onOpenChange={onOpenChange} />);
      contextMenu(region());
      onOpenChange.mockClear();
      unmount();
      fireEvent(window, new Event('resize'));
      pointer(document.body, 'pointerdown', { pointerType: 'mouse' });
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    afterEach(() => {
      resetDevWarnings();
    });

    it('is a named menu of menuitems, with the divider a separator', () => {
      render(<FileMenu />);
      contextMenu(region());
      const opened = within(document.body).getByRole('menu', {
        name: 'Actions for report.pdf',
      });
      expect(opened).toHaveAttribute('tabindex', '-1');
      expect(within(opened).getAllByRole('menuitem')).toHaveLength(3);
      expect(within(opened).getByRole('separator').tagName).toBe('HR');
    });

    it('warns once in development when it opens without a name', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <ContextMenu trigger={<div data-region>Row</div>}>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu>
      );
      expect(warn).not.toHaveBeenCalled();
      contextMenu(region());
      fireEvent.keyDown(item('Rename'), { key: 'Escape' });
      contextMenu(region());
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Pass aria-label or aria-labelledby')
      );
    });

    it('does not warn for a menu named by aria-labelledby', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <h2 id="file-title">report.pdf</h2>
          <ContextMenu
            aria-labelledby="file-title"
            trigger={<div data-region>Row</div>}
          >
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu>
        </>
      );
      contextMenu(region());
      expect(warn).not.toHaveBeenCalled();
      expect(
        within(document.body).getByRole('menu', { name: 'report.pdf' })
      ).toBeInTheDocument();
    });
  });

  describe('props and classes', () => {
    it('puts className, id, helper props and attributes on the menu, and runs its handlers too', () => {
      const onKeyDown = jest.fn();
      const onClick = jest.fn();
      const onContextMenu = jest.fn();
      render(
        <FileMenu
          className="file-actions"
          id="file-actions"
          m="2"
          data-testid="menu"
          onKeyDown={onKeyDown}
          onClick={onClick}
          onContextMenu={onContextMenu}
        />
      );
      contextMenu(region());
      const opened = screen.getByTestId('menu');
      expect(opened).toBe(menu());
      expect(opened).toHaveAttribute('id', 'file-actions');
      expect(opened).toHaveClass('dropdown-menu', 'file-actions', 'm-2');
      expect(region()).not.toHaveClass('file-actions');
      fireEvent.keyDown(item('Rename'), { key: 'ArrowDown' });
      contextMenu(item('Duplicate'));
      fireEvent.click(item('Duplicate'));
      expect(onKeyDown).toHaveBeenCalled();
      expect(onContextMenu).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalled();
    });

    it('is a zero-size dropdown box at the point, holding Dropdown’s menu markup', () => {
      render(<FileMenu />);
      contextMenu(region());
      expect(box()).toHaveClass(
        'dropdown',
        'is-active',
        'context-menu-content'
      );
      expect(menu()).toHaveClass('dropdown-menu');
      expect(menu()!.firstElementChild).toHaveClass('dropdown-content');
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      setViewport(1000, 800);
      render(
        <ConfigProvider classPrefix="bestax-">
          <FileMenu m="1" />
        </ConfigProvider>
      );
      expect(region()).toHaveClass('bestax-context-menu');
      expect(region()).not.toHaveClass('context-menu');
      contextMenu(region(), 900, 750);
      expect(box()).toHaveClass(
        'bestax-dropdown',
        'bestax-context-menu-content',
        'bestax-is-active',
        'bestax-is-up',
        'bestax-is-right'
      );
      expect(menu()).toHaveClass('bestax-dropdown-menu', 'bestax-m-1');
      expect(menu()!.firstElementChild).toHaveClass('bestax-dropdown-content');
      expect(item('Rename')).toHaveClass('bestax-dropdown-item');
      expect(within(document.body).getByRole('separator')).toHaveClass(
        'bestax-dropdown-divider'
      );
      const unprefixed = Array.from(
        document.body.querySelectorAll('[class]')
      ).flatMap(el =>
        Array.from(el.classList).filter(cls => !cls.startsWith('bestax-'))
      );
      expect(unprefixed).toEqual([]);
    });
  });

  describe('portal', () => {
    it('renders into document.body by default', () => {
      const { container } = render(<FileMenu />);
      contextMenu(region());
      expect(box().parentElement).toBe(document.body);
      expect(container.contains(menu())).toBe(false);
    });

    it('renders into the portalContainer a ConfigProvider sets', () => {
      const Host = () => {
        const [target, setTarget] = useState<HTMLElement | null>(null);
        return (
          <>
            <div data-testid="overlays" ref={setTarget} />
            {target && (
              <ConfigProvider portalContainer={target}>
                <FileMenu />
              </ConfigProvider>
            )}
          </>
        );
      };
      render(<Host />);
      contextMenu(region());
      expect(box().parentElement).toBe(screen.getByTestId('overlays'));
    });
  });

  describe('Compound components', () => {
    it('attaches Dropdown’s own Item and Divider', () => {
      expect(ContextMenu.Item).toBe(DropdownItem);
      expect(ContextMenu.Divider).toBe(DropdownDivider);
      expect(ContextMenu.Item).toBe(Dropdown.Item);
      expect(ContextMenu.Divider).toBe(Dropdown.Divider);
    });

    it('renders the dot-path items in the menu', () => {
      render(
        <ContextMenu aria-label="Actions" trigger={<div data-region>Row</div>}>
          <ContextMenu.Item>Rename</ContextMenu.Item>
          <ContextMenu.Divider />
          <ContextMenu.Item>Delete</ContextMenu.Item>
        </ContextMenu>
      );
      contextMenu(region());
      expect(item('Rename')).toHaveClass('dropdown-item');
      expect(within(document.body).getByRole('separator')).toHaveClass(
        'dropdown-divider'
      );
    });
  });

  describe('hydration', () => {
    it('server-renders the trigger alone and opens after hydration without a mismatch', async () => {
      const container = document.createElement('div');
      const ui = <FileMenu />;
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
      try {
        expect(serverHtml).not.toContain('role="menu"');
        expect(serverHtml).not.toContain('dropdown');
        expect(serverHtml).toContain('class="context-menu"');
        expect(errorSpy).not.toHaveBeenCalled();
        contextMenu(region());
        expect(menu()).toBeInTheDocument();
      } finally {
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });
});
