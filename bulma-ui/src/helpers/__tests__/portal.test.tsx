import React, { useEffect, useState } from 'react';
import {
  render,
  renderHook,
  screen,
  act,
  fireEvent,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Portal,
  PopupPortal,
  PortalScope,
  resolvePortalContainer,
  usePopupContainer,
  usePortalProp,
  type PortalPropState,
} from '../portal';
import { ConfigProvider } from '../Config';
import { Button } from '../../elements/Button';

describe('resolvePortalContainer', () => {
  it('resolves to document.body when no container is given', () => {
    expect(resolvePortalContainer()).toBe(document.body);
  });

  it('resolves an element container directly', () => {
    const el = document.createElement('div');
    expect(resolvePortalContainer(el)).toBe(el);
  });

  it('resolves a string container via querySelector', () => {
    const el = document.createElement('div');
    el.id = 'target';
    document.body.appendChild(el);
    expect(resolvePortalContainer('#target')).toBe(el);
    document.body.removeChild(el);
  });

  it('falls back to document.body when the selector matches nothing', () => {
    expect(resolvePortalContainer('#does-not-exist')).toBe(document.body);
  });

  it('treats an empty string as no container rather than querying it', () => {
    // document.querySelector('') throws a SyntaxError, so the empty string has
    // to short-circuit to document.body — Toast relied on this before the
    // resolver was extracted here.
    expect(() => resolvePortalContainer('')).not.toThrow();
    expect(resolvePortalContainer('')).toBe(document.body);
  });
});

describe('Portal', () => {
  it('renders its children at the end of document.body', () => {
    render(
      <div data-testid="host">
        <Portal>
          <p>Portaled</p>
        </Portal>
      </div>
    );
    const content = screen.getByText('Portaled');
    expect(content.parentElement).toBe(document.body);
    expect(screen.getByTestId('host')).toBeEmptyDOMElement();
  });

  it('renders into an element container', () => {
    const target = document.createElement('section');
    document.body.appendChild(target);
    try {
      render(
        <Portal container={target}>
          <p>In the section</p>
        </Portal>
      );
      expect(screen.getByText('In the section').parentElement).toBe(target);
    } finally {
      document.body.removeChild(target);
    }
  });

  it('renders into the element a selector matches', () => {
    const target = document.createElement('div');
    target.id = 'overlays';
    document.body.appendChild(target);
    try {
      render(
        <Portal container="#overlays">
          <p>In the overlay root</p>
        </Portal>
      );
      expect(screen.getByText('In the overlay root').parentElement).toBe(
        target
      );
    } finally {
      document.body.removeChild(target);
    }
  });

  it.each([
    ['a selector that matches nothing', '#nowhere'],
    ['an empty selector', ''],
  ])('falls back to document.body for %s', (_, selector) => {
    render(
      <Portal container={selector}>
        <p>Fallback</p>
      </Portal>
    );
    expect(screen.getByText('Fallback').parentElement).toBe(document.body);
  });

  it('looks a selector up again on each render, and remounts its children when the target changes', () => {
    const first = document.createElement('section');
    const second = document.createElement('section');
    first.className = 'overlay-root';
    document.body.append(first, second);
    let mounts = 0;
    const Counter: React.FC = () => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        mounts += 1;
      }, []);
      return (
        <button type="button" onClick={() => setCount(c => c + 1)}>
          Clicked {count}
        </button>
      );
    };
    // A fresh element each time, so React renders Portal again rather than
    // reusing the last result.
    const ui = () => (
      <Portal container=".overlay-root">
        <Counter />
      </Portal>
    );
    try {
      const { rerender } = render(ui());
      fireEvent.click(screen.getByRole('button'));
      expect(first).toContainElement(
        screen.getByRole('button', { name: 'Clicked 1' })
      );

      // The same props, but the selector now matches the other element.
      first.className = '';
      second.className = 'overlay-root';
      rerender(ui());

      const button = screen.getByRole('button');
      expect(second).toContainElement(button);
      expect(first).toBeEmptyDOMElement();
      // Moving remounted the child, so its state started over.
      expect(mounts).toBe(2);
      expect(button).toHaveTextContent('Clicked 0');
    } finally {
      first.remove();
      second.remove();
    }
  });

  it('renders in place when disabled', () => {
    render(
      <div data-testid="host">
        <Portal disabled>
          <p>In place</p>
        </Portal>
      </div>
    );
    expect(screen.getByText('In place').parentElement).toBe(
      screen.getByTestId('host')
    );
  });

  it('removes its content when it unmounts', () => {
    const { unmount } = render(
      <Portal>
        <p>Temporary</p>
      </Portal>
    );
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    unmount();
    expect(screen.queryByText('Temporary')).toBeNull();
  });

  it('passes context through and bubbles React events up the React tree', () => {
    const onClick = vi.fn();
    render(
      <ConfigProvider classPrefix="bestax-">
        <div onClick={onClick}>
          <Portal>
            <Button>Prefixed</Button>
          </Portal>
        </div>
      </ConfigProvider>
    );
    const button = screen.getByRole('button', { name: 'Prefixed' });
    expect(button).toHaveClass('bestax-button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('server rendering and hydration', () => {
    const App: React.FC = () => (
      <main>
        <Portal>
          <p>Portaled</p>
        </Portal>
        <Portal disabled>
          <p>In place</p>
        </Portal>
      </main>
    );

    it('renders nothing on the server, except in place when disabled', () => {
      expect(renderToString(<App />)).toBe('<main><p>In place</p></main>');
    });

    it('hydrates without a mismatch, then portals', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<App />);
      document.body.appendChild(container);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <App />);
          unmountRoot = () => root.unmount();
        });

        expect(errorSpy).not.toHaveBeenCalled();
        expect(screen.getByText('Portaled').parentElement).toBe(document.body);
        expect(screen.getByText('In place').parentElement?.tagName).toBe(
          'MAIN'
        );
      } finally {
        await act(async () => unmountRoot());
        errorSpy.mockRestore();
        document.body.removeChild(container);
      }
    });
  });
});

