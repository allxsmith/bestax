import { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { render, screen, act } from '@testing-library/react';
import {
  StatusRegion,
  announceDelay,
  announcementLifetime,
} from '../statusRegion';

interface Item {
  id: string;
  text: string | null;
}

const describeItem = (item: Item) => item.text;

const alpha: Item = { id: 'a', text: 'Alpha' };
const bravo: Item = { id: 'b', text: 'Bravo' };
const charlie: Item = { id: 'c', text: 'Charlie' };

const region = (items: Item[]) => (
  <StatusRegion items={items} describe={describeItem} />
);

// What the region says, one entry per announcement node.
const said = () =>
  Array.from(screen.getByRole('status').children).map(el => el.textContent);

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

describe('StatusRegion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders an empty, polite status region', () => {
    render(region([]));

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();
  });

  it('hides itself without any stylesheet', () => {
    // No CSS is loaded here, Bulma's included, so the computed style is the
    // region's own.
    expect(document.styleSheets).toHaveLength(0);
    render(region([alpha]));
    advance(announceDelay);

    const status = screen.getByRole('status');
    expect(status).not.toHaveAttribute('class');
    expect(status).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '0px',
      padding: '0px',
      overflow: 'hidden',
      clip: 'rect(0px, 0px, 0px, 0px)',
      'clip-path': 'inset(50%)',
      'white-space': 'nowrap',
    });
    expect(getComputedStyle(status).borderTopWidth).toBe('0px');
    expect(status).toHaveTextContent('Alpha');
  });

  it('writes an announcement a moment after its item appears', () => {
    const { rerender } = render(region([]));

    rerender(region([alpha]));
    expect(said()).toEqual([]);

    advance(announceDelay - 1);
    expect(said()).toEqual([]);

    advance(1);
    expect(said()).toEqual(['Alpha']);
  });

  it('writes nothing in the commit that mounts it, then writes into the region it mounted', () => {
    render(region([alpha]));
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    advance(announceDelay);

    expect(screen.getByRole('status')).toBe(status);
    expect(said()).toEqual(['Alpha']);
  });

  it('clears an announcement once its lifetime is up', () => {
    render(region([alpha]));
    advance(announceDelay);

    advance(announcementLifetime - 1);
    expect(said()).toEqual(['Alpha']);

    advance(1);
    expect(said()).toEqual([]);
  });

  it('clears the whole lifetime in one step of the clock', () => {
    // The clear is timed from when the item appears, not from a render after
    // the write, so one long step runs it too.
    render(region([alpha]));

    advance(announceDelay + announcementLifetime);

    expect(said()).toEqual([]);
  });

  it('drops an announcement as soon as its item goes', () => {
    const { rerender } = render(region([alpha, bravo]));
    advance(announceDelay);
    expect(said()).toEqual(['Alpha', 'Bravo']);

    rerender(region([bravo]));

    expect(said()).toEqual(['Bravo']);
  });

  it('never writes an item that goes before its announcement is due', () => {
    const { rerender } = render(region([alpha]));
    rerender(region([]));

    advance(announceDelay);

    expect(said()).toEqual([]);
  });

  it('announces each item once, however often it re-renders', () => {
    const { rerender } = render(region([alpha]));
    advance(announceDelay);
    const node = screen.getByRole('status').firstElementChild;

    // A new list with the same item in it, as the store hands over on every
    // change, leaves the announcement node as it is.
    rerender(region([alpha]));
    expect(screen.getByRole('status').firstElementChild).toBe(node);

    advance(announcementLifetime);
    rerender(region([alpha]));
    advance(announceDelay);

    expect(said()).toEqual([]);
  });

  it('replaces what the region said with the items that appear next', () => {
    const { rerender } = render(region([alpha, bravo]));
    advance(announceDelay);

    rerender(region([alpha, bravo, charlie]));
    expect(said()).toEqual([]);

    advance(announceDelay);
    expect(said()).toEqual(['Charlie']);
  });

  it('writes items that appear while others wait all together', () => {
    const { rerender } = render(region([alpha]));
    advance(announceDelay - 1);

    // Joining restarts the wait, so neither is written on the first one's
    // schedule.
    rerender(region([alpha, bravo]));
    advance(announceDelay - 1);
    expect(said()).toEqual([]);

    advance(1);
    expect(said()).toEqual(['Alpha', 'Bravo']);
  });

  it('skips an item with nothing to say', () => {
    const empty: Item = { id: 'e', text: '' };
    const nothing: Item = { id: 'n', text: null };
    const { rerender } = render(region([empty, nothing]));
    advance(announceDelay);
    expect(said()).toEqual([]);

    rerender(region([empty, nothing, alpha]));
    advance(announceDelay);
    expect(said()).toEqual(['Alpha']);
  });

  describe('with a timer from the batch before coming due', () => {
    // Showing the new items synchronously runs their effect straight away, so
    // the effect sets the new batch inside the act below, while the render
    // that cancels the old batch's timers waits for the act to end. The old
    // timer comes due in that gap.
    let showItems: (items: Item[]) => void = () => {};
    const Harness = () => {
      const [items, setItems] = useState([alpha]);
      showItems = setItems;
      return region(items);
    };
    const showNow = (items: Item[]) =>
      // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the render and its effect have to happen ahead of the timer, inside the act
      flushSync(() => showItems(items));

    it("doesn't let the old clear empty the new batch", () => {
      render(<Harness />);
      advance(announceDelay + announcementLifetime - 1);
      expect(said()).toEqual(['Alpha']);

      act(() => {
        showNow([alpha, bravo]);
        jest.advanceTimersByTime(1);
      });
      advance(announceDelay);

      expect(said()).toEqual(['Bravo']);
    });

    it("doesn't let the old write cut the new batch's wait short", () => {
      render(<Harness />);
      advance(announceDelay - 1);

      act(() => {
        showNow([alpha, bravo]);
        jest.advanceTimersByTime(1);
      });
      expect(said()).toEqual([]);

      advance(announceDelay);
      expect(said()).toEqual(['Alpha', 'Bravo']);
    });
  });

  it('renders one region and announces once under StrictMode', () => {
    render(<StrictMode>{region([alpha])}</StrictMode>);
    advance(announceDelay);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(said()).toEqual(['Alpha']);
  });

  it('stops its timers when it unmounts', () => {
    const { unmount } = render(region([alpha]));
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
