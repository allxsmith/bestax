/**
 * One Escape closes the topmost overlay (#1085). Modal, Dialog through it,
 * Sidebar and a full-page Loading join one stack in the order they open, and
 * only the last one answers Escape, so the next Escape closes the one under
 * it. The one that closes marks the key used. A Toast and a Loading inside a
 * container stay out of the stack and wait until no overlay is open. Modal's
 * Tab trap follows the same stack, so a Sidebar opened over a Modal keeps
 * its Tab.
 */
import { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Modal } from '../components/Modal';
import { Dialog } from '../components/Dialog';
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

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));

/**
 * A Sidebar with a button that opens a Modal, and a Modal with a button that
 * opens the Sidebar, each closing for real. `closed` records the order.
 */
const Layers = ({
  open,
  closed,
}: {
  open: 'sidebar' | 'modal';
  closed: string[];
}) => {
  const [sidebar, setSidebar] = useState(open === 'sidebar');
  const [modal, setModal] = useState(open === 'modal');
  return (
    <>
      <Sidebar
        isOpen={sidebar}
        onClose={() => {
          closed.push('sidebar');
          setSidebar(false);
        }}
        aria-label="Filters"
      >
        <button type="button" onClick={() => setModal(true)}>
          Edit
        </button>
        <button type="button">Reset</button>
      </Sidebar>
      <Modal
        active={modal}
        onClose={() => {
          closed.push('modal');
          setModal(false);
        }}
        aria-label="Edit item"
      >
        <button type="button" onClick={() => setSidebar(true)}>
          Help
        </button>
        <button type="button">Save</button>
      </Modal>
    </>
  );
};

describe('Escape with overlays on top of each other', () => {
  it('closes a Modal opened over a Sidebar first, and the Sidebar on the next Escape', () => {
    const closed: string[] = [];
    render(<Layers open="sidebar" closed={closed} />);
    click('Edit');

    pressEscape();
    expect(closed).toEqual(['modal']);

    pressEscape();
    expect(closed).toEqual(['modal', 'sidebar']);
  });

  it('closes a Sidebar opened over a Modal first, and the Modal on the next Escape', () => {
    const closed: string[] = [];
    render(<Layers open="modal" closed={closed} />);
    click('Help');

    pressEscape();
    expect(closed).toEqual(['sidebar']);

    pressEscape();
    expect(closed).toEqual(['sidebar', 'modal']);
  });

  it('keeps the order under StrictMode, and leaves nothing behind once both close', () => {
    const closed: string[] = [];
    const onToastClose = jest.fn();
    render(
      <StrictMode>
        <Toast
          message="Saved"
          duration={0}
          dismissible={false}
          onClose={onToastClose}
        />
        <Layers open="sidebar" closed={closed} />
      </StrictMode>
    );
    click('Edit');

    pressEscape();
    pressEscape();
    expect(closed).toEqual(['modal', 'sidebar']);
    expect(onToastClose).not.toHaveBeenCalled();

    // With both closed, nothing is left in the stack to hold the key.
    pressEscape();
    expect(onToastClose).toHaveBeenCalledTimes(1);
  });

  it('closes a Dialog opened over a Sidebar first, as the Modal it renders', () => {
    const onSidebarClose = jest.fn();
    const onCancel = jest.fn();
    const Page = ({ dialog }: { dialog: boolean }) => (
      <>
        <Sidebar isOpen onClose={onSidebarClose} aria-label="Filters">
          <button type="button">Reset</button>
        </Sidebar>
        <Dialog
          isOpen={dialog}
          message="Discard changes?"
          onCancel={onCancel}
        />
      </>
    );
    const { rerender } = render(<Page dialog={false} />);
    rerender(<Page dialog />);

    pressEscape();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSidebarClose).not.toHaveBeenCalled();
  });

  it('keeps Escape from the overlay under one that does not close on it', () => {
    const onSidebarClose = jest.fn();
    const onModalClose = jest.fn();
    const Page = ({ modal }: { modal: boolean }) => (
      <>
        <Sidebar isOpen onClose={onSidebarClose} aria-label="Filters">
          <button type="button">Reset</button>
        </Sidebar>
        <Modal
          active={modal}
          onClose={onModalClose}
          closeOnEscape={false}
          aria-label="Terms"
        >
          <button type="button">Accept</button>
        </Modal>
      </>
    );
    const { rerender } = render(<Page modal={false} />);
    rerender(<Page modal />);

    expect(
      fireEvent.keyDown(screen.getByText('Accept'), { key: 'Escape' })
    ).toBe(true);
    expect(onModalClose).not.toHaveBeenCalled();
    expect(onSidebarClose).not.toHaveBeenCalled();
  });

  it.each([
    ['escapeClose is off', { escapeClose: false }],
    ['canCancel is off', { canCancel: false }],
    ['there is no onClose', { onClose: undefined }],
  ])(
    'leaves Escape unused from a Sidebar on top when %s, and the Modal under it open',
    (_, props) => {
      const onModalClose = jest.fn();
      const Page = ({ sidebar }: { sidebar: boolean }) => (
        <>
          <Modal active onClose={onModalClose} aria-label="Edit item">
            <button type="button">Save</button>
          </Modal>
          <Sidebar
            isOpen={sidebar}
            onClose={() => {}}
            aria-label="Filters"
            {...props}
          >
            <button type="button">Reset</button>
          </Sidebar>
        </>
      );
      const { rerender } = render(<Page sidebar={false} />);
      rerender(<Page sidebar />);

      expect(
        fireEvent.keyDown(screen.getByText('Reset'), { key: 'Escape' })
      ).toBe(true);
      expect(onModalClose).not.toHaveBeenCalled();
    }
  );

  it('marks the Escape the topmost overlay closes on as used', () => {
    const closed: string[] = [];
    render(<Layers open="sidebar" closed={closed} />);
    click('Edit');

    let sidebarEscapeUsed: boolean | undefined;
    let modalEscapeUsed: boolean | undefined;
    const after = (e: KeyboardEvent) => {
      if (closed.length === 1) modalEscapeUsed = e.defaultPrevented;
      else sidebarEscapeUsed = e.defaultPrevented;
    };
    // Added last, so it runs after both overlays' listeners.
    window.addEventListener('keydown', after);
    try {
      pressEscape();
      pressEscape();
    } finally {
      window.removeEventListener('keydown', after);
    }
    expect(closed).toEqual(['modal', 'sidebar']);
    expect(modalEscapeUsed).toBe(true);
    expect(sidebarEscapeUsed).toBe(true);
  });
});

