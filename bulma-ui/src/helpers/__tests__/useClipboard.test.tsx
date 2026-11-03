import { StrictMode } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  useClipboard,
  type UseClipboardOptions,
  type UseClipboardResult,
} from '../useClipboard';

/** What the stubbed copy command does when it runs. */
type CommandBehavior =
  | 'fires' // fires `copy` with clipboard data, and returns `true`
  | 'webkit' // as WebKit does with nothing selected: see stubCommand
  | 'fires-without-data' // fires `copy` with no `clipboardData`
  | 'silent' // fires nothing, and returns `false`
  | 'throws'; // throws, as an engine without the command would

/** The data each fired `copy` event carried, in order. */
let written: Array<{ type: string; text: string }>;
/** Whether each fired `copy` event was cancelled, in order. */
let cancelled: boolean[];

/**
 * Stubs `document.execCommand`, which jsdom doesn't have. Its `webkit`
 * behavior is WebKit's with nothing selected: it fires `beforecopy`, fires
 * `copy` only if a listener cancelled that, and returns `false` either way.
 */
function stubCommand(behavior: CommandBehavior) {
  const command = vi.fn((name: string) => {
    if (behavior === 'throws') throw new Error(`no ${name} command`);
    if (behavior === 'silent') return false;
    if (behavior === 'webkit') {
      const before = new Event('beforecopy', { cancelable: true });
      document.dispatchEvent(before);
      if (!before.defaultPrevented) return false;
    }
    const event = new Event('copy', { bubbles: true, cancelable: true });
    if (behavior !== 'fires-without-data') {
      Object.defineProperty(event, 'clipboardData', {
        value: {
          setData: (type: string, text: string) => written.push({ type, text }),
        },
      });
    }
    document.dispatchEvent(event);
    cancelled.push(event.defaultPrevented);
    return behavior === 'fires';
  });
  (document as unknown as { execCommand: unknown }).execCommand = command;
  return command;
}

/** Stubs `navigator.clipboard`, which jsdom doesn't have either. */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const spy = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: spy },
    configurable: true,
  });
  return spy;
}

beforeEach(() => {
  written = [];
  cancelled = [];
});

afterEach(() => {
  delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  delete (document as unknown as { execCommand?: unknown }).execCommand;
  vi.useRealTimers();
});

/** Runs `copy` inside act, so the state it sets is committed. */
async function copyWith(result: { current: UseClipboardResult }, text: string) {
  let outcome = false;
  await act(async () => {
    outcome = await result.current.copy(text);
  });
  return outcome;
}

const setup = (options?: UseClipboardOptions) =>
  renderHook((props: UseClipboardOptions | undefined) => useClipboard(props), {
    initialProps: options,
  });

