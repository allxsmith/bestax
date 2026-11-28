import { render, screen, fireEvent } from '@testing-library/react';
import { hoverHandlers } from '../hoverHandlers';

describe('hoverHandlers', () => {
  const setup = (own: Parameters<typeof hoverHandlers>[1] = {}) => {
    const onHoverChange = vi.fn();
    const Probe = () => (
      <div data-testid="el" {...hoverHandlers(onHoverChange, own)}>
        <span>child</span>
      </div>
    );
    render(
      <>
        <p>outside</p>
        <Probe />
      </>
    );
    return {
      onHoverChange,
      el: screen.getByTestId('el'),
      child: screen.getByText('child'),
      outside: screen.getByText('outside'),
    };
  };

  it('tells it the pointer came on for a mouseover from outside, from anything or nothing', () => {
    const { onHoverChange, child, outside } = setup();
    fireEvent.mouseOver(child, { relatedTarget: outside });
    expect(onHoverChange).toHaveBeenLastCalledWith(true);
    onHoverChange.mockClear();
    // A pointer coming from outside the window names nothing.
    fireEvent.mouseOver(child, { relatedTarget: null });
    expect(onHoverChange).toHaveBeenLastCalledWith(true);
  });

  it('tells it nothing for a mouseover from inside the element', () => {
    const { onHoverChange, el, child } = setup();
    fireEvent.mouseOver(child, { relatedTarget: el });
    fireEvent.mouseOver(el, { relatedTarget: child });
    expect(onHoverChange).not.toHaveBeenCalled();
  });

  it('tells it the pointer left on a leave', () => {
    const { onHoverChange, el, outside } = setup();
    fireEvent.mouseOut(el, { relatedTarget: outside });
    expect(onHoverChange).toHaveBeenLastCalledWith(false);
  });

  it('runs the caller’s own handlers first, a mouseover from inside included', () => {
    const calls: string[] = [];
    const { onHoverChange, el, child, outside } = setup({
      onMouseEnter: () => calls.push('enter'),
      onMouseOver: () => calls.push('over'),
      onMouseLeave: () => calls.push('leave'),
    });
    onHoverChange.mockImplementation(hovered => calls.push(String(hovered)));
    fireEvent.mouseOver(el, { relatedTarget: child });
    expect(calls).toEqual(['over']);
    calls.length = 0;
    fireEvent.mouseOut(outside, { relatedTarget: el });
    expect(calls).toEqual(['enter', 'true']);
    calls.length = 0;
    fireEvent.mouseOut(el, { relatedTarget: outside });
    expect(calls).toEqual(['leave', 'false']);
  });
});
