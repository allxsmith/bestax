import React, { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { CopyButton, type CopyButtonProps } from '../CopyButton';
import { Buttons } from '../Buttons';
import { Modal } from '../../components/Modal';
import { Control } from '../../form/Control';
import { Field } from '../../form/Field';
import { ConfigProvider } from '../../helpers/Config';
import { announceDelay } from '../../helpers/statusRegion';

/** Stubs `navigator.clipboard`, which jsdom doesn't have. */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const spy = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: spy },
    configurable: true,
  });
  return spy;
}

/** Writes are accepted. */
const clipboardWorks = () => stubClipboard(() => Promise.resolve());

/** Writes are refused, and there's no copy command to fall back on. */
const clipboardRefuses = () =>
  stubClipboard(() =>
    Promise.reject(new DOMException('Denied', 'NotAllowedError'))
  );

afterEach(() => {
  delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Clicks it, and lets the write finish. */
async function click(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button);
  });
}

/** The status region, wherever it was portaled to. */
const region = () => document.querySelector('[role="status"]');

/** The announcements the region holds right now. */
const spoken = () =>
  Array.from(region()?.children ?? [], node => node.textContent);

/** Whether the glyph drawn is the check rather than the copy sheets. */
const showsCheck = (button: HTMLElement) =>
  button.querySelector('.icon svg polyline') !== null;

/** Props as a JavaScript caller might pass them, past the types. */
const untyped = (props: Record<string, unknown>) =>
  props as unknown as Partial<CopyButtonProps>;