describe('useClipboard', () => {
  describe('before a copy', () => {
    it('starts not copied, with no error', () => {
      const { result } = setup();
      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('keeps the same copy function from render to render', () => {
      const { result, rerender } = setup();
      const first = result.current.copy;
      rerender({ duration: 500 });
      expect(result.current.copy).toBe(first);
    });

    it('touches neither navigator nor the copy command while rendering', () => {
      const writeText = stubClipboard(() => Promise.resolve());
      const command = stubCommand('fires');
      const Probe = () => {
        const { copied } = useClipboard();
        return <span>{String(copied)}</span>;
      };
      expect(renderToString(<Probe />)).toBe('<span>false</span>');
      render(<Probe />);
      expect(writeText).not.toHaveBeenCalled();
      expect(command).not.toHaveBeenCalled();
    });
  });

  describe('through the Clipboard API', () => {
    it('writes with writeText, and resolves true', async () => {
      const writeText = stubClipboard(() => Promise.resolve());
      const command = stubCommand('fires');
      const { result } = setup();
      expect(await copyWith(result, 'https://bestax.io')).toBe(true);
      expect(writeText).toHaveBeenCalledWith('https://bestax.io');
      expect(command).not.toHaveBeenCalled();
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('still reports under StrictMode, which mounts its effects twice', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const onCopiedChange = vi.fn();
      const { result } = renderHook(() => useClipboard({ onCopiedChange }), {
        wrapper: StrictMode,
      });
      await copyWith(result, 'x');
      expect(result.current.copied).toBe(true);
      act(() => vi.advanceTimersByTime(2000));
      expect(result.current.copied).toBe(false);
      expect(onCopiedChange.mock.calls).toEqual([[true], [false]]);
    });

    it('stays copied for 2000 ms by default, then resets', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const onCopiedChange = vi.fn();
      const { result } = setup({ onCopiedChange });
      await copyWith(result, 'x');
      expect(onCopiedChange.mock.calls).toEqual([[true]]);
      act(() => vi.advanceTimersByTime(1999));
      expect(result.current.copied).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.copied).toBe(false);
      expect(onCopiedChange.mock.calls).toEqual([[true], [false]]);
    });

    it('stays copied for the duration given', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const { result } = setup({ duration: 500 });
      await copyWith(result, 'x');
      act(() => vi.advanceTimersByTime(499));
      expect(result.current.copied).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.copied).toBe(false);
    });

    it.each([Infinity, 3e9])(
      "caps a duration of %s at setTimeout's longest delay",
      async duration => {
        vi.useFakeTimers();
        stubClipboard(() => Promise.resolve());
        const { result } = setup({ duration });
        await copyWith(result, 'x');
        act(() => vi.advanceTimersByTime(2 ** 31 - 2));
        expect(result.current.copied).toBe(true);
        act(() => vi.advanceTimersByTime(1));
        expect(result.current.copied).toBe(false);
      }
    );

    it.each([
      ['NaN', NaN],
      ['null', null],
    ])('takes the default for a duration of %s', async (_, duration) => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const { result } = setup({ duration: duration as number });
      await copyWith(result, 'x');
      act(() => vi.advanceTimersByTime(1999));
      expect(result.current.copied).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.copied).toBe(false);
    });

    it('treats a negative duration as none', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const { result } = setup({ duration: -500 });
      await copyWith(result, 'x');
      expect(result.current.copied).toBe(true);
      act(() => vi.advanceTimersByTime(0));
      expect(result.current.copied).toBe(false);
    });

    it('restarts the time on another copy, and reports each copy', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const onCopiedChange = vi.fn();
      const { result } = setup({ onCopiedChange });
      await copyWith(result, 'one');
      act(() => vi.advanceTimersByTime(1500));
      await copyWith(result, 'two');
      act(() => vi.advanceTimersByTime(1500));
      expect(result.current.copied).toBe(true);
      expect(onCopiedChange.mock.calls).toEqual([[true], [true]]);
      act(() => vi.advanceTimersByTime(500));
      expect(result.current.copied).toBe(false);
      expect(onCopiedChange.mock.calls).toEqual([[true], [true], [false]]);
    });

    it('calls the callbacks from the latest render', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = setup({ onCopiedChange: first });
      await copyWith(result, 'x');
      rerender({ onCopiedChange: second });
      act(() => vi.advanceTimersByTime(2000));
      expect(first.mock.calls).toEqual([[true]]);
      expect(second.mock.calls).toEqual([[false]]);
    });
  });

  describe('through the copy command', () => {
    it('runs it where navigator.clipboard is missing, before copy returns', async () => {
      const command = stubCommand('fires');
      const { result } = setup();
      let pending: Promise<boolean> | undefined;
      await act(async () => {
        pending = result.current.copy('plain http');
        // Still inside the click: nothing has been awaited yet.
        expect(command).toHaveBeenCalledWith('copy');
        await pending;
      });
      expect(await pending).toBe(true);
      expect(written).toEqual([{ type: 'text/plain', text: 'plain http' }]);
      expect(cancelled).toEqual([true]);
      expect(result.current.copied).toBe(true);
    });

    it('runs it when writeText refuses', async () => {
      stubClipboard(() =>
        Promise.reject(new DOMException('Denied', 'NotAllowedError'))
      );
      stubCommand('fires');
      const { result } = setup();
      expect(await copyWith(result, 'in a frame')).toBe(true);
      expect(written).toEqual([{ type: 'text/plain', text: 'in a frame' }]);
      expect(result.current.error).toBeNull();
    });

    it('enables the command with beforecopy, and counts the event, not the return value', async () => {
      stubCommand('webkit');
      const { result } = setup();
      expect(await copyWith(result, 'webkit')).toBe(true);
      expect(result.current.copied).toBe(true);
    });

    it('counts a command that returns true but fires nothing as a failure', async () => {
      const command = vi.fn(() => true);
      (document as unknown as { execCommand: unknown }).execCommand = command;
      const { result } = setup();
      expect(await copyWith(result, 'x')).toBe(false);
      expect(command).toHaveBeenCalled();
      expect(result.current.copied).toBe(false);
    });

    it('takes its listener off again, whatever the command did', async () => {
      const listen = vi.spyOn(window, 'addEventListener');
      const unlisten = vi.spyOn(window, 'removeEventListener');
      for (const behavior of ['fires', 'silent', 'throws'] as const) {
        stubCommand(behavior);
        const { result } = setup();
        await copyWith(result, 'x');
      }
      for (const type of ['copy', 'beforecopy']) {
        const added = listen.mock.calls.filter(call => call[0] === type);
        const removed = unlisten.mock.calls.filter(call => call[0] === type);
        expect(added).toHaveLength(3);
        expect(removed).toEqual(added);
      }
      listen.mockRestore();
      unlisten.mockRestore();
    });

    it("keeps the page's own copy listeners from rewriting it", async () => {
      stubCommand('fires');
      // An attribution script or an editor, listening on the document.
      const rewrite = vi.fn((event: Event) =>
        (event as ClipboardEvent).clipboardData?.setData('text/plain', 'mine')
      );
      document.addEventListener('copy', rewrite, true);
      window.addEventListener('copy', rewrite);
      try {
        const { result } = setup();
        expect(await copyWith(result, 'copied text')).toBe(true);
      } finally {
        document.removeEventListener('copy', rewrite, true);
        window.removeEventListener('copy', rewrite);
      }
      expect(rewrite).not.toHaveBeenCalled();
      expect(written).toEqual([{ type: 'text/plain', text: 'copied text' }]);
    });

    it("leaves a later copy's data alone, and a later beforecopy", async () => {
      stubCommand('fires');
      const { result } = setup();
      await copyWith(result, 'mine');
      // A copy of the reader's own, after the fallback has finished.
      const before = new Event('beforecopy', { cancelable: true });
      document.dispatchEvent(before);
      expect(before.defaultPrevented).toBe(false);
      const event = new Event('copy', { bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(written).toHaveLength(1);
    });
  });

  describe('when neither can write', () => {
    it.each([
      ['fires nothing', 'silent'],
      ['throws', 'throws'],
      ['fires without clipboard data', 'fires-without-data'],
    ] as const)(
      'reports a failure when the command %s',
      async (_, behavior) => {
        stubCommand(behavior);
        const onCopyError = vi.fn();
        const onCopiedChange = vi.fn();
        const { result } = setup({ onCopyError, onCopiedChange });
        expect(await copyWith(result, 'x')).toBe(false);
        expect(result.current.copied).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toMatch(/copy command/);
        expect(onCopyError).toHaveBeenCalledWith(result.current.error);
        expect(onCopiedChange).not.toHaveBeenCalled();
      }
    );

    it("reports the Clipboard API's own error when it refused", async () => {
      const refusal = new DOMException(
        'Write permission denied',
        'NotAllowedError'
      );
      stubClipboard(() => Promise.reject(refusal));
      stubCommand('silent');
      const onCopyError = vi.fn();
      const { result } = setup({ onCopyError });
      await copyWith(result, 'x');
      expect(result.current.error).toBe(refusal);
      expect(onCopyError).toHaveBeenCalledWith(refusal);
    });

    it('reports an Error of its own when the refusal is not one', async () => {
      stubClipboard(() => Promise.reject('denied'));
      stubCommand('silent');
      const { result } = setup();
      await copyWith(result, 'x');
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toMatch(/Clipboard API/);
    });

    it('ends a copied state an earlier copy set', async () => {
      vi.useFakeTimers();
      const writeText = stubClipboard(() => Promise.resolve());
      stubCommand('silent');
      const onCopiedChange = vi.fn();
      const onCopyError = vi.fn();
      const { result } = setup({ onCopiedChange, onCopyError });
      await copyWith(result, 'one');
      writeText.mockImplementation(() => Promise.reject(new Error('no')));
      expect(await copyWith(result, 'two')).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(onCopiedChange.mock.calls).toEqual([[true], [false]]);
      expect(onCopyError).toHaveBeenCalledTimes(1);
      // The earlier copy's timer is gone too.
      act(() => vi.advanceTimersByTime(5000));
      expect(onCopiedChange.mock.calls).toEqual([[true], [false]]);
    });

    it('clears the error after a copy that works', async () => {
      const writeText = stubClipboard(() => Promise.reject(new Error('no')));
      stubCommand('silent');
      const { result } = setup();
      await copyWith(result, 'x');
      expect(result.current.error).not.toBeNull();
      writeText.mockImplementation(() => Promise.resolve());
      await copyWith(result, 'x');
      expect(result.current.error).toBeNull();
      expect(result.current.copied).toBe(true);
    });
  });

  describe('when copies overlap', () => {
    it("doesn't fall back for a copy a later one overtook", async () => {
      const pending: Array<{ reject: () => void; resolve: () => void }> = [];
      stubClipboard(
        () =>
          new Promise<void>((resolve, reject) => {
            pending.push({ resolve, reject: () => reject(new Error('no')) });
          })
      );
      const command = stubCommand('fires');
      const { result } = setup();
      let first: Promise<boolean> | undefined;
      let second: Promise<boolean> | undefined;
      act(() => {
        first = result.current.copy('older');
        second = result.current.copy('newer');
      });
      await act(async () => {
        pending[1].resolve();
        await second;
      });
      await act(async () => {
        pending[0].reject();
        expect(await first).toBe(false);
      });
      // The older text would have gone over the newer one.
      expect(command).not.toHaveBeenCalled();
      expect(written).toEqual([]);
      expect(result.current.copied).toBe(true);
    });

    it('still falls back for the latest copy', async () => {
      const pending: Array<{ reject: () => void }> = [];
      stubClipboard(
        () =>
          new Promise<void>((_, reject) => {
            pending.push({ reject: () => reject(new Error('no')) });
          })
      );
      stubCommand('fires');
      const { result } = setup();
      let latest: Promise<boolean> | undefined;
      act(() => {
        void result.current.copy('older');
        latest = result.current.copy('newer');
      });
      await act(async () => {
        pending[1].reject();
        expect(await latest).toBe(true);
      });
      expect(written).toEqual([{ type: 'text/plain', text: 'newer' }]);
      await act(async () => {
        pending[0].reject();
      });
      expect(written).toHaveLength(1);
    });

    /** A writeText whose calls each wait until the test settles them. */
    function deferredClipboard() {
      const pending: Array<{ resolve: () => void; reject: () => void }> = [];
      stubClipboard(
        () =>
          new Promise<void>((resolve, reject) => {
            pending.push({ resolve, reject: () => reject(new Error('no')) });
          })
      );
      return pending;
    }

    it('keeps the later copy when the earlier one finishes last', async () => {
      const pending = deferredClipboard();
      stubCommand('silent');
      const onCopiedChange = vi.fn();
      const onCopyError = vi.fn();
      const { result } = setup({ onCopiedChange, onCopyError });
      let first: Promise<boolean> | undefined;
      let second: Promise<boolean> | undefined;
      act(() => {
        first = result.current.copy('first');
        second = result.current.copy('second');
      });
      await act(async () => {
        pending[1].resolve();
        await second;
      });
      expect(result.current.copied).toBe(true);
      await act(async () => {
        pending[0].reject();
        expect(await first).toBe(false);
      });
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
      expect(onCopiedChange.mock.calls).toEqual([[true]]);
      expect(onCopyError).not.toHaveBeenCalled();
    });

    it('keeps the later copy when the earlier one finishes first', async () => {
      const pending = deferredClipboard();
      stubCommand('silent');
      const onCopiedChange = vi.fn();
      const onCopyError = vi.fn();
      const { result } = setup({ onCopiedChange, onCopyError });
      let first: Promise<boolean> | undefined;
      let second: Promise<boolean> | undefined;
      act(() => {
        first = result.current.copy('first');
        second = result.current.copy('second');
      });
      await act(async () => {
        pending[0].resolve();
        expect(await first).toBe(true);
      });
      expect(result.current.copied).toBe(false);
      expect(onCopiedChange).not.toHaveBeenCalled();
      await act(async () => {
        pending[1].reject();
        expect(await second).toBe(false);
      });
      expect(result.current.copied).toBe(false);
      expect(result.current.error?.message).toBe('no');
      expect(onCopiedChange).not.toHaveBeenCalled();
      expect(onCopyError).toHaveBeenCalledTimes(1);
    });
  });

  describe('after unmounting', () => {
    it('fires nothing when duration runs out', async () => {
      vi.useFakeTimers();
      stubClipboard(() => Promise.resolve());
      const onCopiedChange = vi.fn();
      const { result, unmount } = setup({ onCopiedChange });
      await copyWith(result, 'x');
      unmount();
      act(() => vi.advanceTimersByTime(5000));
      expect(onCopiedChange.mock.calls).toEqual([[true]]);
    });

    it('lets a write under way finish, and fires nothing for it', async () => {
      let finish: () => void = () => {};
      stubClipboard(
        () =>
          new Promise<void>(resolve => {
            finish = resolve;
          })
      );
      const onCopiedChange = vi.fn();
      const { result, unmount } = setup({ onCopiedChange });
      const pending = result.current.copy('x');
      unmount();
      finish();
      expect(await pending).toBe(true);
      expect(onCopiedChange).not.toHaveBeenCalled();
    });

    it('still reports a failed write as false', async () => {
      stubCommand('silent');
      const onCopyError = vi.fn();
      const { result, unmount } = setup({ onCopyError });
      const { copy } = result.current;
      unmount();
      expect(await copy('x')).toBe(false);
      expect(onCopyError).not.toHaveBeenCalled();
    });
  });
});