describe("Portal under a ConfigProvider's portalContainer", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement('section');
    target.id = 'overlay-root';
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it('renders into the portalContainer element when it has no container', () => {
    render(
      <ConfigProvider portalContainer={target}>
        <Portal>
          <p>Defaulted</p>
        </Portal>
      </ConfigProvider>
    );
    expect(screen.getByText('Defaulted').parentElement).toBe(target);
  });

  it('renders into the element a portalContainer selector matches', () => {
    render(
      <ConfigProvider portalContainer="#overlay-root">
        <Portal>
          <p>By selector</p>
        </Portal>
      </ConfigProvider>
    );
    expect(screen.getByText('By selector').parentElement).toBe(target);
  });

  it('uses the portalContainer for an empty container as well', () => {
    render(
      <ConfigProvider portalContainer={target}>
        <Portal container="">
          <p>Empty</p>
        </Portal>
      </ConfigProvider>
    );
    expect(screen.getByText('Empty').parentElement).toBe(target);
  });

  it('lets its own container element win', () => {
    const own = document.createElement('aside');
    document.body.appendChild(own);
    try {
      render(
        <ConfigProvider portalContainer={target}>
          <Portal container={own}>
            <p>Own element</p>
          </Portal>
        </ConfigProvider>
      );
      expect(screen.getByText('Own element').parentElement).toBe(own);
      expect(target).toBeEmptyDOMElement();
    } finally {
      own.remove();
    }
  });

  it('lets its own container selector win', () => {
    const own = document.createElement('aside');
    own.id = 'own-root';
    document.body.appendChild(own);
    try {
      render(
        <ConfigProvider portalContainer={target}>
          <Portal container="#own-root">
            <p>Own selector</p>
          </Portal>
        </ConfigProvider>
      );
      expect(screen.getByText('Own selector').parentElement).toBe(own);
      expect(target).toBeEmptyDOMElement();
    } finally {
      own.remove();
    }
  });

  it('goes to document.body when its own selector matches nothing', () => {
    render(
      <ConfigProvider portalContainer={target}>
        <Portal container="#nowhere">
          <p>Own miss</p>
        </Portal>
      </ConfigProvider>
    );
    expect(screen.getByText('Own miss').parentElement).toBe(document.body);
  });

  it('goes to document.body when the portalContainer selector matches nothing', () => {
    render(
      <ConfigProvider portalContainer="#nowhere">
        <Portal>
          <p>Default miss</p>
        </Portal>
      </ConfigProvider>
    );
    expect(screen.getByText('Default miss').parentElement).toBe(document.body);
  });

  it('still renders in place when disabled', () => {
    render(
      <ConfigProvider portalContainer={target}>
        <div data-testid="host">
          <Portal disabled>
            <p>In place</p>
          </Portal>
        </div>
      </ConfigProvider>
    );
    expect(screen.getByText('In place').parentElement).toBe(
      screen.getByTestId('host')
    );
    expect(target).toBeEmptyDOMElement();
  });

  describe('server rendering and hydration', () => {
    const App: React.FC = () => (
      <ConfigProvider portalContainer="#overlay-root">
        <main>
          <Portal>
            <p>Portaled</p>
          </Portal>
        </main>
      </ConfigProvider>
    );

    it('renders nothing on the server', () => {
      expect(renderToString(<App />)).toBe('<main></main>');
    });

    it('hydrates without a mismatch, then portals into the portalContainer', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<App />);
      document.body.appendChild(container);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <App />);
          unmountRoot = () => root.unmount();
        });

        expect(errorSpy).not.toHaveBeenCalled();
        expect(screen.getByText('Portaled').parentElement).toBe(target);
      } finally {
        await act(async () => unmountRoot());
        errorSpy.mockRestore();
        container.remove();
      }
    });
  });
});