describe('Tab with a Sidebar opened over a Modal', () => {
  it('leaves Tab to the page while the Sidebar is on top, and traps it again once it closes', () => {
    const closed: string[] = [];
    render(<Layers open="modal" closed={closed} />);
    click('Help');
    const inSidebar = screen.getByRole('button', { name: 'Edit' });
    expect(inSidebar).toHaveFocus();

    // The Modal under it doesn't pull focus back.
    expect(fireEvent.keyDown(inSidebar, { key: 'Tab' })).toBe(true);
    expect(inSidebar).toHaveFocus();

    pressEscape();
    expect(closed).toEqual(['sidebar']);
    act(() => inSidebar.focus());
    expect(fireEvent.keyDown(inSidebar, { key: 'Tab' })).toBe(false);
    expect(screen.getByRole('button', { name: 'Help' })).toHaveFocus();
  });
});

describe('Tab in a Dialog rendered inside a Sidebar', () => {
  // A Dialog renders in place by default, so it sits inside the Sidebar's
  // DOM, and a Tab in it reaches the Sidebar's element before the Dialog's
  // own listener on `window`. Anything that holds Tab in the Sidebar (#1114)
  // has to leave this one to the Dialog on top.
  it("wraps from the Dialog's last button to its first, not out into the Sidebar", () => {
    const Page = () => {
      const [confirm, setConfirm] = useState(false);
      return (
        <Sidebar isOpen onClose={() => {}} aria-label="Filters">
          <button type="button" onClick={() => setConfirm(true)}>
            Delete all
          </button>
          <Dialog
            isOpen={confirm}
            message="Delete everything?"
            onCancel={() => setConfirm(false)}
            onConfirm={() => setConfirm(false)}
          />
        </Sidebar>
      );
    };
    render(<Page />);
    click('Delete all');
    const ok = screen.getByRole('button', { name: 'OK' });
    act(() => ok.focus());

    expect(fireEvent.keyDown(ok, { key: 'Tab' })).toBe(false);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });
});

