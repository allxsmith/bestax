// A web font that finishes loading after `useScrollRegion` first measured can
// widen or narrow the text inside the element without resizing it or any
// element in it, which neither of the hook's observers reports, so the hook
// measures again once the fonts that start loading are ready (#2027). jsdom
// has no Font Loading API and lays nothing out, so `document.fonts` is a
// stand-in these tests drive by hand, and every element's sizes come from
// `sizes`.
import { act, render, screen } from '@testing-library/react';
import { Pre } from '../../elements/Pre';
import { Table } from '../../elements/Table';
import { ScrollArea } from '../../components/ScrollArea';

const sizes = {
  scrollWidth: 200,
  clientWidth: 200,
  scrollHeight: 50,
  clientHeight: 50,
};
type Size = keyof typeof sizes;
const saved = new Map<Size, PropertyDescriptor | undefined>();

beforeAll(() => {
  for (const key of Object.keys(sizes) as Size[]) {
    saved.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => sizes[key],
    });
  }
});

afterAll(() => {
  for (const [key, descriptor] of saved) {
    if (descriptor)
      Object.defineProperty(HTMLElement.prototype, key, descriptor);
    else
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

/**
 * The page's FontFaceSet, as far as the hook reads it: its status, its
 * `ready` promise and its `loading` event. Like WebKit, it fires no
 * `loadingdone`, so only `ready` says when a load is over.
 */
class FontSet extends EventTarget {
  status: 'loading' | 'loaded' = 'loaded';
  ready: Promise<this> = Promise.resolve(this);
  private finish: () => void = () => {};
  /**
   * A font starts loading. As the spec has it, the status and `ready` change
   * at once, a set already loading keeps its `ready`, and the `loading` event
   * comes in a task of its own. The promise this returns settles after it.
   */
  startLoading(): Promise<void> {
    if (this.status === 'loading') return Promise.resolve();
    this.status = 'loading';
    this.ready = new Promise(resolve => {
      this.finish = () => resolve(this);
    });
    return new Promise(resolve =>
      setTimeout(() => {
        this.dispatchEvent(new Event('loading'));
        resolve();
      })
    );
  }
  async finishLoading() {
    this.status = 'loaded';
    this.finish();
    await this.ready;
  }
}

let fonts: FontSet;

beforeEach(() => {
  Object.assign(sizes, { scrollWidth: 200, clientWidth: 200 });
  fonts = new FontSet();
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: fonts,
  });
});

afterEach(() => {
  delete (document as unknown as Record<string, unknown>).fonts;
  vi.restoreAllMocks();
});

/** A web font loads and, once it's in, the text is `width` wide. */
const fontLoads = async (width: number) => {
  await act(() => fonts.startLoading());
  Object.assign(sizes, { scrollWidth: width });
  await act(() => fonts.finishLoading());
};

const callers = [
  {
    name: 'Pre',
    ui: <Pre aria-label="Install command">npm install</Pre>,
    element: () => screen.getByText('npm install'),
  },
  {
    name: 'a responsive Table',
    ui: (
      <Table isResponsive aria-label="Scores">
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Ice Wolves</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    ),
    element: () => screen.getByRole('table').parentElement as HTMLElement,
  },
  {
    name: 'ScrollArea',
    ui: (
      <ScrollArea aria-label="Notes" orientation="horizontal">
        <p>Some notes.</p>
      </ScrollArea>
    ),
    element: () => screen.getByText('Some notes.').parentElement as HTMLElement,
  },
];

/** A ResizeObserver that never fires, so the hook takes its usual path. */
class StillResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe.each([
  ['without a ResizeObserver', false],
  ['with a ResizeObserver', true],
])('%s', (_label, withObserver) => {
  const global = globalThis as { ResizeObserver?: unknown };
  const original = global.ResizeObserver;
  beforeEach(() => {
    // Set either way, so the path taken doesn't hang on what jsdom provides.
    global.ResizeObserver = withObserver ? StillResizeObserver : undefined;
  });
  afterEach(() => {
    global.ResizeObserver = original;
  });

  describe.each(callers)('$name when a web font loads', ({ ui, element }) => {
    it('measures again and becomes a tab stop once the text runs past its edge', async () => {
      render(ui);
      expect(element()).not.toHaveAttribute('tabindex');
      await fontLoads(600);
      expect(element()).toHaveAttribute('tabindex', '0');
    });

    it('drops the tab stop when a font narrows the text back inside it', async () => {
      Object.assign(sizes, { scrollWidth: 600 });
      render(ui);
      expect(element()).toHaveAttribute('tabindex', '0');
      await fontLoads(200);
      expect(element()).not.toHaveAttribute('tabindex');
    });

    it('measures again for each load after the first', async () => {
      render(ui);
      await fontLoads(200);
      expect(element()).not.toHaveAttribute('tabindex');
      await fontLoads(600);
      expect(element()).toHaveAttribute('tabindex', '0');
    });

    it('waits for a font that was already loading when it mounted', async () => {
      // Its event went out before the hook was listening.
      await fonts.startLoading();
      render(ui);
      expect(element()).not.toHaveAttribute('tabindex');
      Object.assign(sizes, { scrollWidth: 600 });
      await act(() => fonts.finishLoading());
      expect(element()).toHaveAttribute('tabindex', '0');
    });

    it('measures once for a load it sees both as the status and as the event', async () => {
      const started = fonts.startLoading();
      render(ui);
      const el = element();
      // The load's event, queued before the mount, arrives after it.
      await act(() => started);
      const reads = vi.spyOn(window, 'getComputedStyle');
      await act(() => fonts.finishLoading());
      expect(reads.mock.calls.filter(([target]) => target === el)).toHaveLength(
        1
      );
    });

    it('removes the listener it added once it unmounts', () => {
      const add = vi.spyOn(fonts, 'addEventListener');
      const remove = vi.spyOn(fonts, 'removeEventListener');
      const { unmount } = render(ui);
      const added = add.mock.calls.find(([type]) => type === 'loading');
      expect(added).toBeDefined();
      unmount();
      expect(remove).toHaveBeenCalledWith('loading', added![1]);
    });

    it('measures nothing once it has unmounted, though a load it waited on ends', async () => {
      const { unmount } = render(ui);
      const el = element();
      await act(() => fonts.startLoading());
      unmount();
      const reads = vi.spyOn(window, 'getComputedStyle');
      await act(() => fonts.finishLoading());
      expect(reads.mock.calls.some(([target]) => target === el)).toBe(false);
    });
  });
});

describe('without the Font Loading API', () => {
  it('measures on mount and throws nothing', () => {
    // An own property, so it hides a `fonts` jsdom may one day give Document.
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: undefined,
    });
    Object.assign(sizes, { scrollWidth: 600 });
    render(<Pre aria-label="Install command">npm install</Pre>);
    expect(screen.getByText('npm install')).toHaveAttribute('tabindex', '0');
  });
});
