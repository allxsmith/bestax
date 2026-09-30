import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { ClientOnly } from '../ClientOnly';
import { useIsHydrated } from '../useIsHydrated';

describe('ClientOnly', () => {
  it('renders its children straight away when nothing hydrates', () => {
    render(
      <ClientOnly fallback={<p>Loading</p>}>
        <p>Client content</p>
      </ClientOnly>
    );
    expect(screen.getByText('Client content')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).toBeNull();
  });

  it('calls a function child and renders what it returns', () => {
    render(<ClientOnly>{() => <p>{window.location.protocol}</p>}</ClientOnly>);
    expect(screen.getByText('http:')).toBeInTheDocument();
  });

  it('renders nothing on the server without a fallback', () => {
    expect(renderToString(<ClientOnly>Client content</ClientOnly>)).toBe('');
  });

  it('renders the fallback on the server, never calling a function child', () => {
    const child = jest.fn(() => <p>Client content</p>);
    expect(
      renderToString(<ClientOnly fallback={<p>Loading</p>}>{child}</ClientOnly>)
    ).toBe('<p>Loading</p>');
    expect(child).not.toHaveBeenCalled();
  });

  it('hydrates the fallback without a mismatch, then swaps in the children', async () => {
    // Content that differs between server and client: exactly what would
    // trip hydration recovery if it rendered on the hydrating pass.
    const App: React.FC<{ where: string }> = ({ where }) => (
      <main>
        <ClientOnly fallback={<p>Loading</p>}>
          {() => <p>Rendered on the {where}</p>}
        </ClientOnly>
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(<App where="server" />);
    document.body.appendChild(container);
    expect(container.innerHTML).toBe('<main><p>Loading</p></main>');

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <App where="client" />);
        unmountRoot = () => root.unmount();
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe(
        '<main><p>Rendered on the client</p></main>'
      );
    } finally {
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });
});

describe('useIsHydrated', () => {
  const Probe: React.FC<{ seen: boolean[] }> = ({ seen }) => {
    seen.push(useIsHydrated());
    return null;
  };

  it('is true from the first render when nothing hydrates', () => {
    const seen: boolean[] = [];
    render(<Probe seen={seen} />);
    expect(seen).toEqual([true]);
  });

  it('is false on the server', () => {
    const seen: boolean[] = [];
    renderToString(<Probe seen={seen} />);
    expect(seen).toEqual([false]);
  });

  it('is false while hydrating, then true', async () => {
    const seen: boolean[] = [];
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe seen={[]} />);
    let unmountRoot = () => {};
    await act(async () => {
      const root = hydrateRoot(container, <Probe seen={seen} />);
      unmountRoot = () => root.unmount();
    });
    expect(seen).toEqual([false, true]);
    await act(async () => unmountRoot());
  });
});
