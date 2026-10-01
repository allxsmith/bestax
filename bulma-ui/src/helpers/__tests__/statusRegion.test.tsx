import { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { render, screen, act } from '@testing-library/react';
import {
  StatusRegion,
  announceDelay,
  announcementLifetime,
  spokenText,
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

  it('renders an empty, polite status region that reads only what is added', () => {
    render(region([]));

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'false');
    expect(status).not.toHaveAttribute('aria-relevant');
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
    // The negative margin keeps the 1px box from adding scrollable overflow
    // to the page. jsdom doesn't lay anything out, so this is as close as a
    // test here gets to measuring that.
    expect(status).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
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

  it('drops an announcement as soon as its item goes, leaving the rest as they were', () => {
    const { rerender } = render(region([alpha, bravo]));
    advance(announceDelay);
    expect(said()).toEqual(['Alpha', 'Bravo']);
    const bravoNode = screen.getByRole('status').lastElementChild;

    rerender(region([bravo]));

    expect(said()).toEqual(['Bravo']);
    expect(screen.getByRole('status').firstElementChild).toBe(bravoNode);
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

  it('keeps what it said for its whole lifetime while the next items wait, then adds them', () => {
    const { rerender } = render(region([alpha, bravo]));
    advance(announceDelay);
    const written = Array.from(screen.getByRole('status').children);

    // Charlie appears while Alpha and Bravo are still being read.
    advance(50);
    rerender(region([alpha, bravo, charlie]));
    expect(said()).toEqual(['Alpha', 'Bravo']);

    // Writing Charlie adds a node and leaves theirs as they were.
    advance(announceDelay);
    expect(said()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(Array.from(screen.getByRole('status').children).slice(0, 2)).toEqual(
      written
    );

    // Each leaves when its own lifetime is up.
    advance(announcementLifetime - announceDelay - 50);
    expect(said()).toEqual(['Charlie']);
    advance(announceDelay + 50);
    expect(said()).toEqual([]);
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
    // that would cancel the old batch's write waits for the act to end. The
    // old timer comes due in that gap.
    let showItems: (items: Item[]) => void = () => {};
    const Harness = () => {
      const [items, setItems] = useState([alpha]);
      showItems = setItems;
      return region(items);
    };
    const showNow = (items: Item[]) =>
      // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the render and its effect have to happen ahead of the timer, inside the act
      flushSync(() => showItems(items));

    it("doesn't let a newer batch take down what's written while it waits", () => {
      render(<Harness />);
      advance(announceDelay);

      act(() => {
        showNow([alpha, bravo]);
        jest.advanceTimersByTime(1);
      });
      expect(said()).toEqual(['Alpha']);

      advance(announceDelay);
      expect(said()).toEqual(['Alpha', 'Bravo']);
    });

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

    it("doesn't let the old write cut the new batch's wait short, or its clear cut the new batch's lifetime", () => {
      render(<Harness />);
      advance(announceDelay - 1);

      act(() => {
        showNow([alpha, bravo]);
        jest.advanceTimersByTime(1);
      });
      expect(said()).toEqual([]);

      advance(announceDelay);
      expect(said()).toEqual(['Alpha', 'Bravo']);

      // The old write still started a clear, which comes due first and finds
      // nothing of its own to take down.
      advance(announcementLifetime - announceDelay);
      expect(said()).toEqual(['Alpha', 'Bravo']);
      advance(announceDelay);
      expect(said()).toEqual([]);
    });
  });

  it('renders one region and announces once under StrictMode', () => {
    render(<StrictMode>{region([alpha])}</StrictMode>);
    advance(announceDelay);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(said()).toEqual(['Alpha']);
  });

  it('stops its timers when it unmounts', () => {
    // A write still waiting.
    const waiting = render(region([alpha]));
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    waiting.unmount();
    expect(jest.getTimerCount()).toBe(0);

    // A clear still to come, which outlives the batch that started it.
    const written = render(region([bravo]));
    advance(announceDelay);
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    written.unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('spokenText', () => {
  const read = (html: string) => {
    const element = document.createElement('span');
    element.innerHTML = html;
    return spokenText(element);
  };

  it('reads the text, with its whitespace tidied', () => {
    expect(read('  <strong>Draft</strong>\n  saved  ')).toBe('Draft saved');
    expect(read('<span>Up</span><span>loaded</span>')).toBe('Uploaded');
  });

  it('leaves out aria-hidden parts', () => {
    expect(read('<span aria-hidden="true">✓</span> Saved')).toBe('Saved');
    expect(read('<span aria-hidden="false">Still</span> read')).toBe(
      'Still read'
    );
  });

  it("reads an element's aria-label in place of what's inside it", () => {
    expect(read('<span aria-label="Saved">💾</span>to drafts')).toBe(
      'Saved to drafts'
    );
    expect(read('<span aria-label="">Kept</span>')).toBe('Kept');
  });

  it("reads an image's alt", () => {
    expect(read('<img alt="Upload complete">')).toBe('Upload complete');
    expect(read('<img alt="Done">Upload')).toBe('Done Upload');
    expect(read('<img src="photo.png"><img alt="">')).toBe('');
  });

  it('leaves out comments', () => {
    expect(read('Saved<!-- a note -->')).toBe('Saved');
  });
});
