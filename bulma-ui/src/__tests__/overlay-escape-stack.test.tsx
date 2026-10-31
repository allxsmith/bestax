/**
 * One Escape closes the topmost overlay (#1085). Modal, Dialog through it,
 * Sidebar and a full-page Loading join one stack in the order they open, and
 * only the last one answers Escape, so the next Escape closes the one under
 * it. The one that closes marks the key used. A Toast and a Loading inside a
 * container stay out of the stack and wait until no overlay is open. Modal
 * and a Sidebar with an overlay hold Tab by the same stack (#1114), so the
 * one on top holds it and the one under it stands aside until it closes.
 * Only modal overlays count for Tab (#1191): a Sidebar without an overlay
 * over a Modal takes Escape first but leaves the Modal holding Tab.
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
    const onToastClose = vi.fn();
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
    const onSidebarClose = vi.fn();
    const onCancel = vi.fn();
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
    const onSidebarClose = vi.fn();
    const onModalClose = vi.fn();
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
      const onModalClose = vi.fn();
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
  it('holds Tab in the Sidebar while it is on top, and in the Modal once it closes', () => {
    const closed: string[] = [];
    render(<Layers open="modal" closed={closed} />);
    const help = screen.getByRole('button', { name: 'Help' });
    expect(help).toHaveFocus();
    click('Help');
    const edit = screen.getByRole('button', { name: 'Edit' });
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(edit).toHaveFocus();

    // The Modal under it doesn't pull focus back.
    expect(fireEvent.keyDown(edit, { key: 'Tab' })).toBe(true);
    expect(edit).toHaveFocus();
    // The Sidebar wraps it.
    act(() => reset.focus());
    expect(fireEvent.keyDown(reset, { key: 'Tab' })).toBe(false);
    expect(edit).toHaveFocus();

    // Closing hands focus back to the Modal, which holds Tab again.
    pressEscape();
    expect(closed).toEqual(['sidebar']);
    expect(help).toHaveFocus();
    // The Modal's last tab stop is its floating close button.
    const close = screen.getByRole('button', { name: 'close' });
    act(() => close.focus());
    expect(fireEvent.keyDown(close, { key: 'Tab' })).toBe(false);
    expect(help).toHaveFocus();
  });
});

describe('Tab with a Modal opened over a Sidebar', () => {
  it('holds Tab in the Modal while it is on top, and in the Sidebar once it closes', () => {
    const closed: string[] = [];
    render(<Layers open="sidebar" closed={closed} />);
    const edit = screen.getByRole('button', { name: 'Edit' });
    expect(edit).toHaveFocus();
    click('Edit');
    const help = screen.getByRole('button', { name: 'Help' });
    // The Modal's last tab stop is its floating close button.
    const close = screen.getByRole('button', { name: 'close' });
    expect(help).toHaveFocus();

    // The Sidebar under it stands aside: focus is outside it, and it would
    // otherwise pull focus back in.
    act(() => close.focus());
    expect(fireEvent.keyDown(close, { key: 'Tab' })).toBe(false);
    expect(help).toHaveFocus();
    expect(fireEvent.keyDown(help, { key: 'Tab', shiftKey: true })).toBe(false);
    expect(close).toHaveFocus();

    // Closing hands focus back to the Sidebar, which holds Tab again.
    pressEscape();
    expect(closed).toEqual(['modal']);
    expect(edit).toHaveFocus();
    expect(fireEvent.keyDown(edit, { key: 'Tab', shiftKey: true })).toBe(false);
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(reset).toHaveFocus();
    expect(fireEvent.keyDown(reset, { key: 'Tab' })).toBe(false);
    expect(edit).toHaveFocus();
  });
});

describe('Tab in a Dialog rendered inside a Sidebar', () => {
  // A Dialog renders in place by default, so it sits inside the Sidebar's
  // DOM, and the Sidebar, open first, hears a Tab in it before the Dialog's
  // own listener on `window` does. The Sidebar leaves it to the Dialog on top.
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

    // Once the Dialog closes, the Sidebar holds Tab again.
    click('Cancel');
    const deleteAll = screen.getByRole('button', { name: 'Delete all' });
    expect(deleteAll).toHaveFocus();
    expect(fireEvent.keyDown(deleteAll, { key: 'Tab' })).toBe(false);
    expect(deleteAll).toHaveFocus();
  });
});

describe('Tab with a Sidebar without an overlay opened over a modal one', () => {
  // A sidebar without an overlay isn't modal: it takes its turn for Escape,
  // but the modal overlay under it keeps holding Tab (#1191), and focus with
  // it, since a Tab from the sidebar would only go back there.

  /** A Modal with a button that opens a Sidebar without an overlay. */
  const TipsOverModal = ({ closed }: { closed: string[] }) => {
    const [sidebar, setSidebar] = useState(false);
    const [modal, setModal] = useState(true);
    return (
      <>
        <Modal
          active={modal}
          onClose={() => {
            closed.push('modal');
            setModal(false);
          }}
          aria-label="Edit item"
        >
          <Modal.Content>
            <button type="button" onClick={() => setSidebar(true)}>
              Tips
            </button>
            <button type="button">Save</button>
          </Modal.Content>
        </Modal>
        <Sidebar
          isOpen={sidebar}
          overlay={false}
          onClose={() => {
            closed.push('sidebar');
            setSidebar(false);
          }}
          aria-label="Tips"
        >
          <button type="button">Next tip</button>
          <button type="button">Previous tip</button>
        </Sidebar>
      </>
    );
  };

  it('keeps Tab and focus in a Modal under it, and Escape closes the Sidebar first', () => {
    const closed: string[] = [];
    render(<TipsOverModal closed={closed} />);
    const tips = screen.getByRole('button', { name: 'Tips' });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(tips).toHaveFocus();
    click('Tips');
    expect(screen.getByRole('dialog', { name: 'Tips' })).toBeInTheDocument();
    expect(tips).toHaveFocus();

    // The Modal wraps from its last stop to its first, and a Tab from the
    // sidebar, outside it, comes back in.
    act(() => save.focus());
    expect(fireEvent.keyDown(save, { key: 'Tab' })).toBe(false);
    expect(tips).toHaveFocus();
    const nextTip = screen.getByRole('button', { name: 'Next tip' });
    act(() => nextTip.focus());
    expect(fireEvent.keyDown(nextTip, { key: 'Tab', shiftKey: true })).toBe(
      false
    );
    expect(save).toHaveFocus();

    // Escape is still the sidebar's first, as the overlay on top, and its
    // close leaves focus where it is in the Modal.
    pressEscape();
    expect(closed).toEqual(['sidebar']);
    expect(save).toHaveFocus();
    pressEscape();
    expect(closed).toEqual(['sidebar', 'modal']);
  });

  it('hands focus back to the Modal when it closes with focus a click put in it', () => {
    const closed: string[] = [];
    render(<TipsOverModal closed={closed} />);
    click('Tips');
    act(() => screen.getByRole('button', { name: 'Previous tip' }).focus());

    pressEscape();
    expect(closed).toEqual(['sidebar']);
    expect(screen.getByRole('button', { name: 'Tips' })).toHaveFocus();
  });

  it("sends focus to the Modal's opener when the Modal closes first, and leaves the sidebar open and reachable", () => {
    // Settled behaviour, not a gap: the sidebar isn't modal, so with the
    // Modal gone it's an ordinary panel on the page, still reachable, and it
    // doesn't claim focus back.
    const Page = () => {
      const [modal, setModal] = useState(false);
      const [sidebar, setSidebar] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setModal(true)}>
            Edit
          </button>
          <Modal active={modal} aria-label="Edit item">
            <Modal.Content>
              <button type="button" onClick={() => setSidebar(true)}>
                Tips
              </button>
              <button type="button" onClick={() => setModal(false)}>
                Done
              </button>
            </Modal.Content>
          </Modal>
          <Sidebar
            isOpen={sidebar}
            overlay={false}
            onClose={() => setSidebar(false)}
            aria-label="Tips"
          >
            <button type="button">Next tip</button>
          </Sidebar>
        </>
      );
    };
    render(<Page />);
    const edit = screen.getByRole('button', { name: 'Edit' });
    act(() => edit.focus());
    click('Edit');
    click('Tips');
    click('Done');

    expect(edit).toHaveFocus();
    const sidebar = screen.getByRole('dialog', { name: 'Tips' });
    expect(sidebar).toHaveClass('is-active');
    expect(sidebar).not.toHaveAttribute('inert');
    const nextTip = screen.getByRole('button', { name: 'Next tip' });
    act(() => nextTip.focus());
    expect(fireEvent.keyDown(nextTip, { key: 'Tab' })).toBe(true);
    expect(nextTip).toHaveFocus();
  });

  it('keeps Tab in a Sidebar with an overlay under it', () => {
    const Page = ({ tips }: { tips: boolean }) => (
      <>
        <Sidebar isOpen onClose={() => {}} aria-label="Filters">
          <button type="button">Edit</button>
          <button type="button">Reset</button>
        </Sidebar>
        <Sidebar
          isOpen={tips}
          overlay={false}
          onClose={() => {}}
          aria-label="Tips"
        >
          <button type="button">Next tip</button>
        </Sidebar>
      </>
    );
    const { rerender } = render(<Page tips={false} />);
    rerender(<Page tips />);
    const reset = screen.getByRole('button', { name: 'Reset' });
    act(() => reset.focus());

    expect(fireEvent.keyDown(reset, { key: 'Tab' })).toBe(false);
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
  });
});

