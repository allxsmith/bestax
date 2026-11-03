import { fireEvent, render, screen } from '@testing-library/react';
import { lengthToPx, ResizeHandle } from '../resizeHandle';

/**
 * jsdom has no PointerEvent, so fireEvent's pointer events drop clientX. A
 * MouseEvent of the pointer type carries it, as Splitter's tests send.
 */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointerup',
  pointerId: number
) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  fireEvent(el, event);
};

/** Two handles, as two fingers can drag at once. */
function TwoHandles() {
  const handle = (label: string) => (
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
    />
  );
  return (
    <>
      {handle('First')}
      {handle('Second')}
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

  it('reads a length in pixels: a number, px or rem, and nothing else', () => {
    expect(lengthToPx(200, 16)).toBe(200);
    expect(lengthToPx('200px', 16)).toBe(200);
    expect(lengthToPx(' 12.5rem ', 16)).toBe(200);
    expect(lengthToPx('30vw', 16)).toBeNull();
    expect(lengthToPx(undefined, 16)).toBeNull();
  });
});