describe('Escape with a Loading up', () => {
  /** A Modal with a Save button that shows a cancelable Loading. */
  const Saving = ({
    isFullPage,
    onModalClose,
    onCancel,
  }: {
    isFullPage: boolean;
    onModalClose: () => void;
    onCancel: () => void;
  }) => {
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState(true);
    return (
      <>
        <Modal
          active={modal}
          onClose={() => {
            onModalClose();
            setModal(false);
          }}
          aria-label="Edit item"
        >
          <button type="button" onClick={() => setSaving(true)}>
            Save
          </button>
        </Modal>
        <Loading
          active={saving}
          isFullPage={isFullPage}
          canCancel
          onCancel={() => {
            onCancel();
            setSaving(false);
          }}
        />
      </>
    );
  };

  it('cancels a full-page Loading shown over a Modal first, and closes the Modal on the next Escape', () => {
    const onModalClose = jest.fn();
    const onCancel = jest.fn();
    render(
      <Saving isFullPage onModalClose={onModalClose} onCancel={onCancel} />
    );
    click('Save');

    pressEscape();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onModalClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('closes a Modal opened over a full-page Loading first', () => {
    const onModalClose = jest.fn();
    const onCancel = jest.fn();
    const Page = ({ modal }: { modal: boolean }) => (
      <>
        <Loading active isFullPage canCancel onCancel={onCancel} />
        <Modal active={modal} onClose={onModalClose} aria-label="Session">
          <button type="button">Stay signed in</button>
        </Modal>
      </>
    );
    const { rerender } = render(<Page modal={false} />);
    rerender(<Page modal />);

    pressEscape();
    expect(onModalClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('keeps the Modal under a full-page Loading that cannot be cancelled open', () => {
    const onModalClose = jest.fn();
    const Page = ({ saving }: { saving: boolean }) => (
      <>
        <Modal active onClose={onModalClose} aria-label="Edit item">
          <button type="button">Save</button>
        </Modal>
        <Loading active={saving} isFullPage />
      </>
    );
    const { rerender } = render(<Page saving={false} />);
    rerender(<Page saving />);

    pressEscape();
    expect(onModalClose).not.toHaveBeenCalled();
  });

  it('closes the Modal before a Loading in a container, which cancels on the next Escape', () => {
    const onModalClose = jest.fn();
    const onCancel = jest.fn();
    render(
      <Saving
        isFullPage={false}
        onModalClose={onModalClose}
        onCancel={onCancel}
      />
    );
    click('Save');

    pressEscape();
    expect(onModalClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    pressEscape();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels a Loading in a container with no overlay open, and marks the Escape used', () => {
    const onCancel = jest.fn();
    render(<Loading active canCancel onCancel={onCancel} />);

    expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('Escape with a Toast up', () => {
  it.each([
    ['shown before the Modal opened', 'before'],
    ['shown while the Modal was open', 'after'],
  ])(
    'closes the Modal first and the Toast on the next Escape, with the Toast %s',
    (_, when) => {
      const onModalClose = jest.fn();
      const onToastClose = jest.fn();
      const toastEl = (
        <Toast
          key="toast"
          message="Saved"
          duration={0}
          dismissible={false}
          onClose={onToastClose}
        />
      );
      const Page = ({ modal, toast }: { modal: boolean; toast: boolean }) => {
        const [open, setOpen] = useState(true);
        const modalEl = (
          <Modal
            key="modal"
            active={modal && open}
            onClose={() => {
              onModalClose();
              setOpen(false);
            }}
            aria-label="Edit item"
          >
            <button type="button">Save</button>
          </Modal>
        );
        return <>{toast ? [toastEl, modalEl] : [modalEl]}</>;
      };
      const { rerender } = render(
        <Page modal={when === 'after'} toast={when === 'before'} />
      );
      rerender(<Page modal toast />);

      pressEscape();
      expect(onModalClose).toHaveBeenCalledTimes(1);
      expect(onToastClose).not.toHaveBeenCalled();

      pressEscape();
      expect(onToastClose).toHaveBeenCalledTimes(1);
    }
  );

  it('stays up when the Modal it was shown over renders its close at once', () => {
    // A browser can render the Modal's close before the Toast's listener
    // runs, and then no overlay is open by the time the Toast asks. The
    // Modal marked the key used, so the Toast still leaves it.
    // `flushSync` does here what the browser does between listeners.
    const onToastClose = jest.fn();
    const Page = ({ toast }: { toast: boolean }) => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Modal
            active={open}
            // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- stands in for the browser rendering between listeners
            onClose={() => flushSync(() => setOpen(false))}
            aria-label="Edit item"
          >
            <button type="button">Save</button>
          </Modal>
          {toast && (
            <Toast
              message="Saved"
              duration={0}
              dismissible={false}
              onClose={onToastClose}
            />
          )}
        </>
      );
    };
    const { rerender } = render(<Page toast={false} />);
    rerender(<Page toast />);

    pressEscape();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onToastClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onToastClose).toHaveBeenCalledTimes(1);
  });

  it('leaves the Escape it closes on unused', () => {
    const onToastClose = jest.fn();
    render(
      <Toast
        message="Saved"
        duration={0}
        dismissible={false}
        onClose={onToastClose}
      />
    );
    expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(true);
    expect(onToastClose).toHaveBeenCalledTimes(1);
  });
});
