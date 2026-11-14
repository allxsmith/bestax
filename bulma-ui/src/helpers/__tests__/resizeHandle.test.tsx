import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { lengthToPx, ResizeHandle } from '../resizeHandle';

/**
 * jsdom has no PointerEvent, so fireEvent's pointer events drop clientX. A
 * MouseEvent of the pointer type carries it, as Splitter's tests send.
 */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  pointerId: number,
  clientX = 0
) => {
  // The element's own window makes the event, so a handle in another
  // document gets one of its own.
  const view = el.ownerDocument.defaultView as Window & typeof globalThis;
  const event = new view.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
  });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  fireEvent(el, event);
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

  it('reads a length in pixels: a number, px or rem, and nothing else', () => {
    expect(lengthToPx(200, 16)).toBe(200);
    expect(lengthToPx('200px', 16)).toBe(200);
    expect(lengthToPx(' 12.5rem ', 16)).toBe(200);
    expect(lengthToPx('30vw', 16)).toBeNull();
    expect(lengthToPx(undefined, 16)).toBeNull();
  });
});
