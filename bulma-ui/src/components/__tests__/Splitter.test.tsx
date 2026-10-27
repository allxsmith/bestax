import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Splitter, SplitterPane, type SplitterProps } from '../Splitter';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

// jsdom lays nothing out. The root and its handles get lengths from here
// when a test asks for them, so `px` and `rem` limits can be measured.
let lengths: { root: number; handle: number } | null = null;

/** A ResizeObserver the tests fire by hand. */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  disconnected = false;
  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe() {}
  disconnect() {
    this.disconnected = true;
  }
  fire() {
    act(() => {
      this.callback([], this as unknown as ResizeObserver);
    });
  }
}
const observer = () =>
  MockResizeObserver.instances[MockResizeObserver.instances.length - 1];

beforeEach(() => {
  lengths = null;
  resetDevWarnings();
  MockResizeObserver.instances = [];
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
    MockResizeObserver;
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      const size = !lengths
        ? 0
        : this.matches('[role="separator"]')
          ? lengths.handle
          : this.matches('.splitter, .bestax-splitter')
            ? lengths.root
            : 0;
      return {
        width: size,
        height: size,
        top: 0,
        left: 0,
        right: size,
        bottom: size,
        x: 0,
        y: 0,
        toJSON() {},
      } as DOMRect;
    });
});

afterEach(() => {
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  jest.restoreAllMocks();
});

/** Makes the page right to left, as far as the splitter can tell. */
const rightToLeft = () => {
  const real = window.getComputedStyle;
  jest.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    const style = real(el, pseudo);
    return el.matches('.splitter')
      ? ({ ...style, direction: 'rtl' } as CSSStyleDeclaration)
      : style;
  });
};

/**
 * jsdom has no PointerEvent, so fireEvent's pointer events drop clientX and
 * clientY. A MouseEvent of the pointer type carries them, and React reads
 * the native event.
 */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: { clientX?: number; clientY?: number; button?: number } = {}
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  fireEvent(el, event);
};

const handles = () => screen.getAllByRole('separator');
const panesOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.splitter-pane'));
const growOf = (container: HTMLElement) =>
  panesOf(container).map(pane => Number(pane.style.flexGrow));
const value = (handle: HTMLElement) => ({
  now: Number(handle.getAttribute('aria-valuenow')),
  min: Number(handle.getAttribute('aria-valuemin')),
  max: Number(handle.getAttribute('aria-valuemax')),
});

const TwoPanes = (props: Partial<SplitterProps>) => (
  <Splitter {...props}>
    <Splitter.Pane label="Files" defaultSize={25}>
      Files
    </Splitter.Pane>
    <Splitter.Pane label="Editor">Editor</Splitter.Pane>
  </Splitter>
);

