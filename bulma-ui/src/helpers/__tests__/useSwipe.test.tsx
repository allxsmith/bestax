import { fireEvent, render, screen } from '@testing-library/react';
import { useSwipe, type UseSwipeOptions } from '../useSwipe';

function Surface(props: UseSwipeOptions) {
  const swipe = useSwipe<HTMLDivElement>(props);
  return (
    <>
      <div data-testid="surface" {...swipe.handlers}>
        {swipe.isSwiping ? 'swiping' : 'idle'} {swipe.offsetX},{swipe.offsetY}
      </div>
      <button type="button" onClick={swipe.cancel}>
        Cancel
      </button>
    </>
  );
}

const surface = () => screen.getByTestId('surface');

/** A mouse drag from one point to another. */
function mouseDrag(from: [number, number], to: [number, number]) {
  fireEvent.mouseDown(surface(), { clientX: from[0], clientY: from[1] });
  fireEvent.mouseMove(surface(), { clientX: to[0], clientY: to[1] });
  fireEvent.mouseUp(surface());
}

/** A one-finger swipe from one point to another. */
function touchSwipe(from: [number, number], to: [number, number]) {
  fireEvent.touchStart(surface(), {
    touches: [{ clientX: from[0], clientY: from[1] }],
  });
  fireEvent.touchMove(surface(), {
    touches: [{ clientX: to[0], clientY: to[1] }],
  });
  fireEvent.touchEnd(surface());
}

describe('useSwipe', () => {
  it('reports a drag left and a drag right past 50px', () => {
    const onSwipe = vi.fn();
    render(<Surface onSwipe={onSwipe} />);

    mouseDrag([200, 0], [100, 0]);
    mouseDrag([100, 0], [200, 0]);

    expect(onSwipe.mock.calls).toEqual([['left'], ['right']]);
  });

  it('reports nothing for a drag of 50px or less', () => {
    const onSwipe = vi.fn();
    render(<Surface onSwipe={onSwipe} />);

    mouseDrag([200, 0], [150, 0]);
    mouseDrag([200, 0], [250, 0]);

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('follows the drag with its offset and settles back to rest', () => {
    render(<Surface onSwipe={vi.fn()} />);

    fireEvent.mouseDown(surface(), { clientX: 200, clientY: 10 });
    expect(surface()).toHaveTextContent('swiping 0,0');

    fireEvent.mouseMove(surface(), { clientX: 170, clientY: 90 });
    // Without `vertical`, only the horizontal distance counts.
    expect(surface()).toHaveTextContent('swiping -30,0');

    fireEvent.mouseLeave(surface());
    expect(surface()).toHaveTextContent('idle 0,0');
  });

  it('stops the press from selecting text or dragging an image', () => {
    render(<Surface onSwipe={vi.fn()} />);
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    surface().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('follows the first finger of a touch', () => {
    const onSwipe = vi.fn();
    render(<Surface onSwipe={onSwipe} />);

    touchSwipe([300, 0], [100, 0]);

    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  it('ignores moves and releases without a press', () => {
    const onSwipe = vi.fn();
    render(<Surface onSwipe={onSwipe} />);

    fireEvent.mouseMove(surface(), { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(surface());
    fireEvent.touchMove(surface(), { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchEnd(surface());

    expect(onSwipe).not.toHaveBeenCalled();
    expect(surface()).toHaveTextContent('idle 0,0');
  });

  it('leaves a press alone while disabled', () => {
    render(<Surface onSwipe={vi.fn()} enabled={false} />);
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    surface().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('starts no drag while disabled', () => {
    const onSwipe = vi.fn();
    render(<Surface onSwipe={onSwipe} enabled={false} />);

    mouseDrag([200, 0], [0, 0]);
    touchSwipe([200, 0], [0, 0]);

    expect(onSwipe).not.toHaveBeenCalled();
    expect(surface()).toHaveTextContent('idle 0,0');
  });

  it('finishes a drag that was under way when it was disabled', () => {
    const onSwipe = vi.fn();
    const { rerender } = render(<Surface onSwipe={onSwipe} />);

    fireEvent.mouseDown(surface(), { clientX: 200, clientY: 0 });
    rerender(<Surface onSwipe={onSwipe} enabled={false} />);
    fireEvent.mouseMove(surface(), { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(surface());

    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  describe('with vertical', () => {
    it('reports a swipe down and a swipe up', () => {
      const onSwipe = vi.fn();
      render(<Surface onSwipe={onSwipe} vertical />);

      touchSwipe([100, 100], [110, 300]);
      touchSwipe([100, 300], [90, 100]);

      expect(onSwipe.mock.calls).toEqual([['down'], ['up']]);
    });

    it('follows the vertical offset', () => {
      render(<Surface onSwipe={vi.fn()} vertical />);

      fireEvent.mouseDown(surface(), { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(surface(), { clientX: 120, clientY: 160 });

      expect(surface()).toHaveTextContent('swiping 20,60');
    });

    it('goes by the axis the drag travelled further along', () => {
      const onSwipe = vi.fn();
      render(<Surface onSwipe={onSwipe} vertical />);

      mouseDrag([300, 100], [100, 180]);
      mouseDrag([100, 100], [120, 130]);

      expect(onSwipe.mock.calls).toEqual([['left']]);
    });
  });

  it('drops a drag on cancel without reporting it', () => {
    const onSwipe = vi.fn();
    render(<Surface onSwipe={onSwipe} />);

    fireEvent.touchStart(surface(), { touches: [{ clientX: 300 }] });
    fireEvent.touchMove(surface(), { touches: [{ clientX: 100 }] });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.touchEnd(surface());

    expect(onSwipe).not.toHaveBeenCalled();
    expect(surface()).toHaveTextContent('idle 0,0');
  });
});
