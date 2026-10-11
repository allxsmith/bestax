/**
 * `ConfigProvider`'s `portalContainer` against each component that portals.
 * Each one resolves its target through `usePortalContainer`, so content it
 * portals without a target of its own lands in the provider's container, and
 * a target it is given still wins. `Portal`'s own cases are in
 * `helpers/__tests__/portal.test.tsx`; the components' suites cover where
 * they portal without a provider.
 */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ConfigProvider } from '../helpers/Config';
import { Popover } from '../components/Popover';
import { Modal } from '../components/Modal';
import { Dialog } from '../components/Dialog';
import { Toast, ToastContainer, toast } from '../components/Toast';
import { Sidebar } from '../components/Sidebar';
import { NotificationContainer, notification } from '../elements/Notification';
import { Button } from '../elements/Button';
import { DateInput } from '../form/DateInput';
import { TimeInput } from '../form/TimeInput';
import { DateTimeInput } from '../form/DateTimeInput';
import { DateRangeInput } from '../form/DateRangeInput';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  }
});

let target: HTMLElement;
let own: HTMLElement;

beforeEach(() => {
  target = document.createElement('section');
  target.id = 'configured';
  own = document.createElement('aside');
  own.id = 'own';
  document.body.append(target, own);
});

afterEach(() => {
  target.remove();
  own.remove();
});

const withDefault = (ui: React.ReactElement) =>
  render(<ConfigProvider portalContainer={target}>{ui}</ConfigProvider>);

describe('Popover', () => {
  it('portals its appendToBody panel into the portalContainer', () => {
    withDefault(
      <Popover
        appendToBody
        defaultOpen
        ariaLabel="Portaled"
        trigger={<Button>Open</Button>}
      >
        <Popover.Body>Inside the container</Popover.Body>
      </Popover>
    );
    expect(target).toContainElement(
      screen.getByRole('dialog', { name: 'Portaled' })
    );
  });
});

describe('Modal', () => {
  it('portals into the portalContainer when portal is true', () => {
    withDefault(
      <Modal active portal modalCardTitle="Settings">
        Body
      </Modal>
    );
    expect(target).toContainElement(screen.getByRole('dialog'));
  });

  it.each([
    ['a selector', () => '#own'],
    ['an element', () => own],
  ])('lets its own portal target, as %s, win', (_, makeTarget) => {
    withDefault(
      <Modal active portal={makeTarget()} modalCardTitle="Settings">
        Body
      </Modal>
    );
    expect(own).toContainElement(screen.getByRole('dialog'));
    expect(target).toBeEmptyDOMElement();
  });

  it('still renders in place without portal', () => {
    const { container } = withDefault(
      <Modal active modalCardTitle="Settings">
        Body
      </Modal>
    );
    expect(container).toContainElement(screen.getByRole('dialog'));
    expect(target).toBeEmptyDOMElement();
  });

  it('portals into a portalContainer inside a shadow root', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    const overlays = document.createElement('div');
    shadowRoot.append(mount, overlays);
    try {
      render(
        <ConfigProvider portalContainer={overlays}>
          <Modal active portal modalCardTitle="Settings">
            Body
          </Modal>
        </ConfigProvider>,
        { container: mount, baseElement: mount }
      );
      const dialog = overlays.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getRootNode()).toBe(shadowRoot);
    } finally {
      host.remove();
    }
  });
});

describe('Dialog', () => {
  it('portals into the portalContainer when portal is true', () => {
    withDefault(<Dialog isOpen portal title="Delete?" message="Sure?" />);
    expect(target).toContainElement(screen.getByText('Sure?'));
  });

  it('lets its own portal target win', () => {
    withDefault(
      <Dialog isOpen portal="#own" title="Delete?" message="Sure?" />
    );
    expect(own).toContainElement(screen.getByText('Sure?'));
    expect(target).toBeEmptyDOMElement();
  });
});

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      toast.closeAll();
    });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('portals into the portalContainer without a container', () => {
    withDefault(<Toast message="Saved" duration={0} />);
    expect(target).toContainElement(screen.getByText('Saved'));
  });

  it.each([
    ['a selector', () => '#own'],
    ['an element', () => own],
  ])('lets its own container, as %s, win', (_, makeContainer) => {
    withDefault(
      <Toast message="Saved" duration={0} container={makeContainer()} />
    );
    expect(own).toContainElement(screen.getByText('Saved'));
    expect(target).toBeEmptyDOMElement();
  });

  it('still renders in place when inline', () => {
    const { container } = withDefault(
      <Toast message="Saved" duration={0} inline />
    );
    expect(container).toContainElement(screen.getByText('Saved'));
    expect(target).toBeEmptyDOMElement();
  });

  it("puts ToastContainer's toasts in the portalContainer", () => {
    withDefault(<ToastContainer />);
    act(() => {
      toast.success('Shown from anywhere');
    });
    expect(target).toContainElement(screen.getByText('Shown from anywhere'));
  });
});

describe('Sidebar', () => {
  it('portals into the portalContainer', () => {
    withDefault(
      <Sidebar isOpen onClose={() => {}} aria-label="Navigation">
        Links
      </Sidebar>
    );
    expect(target).toContainElement(screen.getByText('Links'));
  });

  it('still renders in place when inline', () => {
    const { container } = withDefault(
      <Sidebar inline isOpen onClose={() => {}} aria-label="Navigation">
        Links
      </Sidebar>
    );
    expect(container).toContainElement(screen.getByText('Links'));
    expect(target).toBeEmptyDOMElement();
  });
});

describe('NotificationContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      notification.closeAll();
    });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('puts its notifications and its status region in the portalContainer', () => {
    withDefault(<NotificationContainer />);
    act(() => {
      notification.show({ message: 'Uploaded', duration: 0 });
    });
    expect(target).toContainElement(screen.getByText('Uploaded'));
    expect(target).toContainElement(screen.getByRole('status'));
  });
});

describe('date and time pickers', () => {
  it.each([
    ['DateInput', <DateInput key="d" appendToBody mobileNative={false} />],
    ['TimeInput', <TimeInput key="t" appendToBody mobileNative={false} />],
    [
      'DateTimeInput',
      <DateTimeInput key="dt" appendToBody mobileNative={false} />,
    ],
  ])(
    '%s portals its appendToBody popover into the portalContainer',
    (_, picker) => {
      withDefault(picker);
      act(() => {
        screen.getByRole('combobox').focus();
      });
      expect(target).toContainElement(screen.getByRole('dialog'));
    }
  );

  it('DateRangeInput portals its appendToBody popover into the portalContainer', () => {
    withDefault(<DateRangeInput appendToBody mobileNative={false} />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Start date' }));
    expect(target).toContainElement(screen.getByRole('dialog'));
  });
});