describe('CopyButton', () => {
  describe('what it renders', () => {
    it('renders a <button type="button"> with an icon and "Copy"', () => {
      render(<CopyButton value="https://bestax.io" />);
      const button = screen.getByRole('button', { name: 'Copy' });
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('button');
      expect(button).not.toHaveClass('icon-button');
      expect(button).not.toHaveAttribute('aria-label');
      expect(button).not.toHaveAttribute('value');
      const [icon, label] = Array.from(button.children);
      expect(icon).toHaveClass('icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon.querySelector('svg')).not.toBeNull();
      expect(label.tagName).toBe('SPAN');
      expect(label).toHaveTextContent('Copy');
      expect(showsCheck(button)).toBe(false);
    });

    it('passes the helper props and other attributes to the button', () => {
      render(
        <CopyButton
          value="x"
          color="primary"
          size="small"
          mr="2"
          className="custom"
          id="copy"
          title="Copy the link"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'button',
        'is-primary',
        'is-small',
        'mr-2',
        'custom'
      );
      expect(button).toHaveAttribute('id', 'copy');
      expect(button).toHaveAttribute('title', 'Copy the link');
    });

    it('forwards its ref to the <button>, in both forms', () => {
      const labelled = createRef<HTMLButtonElement>();
      const iconOnly = createRef<HTMLButtonElement>();
      render(
        <>
          <CopyButton value="x" ref={labelled} />
          <CopyButton value="x" ref={iconOnly} showLabel={false} />
        </>
      );
      const [first, second] = screen.getAllByRole('button');
      expect(labelled.current).toBe(first);
      expect(iconOnly.current).toBe(second);
    });

    it('keeps submit and reset, and makes anything else a button', () => {
      render(
        <>
          <CopyButton value="x" type="submit" />
          <CopyButton value="x" type="reset" />
          <CopyButton value="x" {...untyped({ type: 'text/html' })} />
          <CopyButton value="x" showLabel={false} type="submit" />
          <CopyButton
            value="x"
            showLabel={false}
            {...untyped({ type: undefined })}
          />
        </>
      );
      expect(
        screen.getAllByRole('button').map(b => b.getAttribute('type'))
      ).toEqual(['submit', 'reset', 'button', 'submit', 'button']);
    });

    it('stays a <button> whatever a JavaScript caller passes as `as`', () => {
      render(<CopyButton value="x" {...untyped({ as: 'a', href: '/x' })} />);
      expect(screen.getByRole('button').tagName).toBe('BUTTON');
    });

    it('renders no children it is given', () => {
      render(
        <CopyButton value="x" {...untyped({ children: 'Copy the link' })} />
      );
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    });

    it('has a displayName for dev tools', () => {
      expect(CopyButton.displayName).toBe('CopyButton');
    });
  });

  describe('copying', () => {
    it('writes value, then reads "Copied" for 2000 ms', async () => {
      vi.useFakeTimers();
      const writeText = clipboardWorks();
      render(<CopyButton value="https://bestax.io" />);
      const button = screen.getByRole('button', { name: 'Copy' });
      await click(button);
      expect(writeText).toHaveBeenCalledWith('https://bestax.io');
      expect(button).toHaveAccessibleName('Copied');
      expect(button).not.toHaveAttribute('aria-label');
      expect(showsCheck(button)).toBe(true);
      act(() => vi.advanceTimersByTime(1999));
      expect(button).toHaveAccessibleName('Copied');
      act(() => vi.advanceTimersByTime(1));
      expect(button).toHaveAccessibleName('Copy');
      expect(showsCheck(button)).toBe(false);
    });

    it('lasts the duration given', async () => {
      vi.useFakeTimers();
      clipboardWorks();
      render(<CopyButton value="x" duration={500} />);
      const button = screen.getByRole('button');
      await click(button);
      act(() => vi.advanceTimersByTime(499));
      expect(button).toHaveAccessibleName('Copied');
      act(() => vi.advanceTimersByTime(1));
      expect(button).toHaveAccessibleName('Copy');
    });

    it('calls onCopiedChange with true, then false', async () => {
      vi.useFakeTimers();
      clipboardWorks();
      const onCopiedChange = vi.fn();
      render(<CopyButton value="x" onCopiedChange={onCopiedChange} />);
      await click(screen.getByRole('button'));
      expect(onCopiedChange.mock.calls).toEqual([[true]]);
      act(() => vi.advanceTimersByTime(2000));
      expect(onCopiedChange.mock.calls).toEqual([[true], [false]]);
    });

    it("runs the caller's onClick first, with the event", async () => {
      const writeText = clipboardWorks();
      const onClick = vi.fn(() => {
        expect(writeText).not.toHaveBeenCalled();
      });
      render(<CopyButton value="x" onClick={onClick} />);
      await click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'click' })
      );
      expect(writeText).toHaveBeenCalled();
    });

    it('copies nothing when onClick calls preventDefault()', async () => {
      const writeText = clipboardWorks();
      const onCopiedChange = vi.fn();
      render(
        <CopyButton
          value="x"
          onClick={event => event.preventDefault()}
          onCopiedChange={onCopiedChange}
        />
      );
      const button = screen.getByRole('button');
      await click(button);
      expect(writeText).not.toHaveBeenCalled();
      expect(onCopiedChange).not.toHaveBeenCalled();
      expect(button).toHaveAccessibleName('Copy');
    });

    it('copies nothing while disabled', async () => {
      const writeText = clipboardWorks();
      render(<CopyButton value="x" disabled />);
      await click(screen.getByRole('button'));
      expect(writeText).not.toHaveBeenCalled();
    });

    it('never submits the form around it', async () => {
      clipboardWorks();
      const onSubmit = vi.fn((event: React.FormEvent) =>
        event.preventDefault()
      );
      render(
        <form onSubmit={onSubmit}>
          <CopyButton value="x" />
        </form>
      );
      await click(screen.getByRole('button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('copies the value it has when clicked', async () => {
      const writeText = clipboardWorks();
      const { rerender } = render(<CopyButton value="first" />);
      rerender(<CopyButton value="second" />);
      await click(screen.getByRole('button'));
      expect(writeText).toHaveBeenCalledWith('second');
    });
  });

  describe('a failed copy', () => {
    it('keeps "Copy", calls onCopyError, and announces the failure', async () => {
      vi.useFakeTimers();
      clipboardRefuses();
      const onCopyError = vi.fn();
      const onCopiedChange = vi.fn();
      render(
        <CopyButton
          value="x"
          onCopyError={onCopyError}
          onCopiedChange={onCopiedChange}
        />
      );
      const button = screen.getByRole('button');
      await click(button);
      expect(button).toHaveAccessibleName('Copy');
      expect(showsCheck(button)).toBe(false);
      expect(onCopyError).toHaveBeenCalledWith(expect.any(Error));
      expect(onCopiedChange).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(["Couldn't copy to the clipboard"]);
    });

    it('turns "Copied" back to "Copy"', async () => {
      const writeText = clipboardWorks();
      render(<CopyButton value="x" />);
      const button = screen.getByRole('button');
      await click(button);
      expect(button).toHaveAccessibleName('Copied');
      writeText.mockImplementation(() => Promise.reject(new Error('no')));
      await click(button);
      expect(button).toHaveAccessibleName('Copy');
    });
  });

  describe('announcing', () => {
    it('announces each copy through a polite status region', async () => {
      vi.useFakeTimers();
      clipboardWorks();
      render(<CopyButton value="x" />);
      expect(region()).toHaveAttribute('aria-live', 'polite');
      expect(spoken()).toEqual([]);
      await click(screen.getByRole('button'));
      // Written a moment after, into a region that was already there.
      expect(spoken()).toEqual([]);
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(['Copied to the clipboard']);
      act(() => vi.advanceTimersByTime(1000));
      expect(spoken()).toEqual([]);
      // A repeat, while it still reads "Copied", is announced again.
      await click(screen.getByRole('button'));
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(['Copied to the clipboard']);
    });

    it('portals the region out of the Control, so the button stays last', () => {
      render(
        <Field hasAddons>
          <Control>
            <input aria-label="Link" readOnly value="x" />
          </Control>
          <Control data-testid="control">
            <CopyButton value="x" />
          </Control>
        </Field>
      );
      const control = screen.getByTestId('control');
      expect(control.children).toHaveLength(1);
      expect(control.lastElementChild).toBe(screen.getByRole('button'));
      expect(control.contains(region())).toBe(false);
    });

    it('keeps the button the last child of Buttons', () => {
      render(
        <Buttons hasAddons data-testid="row">
          <CopyButton value="a" />
          <CopyButton value="b" showLabel={false} />
        </Buttons>
      );
      const row = screen.getByTestId('row');
      expect(Array.from(row.children, c => c.tagName)).toEqual([
        'BUTTON',
        'BUTTON',
      ]);
    });

    it("portals into ConfigProvider's portalContainer", () => {
      const target = document.createElement('div');
      document.body.appendChild(target);
      try {
        render(
          <ConfigProvider portalContainer={target}>
            <CopyButton value="x" />
          </ConfigProvider>
        );
        expect(target.contains(region())).toBe(true);
      } finally {
        target.remove();
      }
    });

    describe('inside an open modal dialog', () => {
      /** The status regions inside the open modal, and what they say. */
      const insideModal = () => {
        const modal = document.querySelector('[aria-modal="true"]');
        return Array.from(
          modal?.querySelectorAll('[role="status"]') ?? [],
          node => Array.from(node.children, child => child.textContent)
        );
      };

      it('puts the region inside the dialog, beside the button, not in it', async () => {
        vi.useFakeTimers();
        clipboardWorks();
        render(
          <Modal active aria-label="Share">
            <Field hasAddons>
              <Control data-testid="control">
                <CopyButton value="x" />
              </Control>
            </Field>
          </Modal>
        );
        const button = screen.getByRole('button', { name: 'Copy' });
        act(() => button.focus());
        expect(insideModal()).toEqual([[]]);
        const control = screen.getByTestId('control');
        expect(control.children).toHaveLength(1);
        expect(button.querySelector('[role="status"]')).toBeNull();
        await click(button);
        act(() => vi.advanceTimersByTime(announceDelay));
        expect(insideModal()).toEqual([['Copied to the clipboard']]);
      });

      it('finds a modal that opens after the button mounted, and says nothing old there', async () => {
        vi.useFakeTimers();
        clipboardWorks();
        const { rerender } = render(
          <Modal active={false}>
            <CopyButton value="x" />
          </Modal>
        );
        // A copy while it's closed, which a script can still run.
        await click(screen.getByRole('button', { hidden: true }));
        act(() => vi.advanceTimersByTime(2000));
        expect(insideModal()).toEqual([]);
        rerender(
          <Modal active aria-label="Share">
            <CopyButton value="x" />
          </Modal>
        );
        const button = screen.getByRole('button', { name: 'Copy' });
        act(() => button.focus());
        act(() => vi.advanceTimersByTime(announceDelay));
        // The region moved in on focus, empty: the earlier copy isn't said.
        expect(insideModal()).toEqual([[]]);
        await click(button);
        act(() => vi.advanceTimersByTime(announceDelay));
        expect(insideModal()).toEqual([['Copied to the clipboard']]);
        expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
      });

      it("still calls the caller's onFocus", () => {
        const onFocus = vi.fn();
        render(<CopyButton value="x" onFocus={onFocus} />);
        act(() => screen.getByRole('button').focus());
        expect(onFocus).toHaveBeenCalledTimes(1);
      });
    });

    it('announces nothing after it unmounts', async () => {
      vi.useFakeTimers();
      clipboardWorks();
      const onCopiedChange = vi.fn();
      const { unmount } = render(
        <CopyButton value="x" onCopiedChange={onCopiedChange} />
      );
      await click(screen.getByRole('button'));
      unmount();
      expect(region()).toBeNull();
      act(() => vi.advanceTimersByTime(5000));
      expect(onCopiedChange.mock.calls).toEqual([[true]]);
    });
  });

  describe('labels', () => {
    it('takes the label and the announcements from labels', async () => {
      vi.useFakeTimers();
      const writeText = clipboardWorks();
      render(
        <CopyButton
          value="x"
          labels={{
            copy: 'Copy code',
            copied: 'Code copied',
            copiedStatus: 'Invite code copied',
            failedStatus: 'Copy the code from the field',
          }}
        />
      );
      const button = screen.getByRole('button', { name: 'Copy code' });
      await click(button);
      expect(button).toHaveAccessibleName('Code copied');
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(['Invite code copied']);
      act(() => vi.advanceTimersByTime(2000));
      writeText.mockImplementation(() => Promise.reject(new Error('no')));
      await click(button);
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(['Copy the code from the field']);
    });

    it('keeps a default for a label left out or empty', async () => {
      vi.useFakeTimers();
      clipboardWorks();
      render(<CopyButton value="x" labels={{ copy: '', copiedStatus: '' }} />);
      const button = screen.getByRole('button', { name: 'Copy' });
      await click(button);
      expect(button).toHaveAccessibleName('Copied');
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(['Copied to the clipboard']);
    });
  });

  describe('icon-only', () => {
    it('renders through IconButton, named "Copy" in both states', async () => {
      vi.useFakeTimers();
      clipboardWorks();
      render(<CopyButton value="x" showLabel={false} />);
      const button = screen.getByRole('button', { name: 'Copy' });
      expect(button).toHaveClass('button', 'icon-button');
      expect(button).toHaveAttribute('aria-label', 'Copy');
      expect(button).toHaveAttribute('type', 'button');
      expect(button.children).toHaveLength(1);
      expect(button.firstElementChild).toHaveClass('icon');
      expect(button).toHaveTextContent('');
      await click(button);
      expect(button).toHaveAttribute('aria-label', 'Copy');
      expect(showsCheck(button)).toBe(true);
      act(() => vi.advanceTimersByTime(announceDelay));
      expect(spoken()).toEqual(['Copied to the clipboard']);
      act(() => vi.advanceTimersByTime(2000));
      expect(showsCheck(button)).toBe(false);
    });

    it('is named by labels.copy, and never by labels.copied', async () => {
      clipboardWorks();
      render(
        <CopyButton
          value="x"
          showLabel={false}
          labels={{ copy: 'Copy API key', copied: 'Key copied' }}
        />
      );
      const button = screen.getByRole('button', { name: 'Copy API key' });
      await click(button);
      expect(button).toHaveAccessibleName('Copy API key');
    });

    it('lets an aria-label of your own name it, in either form', () => {
      render(
        <>
          <CopyButton value="x" showLabel={false} aria-label="Copy token" />
          <CopyButton value="x" aria-label="Copy the invite link" />
        </>
      );
      const [iconOnly, labelled] = screen.getAllByRole('button');
      expect(iconOnly).toHaveAccessibleName('Copy token');
      expect(labelled).toHaveAccessibleName('Copy the invite link');
    });

    it('warns about nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<CopyButton value="x" showLabel={false} />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('prefixes every class under ConfigProvider classPrefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <CopyButton value="x" color="link" />
        <CopyButton value="x" showLabel={false} />
      </ConfigProvider>
    );
    const [labelled, iconOnly] = screen.getAllByRole('button');
    expect(labelled).toHaveClass('bestax-button', 'bestax-is-link');
    expect(labelled).not.toHaveClass('button');
    expect(labelled.firstElementChild).toHaveClass('bestax-icon');
    expect(iconOnly).toHaveClass('bestax-button', 'bestax-icon-button');
    expect(iconOnly).not.toHaveClass('icon-button');
  });

  it('hydrates without a mismatch, and adds the region after', async () => {
    const tree = <CopyButton value="https://bestax.io" color="primary" />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);
    const before = container.innerHTML;
    expect(before).toContain('type="button"');
    expect(before).not.toContain('role="status"');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, tree);
        unmountRoot = () => root.unmount();
      });
      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe(before);
      expect(region()).not.toBeNull();
      expect(container.contains(region())).toBe(false);
    } finally {
      await act(async () => unmountRoot());
      document.body.removeChild(container);
    }
  });
});