describe('usePortalProp', () => {
  const target = document.createElement('aside');
  const read = (
    portal?: boolean | string | HTMLElement,
    portalContainer?: string | HTMLElement
  ) =>
    renderHook(() => usePortalProp(portal), {
      wrapper: ({ children }) => (
        <ConfigProvider portalContainer={portalContainer}>
          {children}
        </ConfigProvider>
      ),
    }).result.current;

  it.each([
    ['omitted', undefined],
    ['false', false],
    ['an empty selector', ''],
  ])('renders in place when portal is %s', (_, portal) => {
    expect(read(portal, target)).toEqual({
      isPortaled: false,
      container: portal === '' ? '' : undefined,
      defaultTarget: undefined,
    });
  });

  it('leaves true to the provider, and names its container as the target', () => {
    expect(read(true, target)).toEqual({
      isPortaled: true,
      container: undefined,
      defaultTarget: target,
    });
    expect(read(true)).toEqual({
      isPortaled: true,
      container: undefined,
      defaultTarget: undefined,
    });
  });

  it.each([
    ['a selector', '#own'],
    ['an element', document.createElement('div')],
  ])(
    'passes %s through as the container, with no provider target',
    (_, own) => {
      expect(read(own, target)).toEqual({
        isPortaled: true,
        container: own,
        defaultTarget: undefined,
      });
    }
  );

  it('is in place on the server and while hydrating, and portaled after', async () => {
    const seen: PortalPropState[] = [];
    function Probe() {
      const state = usePortalProp(true);
      seen.push(state);
      return <span>{String(state.isPortaled)}</span>;
    }
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe />);
    expect(container.textContent).toBe('false');
    document.body.appendChild(container);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    await act(async () => {
      const root = hydrateRoot(container, <Probe />);
      unmountRoot = () => root.unmount();
    });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(seen.map(state => state.isPortaled)).toEqual([false, false, true]);
    expect(container.textContent).toBe('true');

    await act(async () => unmountRoot());
    errorSpy.mockRestore();
    container.remove();
  });
});

