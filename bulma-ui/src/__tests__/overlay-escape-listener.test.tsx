/**
 * Each overlay adds its Escape listener once while it's open and reads its
 * latest callback when the key arrives (#1088). It used to take the listener
 * off and add it again whenever the callback changed, and an inline callback
 * changes on every render of the parent. React can render between two
 * listeners for one keypress, and the browser runs neither a listener taken
 * off mid-event nor one added mid-event, so the overlay missed that Escape.
 */
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Modal } from '../components/Modal';
import { Sidebar } from '../components/Sidebar';
import { Toast } from '../components/Toast';
import { Loading } from '../components/Loading';

afterEach(() => {
  document.body.style.overflow = '';
});

/** Escape where focus is, as the keyboard sends it. */
const pressEscape = () => {
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
  });
};

/** The overlay under test, open, calling `onEscape` through an inline callback. */
type Overlay = (onEscape: () => void) => React.ReactElement;

const overlays: [string, Overlay][] = [
  [
    'Modal',
    onEscape => (
      <Modal active onClose={() => onEscape()} aria-label="Edit">
        <button type="button">Save</button>
      </Modal>
    ),
  ],
  [
    'Sidebar',
    onEscape => (
      <Sidebar isOpen onClose={() => onEscape()} aria-label="Filters">
        <button type="button">Reset</button>
      </Sidebar>
    ),
  ],
  [
    'Toast',
    onEscape => (
      <Toast
        message="Saved"
        duration={0}
        dismissible={false}
        onClose={() => onEscape()}
      />
    ),
  ],
  [
    'Loading',
    onEscape => <Loading active canCancel onCancel={() => onEscape()} />,
  ],
];

describe('An overlay whose parent renders during an Escape', () => {
  // A browser lets React render an update made in one listener before the
  // next one runs. jsdom runs them back to back, so the app's listener here
  // renders with `flushSync`, which does the same thing synchronously.
  it.each(overlays)(
    '%s still hears the Escape when a listener before it renders the parent',
    (_, overlay) => {
      const onEscape = jest.fn();
      let renderPage = () => {};
      const Page = () => {
        const [, setRenders] = useState(0);
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- stands in for the browser rendering between listeners
        renderPage = () => flushSync(() => setRenders(n => n + 1));
        return overlay(onEscape);
      };
      // Added before the overlay opens, so it runs before the overlay's own.
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') renderPage();
      };
      window.addEventListener('keydown', onKey);
      try {
        render(<Page />);

        pressEscape();
        expect(onEscape).toHaveBeenCalledTimes(1);
      } finally {
        window.removeEventListener('keydown', onKey);
      }
    }
  );

  it.each(overlays)(
    '%s keeps its Escape listener when the parent renders',
    (_, overlay) => {
      const onEscape = jest.fn();
      const Page = ({ step }: { step: number }) => (
        <>
          <p>Step {step}</p>
          {overlay(onEscape)}
        </>
      );
      const { rerender } = render(<Page step={1} />);
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');
      try {
        rerender(<Page step={2} />);
        const keydown = (spy: jest.SpyInstance) =>
          spy.mock.calls.filter(([type]) => type === 'keydown');
        expect(keydown(addSpy)).toHaveLength(0);
        expect(keydown(removeSpy)).toHaveLength(0);
      } finally {
        addSpy.mockRestore();
        removeSpy.mockRestore();
      }

      pressEscape();
      expect(onEscape).toHaveBeenCalledTimes(1);
    }
  );
});

describe('A Toast whose onClose renders the page a Modal is on', () => {
  it("leaves the Modal's Escape listener alone, and the next Escape closes the Modal", () => {
    const onModalClose = jest.fn();
    const Page = () => {
      const [saved, setSaved] = useState(false);
      return (
        <>
          {!saved && (
            <Toast
              message="Saved"
              duration={0}
              dismissible={false}
              closable
              onClose={() => setSaved(true)}
            />
          )}
          <Modal active onClose={() => onModalClose()} aria-label="Edit">
            <button type="button">Done</button>
          </Modal>
        </>
      );
    };
    render(<Page />);
    const addSpy = jest.spyOn(window, 'addEventListener');
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByText('Saved')).toBeNull();
      expect(
        addSpy.mock.calls.filter(([type]) => type === 'keydown')
      ).toHaveLength(0);
    } finally {
      addSpy.mockRestore();
    }

    pressEscape();
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });
});