describe('Tab with a full-page Loading over a Modal', () => {
  // A full-page Loading is modal: it makes the page under it inert, Modal
  // included, so the Modal leaves Tab alone while it's up.
  it('leaves Tab alone in the Modal under it, and holds it again once it is gone', () => {
    const Page = ({ saving }: { saving: boolean }) => (
      <>
        <Modal active aria-label="Edit item">
          <Modal.Content>
            <button type="button">Save</button>
          </Modal.Content>
        </Modal>
        <Loading active={saving} isFullPage />
      </>
    );
    const { rerender } = render(<Page saving={false} />);
    rerender(<Page saving />);
    const save = screen.getByRole('button', { name: 'Save' });

    expect(fireEvent.keyDown(save, { key: 'Tab' })).toBe(true);

    rerender(<Page saving={false} />);
    expect(fireEvent.keyDown(save, { key: 'Tab' })).toBe(false);
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
    const onModalClose = vi.fn();
    const onCancel = vi.fn();
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
    const onModalClose = vi.fn();
    const onCancel = vi.fn();
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
    const onModalClose = vi.fn();
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
    const onModalClose = vi.fn();
    const onCancel = vi.fn();
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
    const onCancel = vi.fn();
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
      const onModalClose = vi.fn();
      const onToastClose = vi.fn();
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
    const onToastClose = vi.fn();
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
    const onToastClose = vi.fn();
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
