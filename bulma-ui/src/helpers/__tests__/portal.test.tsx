import React, { useEffect, useState } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Portal, resolvePortalContainer } from '../portal';
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
    const onClick = jest.fn();
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

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
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
