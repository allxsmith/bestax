import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ResizeHandle } from '../resizeHandle';

/** A pointer event for one pointer, at `clientX`. */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  pointerId: number,
  clientX = 0
) => {
  // The element's own window makes the event, so a handle in another
  // document gets one of its own.
  const view = el.ownerDocument.defaultView as Window & typeof globalThis;
  fireEvent(
    el,
    new view.PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      pointerId,
    })
  );
};

/** A handle, with whatever of its callbacks a test watches. */
const Handle = ({
  label = 'Handle',
  ...props
}: Partial<ComponentProps<typeof ResizeHandle>>) => (
  <ResizeHandle
    className="handle"
    activeClass="is-active"
    orientation="vertical"
    valueNow={50}
    valueMin={0}
    valueMax={100}
    label={label}
    rtl={() => false}
    onDragStart={() => true}
    onDrag={() => {}}
    onStep={() => {}}
    onHome={() => {}}
    onEnd={() => {}}
    onEnter={() => {}}
    onReset={() => {}}
    {...props}
  />
);

/** Two handles, as two fingers can drag at once. */
function TwoHandles() {
  return (
    <>
      <Handle label="First" />
      <Handle label="Second" />
    </>
  );
}

describe('ResizeHandle', () => {
  const body = document.body.style;

  afterEach(() => {
    body.cursor = '';
    body.userSelect = '';
  });

  it('mirrors a line between parts side by side right to left, and not a line between stacked ones', () => {
    const onStep = vi.fn();
    const onDrag = vi.fn();
    const rtl = vi.fn(() => true);
    const { rerender } = render(
      <Handle rtl={rtl} onStep={onStep} onDrag={onDrag} />
    );
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });
    expect(onStep).toHaveBeenLastCalledWith(-1);
    rerender(
      <Handle
        orientation="horizontal"
        rtl={rtl}
        onStep={onStep}
        onDrag={onDrag}
      />
    );
    const handle = screen.getByRole('separator');
    rtl.mockClear();
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onStep).toHaveBeenLastCalledWith(1);
    const at = (type: string, clientY: number) =>
      fireEvent(
        handle,
        new PointerEvent(type, { bubbles: true, clientY, pointerId: 1 })
      );
    at('pointerdown', 100);
    at('pointermove', 110);
    expect(onDrag).toHaveBeenLastCalledWith(10);
    at('pointerup', 110);
    // Up and down don't depend on the page's direction.
    expect(rtl).not.toHaveBeenCalled();
  });

  it.each([
    ['in the order they started', ['First', 'Second']],
    ['in the other order', ['Second', 'First']],
  ])(
    'puts the page back once two drags at once have both ended, %s',
    (_label, endOrder) => {
      body.cursor = 'wait';
      body.userSelect = 'text';
      render(<TwoHandles />);
      const byName = (name: string) => screen.getByRole('separator', { name });
      pointer(byName('First'), 'pointerdown', 1);
      pointer(byName('Second'), 'pointerdown', 2);
      expect(body.cursor).toBe('col-resize');
      expect(body.userSelect).toBe('none');
      pointer(
        byName(endOrder[0]),
        'pointerup',
        endOrder[0] === 'First' ? 1 : 2
      );
      // One still holds the page.
      expect(body.userSelect).toBe('none');
      pointer(
        byName(endOrder[1]),
        'pointerup',
        endOrder[1] === 'First' ? 1 : 2
      );
      expect(body.cursor).toBe('wait');
      expect(body.userSelect).toBe('text');
    }
  );

  it('moves and ends a drag only by the pointer that started it', () => {
    const onDragStart = vi.fn(() => true);
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    render(
      <Handle onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
    );
    const handle = screen.getByRole('separator');
    pointer(handle, 'pointerdown', 1, 100);
    // A second finger on the same handle starts nothing.
    pointer(handle, 'pointerdown', 2, 300);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    pointer(handle, 'pointermove', 2, 350);
    expect(onDrag).not.toHaveBeenCalled();
    pointer(handle, 'pointermove', 1, 120);
    expect(onDrag).toHaveBeenLastCalledWith(20);
    pointer(handle, 'pointerup', 2, 350);
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(handle).toHaveClass('is-active');
    pointer(handle, 'pointerup', 1, 120);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(handle).not.toHaveClass('is-active');
  });

  it('holds the page of its own document', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const inner = frame.contentDocument!;
    inner.body.style.cursor = 'wait';
    const view = render(<Handle />, {
      container: inner.body.appendChild(inner.createElement('div')),
    });
    const handle = view.getByRole('separator');
    pointer(handle, 'pointerdown', 1);
    expect(inner.body.style.cursor).toBe('col-resize');
    expect(inner.body.style.userSelect).toBe('none');
    // The outer page is not the one being dragged in.
    expect(body.cursor).toBe('');
    pointer(handle, 'pointerup', 1);
    expect(inner.body.style.cursor).toBe('wait');
    expect(inner.body.style.userSelect).toBe('');
    view.unmount();
    frame.remove();
  });

  it('ends a drag it is taken away in the middle of', () => {
    const onDragEnd = vi.fn();
    body.cursor = 'wait';
    const view = render(<Handle onDragEnd={onDragEnd} />);
    pointer(screen.getByRole('separator'), 'pointerdown', 1);
    view.rerender(<></>);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(body.cursor).toBe('wait');
  });
});