describe('PopupPortal inside a PortalScope', () => {
  // An overlay as Modal is one: its element, held in state from its ref,
  // is the scope of what it holds.
  function Overlay({
    children,
    testId = 'overlay',
  }: {
    children?: React.ReactNode;
    testId?: string;
  }) {
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    return (
      <div data-testid={testId} ref={setNode}>
        <PortalScope node={node}>{children}</PortalScope>
      </div>
    );
  }

  it('goes to document.body outside any scope', () => {
    render(
      <PopupPortal>
        <span data-testid="popup" />
      </PopupPortal>
    );
    expect(screen.getByTestId('popup').parentElement).toBe(document.body);
  });

  it("goes into the scope's element", () => {
    render(
      <Overlay>
        <PopupPortal>
          <span data-testid="popup" />
        </PopupPortal>
      </Overlay>
    );
    expect(screen.getByTestId('popup').parentElement).toBe(
      screen.getByTestId('overlay')
    );
  });

  it('goes into the nearest scope', () => {
    render(
      <Overlay testId="outer">
        <Overlay testId="inner">
          <PopupPortal>
            <span data-testid="popup" />
          </PopupPortal>
        </Overlay>
      </Overlay>
    );
    expect(screen.getByTestId('popup').parentElement).toBe(
      screen.getByTestId('inner')
    );
  });

  it('keeps the scope around it for a scope with no node', () => {
    render(
      <Overlay>
        <PortalScope node={undefined}>
          <PopupPortal>
            <span data-testid="popup" />
          </PopupPortal>
        </PortalScope>
      </Overlay>
    );
    expect(screen.getByTestId('popup').parentElement).toBe(
      screen.getByTestId('overlay')
    );
  });

  it.each([['outside'], ['inside']])(
    "lets a ConfigProvider's portalContainer win, set %s the scope",
    where => {
      const target = document.createElement('section');
      document.body.appendChild(target);
      const popup = (
        <PopupPortal>
          <span data-testid="popup" />
        </PopupPortal>
      );
      render(
        where === 'outside' ? (
          <ConfigProvider portalContainer={target}>
            <Overlay>{popup}</Overlay>
          </ConfigProvider>
        ) : (
          <Overlay>
            <ConfigProvider portalContainer={target}>{popup}</ConfigProvider>
          </Overlay>
        )
      );
      expect(screen.getByTestId('popup').parentElement).toBe(target);
      target.remove();
    }
  );

  it('still renders in place when disabled, scope or not', () => {
    render(
      <PortalScope node={null}>
        <div data-testid="place">
          <PopupPortal disabled>
            <span data-testid="popup" />
          </PopupPortal>
        </div>
      </PortalScope>
    );
    expect(screen.getByTestId('popup').parentElement).toBe(
      screen.getByTestId('place')
    );
  });
});

describe('usePopupContainer', () => {
  const node = document.createElement('div');
  type Wrapper = React.FC<{ children: React.ReactNode }> | undefined;

  it.each<[string, Wrapper, unknown]>([
    ['undefined outside any scope', undefined, undefined],
    [
      "the scope's element",
      ({ children }) => <PortalScope node={node}>{children}</PortalScope>,
      node,
    ],
    [
      "undefined while the scope's element hasn't mounted",
      ({ children }) => <PortalScope node={null}>{children}</PortalScope>,
      undefined,
    ],
    [
      "the provider's portalContainer over the scope",
      ({ children }) => (
        <ConfigProvider portalContainer="#overlays">
          <PortalScope node={null}>{children}</PortalScope>
        </ConfigProvider>
      ),
      '#overlays',
    ],
  ])('is %s', (_, wrapper, expected) => {
    const { result } = renderHook(() => usePopupContainer(), { wrapper });
    expect(result.current).toBe(expected);
  });
});