describe('Splitter', () => {
  describe('Rendering', () => {
    it('puts a handle between each pair of panes', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="One">1</Splitter.Pane>
          <Splitter.Pane label="Two">2</Splitter.Pane>
          <Splitter.Pane label="Three">3</Splitter.Pane>
        </Splitter>
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('splitter');
      expect(Array.from(root.children).map(child => child.className)).toEqual([
        'splitter-pane',
        'splitter-handle',
        'splitter-pane',
        'splitter-handle',
        'splitter-pane',
      ]);
    });

    it('makes each handle a focusable separator across the panes, named and controlling its pane', () => {
      const { container } = render(<TwoPanes />);
      const [handle] = handles();
      const [files] = panesOf(container);
      expect(handle).toHaveAttribute('tabindex', '0');
      expect(handle).toHaveAttribute('aria-orientation', 'vertical');
      expect(handle).toHaveAttribute('aria-label', 'Files');
      expect(handle).toHaveAttribute('aria-controls', files.id);
      expect(files.id).not.toBe('');
      expect(value(handle)).toEqual({ now: 25, min: 0, max: 100 });
    });

    it('stacks the panes with vertical, the handle lying across', () => {
      const { container } = render(<TwoPanes orientation="vertical" />);
      expect(container.firstChild).toHaveClass('splitter', 'is-vertical');
      expect(handles()[0]).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('sizes the panes by flex-grow from their percentages', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" defaultSize={20}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
          <Splitter.Pane label="C">C</Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([20, 40, 40]);
      expect(panesOf(container)[0].style.flex).toBe('20 1 0px');
    });

    it('puts the helper props, className, style and height on the root, and the rest too', () => {
      const ref = React.createRef<HTMLDivElement>();
      const { container } = render(
        <Splitter
          ref={ref}
          className="box"
          style={{ color: 'red' }}
          height={300}
          m="2"
          textColor="primary"
          bgColor="light"
          id="layout"
        >
          <Splitter.Pane label="Files">Files</Splitter.Pane>
          <Splitter.Pane label="Editor">Editor</Splitter.Pane>
        </Splitter>
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass(
        'splitter',
        'box',
        'm-2',
        'has-text-primary',
        'has-background-light'
      );
      expect(root.style.height).toBe('300px');
      expect(root.style.color).toBe('red');
      expect(root).toHaveAttribute('id', 'layout');
      expect(ref.current).toBe(root);
    });

    it('leaves the root without a style when nothing is given', () => {
      const { container } = render(<TwoPanes />);
      expect(container.firstChild).not.toHaveAttribute('style');
    });

    it('calls a function ref with the root, and forwards a pane’s ref', () => {
      const rootRef = jest.fn();
      const paneRef = React.createRef<HTMLDivElement>();
      const { container, unmount } = render(
        <Splitter ref={rootRef}>
          <Splitter.Pane label="A" ref={paneRef}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(rootRef).toHaveBeenCalledWith(container.firstChild);
      expect(paneRef.current).toBe(panesOf(container)[0]);
      unmount();
      expect(rootRef).toHaveBeenLastCalledWith(null);
    });

    it('puts a pane’s helper props, class, style and own id on its div, its flex over the style', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane
            label="A"
            id="files"
            className="extra"
            style={{ color: 'red', flex: 'none' }}
            p="3"
            textColor="info"
            bgColor="dark"
            data-testid="a"
          >
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      const pane = screen.getByTestId('a');
      expect(pane).toHaveClass(
        'splitter-pane',
        'extra',
        'p-3',
        'has-text-info',
        'has-background-dark'
      );
      expect(pane.id).toBe('files');
      expect(pane.style.color).toBe('red');
      expect(pane.style.flexGrow).toBe('50');
      expect(handles()[0]).toHaveAttribute('aria-controls', 'files');
      expect(panesOf(container)).toHaveLength(2);
    });

    it('renders a pane on its own as a plain div', () => {
      const { container } = render(
        <SplitterPane id="lone" hidden>
          Alone
        </SplitterPane>
      );
      const pane = container.firstChild as HTMLElement;
      expect(pane).toHaveClass('splitter-pane');
      expect(pane.id).toBe('lone');
      expect(pane).toHaveAttribute('hidden');
      expect(pane).not.toHaveAttribute('style');
    });

    it('opens Fragments and leaves out children that aren’t panes', () => {
      const { container } = render(
        <Splitter>
          <>
            <Splitter.Pane label="A">A</Splitter.Pane>
            <Splitter.Pane label="B">B</Splitter.Pane>
          </>
          {null}
          <div className="stray">stray</div>
          text
        </Splitter>
      );
      expect(panesOf(container)).toHaveLength(2);
      expect(container.querySelector('.stray')).toBeNull();
      expect(handles()).toHaveLength(1);
    });

    it('has display names', () => {
      expect(Splitter.displayName).toBe('Splitter');
      expect(SplitterPane.displayName).toBe('Splitter.Pane');
    });
  });

  describe('Compound components', () => {
    it('attaches Splitter.Pane', () => {
      expect(Splitter.Pane).toBe(SplitterPane);
    });
  });

  describe('Sizes', () => {
    it('reports every change through onSizesChange, and keeps them itself', () => {
      const onSizesChange = jest.fn();
      const { container } = render(<TwoPanes onSizesChange={onSizesChange} />);
      act(() => handles()[0].focus());
      fireEvent.keyDown(handles()[0], { key: 'ArrowRight' });
      expect(onSizesChange).toHaveBeenLastCalledWith([26, 74]);
      expect(growOf(container)).toEqual([26, 74]);
    });

    it('takes sizes from the sizes prop, and reports what a key would make them', () => {
      const onSizesChange = jest.fn();
      const { container, rerender } = render(
        <TwoPanes sizes={[40, 60]} onSizesChange={onSizesChange} />
      );
      expect(growOf(container)).toEqual([40, 60]);
      fireEvent.keyDown(handles()[0], { key: 'ArrowRight' });
      expect(onSizesChange).toHaveBeenLastCalledWith([41, 59]);
      expect(growOf(container)).toEqual([40, 60]);
      rerender(<TwoPanes sizes={[41, 59]} onSizesChange={onSizesChange} />);
      expect(growOf(container)).toEqual([41, 59]);
    });

    it('ignores a sizes prop that doesn’t have one size per pane', () => {
      const { container } = render(<TwoPanes sizes={[10, 20, 70]} />);
      expect(growOf(container)).toEqual([25, 75]);
    });

    it('starts over from the defaults when the panes change', () => {
      const Layout = ({ three }: { three: boolean }) => (
        <Splitter>
          <Splitter.Pane label="A" defaultSize={50}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
          {three && <Splitter.Pane label="C">C</Splitter.Pane>}
        </Splitter>
      );
      const { container, rerender } = render(<Layout three={false} />);
      fireEvent.keyDown(handles()[0], { key: 'ArrowRight' });
      expect(growOf(container)).toEqual([51, 49]);
      rerender(<Layout three />);
      expect(growOf(container)).toEqual([50, 25, 25]);
    });

    it('fits the starting sizes to percentage limits', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" defaultSize={5} minSize={20}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([20, 80]);
    });
  });

  describe('Keyboard', () => {
    it('moves the line by step with the arrows on its axis, ten times as far with Shift', () => {
      render(<TwoPanes step={2} />);
      const [handle] = handles();
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      expect(value(handle).now).toBe(27);
      fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true });
      expect(value(handle).now).toBe(7);
      fireEvent.keyDown(handle, { key: 'ArrowDown' });
      expect(value(handle).now).toBe(7);
    });

    it('uses Up and Down when the panes are stacked', () => {
      render(<TwoPanes orientation="vertical" />);
      const [handle] = handles();
      fireEvent.keyDown(handle, { key: 'ArrowDown' });
      expect(value(handle).now).toBe(26);
      fireEvent.keyDown(handle, { key: 'ArrowUp' });
      expect(value(handle).now).toBe(25);
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      expect(value(handle).now).toBe(25);
    });

    it('follows the screen right to left, where the pane before is on the right', () => {
      rightToLeft();
      render(<TwoPanes />);
      const [handle] = handles();
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      expect(value(handle).now).toBe(24);
      fireEvent.keyDown(handle, { key: 'ArrowLeft' });
      expect(value(handle).now).toBe(25);
    });

    it('takes the pane to its limits with Home and End', () => {
      render(
        <Splitter>
          <Splitter.Pane label="A" defaultSize={30} minSize={10} maxSize={60}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      const [handle] = handles();
      fireEvent.keyDown(handle, { key: 'End' });
      expect(value(handle).now).toBe(60);
      fireEvent.keyDown(handle, { key: 'Home' });
      expect(value(handle).now).toBe(10);
    });

    it('takes a primary pane after the handle to its limits too', () => {
      render(
        <Splitter>
          <Splitter.Pane label="Canvas">Canvas</Splitter.Pane>
          <Splitter.Pane
            label="Inspector"
            defaultSize={30}
            minSize={20}
            maxSize={40}
            collapsible
          >
            Inspector
          </Splitter.Pane>
        </Splitter>
      );
      const [handle] = handles();
      expect(handle).toHaveAttribute('aria-label', 'Inspector');
      fireEvent.keyDown(handle, { key: 'End' });
      expect(value(handle).now).toBe(40);
      fireEvent.keyDown(handle, { key: 'Home' });
      expect(value(handle).now).toBe(20);
    });

    it('leaves other keys alone', () => {
      const onSizesChange = jest.fn();
      render(<TwoPanes onSizesChange={onSizesChange} />);
      const event = fireEvent.keyDown(handles()[0], { key: 'a' });
      expect(event).toBe(true);
      fireEvent.keyDown(handles()[0], { key: 'Enter' });
      expect(onSizesChange).not.toHaveBeenCalled();
    });

    it('stops the page scrolling when a key moves the line', () => {
      render(<TwoPanes />);
      const notCancelled = fireEvent.keyDown(handles()[0], {
        key: 'ArrowRight',
      });
      expect(notCancelled).toBe(false);
    });
  });

  describe('Collapse', () => {
    const Inspector = (
      props: Partial<React.ComponentProps<typeof SplitterPane>>
    ) => (
      <Splitter>
        <Splitter.Pane label="Canvas">Canvas</Splitter.Pane>
        <Splitter.Pane
          label="Inspector"
          defaultSize={30}
          minSize={20}
          collapsible
          {...props}
        >
          Inspector
        </Splitter.Pane>
      </Splitter>
    );

    it('shuts the primary pane with Enter, hides it, and brings it back at the size it had', () => {
      const onCollapsedChange = jest.fn();
      const { container } = render(
        <Inspector onCollapsedChange={onCollapsedChange} />
      );
      const [handle] = handles();
      fireEvent.keyDown(handle, { key: 'ArrowLeft' });
      expect(growOf(container)).toEqual([69, 31]);
      fireEvent.keyDown(handle, { key: 'Enter' });
      const inspector = panesOf(container)[1];
      expect(growOf(container)).toEqual([100, 0]);
      expect(inspector).toHaveAttribute('hidden');
      expect(inspector).toHaveClass('is-collapsed');
      expect(value(handle)).toEqual({ now: 0, min: 0, max: 100 });
      expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
      fireEvent.keyDown(handle, { key: 'Enter' });
      expect(growOf(container)).toEqual([69, 31]);
      expect(inspector).not.toHaveAttribute('hidden');
      expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
    });

    it('shuts a collapsible pane before the handle, giving its room to the pane after', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="Files" defaultSize={25} collapsible>
            Files
          </Splitter.Pane>
          <Splitter.Pane label="Editor">Editor</Splitter.Pane>
        </Splitter>
      );
      fireEvent.keyDown(handles()[0], { key: 'Enter' });
      expect(growOf(container)).toEqual([0, 100]);
      fireEvent.keyDown(handles()[0], { key: 'Enter' });
      expect(growOf(container)).toEqual([25, 75]);
    });

    it('leaves a lone pane alone, with no handle to collapse through', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="Only" collapsible defaultCollapsed>
            Only
          </Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([100]);
      expect(screen.queryByRole('separator')).toBeNull();
    });

    it('brings back a lone pane’s collapsed prop as a no-op too', () => {
      const Lone = ({ collapsed }: { collapsed: boolean }) => (
        <Splitter>
          <Splitter.Pane label="Only" collapsible collapsed={collapsed}>
            Only
          </Splitter.Pane>
        </Splitter>
      );
      const { container, rerender } = render(<Lone collapsed />);
      rerender(<Lone collapsed={false} />);
      expect(growOf(container)).toEqual([100]);
    });

    it('shuts a pane dragged below half its minimum, and calls onCollapsedChange', () => {
      lengths = { root: 412, handle: 12 };
      const onCollapsedChange = jest.fn();
      const { container } = render(
        <Inspector onCollapsedChange={onCollapsedChange} />
      );
      const [handle] = handles();
      pointer(handle, 'pointerdown', { clientX: 280 });
      pointer(handle, 'pointermove', { clientX: 380 });
      expect(growOf(container)).toEqual([100, 0]);
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
      pointer(handle, 'pointerup', { clientX: 380 });
    });

    it('starts shut with defaultCollapsed, and comes back at its default', () => {
      const { container } = render(<Inspector defaultCollapsed />);
      expect(growOf(container)).toEqual([100, 0]);
      fireEvent.keyDown(handles()[0], { key: 'Enter' });
      expect(growOf(container)).toEqual([70, 30]);
    });

    it('follows collapsed, without calling onCollapsedChange for it', () => {
      const onCollapsedChange = jest.fn();
      const { container, rerender } = render(
        <Inspector collapsed onCollapsedChange={onCollapsedChange} />
      );
      expect(growOf(container)).toEqual([100, 0]);
      rerender(
        <Inspector collapsed={false} onCollapsedChange={onCollapsedChange} />
      );
      expect(growOf(container)).toEqual([70, 30]);
      rerender(<Inspector collapsed onCollapsedChange={onCollapsedChange} />);
      expect(growOf(container)).toEqual([100, 0]);
      expect(onCollapsedChange).not.toHaveBeenCalled();
    });

    it('collapses only when the pane across the handle can take the room, as a drag would', () => {
      const onCollapsedChange = jest.fn();
      const { container } = render(
        <Splitter>
          <Splitter.Pane
            label="A"
            defaultSize={40}
            collapsible
            onCollapsedChange={onCollapsedChange}
          >
            A
          </Splitter.Pane>
          <Splitter.Pane label="B" defaultSize={30} maxSize={50}>
            B
          </Splitter.Pane>
          <Splitter.Pane label="C">C</Splitter.Pane>
        </Splitter>
      );
      fireEvent.keyDown(handles()[0], { key: 'Enter' });
      expect(growOf(container)).toEqual([40, 30, 30]);
      expect(onCollapsedChange).not.toHaveBeenCalled();
      const second = value(handles()[1]);
      expect(second.now).toBeLessThanOrEqual(second.max);
    });

    it('starts open when defaultCollapsed has nowhere to put the room', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" collapsible defaultCollapsed>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B" maxSize={60}>
            B
          </Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([50, 50]);
    });

    it('only asks when the app holds collapsed, and leaves the layout to it', () => {
      lengths = { root: 412, handle: 12 };
      const onCollapsedChange = jest.fn();
      const { container } = render(
        <Inspector collapsed={false} onCollapsedChange={onCollapsedChange} />
      );
      const [handle] = handles();
      fireEvent.keyDown(handle, { key: 'Enter' });
      expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
      expect(growOf(container)).toEqual([70, 30]);
      pointer(handle, 'pointerdown', { clientX: 280 });
      pointer(handle, 'pointermove', { clientX: 380 });
      expect(onCollapsedChange).toHaveBeenCalledTimes(2);
      expect(growOf(container)).toEqual([70, 30]);
      pointer(handle, 'pointerup', { clientX: 380 });
    });

    it('reopens a pane without snapping the pane across shut', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane
            label="A"
            defaultSize={85}
            collapsible
            defaultCollapsed
          >
            A
          </Splitter.Pane>
          <Splitter.Pane label="B" minSize={40} collapsible>
            B
          </Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([0, 100]);
      fireEvent.keyDown(handles()[0], { key: 'Enter' });
      expect(growOf(container)).toEqual([60, 40]);
    });

    it('ignores collapsed on a pane that isn’t collapsible', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" collapsed>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([50, 50]);
    });

    it('collapses through the handle before a last pane that speaks for itself there', () => {
      const { container, rerender } = render(
        <Splitter>
          <Splitter.Pane label="A">A</Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
          <Splitter.Pane label="C" collapsible collapsed={false}>
            C
          </Splitter.Pane>
        </Splitter>
      );
      rerender(
        <Splitter>
          <Splitter.Pane label="A">A</Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
          <Splitter.Pane label="C" collapsible collapsed>
            C
          </Splitter.Pane>
        </Splitter>
      );
      const grow = growOf(container);
      expect(grow[2]).toBe(0);
      expect(grow[0]).toBeCloseTo(100 / 3);
      expect(grow[1]).toBeCloseTo(200 / 3);
    });

    it('collapses a middle pane that no handle speaks for through the one after it', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" collapsible>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B" collapsible defaultCollapsed>
            B
          </Splitter.Pane>
          <Splitter.Pane label="C" collapsible>
            C
          </Splitter.Pane>
        </Splitter>
      );
      const grow = growOf(container);
      expect(grow[1]).toBe(0);
      expect(grow[2]).toBeCloseTo(200 / 3);
    });

    it('collapses a last pane that no handle speaks for through the one before it', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" collapsible>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B" collapsible defaultCollapsed>
            B
          </Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([100, 0]);
    });
  });

  describe('Dragging', () => {
    beforeEach(() => {
      // 400px for the panes once the 12px handle is taken off.
      lengths = { root: 412, handle: 12 };
    });

    it('moves the line with the pointer, marks the handle and shows the cursor everywhere', () => {
      const onSizesChange = jest.fn();
      const { container } = render(<TwoPanes onSizesChange={onSizesChange} />);
      const [handle] = handles();
      pointer(handle, 'pointerdown', { clientX: 100 });
      expect(handle).toHaveClass('is-active');
      expect(document.body.style.cursor).toBe('col-resize');
      expect(document.body.style.userSelect).toBe('none');
      pointer(handle, 'pointermove', { clientX: 140 });
      expect(growOf(container)).toEqual([35, 65]);
      pointer(handle, 'pointerup', { clientX: 140 });
      expect(handle).not.toHaveClass('is-active');
      expect(document.body.style.cursor).toBe('');
      pointer(handle, 'pointermove', { clientX: 300 });
      expect(growOf(container)).toEqual([35, 65]);
      expect(onSizesChange).toHaveBeenCalledTimes(1);
    });

    it('follows the vertical pointer when stacked', () => {
      const { container } = render(<TwoPanes orientation="vertical" />);
      const [handle] = handles();
      pointer(handle, 'pointerdown', { clientY: 100 });
      expect(document.body.style.cursor).toBe('row-resize');
      pointer(handle, 'pointermove', { clientY: 60, clientX: 999 });
      expect(growOf(container)).toEqual([15, 85]);
      pointer(handle, 'pointercancel');
      expect(handle).not.toHaveClass('is-active');
    });

    it('follows the screen right to left', () => {
      rightToLeft();
      const { container } = render(<TwoPanes />);
      const [handle] = handles();
      pointer(handle, 'pointerdown', { clientX: 300 });
      pointer(handle, 'pointermove', { clientX: 260 });
      expect(growOf(container)).toEqual([35, 65]);
    });

    it('ignores a button other than the main one, and a drag with no room to measure', () => {
      const { container } = render(<TwoPanes />);
      const [handle] = handles();
      pointer(handle, 'pointerdown', { clientX: 100, button: 2 });
      expect(handle).not.toHaveClass('is-active');
      lengths = { root: 12, handle: 12 };
      pointer(handle, 'pointerdown', { clientX: 100 });
      pointer(handle, 'pointermove', { clientX: 200 });
      expect(growOf(container)).toEqual([25, 75]);
      pointer(handle, 'pointerup');
    });

    it('captures the pointer where it can', () => {
      render(<TwoPanes />);
      const [handle] = handles();
      const setPointerCapture = jest.fn();
      const releasePointerCapture = jest.fn();
      Object.assign(handle, { setPointerCapture, releasePointerCapture });
      pointer(handle, 'pointerdown', { clientX: 100 });
      pointer(handle, 'pointerup', { clientX: 100 });
      expect(setPointerCapture).toHaveBeenCalledWith(1);
      expect(releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('puts the two panes back to their default share on a double-click', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" defaultSize={20}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B" defaultSize={30}>
            B
          </Splitter.Pane>
          <Splitter.Pane label="C">C</Splitter.Pane>
        </Splitter>
      );
      const second = handles()[1];
      fireEvent.keyDown(second, { key: 'ArrowRight', shiftKey: true });
      expect(growOf(container)).toEqual([20, 40, 40]);
      fireEvent.doubleClick(second);
      expect(growOf(container)).toEqual([20, 30, 50]);
    });

    it('shares a double-clicked pair equally when both start with nothing', () => {
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" defaultSize={100}>
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
          <Splitter.Pane label="C">C</Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([100, 0, 0]);
      fireEvent.keyDown(handles()[0], { key: 'ArrowLeft', shiftKey: true });
      fireEvent.keyDown(handles()[0], { key: 'ArrowLeft', shiftKey: true });
      expect(growOf(container)).toEqual([80, 20, 0]);
      fireEvent.doubleClick(handles()[1]);
      expect(growOf(container)).toEqual([80, 10, 10]);
    });
  });

  describe('Measured limits', () => {
    it('turns px and rem limits into percentages once it has measured, and fits the layout to them', () => {
      lengths = { root: 812, handle: 12 };
      const { container } = render(
        <Splitter>
          <Splitter.Pane
            label="A"
            defaultSize={10}
            minSize="200px"
            maxSize="30rem"
          >
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([25, 75]);
      expect(value(handles()[0])).toEqual({ now: 25, min: 25, max: 60 });
    });

    it('measures again when the root resizes', () => {
      lengths = { root: 812, handle: 12 };
      render(
        <Splitter>
          <Splitter.Pane label="A" minSize="200px">
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(value(handles()[0]).min).toBe(25);
      lengths = { root: 412, handle: 12 };
      observer().fire();
      expect(value(handles()[0]).min).toBe(50);
    });

    it('applies only percentage limits before measuring, and without a ResizeObserver measures once', () => {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
      const { container } = render(
        <Splitter>
          <Splitter.Pane label="A" defaultSize={10} minSize="200px">
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(growOf(container)).toEqual([10, 90]);
    });

    it('reads the rem from the root element', () => {
      lengths = { root: 412, handle: 12 };
      const real = window.getComputedStyle;
      jest
        .spyOn(window, 'getComputedStyle')
        .mockImplementation((el, pseudo) => {
          const style = real(el, pseudo);
          return el === document.documentElement
            ? ({ ...style, fontSize: '20px' } as CSSStyleDeclaration)
            : style;
        });
      render(
        <Splitter>
          <Splitter.Pane label="A" minSize="5rem">
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(value(handles()[0]).min).toBe(25);
    });

    it('falls back to 16px for a rem it cannot read', () => {
      lengths = { root: 412, handle: 12 };
      const real = window.getComputedStyle;
      jest
        .spyOn(window, 'getComputedStyle')
        .mockImplementation((el, pseudo) => {
          const style = real(el, pseudo);
          return el === document.documentElement
            ? ({ ...style, fontSize: '' } as CSSStyleDeclaration)
            : style;
        });
      render(
        <Splitter>
          <Splitter.Pane label="A" minSize="5rem">
            A
          </Splitter.Pane>
          <Splitter.Pane label="B">B</Splitter.Pane>
        </Splitter>
      );
      expect(value(handles()[0]).min).toBe(20);
    });

    it('stops observing when it unmounts', () => {
      const { unmount } = render(<TwoPanes />);
      const resizes = observer();
      unmount();
      expect(resizes.disconnected).toBe(true);
    });
  });

  describe('Names', () => {
    it('warns in development when a handle’s pane has no label', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Splitter>
          <Splitter.Pane>A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '<Splitter> has a handle whose pane has no label'
        )
      );
    });

    it('doesn’t warn about a last pane no handle speaks for', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Splitter>
          <Splitter.Pane label="A">A</Splitter.Pane>
          <Splitter.Pane>B</Splitter.Pane>
        </Splitter>
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('Server rendering', () => {
    const Layout = () => (
      <Splitter height={480}>
        <Splitter.Pane
          label="Files"
          id="files"
          defaultSize={25}
          minSize="12rem"
        >
          Files
        </Splitter.Pane>
        <Splitter.Pane label="Editor" id="editor">
          Editor
        </Splitter.Pane>
      </Splitter>
    );

    it('renders the layout from the percentages alone', () => {
      const html = renderToString(<Layout />);
      expect(html).toBe(
        '<div class="splitter" style="height:480px">' +
          '<div class="splitter-pane" id="files" style="flex:25 1 0px">Files</div>' +
          '<div class="splitter-handle" role="separator" tabindex="0" aria-orientation="vertical"' +
          ' aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" aria-controls="files" aria-label="Files"></div>' +
          '<div class="splitter-pane" id="editor" style="flex:75 1 0px">Editor</div></div>'
      );
    });

    it('hydrates without a mismatch', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Layout />);
      document.body.appendChild(container);
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <Layout />);
          unmountRoot = () => root.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        await act(async () => unmountRoot());
        document.body.removeChild(container);
      }
    });
  });

  describe('Class prefix', () => {
    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Splitter orientation="vertical" m="2">
            <Splitter.Pane label="A" collapsible defaultCollapsed>
              A
            </Splitter.Pane>
            <Splitter.Pane label="B">B</Splitter.Pane>
          </Splitter>
        </ConfigProvider>
      );
      const root = container.firstChild as HTMLElement;
      expect(root.className).toBe(
        'bestax-splitter bestax-is-vertical bestax-m-2'
      );
      expect(Array.from(root.children).map(child => child.className)).toEqual([
        'bestax-splitter-pane bestax-is-collapsed',
        'bestax-splitter-handle',
        'bestax-splitter-pane',
      ]);
      lengths = { root: 412, handle: 12 };
      const handle = root.children[1];
      pointer(handle, 'pointerdown', { clientY: 0 });
      expect(handle.className).toBe('bestax-splitter-handle bestax-is-active');
      pointer(handle, 'pointerup');
    });
  });
});