describe('ResizeHandle buttons', () => {
  const buttons = {
    className: 'buttons',
    groupClass: 'buttons-group',
    buttonClass: 'button',
    start: 'Back',
    end: 'On',
  };
  /** The way a button's chevrons point, from the first one's points. */
  const pointsOf = (button: HTMLElement) =>
    button.querySelector('polyline')!.getAttribute('points');
  const PREV = '15 18 9 12 15 6';
  const NEXT = '9 18 15 12 9 6';
  const PREV_TWICE = '11 17 6 12 11 7';
  const NEXT_TWICE = '13 17 18 12 13 7';

  it('has none without buttons', () => {
    render(<Handle />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('puts them after the separator, not in it, named and controlling what it resizes', () => {
    const { container } = render(<Handle controls="pane" buttons={buttons} />);
    const separator = screen.getByRole('separator');
    expect(separator).toBeEmptyDOMElement();
    const box = separator.nextElementSibling as HTMLElement;
    expect(box).toHaveClass('buttons');
    expect(container.children).toHaveLength(2);
    const [back, on] = screen.getAllByRole('button');
    expect(back).toHaveAccessibleName('Back');
    expect(on).toHaveAccessibleName('On');
    for (const button of [back, on]) {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('button');
      expect(button).toHaveAttribute('aria-controls', 'pane');
      expect(box).toContainElement(button);
    }
    // One in each half, around the middle, pointing the way each moves.
    const halves = box.querySelectorAll(':scope > .buttons-group');
    expect(halves).toHaveLength(2);
    expect(halves[0]).toContainElement(back);
    expect(halves[1]).toContainElement(on);
    expect(pointsOf(back)).toBe(PREV);
    expect(pointsOf(on)).toBe(NEXT);
  });

  it('takes an arrow key’s step back or on with a click, ten times as far with Shift, either way the page reads', () => {
    const onStep = vi.fn();
    const rtl = vi.fn(() => true);
    render(<Handle onStep={onStep} rtl={rtl} buttons={buttons} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByRole('button', { name: 'On' }));
    expect(onStep).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }), {
      shiftKey: true,
    });
    expect(onStep).toHaveBeenLastCalledWith(-10);
    fireEvent.click(screen.getByRole('button', { name: 'On' }), {
      shiftKey: true,
    });
    expect(onStep).toHaveBeenLastCalledWith(10);
    // A step toward the start is back right to left too.
    expect(rtl).not.toHaveBeenCalled();
  });

  it.each([
    ['start', false, 0, PREV_TWICE],
    ['start', true, 0, NEXT_TWICE],
    ['end', false, 1, NEXT_TWICE],
    ['end', true, 1, PREV_TWICE],
  ] as const)(
    'puts the toggle at the outer end of the %s half (collapsed: %s), pointing the way it moves the line',
    (side, collapsed, half, points) => {
      const onEnter = vi.fn();
      const { container } = render(
        <Handle
          onEnter={onEnter}
          buttons={{ ...buttons, toggle: { name: 'Shut', side, collapsed } }}
        />
      );
      const toggle = screen.getByRole('button', { name: 'Shut' });
      expect(toggle).toHaveAttribute(
        'aria-expanded',
        collapsed ? 'false' : 'true'
      );
      const group = container.querySelectorAll('.buttons-group')[half];
      expect(
        half === 0 ? group.firstElementChild : group.lastElementChild
      ).toBe(toggle);
      expect(group.children).toHaveLength(2);
      expect(pointsOf(toggle)).toBe(points);
      fireEvent.click(toggle);
      expect(onEnter).toHaveBeenCalledTimes(1);
    }
  );

  it('reads what the steps measure from as a button takes focus or is pressed', () => {
    const onFocus = vi.fn();
    render(<Handle onFocus={onFocus} buttons={buttons} />);
    const on = screen.getByRole('button', { name: 'On' });
    fireEvent.focus(on);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(on);
    expect(onFocus).toHaveBeenCalledTimes(2);
  });

  it('hands focus to the separator when the buttons go while one has it', () => {
    const { rerender } = render(<Handle buttons={buttons} />);
    screen.getByRole('button', { name: 'On' }).focus();
    rerender(<Handle />);
    expect(screen.getByRole('separator')).toHaveFocus();
    // Focus elsewhere stays where it is.
    rerender(<Handle buttons={buttons} />);
    const outside = document.body.appendChild(document.createElement('input'));
    outside.focus();
    rerender(<Handle />);
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('hands focus to the separator in a shadow root too', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const shadow = host.attachShadow({ mode: 'open' });
    const container = shadow.appendChild(document.createElement('div'));
    const view = render(<Handle buttons={buttons} />, { container });
    shadow.querySelector<HTMLElement>('button')!.focus();
    view.rerender(<Handle />);
    expect(shadow.activeElement).toBe(
      shadow.querySelector('[role="separator"]')
    );
    view.unmount();
    host.remove();
  });

  it('keeps the separator, and its focus, as the buttons come and go', () => {
    const { rerender } = render(<Handle buttons={buttons} />);
    const separator = screen.getByRole('separator');
    separator.focus();
    rerender(<Handle />);
    expect(screen.getByRole('separator')).toBe(separator);
    expect(separator).toHaveFocus();
    rerender(<Handle buttons={buttons} />);
    expect(screen.getByRole('separator')).toBe(separator);
    expect(separator).toHaveFocus();
  });
});
